/**
 * 极心（Jixin）内置模型目录 —— Seedance 部分。
 *
 * 万卷灵境接入极心一站式 API 时的内置候选清单：Seedance 视频模型、
 * 时长、分辨率与画幅比例。设置面板与天玑（Tianji）Seedance 默认配置均以此为底。
 *
 * 另含 wanjuanMergeModelText：把若干模型清单（数组或以换行/逗号/顿号分隔的文本）
 * 合并去重为换行分隔文本，用于合并内置清单与用户自定义清单。
 */

/** 极心内置的天玑 Seedance 视频模型清单。 */
export const WANJUAN_JIXIN_BUILTIN_TIANJI_SEEDANCE_MODELS = [
  `doubao-seedance-2-0-260128`,
  `doubao-seedance-2-0-fast-260128`,
];

/** 极心内置的 Seedance 可选时长（秒），换行分隔。 */
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_DURATIONS = `4
5
6
7
8
9
10
11
12
13
14
15`;

/** 极心内置的 Seedance 可选分辨率，换行分隔。 */
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_RESOLUTIONS = `480p
720p
1080p`;

/** 极心内置的 Seedance 可选画幅比例，换行分隔。 */
export const WANJUAN_JIXIN_BUILTIN_SEEDANCE_RATIOS = `21:9
16:9
4:3
1:1
3:4
9:16`;

/**
 * 合并多份模型清单并去重。
 * 每个入参可以是数组，或以换行/半角逗号/全角逗号/顿号分隔的文本；
 * 输出保持首次出现顺序、以换行分隔的清单文本。
 */
export const wanjuanMergeModelText = (...inputs: any[]): string => {
  let seen = new Set<string>(),
    models: string[] = [];
  inputs.forEach((input) => {
    (Array.isArray(input) ? input : String(input || ``).split(/[\n,，、]+/))
      .map((model) => String(model || ``).trim())
      .filter(Boolean)
      .forEach((model) => {
        if (seen.has(model)) return;
        seen.add(model);
        models.push(model);
      });
  });
  return models.join(`
`);
};
