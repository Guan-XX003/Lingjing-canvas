# 万卷灵境 App 邮箱账号生产化改造清单

## 0. 给 App 开发会话的执行说明

请在万卷灵境 Claude 主线源码中直接实现本文档，不要修改正式版 App 和正式用户数据。开发和测试使用独立 `WANJUAN_TEST_USER_DATA_PATH`。

目标是让账号功能以“邮箱验证码”方式投入生产，并与 `https://account.guancn.uk` 对接。不得影响本地模式、画布项目、自有 API、模型配置、资源、智能体和工作空间。

完成后必须执行类型检查、账号专项测试、Web 构建和真实 staging 联调，并用源码 App 验证登录、重启恢复、设备撤销和退出。

## 1. 本轮范围

本轮实现：

- 只支持邮箱验证码注册和登录。
- App 内置生产账号接口地址。
- 每次安装生成稳定、匿名的设备 ID。
- 正确上报 macOS、Windows 平台和设备名称。
- Access Token 过期后自动刷新并重试。
- 退出登录时即使 Access Token 已过期，也能撤销服务器会话。
- 区分网络离线与账号失效。
- staging 与 production 可切换联调。

本轮不实现：

- 手机号和短信验证码。
- 在线支付。
- 极鑫余额。
- 云项目同步。
- 企业模型代理。

## 2. 邮箱登录 UI

修改账号欢迎页和登录弹窗：

- “邮箱或手机号”改为“邮箱”。
- “使用邮箱或手机号验证码登录”改为“使用邮箱验证码登录”。
- 输入框使用 `type="email"`。
- `inputMode` 使用 `email`。
- `autoComplete` 使用 `email` 或 `username`。
- Placeholder 保持 `name@example.com`。
- 前端提交前执行基础邮箱格式校验。
- 验证码仍为 6 位数字，客户端最多允许输入 8 位以兼容未来调整也可以，但服务端当前使用 6 位。
- 注册仍需要内测邀请码。

主要文件：

- `src/renderer/components/account-gate.tsx`
- `src/renderer/lib/account.ts`
- `src/renderer/styles/account.css`

账号数据类型中的 `phone` 可以暂时保留用于未来兼容，但当前 UI 不展示、不输入、不发送手机号。

## 3. 生产账号地址

当前 App 只读取 `WANJUAN_ACCOUNT_API_URL`，正式发行包无法依赖用户配置环境变量。

新增常量：

```text
WANJUAN_ACCOUNT_DEFAULT_API_URL=https://account.guancn.uk
```

地址优先级：

1. `WANJUAN_ACCOUNT_API_URL`，仅用于源码、自动化和 staging 覆盖。
2. 内置 `https://account.guancn.uk`。

要求：

- 生产地址必须为 HTTPS。
- localhost 测试仍允许 HTTP。
- staging 通过环境变量指定 `https://account-staging.guancn.uk`。
- 不在设置页提供普通用户可修改的账号服务器地址。

主要文件：

- `electron/main/account-service.cjs`
- 账号专项测试文件。

## 4. 稳定设备身份

### 4.1 问题

当前 App 登录只发送固定名称“万卷灵境桌面端”，没有发送 `deviceFingerprint` 和 `platform`。真实 staging 联调中服务器记录的平台为 `unknown`，不同电脑可能被合并成同一台设备。

### 4.2 实现方式

在 Electron 主进程创建安装级设备身份模块。首次运行生成随机 UUID，并保存在：

```text
<userData>/account-device.json
```

示例：

```json
{
  "version": 1,
  "installationId": "随机 UUID",
  "createdAt": 0
}
```

要求：

- 使用加密安全随机 UUID。
- 原子写入，权限 `0600`。
- 不读取硬盘序列号、MAC 地址、主板 ID 或其他硬件指纹。
- 不进入项目、导出包、日志或 renderer。
- 卸载后重新安装可以被视为新设备。

登录和注册请求必须发送：

```json
{
  "deviceFingerprint": "installationId",
  "platform": "darwin",
  "deviceName": "用户电脑名称"
}
```

平台只允许：

- `darwin`
- `win32`
- `linux`，仅开发兼容

设备名称优先使用操作系统主机名，无法读取时使用：

```text
Mac 上的万卷灵境
Windows 上的万卷灵境
```

主要文件：

- 新增 `electron/main/account-device.cjs`
- `electron/main/account-service.cjs`
- `scripts/test-account-main.cjs`

## 5. Token 生命周期与自动刷新

### 5.1 问题

服务器 Access Token 有效期为 15 分钟。当前 App 只在启动时刷新，长时间运行后企业绑定和未来云端功能会使用过期 Token。

### 5.2 统一鉴权请求

在主进程账号模块内建立唯一的鉴权请求入口，不允许其他调用方直接读取或拼接 Access Token。

建议接口：

```js
requestWithAccountAuth(baseUrl, pathname, options)
```

行为：

1. 使用当前 Access Token 请求。
2. 如果服务器返回 `401 ACCESS_TOKEN_EXPIRED`，进入刷新流程。
3. 同一时间只允许一个 Refresh 请求，其余请求等待同一个 Promise。
4. 刷新成功后，用新 Access Token 重试原请求一次。
5. 最多重试一次，防止循环。
6. `ACCOUNT_DISABLED`、`DEVICE_REVOKED`、`SESSION_REVOKED`、`REFRESH_TOKEN_REPLAY` 不进入无限重试。

修改 `requestJson`，错误对象必须保留：

