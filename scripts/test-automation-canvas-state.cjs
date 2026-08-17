const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/renderer/bundle/index.js"), "utf8");

assert.match(source, /automationGenerateVideoRef\.current = generateVideo/);
assert.match(source, /const waitForCanvasState = async \(\{ nodeId, sourceNodeIds = \[\] \} = \{\}\) =>/);
assert.match(source, /currentNodes\.some\(\(node\) => node\.id === nodeId\) && nodesRef\.current\.some/);
assert.match(source, /currentEdges\.some\(\(edge\) => edge\.source === sourceId && edge\.target === nodeId\)/);
assert.doesNotMatch(source, /const waitForCanvasState = \(\) => new Promise\(\(resolve\) => setTimeout\(resolve, 80\)\)/);

const tianjiStart = source.indexOf("generateTianjiVideo: async");
assert.notEqual(tianjiStart, -1);
const tianjiBlock = source.slice(tianjiStart, tianjiStart + 6500);
assert.match(tianjiBlock, /await waitForCanvasState\(\{ nodeId, sourceNodeIds: sources\.map\(\(item\) => item\.id\) \}\)/);
assert.match(tianjiBlock, /automationGenerateVideoRef\.current\(nodeId/);
assert.match(tianjiBlock, /seedanceMode: "tianji"/);
assert.match(tianjiBlock, /tianjiSelectedModel: String\(model \|\| ""\)/);

console.log("automation canvas state: waits for committed nodes/edges and invokes the latest generation callback");
