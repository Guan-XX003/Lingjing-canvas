/**
 * WanJuanAppRoot 杂项纯工具：i18n 文案、会员额度、项目资源图/候选/文件引用收集、
 * 全局任务压缩、文档抓取、mem0 头、项目选项列表、复制图标渲染、备份分区常量等。
 * 纯函数（不依赖 React state），自 WanJuanAppRoot 抽出，行为不变。
 */
import { jsx, jsxs } from "react/jsx-runtime";
import { cloneBackupValue } from "./backup";
import { GlobalTask, Project, ResourceItem } from "./types";
import { localPathFromProjectFileUrl } from "./project-asset-binding";
export { compactGlobalTasks } from "./global-tasks";

export const WANJUAN_RELEASE_NOTES_1_4_5 = `1.4.5：StarCanvas 品牌升级，保留本地数据与自动化兼容能力。`;

export const membershipLimits = {
      FREE: {
        accounts: 999999,
        presets: 999999,
        dailyGenerations: 999999,
        name: `个人本地版`,
      },
      PRO: {
        accounts: 999999,
        presets: 999999,
        dailyGenerations: 999999,
        name: `个人本地版`
      },
      VIP: {
        accounts: 999999,
        presets: 999999,
        dailyGenerations: 999999,
        name: `个人本地版`,
      },
    };

