const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-account-test-"));
const secondRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanjuan-account-device-test-"));
const fakeElectron = {
  app: { getPath: () => tempRoot, getVersion: () => "1.3.9-test" },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (value) => Buffer.from(`encrypted:${value}`, "utf8"),
    decryptString: (buffer) => buffer.toString("utf8").replace(/^encrypted:/, ""),
  },
};

const originalLoad = Module._load;
const originalFetch = global.fetch;
const originalAccountUrl = process.env.WANJUAN_ACCOUNT_API_URL;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron" || request === "electron/main") return fakeElectron;
  return originalLoad.call(this, request, parent, isMain);
};
process.env.WANJUAN_ACCOUNT_API_URL = "https://api.example.com";

const calls = [];
let refreshCount = 0;
let refreshMode = "success";
let ownedOrganization = null;
let activeGatewayId = "";

const accountPayload = {
  user: { id: "usr_test", name: "测试用户", email: "tester@example.com" },
  subscription: { plan: "pro", status: "active", expiresAt: null },
  entitlements: ["enterprise_workspace"],
  wallet: null,
  device: { id: "dev_test", name: "测试设备", platform: process.platform },
};

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? "application/json" : "" },
    json: async () => payload,
  };
}

global.fetch = async (url, options = {}) => {
  const pathname = new URL(url).pathname;
  const body = options.body ? JSON.parse(options.body) : null;
  calls.push({
    pathname,
    method: String(options.method || "GET"),
    body,
    authorization: options.headers?.authorization || "",
    idempotencyKey: options.headers?.["idempotency-key"] || "",
  });

  if (pathname === "/auth/send-code") return jsonResponse(200, { ok: true, expiresIn: 300 });
  if (pathname === "/auth/login") {
    return jsonResponse(200, {
      accessToken: "expired-access",
      refreshToken: "refresh-one",
      ...accountPayload,
    });
  }
  if (pathname === "/auth/refresh") {
    refreshCount += 1;
    if (refreshMode === "offline") throw new TypeError("fetch failed");
    if (refreshMode === "revoked") {
      return jsonResponse(401, { error: "当前设备已被撤销", code: "DEVICE_REVOKED" });
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    return jsonResponse(200, {
      accessToken: "fresh-access",
      refreshToken: "refresh-two",
      ...accountPayload,
    });
  }
  if (pathname === "/me") {
    if (options.headers?.authorization === "Bearer expired-access") {
      return jsonResponse(401, { error: "登录状态已过期", code: "ACCESS_TOKEN_EXPIRED" });
    }
    return jsonResponse(200, accountPayload);
  }
  if (pathname === "/me/organizations") {
    return jsonResponse(200, {
      items: ownedOrganization ? [{
        ...ownedOrganization,
        gateway_id: activeGatewayId || null,
        gateway_name: activeGatewayId ? "测试企业网关" : null,
        gateway_status: activeGatewayId ? "active" : null,
      }] : [],
    });
  }
  if (pathname === "/organizations/self-hosted") {
    ownedOrganization = {
      id: "org_self",
      name: body.name,
      role: "owner",
      status: "gateway_pending",
      organization_type: "self_hosted",
      membership_status: "active",
    };
    return jsonResponse(200, {
      organization: { id: "org_self", name: body.name, role: "owner", status: "gateway_pending" },
      gatewayRegistration: { token: "registration-token", expiresIn: 900 },
    });
  }
  if (pathname === "/organizations/org_self/gateways/activate") {
    activeGatewayId = body.registrationToken === "takeover-registration-token" ? "gw_replacement" : "gw_self";
    ownedOrganization.status = "active";
    return jsonResponse(200, { gatewayId: activeGatewayId, organizationId: "org_self", status: "active" });
  }
  if (pathname === "/organizations/org_self/gateways/gw_self/revoke" && options.method === "POST") {
    activeGatewayId = "";
    ownedOrganization.status = "gateway_pending";
    return jsonResponse(200, { ok: true, organizationId: "org_self", revokedGatewayId: "gw_self", status: "gateway_pending" });
  }
  if (pathname === "/organizations/org_self/gateways/takeover" && options.method === "POST") {
    return jsonResponse(200, {
      organization: { id: "org_self", name: ownedOrganization.name, role: "owner", status: "gateway_pending" },
      gatewayRegistration: { token: "takeover-registration-token", expiresIn: 900 },
      replacedGateway: null,
    });
  }
  if (pathname === "/organizations/org_self/invites") {
    return jsonResponse(200, { inviteCode: "WANJUAN-ENTERPRISE-TEST" });
  }
  if (pathname === "/organizations/org_self/members" && String(options.method || "GET") === "GET") {
    return jsonResponse(200, { items: [{ user_id: "usr_test", role: "owner", status: "active", email: "tester@example.com" }], requesterRole: "owner", policyVersion: 2 });
  }
  if (pathname === "/organizations/org_self/members/member_test" && options.method === "PATCH") return jsonResponse(200, { ok: true, policyVersion: 3 });
  if (pathname === "/organizations/org_self/members/member_test" && options.method === "DELETE") return jsonResponse(200, { ok: true, policyVersion: 4 });
  if (pathname === "/organizations/org_self/quota-defaults" && options.method === "PUT") return jsonResponse(200, { ok: true, policyVersion: 5 });
  if (pathname === "/organizations/org_self/quota-overrides" && options.method === "PUT") return jsonResponse(200, { ok: true, policyVersion: 6 });
  if (pathname === "/auth/logout") return jsonResponse(200, { ok: true });
  return jsonResponse(404, { error: "Not found", code: "NOT_FOUND" });
};

async function run() {
  const staleGatewayRoot = path.join(tempRoot, "enterprise-gateway");
  fs.mkdirSync(staleGatewayRoot, { recursive: true });
  fs.writeFileSync(path.join(staleGatewayRoot, "gateway.json"), JSON.stringify({
    version: 1,
    localGatewayId: "local_stale",
    organizationId: "org_previous_account",
    gatewayId: "gw_previous_account",
    status: "stopped",
  }));
  fs.writeFileSync(path.join(staleGatewayRoot, "stale-secret-marker"), "must be removed");
  const service = require("../electron/main/account-service.cjs");
  const deviceModule = require("../electron/main/account-device.cjs");

  assert.equal(service.normalizeBaseUrl("https://api.example.com/"), "https://api.example.com");
  assert.equal(service.normalizeBaseUrl("http://127.0.0.1:39991/"), "http://127.0.0.1:39991");
  assert.throws(() => service.normalizeBaseUrl("http://api.example.com"), /HTTPS/);
  assert.equal(
    service.normalizeBaseUrl("http://192.168.1.9:39218/", { allowPrivateHttp: true }),
    "http://192.168.1.9:39218"
  );
  assert.throws(
    () => service.normalizeBaseUrl("http://203.0.113.20", { allowPrivateHttp: true }),
    /局域网私有地址/
  );
  assert.equal(service.normalizeAccountEmail(" Tester@Example.com "), "tester@example.com");
  assert.throws(() => service.normalizeAccountEmail("13800138000"), /邮箱/);

  delete process.env.WANJUAN_ACCOUNT_API_URL;
  assert.equal(service.accountApiUrl(), service.WANJUAN_ACCOUNT_DEFAULT_API_URL);
  process.env.WANJUAN_ACCOUNT_API_URL = "https://api.example.com";

  const firstDevice = deviceModule.readOrCreateAccountDevice(tempRoot, { platform: "darwin", hostname: "Test Mac" });
  const persistedDevice = deviceModule.readOrCreateAccountDevice(tempRoot, { platform: "darwin", hostname: "Test Mac" });
  const otherDevice = deviceModule.readOrCreateAccountDevice(secondRoot, { platform: "win32", hostname: "Test PC" });
  assert.equal(firstDevice.installationId, persistedDevice.installationId);
  assert.notEqual(firstDevice.installationId, otherDevice.installationId);
  assert.equal(firstDevice.platform, "darwin");
  assert.equal(otherDevice.platform, "win32");
  assert.equal(fs.statSync(path.join(tempRoot, "account-device.json")).mode & 0o777, 0o600);

  const local = service.continueWithLocalMode();
  assert.equal(local.ok, true);
  assert.equal(local.localMode, true);
  assert.equal(local.onboardingComplete, true);
  assert.equal(Object.prototype.hasOwnProperty.call(local, "accessToken"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(local, "refreshToken"), false);

  await service.sendAccountCode({ identifier: "Tester@Example.com", purpose: "login" });
  const loggedIn = await service.loginAccount({ identifier: "Tester@Example.com", code: "123456" });
  assert.equal(loggedIn.authenticated, true);
  const loginCall = calls.find((call) => call.pathname === "/auth/login");
  assert.equal(loginCall.body.identifier, "tester@example.com");
  assert.equal(loginCall.body.deviceFingerprint, firstDevice.installationId);
  assert.equal(loginCall.body.platform, process.platform);
  assert.ok(loginCall.body.deviceName);

  const persisted = JSON.parse(fs.readFileSync(path.join(tempRoot, "account-session.json"), "utf8"));
  assert.equal(JSON.stringify(persisted).includes("accessToken"), false);
  assert.equal(JSON.stringify(persisted).includes(firstDevice.installationId), false);

  refreshCount = 0;
  const refreshedStates = await Promise.all(Array.from({ length: 5 }, () => service.getCurrentAccount()));
  assert.equal(refreshCount, 1);
  assert.equal(refreshedStates.every((state) => state.authenticated && !state.offline), true);

  const enterpriseSnapshot = {
    schemaVersion: 1,
    backupSchemaVersion: 4,
    version: 1,
    createdAt: Date.now(),
    sourceAppVersion: "1.3.9-test",
    hash: "sha256:account-enterprise-test",
    modules: {
      settings: {
        chromeStorage: {
          apiConfigs: [{ id: "api_test", url: "https://api.example.com", key: { $secretRef: "secret_api_test" } }],
        },
        selectedSections: ["api", "models", "cloud"],
      },
    },
  };
  const createdEnterprise = await service.createEnterpriseGateway({
    operationId: "operation-account-test",
    organizationName: "测试企业",
    gatewayName: "测试企业网关",
    timezone: "Asia/Shanghai",
    autoStart: true,
    snapshot: enterpriseSnapshot,
    secrets: [{ id: "secret_api_test", type: "api_key", path: "apiConfigs.0.key", value: "sk-account-enterprise-secret" }],
    defaultQuotas: [{ capability: "image_generation", enabled: true, limit: 50, unit: "成功输出张数" }],
  });
  assert.equal(createdEnterprise.enterprise.mode, "host");
  assert.equal(createdEnterprise.enterprise.gatewayId, "gw_self");
  assert.equal(createdEnterprise.gatewayHost.running, true);
  assert.equal(fs.existsSync(path.join(staleGatewayRoot, "stale-secret-marker")), false);
  assert.equal(createdEnterprise.creationResult.inviteCode, "WANJUAN-ENTERPRISE-TEST");
  const createOrganizationCall = calls.find((call) => call.pathname === "/organizations/self-hosted");
  assert.equal(createOrganizationCall.idempotencyKey, "operation-account-test");
  assert.deepEqual(createOrganizationCall.body.defaultQuotas, [{
    capabilityKey: "image_generation",
    enabled: true,
    limitValue: 50,
    unit: "successful_outputs",
  }]);
  const activationCall = calls.find((call) => call.pathname === "/organizations/org_self/gateways/activate");
  assert.equal(Buffer.from(activationCall.body.publicKey, "base64").length, 32);
  assert.ok(activationCall.body.certificateFingerprint.startsWith("sha256/"));
  const firstCertificateFingerprint = activationCall.body.certificateFingerprint;
  const management = await service.getEnterpriseManagement();
  assert.equal(management.requesterRole, "owner");
  assert.equal(management.members[0].user_id, "usr_test");
  await service.updateEnterpriseMember({ userId: "member_test", status: "disabled" });
  await service.updateEnterpriseQuotaDefault({ capabilityKey: "video_generation", enabled: true, limitValue: 12, unit: "successful_tasks" });
  await service.updateEnterpriseMemberQuota({ userId: "member_test", capabilityKey: "video_generation", mode: "limit", limitValue: 4 });
  await service.removeEnterpriseMember({ userId: "member_test" });
  assert.equal(calls.some((call) => call.pathname === "/organizations/org_self/quota-defaults" && call.body.limitValue === 12), true);
  assert.equal(calls.some((call) => call.pathname === "/organizations/org_self/quota-overrides" && call.body.userId === "member_test"), true);

  const releasedEnterprise = await service.releaseCreatedEnterpriseGateway({
    organizationId: "org_self",
    gatewayId: "gw_self",
  });
  assert.equal(releasedEnterprise.enterprise, null);
  assert.equal(releasedEnterprise.gatewayHost.initialized, false);
  assert.equal(fs.existsSync(path.join(tempRoot, "enterprise-gateway")), false);
  assert.equal(calls.some((call) => call.pathname === "/organizations/org_self/gateways/gw_self/revoke"), true);

  const accountWithOwnedEnterprise = await service.getCurrentAccount();
  assert.equal(accountWithOwnedEnterprise.ownedEnterprise.id, "org_self");
  assert.equal(accountWithOwnedEnterprise.ownedEnterprise.gatewayId, "");

  const createCallCountBeforeTakeover = calls.filter((call) => call.pathname === "/organizations/self-hosted").length;
  const takenOverEnterprise = await service.takeOverEnterpriseGateway({
    operationId: "operation-account-takeover-test",
    organizationId: "org_self",
    gatewayName: "新电脑企业网关",
    autoStart: true,
    snapshot: { ...enterpriseSnapshot, version: 2, hash: "sha256:account-enterprise-takeover-test" },
    secrets: [{ id: "secret_api_test", type: "api_key", path: "apiConfigs.0.key", value: "sk-account-enterprise-secret" }],
  });
  assert.equal(takenOverEnterprise.enterprise.mode, "host");
  assert.equal(takenOverEnterprise.enterprise.gatewayId, "gw_replacement");
  assert.equal(takenOverEnterprise.gatewayHost.running, true);
  assert.equal(takenOverEnterprise.creationResult.replaced, true);
  assert.equal(calls.filter((call) => call.pathname === "/organizations/self-hosted").length, createCallCountBeforeTakeover);
  const takeoverCall = calls.find((call) => call.pathname === "/organizations/org_self/gateways/takeover");
  assert.equal(takeoverCall.idempotencyKey, "operation-account-takeover-test");
  assert.equal(takeoverCall.body.deviceId, "dev_test");
  const replacementActivationCall = calls.filter((call) => call.pathname === "/organizations/org_self/gateways/activate").at(-1);
  assert.equal(replacementActivationCall.body.registrationToken, "takeover-registration-token");
  assert.notEqual(replacementActivationCall.body.certificateFingerprint, firstCertificateFingerprint);

  await service.logoutAccount();
  const logoutCall = calls.filter((call) => call.pathname === "/auth/logout").at(-1);
  assert.equal(logoutCall.body.refreshToken, "refresh-two");
  assert.equal(service.sanitizeAccountState().authenticated, false);

  await service.loginAccount({ identifier: "tester@example.com", code: "123456" });
  refreshMode = "revoked";
  const revoked = await service.bootstrapAccount();
  assert.equal(revoked.authenticated, false);
  assert.equal(revoked.requiresLogin, true);
  assert.equal(revoked.errorCode, "DEVICE_REVOKED");
  assert.equal(service.readAccountState().session, null);

  refreshMode = "success";
  await service.loginAccount({ identifier: "tester@example.com", code: "123456" });
  refreshMode = "offline";
  const offline = await service.bootstrapAccount();
  assert.equal(offline.authenticated, true);
  assert.equal(offline.offline, true);
  assert.equal(offline.errorCode, "ACCOUNT_NETWORK_ERROR");
  assert.ok(service.readAccountState().session?.refreshTokenEncrypted);

  const bridgeSource = fs.readFileSync(path.join(__dirname, "../electron/preload/bridge-api.cjs"), "utf8");
  assert.equal(bridgeSource.includes("accountGetAccessToken"), false);
  assert.equal(bridgeSource.includes("accountGetRefreshToken"), false);
  assert.equal(bridgeSource.includes("accountTakeoverEnterpriseGateway"), true);
  assert.equal(bridgeSource.includes("accountReleaseEnterpriseGateway"), true);
  const ipcSource = fs.readFileSync(path.join(__dirname, "../electron/main/ipc.cjs"), "utf8");
  assert.equal(ipcSource.includes("wanjuan:account-takeover-enterprise-gateway"), true);
  assert.equal(ipcSource.includes("wanjuan:account-release-enterprise-gateway"), true);

  console.log("account main boundary: auth, enterprise release/takeover lifecycle and IPC guards passed");
}

run().finally(() => {
  Module._load = originalLoad;
  global.fetch = originalFetch;
  if (originalAccountUrl === undefined) delete process.env.WANJUAN_ACCOUNT_API_URL;
  else process.env.WANJUAN_ACCOUNT_API_URL = originalAccountUrl;
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.rmSync(secondRoot, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
