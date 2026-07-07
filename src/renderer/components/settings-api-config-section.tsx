/** 设置-API 配置分区（api 标签页主体）。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { Trash2 } from "lucide-react";
declare const chrome: any;

export function WanJuanSettingsApiConfigSection({
  apiConfigs,
  resetJixinDefaultConfiguration,
  setApiConfigs,
}: any) {
  return jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 select-none border-b border-[#222]`,
                                children: [
                                  jsxs(`div`, {
                                    className: `min-w-0`,
                                    children: [
                                      jsxs(`h2`, {
                                        className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                        children: [
                                          jsx(`span`, {
                                            className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-api`,
                                            children: `🔐`,
                                          }),
                                          ` 统一 API 配置`,
                                        ],
                                      }),
                                      jsx(`p`, {
                                        className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help`,
                                        children: `先维护供应商 Base URL 和 Key，再在下方按模型类型绑定具体调用方式。`,
                                      }),
                                    ],
                                  }),
                                  jsx(`button`, {
                                    type: `button`,
                                    onClick: resetJixinDefaultConfiguration,
                                    className: `shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200 hover:bg-red-500/15 hover:border-red-400/45 hover:text-red-100 transition-colors wanjuan-settings-reset-api-button`,
                                    title: `清除当前 API 与模型配置，恢复极鑫默认基础配置`,
                                    children: `恢复默认配置`,
                                  }),
                                ],
                              }),
                              jsxs(`div`, {
                                className: `px-4 space-y-3 pt-4`,
                                children: [
                                  apiConfigs.map((config, index) =>
                                    jsxs(
                                      `div`, {
                                        className: `flex items-center gap-3 bg-[#222] rounded-lg p-2 relative group/item border border-transparent hover:border-[#333] transition-colors`,
                                        children: [
                                          jsx(`div`, {
                                            className: `w-1/4`,
                                            children: jsx(
                                              `input`, {
                                                className: `w-full bg-transparent border-b border-[#444] px-1 py-1.5 text-xs text-gray-200 focus:border-blue-500 outline-none placeholder-gray-600 transition-colors`,
                                                placeholder: `配置名称 (例: API Studio)`,
                                                value: config.name,
                                                onChange: (event) => {
                                                  let next = [...apiConfigs];
                                                  ((next[index].name =
                                                      event.target.value),
                                                    setApiConfigs(next));
                                                },
                                              },
                                            ),
                                          }),
                                          jsx(`div`, {
                                            className: `w-1/3`,
                                            children: jsx(
                                              `input`, {
                                                className: `w-full bg-transparent border-b border-[#444] px-1 py-1.5 text-xs text-gray-200 focus:border-blue-500 outline-none placeholder-gray-600 transition-colors`,
                                                placeholder: `Base URL`,
                                                value: config.url,
                                                onChange: (event) => {
                                                  let next = [...apiConfigs];
                                                  ((next[index].url =
                                                      event.target.value),
                                                    setApiConfigs(next));
                                                },
                                              },
                                            ),
                                          }),
                                          jsx(`div`, {
                                            className: `flex-1 relative`,
                                            children: jsx(
                                              `input`, {
                                                className: `w-full bg-transparent border-b border-[#444] px-1 py-1.5 pr-8 text-xs text-gray-200 focus:border-blue-500 outline-none placeholder-gray-600 transition-colors`,
                                                placeholder: `密钥 (sk-...)`,
                                                type: config.id === `show_temp` ?
                                                  `text` :
                                                  `password`,
                                                value: config.key,
                                                onChange: (event) => {
                                                  let next = [...apiConfigs];
                                                  ((next[index].key =
                                                      event.target.value),
                                                    setApiConfigs(next));
                                                },
                                                onFocus: (event) =>
                                                  (event.target.type = `text`),
                                                onBlur: (event) =>
                                                  (event.target.type = `password`),
                                              },
                                            ),
                                          }),
                                          jsx(`div`, {
                                            className: `w-[130px]`,
                                            children: jsx(
                                              `select`, {
                                                className: `w-full bg-transparent border-b border-[#444] px-1 py-1.5 text-xs text-gray-200 focus:border-blue-500 outline-none appearance-none cursor-pointer`,
                                                value: config.protocolFormat || `auto`,
                                                onChange: (event) => {
                                                  let next = [...apiConfigs];
                                                  ((next[index].protocolFormat = event.target.value), setApiConfigs(next));
                                                },
                                                children: [
	                                                  jsx(`option`, { value: `auto`, children: `自动检测` }),
	                                                  jsx(`option`, { value: `openai-chat`, children: `OpenAI Chat` }),
	                                                  jsx(`option`, { value: `claude-messages`, children: `Claude Messages` }),
	                                                  jsx(`option`, { value: `gemini-generate-content`, children: `Gemini 原生` }),
                                                  jsx(`option`, { value: `openai-images`, children: `OpenAI 图片` }),
                                                  jsx(`option`, { value: `openai-video`, children: `OpenAI 视频` }),
                                                  jsx(`option`, { value: `json-video`, children: `JSON 视频` }),
                                                  jsx(`option`, { value: `multipart-video`, children: `表单视频` }),
                                                  jsx(`option`, { value: `seedance-json`, children: `Seedance` }),
                                                ],
                                              },
                                            ),
                                          }),
                                          jsx(`button`, {
                                            onClick: () => {
                                              let next = [...apiConfigs];
                                              (next.splice(index, 1), setApiConfigs(next));
                                            },
                                            className: `wanjuan-danger-icon-action text-red-400 hover:text-red-300 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity`,
                                            title: `删除配置`,
                                            children: jsx(Trash2, {
                                              size: 14,
                                            }),
                                          }),
                                        ],
                                      },
                                      config.id,
                                    ),
                                  ),
	                                  jsx(`button`, {
	                                    onClick: () => {
	                                      setApiConfigs([
	                                        ...apiConfigs,
	                                        {
                                          id: Date.now().toString(),
                                          name: ``,
                                          url: ``,
                                          key: ``,
                                          protocolFormat: `auto`,
	                                        },
	                                      ]);
	                                    },
	                                    className: `w-full py-2 rounded-lg transition-colors text-xs font-medium bg-[#222] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`,
	                                    children: `+ 添加统一配置`,
	                                  }),
                                ],
                              }),
                            ],
                          });
}