export const wanjuanI18n = {
      "zh-TW": {
        "StarCanvas": "StarCanvas",
        "资源": "資源",
        "智能体": "智慧體",
        "设置": "設定",
        "设置菜单": "設定選單",
        "个性设置": "個性化設定",
        "模型配置": "模型配置",
        "云盘设置": "雲端硬碟設定",
        "生成设置": "生成設定",
        "拓展功能": "擴充功能",
        "数据管理": "資料管理",
        "界面主题": "介面主題",
        "语言设置": "語言設定",
        "关于": "關於",
        "版本更新日志": "版本更新日誌",
        "当前版本": "目前版本",
        "当前已启用全局统一API配置": "目前已啟用全域統一 API 配置",
        "切换石墨灰、曜石黑、晴空蓝、暖砂白、樱雾粉、薄荷绿或跟随系统外观，不改变现有布局结构": "切換石墨灰、曜石黑、晴空藍、暖砂白、櫻霧粉、薄荷綠或跟隨系統外觀，不改變現有布局結構",
        "选择界面语言偏好，后续多语言文案将按此设置展示": "選擇介面語言偏好，介面文案會依此設定顯示",
        "1.4.1：修复重新登录后本机主网关管理面板丢失、错误进入接管流程的问题，并统一应用内版本显示与安装包版本。": "1.4.1：修復重新登入後本機主閘道管理面板遺失、錯誤進入接管流程的問題，並統一 App 內版本顯示與安裝包版本。",
        "1.3.6：接入后台系统通知，优化通知铃铛、已读不再显示、天玑模式提示、素材选择触发和极鑫默认配置体验，并发布新的 Mac/Windows 安装包。": "1.3.6：接入後台系統通知，優化通知鈴鐺、已讀不再顯示、天璣模式提示、素材選擇觸發和極鑫預設配置體驗，並發布新的 Mac/Windows 安裝包。",
        "1.3.8：修复全局批量配置与极鑫默认配置串供，确保配置切换完整隔离，并增强异步视频任务凭据恢复和状态一致性。": "1.3.8：修復全域批次配置與極鑫預設配置串供，確保配置切換完整隔離，並增強非同步影片任務憑據恢復和狀態一致性。",
        "1.3.9：新增即梦官方兼容模式的火山 Ark 可信素材审核，支持手动与生成时自动审核；新增自定义空白配置，并修复生成视频资源未及时本地持久化导致远端链接过期失效的问题。": "1.3.9：新增即夢官方相容模式的火山 Ark 可信素材審核，支援手動與生成時自動審核；新增自訂空白配置，並修復生成影片資源未及時本機持久化導致遠端連結過期失效的問題。",
        "1.3.7：优化大画布渲染和媒体节点稳定性，新增底部节点创建栏，完善视频参数、参考上传与配置管家协议识别，并将天玑设置迁移为原生组件。": "1.3.7：優化大畫布渲染和媒體節點穩定性，新增底部節點建立列，完善影片參數、參考上傳與配置管家協議識別，並將天璣設定遷移為原生元件。",
        "1.3.5：修复即梦天玑模式配置传递，确保同步极鑫配置后画布生成可正确读取授权信息，并发布新的 Mac/Windows 安装包。": "1.3.5：修復即夢天璣模式配置傳遞，確保同步極鑫配置後畫布生成可正確讀取授權資訊，並發布新的 Mac/Windows 安裝包。",
        "1.3.3：优化石墨灰主题控件选中态、内置语言包和离线工具包打包流程。": "1.3.3：優化石墨灰主題控制項選中態、內建語言包和離線工具包打包流程。",
        "1.3.2：优化即梦天玑人像审核后的自动刷新绑定，提高素材库最终 ID 回填成功率。": "1.3.2：優化即夢天璣人像審核後的自動刷新綁定，提高素材庫最終 ID 回填成功率。",
        "1.3.1：优化工作空间团队连接诊断、分组管理、网络环境提示与即梦天玑任务失败识别；支持天玑人像审核后直接绑定图片节点。": "1.3.1：優化工作空間團隊連線診斷、分組管理、網路環境提示與即夢天璣任務失敗識別；支援天璣人像審核後直接綁定圖片節點。",
        "1.3.0：新增工作空间、团队空间与离线工具包导入；优化本地工具、提示词模板、团队模板视频播放和跨平台协同。": "1.3.0：新增工作空間、團隊空間與離線工具包匯入；優化本機工具、提示詞模板、團隊模板影片播放和跨平台協同。",
        "1.2.13：修复即梦/Seedance 视频节点多次生成后仍显示第一次生成结果的问题；新任务、任务刷新和项目重开都会清理旧媒体绑定并优先回填最新结果。": "1.2.13：修復即夢/Seedance 影片節點多次生成後仍顯示第一次生成結果的問題；新任務、任務刷新和專案重開都會清理舊媒體綁定並優先回填最新結果。",
        "1.2.11：修复部分视频节点已下载到资源库但重新打开仍显示过期云端链接的问题；任务刷新会优先回填本地资源副本，并修正旧设备路径误判为有效文件的情况。": "1.2.11：修復部分影片節點已下載到資源庫但重新開啟仍顯示過期雲端連結的問題；任務刷新會優先回填本地資源副本，並修正舊裝置路徑誤判為有效檔案的情況。",
        "1.2.9：优化大画布渲染流畅度；改进选择素材弹窗布局、筛选选中态和音视频素材预览；修复部分生成视频下载路径不一致；整理项目、备份中心和即梦节点菜单图标等界面细节。": "1.2.9：優化大畫布渲染流暢度；改進選擇素材彈窗布局、篩選選中態和音影片素材預覽；修復部分生成影片下載路徑不一致；整理專案、備份中心和即夢節點選單圖示等介面細節。",
        "曜石黑": "曜石黑",
        "晴空蓝": "晴空藍",
        "暖砂白": "暖砂白",
        "樱雾粉": "櫻霧粉",
        "薄荷绿": "薄荷綠",
        "石墨灰": "石墨灰",
        "跟随系统": "跟隨系統",
        "全部": "全部",
        "图片": "圖片",
        "视频": "影片",
        "音频": "音訊",
        "文本": "文字",
        "全部来源": "全部來源",
        "AI生成": "AI 生成",
        "外部素材": "外部素材",
        "显示大小": "顯示大小",
        "下载目录": "下載目錄",
        "打开下载目录": "開啟下載目錄",
        "清理失效素材": "清理失效素材",
        "检查中...": "檢查中...",
        "清空全部": "清空全部",
        "暂无资源": "暫無資源",
        "当前筛选没有资源": "目前篩選沒有資源",
        "只看收藏": "只看收藏",
        "显示全部收藏筛选": "顯示全部收藏篩選",
        "右键自由生成你的想象": "右鍵自由生成你的想像",
        "文字生成": "文字生成",
        "图片生成": "圖片生成",
        "视频生成": "影片生成",
        "音乐生成": "音樂生成",
        "错误查询": "錯誤查詢",
        "任务清单": "任務清單",
        "保存设置": "儲存設定",
        "设置已保存": "設定已儲存"
      },
      "en-US": {
        "StarCanvas": "StarCanvas",
        "资源": "Assets",
        "智能体": "Agents",
        "设置": "Settings",
        "设置菜单": "Settings Menu",
        "个性设置": "Personalization",
        "模型配置": "Model Config",
        "云盘设置": "Cloud Storage",
        "生成设置": "Generation",
        "拓展功能": "Extensions",
        "数据管理": "Data",
        "界面主题": "Theme",
        "语言设置": "Language",
        "关于": "About",
        "版本更新日志": "Release Notes",
        "当前版本": "Current Version",
        "当前已启用全局统一API配置": "Global unified API config is enabled",
        "切换石墨灰、曜石黑、晴空蓝、暖砂白、樱雾粉、薄荷绿或跟随系统外观，不改变现有布局结构": "Switch the visual theme without changing the current layout.",
        "选择界面语言偏好，后续多语言文案将按此设置展示": "Choose the interface language. Supported interface text follows this setting.",
        "1.4.1：修复重新登录后本机主网关管理面板丢失、错误进入接管流程的问题，并统一应用内版本显示与安装包版本。": "1.4.1: Fixed the local gateway-owner management panel disappearing after sign-in and incorrectly offering takeover, and aligned the visible in-app version with the packaged version.",
        "1.3.6：接入后台系统通知，优化通知铃铛、已读不再显示、天玑模式提示、素材选择触发和极鑫默认配置体验，并发布新的 Mac/Windows 安装包。": "1.3.6: Added backend system notifications, refined the notification bell, read-and-hide behavior, Tianji mode tips, asset picker triggering, and Jixin default configuration experience, and shipped new Mac/Windows installers.",
        "1.3.8：修复全局批量配置与极鑫默认配置串供，确保配置切换完整隔离，并增强异步视频任务凭据恢复和状态一致性。": "1.3.8: Fixed cross-contamination between custom global presets and the built-in Jixin preset, fully isolated configuration switching, and improved credential recovery and state consistency for asynchronous video tasks.",
        "1.3.9：新增即梦官方兼容模式的火山 Ark 可信素材审核，支持手动与生成时自动审核；新增自定义空白配置，并修复生成视频资源未及时本地持久化导致远端链接过期失效的问题。": "1.3.9: Added Volcengine Ark trusted-asset review for Seedance official/compatible mode with manual and automatic review, added a custom blank configuration, and fixed generated videos remaining on provider URLs until those links expired.",
        "1.3.7：优化大画布渲染和媒体节点稳定性，新增底部节点创建栏，完善视频参数、参考上传与配置管家协议识别，并将天玑设置迁移为原生组件。": "1.3.7: Improved large-canvas and media-node stability, added the bottom node dock, expanded video parameters, reference uploads and Config Butler protocol detection, and migrated Tianji settings to a native React component.",
        "1.3.5：修复即梦天玑模式配置传递，确保同步极鑫配置后画布生成可正确读取授权信息，并发布新的 Mac/Windows 安装包。": "1.3.5: Fixed Jimeng Tianji config delivery so canvas generation can correctly read synced Jixin authorization, and shipped new Mac/Windows installers.",
        "1.3.3：优化石墨灰主题控件选中态、内置语言包和离线工具包打包流程。": "1.3.3: Improved Graphite theme selected states, the built-in language pack, and offline tool packaging workflow.",
        "1.3.2：优化即梦天玑人像审核后的自动刷新绑定，提高素材库最终 ID 回填成功率。": "1.3.2: Improved automatic refresh binding after Jimeng Tianji portrait review, increasing the success rate of final asset ID backfill.",
        "1.3.1：优化工作空间团队连接诊断、分组管理、网络环境提示与即梦天玑任务失败识别；支持天玑人像审核后直接绑定图片节点。": "1.3.1: Improved Workspace team connection diagnostics, group management, network-change guidance, and Tianji task failure detection; Tianji portrait review can now bind directly to the image node.",
        "1.3.0：新增工作空间、团队空间与离线工具包导入；优化本地工具、提示词模板、团队模板视频播放和跨平台协同。": "1.3.0: Added Workspace, Team Space, and offline tool pack import; improved local tools, prompt templates, team template video playback, and cross-platform collaboration.",
        "1.2.13：修复即梦/Seedance 视频节点多次生成后仍显示第一次生成结果的问题；新任务、任务刷新和项目重开都会清理旧媒体绑定并优先回填最新结果。": "1.2.13: Fixed Jimeng/Seedance video nodes still showing the first generated result after repeated generations; new tasks, task refresh, and project reopen now clear stale media bindings and prefer the latest result.",
        "1.2.11：修复部分视频节点已下载到资源库但重新打开仍显示过期云端链接的问题；任务刷新会优先回填本地资源副本，并修正旧设备路径误判为有效文件的情况。": "1.2.11: Fixed video nodes that had already downloaded results into the resource library but reopened with expired cloud links; task refresh now prefers local resource copies and stale paths from older devices are no longer treated as valid files.",
        "1.2.9：优化大画布渲染流畅度；改进选择素材弹窗布局、筛选选中态和音视频素材预览；修复部分生成视频下载路径不一致；整理项目、备份中心和即梦节点菜单图标等界面细节。": "1.2.9: Improved large-canvas rendering responsiveness; polished the asset picker layout, selected filter state, and audio/video previews; fixed inconsistent save paths for some generated videos; refined project, Backup Center, and Jimeng node menu icon details.",
        "曜石黑": "Obsidian",
        "晴空蓝": "Sky Blue",
        "暖砂白": "Warm Sand",
        "樱雾粉": "Rose Mist",
        "薄荷绿": "Mint",
        "石墨灰": "Graphite",
        "跟随系统": "Follow System",
        "全部": "All",
        "图片": "Images",
        "视频": "Videos",
        "音频": "Audio",
        "文本": "Text",
        "全部来源": "All Sources",
        "AI生成": "AI Generated",
        "外部素材": "External",
        "显示大小": "Size",
        "下载目录": "Downloads",
        "打开下载目录": "Open Downloads",
        "清理失效素材": "Clean Invalid Assets",
        "检查中...": "Checking...",
        "清空全部": "Clear All",
        "暂无资源": "No assets yet",
        "当前筛选没有资源": "No assets match this filter",
        "只看收藏": "Favorites Only",
        "显示全部收藏筛选": "Show All Favorites Filter",
        "右键自由生成你的想象": "Right-click to create freely",
        "文字生成": "Text",
        "图片生成": "Image",
        "视频生成": "Video",
        "音乐生成": "Music",
        "错误查询": "Errors",
        "任务清单": "Tasks",
        "保存设置": "Save Settings",
        "设置已保存": "Settings saved"
      }
    };

