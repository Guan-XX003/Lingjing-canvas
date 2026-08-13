# 万卷灵境 Codex 接手说明

更新日期：2026-08-10

这份文档用于把万卷灵境项目交给另一台电脑上的 Codex。新会话开始后，先阅读本文件，再开始任何修改。

## 1. 唯一主线

- 主线源码：`/Users/guanpeng/Desktop/claude工作区/Lingjing-canvas`
- GitHub：<https://github.com/Guan-XX003/Lingjing-canvas>
- 分支：`local-ui-redesign-flow`
- 当前提交：`99c20b5539fd1432b14c1de3d59577f07a302c01`
- 当前标签：`v1.4.1`
- 当前 `package.json` 候选版本：`1.4.2`
- 远端状态：当前主线与 `origin/local-ui-redesign-flow` 同步

不要把 `/Users/guanpeng/Documents/万卷画布/wanjuan-lingjing-source` 当成最新源码。它是较旧的副本，不能作为后续开发主线。

主线当前只有历史发布目录未跟踪，不要擅自删除或清理：

- `release-jixin-reset-20260714-143008/`
- `release-sync-20260713-204342/`
- `release-team-hotfix-20260714-135728/`
- `release-team-hotfix-final-20260714-140121/`

## 2. 当前发行状态

- 正式 App：`/Applications/万卷灵境.app`
- 正式 App Bundle 版本：`1.4.1`
- GitHub Release：<https://github.com/Guan-XX003/Lingjing-canvas/releases/tag/v1.4.1>
- 历史构建产物保存在主线 `release/` 目录，包含 `1.4.1` 的 macOS、Windows 安装包和压缩包。
- 旧的 `v1.4.0` 标签保持不变；不要移动或覆盖已发布标签。
- macOS 包为 ad-hoc 签名，未做 Apple 公证。
- Windows 包不内置本地工具运行时，继续使用项目现有的托管/用户工具机制。

正式版曾使用的用户数据目录：

`/Users/guanpeng/Library/Application Support/wanjuan-ai-canvas-desktop-test`

在测试或打包前，必须明确使用开发数据目录或正式数据目录。未经用户明确同意，不要清空、迁移、覆盖或删除正式用户数据。

## 3. 最近已完成的关键修复

### 网关与账号

- 修复账号会话中的 `enterprise` 状态和本机 `enterprise-gateway/gateway.json` 不一致的问题。
- 刷新组织信息后，会按企业 ID、Gateway ID、证书指纹对账，匹配后恢复本机主网关管理态。
- 多个 owner 企业时优先匹配本机网关所属企业。
- Gateway ID 或证书指纹不一致时拒绝错误恢复，避免旧电脑误接管。
- 企业网关、Secret Vault、配置镜像、Gateway Grant、成员配额和任务代理的主要实现已在主线。

### 版本显示

- 导航栏版本号已改为读取 `chrome.runtime.getManifest().version`，不再使用硬编码旧版本。
- 增加 `scripts/test-version-consistency.cjs`，用 `npm run test:version` 验证版本一致性。

### 画布与媒体性能

- 已完成大画布性能治理、节点 full/lite/shell 分层、媒体按需加载、任务索引与节流、Base64 外置化、崩溃诊断等阶段性改造。
- 这些改动必须以“真实带图片/视频/音频结果的节点”验证，不能只用空节点压力测试。
- 重点回归：缩放后的节点缩略图、视频 poster/播放按钮、连接柄位置、参考图识别、即梦普通/天玑模式、任务拉回和历史结果持久化。

### 模型和配置

- 模型配置、API 配置、全局批量配置必须保持数据隔离。
- 切换批量配置只能切换模型绑定和配置关系，不得删除统一 API 配置中其他 API 条目。
- 极鑫默认配置、其他全局批量配置、自定义无配置模式必须保持独立，不能串供。
- 模型协议、字段映射、参考上传和请求地址必须由配置驱动，禁止针对某一个模型继续新增硬编码分支。

## 4. 服务器端配套

服务器项目：

`/Users/guanpeng/Documents/服务器管理/wanjuan-account-service`

