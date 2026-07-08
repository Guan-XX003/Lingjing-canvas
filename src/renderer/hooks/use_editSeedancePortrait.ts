/**
 * editSeedancePortrait。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";

interface UseEditSeedancePortraitDeps {
  setSeedancePortraitEditingId: SetAny;
  setSeedancePortraitForm: SetAny;
  setSeedancePortraitLibraryExpanded: SetAny;
}

export function use_editSeedancePortrait(deps: UseEditSeedancePortraitDeps) {
  const {
    setSeedancePortraitEditingId,
    setSeedancePortraitForm,
    setSeedancePortraitLibraryExpanded,
  } = deps;
  const editSeedancePortrait = (portrait) => {
      (setSeedancePortraitEditingId(portrait.id),
        setSeedancePortraitForm({
          name: portrait.name || ``,
          assetId: portrait.assetId || ``,
          imageUrl: ``,
          previewUrl: portrait.previewUrl || portrait.imageUrl || ``,
          projectName: portrait.projectName || ``,
          notes: portrait.notes || ``,
        }),
        setSeedancePortraitLibraryExpanded(true));
    };
  return { editSeedancePortrait };
}
