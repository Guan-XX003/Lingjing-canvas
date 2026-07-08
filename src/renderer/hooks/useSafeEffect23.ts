/**
 * useSafeEffect23（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { ApiBindings, ApiConfig, ProtocolBindings, SetAny } from "../lib/app-types";

interface UseSafeEffect23Deps {
  apiConfigs: ApiConfig[];
  imageModelApiBindings: ApiBindings;
  imageModelProtocolBindings: ProtocolBindings;
  setImageModelProtocolBindings: SetAny;
}

export function useSafeEffect23(deps: UseSafeEffect23Deps) {
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
