# StarCanvas企业网关跨设备接管：服务器实施文档

## 1. 目标

App 已补齐以下客户端能力：

- 登录后通过 `GET /me/organizations` 识别当前账号拥有的自托管企业。
- 当前电脑未绑定、但账号已有自托管企业时，显示“接管企业网关”，不再重复创建企业。
- 创建者可以在 App 内移除当前主网关；企业、成员、邀请码、配额和审计记录继续保留。
- 新电脑使用自己的设备身份、Ed25519 公钥、TLS 证书指纹和当前本机配置重新激活主网关。

服务器需要新增两个创建者接口，并补强网关撤销状态机。建议账号服务版本升级为 `1.4.0`。

## 2. 保持不变的现有接口

以下接口继续沿用：

```text
GET  /me/organizations
POST /organizations/{organizationId}/gateways/activate
POST /organizations/{organizationId}/invites
```

`GET /me/organizations` 必须继续返回：

```json
{
  "items": [
    {
      "id": "organization-uuid",
      "name": "企业名称",
      "status": "active",
      "organization_type": "self_hosted",
      "timezone": "Asia/Shanghai",
      "policy_version": 12,
      "role": "owner",
      "membership_status": "active",
      "gateway_id": "gateway-uuid",
      "gateway_name": "旧电脑网关",
      "gateway_status": "active",
      "last_seen_at": "2026-07-23T02:00:00Z",
      "config_version": 4,
      "config_hash": "sha256:...",
      "certificate_fingerprint": "sha256/..."
    }
  ]
}
```

企业没有活动网关时，`gateway_*` 字段允许为 `null`。

## 3. 新增接口：创建者撤销当前主网关

```text
POST /organizations/{organizationId}/gateways/{gatewayId}/revoke
Authorization: Bearer <account-access-token>
Content-Type: application/json
```

请求：

```json
{
  "deviceId": "current-account-device-uuid",
  "reason": "owner_release"
}
```

成功响应：

```json
{
  "ok": true,
  "organizationId": "organization-uuid",
  "revokedGatewayId": "gateway-uuid",
  "status": "gateway_pending",
  "policyVersion": 13
}
```

### 权限与校验

- 只允许企业 `owner` 调用，`admin` 和 `member` 不允许。
- 企业必须是 `organization_type=self_hosted`。
- Access Token 的 `did` 必须与请求 `deviceId` 一致。
- `gatewayId` 必须属于该企业，且调用者必须是企业 owner。
- 已撤销的同一网关重复请求应幂等返回成功，不返回 404。

### 数据库事务

在一个事务内完成：

1. `SELECT ... FOR UPDATE` 锁定企业和目标网关。
2. 将目标网关状态改为 `revoked`，写入 `revoked_at`、`revoked_by`、`revoke_reason`。
3. 将企业改为 `gateway_pending`，并设置 `gateway_id=NULL`。
4. 使该企业所有未使用的 Gateway Registration Token 失效。
5. 撤销该网关签发的 Workspace Session。
6. 增加 `policy_version`。
7. 写入 `gateway.revoked` 控制事件和安全审计。

不要删除企业、成员、邀请码、配额、历史用量、任务审计或管理审计。

## 4. 新增接口：跨设备接管主网关

```text
POST /organizations/{organizationId}/gateways/takeover
Authorization: Bearer <account-access-token>
Idempotency-Key: <uuid>
Content-Type: application/json
```

请求：

```json
{
  "deviceId": "new-device-uuid",
  "gatewayName": "新电脑企业网关",
  "operationId": "与 Idempotency-Key 相同的 uuid"
}
```

成功响应：

```json
{
  "organization": {
    "id": "organization-uuid",
    "name": "企业名称",
    "role": "owner",
    "status": "gateway_pending"
  },
  "gatewayRegistration": {
    "token": "一次性 registration token",
    "expiresIn": 900
  },
  "replacedGateway": {
    "id": "old-gateway-uuid",
    "name": "旧电脑网关",
    "status": "revoked"
  },
  "policyVersion": 14
}
```

如果企业原本没有活动网关，`replacedGateway` 返回 `null`。

### 权限与校验

- 只允许企业 owner。
- 企业必须是自托管企业，owner 成员状态必须为 `active`。
- Access Token 的 `did` 必须等于 `deviceId`。
- 当前设备必须存在、属于当前用户且未撤销。
- 必须拥有 `enterprise_gateway_create` 或后续独立的 `enterprise_gateway_takeover` entitlement。
- `Idempotency-Key` 和 `operationId` 必须是相同 UUID。

### 原子状态转换

在一个数据库事务内：

1. 锁定企业及当前 `active/offline` 主网关。
2. 如存在旧主网关，将其标记为 `revoked`，原因写为 `owner_takeover`。
3. 撤销旧网关全部 Workspace Session，并使旧网关签发的授权立即失效。
4. 使该企业所有未消费 Registration Token 失效。
5. 企业状态改为 `gateway_pending`，`gateway_id=NULL`。
6. 为新设备创建有效期 15 分钟的一次性 Registration Token。
7. 增加 `policy_version`。
8. 写入 `gateway.takeover.prepared`、必要的 `gateway.revoked` 控制事件和审计记录。

