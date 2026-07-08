/**
 * blobToDataUrl。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

interface UseBlobToDataUrlDeps {}

export function use_blobToDataUrl(deps: UseBlobToDataUrlDeps) {
  const {} = deps;
  const blobToDataUrl = (blob) =>
            new Promise((resolvePromise, rejectPromise) => {
              let fileReader = new FileReader();
              ((fileReader.onload = () => resolvePromise(typeof fileReader.result == `string` ? fileReader.result : ``)),
                (fileReader.onerror = () => rejectPromise(fileReader.error || Error(`blob read failed`))),
                fileReader.readAsDataURL(blob));
            });
  return { blobToDataUrl };
}
