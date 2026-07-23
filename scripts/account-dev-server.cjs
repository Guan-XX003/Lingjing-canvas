const http = require("node:http");
const crypto = require("node:crypto");

const DEFAULT_PORT = 39991;
const DEV_CODE = "123456";
const DEV_INVITE = "WANJUAN-TEAM";

function json(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": body.length,
    "cache-control": "no-store",
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function bearer(headers = {}) {
  const value = String(headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function createAccountDevHandler() {
  const accessTokens = new Map();
  const refreshTokens = new Map();

  const issueSession = (identifier) => {
    const user = {
      id: `usr_${crypto.createHash("sha1").update(identifier).digest("hex").slice(0, 10)}`,
      name: identifier.split("@")[0] || "测试用户",
      email: identifier.includes("@") ? identifier : "",
      phone: identifier.includes("@") ? "" : identifier,
    };
    const accessToken = `dev_access_${crypto.randomUUID()}`;
    const refreshToken = `dev_refresh_${crypto.randomUUID()}`;
    accessTokens.set(accessToken, user);
    refreshTokens.set(refreshToken, user);
    return {
      accessToken,
      refreshToken,
      user,
      subscription: { plan: "pro", status: "active", expiresAt: "2026-12-31T23:59:59Z" },
      entitlements: ["cloud_backup", "multi_device_sync", "enterprise_workspace"],
      wallet: { balance: 12500, currency: "credits" },
      device: { id: "dev_local_account_test", name: "源码测试设备", platform: process.platform },
    };
  };

  return async ({ method = "GET", pathname = "/", headers = {}, body = {} } = {}) => {
    if (method === "GET" && pathname === "/health") return { status: 200, body: { ok: true } };

    if (method === "POST" && pathname === "/auth/send-code") {
      if (!String(body.identifier || "").trim()) return { status: 400, body: { error: "请输入邮箱或手机号" } };
      return { status: 200, body: { ok: true, expiresIn: 300 } };
    }

    if (method === "POST" && ["/auth/login", "/auth/register"].includes(pathname)) {
      if (String(body.code || "") !== DEV_CODE) return { status: 401, body: { error: "验证码错误，开发验证码为 123456" } };
      if (pathname === "/auth/register" && String(body.inviteCode || "") !== DEV_INVITE) {
        return { status: 403, body: { error: "邀请码无效，开发邀请码为 WANJUAN-TEAM" } };
      }
      return { status: 200, body: issueSession(String(body.identifier || "test@wanjuan.local")) };
    }

    if (method === "POST" && pathname === "/auth/refresh") {
      const user = refreshTokens.get(String(body.refreshToken || ""));
      if (!user) return { status: 401, body: { error: "刷新令牌已失效" } };
      return { status: 200, body: issueSession(user.email || user.phone || user.id) };
    }

    if (method === "POST" && pathname === "/auth/logout") return { status: 200, body: { ok: true } };

    if (method === "GET" && pathname === "/me") {
      const user = accessTokens.get(bearer(headers));
      if (!user) return { status: 401, body: { error: "未登录" } };
      return {
        status: 200,
        body: {
          user,
          subscription: { plan: "pro", status: "active", expiresAt: "2026-12-31T23:59:59Z" },
          entitlements: ["cloud_backup", "multi_device_sync", "enterprise_workspace"],
          wallet: { balance: 12500, currency: "credits" },
          device: { id: "dev_local_account_test", name: "源码测试设备", platform: process.platform },
        },
      };
    }

    if (method === "POST" && pathname === "/workspace/session") {
      const user = accessTokens.get(bearer(headers));
      if (!user) return { status: 401, body: { error: "账号身份无效" } };
      if (String(body.inviteCode || "") !== DEV_INVITE) return { status: 403, body: { error: "企业邀请码无效" } };
      return {
        status: 200,
        body: {
          workspaceToken: `dev_workspace_${crypto.randomUUID()}`,
          organization: { id: "org_wanjuan_demo", name: "万卷测试企业", role: "管理员" },
          expiresIn: 28800,
        },
      };
    }

    return { status: 404, body: { error: "Not found" } };
  };
}

function createAccountDevServer() {
  const handle = createAccountDevHandler();
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const body = req.method === "GET" ? {} : await readBody(req);
      const result = await handle({ method: req.method, pathname: url.pathname, headers: req.headers, body });
      return json(res, result.status, result.body);
    } catch (error) {
      return json(res, 500, { error: error?.message || String(error) });
    }
  });

  return server;
}

if (require.main === module) {
  const port = Number(process.env.WANJUAN_ACCOUNT_DEV_PORT || DEFAULT_PORT);
  const server = createAccountDevServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`WanJuan account dev server ready at http://127.0.0.1:${port}`);
    console.log(`Login code: ${DEV_CODE}; enterprise invite: ${DEV_INVITE}`);
  });
}

module.exports = { createAccountDevHandler, createAccountDevServer, DEFAULT_PORT, DEV_CODE, DEV_INVITE };
