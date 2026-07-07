/** 视频模型设置面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanVideoModelSettingsPanel({
  apiConfigs,
  setVideoAspectRatios,
  setVideoDurations,
  setVideoModelApiBindings,
  setVideoModels,
  setVideoResolutions,
  videoAspectRatios,
  videoDurations,
  videoModelApiBindings,
  videoModels,
  videoResolutions,
}: any) {
  return jsxs(`div`, {
                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
                                children: [
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `模型名称 (支持多个，换行分隔)`,
                                      }),
                                      jsx(`textarea`, {
                                        value: videoModels,
                                        onChange: (event) =>
                                          setVideoModels(event.target.value),
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
                                        placeholder: `请输入视频模型名称`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `每个视频模型使用的 API 配置`,
                                      }),
                                      jsx(`div`, {
                                        className: `space-y-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                        children: videoModels
                                          .split(
                                            `
`,
                                          )
                                          .map((item) => item.trim())
                                          .filter((item) => item !== ``)
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
                                      jsx(`p`, {
                                        className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
                                        children: `建议为每个视频模型选择可调用它的 API 配置。`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `可选时长 (秒数，换行分隔)`,
                                      }),
                                      jsx(`textarea`, {
                                        value: videoDurations,
                                        onChange: (event) =>
                                          setVideoDurations(event.target.value),
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
                                        placeholder: `10
15`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `可选分辨率 (换行分隔)`,
                                      }),
                                      jsx(`textarea`, {
                                        value: videoResolutions,
                                        onChange: (event) =>
                                          setVideoResolutions(
                                            event.target.value,
                                          ),
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
                                        placeholder: `1280x720
	720x1280
	1080x720`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `可选比例 (换行分隔)`,
                                      }),
                                      jsx(`textarea`, {
                                        value: videoAspectRatios,
                                        onChange: (event) =>
                                          setVideoAspectRatios(
                                            event.target.value,
                                          ),
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
                                        placeholder: `16:9
9:16
1:1
3:2
2:3`,
                                      }),
                                    ],
                                  }),
                                ],
                              });
}