主要文档：

- `README.md`
- `APP_INTEGRATION_HANDOFF.md`
- `ENTERPRISE_LOCAL_GATEWAY_SERVER_IMPLEMENTATION.md`
- `PRODUCTION_DEPLOYMENT.md`
- `SERVER_EMAIL_ACCOUNT_PRODUCTION_TODO.md`

生产账号 API：<https://account.guancn.uk/docs>

服务器当前已完成账号、邮箱验证码、企业组织、网关激活、Ed25519 签名、Nonce 防重放、Gateway Grant、成员配额和 usage-summary 等接口。云端不保存企业配置正文或 API Secret。

新会话修改 App 的企业网关逻辑前，先阅读主线中的：

`docs/ENTERPRISE_GATEWAY_TAKEOVER_SERVER_IMPLEMENTATION.md`

以及服务器项目中的：

`APP_INTEGRATION_HANDOFF.md`

不要把生产 token、API Key、邮箱验证码或企业密钥写入源码、提交记录或交接文档。

## 5. 已通过的验证

最近一次正式版同步前已通过：

```text
npm run test:version
npm run typecheck
npm run test:lib
npm run test:storage
npm run test:storage:state
npm run test:global-config
npm run test:account:main
npm run test:account
npm run test:enterprise-gateway
npm run test:local-secret-storage
npm run test:local-data-cleanup
npm run test:windows-paths
npm run test:ark-assets
npm audit --omit=dev
```

其中 `test:lib` 最近为 124 项通过，`npm audit --omit=dev` 为 0 漏洞。真实 API、真实邮箱和真实企业网关链路需要在用户授权后再测，不能把测试密钥固化到仓库。

## 6. 开发约束

1. 后续开发以 Claude 主线目录为准，先 `git status`、`git log -1`、`git remote -v`，确认没有打开旧副本。
2. 修改前先备份涉及的源码或创建独立提交；不要使用 `git reset --hard`、`git checkout --`、`git clean` 或 stash 删除用户工作。
3. 不改生成接口、模型配置规则、项目核心格式和节点连接语义，除非用户明确要求。
4. 不硬编码模型名、API 配置、协议字段或服务器密钥；新增能力要走现有配置/协议注册表。
5. 画布问题必须用包含真实生成结果的项目检查，尤其是媒体数量多、图片尺寸大、视频结果多的项目。
6. 正式版同步前备份 `/Applications/万卷灵境.app`，先验证开发版，再替换正式版。
7. 发布新版本时同时检查 `package.json`、Electron manifest、导航版本显示、更新说明、安装包和 GitHub Release，避免“包版本已更新、界面仍显示旧版本”。
8. 用户要求“只查不改”时不得顺手修改；用户要求同步/发布时完成构建、启动检查和结果报告，不只改源码。

## 7. 新会话启动命令

```bash
cd "/Users/guanpeng/Desktop/claude工作区/Lingjing-canvas"
git status --short --branch
git log -1 --oneline --decorate
git remote -v
npm run typecheck
```

开发启动：

```bash
npm run start:dev
```

大画布诊断启动：

```bash
npm run debug
```

诊断只在开发环境使用，不要把 `.wanjuan-dev-user-data` 当成正式用户数据，也不要把其中的会话信息、密钥或缓存提交到 Git。

## 8. 可直接粘贴给下一会话的开场白

```text
请接手万卷灵境项目。唯一主线是：
/Users/guanpeng/Desktop/claude工作区/Lingjing-canvas

仓库：https://github.com/Guan-XX003/Lingjing-canvas
分支：local-ui-redesign-flow
当前提交：99c20b5539fd1432b14c1de3d59577f07a302c01
当前候选版本：1.4.2（GitHub Release 仍由协调会话统一发布）

先阅读 docs/CODEX_HANDOFF.md、AGENTS.md、README.md 和相关功能文档，执行 git status、git log -1、git remote -v，确认不是旧源码副本。不要清理用户数据、不要使用 reset/clean/stash 删除工作、不要硬编码模型或密钥。开始修改前先说明将检查哪些文件；完成后运行相关测试并报告实际结果。
```
