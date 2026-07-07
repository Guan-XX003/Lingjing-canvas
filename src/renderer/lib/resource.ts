/**
 * 资源类型 / 来源 / 过滤工具模块。
 *
 * 负责判定素材资源(resource)的媒体种类(图片 / 视频 / 音频 / 文本)与来源
 * (AI 生成 / 外部素材)，并据此实现资源列表的过滤匹配。
 * 另外提供工程媒体绑定值的反序列化与本地文件地址(file://)的构造工具。
 */

/**
 * 判定资源的媒体种类。
 *
 * 综合资源的 type / mediaKind 以及 url / localPath / path / thumbnailUrl 等字段，
 * 通过 MIME 前缀、data URI、文件扩展名等线索判断，返回 text / audio / video / image 之一，
 * 无法识别时默认归为 image。
 */
export function wanjuanResourceKind(resource: any): `text` | `audio` | `video` | `image` {
  let typeString = String(resource?.type || resource?.mediaKind || ``).toLowerCase(),
    urlString = String(
      resource?.url ||
        resource?.videoUrl ||
        resource?.resultVideoUrl ||
        resource?.audioUrl ||
        resource?.resultAudioUrl ||
        resource?.imageUrl ||
        resource?.mediaUrl ||
        resource?.resultUrl ||
        resource?.localPath ||
        resource?.path ||
        resource?.thumbnailUrl ||
        ``,
    ).toLowerCase();
  return typeString === `text` || typeString.startsWith(`text/`)
    ? `text`
    : typeString === `audio` ||
        typeString.startsWith(`audio/`) ||
        /^data:audio\//.test(urlString) ||
        /\.(mp3|wav|m4a|aac|ogg|flac)(?:$|[?#])/i.test(urlString)
      ? `audio`
      : typeString === `video` ||
          typeString.startsWith(`video/`) ||
          /^data:video\//.test(urlString) ||
          /\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|[?#])/i.test(urlString)
        ? `video`
        : `image`;
}

/**
 * 判定资源的来源种类。
 *
 * 汇总 source / sourceOrigin / mediaSourceOrigin / origin / sourceKind / pageUrl 等字段，
 * 若命中 AI 相关关键字(generated、seedream、seedance、tts、music 等)则视为 "generated"，
 * 否则视为 "external"。
 */
export function wanjuanResourceSourceKind(resource: any): `generated` | `external` {
  let combinedSource = [
    resource?.source,
    resource?.sourceOrigin,
    resource?.mediaSourceOrigin,
    resource?.origin,
    resource?.sourceKind,
    resource?.pageUrl,
  ]
    .map((value) => String(value || ``).toLowerCase())
    .filter(Boolean)
    .join(` `);
  return /\bgenerated\b|ai|seedream|seedance|doubao|tongyi|wanxiang|task|tts|music|video-editor/.test(
    combinedSource,
  )
    ? `generated`
    : `external`;
}

/**
 * 判断资源是否满足当前筛选条件。
 *
 * @param resource     待判定的资源对象
 * @param kindFilter   媒体种类筛选值；特殊值 "favorite" 表示仅看收藏(种类不限)
 * @param sourceFilter 来源筛选值(generated / external / all)，默认 "all"
 * @param favoriteOnly 是否仅显示收藏项，默认 false
 *
 * 当 kindFilter 为 "favorite" 时，等效于种类不限且强制开启收藏过滤。
 * 三个维度(种类 / 来源 / 收藏)全部匹配时返回 true。
 */
export function wanjuanResourceMatchesFilter(
  resource: any,
  kindFilter: string,
  sourceFilter: string = `all`,
  favoriteOnly: boolean = false,
): boolean {
  let effectiveKindFilter = kindFilter === `favorite` ? `all` : kindFilter,
    requireFavorite = favoriteOnly || kindFilter === `favorite`,
    matchesKind =
      effectiveKindFilter === `all` ||
      !effectiveKindFilter ||
      wanjuanResourceKind(resource) === effectiveKindFilter,
    matchesSource =
      sourceFilter === `all` || !sourceFilter || wanjuanResourceSourceKind(resource) === sourceFilter,
    matchesFavorite = !requireFavorite || resource?.isFavorite === true;
  return matchesKind && matchesSource && matchesFavorite;
}

/**
 * 从节点 data 中清除指定字段的工程素材绑定(projectAssetBindings)。
 *
 * 用于任务重新提交/结果覆盖前，把旧的 videoUrl / thumbnailUrl / resultData 等
 * 字段绑定摘除；无任何命中时原样返回，绑定清空后删除整个 projectAssetBindings。
 * 纯函数：不修改入参，返回新对象。
 */
export function wanjuanClearProjectAssetBindingsFromData(data: any, fields: string[] = []): any {
  if (!data || typeof data != `object` || !Array.isArray(fields) || !fields.length) return data;
  let bindings = data.projectAssetBindings;
  if (!bindings || typeof bindings != `object`) return data;
  let nextBindings: Record<string, any> = {
      ...bindings,
    },
    changed = false;
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(nextBindings, field)) {
      delete nextBindings[field];
      changed = true;
    }
  });
  if (!changed) return data;
  let nextData = {
    ...data,
  };
  Object.keys(nextBindings).length > 0
    ? (nextData.projectAssetBindings = nextBindings)
    : delete nextData.projectAssetBindings;
  return nextData;
}

