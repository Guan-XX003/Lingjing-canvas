/** 设置-云存储/上传 标签页。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanSettingsCloudTab({
  applyLitterboxUploadPreset,
  customPublicUploadConfig,
  customUploadConfigExpanded,
  qiniuConfig,
  qiniuJsonImportOpen,
  qiniuJsonImportText,
  qiniuUploadConfigExpanded,
  seedanceUploadMode,
  setCustomPublicUploadConfig,
  setCustomUploadConfigExpanded,
  setQiniuConfig,
  setQiniuJsonImportOpen,
  setQiniuJsonImportText,
  setQiniuUploadConfigExpanded,
  setSeedanceUploadMode,
  setShowQiniuSecretKey,
  setShowTosSecretKey,
  setTosConfig,
  setTosUploadConfigExpanded,
  showQiniuSecretKey,
  showToast2,
  showTosSecretKey,
  tosConfig,
  tosUploadConfigExpanded,
}: any) {
  return jsxs(`div`, {
                        className: `space-y-6 wanjuan-settings-section`,
                        children: [
	                          jsxs(`div`, {
	                            className: `group bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-300 pb-4 shadow-sm border border-[#222] wanjuan-settings-card`,
	                            children: [
	                              jsx(`div`, {
	                                className: `flex justify-between items-center p-4 border-b border-[#222] wanjuan-settings-card-header`,
	                                children: jsxs(`div`, {
	                                  children: [
		                                    jsxs(`h2`, {
	                                      className: `font-bold text-gray-200 text-sm flex items-center gap-2 wanjuan-settings-card-title`,
	                                      children: [
	                                        jsx(`span`, {
                                          className: `text-cyan-400`,
                                          children: `☁`,
                                        }),
                                        ` 上传与直链`,
                                      ],
	                                    }),
	                                    jsx(`p`, {
	                                      className: `text-[11px] text-gray-500 mt-1 wanjuan-settings-help`,
	                                      children: `管理参考图、视频、音频上传到公网 URL 的通道，不是项目备份或文件下载目录。`,
	                                    }),
	                                  ],
		                                }),
		                              }),
                              jsx(`div`, {
                                className: `px-4 pt-4 wanjuan-settings-card-body`,
                                children: jsxs(`div`, {
                                  className: `space-y-3`,
                                  children: [
                                    jsxs(`div`, {
                                      className: `bg-[#121212] border border-[#333] rounded-lg overflow-hidden`,
                                      children: [
                                        jsxs(`button`, {
                                          type: `button`,
                                          onClick: () => setTosUploadConfigExpanded(!tosUploadConfigExpanded),
                                          className: `w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-[#181818] transition-colors`,
                                          "aria-expanded": tosUploadConfigExpanded,
                                          children: [
                                            jsxs(`div`, {
                                              children: [
                                                jsx(`h3`, {
                                                  className: `text-xs font-semibold text-gray-300`,
                                                  children: `火山 TOS 上传配置`,
                                                }),
                                                jsx(`p`, {
                                                  className: `text-[10px] text-gray-500 mt-1`,
                                                  children: `用于把参考视频、音频上传到火山对象存储并返回公网 URL。`,
                                                }),
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              className: `flex items-center gap-2 shrink-0`,
                                              children: [
                                                jsx(`span`, {
                                                  className: `px-2 py-0.5 rounded-full text-[10px] border ${seedanceUploadMode === `tos` ? `border-cyan-500/40 bg-cyan-500/10 text-cyan-300` : `border-[#333] bg-[#1a1a1a] text-gray-500`}`,
                                                  children: seedanceUploadMode === `tos` ? `当前默认` : `未设默认`,
                                                }),
                                                jsx(`span`, {
                                                  className: `px-2 py-1 text-[10px] rounded-md border border-[#333] bg-[#222] text-gray-300`,
                                                  children: tosUploadConfigExpanded ? `收起` : `展开`,
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        tosUploadConfigExpanded &&
                                        jsxs(`div`, {
                                          className: `border-t border-[#2a2a2a] p-3 space-y-3`,
                                          children: [
                                            jsxs(`label`, {
                                              className: `flex items-center gap-2 text-xs text-gray-300`,
                                              children: [
                                                jsx(`input`, {
                                                  type: `checkbox`,
                                                  checked: seedanceUploadMode ===
                                                    `tos`,
                                                  onChange: (event) =>
                                                    setSeedanceUploadMode(
                                                      event.target.checked ?
                                                      `tos` :
                                                      `public`,
                                                    ),
                                                }),
                                                `默认使用火山 TOS 上传参考视频/音频`,
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              className: `grid grid-cols-1 md:grid-cols-2 gap-3`,
                                              children: [
                                                [
                                                  `accessKeyId`,
                                                  `AccessKey`,
                                                ],
                                                [
                                                  `secretAccessKey`,
                                                  `SecretKey`,
                                                ],
                                                [`bucket`, `Bucket`],
                                                [`region`, `Region`],
                                                [`endpoint`, `Endpoint`],
                                                [`prefix`, `Object Prefix`],
                                                [
                                                  `publicBaseUrl`,
                                                  `Public URL Base`,
                                                ],
                                              ].map(([configKey, configValue]) =>
                                                jsxs(
                                                  `label`, {
                                                    className: `block`,
                                                    children: [
                                                      jsx(`div`, {
                                                        className: `text-[10px] text-gray-500 mb-1`,
                                                        children: configValue,
                                                      }),
                                                      jsxs(`div`, {
                                                        className: `relative`,
                                                        children: [
                                                          jsx(`input`, {
                                                            type: configKey ===
                                                              `secretAccessKey` &&
                                                              !showTosSecretKey ?
                                                              `password` :
                                                              `text`,
                                                            value: tosConfig[configKey] ||
                                                              ``,
                                                            onChange: (event) =>
                                                              setTosConfig(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [configKey]: event.target
                                                                    .value,
                                                                }),
                                                              ),
                                                            className: `w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 ${configKey === `secretAccessKey` ? `pr-10` : ``}`,
                                                          }),
                                                          configKey === `secretAccessKey` &&
                                                          jsx(`button`, {
                                                            type: `button`,
                                                            onClick: () => setShowTosSecretKey(!showTosSecretKey),
                                                            className: `absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-1 text-[11px] text-gray-400 hover:text-cyan-200 rounded`,
                                                            title: showTosSecretKey ? `隐藏密钥` : `显示密钥`,
                                                            children: showTosSecretKey ? `隐藏` : `显示`,
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  },
                                                  configKey,
                                                ),
                                              ),
                                            }),
                                            jsx(`p`, {
                                              className: `text-[10px] text-gray-500`,
                                              children: `Public URL Base 可留空；如填写请填 Bucket/CDN 根地址，不要包含 Object Prefix。Bucket 需要允许方舟服务访问生成的对象 URL。`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    jsxs(`div`, {
                                      className: `bg-[#121212] border border-[#333] rounded-lg overflow-hidden`,
                                      children: [
                                        jsxs(`button`, {
                                          type: `button`,
                                          onClick: () => setQiniuUploadConfigExpanded(!qiniuUploadConfigExpanded),
                                          className: `w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-[#181818] transition-colors`,
                                          "aria-expanded": qiniuUploadConfigExpanded,
                                          children: [
                                            jsxs(`div`, {
                                              children: [
                                                jsx(`h3`, {
                                                  className: `text-xs font-semibold text-gray-300`,
                                                  children: `七牛云 S3 对象存储配置`,
                                                }),
                                                jsx(`p`, {
                                                  className: `text-[10px] text-gray-500 mt-1`,
                                                  children: `用于把参考视频、音频、图片上传到七牛云并返回公网 URL。`,
                                                }),
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              className: `flex items-center gap-2 shrink-0`,
                                              children: [
                                                jsx(`span`, {
                                                  className: `px-2 py-0.5 rounded-full text-[10px] border ${seedanceUploadMode === `qiniu` ? `border-cyan-500/40 bg-cyan-500/10 text-cyan-300` : `border-[#333] bg-[#1a1a1a] text-gray-500`}`,
                                                  children: seedanceUploadMode === `qiniu` ? `当前默认` : `未设默认`,
                                                }),
                                                jsx(`span`, {
                                                  className: `px-2 py-1 text-[10px] rounded-md border border-[#333] bg-[#222] text-gray-300`,
                                                  children: qiniuUploadConfigExpanded ? `收起` : `展开`,
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        qiniuUploadConfigExpanded &&
                                        jsxs(`div`, {
                                          className: `border-t border-[#2a2a2a] p-3 space-y-3`,
                                          children: [
                                            jsxs(`div`, {
                                              className: `flex items-center justify-between gap-3`,
                                              children: [
                                                jsxs(`label`, {
                                                  className: `flex items-center gap-2 text-xs text-gray-300`,
                                                  children: [
                                                    jsx(`input`, {
                                                      type: `checkbox`,
                                                      checked: seedanceUploadMode ===
                                                        `qiniu`,
                                                      onChange: (event) =>
                                                        setSeedanceUploadMode(
                                                          event.target.checked ?
                                                          `qiniu` :
                                                          `public`,
                                                        ),
                                                    }),
                                                    `默认使用七牛云上传参考视频/音频/图片`,
                                                  ],
                                                }),
                                                jsx(`button`, {
                                                  type: `button`,
                                                  onClick: () => setQiniuJsonImportOpen(!qiniuJsonImportOpen),
                                                  className: `px-2 py-1 text-[10px] bg-[#333] hover:bg-[#444] text-gray-300 rounded transition-colors border border-[#444] shrink-0`,
                                                  title: `从 JSON 文本一键导入配置`,
                                                  children: `JSON 导入`,
                                                }),
                                              ],
                                            }),
                                            qiniuJsonImportOpen &&
                                            jsxs(`div`, {
                                              className: `bg-[#101010] border border-[#333] rounded-lg p-3 space-y-3`,
                                              children: [
                                                jsxs(`div`, {
                                                  className: `flex items-center justify-between gap-3`,
                                                  children: [
                                                    jsx(`div`, {
                                                      className: `text-[10px] text-gray-500`,
                                                      children: `支持 accessKey、secretKey、bucket、endpoint、domain、prefix 字段`,
                                                    }),
                                                    jsx(`button`, {
                                                      type: `button`,
                                                      onClick: () => setQiniuJsonImportOpen(false),
                                                      className: `text-[11px] text-gray-500 hover:text-gray-200`,
                                                      children: `关闭`,
                                                    }),
                                                  ],
                                                }),
                                                jsx(`textarea`, {
                                                  value: qiniuJsonImportText,
                                                  onChange: (event) => setQiniuJsonImportText(event.target.value),
                                                  className: `w-full min-h-[104px] bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-mono resize-y`,
                                                  placeholder: `{
  "accessKey": "...",
  "secretKey": "...",
  "bucket": "wanjuan-canvas",
  "endpoint": "s3.cn-south-1.qiniucs.com",
  "domain": "https://cdn.example.com"
}`,
                                                }),
                                                jsxs(`div`, {
                                                  className: `flex justify-end gap-2`,
                                                  children: [
                                                    jsx(`button`, {
                                                      type: `button`,
                                                      onClick: () => {
                                                        setQiniuJsonImportOpen(false);
                                                        setQiniuJsonImportText(``);
                                                      },
                                                      className: `px-3 py-1.5 text-xs bg-[#222] hover:bg-[#333] text-gray-300 rounded transition-colors`,
                                                      children: `取消`,
                                                    }),
                                                    jsx(`button`, {
                                                      type: `button`,
                                                      onClick: () => {
                                                        try {
                                                          let parsedConfig = JSON.parse(qiniuJsonImportText);
                                                          if (!parsedConfig || typeof parsedConfig != `object` || Array.isArray(parsedConfig)) throw Error(`请粘贴对象格式 JSON`);
                                                          setQiniuConfig((prevConfig) => ({
                                                            ...prevConfig,
                                                            accessKey: parsedConfig.accessKey || parsedConfig.accessKeyId || prevConfig.accessKey || ``,
                                                            secretKey: parsedConfig.secretKey || parsedConfig.secretAccessKey || prevConfig.secretKey || ``,
                                                            bucket: parsedConfig.bucket || prevConfig.bucket || ``,
                                                            endpoint: parsedConfig.endpoint || parsedConfig.s3Endpoint || prevConfig.endpoint || `s3.cn-south-1.qiniucs.com`,
                                                            domain: parsedConfig.domain || parsedConfig.publicBaseUrl || parsedConfig.publicUrlBase || prevConfig.domain || ``,
                                                            prefix: parsedConfig.prefix || parsedConfig.objectPrefix || prevConfig.prefix || `wanjuan/seedance`,
                                                          }));
                                                          setQiniuJsonImportOpen(false);
                                                          setQiniuJsonImportText(``);
                                                          showToast2(`七牛云配置已导入并自动保存`);
                                                        } catch (error) {
                                                          showToast2(`JSON 导入失败：${error.message || error}`);
                                                        }
                                                      },
                                                      className: `px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors`,
                                                      children: `确认导入`,
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              className: `grid grid-cols-1 md:grid-cols-2 gap-3`,
                                              children: [
                                                [`accessKey`, `Access Key (AK)`, `例如：6LOdM9TU2SLPgR0DB...`],
                                                [`secretKey`, `Secret Key (SK)`, `例如：i8dfozxy0q5IPuuIOAM...`],
                                                [`bucket`, `Bucket 名称`, `例如：wanjuan-canvas`],
                                                [`endpoint`, `S3 Endpoint`, `例如：s3.cn-south-1.qiniucs.com`],
                                                [`domain`, `外网访问域名`, `例如：https://tdfc98zdu.hn-bkt.clouddn.com`],
                                                [`prefix`, `Object Prefix`, `wanjuan/seedance`],
                                              ].map(([fieldKey, label, placeholder]) =>
                                                jsxs(
                                                  `label`, {
                                                    className: `block`,
                                                    children: [
                                                      jsx(`div`, {
                                                        className: `text-[10px] text-gray-500 mb-1`,
                                                        children: label,
                                                      }),
                                                      jsxs(`div`, {
                                                        className: `relative`,
                                                        children: [
                                                          jsx(`input`, {
                                                            type: fieldKey === `secretKey` && !showQiniuSecretKey ? `password` : `text`,
                                                            value: qiniuConfig[fieldKey] || ``,
                                                            placeholder: placeholder,
                                                            onChange: (event) =>
                                                              setQiniuConfig(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [fieldKey]: event.target.value,
                                                                }),
                                                              ),
                                                            className: `w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 ${fieldKey === `secretKey` ? `pr-10` : ``}`,
                                                          }),
                                                          fieldKey === `secretKey` &&
                                                          jsx(`button`, {
                                                            type: `button`,
                                                            onClick: () => setShowQiniuSecretKey(!showQiniuSecretKey),
                                                            className: `absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-1 text-[11px] text-gray-400 hover:text-cyan-200 rounded`,
                                                            title: showQiniuSecretKey ? `隐藏密钥` : `显示密钥`,
                                                            children: showQiniuSecretKey ? `隐藏` : `显示`,
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  },
                                                  fieldKey,
                                                ),
                                              ),
                                            }),
                                            jsx(`p`, {
                                              className: `text-[10px] text-gray-500`,
                                              children: `外网访问域名可留空；填写七牛绑定域名/CDN 域名时会返回该域名下的公网链接。Bucket 需要允许模型服务访问生成的对象 URL。`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    jsxs(`div`, {
                                      className: `bg-[#121212] border border-[#333] rounded-lg overflow-hidden`,
                                      children: [
                                        jsxs(`button`, {
                                          type: `button`,
                                          onClick: () => setCustomUploadConfigExpanded(!customUploadConfigExpanded),
                                          className: `w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-[#181818] transition-colors`,
                                          "aria-expanded": customUploadConfigExpanded,
                                          children: [
                                            jsxs(`div`, {
                                              children: [
                                                jsx(`h3`, {
                                                  className: `text-xs font-semibold text-gray-300`,
                                                  children: `自定义公网直链上传配置`,
                                                }),
                                                jsx(`p`, {
                                                  className: `text-[10px] text-gray-500 mt-1`,
                                                  children: `用于接入 Litterbox 或其他能直接返回公网链接的上传服务。`,
                                                }),
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              className: `flex items-center gap-2 shrink-0`,
                                              children: [
                                                jsx(`span`, {
                                                  className: `px-2 py-0.5 rounded-full text-[10px] border ${seedanceUploadMode === `custom` ? `border-cyan-500/40 bg-cyan-500/10 text-cyan-300` : `border-[#333] bg-[#1a1a1a] text-gray-500`}`,
                                                  children: seedanceUploadMode === `custom` ? `当前默认` : `未设默认`,
                                                }),
                                                jsx(`span`, {
                                                  className: `px-2 py-1 text-[10px] rounded-md border border-[#333] bg-[#222] text-gray-300`,
                                                  children: customUploadConfigExpanded ? `收起` : `展开`,
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        customUploadConfigExpanded &&
                                        jsxs(`div`, {
                                          className: `border-t border-[#2a2a2a] p-3 space-y-3`,
                                          children: [
                                            jsxs(`div`, {
                                              className: `rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 space-y-2`,
                                              children: [
                                                jsxs(`div`, {
                                                  className: `flex flex-wrap items-center justify-between gap-2`,
                                                  children: [
                                                    jsxs(`div`, {
                                                      className: `min-w-0`,
                                                      children: [
                                                        jsx(`div`, {
                                                          className: `text-xs font-semibold text-cyan-100`,
                                                          children: `内置临时直链预设`,
                                                        }),
                                                        jsx(`div`, {
                                                          className: `mt-1 text-[10px] text-gray-500 leading-4`,
                                                          children: `用于临时把参考素材转成公网 URL；公益服务不适合隐私、客户或长期素材。`,
                                                        }),
                                                      ],
                                                    }),
                                                    jsx(`div`, {
                                                      className: `flex flex-wrap items-center gap-1.5 shrink-0`,
                                                      children: [`1h`, `12h`, `24h`, `72h`].map((ttl) =>
                                                        jsx(`button`, {
                                                          type: `button`,
                                                          onClick: () => applyLitterboxUploadPreset(ttl),
                                                          className: `rounded-md border border-cyan-500/25 bg-[#161d1f] px-2.5 py-1.5 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/12 hover:border-cyan-400/45 transition-colors`,
                                                          title: `应用 Litterbox ${ttl} 临时直链预设`,
                                                          children: `Litterbox ${ttl}`,
                                                        }, ttl),
                                                      ),
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            jsxs(`label`, {
                                              className: `flex items-center gap-2 text-xs text-gray-300`,
                                              children: [
                                                jsx(`input`, {
                                                  type: `checkbox`,
                                                  checked: seedanceUploadMode ===
                                                    `custom`,
                                                  onChange: (event) =>
                                                    setSeedanceUploadMode(
                                                      event.target.checked ?
                                                      `custom` :
                                                      `public`,
                                                    ),
                                                }),
                                                `默认使用自定义公网直链上传参考视频/音频`,
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              className: `grid grid-cols-1 md:grid-cols-2 gap-3`,
                                              children: [
                                                [
                                                  `endpoint`,
                                                  `Upload URL`,
                                                  `https://litterbox.catbox.moe/resources/internals/api.php`,
                                                ],
                                                [`fileField`, `File Field`, `fileToUpload`],
                                                [`resultPath`, `Result Path`, `data.url 或留空`],
                                              ].map(([fieldKey, label, placeholder]) =>
                                                jsxs(
                                                  `label`, {
                                                    className: `block`,
                                                    children: [
                                                      jsx(`div`, {
                                                        className: `text-[10px] text-gray-500 mb-1`,
                                                        children: label,
                                                      }),
                                                      jsx(`input`, {
                                                        type: `text`,
                                                        value: customPublicUploadConfig[
                                                          fieldKey
                                                        ] || ``,
                                                        placeholder: placeholder,
                                                        onChange: (event) =>
                                                          setCustomPublicUploadConfig(
                                                            (prev) => ({
                                                              ...prev,
                                                              [fieldKey]: event.target
                                                                .value,
                                                            }),
                                                          ),
                                                        className: `w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500`,
                                                      }),
                                                    ],
                                                  },
                                                  fieldKey,
                                                ),
                                              ),
                                            }),
                                            jsxs(`div`, {
                                              className: `grid grid-cols-1 md:grid-cols-2 gap-3`,
                                              children: [
                                                [`fields`, `Form Fields`, `reqtype=fileupload`],
                                                [`headers`, `Headers`, ``],
                                              ].map(([fieldKey, label, placeholder]) =>
                                                jsxs(
                                                  `label`, {
                                                    className: `block`,
                                                    children: [
                                                      jsx(`div`, {
                                                        className: `text-[10px] text-gray-500 mb-1`,
                                                        children: label,
                                                      }),
                                                      jsx(`textarea`, {
                                                        rows: 3,
                                                        value: customPublicUploadConfig[
                                                          fieldKey
                                                        ] || ``,
                                                        placeholder: placeholder,
                                                        onChange: (event) =>
                                                          setCustomPublicUploadConfig(
                                                            (prev) => ({
                                                              ...prev,
                                                              [fieldKey]: event.target
                                                                .value,
                                                            }),
                                                          ),
                                                        className: `w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 resize-y`,
                                                      }),
                                                    ],
                                                  },
                                                  fieldKey,
                                                ),
                                              ),
                                            }),
                                            jsx(`p`, {
                                              className: `text-[10px] text-gray-500`,
                                              children: `Litterbox 可填 Upload URL=https://litterbox.catbox.moe/resources/internals/api.php、File Field=fileToUpload、Form Fields=reqtype=fileupload 和 time=1h、Result Path 留空。其他服务可用每行 key=value 配置表单字段和请求头。`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                            ],
                          }),
                        ],
                      });
}
