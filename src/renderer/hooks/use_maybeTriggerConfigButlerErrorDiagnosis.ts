// @ts-nocheck
/**
 * maybeTriggerConfigButlerErrorDiagnosis。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Ref } from "../lib/app-types";
import { getConfigButlerTaskFailureSignature } from "../lib/config-butler";

interface UseMaybeTriggerConfigButlerErrorDiagnosisDeps {
  configButlerErrorAssistant: any;
  configButlerErrorAssistantInFlightRef: Ref;
  runConfigButlerErrorDiagnosis: any;
}

export function use_maybeTriggerConfigButlerErrorDiagnosis(deps: UseMaybeTriggerConfigButlerErrorDiagnosisDeps) {
  const {
    configButlerErrorAssistant,
    configButlerErrorAssistantInFlightRef,
    runConfigButlerErrorDiagnosis,
  } = deps;
  const maybeTriggerConfigButlerErrorDiagnosis = (tasksInput, existingSignatures = [], triggerOptions = {}) => {
			              let knownSignatures = new Set(
			                (Array.isArray(existingSignatures) ? existingSignatures : [])
			                .filter((item) => item?.status === `failed`)
			                .map((item) => item.id),
			              ),
			                tasksArray = Array.isArray(tasksInput) ? tasksInput : [],
			                isManualTrigger = triggerOptions?.manual === true;
			              if (!isManualTrigger) return false;
			              if (!isManualTrigger && configButlerErrorAssistant?.status === `checking`) return;
			              for (let failedTask of [...tasksArray].sort((itemA, itemB) => (itemB?.createdAt || 0) - (itemA?.createdAt || 0))) {
			                if (!failedTask || failedTask.status !== `failed` || failedTask.stoppedByUser || !failedTask.nodeId) continue;
			                let failureSignature = getConfigButlerTaskFailureSignature(failedTask);
			                if (!failureSignature) continue;
			                let failedTasks = tasksArray.filter((item) => item?.status === `failed` && !item.stoppedByUser && getConfigButlerTaskFailureSignature(item) === failureSignature);
			                if (!isManualTrigger && knownSignatures.size && !failedTasks.some((item) => !knownSignatures.has(item.id))) continue;
			                let dedupeKey = `manual-latest::${failedTask.id || Date.now()}::${failureSignature}`;
			                if (configButlerErrorAssistantInFlightRef.current.has(dedupeKey)) continue; // 只按 in-flight 去重：诊断进行中的重复点击跳过（inFlightRef 在诊断结束时清理）；seenRef 从不清理故不用它以免永久挡住重查
			                (configButlerErrorAssistantInFlightRef.current.add(dedupeKey),
			                  runConfigButlerErrorDiagnosis({
			                    task: failedTask,
		                    failures: failedTasks.slice(0, 3),
		                    signature: failureSignature,
		                    triggeredAt: Date.now(),
		                  }, dedupeKey));
		                return true;
		              }
		              return false;
		            };
  return { maybeTriggerConfigButlerErrorDiagnosis };
}
