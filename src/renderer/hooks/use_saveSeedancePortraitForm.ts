/**
 * saveSeedancePortraitForm。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { Toast } from "../lib/app-types";
import { wanjuanNormalizeSeedanceAssetId, wanjuanPortableSeedancePortraitPreview } from "../lib/seedance";

interface UseSaveSeedancePortraitFormDeps {
  persistSeedanceVirtualPortraits: any;
  resetSeedancePortraitForm: any;
  seedancePortraitEditingId: any;
  seedancePortraitForm: any;
  seedanceVirtualPortraits: any;
  showToast2: Toast;
}

export function use_saveSeedancePortraitForm(deps: UseSaveSeedancePortraitFormDeps) {
  const {
    persistSeedanceVirtualPortraits,
    resetSeedancePortraitForm,
    seedancePortraitEditingId,
    seedancePortraitForm,
    seedanceVirtualPortraits,
    showToast2,
  } = deps;
  const saveSeedancePortraitForm = async () => {
      let assetId = wanjuanNormalizeSeedanceAssetId(seedancePortraitForm.assetId);
      if (!assetId) {
        showToast2(`请先填写人像 Asset ID`);
        return;
      }
      let previewUrl = await wanjuanPortableSeedancePortraitPreview(seedancePortraitForm.previewUrl || seedancePortraitForm.imageUrl || ``);
      let portrait = {
          id: seedancePortraitEditingId || `portrait-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          name: String(seedancePortraitForm.name || ``).trim() || assetId,
          assetId: assetId,
          imageUrl: ``,
          previewUrl: String(previewUrl || ``).trim(),
          projectName: String(seedancePortraitForm.projectName || ``).trim(),
          notes: String(seedancePortraitForm.notes || ``).trim(),
          createdAt: seedancePortraitEditingId ?
            seedanceVirtualPortraits.find((portrait2) => portrait2.id === seedancePortraitEditingId)?.createdAt || Date.now() :
            Date.now(),
        },
        updatedPortraits = seedancePortraitEditingId ?
        seedanceVirtualPortraits.map((portrait2) => portrait2.id === seedancePortraitEditingId ? portrait : portrait2) :
        [portrait, ...seedanceVirtualPortraits];
      (persistSeedanceVirtualPortraits(updatedPortraits),
        resetSeedancePortraitForm(),
        showToast2(`虚拟人像已保存`));
    };
  return { saveSeedancePortraitForm };
}
