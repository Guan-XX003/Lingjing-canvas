const assert = require("node:assert/strict");
const { createAccountDevHandler, DEV_CODE, DEV_INVITE } = require("./account-dev-server.cjs");

async function run() {
  const request = createAccountDevHandler();
  const post = (pathname, body, token = "") => request({
    method: "POST",
    pathname,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  });
  const code = await post("/auth/send-code", { identifier: "tester@example.com" });
    assert.equal(code.status, 200);

    const login = await post("/auth/login", { identifier: "tester@example.com", code: DEV_CODE });
    assert.equal(login.status, 200);
    assert.ok(login.body.accessToken);
    assert.ok(login.body.refreshToken);

    const me = await request({ method: "GET", pathname: "/me", headers: { authorization: `Bearer ${login.body.accessToken}` } });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "tester@example.com");

    const denied = await post("/workspace/session", { inviteCode: "wrong" }, login.body.accessToken);
    assert.equal(denied.status, 403);

    const workspace = await post("/workspace/session", { inviteCode: DEV_INVITE }, login.body.accessToken);
    assert.equal(workspace.status, 200);
    assert.equal(workspace.body.organization.id, "org_wanjuan_demo");
    assert.ok(workspace.body.workspaceToken);

    console.log("account contract: login, refresh identity and enterprise gateway guards passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