- HTTP status。
- 服务端 `code`。
- 用户可读 `error`。

不要再把所有错误压缩成只有一段字符串。

### 5.3 主动刷新

自动刷新重试是保底机制。还可以解析 Access Token 的 `exp` 仅用于安排刷新时间，在过期前 60 秒刷新。

注意：解析 JWT 不代表验证 JWT。真正权限仍由服务器判断。

### 5.4 需要接入统一鉴权入口的操作

- `/me`
- 企业网关绑定前的账号 Token 获取。
- 未来云备份、设备同步和会员权益请求。

## 6. 可靠退出登录

退出时从安全存储解密当前 Refresh Token，并发送：

```json
{
  "refreshToken": "当前 Refresh Token"
}
```

到：

```text
POST /auth/logout
```

同时可携带仍有效的 Access Token。服务端应根据任一有效凭据找到并撤销会话。

执行顺序：

1. 尝试通知服务器撤销。
2. 无论网络是否成功，都清除本机 Access Token、Refresh Token、用户、会员和企业会话。
3. 不删除项目、资源、模型配置和自有 API。

网络失败时本机仍退出；服务器会话在 Refresh Token 到期或管理员撤销前可能仍存在，因此日志中可以记录非敏感警告，但不能记录 Token。

## 7. 区分离线与账号失效

当前启动失败后会统一进入离线宽限，但以下错误不是网络离线：

- `ACCOUNT_DISABLED`
- `DEVICE_REVOKED`
- `SESSION_REVOKED`
- `INVALID_REFRESH_TOKEN`
- `REFRESH_TOKEN_EXPIRED`
- `REFRESH_TOKEN_REPLAY`

遇到这些错误时：

- 清除本地会话密钥。
- 保留本地项目。
- `authenticated=false`。
- 显示需要重新登录的提示。

只有以下情况可以进入 72 小时离线宽限：

- DNS 失败。
- 网络断开。
- 请求超时。
- 服务器临时 `5xx`。

离线宽限只能维持本地 UI 状态，不得授权服务器端功能、企业模型或未来云同步。

## 8. 账号状态与设置页

账号页继续显示：

- 用户名和邮箱。
- 当前会员方案。
- 会员状态。
- 安全存储状态。
- 云端身份校验状态。
- 企业绑定状态。

不显示：

- 极鑫模型余额。
- 手机号字段。
- Refresh Token、Access Token、设备指纹。

可以在“设备与安全”增加非敏感设备摘要：

```text
当前设备：MacBook-Pro · macOS
```

但不直接显示 installationId。

## 9. IPC 与安全约束

- Access Token 只在 Electron 主进程内存。
- Refresh Token 继续使用 `safeStorage` 加密。
- installationId 只在主进程读取。
- renderer 只能获得清洗后的账号状态。
- Token、installationId 不进入项目、任务、通知、日志、备份和统一 API 配置。
- 不允许 renderer 自由请求账号服务并附带 Token。

## 10. 兼容性要求

- 未登录用户继续完整使用本地模式。
- 登录和退出不得迁移或重建现有项目目录。
- 会员到期不得删除本地数据。
- 账号服务器暂时不可达时，画布仍能启动。
- 本轮不改变任何生成节点、模型 API 或极鑫配置。
- 正式版发布前使用新版本测试用户数据，不直接测试正式用户资料。

## 11. 自动化测试

新增或扩展以下测试：

### 11.1 设备身份

- 首次运行生成 installationId。
- 重启后 installationId 不变。
- 不同 userData 目录生成不同 ID。
- 登录请求包含 fingerprint、platform 和 deviceName。
- installationId 不出现在 renderer 状态和项目导出中。

### 11.2 Token

- Access Token 过期时只触发一次 Refresh。
- 五个并发请求只产生一个 Refresh 请求。
- 刷新成功后原请求只重试一次。
- Refresh Token 失效后清除登录态。
- 网络超时进入离线宽限，不清除本地项目。
- 账号禁用不进入离线宽限。

### 11.3 退出

- Access Token 有效时退出能撤销会话。
- Access Token 过期但 Refresh Token 有效时仍能撤销。
- 断网退出仍清除本地登录态。
- 退出不删除项目、API 配置和资源。

### 11.4 邮箱 UI

- 非邮箱格式不能发送验证码。
- 登录和注册文案不再出现手机号。
- staging 邮箱验证码登录成功。

## 12. 验证命令

```bash
npm run typecheck
npm run test:account
npm run test:account:main
npm run test:lib
npm run build:web
```

真实 staging 联调：

```bash
WANJUAN_ACCOUNT_API_URL=https://account-staging.guancn.uk \
WANJUAN_TEST_USER_DATA_PATH=/tmp/wanjuan-account-staging \
WANJUAN_ALLOW_RANDOM_PORT=1 \
WANJUAN_DISABLE_UPDATE_CHECK=1 \
npm start
```

## 13. 验收标准

1. App 只接受邮箱验证码登录和注册。
2. 正式包无需环境变量即可连接 `account.guancn.uk`。
3. Mac 和 Windows 被服务器识别为不同设备。
4. 同一安装重启后仍是同一设备。
5. App 运行超过 15 分钟后账号请求仍正常。
6. Access Token 过期后退出仍能撤销服务器会话。
7. 后台撤销设备后 App 要求重新登录。
8. 网络断开不会删除登录资料或本地项目。
9. 重启 App 可以通过 Refresh Token 恢复会话。
10. 所有测试通过，且正式用户数据未被读取或修改。
