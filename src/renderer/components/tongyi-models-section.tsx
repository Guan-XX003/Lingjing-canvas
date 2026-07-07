/** 设置-models 通义万相模型分区。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { WanJuanTongyiWanxiangSettingsPanel } from "./tongyi-wanxiang-settings-panel";
declare const chrome: any;

export function WanJuanTongyiModelsSection({
  apiConfigs,
  setTongyiWanxiangDurations,
  setTongyiWanxiangEditModels,
  setTongyiWanxiangImageModels,
  setTongyiWanxiangRatios,
  setTongyiWanxiangReferenceImageModels,
  setTongyiWanxiangResolutions,
  setTongyiWanxiangSettingsExpanded,
  setTongyiWanxiangTextModels,
  setVideoModelApiBindings,
  tongyiWanxiangDurations,
  tongyiWanxiangEditModels,
  tongyiWanxiangImageModels,
  tongyiWanxiangRatios,
  tongyiWanxiangReferenceImageModels,
  tongyiWanxiangResolutions,
  tongyiWanxiangSettingsExpanded,
  tongyiWanxiangTextModels,
  videoModelApiBindings,
}: any) {
  return jsxs(`div`, {
                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
                            children: [
                              jsxs(`div`, {
                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
                                children: [
                                  jsxs(`h2`, {
                                    className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
                                    children: [
                                      jsx(`span`, {
                                        className: `wanjuan-skeuo-icon wanjuan-skeuo-icon-tongyi`,
                                        children: `🔮`,
                                      }),
                                      `通义万相`,
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      jsx(`div`, {
                                        className: `text-[10px] text-gray-500 hidden md:block`,
                                        children: `智创聚合 / v1/videos`,
                                      }),
                                      jsx(`button`, {
                                        type: `button`,
                                        onClick: () =>
                                          setTongyiWanxiangSettingsExpanded(
                                            !tongyiWanxiangSettingsExpanded,
                                          ),
                                        className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanjuan-settings-button wanjuan-settings-chip-button ${tongyiWanxiangSettingsExpanded ? `wanjuan-settings-chip-button-open` : ``}`,
                                        children: tongyiWanxiangSettingsExpanded ?
                                          `收起` :
                                          `展开`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              tongyiWanxiangSettingsExpanded &&
                              jsx(WanJuanTongyiWanxiangSettingsPanel, {
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
}),
                            ],
                          });
}
