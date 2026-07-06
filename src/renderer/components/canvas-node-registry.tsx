/**
 * 画布节点/连线类型注册表、起始画布与套餐配额。
 *
 * WANJUAN_NODE_TYPES：React Flow nodeTypes（各节点组件按类型注册，多数经 WanJuanWithRenderMode 包裹渲染分层）。
 * WANJUAN_EDGE_TYPES：edgeTypes（default/custom 均用 WanJuanFlowEdge）。
 * wanjuanCreateStarterCanvas / WANJUAN_STARTER_EDGES / wanjuanIsDefaultStarterCanvas：新建项目的默认画布与判定。
 * WANJUAN_PLAN_LIMITS：套餐每日生成配额。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { WanJuanWithRenderMode } from "./render-mode";
import { WanJuanImageNode } from "./image-node";
import { WanJuanPromptNode } from "./prompt-node";
import { WanJuanTextNode } from "./text-node";
import { WanJuanImageCropNode } from "./image-crop-node";
import { WanJuanGridSplitNode } from "./grid-split-node";
import { WanJuanGridMergeNode } from "./grid-merge-node";
import { WanJuanVideoNode } from "./video-node";
import { WanJuanTtsMusicNode, WanJuanUnifiedAudioNode } from "./audio-nodes";
import { WanJuanCustomApiNode } from "./custom-api-node";
import { WanJuanVideoExtractNode } from "./video-extract-node";
import { WanJuanTextConcatNode } from "./text-concat-node";
import { WanJuanUrlToImageNode } from "./url-to-image-node";
import { WanJuanFileToLinkNode } from "./file-to-link-node";
import { WanJuanVideoFaceBlurNode } from "./video-face-blur-node";
import { WanJuanQwenTtsCloneNode } from "./qwen-tts-clone-node";
import { WanJuanRealEsrganVideoNode } from "./real-esrgan-video-node";
import { WanJuanFlowEdge } from "./flow-edge";

export const WANJUAN_NODE_TYPES = {
    imageNode: WanJuanWithRenderMode(WanJuanImageNode, `imageNode`),
    promptNode: WanJuanWithRenderMode(WanJuanPromptNode, `promptNode`),
    textNode: WanJuanWithRenderMode(WanJuanTextNode, `textNode`),
    cropNode: WanJuanImageCropNode,
    gridSplitNode: WanJuanGridSplitNode,
    gridMergeNode: WanJuanGridMergeNode,
    videoNode: WanJuanWithRenderMode(WanJuanVideoNode, `videoNode`),
    seedanceNode: WanJuanWithRenderMode(WanJuanVideoNode, `seedanceNode`),
    tongyiWanxiangNode: WanJuanWithRenderMode(WanJuanVideoNode, `tongyiWanxiangNode`),
    audioNode: WanJuanWithRenderMode(WanJuanUnifiedAudioNode, `audioNode`),
    musicNode: WanJuanWithRenderMode(WanJuanTtsMusicNode, `musicNode`),
    ttsMusicNode: WanJuanWithRenderMode(WanJuanTtsMusicNode, `ttsMusicNode`),
    customNode: WanJuanCustomApiNode,
	    videoExtractNode: WanJuanWithRenderMode(WanJuanVideoExtractNode, `videoExtractNode`),
	    textConcatNode: WanJuanTextConcatNode,
	    urlToImageNode: WanJuanUrlToImageNode,
	    fileToLinkNode: WanJuanFileToLinkNode,
	    videoFaceBlurNode: WanJuanWithRenderMode(WanJuanVideoFaceBlurNode, `videoFaceBlurNode`),
	    qwenTtsCloneNode: WanJuanWithRenderMode(WanJuanQwenTtsCloneNode, `qwenTtsCloneNode`),
	    realEsrganVideoNode: WanJuanWithRenderMode(WanJuanRealEsrganVideoNode, `realEsrganVideoNode`),
	  };
export const WANJUAN_EDGE_TYPES = {
	    default: WanJuanFlowEdge,
	    custom: WanJuanFlowEdge,
	  };
export const wanjuanCreateStarterCanvas = () => [{
    id: `demo-prompt-1`,
    type: `promptNode`,
    position: {
      x: 500,
      y: 300
    },
    data: {
      prompt: ``,
      expanded: !0
    },
    style: {
      width: 224,
      height: 224
    },
  }, ];
export const WANJUAN_STARTER_EDGES = [];
export const wanjuanIsDefaultStarterCanvas = (nodes: any, t: any = []) => {
    if (!Array.isArray(nodes) || nodes.length !== 1) return !1;
    let firstNode = nodes[0];
    return firstNode?.id === `demo-prompt-1` &&
      firstNode?.type === `promptNode` &&
      String(firstNode?.data?.prompt || ``).trim() === `` &&
      (!Array.isArray(t) || t.length === 0);
  };
export const WANJUAN_PLAN_LIMITS = {
    FREE: {
      dailyGenerations: 999999
    },
    PRO: {
      dailyGenerations: 999999
    },
    VIP: {
      dailyGenerations: 999999
    },
  };
