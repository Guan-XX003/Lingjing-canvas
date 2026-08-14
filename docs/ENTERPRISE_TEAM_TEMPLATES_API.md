# Enterprise Gateway Team Templates

## Scope

Team prompt templates are stored only on the enterprise host computer. They are not written to the production account service. The account service remains responsible for account authentication, Gateway Grants, organization membership and the gateway control snapshot.

The local store is bound to one `organizationId + gatewayId` pair. Personal prompt templates remain in the existing local or cloud workspace stores.

## Member HTTP API

Every HTTP request requires a Workspace Token issued by `POST /workspace/session`:

```http
Authorization: Bearer <workspaceToken>
```

An account Access Token is not accepted by these routes.

```text
GET    /workspace/team-templates?cursor=&limit=50&updatedAfter=&includeArchived=false
POST   /workspace/team-templates
GET    /workspace/team-templates/{id}
PATCH  /workspace/team-templates/{id}
DELETE /workspace/team-templates/{id}
GET    /workspace/team-templates/changes?cursor=&limit=100
```

`POST` requires an `Idempotency-Key` header with 8..120 characters. `PATCH` and `DELETE` require either a numeric `revision` in the body or `If-Match: "<revision>"`.

## Trusted Host API

Host mode has no encrypted Workspace Token. The account-service main process must validate the signed-in user, owned organization and local gateway host before calling:

```js
await invokeEnterpriseTeamTemplatesAsHost({
  operation,
  payload,
  session: {
    userId,
    organizationId,
    gatewayId,
    role: "owner", // or admin
    trustedHost: true,
  },
});
```

The function is exported by `electron/main/enterprise-gateway.cjs`. Renderer input must never supply identity, role or `trustedHost`. The function rechecks the organization, gateway, trusted marker and owner/admin role against the active local gateway.

Operations:

```text
list    { cursor?, limit?, updatedAfter?, includeArchived? }
changes { cursor?, limit? }
get     { id }
create  { input, idempotencyKey }
update  { id, input, revision }
delete  { id, revision }
```

Host and member paths use the same store, DTO validation, permissions, optimistic concurrency, idempotency and audit log.

## Write DTO

Only these fields are accepted:

```json
{
  "title": "1..120",
  "content": "1..20000",
  "description": "0..2000",
  "type": "text|image|video|audio|generic",
  "tags": ["up to 20 values, each up to 40"],
  "modelHint": "up to 160",
  "providerHint": "up to 120",
  "generationMode": "up to 120",
  "parameters": {
    "aspectRatio": "string",
    "resolution": "string",
    "durationSeconds": 5,
    "imageSize": "string",
    "generateAudio": true,
    "watermark": false
  }
}
```

Unknown fields are rejected. API keys, tokens, headers, local paths, `file:`, `blob:` and `data:` values, media files/URLs and result/task/project/node identifiers are not part of this DTO. `PATCH` changes only fields explicitly present in the request.

## Responses

A template item contains:

```text
id, organizationId, gatewayId,
title, content, description, type, tags,
modelHint, providerHint, generationMode, parameters,
status, revision, author:{id},
permissions:{canRead,canEdit,canDelete},
createdAt, updatedAt
```

List response:

```json
{
  "ok": true,
  "items": [],
  "nextCursor": null,
  "serverTime": "ISO-8601",
  "role": "member",
  "permissions": { "canRead": true, "canCreate": true }
}
```

Incremental response:

```json
{
  "ok": true,
  "items": [],
  "tombstones": [{ "id": "opaque", "revision": 2, "deletedAt": "ISO-8601" }],
  "nextCursor": "opaque",
  "serverTime": "ISO-8601"
}
```

The changes cursor is a high-water mark. A client should persist it and request changes again after reconnecting. Deleted templates are absent from normal lists immediately and retain no title, content or metadata in the store.

## Permissions

| Principal | Read | Create | Edit/Delete |
| --- | --- | --- | --- |
| Active member | Yes | Yes | Own templates only |
| Active owner/admin | Yes | Yes | All templates |
| Trusted local host owner/admin | Yes | Yes | All templates |
| Disabled, removed or expired member | No | No | No |
| Other organization/gateway | No | No | No |

Member HTTP requests fail closed when the current `control-snapshot.json` is missing, invalid or has no `members` array. Membership fields accepted from the current account-service control snapshot are `user_id`, `role`, `status` and `expires_at`, with camelCase aliases retained for compatibility.

## Conflict And Idempotency

Stale updates and deletes return:

```json
{
  "ok": false,
  "code": "TEAM_TEMPLATE_CONFLICT",
  "details": { "id": "opaque", "revision": 3, "updatedAt": "ISO-8601" }
}
```

The HTTP status is `409`. The client must refetch instead of merging prompt content from the error.

Idempotency is scoped to the user and gateway store. The raw key is never persisted. The same key and payload returns the same template; the same key with a different payload returns `409 IDEMPOTENCY_CONFLICT`.

If the resource was deleted after the original request, replaying its old key returns `409 IDEMPOTENCY_RESOURCE_GONE`. It never returns a cleared tombstone as an active template.

## Local Persistence And Audit

```text
<userData>/enterprise-gateway/team-templates.json
<userData>/enterprise-gateway/team-template-audit.json
```

The directory is mode `0700`; both files use atomic replacement and mode `0600`. Audit records contain action, template ID, actor user ID, organization/gateway scope, role, revision, result and timestamp. They never contain prompt content.

Malformed or unreadable store/audit JSON fails closed with a `503` error. A corrupt file is not treated as an empty store and is never silently overwritten. Mutations validate the audit file before changing the template store; an audit write failure rolls the store back.

Limits:

- 5,000 active templates.
- 64 MB store file.
- 24-hour persisted idempotency window, capped at 5,000 records.
- Audit log capped at 5,000 records.
- Read 300/minute per user; create 120/hour; update/delete 300/hour.

## Verification And Deployment

Local verification:

```bash
npm run test:enterprise-gateway
npm run test:lib
npm run typecheck
```

No database migration is required. A future release only needs the updated Electron application files. Before packaging, verify member create/read, author and admin permissions, host owner operations, conflict handling, persisted idempotency, tombstones, control-snapshot revocation, file permissions and restart recovery.
