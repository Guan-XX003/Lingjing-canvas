/**
 * handleSeedancePortraitFile。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";
import { wanjuanPrepareSeedancePortraitPreview } from "../lib/seedance";

interface UseHandleSeedancePortraitFileDeps {
  setSeedancePortraitForm: SetAny;
}

export function use_handleSeedancePortraitFile(deps: UseHandleSeedancePortraitFileDeps) {
  const {
    setSeedancePortraitForm,
  } = deps;
  const handleSeedancePortraitFile = (event) => {
      let file = event?.target?.files?.[0];
      if (!file) return;
      let reader = new FileReader();
      reader.onload = async (event2) => {
        let dataUrl = String(event2.target?.result || ``);
        if (!dataUrl) return;
        try {
          dataUrl = await wanjuanPrepareSeedancePortraitPreview(dataUrl);
        } catch (error) {
          console.warn(`Seedance virtual portrait preview prepare failed`, error);
        }
        setSeedancePortraitForm((prevForm) => ({
          ...prevForm,
          previewUrl: dataUrl
        }));
      };
      reader.readAsDataURL(file);
      event.target.value = ``;
    };
  return { handleSeedancePortraitFile };
}
