# StarCanvas CLI / MCP 自动化

## 独立下载

不安装桌面应用时，可下载与本版本匹配的 CLI/MCP 压缩包：

[下载 starcanvas-cli-1.4.7.zip](https://github.com/Guan-XX003/StarCanvas/releases/download/v1.4.7-release/starcanvas-cli-1.4.7.zip)

压缩包只包含 CLI/MCP 程序与本说明，不包含账号会话、API Key 或用户数据。

StarCanvas启动后会在当前用户数据目录创建一次性本机自动化凭据。CLI 和 MCP 只连接 `127.0.0.1`，不会读取或输出模型 API Key、账号 Token 或完整应用配置。

## 使用条件

- StarCanvas桌面 App 必须正在运行，并且画布已经加载完成。
- 外部运行 CLI/MCP 需要 Node.js 18 或更高版本。
- 每次 App 启动都会生成新的随机 bearer token；异常退出留下的旧凭据会在下次启动时清理，CLI 也会自动跳过死进程、旧端口和失效鉴权。

## 正式版位置

CLI/MCP 作为真实文件随安装包放在 `resources/wanjuan-cli`，不会只存在于 `app.asar` 中。

macOS：

```bash
node "/Applications/StarCanvas.app/Contents/Resources/wanjuan-cli/wanjuan.mjs" status
```

Windows：在StarCanvas安装目录下使用：

```powershell
node ".\resources\wanjuan-cli\wanjuan.mjs" status
```

源码开发目录中可以使用：

```bash
npm run wanjuan -- status
npm run wanjuan -- models
npm run wanjuan -- tasks
```

## CLI 命令

提交图片任务：

```bash
npm run wanjuan -- image generate \
  --prompt "一只在月球散步的橘猫，电影感光影" \
  --model "gpt-image-2" \
  --size "1024x1024"
```

参考图生图增加 `--reference /绝对路径/图片.png`。本地参考图片必须是存在的普通文件且不超过 100MB；远程图片只接受 `http` 或 `https` URL。

提交图生视频任务：

```bash
npm run wanjuan -- video generate \
  --prompt "镜头缓慢推进，猫咪抬头看向星空" \
  --model "wan2.7-i2v-flash-720P" \
  --image "/绝对路径/输入图片.png" \
  --resolution "1280x720" \
  --duration 5
```

提交即梦天玑专用任务：

```bash
npm run wanjuan -- tianji generate \
  --prompt "首帧人物转头看向镜头" \
  --mode first-frame \
  --image "/绝对路径/首帧.png" \
  --resolution 720p \
  --duration 5 \
  --ratio 16:9
```

已审核天玑人像使用专用参数：

```bash
npm run wanjuan -- tianji generate \
  --prompt "镜头缓慢推进" \
  --mode reference-media \
  --portrait-asset-id '<final-active-id>'
```

`--mode` 支持 `text-to-video`、`first-frame`、`first-last`、`reference-media`。`--image` 可重复 9 次，`--video` 和 `--audio` 可各重复 3 次。`--portrait-asset-id` 只接受天玑素材库返回的最终 Active 素材 ID，只能用于 `reference-media`，并与 `--image` 合计最多 9 个；普通 `--image` 不能传 `asset://`。该命令创建真正的即梦天玑节点，并沿用 App 内的极鑫配置，不接受或输出 API Key。

生成命令立即返回 `nodeId`。以下命令同时接受 `taskId` 或该 `nodeId`：

```bash
npm run wanjuan -- task get automation-video-...
npm run wanjuan -- task wait automation-video-... --timeout 600
npm run wanjuan -- task cancel automation-video-...
```

如果模型、接口配置或输入参数导致任务根本没有创建，自动化任务会快速进入 `failed`，`task wait` 不会一直等到完整超时时间。

## MCP Server

源码目录启动：

```bash
npm run wanjuan:mcp
```

正式 macOS 安装包配置示例：

```json
{
  "mcpServers": {
    "wanjuan-lingjing": {
      "command": "node",
      "args": [
        "/Applications/StarCanvas.app/Contents/Resources/wanjuan-cli/wanjuan-mcp.mjs"
      ]
    }
  }
}
```

Windows 将 `args` 改为安装目录下 `resources\\wanjuan-cli\\wanjuan-mcp.mjs` 的绝对路径。

MCP 工具：

- `wanjuan_status`
- `wanjuan_list_models`
- `wanjuan_list_tasks`
- `wanjuan_generate_image`
- `wanjuan_generate_video`
- `wanjuan_generate_tianji_video`
- `wanjuan_get_task`
- `wanjuan_wait_task`
- `wanjuan_cancel_task`

MCP 的 `wanjuan_generate_tianji_video` 提供等价的 `portraitAssetIds` 数组。该字段走严格的已审核人像通道，不能由普通 `images` 或任意 `asset://` 字符串替代。

MCP Server 的 stdout 只输出 JSON-RPC 消息；工具错误作为 MCP 结果返回。

## 当前覆盖范围

当前版本覆盖状态、图片/视频/文本模型列表、任务列表、文生图、参考图生图、文生视频、图生视频、即梦天玑四种生成模式以及任务查询/等待/取消。

任务查询会从 `customResultData` 中安全提取图片结果。`task get` 和 `task wait` 会尽力把远程、`blob:` 或 `data:` 媒体保存到项目媒体库，并在 `stableResultUrl` / `resultUrl` 返回稳定的 `file://` 路径；不会把大型 base64、完整 API 响应或凭据原样输出。若远端下载失败，则保留可用的 HTTP(S) 结果 URL。

当前尚未覆盖：文本生成、音频/TTS/音乐、通义专用节点、天玑人像组创建/认证管理、通用节点/连线增删改查、项目导入导出、自动布局、批量工作流、媒体编辑、账号和设置修改。CLI/MCP 也不会开放任意 Electron IPC。

## 安全边界

- 服务固定监听 `127.0.0.1`，不开放局域网或公网端口。
- bearer token 每次启动随机生成，凭据文件限制为当前用户访问。
- App 启动和退出都会尽力清理旧凭据。
- 参考文件必须使用有效绝对路径，远程资源只允许 `http/https`。
- 请求体限制为 2MB；参考图片文件限制为 100MB。
- 生成操作可能产生费用，智能体应在调用 `wanjuan_generate_image` 或 `wanjuan_generate_video` 前获得用户授权。
- 本地已授权客户端可以读取任务提示词、状态和结果 URL；不要把自动化凭据文件共享给其他用户或进程。
