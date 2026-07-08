// @ts-nocheck
/**
 * runManualConfigButlerErrorQuery。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny, Toast } from "../lib/app-types";

interface UseRunManualConfigButlerErrorQueryDeps {
  configButlerErrorAssistant: any;
  configButlerErrorAssistantMinimized: any;
  globalTasks: any;
  maybeTriggerConfigButlerErrorDiagnosis: any;
  setConfigButlerErrorAssistant: SetAny;
  setConfigButlerErrorAssistantMinimized: SetAny;
  showToast2: Toast;
}

export function use_runManualConfigButlerErrorQuery(deps: UseRunManualConfigButlerErrorQueryDeps) {
  const {
    configButlerErrorAssistant,
    configButlerErrorAssistantMinimized,
    globalTasks,
    maybeTriggerConfigButlerErrorDiagnosis,
    setConfigButlerErrorAssistant,
    setConfigButlerErrorAssistantMinimized,
    showToast2,
  } = deps;
  const runManualConfigButlerErrorQuery = () => {
		              let scanId = `manual-scan-${Date.now()}`;
		              if (configButlerErrorAssistant && configButlerErrorAssistantMinimized) {
		                setConfigButlerErrorAssistantMinimized(false);
		                return;
		              }
		              showToast2(`配置管家正在查询最近错误`);
		              setConfigButlerErrorAssistantMinimized(false);
		              setConfigButlerErrorAssistant({
		                id: scanId,
		                status: `checking`,
		                manualScan: true,
			                title: `配置管家正在扫描最新错误`,
			                task: {
			                  modelName: `最近任务记录`,
			                  errorMsg: `正在扫描最新一次任务报错记录...`,
			                },
		                failures: [],
		                signature: `manual-scan`,
		                triggeredAt: Date.now(),
		                diagnosis: null,
		              });
		              window.setTimeout(() => {
		                let triggerResult = maybeTriggerConfigButlerErrorDiagnosis(globalTasks, [], {
		                  manual: true,
		                });
		                triggerResult ||
		                  setConfigButlerErrorAssistant((prevAssistant) =>
		                    prevAssistant?.id === scanId ? {
		                      ...prevAssistant,
			                      status: `ready`,
			                      task: {
			                        modelName: `最近任务扫描`,
			                        errorMsg: `未找到可诊断的失败任务记录`,
			                      },
			                      diagnosis: {
			                        classification: `unknown`,
			                        confidence: 1,
			                        summary: `最近任务记录里没有发现可诊断的失败任务。`,
			                        evidence: [
			                          `已扫描任务清单中的失败记录。`,
			                          `配置管家现在只在手动点击错误查询时，读取最新一条失败任务进行诊断。`,
			                        ],
			                        suggestedFix: `如果刚刚的节点已经报错，请先确认任务清单里出现失败记录，然后再次点击错误查询。`,
			                        shouldApplyPatch: false,
		                      },
		                    } : prevAssistant,
		                  );
		              }, 800);
		            };
  return { runManualConfigButlerErrorQuery };
}
