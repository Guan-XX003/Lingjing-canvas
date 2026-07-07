/**
 * 模型清单/配置小工具：模型加入清单去重、判定极信默认 API 配置、判定 XSee/Veo 参考视频模型。
 * 自 bundle 反混淆迁出，行为保持一致。
 */
import { WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID } from "./jixin-catalog";

export const isJixinDefaultApiConfig = (config) =>
	    config?.id === WANJUAN_JIXIN_DEFAULT_API_CONFIG_ID;

export const isXSeeVeoReferenceVideoModel = (modelName, apiUrl = ``) =>
    /^veo/i.test(String(modelName || ``).trim()) &&
    /(?:^|[-_])(portrait|landscape|fl|frame|reverse|gif|hd|4k|pro)(?:[-_]|$)/i.test(String(modelName || ``).trim()) &&
    /aigc\.x-see\.cn|x-see\.cn/i.test(String(apiUrl || ``));

export const ensureModelInList = (existing, addition) => {
      let lines = String(existing || ``)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
        trimmedLine = String(addition || ``).trim();
      return trimmedLine && !lines.includes(trimmedLine) && lines.push(trimmedLine), lines.join(`
`);
    };
