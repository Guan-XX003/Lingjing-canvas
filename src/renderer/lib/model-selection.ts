import { WanJuanParseModelList, WanJuanSameModelId } from "./model-id";

export const WanJuanShouldAutoPreferredModel = (
  modelText: unknown,
  currentModel = ``,
  options: { manual?: boolean; auto?: boolean } = {},
) => {
  const models = Array.isArray(modelText)
    ? modelText.filter(Boolean)
    : WanJuanParseModelList(modelText);
  const rawFirstModel = models[0] || ``;
  const currentIsValid = !!currentModel && models.some((model) => WanJuanSameModelId(model, currentModel));
  if (!currentIsValid) return models.length > 0;
  if (options.manual === true) return false;
  return options.auto === true || !currentModel || !!(rawFirstModel && WanJuanSameModelId(currentModel, rawFirstModel));
};
