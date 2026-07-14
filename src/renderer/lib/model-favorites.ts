/**
 * 收藏模型（favorite models）域。
 *
 * localStorage 持久化收藏清单；按收藏顺序排序模型；
 * 结合手动/自动策略推断首选模型；WanJuanUseFavoriteModels 为 React hook 封装。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { useState } from "react";
import { WanJuanNormalizeModelId, WanJuanSameModelId, WanJuanParseModelList } from "./model-id";
import { WanJuanShouldAutoPreferredModel } from "./model-selection";
export { WanJuanShouldAutoPreferredModel } from "./model-selection";

export const WanJuanFavoriteModelStoreKey = `wanjuan.favoriteModels.v1`;

export const WanJuanReadFavoriteModels = () => {
    try {
      let stored = localStorage.getItem(WanJuanFavoriteModelStoreKey);
      if (!stored) return [];
      let parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((model) => typeof model == `string` && model.trim()) : [];
    } catch {
      return [];
    }
	  };

export const WanJuanWriteFavoriteModels = (items) => {
	    try {
	      let seen = new Set(),
	        normalizedItems = [];
	      items.forEach((model) => {
	        let trimmedModel = String(model || ``).trim(),
	          normalizedModel = WanJuanNormalizeModelId(trimmedModel).toLowerCase();
	        trimmedModel && normalizedModel && !seen.has(normalizedModel) && (seen.add(normalizedModel), normalizedItems.push(trimmedModel));
	      });
	      localStorage.setItem(WanJuanFavoriteModelStoreKey, JSON.stringify(normalizedItems));
	    } catch {}
	  };

export const WanJuanSortModelsByFavorites = (models, favorites = WanJuanReadFavoriteModels()) => {
	    let favoriteRank = new Map();
	    favorites.forEach((model, index) => {
	      let normalizedModel = WanJuanNormalizeModelId(model).toLowerCase();
	      normalizedModel && !favoriteRank.has(normalizedModel) && favoriteRank.set(normalizedModel, index);
	    });
	    return [...models].sort((firstItem, secondItem) => {
	      let firstRank = favoriteRank.has(WanJuanNormalizeModelId(firstItem).toLowerCase()) ?
	          favoriteRank.get(WanJuanNormalizeModelId(firstItem).toLowerCase()) :
	          Number.POSITIVE_INFINITY,
	        secondRank = favoriteRank.has(WanJuanNormalizeModelId(secondItem).toLowerCase()) ?
	          favoriteRank.get(WanJuanNormalizeModelId(secondItem).toLowerCase()) :
	          Number.POSITIVE_INFINITY;
	      return firstRank !== secondRank ? firstRank - secondRank : 0;
	    });
	  };

export const WanJuanGetPreferredModel = (modelText, currentModel = ``, favorites = WanJuanReadFavoriteModels(), options: any = {}) => {
	    let models = Array.isArray(modelText) ? modelText.filter(Boolean) : WanJuanParseModelList(modelText),
	      sortedModels = WanJuanSortModelsByFavorites(models, favorites),
	      rawFirstModel = models[0] || ``,
	      preferredModel = sortedModels[0] || rawFirstModel || ``,
	      currentIsValid = currentModel && models.some((model) => WanJuanSameModelId(model, currentModel));
	    if (currentIsValid) {
	      if (options.manual === !0) return currentModel;
	      if (options.auto === !0) return preferredModel || currentModel;
	      if (rawFirstModel && !WanJuanSameModelId(currentModel, rawFirstModel)) return currentModel;
	    }
	    return preferredModel || currentModel || ``;
	  };

export const WanJuanUseFavoriteModels = () => {
    let [favorites, setFavorites] = useState(() => WanJuanReadFavoriteModels());
    return {
      favorites: favorites,
      isFavorite: (model) => favorites.some((favoriteModel) => WanJuanSameModelId(favoriteModel, model)),
      toggleFavorite: (model) => {
        let normalizedModel = WanJuanNormalizeModelId(model).toLowerCase(),
          next = favorites.some((model2) => WanJuanNormalizeModelId(model2).toLowerCase() === normalizedModel) ?
          favorites.filter((model2) => WanJuanNormalizeModelId(model2).toLowerCase() !== normalizedModel) :
          [model, ...favorites];
        return (WanJuanWriteFavoriteModels(next), setFavorites(next), next);
      },
      sortModels: (models) => WanJuanSortModelsByFavorites(models, favorites),
      parseModels: WanJuanParseModelList,
      getPreferredModel: (modelText, currentModel = ``, options: any = {}) =>
        WanJuanGetPreferredModel(modelText, currentModel, favorites, options),
      shouldAutoPreferredModel: (modelText, currentModel = ``, options: any = {}) =>
        WanJuanShouldAutoPreferredModel(modelText, currentModel, options),
    };
  };
