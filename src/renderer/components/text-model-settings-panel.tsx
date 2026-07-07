/** 文本模型设置面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanTextModelSettingsPanel({
  _e,
  apiConfigs,
  setTextModelApiBindings,
  textModelApiBindings,
  textModels,
}: any) {
  return jsxs(`div`, {
                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
                                children: [
                                  jsx(`label`, {
                                    className: `block text-xs font-medium text-gray-500 mb-2`,
                                    children: `模型名称 (支持多个，换行分隔)`,
                                  }),
                                  jsx(`textarea`, {
                                    value: textModels,
                                    onChange: (event) => _e(event.target.value),
                                    className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
                                    placeholder: `请输入文本模型名称`,
                                  }),
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `每个文本模型使用的 API 配置`,
                                      }),
                                      jsx(`div`, {
                                        className: `space-y-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                        children: textModels
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
                                                    value: textModelApiBindings[
                                                      model
                                                    ] || ``,
                                                    onChange: (event) => {
                                                      let next = {
                                                        ...textModelApiBindings,
                                                      };
                                                      event.target.value ?
                                                        (next[model] =
                                                          event.target.value) :
                                                        delete next[model];
                                                      setTextModelApiBindings(
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
                                        children: `建议为每个文本模型选择可调用它的 API 配置。`,
                                      }),
                                    ],
                                  }),
                                ],
                              });
}
