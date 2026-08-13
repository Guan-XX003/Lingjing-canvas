# 即梦天玑 Seedance 2.0 App 协议契约

本文对应官方 Apifox 文档 `https://s.apifox.cn/5ddd1f51-746b-4495-bc93-b9697beb10f2/llms.txt`，核对日期为 2026-08-11。

## 地址与鉴权

- App 默认请求地址始终为极鑫中转站 `https://jixing.guancn.uk`。新安装、未配置状态和极鑫配置同步都使用该地址。
- App 仅请求用户配置的极鑫地址下 `/api/...` 接口；上游地址、上游密钥和内部 channel/provider 路由均由极鑫服务器管理，不进入 App 配置、请求体或界面。
- 若本机留有旧版本写入的已知上游地址，App 会自动回落到 `https://jixing.guancn.uk`；其他合法企业中转配置保持可用。
- 其他企业或手工中转地址仍可在设置中配置；设置中的接口地址始终是 App 实际请求地址，不会被内部上游地址覆盖。
- 极鑫天玑请求使用 `Authorization: Bearer <用户 token>`；用户可填写带或不带 `Bearer`，App 会规范化且不会重复。`X-API-Key` 同时发送原始 token 以兼容官网 v2/中转路由。另带 `Xx-Sass-Id: 1`、`Xx-Platform: web`。
- 四个视频生成接口按官网契约使用 `application/x-www-form-urlencoded`；任务查询、人像、素材和面板接口继续按各自现有契约使用 JSON。编码由调用点显式选择，不做全局猜测。

## 生成与轮询

| 模式 | Endpoint | 模式专用字段 |
| --- | --- | --- |
| 文生视频 | `POST /api/cut/model/coze-seedance-text-special` | 无 |
| 首帧生视频 | `POST /api/cut/model/coze-seedance-image-first-special` | `first_frame` |
| 首尾帧生视频 | `POST /api/cut/model/coze-seedance-image-first-last-special` | `first_frame`、`last_frame` |
| 参考素材生视频 | `POST /api/cut/model/coze-seedance-video-special` | 表单重复字段 `images[]`、`videos[]`、`audios[]` |
| 任务查询 | `POST /api/cut/model/coze-run-seedance-special-history` | JSON: `task_id`、`execute_id`（同一任务 ID） |

生成通用字段为 `duration`、`ratio`、`prompt`、`watermark`、`model_name`、`resolution`、`generate_audio`。文档明确的模型为 `doubao-seedance-2-0-260128` 和 `doubao-seedance-2-0-fast-260128`。

参考素材限制：图片最多 9 张、单张小于 30MB；视频最多 3 个，单个 2–15 秒且小于 50MB，总时长不超过 15 秒；音频最多 3 个，单个 2–15 秒且小于 15MB，总时长不超过 15 秒；请求体小于 64MB。App 对数量以及能够从本地元数据读取到的大小/时长进行提交前校验，不再静默截断。

Active 天玑人像必须同时具备可信的天玑素材库来源、`ready` 绑定状态和明确的最终素材 ID。生成时在 `images[]` 中发送 `asset://<最终素材 ID>`，让上游按已审核素材身份解析；素材列表中的 HTTP(S) URL仅用于预览和绑定匹配，不能替代审核身份。缺少来源、状态或 ID 时在客户端阻止提交并提示刷新人像库；普通图片仍走既有公网 URL/上传逻辑，不能通过添加人像标记绕过审核门禁。方舟官方兼容模式的可信素材处理使用独立模块，不受天玑协议调整影响。

CLI/MCP 自动化仅通过专用 `portraitAssetIds` 输入构造上述可信节点，且只允许 `reference-media`。主进程会再次校验最终 ID 格式与图片总数；普通 `images` 中的 `asset://` 会被拒绝，避免调用方伪造审核状态。

## 人像与素材

| 能力 | Endpoint | 字段 |
| --- | --- | --- |
| 创建真人库 | `POST /api/cut/model/real_authentication` | `callback_url` |
| 查询真人库创建结果 | `POST /api/cut/model/get-visual-date-result` | `bytedToken` |
| 创建虚拟库 | `POST /api/cut/model/virtal_authentication` | 无 |
| 查询人像创建任务 | `POST /api/cut/model/get-task-info` | `task_id`、`execute_id` |
| 同步人像组/素材 ID | `POST /api/cut/model/sync-get-asset-id` | `task_id`、`execute_id` |
| 上传真人素材 | `POST /api/cut/model/upload-Portrait` | `image_url`、`name`、`portrait_group_id`、`type` |
| 上传虚拟素材 | `POST /api/cut/model/upload-VirtralPortrait` | `image_url`、`name`、`virtual_group_id`、`type` |
| 素材列表 | `POST /api/cut/model/get-list-assets` | `group_ids`、`group_type`、`statuses`、`name`、`PageNumber`、`PageSize`、`SortBy`、`SortOrder` |
| 素材详情/删除 | `POST /api/cut/model/get-portrait-info` / `delete-portrait` | `portrait_asset_id` |
| 删除素材组 | `POST /api/cut/model/delete-group` | `group_id`、`group_type` |

真人认证回调使用 GET 参数 `resultCode` 和 `BytedToken`；`resultCode=10000` 表示认证通过，再用 `bytedToken` 查询创建结果。当前桌面 App 继续支持已有组 ID 的查询、上传、详情和删除；需要公网回调页的真人库首次创建流程尚未内置，必须由官网/服务端提供回调能力后再接 UI。

面板交互：创建虚拟组会自动补充 `name=万卷灵境-时间`（用户可修改），创建/查询返回的 `task_id`、`bytedToken`、`group_id` 会保存到本地配置；“查询/同步组 ID”在缺少两类凭据时禁用并提示先创建/粘贴回调值；刷新素材在当前类型没有组 ID 时禁用，避免发送无效的空 `group_ids`。

## 积分

- 余额：`POST /api/cut/model/fetch-points-balance`。官网旧响应出现过 `{ code, msg: { points } }`，production 代理归一为 `{ code, data: { points } }`；App 同时兼容两者。HTTP 401/403 或业务 401/403 显示鉴权失败；成功但没有 points 时显示空数据。
- 明细：`GET /api/tasks/points-logs`，query 为 `page`、`pageSize`、`start_date`、`end_date`。

## 响应兼容与安全边界

官方文档除积分余额外，提交、轮询、素材和人像接口的响应 schema 均为空对象，没有公布 execute ID、状态枚举、结果 URL、错误码或退款字段的精确路径。因此 App 保留既有的大小写不敏感、嵌套兼容解析器，并仅扩充已经出现过的通用字段；不会凭空定义服务端字段。

脱敏 fixture 位于 `scripts/fixtures/tianji/`，覆盖提交成功、轮询成功和失败退款三类既有兼容形态。测试不会读取正式 Token、正式用户数据，也不会发起网络或付费生成。

服务端与 App 必须保持一致的最小契约：

1. 提交响应必须能提供唯一 execute ID，并明确实际字段路径。
2. 查询响应必须提供稳定状态枚举，以及成功视频 URL；缩略图 URL 可选。
3. 失败时必须提供可展示的错误消息；发生积分退款时应提供明确退款标记或退款原因。
4. 业务成功码为 `200`；其他 code 或非 2xx HTTP 状态视为失败。
5. 中转层不得把 Token 写入日志、任务记录、错误消息或客户端可分享的请求摘要。

服务端提供真实脱敏样例后，应把样例加入 fixture，再收窄解析规则。
