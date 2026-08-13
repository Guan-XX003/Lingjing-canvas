#!/usr/bin/env node
import readline from "node:readline";
import { waitForTask, wanjuanRequest } from "./wanjuan-client.mjs";
import { normalizeTianjiAutomationPayload } from "./wanjuan-tianji-input.mjs";

const tools = [
  { name: "wanjuan_status", description: "检查万卷灵境桌面应用是否已启动并可接受自动化任务。", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "wanjuan_list_models", description: "列出万卷灵境当前配置的图片、视频和文本模型，不返回 API Key。", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "wanjuan_list_tasks", description: "列出万卷灵境任务清单中的生成任务。", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "wanjuan_generate_image", description: "使用万卷灵境创建文生图或参考图生图任务。返回 nodeId，可用于查询或等待任务。", inputSchema: { type: "object", required: ["prompt"], properties: { prompt: { type: "string", description: "图片提示词" }, model: { type: "string", description: "模型名称；留空使用应用首选模型" }, size: { type: "string", default: "1024x1024" }, referenceImage: { type: "string", description: "可选参考图片绝对路径或 URL" } }, additionalProperties: false } },
  { name: "wanjuan_generate_video", description: "使用万卷灵境创建文生视频或图生视频任务。返回 nodeId，可用于查询或等待任务。", inputSchema: { type: "object", required: ["prompt"], properties: { prompt: { type: "string", description: "视频提示词" }, model: { type: "string", description: "模型名称；留空使用应用首选模型" }, resolution: { type: "string", default: "1280x720" }, duration: { type: "number", description: "视频时长（秒）" }, aspectRatio: { type: "string", description: "例如 16:9" }, referenceImage: { type: "string", description: "图生视频输入图片绝对路径或 URL" } }, additionalProperties: false } },
  { name: "wanjuan_generate_tianji_video", description: "使用即梦天玑专用节点生成视频，支持文生、首帧、首尾帧和参考素材四种模式。", inputSchema: { type: "object", required: ["prompt"], properties: { prompt: { type: "string" }, model: { type: "string" }, mode: { type: "string", enum: ["text-to-video", "first-frame", "first-last", "reference-media"], default: "text-to-video" }, resolution: { type: "string", default: "720p" }, duration: { type: "number", default: 5 }, aspectRatio: { type: "string", default: "16:9" }, images: { type: "array", maxItems: 9, items: { type: "string" } }, portraitAssetIds: { type: "array", maxItems: 9, description: "已审核且状态为 Active 的天玑最终人像素材 ID；仅用于 reference-media。", items: { type: "string", minLength: 1, maxLength: 512, pattern: "^[A-Za-z0-9][A-Za-z0-9._-]*$" } }, videos: { type: "array", maxItems: 3, items: { type: "string" } }, audios: { type: "array", maxItems: 3, items: { type: "string" } } }, additionalProperties: false } },
  { name: "wanjuan_get_task", description: "按 taskId 或生成命令返回的 nodeId 查询任务。", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } }, additionalProperties: false } },
  { name: "wanjuan_wait_task", description: "等待任务结束并返回最终状态。id 可以是 taskId 或 nodeId。", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" }, timeoutSeconds: { type: "number", default: 600, minimum: 1, maximum: 3600 } }, additionalProperties: false } },
  { name: "wanjuan_cancel_task", description: "取消正在运行的万卷灵境生成任务。", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } }, additionalProperties: false } },
];

async function callTool(name, args = {}) {
  if (name === "wanjuan_status") return wanjuanRequest("GET", "/v1/status");
  if (name === "wanjuan_list_models") return wanjuanRequest("GET", "/v1/models");
  if (name === "wanjuan_list_tasks") return wanjuanRequest("GET", "/v1/tasks");
  if (name === "wanjuan_generate_image") return wanjuanRequest("POST", "/v1/image/generate", args);
  if (name === "wanjuan_generate_video") return wanjuanRequest("POST", "/v1/video/generate", args);
  if (name === "wanjuan_generate_tianji_video") return wanjuanRequest("POST", "/v1/tianji/generate", normalizeTianjiAutomationPayload(args));
  if (name === "wanjuan_get_task") return wanjuanRequest("GET", `/v1/tasks/${encodeURIComponent(String(args.id || ""))}?materialize=1`);
  if (name === "wanjuan_wait_task") return waitForTask(args.id, { timeoutMs: Math.min(3600, Math.max(1, Number(args.timeoutSeconds || 600))) * 1000 });
  if (name === "wanjuan_cancel_task") return wanjuanRequest("POST", `/v1/tasks/${encodeURIComponent(String(args.id || ""))}`);
  throw new Error(`未知工具：${name}`);
}

function send(message) { process.stdout.write(`${JSON.stringify(message)}\n`); }
function result(id, value) { send({ jsonrpc: "2.0", id, result: value }); }
function error(id, code, message) { send({ jsonrpc: "2.0", id, error: { code, message } }); }

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", async (line) => {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); } catch { return error(null, -32700, "Parse error"); }
  const { id, method, params = {} } = message;
  if (id === undefined) return;
  try {
    if (method === "initialize") return result(id, { protocolVersion: String(params.protocolVersion || "2025-06-18"), capabilities: { tools: { listChanged: false } }, serverInfo: { name: "wanjuan-lingjing", version: "1.0.0" }, instructions: "通过本机万卷灵境应用执行图片和视频生成。生成前可先调用 wanjuan_list_models。" });
    if (method === "ping") return result(id, {});
    if (method === "tools/list") return result(id, { tools });
    if (method === "tools/call") {
      try {
        const value = await callTool(String(params.name || ""), params.arguments || {});
        return result(id, { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value, isError: false });
      } catch (toolError) {
        return result(id, { content: [{ type: "text", text: String(toolError?.message || toolError) }], isError: true });
      }
    }
    return error(id, -32601, `Method not found: ${method}`);
  } catch (requestError) { return error(id, -32603, String(requestError?.message || requestError)); }
});
