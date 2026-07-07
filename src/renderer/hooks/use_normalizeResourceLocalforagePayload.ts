// @ts-nocheck
/**
 * normalizeResourceLocalforagePayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { cloneBackupValue } from "../lib/backup";

export function use_normalizeResourceLocalforagePayload(deps: any) {
  const {
    TRANSIT_RESOURCES_STORAGE_KEY,
  } = deps;
  const normalizeResourceLocalforagePayload = (payload) => {
                      let normalizedPayload = payload && typeof payload == `object` ? cloneBackupValue(payload) : {};
                      return Object.prototype.hasOwnProperty.call(normalizedPayload, TRANSIT_RESOURCES_STORAGE_KEY) ?
                        {
                          [TRANSIT_RESOURCES_STORAGE_KEY]: cloneBackupValue(
                            normalizedPayload[TRANSIT_RESOURCES_STORAGE_KEY],
                          ),
                        } :
                        {};
                    };
  return { normalizeResourceLocalforagePayload };
}
