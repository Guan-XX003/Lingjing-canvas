#!/usr/bin/env node
import { waitForTask, wanjuanRequest } from "./wanjuan-client.mjs";
import { normalizeTianjiAutomationPayload } from "./wanjuan-tianji-input.mjs";
const fail = (message) => { console.error(`wanjuan: ${message}`); process.exitCode = 1; };
const option = (args, name, fallback = "") => { const i = args.indexOf(name); return i >= 0 ? String(args[i + 1] || fallback) : fallback; };
const options = (args, name) => args.flatMap((value, index) => value === name && args[index + 1] ? [String(args[index + 1])] : []);
const requiredOptions = (args, name) => args.flatMap((value, index) => {
  if (value !== name) return [];
  const next = args[index + 1];
  if (!next || String(next).startsWith("--")) throw new Error(`${name} 必须提供值`);
  return [String(next)];
});
const print = (value) => console.log(JSON.stringify(value, null, 2));
const [command = "status", subcommand = "", ...args] = process.argv.slice(2);
try {
  if (command === "status") print(await wanjuanRequest("GET", "/v1/status"));
  else if (command === "models") print(await wanjuanRequest("GET", "/v1/models"));
  else if (command === "tasks") print(await wanjuanRequest("GET", "/v1/tasks"));
  else if (command === "image" && subcommand === "generate") print(await wanjuanRequest("POST", "/v1/image/generate", { prompt: option(args, "--prompt"), model: option(args, "--model"), size: option(args, "--size", "1024x1024"), referenceImage: option(args, "--reference") }));
  else if (command === "video" && subcommand === "generate") print(await wanjuanRequest("POST", "/v1/video/generate", { prompt: option(args, "--prompt"), model: option(args, "--model"), resolution: option(args, "--resolution", "1280x720"), duration: option(args, "--duration"), aspectRatio: option(args, "--ratio"), referenceImage: option(args, "--image") }));
  else if (command === "tianji" && subcommand === "generate") print(await wanjuanRequest("POST", "/v1/tianji/generate", normalizeTianjiAutomationPayload({ prompt: option(args, "--prompt"), model: option(args, "--model"), resolution: option(args, "--resolution", "720p"), duration: option(args, "--duration", "5"), aspectRatio: option(args, "--ratio", "16:9"), mode: option(args, "--mode", "text-to-video"), images: options(args, "--image"), portraitAssetIds: requiredOptions(args, "--portrait-asset-id"), videos: options(args, "--video"), audios: options(args, "--audio") })));
  else if (command === "task" && subcommand === "get") print(await wanjuanRequest("GET", `/v1/tasks/${encodeURIComponent(args[0] || "")}?materialize=1`));
  else if (command === "task" && subcommand === "cancel") print(await wanjuanRequest("POST", `/v1/tasks/${encodeURIComponent(args[0] || "")}`));
  else if (command === "task" && subcommand === "wait") print(await waitForTask(args[0] || "", { timeoutMs: Number(option(args, "--timeout", "600")) * 1000 }));
  else throw new Error("用法：status | models | tasks | image generate | video generate | tianji generate | task get|wait|cancel（task 命令可传 taskId 或 nodeId）");
} catch (error) { fail(error.message || error); }
