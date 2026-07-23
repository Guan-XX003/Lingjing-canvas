// 企业网关本机配额：提交时预占，成功结算，失败/取消释放；按企业时区和任务 ID 幂等。
const fs = require("node:fs");
const path = require("node:path");

const { app } = require("./electron-refs.cjs");

function quotaStorePath() {
  return path.join(app.getPath("userData"), "enterprise-gateway", "usage.json");
}

function dayKey(timezone = "Asia/Shanghai", timestamp = Date.now()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}

function readQuotaStore() {
  try {
    const value = JSON.parse(fs.readFileSync(quotaStorePath(), "utf8"));
    return { version: 1, days: value?.days && typeof value.days === "object" ? value.days : {} };
  } catch {
    return { version: 1, days: {} };
  }
}

function writeQuotaStore(store) {
  const target = quotaStorePath();
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const keys = Object.keys(store.days || {}).sort().slice(-35);
  const days = Object.fromEntries(keys.map((key) => [key, store.days[key]]));
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify({ version: 1, days }, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, target);
}

function activeOverride(overrides, userId, capability, now = Date.now()) {
  return (Array.isArray(overrides) ? overrides : []).find((item) => {
    if (String(item.user_id || item.userId || "") !== String(userId || "")) return false;
    if (String(item.capability_key || item.capabilityKey || "") !== String(capability || "")) return false;
    const startsAt = Date.parse(item.starts_at || item.startsAt || "") || 0;
    const expiresAt = Date.parse(item.expires_at || item.expiresAt || "") || 0;
    return (!startsAt || startsAt <= now) && (!expiresAt || expiresAt > now);
  }) || null;
}

function quotaPolicy(control, userId, capability) {
  const defaults = Array.isArray(control?.quotaDefaults) ? control.quotaDefaults : [];
  const defaultPolicy = defaults.find((item) => String(item.capability_key || item.capabilityKey || "") === String(capability || "")) || null;
  const override = activeOverride(control?.memberQuotaOverrides, userId, capability);
  const mode = String(override?.mode || "inherit").toLowerCase();
  if (mode === "deny") return { allowed: false, limit: 0, unit: defaultPolicy?.unit || "successful_tasks" };
  if (mode === "allow") return { allowed: true, limit: null, unit: defaultPolicy?.unit || "successful_tasks" };
  if (mode === "limit") return { allowed: true, limit: override?.limit_value ?? override?.limitValue ?? null, unit: defaultPolicy?.unit || "successful_tasks" };
  if (defaultPolicy && defaultPolicy.enabled === false) return { allowed: false, limit: 0, unit: defaultPolicy.unit || "successful_tasks" };
  return {
    allowed: true,
    limit: defaultPolicy?.limit_value ?? defaultPolicy?.limitValue ?? null,
    unit: defaultPolicy?.unit || "successful_tasks",
  };
}

function usageBucket(store, timezone, userId, capability) {
  const key = dayKey(timezone);
  store.days[key] ||= {};
  const bucketKey = `${userId}::${capability}`;
  store.days[key][bucketKey] ||= { successful: 0, reserved: 0, reservations: {} };
  return { key, bucket: store.days[key][bucketKey] };
}

function reserveEnterpriseQuota(task, control = {}) {
  const policy = quotaPolicy(control, task.userId, task.capability);
  if (!policy.allowed) {
    const error = new Error("当前企业配额策略已暂停该能力");
    error.code = "QUOTA_EXCEEDED";
    throw error;
  }
  const store = readQuotaStore();
  const timezone = String(control.timezone || "Asia/Shanghai");
  const { bucket } = usageBucket(store, timezone, task.userId, task.capability);
  if (bucket.reservations[task.id]) return policy;
  if (policy.limit != null && Number(bucket.successful || 0) + Number(bucket.reserved || 0) >= Number(policy.limit)) {
    const error = new Error("今日企业任务额度已用完");
    error.code = "QUOTA_EXCEEDED";
    throw error;
  }
  bucket.reservations[task.id] = { status: "reserved", createdAt: Date.now() };
  bucket.reserved = Number(bucket.reserved || 0) + 1;
  writeQuotaStore(store);
  return policy;
}

function settleEnterpriseQuota(task, control = {}) {
  if (!task?.id || !task?.userId || !task?.capability) return;
  const store = readQuotaStore();
  const timezone = String(control.timezone || "Asia/Shanghai");
  const { bucket } = usageBucket(store, timezone, task.userId, task.capability);
  const reservation = bucket.reservations[task.id];
  if (!reservation || reservation.status !== "reserved") return;
  if (task.status === "completed") {
    reservation.status = "successful";
    reservation.settledAt = Date.now();
    bucket.reserved = Math.max(0, Number(bucket.reserved || 0) - 1);
    bucket.successful = Number(bucket.successful || 0) + 1;
  } else if (["failed", "cancelled"].includes(task.status)) {
    reservation.status = "released";
    reservation.settledAt = Date.now();
    bucket.reserved = Math.max(0, Number(bucket.reserved || 0) - 1);
  } else {
    return;
  }
  writeQuotaStore(store);
}

function enterpriseUsageForSession(session, control = {}) {
  const store = readQuotaStore();
  const timezone = String(control.timezone || "Asia/Shanghai");
  const defaults = Array.isArray(control.quotaDefaults) ? control.quotaDefaults : [];
  const overrideCapabilities = (Array.isArray(control.memberQuotaOverrides) ? control.memberQuotaOverrides : [])
    .filter((item) => String(item.user_id || item.userId || "") === String(session.userId || ""))
    .map((item) => String(item.capability_key || item.capabilityKey || ""));
  const capabilities = new Set([
    ...defaults.map((item) => String(item.capability_key || item.capabilityKey || "")),
    ...overrideCapabilities,
  ].filter(Boolean));
  const values = [...capabilities].map((capability) => {
    const policy = quotaPolicy(control, session.userId, capability);
    const { bucket } = usageBucket(store, timezone, session.userId, capability);
    const successful = Number(bucket.successful || 0);
    const reserved = Number(bucket.reserved || 0);
    return {
      capability,
      successful,
      reserved,
      limit: policy.limit,
      remaining: policy.limit == null ? null : Math.max(0, Number(policy.limit) - successful - reserved),
      allowed: policy.allowed,
      unit: policy.unit,
    };
  });
  return { capabilities: values, timezone, day: dayKey(timezone) };
}

function enterpriseUsageSummary(control = {}) {
  const store = readQuotaStore();
  const timezone = String(control.timezone || "Asia/Shanghai");
  const day = dayKey(timezone);
  const successfulByCapability = {};
  for (const [bucketKey, bucket] of Object.entries(store.days?.[day] || {})) {
    const capability = String(bucketKey).split("::").slice(1).join("::");
    if (!capability) continue;
    successfulByCapability[capability] = Number(successfulByCapability[capability] || 0) + Number(bucket?.successful || 0);
  }
  return { day, successfulByCapability };
}

module.exports = {
  enterpriseUsageForSession,
  enterpriseUsageSummary,
  quotaPolicy,
  reserveEnterpriseQuota,
  settleEnterpriseQuota,
};
