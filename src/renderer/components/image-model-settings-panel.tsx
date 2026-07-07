/** 图像模型设置面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanImageModelSettingsPanel({
  apiConfigs,
  imageCompatResolutions,
  imageModelApiBindings,
  imageModels,
  setImageCompatResolutions,
  setImageModelApiBindings,
  setImageModels,
}: any) {
  return jsxs(`div`, {
                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
                                children: [
                                  jsx(`label`, {
                                    className: `block text-xs font-medium text-gray-500 mb-2`,
                                    children: `模型名称 (支持多个，换行分隔)`,
                                  }),
	                                  jsx(`textarea`, {
	                                    value: imageModels,
	                                    onChange: (event) => setImageModels(event.target.value),
	                                    className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
	                                    placeholder: `请输入图像模型名称`,
	                                  }),
	                                  jsxs(`div`, {
	                                    children: [
	                                      jsx(`label`, {
	                                        className: `block text-xs font-medium text-gray-500 mb-2`,
	                                        children: `兼容分辨率（换行分隔）`,
		                                      }),
		                                      jsx(`textarea`, {
		                                        value: imageCompatResolutions,
		                                        onChange: (event) => setImageCompatResolutions(event.target.value),
		                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] resize-y`,
	                                        placeholder: `1024x1024
1280x720
720x1280
2048x2048
2560x1440
1440x2560
3840x2160
2160x3840`,
	                                      }),
	                                      jsx(`p`, {
	                                        className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                        children: `图像节点切到兼容模式后，会把这里选择的真实分辨率直接作为 size 发送。`,
	                                      }),
	                                    ],
	                                  }),
	                                  jsxs(`div`, {
	                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `每个图像模型使用的 API 配置`,
                                      }),
                                      jsx(`div`, {
                                        className: `space-y-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                        children: imageModels
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
                                                    value: imageModelApiBindings[
                                                      model
                                                    ] || ``,
                                                    onChange: (event) => {
                                                      let next = {
                                                        ...imageModelApiBindings,
                                                      };
                                                      event.target.value ?
                                                        (next[model] =
                                                          event.target.value) :
                                                        delete next[model];
                                                      setImageModelApiBindings(
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
                                        children: `建议为每个图像模型选择可调用它的 API 配置。`,
                                      }),
                                    ],
                                  }),
                                ],
                              });
}
