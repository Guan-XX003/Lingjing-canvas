# StarCanvas开发工作流

## 固定地址

- 主线源码：`/Users/guanpeng/Desktop/claude工作区/StarCanvas`
- 正式版 App：`/Applications/StarCanvas.app`
- 正式用户数据：`/Users/guanpeng/Library/Application Support/wanjuan-ai-canvas-desktop-test`
- 开发用户数据：源码目录下的 `.wanjuan-dev-user-data`
- App 备份目录：`/Users/guanpeng/Desktop/codex工作区/`
- GitHub：`https://github.com/Guan-XX003/StarCanvas.git`

## 标准流程

### 1. 读取架构

开始开发前先读取 Oh-my-mermaid 架构镜像：

```bash
npm run arch:status
omm tree overall-architecture
omm show generation-lifecycle
```

根据任务继续查看对应视角：

- `overall-architecture`：模块位置和跨进程关系。
- `generation-lifecycle`：模型请求、任务轮询和结果回填。
- `storage`：项目、媒体、备份、迁移和清理。
- `external-integrations`：极鑫、天玑、通义、Suno 和自定义接口。
- `canvas-rendering`：大画布、媒体挂载和性能档位。

### 2. 修改源码

- 先定位真正的模块所有者和影响链路，再开始修改。
- 保留现有项目格式、节点连接语义、任务 ID 和媒体绑定。
- 不在正式版 App 内直接修改代码。
- 不读取、写入或迁移正式用户数据；需要真实项目时复制到临时测试目录。

### 3. 源码测试

根据影响范围运行适用检查：

```bash
npm run typecheck
npm run test:lib
npm run test:storage
npm run test:storage:state
npm run test:canvas-perf
npm run build:web
```

UI 修改必须在真实运行的源码窗口中检查；媒体和大画布修改必须使用带有真实生成结果的节点测试。

### 4. 更新架构镜像

以下变化需要更新 `.omm/`：

- 新增或删除主要模块、节点类型或服务。
- 改变 Electron、preload、renderer 之间的职责。
- 改变请求、任务、结果回填或媒体上传流程。
- 改变项目存储、迁移、备份或清理逻辑。
- 新增外部平台、模型协议或本地工具。

使用 Oh-my-mermaid 更新对应视角和节点说明，完成后运行：

```bash
npm run arch:validate
```

普通文案、局部样式和不改变模块关系的小修补不需要重写架构图。

### 5. 同步正式版 App

只有用户明确要求后才执行：

1. 从测试通过的源码重新构建 App。
2. 将现有 `/Applications/StarCanvas.app` 备份到时间戳目录。
3. 只替换 App 包，不删除正式用户数据。
4. 启动正式版，检查现有项目、媒体、配置、版本号和本次修复。

### 6. 推送云端与发布

- 正式 App 验证通过后再提交、推送 GitHub。
- 推送前再次运行 `npm run arch:validate`。
- 只有用户明确要求时才更新版本号、更新日志和 GitHub Release。
- 发布包不得包含临时用户数据路径、测试身份、密钥、Token 或私人媒体。

## 完成标准

一次任务只有在对应环节全部确认后才算完成：

- 源码修改已验证。
- 架构变化已同步到 `.omm/`。
- 正式 App 同步请求已完成备份和真实窗口验证。
- 云端推送请求已确认远端提交一致。
- 未执行的环节必须在报告中明确说明。

