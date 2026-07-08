/**
 * applyConfigButlerManualProtocolFix。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Toast } from "../lib/app-types";

interface UseApplyConfigButlerManualProtocolFixDeps {
  applyConfigButlerProtocolRepair: any;
  configButlerErrorAssistant: any;
  configButlerManualProtocolName: any;
  configButlerManualProtocolText: any;
  getConfigButlerRepairContext: any;
  showToast2: Toast;
}

export function use_applyConfigButlerManualProtocolFix(deps: UseApplyConfigButlerManualProtocolFixDeps) {
  const {
    applyConfigButlerProtocolRepair,
    configButlerErrorAssistant,
    configButlerManualProtocolName,
    configButlerManualProtocolText,
    getConfigButlerRepairContext,
    showToast2,
  } = deps;
  const applyConfigButlerManualProtocolFix = () => {
		              let errorAssistant = configButlerErrorAssistant;
		              if (!errorAssistant?.task?.modelName) return;
		              try {
		                let parsedConfig = JSON.parse(configButlerManualProtocolText || `{}`),
		                  repairContext = getConfigButlerRepairContext(errorAssistant.task),
		                  protocolName = String(configButlerManualProtocolName || repairContext.protocolName || `配置管家手动修复-${errorAssistant.task.modelName}`).trim();
		                applyConfigButlerProtocolRepair({
		                  name: protocolName,
		                  config: {
		                    category: repairContext.category,
		                    ...parsedConfig,
		                  },
		                }, `手动修复`);
		              } catch (error) {
		                showToast2(`手动修复 JSON 格式不正确：${error.message}`);
		              }
		            };
  return { applyConfigButlerManualProtocolFix };
}
