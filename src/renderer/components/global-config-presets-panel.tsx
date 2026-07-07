/** 全局配置预设面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanGlobalConfigPresetsPanel({
  activeStoredGlobalConfigId,
  applyStoredGlobalConfig,
  configButlerDocUrl,
  saveStoredGlobalConfigApiDocUrl,
  setActiveStoredGlobalConfigId,
  setConfigButlerDocUrl,
  setStoredGlobalConfigs,
  storedGlobalConfigs,
}: any) {
  return jsxs(`div`, {
                                className: `px-4 pt-4 space-y-3 wanjuan-settings-card-body`,
                                children: [
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2`,
                                    children: [
                                      jsx(`select`, {
                                        className: `w-full border rounded-lg px-3 py-2 text-xs focus:outline-none wanjuan-settings-control wanjuan-settings-select`,
                                        value: activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
                                        onChange: (event) => {
                                          let selectedId = event.target.value,
                                            selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === selectedId);
                                          setActiveStoredGlobalConfigId(selectedId);
                                          selectedConfig && setConfigButlerDocUrl(String(selectedConfig.apiDocUrl || selectedConfig.config?.apiDocUrl || selectedConfig.config?.configButlerDocUrl || ``));
                                        },
                                        children: (storedGlobalConfigs || []).length ?
                                        (storedGlobalConfigs || []).map((config) =>
                                          jsx(
                                            `option`, {
                                              value: config.id,
                                              children: config.name,
                                            },
                                            config.id,
                                          ),
                                        ) :
                                        jsx(`option`, {
                                          value: ``,
                                          children: `暂无已存储配置`,
                                        }),
                                      }),
                                      jsx(`button`, {
                                        type: `button`,
                                        onClick: () => applyStoredGlobalConfig(activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``)),
                                        disabled: !(storedGlobalConfigs || []).length,
                                        className: `px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors wanjuan-settings-save-button wanjuan-stored-global-config-apply`,
                                        children: `应用配置`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2`,
                                    children: [
                                      jsx(`input`, {
                                        className: `w-full border rounded-lg px-3 py-2 text-xs focus:outline-none wanjuan-settings-control`,
                                        value: (() => {
                                          let configId = activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
                                            selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
                                          return String(selectedConfig?.apiDocUrl || selectedConfig?.config?.apiDocUrl || selectedConfig?.config?.configButlerDocUrl || configButlerDocUrl || ``);
                                        })(),
                                        onChange: (event) => {
                                          let configId = activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
                                            newValue = String(event.target.value || ``);
                                          setConfigButlerDocUrl(newValue);
                                          setStoredGlobalConfigs((prev) =>
                                            (prev || []).map((config) =>
                                              config.id === configId ? {
                                                ...config,
                                                apiDocUrl: newValue,
                                                config: {
                                                  ...(config.config || {}),
                                                  apiDocUrl: newValue,
                                                  configButlerDocUrl: newValue,
                                                },
                                              } : config,
                                            ),
                                          );
                                        },
                                        placeholder: `全局配置 API 文档链接，例如 https://dguhm2n0pd.apifox.cn/`,
                                      }),
                                      jsx(`button`, {
                                        type: `button`,
                                        onClick: () => {
                                          let configId = activeStoredGlobalConfigId || ((storedGlobalConfigs || [])[0]?.id || ``),
                                            selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
                                          saveStoredGlobalConfigApiDocUrl(configId, selectedConfig?.apiDocUrl || selectedConfig?.config?.apiDocUrl || selectedConfig?.config?.configButlerDocUrl || configButlerDocUrl || ``);
                                        },
                                        disabled: !(storedGlobalConfigs || []).length,
                                        className: `px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors wanjuan-settings-button`,
                                        children: `保存文档链接`,
                                      }),
                                    ],
                                  }),
                                  jsx(`div`, {
                                    className: `rounded-lg border px-3 py-2 text-[11px] leading-5 wanjuan-settings-note`,
                                    children: `切换会同步模型列表、API 绑定、协议配置和图片/视频参数适配规则；错误查询会优先读取当前已存储配置的 API 文档链接。`,
                                  }),
                                ],
                              });
}
