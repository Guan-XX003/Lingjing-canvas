/** Runtime capabilities injected into newly-created canvas nodes. */
export const WANJUAN_VIDEO_GENERATION_NODE_TYPES = new Set([
  `videoNode`,
  `seedanceNode`,
  `tongyiWanxiangNode`,
]);

export const WANJUAN_AUDIO_RUNTIME_NODE_TYPES = new Set([
  `audioNode`,
  `ttsMusicNode`,
  `musicNode`,
]);

export const WANJUAN_API_CONFIG_NODE_TYPES = new Set([
  `promptNode`,
  `textNode`,
  ...WANJUAN_VIDEO_GENERATION_NODE_TYPES,
  ...WANJUAN_AUDIO_RUNTIME_NODE_TYPES,
]);

export const WANJUAN_UPLOAD_CONFIG_NODE_TYPES = new Set([
  `fileToLinkNode`,
  `seedanceNode`,
  `tongyiWanxiangNode`,
  `musicNode`,
]);

export const WANJUAN_TOAST_NODE_TYPES = new Set([
  `textNode`,
  ...WANJUAN_AUDIO_RUNTIME_NODE_TYPES,
  `customNode`,
  `seedanceNode`,
  `tongyiWanxiangNode`,
  `videoExtractNode`,
  `fileToLinkNode`,
  `videoFaceBlurNode`,
  `qwenTtsCloneNode`,
  `realEsrganVideoNode`,
]);

export const WANJUAN_TRANSIT_RESOURCE_NODE_TYPES = new Set([
  ...WANJUAN_AUDIO_RUNTIME_NODE_TYPES,
  `videoFaceBlurNode`,
  `qwenTtsCloneNode`,
  `realEsrganVideoNode`,
]);

export const WANJUAN_RUNTIME_NODE_DATA_KEYS = new Set([
  `wanjuanRenderMode`,
  `wanjuanRenderReason`,
  `wanjuanRenderRuntime`,
  `wanjuanRenderZoom`,
  `apiConfigs`,
  `modelProtocolRegistry`,
  `textModelApiBindings`,
  `textModelProtocolBindings`,
  `imageModelApiBindings`,
  `imageModelProtocolBindings`,
  `videoModelApiBindings`,
  `videoModelProtocolBindings`,
  `audioModelApiBindings`,
  `audioModelProtocolBindings`,
  `videoModelRequestProfiles`,
  `presetPrompts`,
  `tosConfig`,
  `customPublicUploadConfig`,
  `qiniuConfig`,
  `arkTrustedAssetEnabled`,
]);

export const wanjuanStripRuntimeNodeData = <T>(data: T): T => {
  if (!data || typeof data !== `object`) return data;
  let changed = false;
  const nextData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (WANJUAN_RUNTIME_NODE_DATA_KEYS.has(key)) changed = true;
    else nextData[key] = value;
  });
  return (changed ? nextData : data) as T;
};

export const wanjuanNodeHasRuntimeCapability = (nodeType: unknown, capability: Set<string>) =>
  capability.has(String(nodeType || ``));