之后 App 会调用现有接口：

```text
POST /organizations/{organizationId}/gateways/activate
```

激活成功后，企业恢复为 `active`，新的 `gateway_id` 成为唯一主网关。

### 幂等处理

- 相同账号、企业、设备和 `Idempotency-Key` 的重复请求不能重复产生撤销事件或重复增加策略版本。
- 如果上一次请求尚未激活，可以使旧的未消费 Registration Token 失效并重新签发一个新 Token。
- 如果相同操作已经在该设备成功激活，返回 `alreadyActive: true` 和当前网关摘要，不要再次撤销它。
- 相同 Idempotency-Key 携带不同企业、设备或网关名称时返回：

```json
{
  "code": "IDEMPOTENCY_CONFLICT",
  "error": "相同 Idempotency-Key 对应了不同请求"
}
```

## 5. 旧网关失效行为

旧网关在下一次心跳、控制快照或用量上报时，应返回 HTTP `410`：

```json
{
  "code": "GATEWAY_REVOKED",
  "error": "该企业网关已被撤销"
}
```

以下签名接口都必须统一执行网关状态检查：

```text
POST /gateways/{gatewayId}/heartbeat
GET  /gateways/{gatewayId}/control-snapshot
POST /gateways/{gatewayId}/usage-summary
```

不能只验证签名正确就继续接受已撤销网关的请求。

短期 Gateway Grant 必须同时校验当前企业 `gateway_id` 和 `policy_version`。旧网关 ID 或旧策略版本的 Grant 不得创建新的 Workspace Session。

## 6. 并发与安全要求

- 一个企业同一时刻只能有一个 `active/offline` 主网关，继续保留数据库唯一约束或事务锁。
- `takeover` 与 `activate` 必须防止两台电脑同时成功。
- Registration Token 只存哈希，明文只在响应中出现一次；日志和审计不得记录明文。
- 不上传或保存 App 的 API Key、Token、AK/SK、配置正文或媒体内容。
- 审计只记录企业 ID、旧/新设备 ID、旧网关 ID、操作人、时间和结果。
- 撤销旧网关后，旧网关未完成任务不得被迁移到新网关重复执行。

## 7. 错误码

```text
AUTH_REQUIRED                         401
ORGANIZATION_NOT_FOUND               404
ORGANIZATION_OWNER_REQUIRED          403
NOT_SELF_HOSTED_ORGANIZATION         409
GATEWAY_DEVICE_MISMATCH              403
GATEWAY_NOT_FOUND                    404
GATEWAY_REVOKED                      410
GATEWAY_TAKEOVER_IN_PROGRESS         409
GATEWAY_ALREADY_ACTIVE_ON_DEVICE     409 或 200 + alreadyActive
IDEMPOTENCY_KEY_REQUIRED             400
IDEMPOTENCY_CONFLICT                 409
INVALID_GATEWAY_REGISTRATION         401
```

错误响应必须保持现有格式：

```json
{
  "code": "GATEWAY_DEVICE_MISMATCH",
  "error": "只能使用当前登录设备接管企业网关"
}
```

## 8. 管理后台

后台现有“撤销网关”继续保留，但需要在网关列表中显示：

- `revoked_at`
- `revoked_by`
- `revoke_reason`
- 被哪个新网关接替（如有）

企业处于 `gateway_pending` 时显示“等待创建者重新登记网关”，不要显示为企业已删除。

## 9. 自动化测试

服务器至少增加以下测试：

1. owner 可以撤销自己的主网关。
2. admin/member 不能撤销或接管主网关。
3. 撤销后企业、成员、邀请码和配额仍存在。
4. 新设备接管后旧网关变为 `revoked`，新 Registration Token 绑定新设备。
5. 旧网关心跳返回 `410 GATEWAY_REVOKED`。
6. 旧 Workspace Session 和旧 Gateway Grant 无法继续使用。
7. 两台设备并发接管时最多一个流程可以激活成功。
8. 相同 Idempotency-Key 重试不会重复撤销或重复增加策略版本。
9. 接管后使用现有 `/gateways/activate` 能正常激活新网关。
10. `/me/organizations` 返回新的主网关摘要。

## 10. App 联调顺序

1. 先部署 staging API `1.4.0`。
2. 使用账号 A 在电脑 1 创建企业网关。
3. 在电脑 2 登录账号 A，确认 `/me/organizations` 返回 owner 企业。
4. 电脑 2 点击“接管企业网关”。
5. 确认电脑 1 的心跳变为 `GATEWAY_REVOKED`。
6. 确认电脑 2 激活成功并可以代理真实模型请求。
7. 确认原成员重新连接新地址后，配置、配额和成员身份保持不变。
8. 在电脑 2 点击“移除本机网关”，确认企业变为 `gateway_pending` 且本机企业密钥库被删除。
