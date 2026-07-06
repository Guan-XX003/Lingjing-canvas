/**
 * 模型 id 归一化与比较工具。
 *
 * 用户配置里的模型清单常含全角标点、零宽字符、各类连字符变体，
 * 这里统一做 NFKC 归一化 + 零宽字符清除 + 连字符统一，
 * 供模型选择、清单解析与去重使用。
 */

/**
 * 归一化模型 id：取清单文本的首个条目，NFKC 归一化，
 * 去零宽字符（U+200B–U+200D、U+FEFF），把各类连字符变体（U+2010–U+2015、U+2212）统一为 "-"。
 */
export const WanJuanNormalizeModelId = (input: any): string => {
  let modelName =
    String(input || ``).split(/[\n,，、]+/).map((part) => part.trim()).filter(Boolean)[0] ||
    String(input || ``).trim();
  try {
    modelName = modelName.normalize(`NFKC`);
  } catch {}
  return modelName.replace(/[\u200B-\u200D\uFEFF]/g, ``).replace(/[\u2010-\u2015\u2212]/g, `-`).trim();
};

/** 判断两个模型 id 归一化后（忽略大小写）是否相同。 */
export const WanJuanSameModelId = (firstModel: any, secondModel: any): boolean =>
  WanJuanNormalizeModelId(firstModel).toLowerCase() === WanJuanNormalizeModelId(secondModel).toLowerCase();

/** 把清单文本解析为模型数组：按分隔符拆分、归一化去重（保留原始写法与顺序）。 */
export const WanJuanParseModelList = (input: any): string[] => {
  let seen = new Set<string>(),
    models: string[] = [];
  String(input || ``)
    .split(/[\n,，、]+/)
    .map((model) => model.trim())
    .filter(Boolean)
    .forEach((model) => {
      let normalizedModel = WanJuanNormalizeModelId(model).toLowerCase();
      normalizedModel && !seen.has(normalizedModel) && (seen.add(normalizedModel), models.push(model));
    });
  return models;
};
