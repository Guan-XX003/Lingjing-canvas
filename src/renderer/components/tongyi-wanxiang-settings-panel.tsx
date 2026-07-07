/** 通义万相设置面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanTongyiWanxiangSettingsPanel({
  apiConfigs,
  setTongyiWanxiangDurations,
  setTongyiWanxiangEditModels,
  setTongyiWanxiangImageModels,
  setTongyiWanxiangRatios,
  setTongyiWanxiangReferenceImageModels,
  setTongyiWanxiangResolutions,
  setTongyiWanxiangTextModels,
  setVideoModelApiBindings,
  tongyiWanxiangDurations,
  tongyiWanxiangEditModels,
  tongyiWanxiangImageModels,
  tongyiWanxiangRatios,
  tongyiWanxiangReferenceImageModels,
  tongyiWanxiangResolutions,
  tongyiWanxiangTextModels,
  videoModelApiBindings,
}: any) {
  return jsxs(`div`, {
                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
                                children: [
                                  jsx(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-2 gap-3`,
                                    children: [{
                                        label: `文生视频模型`,
                                        value: tongyiWanxiangTextModels,
                                        onChange: setTongyiWanxiangTextModels,
                                        placeholder: `每行一个文生视频模型 ID`,
                                      },
                                      {
                                        label: `参考图生视频模型`,
                                        value: tongyiWanxiangReferenceImageModels,
                                        onChange: setTongyiWanxiangReferenceImageModels,
                                        placeholder: `每行一个参考图生视频模型 ID`,
                                      },
                                      {
                                        label: `图生视频模型`,
                                        value: tongyiWanxiangImageModels,
                                        onChange: setTongyiWanxiangImageModels,
                                        placeholder: `每行一个图生视频模型 ID`,
                                      },
                                      {
                                        label: `视频编辑模型`,
                                        value: tongyiWanxiangEditModels,
                                        onChange: setTongyiWanxiangEditModels,
                                        placeholder: `每行一个视频编辑模型 ID`,
                                      },
                                    ].map((field) =>
                                      jsxs(
                                        `label`, {
                                          className: `block`,
                                          children: [
                                            jsx(`div`, {
                                              className: `text-xs font-medium text-gray-500 mb-2`,
                                              children: field.label,
                                            }),
                                            jsx(`textarea`, {
                                              value: field.value,
                                              onChange: (event) =>
                                                field.onChange(event.target.value),
                                              className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[72px] resize-y`,
                                              placeholder: field.placeholder,
                                            }),
                                          ],
                                        },
                                        field.label,
                                      ),
                                    ),
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `每个通义万相模型使用的 API 配置`,
                                      }),
                                      jsx(`div`, {
                                        className: `space-y-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                        children: [
                                          tongyiWanxiangTextModels,
                                          tongyiWanxiangReferenceImageModels,
                                          tongyiWanxiangImageModels,
                                          tongyiWanxiangEditModels,
                                        ]
                                          .join(`
`)
                                          .split(/[\n,，、]+/)
                                          .map((item) => item.trim())
                                          .filter((value, index, array) => value !== `` && array.indexOf(value) === index)
                                          .map((model) =>
                                            jsxs(
                                              `div`, {
                                                className: `flex items-center gap-3`,
                                                children: [
                                                  jsx(`div`, {
                                                    className: `flex-1 text-xs text-gray-300 truncate`,
                                                    title: model,
                                                    children: model,
                                                  }),
                                                  jsxs(`select`, {
                                                    className: `w-52 bg-[#1a1a1a] border border-[#333] text-gray-300 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 hover:bg-[#222] transition-colors wanjuan-settings-control wanjuan-settings-select`,
                                                    value: videoModelApiBindings[
                                                      model
                                                    ] || ``,
                                                    onChange: (event) => {
                                                      let next = {
                                                        ...videoModelApiBindings,
                                                      };
                                                      event.target.value ?
                                                        (next[model] =
                                                          event.target.value) :
                                                        delete next[model];
                                                      setVideoModelApiBindings(
                                                        next,
                                                      );
                                                    },
                                                    children: [
                                                      jsx(
                                                        `option`, {
                                                          value: ``,
                                                          children: `未指定`,
                                                        },
                                                        `__default`,
                                                      ),
                                                      ...apiConfigs.map((apiConfig) =>
                                                        jsx(
                                                          `option`, {
                                                            value: apiConfig.id,
                                                            children: apiConfig.name ||
                                                              apiConfig.url,
                                                          },
                                                          apiConfig.id,
                                                        ),
                                                      ),
                                                    ],
                                                  }),
                                                ],
                                              },
                                              model,
                                            ),
                                          ),
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-3 gap-3`,
                                    children: [
                                      jsxs(`label`, {
                                        className: `block`,
                                        children: [
                                          jsx(`div`, {
                                            className: `text-xs font-medium text-gray-500 mb-2`,
                                            children: `视频时长 (秒)`,
                                          }),
                                          jsx(`textarea`, {
                                            value: tongyiWanxiangDurations,
                                            onChange: (event) =>
                                              setTongyiWanxiangDurations(
                                                event.target.value,
                                              ),
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
                                            placeholder: `2
5
10
15`,
                                          }),
                                        ],
                                      }),
                                      jsxs(`label`, {
                                        className: `block`,
                                        children: [
                                          jsx(`div`, {
                                            className: `text-xs font-medium text-gray-500 mb-2`,
                                            children: `模型档位`,
                                          }),
                                          jsx(`textarea`, {
                                            value: tongyiWanxiangResolutions,
                                            onChange: (event) =>
                                              setTongyiWanxiangResolutions(
                                                event.target.value,
                                              ),
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
                                            placeholder: `720P
1080P`,
                                          }),
                                        ],
                                      }),
                                      jsxs(`label`, {
                                        className: `block`,
                                        children: [
                                          jsx(`div`, {
                                            className: `text-xs font-medium text-gray-500 mb-2`,
                                            children: `视频比例`,
                                          }),
                                          jsx(`textarea`, {
                                            value: tongyiWanxiangRatios,
                                            onChange: (event) =>
                                              setTongyiWanxiangRatios(
                                                event.target.value,
                                              ),
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
                                            placeholder: `16:9
9:16
1:1
4:3
3:4`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              });
}
