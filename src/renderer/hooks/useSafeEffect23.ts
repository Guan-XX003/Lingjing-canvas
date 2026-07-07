// @ts-nocheck
/**
 * useSafeEffect23（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useSafeEffect23(deps: any) {
  const {
    apiConfigs,
    imageModelApiBindings,
    imageModelProtocolBindings,
    setImageModelProtocolBindings,
  } = deps;
  useEffect(() => {
	    let apiConfigId = imageModelApiBindings?.[`GPT-Image-2`],
	      apiConfig = apiConfigs.find((config) => config.id === apiConfigId),
      apiUrl = String(apiConfig?.url || ``)
      .replace(/\s+/g, ``)
      .replace(/\/$/, ``),
      protocolId = imageModelProtocolBindings?.[`GPT-Image-2`];
    if (
      /api\.wuyinkeji\.com\/api\/async\/image_gpt/i.test(apiUrl) &&
      protocolId !== `OpenAI 图片异步兼容`
    )
	      setImageModelProtocolBindings({
	        ...imageModelProtocolBindings,
	        [`GPT-Image-2`]: `OpenAI 图片异步兼容`,
	      });
	  }, [apiConfigs, imageModelApiBindings, imageModelProtocolBindings]);
}