export const fetchDocAsPlainText = async (rawUrl) => {
        let url = String(rawUrl || ``).trim(),
          fetchWithTimeout = async (targetUrl) => {
              let abortController = new AbortController(),
                timeoutId = window.setTimeout(() => abortController.abort(), 6e4);
              try {
                let response = await fetch(targetUrl, {
                  signal: abortController.signal
                });
              if (!response.ok) throw Error(`文档抓取失败: ${response.status} ${response.statusText}`);
              return await response.text();
              } finally {
                window.clearTimeout(timeoutId);
              }
            },
            isShellPage = (html) =>
            /<!doctype html/i.test(html) &&
            /(cdn\.apifox\.com\/docs-site|window\.__remixContext|modulepreload)/i.test(
              html,
            ),
            isLoginPage = (html) =>
            /<title>\s*(登录|Login|Feishu|Lark)/i.test(html) ||
            /suite-passport|passport\.feishu|登录继续/i.test(html),
            cleanText = (text) =>
            String(text || ``).replace(/\n{3,}/g, `\n\n`).trim().slice(0, 18e4),
            readViaDesktop = async (url2) => {
                try {
                  let desktopResult = await window?.wanjuanDesktop?.readDocumentWithBrowser?.(url2);
                  if (desktopResult?.ok && desktopResult?.text) return cleanText(desktopResult.text);
                } catch {}
                return ``;
              },
              buildJinaUrl = (url2) =>
              `https://r.jina.ai/http://${String(url2 || ``).replace(/^https?:\/\//, ``)}`,
              // 提取 apifox 文档站的接口子页链接（形如 .apifox.cn/数字e0，e0 结尾是接口页，m0 是说明页跳过）。
              // apifox 是 SPA，首页只有目录导航，每个接口的真实请求/响应字段在各自 e0 子页里，
              // 必须逐个抓取，否则配置管家只能靠模型名猜协议。
              extractApifoxEndpointPaths = (indexText, baseUrl) => {
                let host = (() => { try { return new URL(/^https?:/i.test(baseUrl) ? baseUrl : `http://${baseUrl}`).host; } catch { return ``; } })();
                if (!host || !/apifox\./i.test(host)) return [];
                let seen = new Set(), paths: any[] = [], pathRegex = new RegExp(`${host.replace(/[.]/g, `\\.`)}/(\\d+e0)`, `g`), match;
                while ((match = pathRegex.exec(indexText)) !== null) {
                  let matchedId = match[1];
                  if (!seen.has(matchedId)) { seen.add(matchedId); paths.push(`https://${host}/${matchedId}`); }
                }
                return paths;
              },
              fetchApifoxSubPages = async (subUrls) => {
                let limited = subUrls.slice(0, 60), results: any[] = [], batchSize = 6;
                // 从子页全文里剥离左侧目录导航，只保留接口正文（请求参数/Body/示例/响应）。
                // apifox 子页约 90% 是重复的目录链接，真实接口字段集中在末尾标题段，剥离后体积砍到约 1/30。
                let extractEndpointBody = (full) => {
                  let text = String(full || ``);
                  // 接口正文起点：第一个标记命中处（"请求参数"/"Body 参数"/最后一个二级标题），取其前一点上下文到结尾。
                  let markers = [`请求参数`, `Body 参数`, `Body`, `请求体`, `application/json`];
                  let startIdx = -1;
                  for (let marker of markers) { let markerIndex = text.indexOf(marker); if (markerIndex >= 0) { startIdx = markerIndex; break; } }
                  // 标记往前回退 200 字保留接口标题/路径上下文。
                  if (startIdx > 200) return text.slice(startIdx - 200);
                  // 没命中字段标记：退而取最后一个二级标题之后（仍优于整页目录）。
                  let lastH2 = text.lastIndexOf(`\n## `);
                  return lastH2 > 0 ? text.slice(lastH2) : text.slice(0, 1500);
                };
                for (let batchIndex = 0; batchIndex < limited.length; batchIndex += batchSize) {
                  let batch = limited.slice(batchIndex, batchIndex + batchSize);
                  let texts = await Promise.all(batch.map(async (subUrl) => {
                    try {
                      let response = await fetchWithTimeout(buildJinaUrl(subUrl));
                      if (!response) return ``;
                      return extractEndpointBody(response).slice(0, 2500);
                    } catch { return ``; }
                  }));
                  for (let text of texts) text && results.push(text);
                }
                return results;
              };
        try {
          let jinaText = await fetchWithTimeout(buildJinaUrl(url));
          if (jinaText && jinaText.length > 120) {
            let endpointUrls = extractApifoxEndpointPaths(jinaText, url);
            if (endpointUrls.length) {
              let subTexts = await fetchApifoxSubPages(endpointUrls);
              if (subTexts.length) {
                return cleanText(`${jinaText}\n\n===== 接口详情（共 ${subTexts.length} 个接口子页）=====\n\n${subTexts.join(`\n\n----- 接口分隔 -----\n\n`)}`);
              }
            }
            return cleanText(jinaText);
          }
        } catch {}
        let desktopText = await readViaDesktop(url);
        if (desktopText) return desktopText;
        try {
          let html = await fetchWithTimeout(url);
          if (isShellPage(html) || isLoginPage(html))
            throw Error(`文档站返回了登录页或前端壳页面，请改用可公开访问的文档链接`);
          try {
            let doc = new DOMParser().parseFromString(html, `text/html`);
            return cleanText(doc.body?.innerText || doc.documentElement?.innerText || html);
          } catch {
            return cleanText(html);
          }
      } catch (error) {
          let fallbackText = await readViaDesktop(url);
          if (fallbackText) return fallbackText;
          throw Error(
            error?.message?.includes(`文档站返回了登录页`) ?
            error.message :
            `文档读取失败，请检查链接是否可公开访问，或稍后重试浏览器读取`,
          );
        }
      };

