// @ts-nocheck
/**
 * openConfigButlerManualProblemFields。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";
import { buildButlerFallbackProtocol, inferConfigButlerProblemPart, normalizeProtocolConfig } from "../lib/config-butler";
import { cloneBackupValue } from "../lib/backup";

interface UseOpenConfigButlerManualProblemFieldsDeps {
  configButlerErrorAssistant: any;
  getConfigButlerRepairContext: any;
  setConfigButlerManualProblemPart: SetAny;
  setConfigButlerManualProtocolName: SetAny;
  setConfigButlerManualProtocolOpen: SetAny;
  setConfigButlerManualProtocolText: SetAny;
  showToast2: Toast;
}

export function use_openConfigButlerManualProblemFields(deps: UseOpenConfigButlerManualProblemFieldsDeps) {
  const {
    configButlerErrorAssistant,
    getConfigButlerRepairContext,
    setConfigButlerManualProblemPart,
    setConfigButlerManualProtocolName,
    setConfigButlerManualProtocolOpen,
    setConfigButlerManualProtocolText,
    showToast2,
  } = deps;
  const openConfigButlerManualProblemFields = () => {
		              let errorAssistant = configButlerErrorAssistant;
		              if (!errorAssistant?.task?.modelName) {
		                showToast2(`没有可编辑的失败模型`);
		                return;
		              }
		              let repairContext = getConfigButlerRepairContext(errorAssistant.task),
		                protocolConfig = cloneBackupValue(
		                  repairContext.protocolConfig ||
		                  errorAssistant.diagnosis?.suggestedProtocol?.config ||
		                  errorAssistant.task?.requestProfile ||
		                  buildButlerFallbackProtocol(errorAssistant.task.modelName, {
		                    category: repairContext.category,
		                    apiUrl: errorAssistant.task.apiBaseUrl || ``,
		                  })?.config ||
		                  {},
		                ),
		                normalizedConfig = normalizeProtocolConfig({
		                  ...protocolConfig,
		                  category: repairContext.category,
		                }, repairContext.category),
		                protocolName = String(
		                  errorAssistant.diagnosis?.suggestedProtocol?.name ||
		                  `配置管家手动修复-${errorAssistant.task.modelName}`,
		                ).trim();
		              (setConfigButlerManualProtocolName(protocolName),
		                setConfigButlerManualProtocolText(JSON.stringify(normalizedConfig, null, 2)),
		                setConfigButlerManualProblemPart(inferConfigButlerProblemPart(errorAssistant)),
		                setConfigButlerManualProtocolOpen(true));
		            };
  return { openConfigButlerManualProblemFields };
}
