# 个人与企业云端提示词库

## 当前范围

云端提示词库是登录后的工作空间能力。App 将单条提示词模板作为同步和冲突处理单元，将个人或企业提示词库作为权限边界。

MVP 支持：

- 个人空间与所属企业空间切换。
- 搜索、类型和标签筛选。
- 新建、编辑、归档、收藏和复制。归档使用 PATCH `status=archived`，DELETE 产生 tombstone。
- 从选中的文本、生图、视频或音频节点提取提示词。
- 从云模板创建对应的安全画布节点。
- IndexedDB 缓存、离线写入队列和增量同步游标。
- `revision`、`If-Match` 与 `409` 冲突处理。

MVP 不同步项目快照、生成结果、图片、视频、音频、缩略图、参考素材、人像资产或实时协作状态。

## 进程与安全边界

- Renderer/工作空间 UI 只能提交严格白名单 DTO。
- Electron preload 使用三个独立 IndexedDB object store：
  - `cloudPromptTemplates`
  - `cloudPromptSyncQueue`
  - `cloudPromptSyncCursor`
- 缓存键按 `accountId + workspaceId` 隔离。换账号或登出会清理云提示词缓存；服务端不再返回的工作空间会清除待提交队列。
- Electron 主进程负责调用账号服务，Bearer Token 继续由 `account-service.cjs` 添加，renderer 和 preload 都拿不到 Token。
- POST 请求必须携带 `Idempotency-Key`；PATCH/DELETE 携带 `revision` 和 `If-Match`。
- 409 不会静默覆盖，用户可以保留服务器版本，或把本地版本另存为个人副本。

允许上传的模板字段只有：

```text
title
content
description
type
tags
modelHint
providerHint
generationMode
parameters.aspectRatio
parameters.resolution
parameters.durationSeconds
parameters.imageSize
parameters.generateAudio
parameters.watermark
```

禁止上传：

- API Key、Token、Authorization、Header、`apiConfigs`。
- 自定义服务凭据与上游鉴权配置。
- 正式素材、人像或可信素材 ID、参考资源。
- 本地路径、`file:`、`blob:`、`data:` URL。
- 结果 URL、缩略图、任务 ID、项目 ID、节点 ID。

## API 契约

```http
GET    /prompt-workspaces
POST   /prompt-workspaces
PATCH  /prompt-workspaces/{id}

GET    /prompt-workspaces/{id}/templates
POST   /prompt-workspaces/{id}/templates
GET    /prompt-workspaces/{id}/templates/{templateId}
PATCH  /prompt-workspaces/{id}/templates/{templateId}
DELETE /prompt-workspaces/{id}/templates/{templateId}

POST   /prompt-workspaces/{id}/templates/{templateId}/copy
POST   /prompt-workspaces/{id}/templates/{templateId}/favorite
DELETE /prompt-workspaces/{id}/templates/{templateId}/favorite
GET    /prompt-workspaces/{id}/changes
```

客户端兼容列表响应的 `items` 或 `workspaces/templates` 字段，模板详情兼容 `item` 或 `template`。服务端应返回标准化 `revision`，并在冲突响应中返回服务器最新版：

```json
{
  "code": "PROMPT_TEMPLATE_CONFLICT",
  "message": "提示词模板已被其他成员更新",
  "item": {
    "id": "tpl_xxx",
    "workspaceId": "workspace_xxx",
    "revision": 12,
    "title": "服务器最新版",
    "content": "...",
    "type": "video",
    "tags": [],
    "parameters": {},
    "status": "active"
  }
}
```

`GET /changes` 建议返回：

```json
{
  "items": [],
  "tombstones": [{ "id": "tpl_xxx", "revision": 13 }],
  "nextCursor": "opaque_cursor",
  "serverTime": "2026-08-11T00:00:00.000Z"
}
```

服务端必须依据账号和组织成员关系计算权限，不信任客户端提交的角色或所有者字段。建议每个工作空间返回：

```json
{
  "permissions": {
    "canRead": true,
    "canCreate": true,
    "canEdit": true,
    "canDelete": false,
    "canShare": true,
    "canFavorite": true
  }
}
```

## Mock 开发模式

开发环境可以使用脱敏 fixture，不连接账号服务器：

```bash
WANJUAN_PROMPT_LIBRARY_MOCK=1 npm run start:dev
```

Mock 数据位于 `electron/fixtures/cloud-prompt-library.json`，只包含虚构账号、个人/企业空间和虚构提示词，不包含正式 Token、正式用户数据或生成素材。

自动化测试：

```bash
npm run test:cloud-prompts
```

测试覆盖 DTO 白名单、账号缓存隔离、权限撤销队列清理、POST/PATCH 请求头、Mock CRUD、收藏、复制、归档和 409 冲突。

## 等待服务器联调

App 端已按上述契约实现；接入 staging/production 前仍需确认：

- 工作空间和模板响应的最终字段命名。
- 企业角色与 `permissions` 的映射规则。
- PATCH `status=archived` 的归档响应；DELETE 必须返回 deleted tombstone。
- `If-Match` 接受纯 revision 还是 ETag。
- 409 响应中服务器最新版所在字段。
- `/changes` 游标有效期、分页上限和 tombstone 保留期。
- 收藏是按用户维度还是模板全局字段。
- 组织成员被移除后，服务端返回 403 还是从工作空间列表中移除。