export const getMem0Headers = (apiKey: string) => {
          let headers: any = {
              "Content-Type": `application/json`
            },
            trimmedApiKey = String(apiKey || ``).trim();
          return (
            trimmedApiKey &&
            (trimmedApiKey.toLowerCase().startsWith(`bearer `) ?
              (headers.Authorization = trimmedApiKey) :
              trimmedApiKey.toLowerCase().startsWith(`token `) ?
              (headers.Authorization = trimmedApiKey) :
              (headers[`X-API-Key`] = trimmedApiKey)),
            headers
          );
        };

export const renderCopyGlyph = (size = 16) =>
        jsxs(`svg`, {
          width: size,
          height: size,
          viewBox: `0 0 24 24`,
          fill: `none`,
          stroke: `currentColor`,
          strokeWidth: `1.9`,
          strokeLinecap: `round`,
          strokeLinejoin: `round`,
          children: [
            jsx(`rect`, {
              x: `9`,
              y: `9`,
              width: `10`,
              height: `10`,
              rx: `2.5`,
            }),
            jsx(`path`, {
              d: `M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1`,
            }),
          ],
        });

export const BACKUP_SETTINGS_SECTION_KEYS = {
	      basic: [
	        `themeMode`,
	        `uiTheme`,
	        `theme`,
	        `appearanceTheme`,
	        `appLanguage`,
	        `uiLanguage`,
	      ],
	      api: [
	        `apiUrl`,
	        `apiKey`,
	        `textApiUrl`,
	        `textApiKey`,
        `imageApiUrl`,
        `imageApiKey`,
        `videoApiUrl`,
        `videoApiKey`,
        `audioApiUrl`,
        `audioApiKey`,
        `apiConfigs`,
        `textApiConfigId`,
        `imageApiConfigId`,
        `videoApiConfigId`,
        `audioApiConfigId`,
        `configButlerApiUrl`,
        `configButlerApiKey`,
	        `configButlerProtocol`,
	        `configButlerModel`,
	        `configButlerDocUrl`,
	        `configButlerMode`,
        `configButlerTargetCategory`,
        `configButlerTargetApiConfigId`,
        `configButlerRepairHistory`,
        `storedGlobalConfigs`,
        `activeStoredGlobalConfigId`,
	      ],
	      models: [
	        `textModel`,
	        `drawingModel`,
	        `imageCompatResolutions`,
	        `videoModel`,
        `videoDurations`,
        `videoResolutions`,
        `videoAspectRatios`,
        `videoModelRequestProfiles`,
        `seedanceModel`,
        `tianjiSeedanceModel`,
        `seedanceDurations`,
        `seedanceResolutions`,
        `seedanceRatios`,
        `seedanceGenerateAudio`,
        `seedanceWatermark`,
        `seedanceEnableWebSearch`,
        `seedanceVirtualPortraits`,
        `arkTrustedAssetConfig`,
        `tongyiWanxiangTextModels`,
        `tongyiWanxiangReferenceImageModels`,
        `tongyiWanxiangImageModels`,
        `tongyiWanxiangEditModels`,
        `tongyiWanxiangDurations`,
        `tongyiWanxiangResolutions`,
        `tongyiWanxiangRatios`,
        `tianjiSeedanceConfig`,
        `tianjiSeedanceAssets`,
        `tianjiSeedanceGroups`,
        `tianjiSeedanceSettingsMode`,
	        `audioModel`,
		        `ttsMusicModel`,
        `modelProtocolRegistry`,
        `textModelApiBindings`,
        `textModelProtocolBindings`,
        `imageModelApiBindings`,
        `imageModelProtocolBindings`,
	        `videoModelProtocolBindings`,
	        `videoModelApiBindings`,
	        `audioModelProtocolBindings`,
	        `audioModelApiBindings`,
	      ],
      cloud: [
        `seedanceUploadMode`,
        `tosConfig`,
        `customPublicUploadConfig`,
        `qiniuConfig`,
      ],
		      generation: [
		        `presetPrompts`,
		        `globalTasks`,
		        `customNodeTemplates`,
		        `globalPollingInterval`,
	        `globalMaxPollingDuration`,
	        `layeredRunConcurrencyOptions`,
	        `layeredRunMaxConcurrency`,
	        `downloadDirectory`,
	        `autoDownloadGeneratedResults`,
	        `wanjuanPerformanceProfile`,
	        `transitGridCols`,
	      ],
      data: [`backupExportSelection`, `backupImportSelection`],
      other: [],
    };

