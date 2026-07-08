/**
 * useSafeEffect7（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SetState, WjNode } from "../lib/app-types";

interface UseSafeEffect7Deps {
  setNodes: SetState<WjNode[]>;
  wanjuanResourceLocalUrlMap: any;
}

export function useSafeEffect7(deps: UseSafeEffect7Deps) {
  const {
    setNodes,
    wanjuanResourceLocalUrlMap,
  } = deps;
  useEffect(() => {
	      if (wanjuanResourceLocalUrlMap.size === 0) return;
	      setNodes((nodes2) => {
	        let changed = false,
	          nextNodes = nodes2.map((node) => {
	            if (!node?.data) return node;
	            let nextData = null;
	            [`imageUrl`, `videoUrl`, `audioUrl`].forEach((field) => {
	              let currentValue = node.data[field],
	                binding = node.data.projectAssetBindings?.[field],
	                replacement =
	                  (typeof currentValue == `string` ? wanjuanResourceLocalUrlMap.get(currentValue) : null) ||
	                  (binding?.assetId ? wanjuanResourceLocalUrlMap.get(`asset:${binding.assetId}`) : null) ||
	                  (binding?.sha256 ? wanjuanResourceLocalUrlMap.get(`sha256:${binding.sha256}`) : null);
		              if (!replacement) return;
		              let resourceBinding = replacement.resource?.projectAssetBinding,
		                shouldUpdateValue = replacement.url !== currentValue,
		                shouldRefreshBinding =
		                  !!resourceBinding?.localPath &&
		                  (binding?.missing || binding?.localPath !== resourceBinding.localPath);
		              if (!shouldUpdateValue && !shouldRefreshBinding) return;
		              nextData ||
		                (nextData = {
		                  ...node.data,
	                  projectAssetBindings: {
	                    ...(node.data.projectAssetBindings || {}),
		                  },
		                });
		              shouldUpdateValue && (nextData[field] = replacement.url);
		              if (resourceBinding?.localPath)
		                nextData.projectAssetBindings[field] = {
		                  ...(nextData.projectAssetBindings[field] || {}),
		                  ...resourceBinding,
		                  field,
		                  kind: field === `videoUrl` ? `video` : field === `audioUrl` ? `audio` : `image`,
		                  valueFormat: `file-url`,
		                  sourceSignature: currentValue,
		                  missing: false,
		                  lastCheckedAt: new Date().toISOString(),
		                };
	              changed = true;
	            });
	            return nextData ? {
	              ...node,
	              data: nextData,
	            } : node;
	        });
	        return changed ? nextNodes : nodes2;
	      });
	    }, [wanjuanResourceLocalUrlMap, setNodes]);
}
