// @ts-nocheck
/**
 * showProjectAssetCandidateDialog。自 bundle(WanJuanAppCanvas) 抽出，逐字搬运、行为不变。
 */
import { useCallback } from "react";
import { buildProjectMediaFileUrl } from "../lib/resource";

interface UseAssetCandidateDialogDeps {}

export function useAssetCandidateDialog(deps: UseAssetCandidateDialogDeps) {
  const {} = deps;
  const showProjectAssetCandidateDialog = useCallback((missingEntry, candidates = []) => new Promise((resolve) => {
      let validCandidates = Array.isArray(candidates) ? candidates.filter((candidate) => candidate?.path) : [];
      if (!validCandidates.length) {
        resolve({
          action: `skip`
        });
        return;
      }
      let selectedPath = validCandidates[0]?.path || ``,
        overlay = document.createElement(`div`);
      Object.assign(overlay.style, {
        position: `fixed`,
        inset: `0`,
        zIndex: `2147483647`,
        background: `rgba(0,0,0,0.58)`,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `center`,
        padding: `24px`,
      });
      overlay.innerHTML = `<div data-panel style="width:min(880px,96vw);max-height:86vh;background:#171717;border:1px solid #3a3a3a;border-radius:14px;color:#f5f5f5;box-shadow:0 24px 80px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;"><div style="padding:16px 18px;border-bottom:1px solid #303030;display:flex;align-items:center;justify-content:space-between;gap:12px;"><div><div style="font-weight:800;font-size:15px;">确认候选素材重连</div><div data-subtitle style="font-size:12px;color:#aaa;margin-top:4px;"></div></div><button data-close style="border:1px solid #444;background:#232323;color:#ddd;border-radius:9px;padding:6px 10px;cursor:pointer;">关闭</button></div><div style="display:grid;grid-template-columns:280px minmax(0,1fr);min-height:0;overflow:hidden;"><div style="border-right:1px solid #303030;padding:14px;overflow:auto;"><div style="font-size:12px;color:#888;margin-bottom:8px;">缺失素材</div><div data-missing style="font-size:12px;line-height:1.6;color:#ddd;word-break:break-all;"></div><div style="font-size:12px;color:#888;margin:16px 0 8px;">候选列表</div><div data-list style="display:flex;flex-direction:column;gap:8px;"></div></div><div style="padding:14px;min-width:0;display:flex;flex-direction:column;gap:12px;"><div data-preview style="height:300px;background:#0d0d0d;border:1px solid #303030;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;"></div><div data-detail style="font-size:12px;color:#bbb;line-height:1.55;word-break:break-all;"></div></div></div><div style="padding:12px 14px;border-top:1px solid #303030;display:flex;justify-content:flex-end;gap:10px;"><button data-skip style="border:1px solid #444;background:#222;color:#ddd;border-radius:9px;padding:8px 12px;cursor:pointer;">跳过这个</button><button data-use style="border:1px solid #2f7df6;background:#1677ff;color:white;border-radius:9px;padding:8px 14px;font-weight:800;cursor:pointer;">使用选中素材</button></div></div>`;
      let closeOverlay = () => {
          overlay.remove();
        },
        resolveAndClose = (result) => {
          closeOverlay();
          resolve(result);
        },
        buildFileUrl = (path) => {
          if (!path) return ``;
          return buildProjectMediaFileUrl(path) || path;
        },
        renderPreview = () => {
          let selectedCandidate = validCandidates.find((candidate) => candidate.path === selectedPath) || validCandidates[0],
            previewEl = overlay.querySelector(`[data-preview]`),
            detailEl = overlay.querySelector(`[data-detail]`),
            listEl = overlay.querySelector(`[data-list]`);
          if (!selectedCandidate || !previewEl || !detailEl || !listEl) return;
          listEl.querySelectorAll(`[data-candidate]`).forEach((candidateEl) => {
            let isSelected = candidateEl.getAttribute(`data-path`) === selectedPath;
            ((candidateEl.style.borderColor = isSelected ? `#60a5fa` : `#383838`),
              (candidateEl.style.background = isSelected ? `rgba(37,99,235,.18)` : `#202020`));
          });
          previewEl.innerHTML = ``;
          let mediaUrl = buildFileUrl(selectedCandidate.path),
            mediaKind = String(selectedCandidate.kind || ``).toLowerCase();
          if (mediaKind === `video`) {
            let videoEl = document.createElement(`video`);
            ((videoEl.src = mediaUrl), (videoEl.controls = true), (videoEl.muted = true), Object.assign(videoEl.style, {
              maxWidth: `100%`,
              maxHeight: `100%`,
            }), previewEl.appendChild(videoEl));
          } else if (mediaKind === `audio`) {
            let audioEl = document.createElement(`audio`);
            ((audioEl.src = mediaUrl), (audioEl.controls = true), Object.assign(audioEl.style, {
              width: `92%`,
            }), previewEl.appendChild(audioEl));
          } else if (mediaKind === `image`) {
            let imageEl = document.createElement(`img`);
            ((imageEl.src = mediaUrl), Object.assign(imageEl.style, {
              maxWidth: `100%`,
              maxHeight: `100%`,
              objectFit: `contain`,
            }), previewEl.appendChild(imageEl));
          } else {
            let fallbackEl = document.createElement(`div`);
            ((fallbackEl.textContent = selectedCandidate.filename || selectedCandidate.path), Object.assign(fallbackEl.style, {
              color: `#aaa`,
              padding: `16px`,
              textAlign: `center`,
            }), previewEl.appendChild(fallbackEl));
          }
          detailEl.textContent = `文件：${selectedCandidate.filename || ``}\n大小：${selectedCandidate.size || 0} bytes\n匹配原因：${(selectedCandidate.reasons || []).join(`、`) || `同类型候选`}\n路径：${selectedCandidate.path || ``}`;
        };
      let subtitleEl = overlay.querySelector(`[data-subtitle]`),
        missingInfoEl = overlay.querySelector(`[data-missing]`),
        listContainer = overlay.querySelector(`[data-list]`);
      subtitleEl && (subtitleEl.textContent = `自动精确匹配失败，请人工确认是否使用候选素材`);
      missingInfoEl && (missingInfoEl.textContent = `节点：${missingEntry.nodeLabel || missingEntry.nodeId || missingEntry.nodeType || `未知节点`}\n字段：${missingEntry.field || ``}\n素材ID：${missingEntry.binding?.assetId || ``}\n原文件：${missingEntry.binding?.filename || missingEntry.binding?.originalName || ``}\n原大小：${missingEntry.binding?.size || 0} bytes`);
      validCandidates.forEach((candidate) => {
        let candidateButton = document.createElement(`button`);
        candidateButton.setAttribute(`data-candidate`, `1`);
        candidateButton.setAttribute(`data-path`, candidate.path || ``);
        Object.assign(candidateButton.style, {
          textAlign: `left`,
          border: `1px solid #383838`,
          background: `#202020`,
          color: `#eee`,
          borderRadius: `9px`,
          padding: `9px`,
          cursor: `pointer`,
          fontSize: `12px`,
          lineHeight: `1.45`,
        });
        ((candidateButton.innerHTML = `<div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div><div style="color:#9ca3af;margin-top:3px;"></div>`),
          (candidateButton.querySelector(`div`).textContent = candidate.filename || candidate.path || `候选素材`),
          (candidateButton.querySelectorAll(`div`)[1].textContent = `${candidate.kind || `素材`} · ${candidate.size || 0} bytes · ${(candidate.reasons || []).join(`、`) || `候选`}`),
          (candidateButton.onclick = () => {
            selectedPath = candidate.path || ``;
            renderPreview();
          }),
          listContainer?.appendChild(candidateButton));
      });
      overlay.querySelector(`[data-close]`)?.addEventListener(`click`, () => resolveAndClose({
        action: `cancel`
      }));
      overlay.querySelector(`[data-skip]`)?.addEventListener(`click`, () => resolveAndClose({
        action: `skip`
      }));
      overlay.querySelector(`[data-use]`)?.addEventListener(`click`, () => resolveAndClose({
        action: `use`,
        path: selectedPath
      }));
      document.body.appendChild(overlay);
      renderPreview();
    }), []);
  return { showProjectAssetCandidateDialog };
}