export const getProjectOptionList = (items: Project[]) =>
    Array.isArray(items) ?
    items
    .filter((item) => item && typeof item == `object` && item.id)
    .map((project, index) => ({
      id: project.id,
      name: project.name || project.title || project.projectName || project.label || `未命名项目 ${index + 1}`,
      cover: project.coverImage ||
        project.thumbnail ||
        project.previewImage ||
        project.preview ||
        project.icon ||
        ``,
      updatedAt: project.updatedAt || project.modifiedAt || project.createdAt || 0,
    })) :
    [];

export const mergeTransitResourceEntries = (primaryList: ResourceItem[], secondaryList: ResourceItem[] = []) => {
              let clonedPrimary = Array.isArray(primaryList) ? cloneBackupValue(primaryList) : [],
                clonedSecondary = Array.isArray(secondaryList) ? cloneBackupValue(secondaryList) : [],
                seenIds = new Set(),
                merged = [];
              for (let item of [...clonedPrimary, ...clonedSecondary]) {
                let itemId =
                  typeof item?.id == `string` && item.id ?
                  item.id :
                  typeof item?.url == `string` && item.url ?
                  `${item.type || `resource`}:${item.url}` :
                  ``;
                if (!itemId || seenIds.has(itemId)) continue;
                (seenIds.add(itemId), merged.push(item));
              }
              return merged;
            };

