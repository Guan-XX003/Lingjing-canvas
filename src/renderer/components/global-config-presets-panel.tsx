/** 全局配置预设面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { WANJUAN_CUSTOM_EMPTY_GLOBAL_CONFIG_ID } from "../lib/global-config";
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
  const hasStoredConfig = (configId) =>
    (storedGlobalConfigs || []).some((config) => config.id === configId);
  const fallbackConfigId = hasStoredConfig(activeStoredGlobalConfigId) ?
    activeStoredGlobalConfigId :
    ((storedGlobalConfigs || [])[0]?.id || ``);
  const [selectedConfigId, setSelectedConfigId] = useState(fallbackConfigId);
  useEffect(() => {
    if (hasStoredConfig(activeStoredGlobalConfigId)) setSelectedConfigId(activeStoredGlobalConfigId);
  }, [activeStoredGlobalConfigId]);
  useEffect(() => {
    if (hasStoredConfig(selectedConfigId)) return;
    setSelectedConfigId(hasStoredConfig(activeStoredGlobalConfigId) ? activeStoredGlobalConfigId : ((storedGlobalConfigs || [])[0]?.id || ``));
  }, [storedGlobalConfigs, selectedConfigId, activeStoredGlobalConfigId]);
  const isCustomEmptyMode = activeStoredGlobalConfigId === WANJUAN_CUSTOM_EMPTY_GLOBAL_CONFIG_ID;
  return jsxs(`div`, {
                                className: `px-4 pt-4 space-y-3 wanjuan-settings-card-body wanjuan-global-config-presets-panel`,
                                children: [
                                  jsxs(`div`, {
                                    className: `space-y-2`,
                                    children: [
                                      jsx(`select`, {
                                        className: `w-full border rounded-lg px-3 py-2 text-xs focus:outline-none wanjuan-settings-control wanjuan-settings-select`,
                                        value: selectedConfigId,
                                        onChange: (event) => {
                                          setSelectedConfigId(event.target.value);
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
                                      jsxs(`div`, {
                                        className: `grid grid-cols-2 gap-2`,
                                        children: [
                                          jsx(`button`, {
                                            type: `button`,
                                            onClick: () => applyStoredGlobalConfig(selectedConfigId),
                                            disabled: !selectedConfigId,
                                            className: `px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors wanjuan-settings-save-button wanjuan-stored-global-config-apply`,
                                            children: `应用所选配置`,
                                          }),
                                          jsx(`button`, {
                                            type: `button`,
                                            onClick: () => applyStoredGlobalConfig(WANJUAN_CUSTOM_EMPTY_GLOBAL_CONFIG_ID),
                                            className: `px-3 py-2 rounded-lg text-xs font-medium transition-colors wanjuan-settings-button wanjuan-custom-empty-config-button ${isCustomEmptyMode ? `wanjuan-settings-chip-button-open` : ``}`,
                                            children: isCustomEmptyMode ? `当前：自定义配置（空白）` : `自定义配置（空白）`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2`,
                                    children: [
                                      jsx(`input`, {
                                        className: `w-full border rounded-lg px-3 py-2 text-xs focus:outline-none wanjuan-settings-control`,
                                        disabled: !selectedConfigId,
                                        value: (() => {
                                          let configId = selectedConfigId,
                                            selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
                                          return String(
                                            selectedConfig?.apiDocUrl ??
                                            selectedConfig?.config?.apiDocUrl ??
                                            selectedConfig?.config?.configButlerDocUrl ??
                                            (configId === activeStoredGlobalConfigId ? configButlerDocUrl : ``) ??
                                            ``,
                                          );
                                        })(),
                                        onChange: (event) => {
                                          let configId = selectedConfigId,
                                            newValue = String(event.target.value || ``);
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
                                          let configId = selectedConfigId,
                                            selectedConfig = (storedGlobalConfigs || []).find((config) => config.id === configId);
                                          saveStoredGlobalConfigApiDocUrl(
                                            configId,
                                            selectedConfig?.apiDocUrl ??
                                              selectedConfig?.config?.apiDocUrl ??
                                              selectedConfig?.config?.configButlerDocUrl ??
                                              (configId === activeStoredGlobalConfigId ? configButlerDocUrl : ``) ??
                                              ``,
                                          );
                                        },
                                        disabled: !selectedConfigId || !(storedGlobalConfigs || []).length,
                                        className: `px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors wanjuan-settings-button`,
                                        children: `保存文档链接`,
                                      }),
                                    ],
                                  }),
                                  jsx(`div`, {
                                    className: `rounded-lg border px-3 py-2 text-[11px] leading-5 wanjuan-settings-note`,
                                    children: `应用所选配置会同步模型、API、绑定和协议；自定义配置（空白）只清除当前配置，已保存配置及比例、分辨率、时长等模型参数保持不变。`,
                                  }),
                                ],
                              });
}
