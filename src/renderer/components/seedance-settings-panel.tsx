/** Seedance 模型设置面板（含人像库）。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
import { wanjuanUseBrokenResourceImage } from "../lib/resource-tabs";
import { wanjuanSeedanceAssetUrl } from "../lib/seedance";
declare const chrome: any;

export function WanJuanSeedanceSettingsPanel({
  apiConfigs,
  applyTianjiSeedanceSettingsMode,
  editSeedancePortrait,
  handleSeedancePortraitFile,
  removeSeedancePortrait,
  resetSeedancePortraitForm,
  saveSeedancePortraitForm,
  seedanceDurations,
  seedanceEnableWebSearch,
  seedanceGenerateAudio,
  seedanceModel,
  seedancePortraitEditingId,
  seedancePortraitFileInputRef,
  seedancePortraitForm,
  seedancePortraitLibraryExpanded,
  seedanceRatios,
  seedanceResolutions,
  seedanceVirtualPortraits,
  seedanceWatermark,
  setSeedanceDurations,
  setSeedanceEnableWebSearch,
  setSeedanceGenerateAudio,
  setSeedanceModel,
  setSeedancePortraitForm,
  setSeedancePortraitLibraryExpanded,
  setSeedanceRatios,
  setSeedanceResolutions,
  setSeedanceWatermark,
  setTianjiSeedanceModel,
  setVideoModelApiBindings,
  tianjiSeedanceModel,
  tianjiSeedanceSettingsMode,
  videoModelApiBindings,
}: any) {
  return jsxs(`div`, {
	                                className: `px-4 pt-4 space-y-4 wanjuan-settings-card-body`,
	                                children: [
		                                  true ?
	                                    jsxs(`div`, {
	                                      className: `wanjuan-tianji-mode-row is-unlocked flex items-center justify-between gap-3 rounded-lg border border-[#333] bg-[#121212] px-3 py-2`,
	                                      children: [
	                                        jsxs(`div`, {
	                                          className: `min-w-0`,
	                                          children: [
	                                            jsx(`div`, {
	                                              className: `wanjuan-tianji-mode-row-title`,
	                                              children: `工作模式`,
	                                            }),
	                                            jsx(`div`, {
	                                              className: `wanjuan-tianji-mode-row-help`,
	                                              children: `选择普通即梦配置或天玑模式配置`,
	                                            }),
	                                          ],
	                                        }),
	                                        jsxs(`span`, {
	                                          className: `wanjuan-tianji-mode-switch inline-flex items-center gap-1 rounded-lg border border-[#333] bg-[#181818] p-1`,
	                                          "data-wanjuan-tianji-mode-switch": `true`,
	                                          children: [
	                                            jsx(`button`, {
	                                              type: `button`,
	                                              "data-tianji-mode": `official`,
	                                              "aria-pressed": tianjiSeedanceSettingsMode === `official` ? `true` : `false`,
	                                              onClick: () => applyTianjiSeedanceSettingsMode(`official`),
	                                              className: `wanjuan-tianji-mode-option ${tianjiSeedanceSettingsMode === `official` ? `is-active` : ``}`,
	                                              children: `普通模式`,
	                                            }),
	                                            jsx(`button`, {
	                                              type: `button`,
	                                              "data-tianji-mode": `tianji`,
	                                              "aria-pressed": tianjiSeedanceSettingsMode === `tianji` ? `true` : `false`,
	                                              onClick: () => applyTianjiSeedanceSettingsMode(`tianji`),
	                                              className: `wanjuan-tianji-mode-option ${tianjiSeedanceSettingsMode === `tianji` ? `is-active` : ``}`,
	                                              children: `天玑模式`,
	                                            }),
	                                          ],
	                                        }),
	                                      ],
	                                    }) :
	                                    jsxs(`div`, {
	                                      className: `wanjuan-tianji-mode-locked-field`,
	                                      children: [
	                                        jsx(`label`, {
	                                          className: `block text-xs font-medium text-gray-500 mb-2`,
	                                          children: `工作模式`,
	                                        }),
	                                        jsx(`div`, {
	                                          className: `wanjuan-tianji-mode-readonly w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300`,
	                                          "aria-label": `当前工作模式：普通模式`,
	                                          children: `普通模式`,
	                                        }),
	                                      ],
	                                    }),
		                                  jsxs(`div`, {
		                                    className: `wanjuan-seedance-mode-model-settings`,
		                                    children: [
	                                      jsx(`label`, {
	                                        className: `block text-xs font-medium text-gray-500 mb-2`,
	                                        children: tianjiSeedanceSettingsMode === `tianji` ? `天玑模式模型 ID (换行分隔)` : `普通模式模型 ID (换行分隔)`,
	                                      }),
                                      jsx(`textarea`, {
                                        value: tianjiSeedanceSettingsMode === `tianji` ? tianjiSeedanceModel : seedanceModel,
                                        onChange: (event) =>
                                          tianjiSeedanceSettingsMode === `tianji` ?
                                          setTianjiSeedanceModel(event.target.value) :
                                          setSeedanceModel(event.target.value),
                                        className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[72px] resize-y`,
                                        placeholder: tianjiSeedanceSettingsMode === `tianji` ? `每行一个天玑 Seedance 模型 ID` : `每行一个普通即梦模型 ID`,
                                      }),
                                    ],
                                  }),
                                  tianjiSeedanceSettingsMode !== `tianji` &&
                                  jsxs(`div`, {
                                    children: [
                                      jsx(`label`, {
                                        className: `block text-xs font-medium text-gray-500 mb-2`,
                                        children: `每个即梦模型使用的 API 配置`,
                                      }),
                                      jsx(`div`, {
                                        className: `space-y-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                        children: seedanceModel
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
                                        children: `普通模式建议为每个即梦模型选择可调用它的 API 配置；节点里也可以再单独覆盖。`,
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-3 gap-3`,
                                    children: [
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `block text-xs font-medium text-gray-500 mb-2`,
                                            children: `视频时长 (秒)`,
                                          }),
                                          jsx(`textarea`, {
                                            value: seedanceDurations,
                                            onChange: (event) =>
                                              setSeedanceDurations(
                                                event.target.value,
                                              ),
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
                                            placeholder: `5
10
11`,
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `block text-xs font-medium text-gray-500 mb-2`,
                                            children: `分辨率`,
                                          }),
                                          jsx(`textarea`, {
                                            value: seedanceResolutions,
                                            onChange: (event) =>
                                              setSeedanceResolutions(
                                                event.target.value,
                                              ),
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
                                            placeholder: `480p
720p
1080p`,
                                          }),
                                        ],
                                      }),
                                      jsxs(`div`, {
                                        children: [
                                          jsx(`label`, {
                                            className: `block text-xs font-medium text-gray-500 mb-2`,
                                            children: `视频比例`,
                                          }),
                                          jsx(`textarea`, {
                                            value: seedanceRatios,
                                            onChange: (event) =>
                                              setSeedanceRatios(
                                                event.target.value,
                                              ),
                                            className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
                                            placeholder: `21:9
16:9
4:3
1:1
3:4
9:16`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#121212] border border-[#333] rounded-lg p-3`,
                                    children: [
                                      jsxs(`label`, {
                                        className: `flex items-center gap-2 text-xs text-gray-300`,
                                        children: [
                                          jsx(`input`, {
                                            type: `checkbox`,
                                            checked: seedanceGenerateAudio,
                                            onChange: (event) =>
                                              setSeedanceGenerateAudio(
                                                event.target.checked,
                                              ),
                                          }),
                                          `生成同步声音`,
                                        ],
                                      }),
                                      jsxs(`label`, {
                                        className: `flex items-center gap-2 text-xs text-gray-300`,
                                        children: [
                                          jsx(`input`, {
                                            type: `checkbox`,
                                            checked: seedanceWatermark,
                                            onChange: (checked) =>
                                              setSeedanceWatermark(
                                                checked.target.checked,
                                              ),
                                          }),
                                          `添加水印`,
                                        ],
                                      }),
                                      jsxs(`label`, {
                                        className: `flex items-center gap-2 text-xs text-gray-300`,
                                        children: [
                                          jsx(`input`, {
                                            type: `checkbox`,
                                            checked: seedanceEnableWebSearch,
                                            onChange: (checked) =>
                                              setSeedanceEnableWebSearch(
                                                checked.target.checked,
                                              ),
                                          }),
                                          `纯文本时启用联网搜索`,
                                        ],
                                      }),
                                    ],
                                  }),
                                  jsxs(`div`, {
                                    className: `bg-[#121212] border border-[#333] rounded-lg overflow-hidden`,
                                    children: [
	                                      jsxs(`div`, {
	                                        className: `flex items-center justify-between gap-3 p-3 border-b border-[#262626] wanj-seedance-portrait-library-header`,
                                        children: [
	                                          jsxs(`div`, {
	                                            className: `wanj-seedance-portrait-library-title`,
	                                            children: [
                                              jsx(`div`, {
                                                className: `text-xs font-semibold text-gray-200`,
                                                children: `虚拟人像库`,
                                              }),
                                              jsxs(`div`, {
                                                className: `text-[10px] text-gray-500 mt-0.5`,
                                                children: [`已保存 `, seedanceVirtualPortraits.length, ` 个 Seedance Asset ID · 仅火山方舟官方请求 API 可用`],
                                              }),
                                            ],
                                          }),
                                          jsx(`button`, {
                                            type: `button`,
                                            onClick: () =>
                                              setSeedancePortraitLibraryExpanded(
                                                !seedancePortraitLibraryExpanded,
                                              ),
	                                            className: `px-2.5 py-1 rounded-md border border-[#333] bg-[#222] text-[11px] text-gray-300 hover:bg-[#2a2a2a] transition-colors wanj-seedance-portrait-library-toggle ${seedancePortraitLibraryExpanded ? `wanj-seedance-portrait-library-toggle-open` : ``}`,
	                                            children: seedancePortraitLibraryExpanded ? `收起` : `展开`,
	                                          }),
                                        ],
                                      }),
                                      seedancePortraitLibraryExpanded &&
                                      jsxs(`div`, {
                                        className: `p-3 space-y-3`,
                                        children: [
                                          jsx(`input`, {
                                            type: `file`,
                                            accept: `image/*`,
                                            ref: seedancePortraitFileInputRef,
                                            style: {
                                              display: `none`
                                            },
                                            onChange: handleSeedancePortraitFile,
                                          }),
                                          jsxs(`div`, {
                                            className: `rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 leading-relaxed`,
                                            children: [
                                              jsx(`div`, {
                                                className: `font-semibold text-amber-200 mb-0.5`,
                                                children: `仅火山方舟官方请求 API 可用`,
                                              }),
                                              jsx(`div`, {
                                                className: `text-amber-100/80`,
                                                children: `虚拟人像会以 asset://Asset ID 写入 Seedance 请求体；第三方中转、聚合接口或非方舟官方兼容接口可能不识别。预览图只用于画布显示，不会上传到火山资产库。`,
                                              }),
                                            ],
                                          }),
                                          jsxs(`div`, {
                                            className: `flex items-center justify-between gap-2 pt-1`,
                                            children: [
                                              jsxs(`div`, {
                                                children: [
                                                  jsx(`div`, {
                                                    className: `text-xs font-semibold text-gray-200`,
                                                    children: seedancePortraitEditingId ? `编辑虚拟人像` : `添加虚拟人像`,
                                                  }),
                                                  jsx(`div`, {
                                                    className: `text-[10px] text-gray-500 mt-0.5`,
                                                    children: `保存预览图和方舟 Asset ID，节点选择时会自动带入画布。`,
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          jsxs(`div`, {
                                            className: `grid grid-cols-1 md:grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-lg border border-[#2a2a2a] bg-[#181818] p-3`,
                                            children: [
                                              jsxs(`div`, {
                                                className: `space-y-2`,
                                                children: [
                                                  jsx(`div`, {
                                                    className: `w-20 h-20 max-w-[80px] max-h-[80px] rounded-lg border border-[#333] bg-[#0f0f0f] overflow-hidden flex items-center justify-center text-[10px] text-gray-500`,
                                                    children: (seedancePortraitForm.previewUrl || seedancePortraitForm.imageUrl) ?
                                                      jsx(`img`, {
                                                        src: seedancePortraitForm.previewUrl || seedancePortraitForm.imageUrl,
                                                        className: `block w-full h-full max-w-full max-h-full object-cover object-center`,
                                                        onError: wanjuanUseBrokenResourceImage,
                                                      }) :
                                                      `预览图`,
                                                  }),
                                                  jsx(`button`, {
                                                    type: `button`,
                                                    onClick: () => seedancePortraitFileInputRef.current?.click(),
                                                    className: `w-20 px-2 py-1.5 rounded-md bg-[#222] border border-[#333] text-[10px] text-gray-300 hover:bg-[#2a2a2a] transition-colors`,
                                                    children: `上传预览图`,
                                                  }),
                                                ],
                                              }),
                                              jsxs(`div`, {
                                                className: `grid grid-cols-1 md:grid-cols-2 gap-2`,
                                                children: [
                                                  jsx(`input`, {
                                                    value: seedancePortraitForm.name,
                                                    onChange: (event) =>
                                                      setSeedancePortraitForm((prev) => ({
                                                        ...prev,
                                                        name: event.target.value,
                                                      })),
                                                    className: `bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                                                    placeholder: `人像名称`,
                                                  }),
                                                  jsx(`input`, {
                                                    value: seedancePortraitForm.assetId,
                                                    onChange: (event) =>
                                                      setSeedancePortraitForm((prev) => ({
                                                        ...prev,
                                                        assetId: event.target.value,
                                                      })),
                                                    className: `bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                                                    placeholder: `asset-xxx 或 asset://asset-xxx`,
                                                  }),
                                                  jsx(`input`, {
                                                    value: seedancePortraitForm.imageUrl,
                                                    onChange: (event) =>
                                                      setSeedancePortraitForm((prev) => ({
                                                        ...prev,
                                                        imageUrl: event.target.value,
                                                    })),
                                                    className: `md:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                                                    placeholder: `粘贴预览图 URL（可选；上传不会填入这里）`,
                                                  }),
                                                  jsx(`input`, {
                                                    value: seedancePortraitForm.projectName,
                                                    onChange: (event) =>
                                                      setSeedancePortraitForm((prev) => ({
                                                        ...prev,
                                                        projectName: event.target.value,
                                                      })),
                                                    className: `bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                                                    placeholder: `项目/分组（可选）`,
                                                  }),
                                                  jsx(`input`, {
                                                    value: seedancePortraitForm.notes,
                                                    onChange: (event) =>
                                                      setSeedancePortraitForm((prev) => ({
                                                        ...prev,
                                                        notes: event.target.value,
                                                      })),
                                                    className: `bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500`,
                                                    placeholder: `备注（可选）`,
                                                  }),
                                                  jsxs(`div`, {
                                                    className: `md:col-span-2 flex flex-wrap items-center gap-2`,
                                                    children: [
                                                      jsx(`button`, {
                                                        type: `button`,
                                                        onClick: saveSeedancePortraitForm,
                                                        className: `px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 transition-colors`,
                                                        children: seedancePortraitEditingId ? `保存修改` : `保存人像`,
                                                      }),
                                                      seedancePortraitEditingId &&
                                                      jsx(`button`, {
                                                        type: `button`,
                                                        onClick: resetSeedancePortraitForm,
                                                        className: `px-3 py-1.5 rounded-md bg-[#222] border border-[#333] text-gray-300 text-xs hover:bg-[#2a2a2a] transition-colors`,
                                                        children: `取消编辑`,
                                                      }),
                                                      jsx(`span`, {
                                                        className: `text-[10px] text-gray-500`,
                                                        children: `请填写方舟已授权/可用的 Asset ID；预览图只用于画布显示，不会入库。`,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          jsxs(`div`, {
                                            className: `flex items-center justify-between gap-2 pt-1`,
                                            children: [
                                              jsx(`div`, {
                                                className: `text-xs font-semibold text-gray-200`,
                                                children: `已保存虚拟人像`,
                                              }),
                                              jsxs(`div`, {
                                                className: `text-[10px] text-gray-500`,
                                                children: [seedanceVirtualPortraits.length, ` 个`],
                                              }),
                                            ],
                                          }),
                                          seedanceVirtualPortraits.length > 0 ?
                                          jsx(`div`, {
                                            className: `grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 rounded-lg border border-[#2a2a2a] bg-[#151515] p-2 max-h-48 overflow-y-auto custom-scrollbar`,
                                            children: seedanceVirtualPortraits.map((asset) =>
                                              jsxs(
                                                `div`, {
                                                  className: `group relative rounded-lg border border-[#2f2f2f] bg-[#181818] p-1.5 hover:border-cyan-500/70 transition-colors`,
                                                  title: `${asset.name || asset.assetId}\n${wanjuanSeedanceAssetUrl(asset.assetId)}`,
                                                  children: [
                                                    jsx(`div`, {
                                                      className: `aspect-square w-full rounded-md overflow-hidden border border-[#333] bg-[#0f0f0f] flex items-center justify-center text-[8px] text-gray-500`,
                                                      children: (asset.previewUrl || asset.imageUrl) ?
                                                        jsx(`img`, {
                                                          src: asset.previewUrl || asset.imageUrl,
                                                          className: `block w-full h-full max-w-full max-h-full object-cover object-center`,
                                                          onError: wanjuanUseBrokenResourceImage,
                                                        }) :
                                                        `无预览`,
                                                    }),
                                                    jsxs(`div`, {
                                                      className: `mt-1 min-w-0`,
                                                      children: [
                                                        jsx(`div`, {
                                                          className: `text-[10px] text-gray-200 font-medium truncate text-center leading-tight`,
                                                          title: asset.name,
                                                          children: asset.name || asset.assetId,
                                                        }),
                                                        jsxs(`div`, {
                                                          className: `flex justify-center gap-1 mt-1 opacity-100`,
                                                          children: [
                                                            jsx(`button`, {
                                                              type: `button`,
                                                              onClick: () => editSeedancePortrait(asset),
                                                              className: `px-1.5 py-0.5 rounded bg-[#222] border border-[#333] text-[9px] text-gray-200 hover:bg-[#2a2a2a]`,
                                                              children: `编辑`,
                                                            }),
                                                            jsx(`button`, {
                                                              type: `button`,
                                                              onClick: () => removeSeedancePortrait(asset.id),
                                                              className: `px-1.5 py-0.5 rounded bg-[#2a1515] border border-[#4a2525] text-[9px] text-red-200 hover:bg-[#3a1d1d]`,
                                                              children: `删除`,
                                                            }),
                                                          ],
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                },
                                                asset.id,
                                              ),
                                            ),
                                          }) :
                                          jsx(`div`, {
                                            className: `text-center text-xs text-gray-500 py-4 border border-dashed border-[#333] rounded-lg`,
                                            children: `暂无虚拟人像`,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  jsx(`p`, {
                                    className: `text-[10px] text-gray-500`,
                                    children: `即梦节点会使用这里的专属模型、API 配置、比例、时长和默认开关；节点里也可以再单独覆盖 API。`,
                                  }),
	                                  jsx(`div`, {
                                    className: `wanjuan-tianji-settings-host`,
                                    "data-wanjuan-tianji-settings-host": `true`,
                                  }),
                                ],
                              });
}