export const collectProjectResourceCandidates = (backup: any, refs: Set<string> = new Set()) => {
              if (!backup || typeof backup != `object`) return [...refs];
              let nodes = backup?.nodes;
              if (!Array.isArray(nodes)) return [...refs];
              for (let node of nodes) {
                let nodeData = node?.data;
                if (!nodeData || typeof nodeData != `object`) continue;
                for (let key of [`imageUrl`, `videoUrl`, `audioUrl`]) {
                  let value = nodeData[key];
                  typeof value == `string` && value && refs.add(value);
                }
                let assetBindings = nodeData.projectAssetBindings;
                assetBindings &&
                  typeof assetBindings == `object` &&
                  Object.values(assetBindings).forEach((binding: any) => {
                    typeof binding?.assetId == `string` && binding.assetId && refs.add(binding.assetId),
                      typeof binding?.localPath == `string` && binding.localPath && refs.add(binding.localPath),
                      typeof binding?.portableData == `string` &&
                      binding.portableData &&
                      /^https?:\/\//i.test(binding.portableData) &&
                      refs.add(binding.portableData);
                  });
              }
              return [...refs];
            };

export const buildProjectResourceMap = (groups: any = {}, entries: any[] = [], candidates = []) => {
              let validEntries = Array.isArray(candidates) ? candidates.filter(Boolean) : [],
                result = {};
              if (!validEntries.length) return result;
              let resourceLookup = new Map();
              validEntries.forEach((resource) => {
                typeof resource?.id == `string` && resource.id && resourceLookup.set(`id:${resource.id}`, cloneBackupValue(resource));
                typeof resource?.url == `string` && resource.url && resourceLookup.set(`url:${resource.url}`, cloneBackupValue(resource));
              });
              for (let [key, value] of Object.entries(groups || {})) {
                if (!key || !value) continue;
                let candidates2 = new Set(collectProjectResourceCandidates(value)),
                  matchedResources = [];
                for (let candidate of candidates2) {
                  let match =
                    resourceLookup.get(`id:${candidate}`) ||
                    resourceLookup.get(`url:${candidate}`) ||
                    matchedResources.find((item) => item.localPath === candidate) || [...resourceLookup.values()].find((item) => item?.localPath === candidate);
                  match && matchedResources.push(cloneBackupValue(match));
                }
                matchedResources.length > 0 && (result[key] = mergeTransitResourceEntries(matchedResources));
              }
              let entryList = Array.isArray(entries) ? entries : [];
              for (let key of entryList)
                result[key] || (result[key] = []);
              return result;
            };

