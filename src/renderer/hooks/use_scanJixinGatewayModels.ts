// @ts-nocheck
/**
 * scanJixinGatewayModels。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { compareButlerModelSnapshots, filterButlerLatestTwoGenerations, scanButlerTargetModels } from "../lib/config-butler";
import { fetchDocAsPlainText } from "../lib/app-root-helpers";
import { wanjuanHashString } from "../lib/collaboration";

export function use_scanJixinGatewayModels(deps: any) {
  const {
    WANJUAN_JIXIN_API_URL,
    WANJUAN_JIXIN_DOC_URL,
    getJixinApiConfig,
    readChromeStorage,
    setJixinModelScanBusy,
    setJixinModelScanNotice,
    showToast2,
    writeChromeStorage,
  } = deps;
  const scanJixinGatewayModels = async (options = {}) => {
	          let jixinConfig = options.apiConfig || getJixinApiConfig();
	          if (!jixinConfig || !String(jixinConfig.key || ``).trim()) {
	            options.force && showToast2(`请先在极鑫统一 API 配置中填写令牌`);
	            return null;
	          }
	          try {
	            setJixinModelScanBusy(true);
	            let rawModels = await scanButlerTargetModels({
	                apiConfig: jixinConfig,
	                filterLatestTwo: false,
	              }),
	              filteredModels = filterButlerLatestTwoGenerations(rawModels),
	              docText = await fetchDocAsPlainText(WANJUAN_JIXIN_DOC_URL).catch(() => ``),
	              docHash = docText ? wanjuanHashString(docText) : ``,
	              stored = await readChromeStorage([`jixinGatewayModelScanSnapshot`]),
	              previousSnapshot = stored.jixinGatewayModelScanSnapshot || {},
	              diff = compareButlerModelSnapshots(previousSnapshot.filteredModels || [], filteredModels),
	              docChanged = !!(previousSnapshot.docHash && docHash && previousSnapshot.docHash !== docHash),
	              snapshot = {
	                checkedAt: Date.now(),
	                apiUrl: WANJUAN_JIXIN_API_URL,
	                rawCount: rawModels.length,
	                filteredModels: filteredModels,
	                docHash: docHash,
	              };
	            writeChromeStorage({
	              jixinGatewayModelScanSnapshot: snapshot,
	              jixinGatewayModelScanLastAt: Date.now(),
	            });
	            if ((previousSnapshot.filteredModels || []).length && (diff.added.length || diff.removed.length || docChanged)) {
	              setJixinModelScanNotice({
	                ...diff,
	                docChanged: docChanged,
	                rawCount: rawModels.length,
	                filteredCount: filteredModels.length,
	                models: filteredModels,
	                checkedAt: Date.now(),
	                apiConfigId: jixinConfig.id,
	              });
	              showToast2(`极鑫中转站配置有更新，可一键同步`);
	            } else if (options.force) {
	              showToast2(`极鑫模型扫描完成，未发现变化`);
	            }
	            return {
	              rawModels,
	              filteredModels,
	              diff,
	            };
	          } catch (error) {
	            console.warn(`Jixin gateway model scan failed`, error);
	            options.force && showToast2(`极鑫模型扫描失败：${error.message || error}`);
	            return null;
	          } finally {
	            setJixinModelScanBusy(false);
	          }
	        };
  return { scanJixinGatewayModels };
}
