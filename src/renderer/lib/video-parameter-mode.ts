export type WanJuanVideoParameterMode = `ratio-quality` | `exact-resolution` | `follow-source`;

export function wanjuanResolveVideoParameterMode(config: any = {}): WanJuanVideoParameterMode {
  let explicitMode = String(config?.parameterMode || ``).trim();
  if ([`ratio-quality`, `exact-resolution`, `follow-source`].includes(explicitMode))
    return explicitMode as WanJuanVideoParameterMode;
  let adapter = config?.parameterAdapter && typeof config.parameterAdapter === `object` ? config.parameterAdapter : {},
    resolutionMode = String(config?.resolutionValueMode || adapter.resolutionValueMode || ``).trim().toLowerCase(),
    aspectRatioMode = String(config?.aspectRatioValueMode || adapter.aspectRatioValueMode || ``).trim().toLowerCase();
  if ([`none`, `omit`].includes(resolutionMode) && [`none`, `omit`, ``].includes(aspectRatioMode)) return `follow-source`;
  if ([`aspect-ratio`, `ratio`, `quality`, `quality-preset`, `preset`].includes(resolutionMode) || [`aspect-ratio`, `ratio`].includes(aspectRatioMode))
    return `ratio-quality`;
  return `exact-resolution`;
}

export function wanjuanVideoParameterModeLabel(mode: WanJuanVideoParameterMode): string {
  return mode === `ratio-quality` ? `比例与清晰度` : mode === `follow-source` ? `跟随素材` : `精确分辨率`;
}