export const collectProjectFileReferences = (value: any, references: Set<string> = new Set()) => {
                    if (typeof value == `string` && value.startsWith(`file://`)) {
                      try {
                        references.add(localPathFromProjectFileUrl(value) || decodeURIComponent(new URL(value).pathname));
                      } catch {}
                      return references;
                    }
                    if (Array.isArray(value)) {
                      value.forEach((item) => collectProjectFileReferences(item, references));
                      return references;
                    }
                    if (value && typeof value == `object`)
                      Object.values(value).forEach((item) => collectProjectFileReferences(item, references));
                    return references;
                  };

export const EXPORT_RUNTIME_NODE_DATA_KEYS = new Set([
                    `apiConfigs`,
                    `modelProtocolRegistry`,
                    `textModelApiBindings`,
                    `textModelProtocolBindings`,
                    `imageModelApiBindings`,
                    `imageModelProtocolBindings`,
                    `videoModelProtocolBindings`,
	                    `videoModelApiBindings`,
	                    `videoModelRequestProfiles`,
	                    `audioModelProtocolBindings`,
	                    `audioModelApiBindings`,
	                    `onGenerate`,
                    `onGenerateText`,
                    `onGenerateVideo`,
                    `onGenerateCustom`,
                    `onGenerateAudio`,
                    `onAIAssist`,
                    `onSaveTemplate`,
                    `onCrop`,
                    `onVideoEdit`,
                    `onSplit`,
                    `onSplitOne`,
                    `onZoom`,
                    `onEdit`,
                    `onAddImage`,
                    `onStop`,
                    `onShowToast`,
                    `onSendToActiveTab`,
                    `onTianjiPortraitReview`,
                    `onExtractFrames`,
                    `updateGlobalTasks`,
                  ]);
