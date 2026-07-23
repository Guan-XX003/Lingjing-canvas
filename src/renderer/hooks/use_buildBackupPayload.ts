/**
 * buildBackupPayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseBuildBackupPayloadDeps {
  buildBackupModules: any;
}

export function use_buildBackupPayload(deps: UseBuildBackupPayloadDeps) {
  const {
    buildBackupModules,
  } = deps;
  const buildBackupPayload = async (chromeStorage, userData, moduleSelection, backupOptions = {}) => ({
			                            version: `1.4.0`,
                            backupFormat: `4`,
                            exportedAt: new Date().toISOString(),
                            modules: await buildBackupModules(chromeStorage, userData, moduleSelection, backupOptions),
                          });
  return { buildBackupPayload };
}
