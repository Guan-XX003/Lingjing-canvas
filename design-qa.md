# Tianji Local Portrait Preview Design QA

## Evidence

- Source visual truth: `/Users/guan/Desktop/截屏2026-08-13 17.44.05.png`
- Implementation full view: `/Users/guan/Documents/ChatGPT/万卷开发/Lingjing-canvas/docs/qa/tianji-local-preview-isolated-full-final-20260814.png`
- Implementation focused picker: `/Users/guan/Documents/ChatGPT/万卷开发/Lingjing-canvas/docs/qa/tianji-local-preview-isolated-picker-final-20260814.png`
- Source pixels: `3840 x 2160` at macOS Retina density.
- Implementation viewport: `1280 x 860` CSS px, captured at device scale factor `2` (`2560 x 1720` full view).
- Focused picker clip: about `758 x 434` CSS px equivalent, captured at scale `2` (`1516 x 868`).
- State: dark theme, Tianji mode, reference node open, seven isolated mock portraits, official preview absent, one local preview mapped, Active/Failed/Processing and long-name cases present.

The source screenshot includes desktop chrome, other applications, an alert, and a failed-preview picker. Fidelity was judged against the Tianji node and its three-column portrait picker rather than unrelated desktop content.

## Full-View Comparison

- The implementation preserves the existing dark canvas, compact Tianji node, anchored picker, three-column grid, header count, refresh action, and close action.
- The picker remains inside the node workflow and does not introduce a new page or card treatment.
- The focused state stays within the viewport and does not cover persistent navigation or bottom tools incoherently.

## Focused Region Comparison

- Local preview: the first portrait shows the mapped local file immediately while official-preview-free items retain the existing `无预览` placeholder.
- Image quality: cards use a stable square aspect ratio and `object-fit: cover`; the wide local test image is cropped without stretching, height growth, or overflow.
- Narrow layout: three equal columns remain inside the picker. Borders, gaps, header controls, labels, and the second row stay aligned.
- Long names: Chinese and English names truncate on one line; they do not widen cards or cover adjacent items.
- State clarity: Active items remain selectable. Failed and Processing items use dashed/disabled styling and show `处理失败` / `审核中` labels without overflowing.

## Required Fidelity Surfaces

- Fonts and typography: existing app font stack, weights, small-label scale, line height, and zero letter-spacing are preserved. Dynamic names use single-line truncation.
- Spacing and layout rhythm: existing compact margins, 3-column gap, radii, borders, and anchored popover proportions are preserved.
- Colors and tokens: existing charcoal surfaces, gray borders, cyan hover intent, muted disabled state, and white hierarchy are unchanged.
- Image quality and asset fidelity: local raster preview is rendered as a real image with cover cropping. No placeholder art, CSS drawing, or generated substitute was introduced.
- Copy and content: `天玑人像库`, `刷新素材`, `无预览`, `处理失败`, and `审核中` are concise and consistent with the existing Chinese UI.
- Accessibility and interaction: preview images have meaningful alt text in settings; full names remain available through titles; file selection uses a native input; unavailable items remain guarded by the existing click-time validation.

## Interaction And Console Checks

- Opened Settings -> Model Settings -> Tianji mode with isolated storage.
- Verified settings cards with local preview, no preview, failed, processing, and long-name states.
- Created an isolated Tianji node, switched to Tianji mode, and opened the narrow portrait picker.
- Verified seven mock items, local preview display, status labels, and no visible overflow.
- No upload, delete, remote refresh, or generation request was made.
- Console showed Electron development security warnings caused by the repository's existing `webSecurity: false` development setup; no new renderer exception or local-preview error was observed.

## Comparison History

1. Initial comparison found a P2 state-affordance issue: Failed and Processing cards looked selectable even though the generation path rejected them.
2. Fixed the picker to derive availability, apply disabled/dashed styling, and show `处理失败` / `审核中` in both the label and hover overlay. Settings now allow choosing a local preview only for Active assets.
3. Rebuilt, reran `280/280` library tests, and captured the final focused screenshot. The corrected cards remain within the same grid and no P0/P1/P2 issue remains.

## Findings

No actionable P0, P1, or P2 visual differences remain for the requested local-preview experience.

## Follow-up Polish

- P3: the isolated preview fixture deliberately uses the supplied screenshot rather than a portrait photo; this proves cover cropping and file rendering but is not production content.

final result: passed
