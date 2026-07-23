# 万卷灵境账号与企业私密空间契约

## 目标

账号体系负责识别用户、会员和设备；企业私密空间负责限制公司模型、额度和数据只能在授权局域网内使用。两者相互关联，但不能合并成同一份邀请码或同一份全局 API 配置。

## 客户端状态

客户端支持三种互斥的个人身份状态：

- `first-run`：首次启动，显示登录欢迎层。
- `local`：不登录，本地画布、资源和自有 API 正常使用。
- `authenticated`：已登录，可读取会员、钱包和企业成员身份。

企业空间是附加状态：

- `disconnected`：未连接企业网关。
- `connected`：账号身份通过且企业网关签发了短期会话。
- `offline`：离开局域网或网关不可达；企业模型禁止调用，不能自动回退到个人 API。

## 安全边界

1. Access Token 只保存在 Electron 主进程内存。
2. Refresh Token 和企业 Workspace Token 使用 `safeStorage` 加密后写入 `account-session.json`。
3. renderer 只能读取用户、会员、企业名称和连接状态，不能读取 Token。
4. Token 不进入项目、资源、任务、备份、日志、通知或统一 API 配置。
5. 企业 API Key 只保存在企业网关的环境变量或密钥管理器，永不返回 App。
6. 企业节点以后只保存 `organizationId + managedConfigId`，不得保存企业 URL 或 Key。

## 云端账号 API

生产环境通过 `WANJUAN_ACCOUNT_API_URL` 配置，必须使用 HTTPS。

源码联调时可以启动本地模拟服务：

```bash
# 终端一
npm run account:dev

# 终端二
WANJUAN_ACCOUNT_API_URL=http://127.0.0.1:39991 npm start
```

开发验证码为 `123456`，开发企业邀请码为 `WANJUAN-TEAM`。这些值只属于本地模拟服务，不是生产凭据。

### `POST /auth/send-code`

请求：

```json
{
  "identifier": "user@example.com",
  "purpose": "login"
}
```

### `POST /auth/login` / `POST /auth/register`

```json
{
  "identifier": "user@example.com",
  "code": "123456",
  "inviteCode": "optional",
  "deviceName": "万卷灵境桌面端"
}
```

响应：

```json
{
  "accessToken": "short-lived-access-token",
  "refreshToken": "rotating-refresh-token",
  "user": { "id": "usr_1", "name": "用户", "email": "user@example.com" },
  "subscription": { "plan": "pro", "status": "active", "expiresAt": "2026-12-31T23:59:59Z" },
  "entitlements": ["cloud_backup", "multi_device_sync", "enterprise_workspace"],
  "wallet": { "balance": 12500, "currency": "credits" },
  "device": { "id": "dev_1", "name": "MacBook Pro", "platform": "darwin" }
}
```

### `POST /auth/refresh`

刷新令牌按设备签发并轮换。服务端只保存令牌哈希；旧令牌使用后立即作废。

### `GET /me`

返回启动所需的用户、会员、权益、钱包和当前设备信息。客户端显示会员状态，但受保护 API 必须在服务端再次验证权益。

### `POST /auth/logout`

撤销当前设备会话，不删除用户的本地项目。

## 企业局域网网关

企业网关可以使用 HTTPS，也可以在受控私有网段使用 HTTP：`10.*`、`172.16-31.*`、`192.168.*`、localhost 或 `.local` 主机名。

### `POST /workspace/session`

Header：

```text
Authorization: Bearer <WanJuan account access token>
```

请求：

```json
{
  "inviteCode": "首次绑定邀请码",
  "deviceId": "dev_1"
}
```

网关应执行：

1. 验证万卷灵境账号 Token 的签名、有效期和签发方。
2. 检查该 `userId` 是否属于企业组织。
3. 检查客户端来源是否位于允许的局域网、VPN 或设备范围。
4. 首次绑定时核对邀请码；完成绑定后邀请码不再作为登录凭证。
5. 签发 8 至 24 小时的 Workspace Token。

响应：

```json
{
  "workspaceToken": "short-lived-workspace-token",
  "organization": {
    "id": "org_1",
    "name": "示例企业",
    "role": "member"
  },
  "expiresIn": 28800
}
```

## 企业模型请求

后续企业模型路由应使用单独接口：

```text
POST /workspace/generation
GET  /workspace/tasks/:id
GET  /workspace/configs
GET  /workspace/usage
```

`/workspace/configs` 只返回可展示的模型名、协议能力和参数范围，不返回 API Key。企业生成请求必须经过网关代理，禁止客户端直连上游。

## 数据库建议

云端账号服务：

- `users`
- `user_identities`
- `verification_codes`
- `sessions`
- `devices`
- `invite_codes`
- `plans`
- `subscriptions`
- `entitlements`
- `wallets`
- `wallet_ledger`
- `organizations`
- `organization_members`
- `audit_logs`

企业网关本地数据：

- 成员许可缓存
- 企业模型配置引用
- 企业额度和用量
- 企业任务记录
- 管理员审计记录

企业 Key 应存放在服务器环境变量、操作系统密钥库或专门的 Secret Manager 中。

## 当前第一阶段范围

当前 App 源码已经提供：

- 首次账号欢迎层与本地模式入口。
- 设置中的“我的账号”和“企业与组织”。
- 主进程 Token 加密存储与 renderer 隔离。
- 云端账号 API 和企业网关 IPC 客户端。
- 本地模拟账号服务及契约测试。

尚未启用：

- 真实验证码发送、用户数据库和公网部署。
- 支付、订单、自动续费和极鑫真实计费。
- 企业模型配置下发和生成请求代理。
- 云项目同步和团队数据权限。

在企业模型代理完成前，企业连接状态不得改变现有节点的 API 配置或生成行为。