/**
 * 反序列化工程媒体绑定的可移植值(portableData)。
 *
 * 绑定不存在时返回 undefined；portableData 非字符串时原样返回；
 * 当 valueFormat 为 "json" 时尝试 JSON 解析，解析失败则回退为原始字符串。
 */
export function reviveProjectMediaBindingValue(binding: any): any {
  if (!binding) return undefined;
  let portableData = binding.portableData;
  if (typeof portableData != `string`) return portableData;
  if (binding.valueFormat === `json`)
    try {
      return JSON.parse(portableData);
    } catch {
      return portableData;
    }
  return portableData;
}

/**
 * 由本地文件路径构造 file:// 协议地址。
 *
 * 非字符串或空字符串返回空串；已是 file:// 开头的地址原样返回。
 * 兼容 Windows 路径：反斜杠统一为正斜杠；盘符路径（C:/）前补 "/"；
 * UNC 路径（//server/share）使用 file: 前缀（形成 file://server/share）。
 * 编码时把 "#" 转义为 "%23" 以避免被解析为片段。
 */
export function buildProjectMediaFileUrl(filePath: any): string {
  if (typeof filePath != `string` || !filePath) return ``;
  if (/^file:\/\//i.test(filePath)) return filePath;
  const normalized = filePath.replace(/\\/g, `/`);
  const encoded = encodeURI(
    /^[A-Za-z]:\//.test(normalized)
      ? `/${normalized}`
      : /^\/[A-Za-z]:\//.test(normalized) || normalized.startsWith(`//`)
        ? normalized
        : normalized, // 兜底用已归一(反斜杠→正斜杠)的路径，避免 file:// 里残留字面 "\"
  ).replace(/#/g, `%23`);
  return normalized.startsWith(`//`) ? `file:${encoded}` : `file://${encoded}`;
}

// —— 以下为资源身份 / 生成视频提取工具（自 bundle 反混淆迁入，行为保持一致）——

/** 按资源种类取其主要媒体地址（视频/音频/图片各有字段优先级）。 */
export function wanjuanResourceMediaUrl(resource: any) {
  let resourceKind = wanjuanResourceKind(resource);
  return String(
    resourceKind === `video` ?
      resource?.videoUrl || resource?.resultVideoUrl || resource?.url || resource?.mediaUrl || resource?.resultUrl || resource?.localPath || resource?.path || resource?.previewUrl || resource?.thumbnailUrl :
      resourceKind === `audio` ?
      resource?.audioUrl || resource?.resultAudioUrl || resource?.url || resource?.mediaUrl || resource?.resultUrl || resource?.localPath || resource?.path :
      resource?.url || resource?.imageUrl || resource?.mediaUrl || resource?.resultUrl || resource?.localPath || resource?.path || resource?.previewUrl || resource?.thumbnailUrl || ``
  );
}
export function wanjuanNormalizeResourceSignatureValue(value: any) {
  let text = String(value || ``).trim();
  if (!text) return ``;
  return text
    .replace(/^asset:\/\//i, `asset://`)
    .replace(/^file:\/\/localhost\//i, `file:///`)
    .replace(/[?#]$/, ``);
}
export function wanjuanResourceIdentitySignatures(resource: any) {
  let signatures = new Set(),
    addSignature = (prefix, value) => {
      let normalized = wanjuanNormalizeResourceSignatureValue(value);
      normalized && signatures.add(`${prefix}:${normalized}`);
    },
    kind = wanjuanResourceKind(resource);
  addSignature(`kind-url-${kind}`, wanjuanResourceMediaUrl(resource));
  [
    resource?.url,
    resource?.imageUrl,
    resource?.thumbnailUrl,
    resource?.previewUrl,
    resource?.mediaUrl,
    resource?.resultUrl,
    resource?.localPath,
    resource?.path,
  ].forEach((value) => addSignature(`kind-media-${kind}`, value));
  addSignature(`asset-${kind}`, resource?.seedanceAssetId || resource?.assetId);
  addSignature(`tianji-${kind}`, resource?.tianjiPortraitAssetId || resource?.portraitAssetId);
  addSignature(`source-${kind}`, resource?.sourceId);
  addSignature(`id-${kind}`, resource?.id);
  return signatures;
}
export function wanjuanResourceSameIdentity(a: any, b: any) {
  if (!a || !b) return !1;
  let aSignatures = wanjuanResourceIdentitySignatures(a);
  if (!aSignatures.size) return !1;
  for (let signature of wanjuanResourceIdentitySignatures(b))
    if (aSignatures.has(signature)) return !0;
  return !1;
}
export function wanjuanResourceInList(resource: any, list: any) {
  return Array.isArray(list) && list.some((item) => wanjuanResourceSameIdentity(item, resource));
}
export function wanjuanResourcePosterUrl(resource: any) {
  return String(resource?.thumbnailUrl || resource?.posterUrl || resource?.coverUrl || resource?.coverImageUrl || resource?.imageUrl || resource?.previewImageUrl || ``);
}
export function wanjuanResourceLooksLikeImageUrl(value: any) {
  return /^data:image\//i.test(String(value || ``)) || /\.(png|jpe?g|webp|gif|svg|bmp|heic|avif)(?:$|[?#])/i.test(String(value || ``));
}
export function wanjuanResourceLooksLikeVideoUrl(value: any) {
  return /^data:video\//i.test(String(value || ``)) || /\.(mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:$|[?#])/i.test(String(value || ``));
}
export function wanjuanGetTransitResourcePageSize(gridCols: any) {
  let cols = parseInt(gridCols, 10);
  if (!Number.isFinite(cols) || cols <= 0) cols = 4;
  return Math.max(20, cols * 5);
}
export function wanjuanStableResourceIdPart(value: any) {
  let text = String(value || ``),
    hash = 0;
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return hash.toString(16);
}
export function wanjuanCollectResourceSignatures(resource: any) {
  let signatures = [];
  [
    resource?.url,
    resource?.originalUrl,
    resource?.remoteUrl,
    resource?.sourceUrl,
    resource?.resultUrl,
    resource?.mediaUrl,
    resource?.videoUrl,
    resource?.resultVideoUrl,
    resource?.localPath,
    resource?.path,
    resource?.projectAssetBinding?.localPath,
    resource?.projectAssetBinding?.sourceSignature,
  ].forEach((value) => {
    typeof value == `string` && value.trim() && signatures.push(value.trim());
  });
  return signatures;
}
export function wanjuanExtractVideoUrlFromValue(value: any) {
  if (!value) return ``;
  if (typeof value == `string`) {
    let trimmed = value.trim();
    if (!trimmed) return ``;
    if (/^(https?:\/\/|file:\/\/|blob:|data:video\/)/i.test(trimmed) || wanjuanResourceLooksLikeVideoUrl(trimmed)) return trimmed;
    try {
      let parsed = JSON.parse(trimmed);
      return wanjuanExtractVideoUrlFromValue(parsed);
    } catch {
      let match = trimmed.match(/(?:https?:\/\/|file:\/\/)[^\s"'<>]+?\.(?:mp4|webm|mov|m4v|mpeg|mpg|avi|mkv)(?:[?#][^\s"'<>]*)?/i);
      return match?.[0] || ``;
    }
  }
  if (Array.isArray(value)) {
    for (let item of value) {
      let url = wanjuanExtractVideoUrlFromValue(item);
      if (url) return url;
    }
    return ``;
  }
  if (typeof value == `object`) {
    for (let key of [
        `videoUrl`,
        `resultVideoUrl`,
        `outputVideoUrl`,
        `video_url`,
        `result_video_url`,
        `output_video_url`,
        `mediaUrl`,
        `resultUrl`,
        `url`,
        `downloadUrl`,
      ]) {
      let url = wanjuanExtractVideoUrlFromValue(value[key]);
      if (url) return url;
    }
  }
  return ``;
}
export function wanjuanBuildGeneratedVideoResourcesFromNodes(nodes: any, existingResources: any, projectId: any) {
  let existingSignatures = new Set();
  (Array.isArray(existingResources) ? existingResources : []).forEach((resource) =>
    wanjuanCollectResourceSignatures(resource).forEach((signature) => existingSignatures.add(signature)),
  );
  let generatedResources = [],
    generatedSignatures = new Set(),
    generatedNodeTypes = new Set([`videoNode`, `seedanceNode`, `tongyiWanxiangNode`, `videoFaceBlurNode`]);
  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    let nodeData = node?.data || {},
      nodeType = String(node?.type || ``),
      sourceText = [
        nodeData.source,
        nodeData.sourceOrigin,
        nodeData.mediaSourceOrigin,
        nodeData.origin,
        nodeData.provider,
      ].map((value) => String(value || ``).toLowerCase()).join(` `),
      isGeneratedVideo =
      generatedNodeTypes.has(nodeType) ||
      nodeData.mediaKind === `video` && /\bgenerated\b|ai|seedance|doubao|tongyi|wanxiang|task|video-editor/.test(sourceText);
    if (!isGeneratedVideo) return;
    let videoUrl =
      wanjuanExtractVideoUrlFromValue(nodeData.videoUrl) ||
      wanjuanExtractVideoUrlFromValue(nodeData.resultVideoUrl) ||
      wanjuanExtractVideoUrlFromValue(nodeData.outputVideoUrl) ||
      wanjuanExtractVideoUrlFromValue(nodeData.mediaUrl) ||
      wanjuanExtractVideoUrlFromValue(nodeData.resultUrl) ||
      wanjuanExtractVideoUrlFromValue(nodeData.resultData) ||
      (nodeData.mediaKind === `video` ? wanjuanExtractVideoUrlFromValue(nodeData.imageUrl) : ``);
    if (!videoUrl || existingSignatures.has(videoUrl) || generatedSignatures.has(videoUrl)) return;
    generatedSignatures.add(videoUrl);
    let posterUrl = String(nodeData.thumbnailUrl || nodeData.posterUrl || nodeData.coverUrl || nodeData.previewImageUrl || ``).trim(),
      resourceName = String(
        nodeData.videoName ||
        nodeData.originalName ||
        nodeData.label ||
        nodeData.name ||
        (nodeType === `seedanceNode` ? `即梦视频结果` : nodeType === `tongyiWanxiangNode` ? `通义万相视频结果` : `AI生成视频`),
      ).trim();
    generatedResources.push({
      id: `generated-video-${node?.id || `node`}-${wanjuanStableResourceIdPart(videoUrl)}`,
      url: videoUrl,
      videoUrl: videoUrl,
      thumbnailUrl: posterUrl,
      type: `video/mp4`,
      timestamp: Date.now(),
      pageUrl: `canvas:${projectId || `default`}`,
      pageTitle: resourceName || `AI生成视频`,
      source: `generated`,
      sourceOrigin: `generated`,
      originalName: resourceName || ``,
    });
  });
  return generatedResources;
}
