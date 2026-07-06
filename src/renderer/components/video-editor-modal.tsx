/**
 * 视频剪辑台模态框。
 *
 * 基于 <video> + MediaRecorder 的轻量剪辑器：时间线选段（裁剪起止点）、
 * 画面区域裁剪、预览缩放布局拖拽，导出经桌面端 trimVideoSegment 或
 * 浏览器 MediaRecorder 重录两条路径。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";

export function videoEditorModal({
  videoUrl,
  initialName,
  onSave,
  onClose
}) {
  let videoRef = useRef(null),
    timelineTrackRef = useRef(null),
    trimDragRef = useRef(null),
    layoutDragRef = useRef(null),
    previewResizeRef = useRef(null),
    layoutArmTimerRef = useRef(null),
    editorShellRef = useRef(null),
    [cropRegion, setCropRegion] = useState({
      unit: `%`,
      x: 0,
      y: 0,
      width: 100,
      height: 100
    }),
    [previewError, setPreviewError] = useState(null),
    [startTime, setStartTime] = useState(0),
    [endTime, setEndTime] = useState(0),
    [duration, setDuration] = useState(0),
    [savedSegments, setSavedSegments] = useState([]),
    [isExporting, setIsExporting] = useState(!1),
    [statusMessage, setStatusMessage] = useState(`准备开始`),
    [isPreviewing, setIsPreviewing] = useState(!1),
    [playheadTime, setPlayheadTime] = useState(0),
    [isPlaying, setIsPlaying] = useState(!1),
    [videoFrame, setVideoFrame] = useState({
      width: 9,
      height: 16
    }),
    [layoutPreset, setLayoutPreset] = useState(`balanced`),
    [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!1),
    [isTimelineCollapsed, setIsTimelineCollapsed] = useState(!1),
    [maximizedPanel, setMaximizedPanel] = useState(null),
    [horizontalRatio, setHorizontalRatio] = useState(0.78),
    [verticalRatio, setVerticalRatio] = useState(0.72),
    [guideState, setGuideState] = useState(null),
    [previewZoom, setPreviewZoom] = useState(1),
    outputBaseName = useMemo(() => {
      let base = String(initialName || `edited-video`).trim() || `edited-video`;
      return base.replace(/\.[^.]+$/, ``) || `edited-video`;
    }, [initialName]),
    clamp = (value, max) => {
      let safeValue = Number.isFinite(value) ? value : 0,
        safeMax = Number.isFinite(max) ? max : 0;
      return Math.max(0, Math.min(safeValue, safeMax));
    },
    roundToTenth = (value) => {
      let num = Number(value);
      return Number.isFinite(num) ? Math.round(num * 10) / 10 : 0;
    },
	    formatTime = (seconds) => {
	      let clampedSeconds = Math.max(0, Number(seconds) || 0),
	        minutes = Math.floor(clampedSeconds / 60),
	        secondsStr = (clampedSeconds % 60).toFixed(1).padStart(4, `0`);
	      return `${String(minutes).padStart(2, `0`)}:${secondsStr}`;
	    },
	    setStartSeconds = (value) => {
	      let clamped = clamp(roundToTenth(value), duration);
	      setStartTime(Math.min(clamped, Math.max(0, endTime - 0.1)));
	    },
	    setEndSeconds = (value) => {
	      let clamped = clamp(roundToTenth(value), duration);
	      setEndTime(Math.max(clamped, Math.min(duration, startTime + 0.1)));
	    },
    waitForMetadata = async (video) =>
      new Promise((resolve: any, reject: any) => {
        if (
          video.readyState >= 1 &&
          Number.isFinite(video.duration) &&
          video.duration > 0 &&
          video.videoWidth &&
          video.videoHeight
        ) {
          resolve();
          return;
        }
        let timeoutId = window.setTimeout(() => {
            (cleanup(), reject(Error(`视频加载超时，请检查源文件是否可访问`)));
          }, 12e3),
          cleanup = () => {
            window.clearTimeout(timeoutId);
            (video.removeEventListener(`loadedmetadata`, onLoaded),
              video.removeEventListener(`error`, onError));
          },
          onLoaded = () => {
            (cleanup(), resolve());
          },
          onError = () => {
            (cleanup(), reject(Error(`视频加载失败`)));
          };
        (video.addEventListener(`loadedmetadata`, onLoaded, {
            once: !0
          }),
          video.addEventListener(`error`, onError, {
            once: !0
          }),
          video.load?.());
      }),
      seekTo = async (video, targetTime) =>
        new Promise((resolve: any, reject: any) => {
          let sourceDuration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : targetTime,
            target = Math.max(0, Math.min(Number(targetTime) || 0, Math.max(0, sourceDuration - 0.05)));
          if (Math.abs((video.currentTime || 0) - target) < 0.05) {
            resolve();
            return;
          }
          let timeoutId = window.setTimeout(() => {
              (cleanup(), reject(Error(`视频定位超时，请重新打开剪辑台后再试`)));
            }, 8e3),
            cleanup = () => {
              window.clearTimeout(timeoutId);
              (video.removeEventListener(`seeked`, onSeeked),
                video.removeEventListener(`error`, onError));
            },
            onSeeked = () => {
              (cleanup(), resolve());
            },
            onError = () => {
              (cleanup(), reject(Error(`视频定位失败`)));
            };
          (video.addEventListener(`seeked`, onSeeked, {
              once: !0
            }),
            video.addEventListener(`error`, onError, {
              once: !0
            }),
            (video.currentTime = target));
        }),
        selectionSegments = useMemo(() => {
          let clampedStart = clamp(roundToTenth(startTime), duration),
            clampedEnd = clamp(roundToTenth(endTime), duration);
          return clampedEnd <= clampedStart + 0.05 || duration <= 0 ? [] : [{
            id: `current`,
            start: clampedStart,
            end: clampedEnd
          }];
        }, [startTime, endTime, duration]),
        outputSegments = useMemo(() => {
          let cursor = 0;
          return selectionSegments.map((segment, index) => {
            let segDuration = Math.max(0, segment.end - segment.start),
              entry = {
                ...segment,
                index,
                duration: segDuration,
                outputStart: cursor,
                outputEnd: cursor + segDuration
              };
            return (cursor += segDuration), entry;
          });
        }, [selectionSegments]),
        totalOutputDuration = useMemo(
          () => outputSegments.reduce((sum, segment) => sum + segment.duration, 0),
          [outputSegments],
        ),
        toPercent = (value, total = duration) => (total > 0 ? `${Math.max(0, Math.min(100, (value / total) * 100))}%` : `0%`),
        clampRatio = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)),
        snapRatio = (value, min, max, snapPoints = []) => {
          let clamped = clampRatio(value, min, max),
            snappedTo = null;
          for (let point of snapPoints)
            if (Math.abs(clamped - point) <= 0.025) {
              ((clamped = point), (snappedTo = point));
              break;
            }
          return {
            value: clampRatio(clamped, min, max),
            snap: snappedTo
          };
        },
        applyLayoutPreset = (preset) => {
          (setLayoutPreset(preset),
            setMaximizedPanel(null),
            setIsSidebarCollapsed(!1),
            setIsTimelineCollapsed(!1),
            preset === `focus-preview` ?
              (setHorizontalRatio(0.82),
              setVerticalRatio(0.78),
              setPreviewZoom(1),
              setStatusMessage(`已切换到预览优先布局`)) :
            preset === `timeline-focus` ?
            (setHorizontalRatio(0.72),
              setVerticalRatio(0.58),
              setPreviewZoom(isPortraitVideo ? 0.88 : 0.82),
              setStatusMessage(`已切换到时间线优先布局`)) :
            (setHorizontalRatio(0.78),
              setVerticalRatio(0.72),
              setPreviewZoom(isPortraitVideo ? 1 : 0.95),
              setStatusMessage(`已恢复均衡布局`)),
            setGuideState({
              kind: `preset`,
              label: preset === `focus-preview` ?
                `布局预设：预览优先` :
                preset === `timeline-focus` ?
                `布局预设：时间线优先` :
                `布局预设：均衡`,
            }));
        },
        togglePanelMaximize = (panel) => {
          setMaximizedPanel((current) => (current === panel ? null : panel));
          setGuideState({
            kind: `panel`,
            label: panel === `preview` ?
              `切换预览放大` :
              panel === `sidebar` ?
              `切换侧栏放大` :
              `切换时间线放大`,
          });
        },
        beginLayoutDrag = (mode, event) => {
          (event.preventDefault(),
            event.stopPropagation(),
            layoutArmTimerRef.current &&
            (window.clearTimeout(layoutArmTimerRef.current),
              (layoutArmTimerRef.current = null)),
            (layoutDragRef.current = {
              mode
            }),
            setGuideState({
              kind: mode,
              label: mode === `horizontal` ? `拖动调整左右面板` : `拖动调整预览与轨道`,
            }));
        },
        beginPreviewResize = (event) => {
          (event.preventDefault(),
            event.stopPropagation(),
            (previewResizeRef.current = {
              startX: event.clientX,
              startY: event.clientY,
              startZoom: previewZoom,
            }),
            setGuideState({
              kind: `preview-size`,
              label: `预览画面 ${Math.round(previewZoom * 100)}%`,
            }));
        },
        isPortraitVideo = videoFrame.height > videoFrame.width,
        previewAreaRatio = maximizedPanel === `preview` ? 1 : horizontalRatio,
        showSidebar = !1,
        showTimeline = !isTimelineCollapsed && maximizedPanel !== `preview` && maximizedPanel !== `sidebar`,
        topAreaRatio = maximizedPanel === `timeline` ? 0.28 : !showTimeline ? 1 : clampRatio(verticalRatio, 0.52, isPortraitVideo ? 0.82 : 0.8),
        previewFrameWidth =
	        isPortraitVideo ?
	        `min(100%, ${Math.round(360 * previewZoom)}px)` :
	        `min(100%, ${Math.round(900 * previewZoom)}px)`,
		        previewFrameHeight = isPortraitVideo ?
		        `min(calc(100% - 20px), clamp(280px, calc(100vh - 430px), ${Math.round(640 * previewZoom)}px))` :
		        void 0,
		        previewFrameMaxHeight = isPortraitVideo ?
		        `min(calc(100% - 20px), clamp(280px, calc(100vh - 430px), ${Math.round(640 * previewZoom)}px))` :
		        `min(calc(100% - 20px), clamp(220px, calc(100vh - 430px), ${Math.round(506 * previewZoom)}px))`,
        trackTimeFromClientX = (clientX) => {
          let trackEl = timelineTrackRef.current;
          if (!trackEl || !duration) return 0;
          let rect = trackEl.getBoundingClientRect(),
            ratio = (clientX - rect.left) / Math.max(1, rect.width);
          return clamp(ratio * duration, duration);
        },
        beginTrimDrag = (mode, event) => {
          (event.preventDefault(),
            event.stopPropagation(),
            (trimDragRef.current = {
              mode
            }));
        },
        seekToTime = async (time) => {
            let video = videoRef.current;
            if (!video || !duration) return;
            try {
              let clamped = clamp(roundToTenth(time), duration);
              (await seekTo(video, clamped), setPlayheadTime(clamped));
            } catch (err) {
              (console.error(`Video seek failed`, err), setStatusMessage(err.message || `定位失败`));
            }
          },
          togglePlayback = async () => {
              let video = videoRef.current;
              if (!video) return;
              try {
                video.paused ? await video.play() : (video.pause(), setIsPreviewing(!1));
              } catch (err) {
                (console.error(`Video toggle failed`, err), setStatusMessage(err.message || `播放失败`));
              }
            },
            markInPoint = () => {
              let video = videoRef.current;
              if (!video) return;
              let time = clamp(roundToTenth(video.currentTime || 0), duration);
              (setStartTime(time), time >= endTime && setEndTime(clamp(roundToTenth(Math.min(duration, time + 1)), duration)), setStatusMessage(`起点设为 ${formatTime(time)}`));
            },
            markOutPoint = () => {
              let video = videoRef.current;
              if (!video) return;
              let time = clamp(roundToTenth(video.currentTime || 0), duration);
              (setEndTime(time), time <= startTime && setStartTime(clamp(roundToTenth(Math.max(0, time - 1)), duration)), setStatusMessage(`终点设为 ${formatTime(time)}`));
            },
            resetSelection = () => {
              duration > 0 && (setStartTime(0), setEndTime(duration), setPlayheadTime(0), setStatusMessage(`已恢复到完整视频时长`));
            },
            previewSelection = async () => {
                let video = videoRef.current;
                if (!video || isExporting) return;
                let start = clamp(roundToTenth(startTime), duration),
                  end = clamp(roundToTenth(endTime), duration);
                if (end <= start + 0.05) {
                  setStatusMessage(`当前选区无效`);
                  return;
                }
                try {
                  (setIsPreviewing(!0), await seekTo(video, start), await video.play(), setStatusMessage(`正在预览 ${formatTime(start)} - ${formatTime(end)}`));
                } catch (err) {
                  (console.error(`Video preview failed`, err),
                    setStatusMessage(err.message || `视频预览失败`),
                    setIsPreviewing(!1));
                }
              },
              exportClip = async () => {
                if (isExporting) return;
                let sourceVideo = videoRef.current;
                if (!sourceVideo) return;
                let segments = selectionSegments;
                if (!segments.length) {
                  setStatusMessage(`当前选区无效`);
                  return;
                }
                let recorder = null,
                  frameRenderError = null,
                  paintFrameId = null;
                try {
                  (setIsExporting(!0), setStatusMessage(`正在准备导出...`), await waitForMetadata(sourceVideo));
                  if (segments.length === 1 && typeof window < `u` && typeof window.wanjuanDesktop?.trimVideoSegment == `function`) {
                    try {
                      let segment = segments[0];
                      setStatusMessage(`正在导出副本...`);
                      let nativeResult = await window.wanjuanDesktop.trimVideoSegment({
                        url: videoUrl,
                        filename: `${outputBaseName}.mp4`,
                        outputFilename: `${outputBaseName}-edited.mp4`,
                        start: segment.start,
                        end: segment.end,
                        duration: Math.max(0, segment.end - segment.start)
                      });
                      if (!nativeResult?.ok || (!nativeResult.url && !nativeResult.localPath))
                        throw Error(nativeResult?.error || `桌面端未生成剪辑副本`);
                      (setIsExporting(!1), setStatusMessage(`导出完成`), onSave({
                        url: nativeResult.url || nativeResult.localPath,
                        label: nativeResult.filename || `${outputBaseName}-edited.mp4`,
                        mime: nativeResult.mime || `video/mp4`,
                        size: nativeResult.size || 0,
                        duration: nativeResult.duration || totalOutputDuration
                      }));
                      return;
                    } catch (nativeError) {
                      (console.warn(`Native video trim failed, falling back to recorder`, nativeError),
                        setStatusMessage(`桌面导出失败，正在尝试兼容导出...`));
                    }
                  }
                  if (
                    typeof MediaRecorder > `u` ||
                    typeof HTMLCanvasElement > `u` ||
                    typeof HTMLCanvasElement.prototype.captureStream != `function`
                  )
                    throw Error(`当前环境不支持视频导出`);
                  let exportVideo = document.createElement(`video`);
                  ((exportVideo.src = videoUrl),
                    (exportVideo.crossOrigin = `anonymous`),
                    (exportVideo.playsInline = !0),
                    (exportVideo.muted = !0),
                    (exportVideo.preload = `auto`),
                    await waitForMetadata(exportVideo));
	                  let sourceRect = {
	                    x: 0,
	                    y: 0,
	                    width: Math.max(2, exportVideo.videoWidth),
	                    height: Math.max(2, exportVideo.videoHeight),
	                  };
	                  if (!sourceRect.width || !sourceRect.height) throw Error(`视频画面无效`);
                  let canvas = document.createElement(`canvas`);
                  ((canvas.width = sourceRect.width), (canvas.height = sourceRect.height));
                  let ctx = canvas.getContext(`2d`, {
                    alpha: !1
                  });
                  if (!ctx) throw Error(`无法创建视频画布`);
                  (ctx.fillStyle = `#000`, ctx.fillRect(0, 0, canvas.width, canvas.height));
                  let canvasStream = canvas.captureStream(30),
                    sourceStream =
                    typeof (exportVideo as any).captureStream == `function` ?
                    (exportVideo as any).captureStream() :
                    typeof (exportVideo as any).mozCaptureStream == `function` ?
                    (exportVideo as any).mozCaptureStream() :
                    null;
                  sourceStream &&
                    sourceStream.getAudioTracks().forEach((track) => {
                      try {
                        canvasStream.addTrack(track);
                      } catch {}
                    });
                  let mimeType = [
                      `video/webm;codecs=vp9,opus`,
                      `video/webm;codecs=vp8,opus`,
                      `video/webm`,
                    ].find((type) => MediaRecorder.isTypeSupported(type)),
                    exportChunks = [];
                  recorder = new MediaRecorder(canvasStream, mimeType ? {
                    mimeType,
                    videoBitsPerSecond: 8e6
                  } : void 0);
                  let recordingDone = new Promise((resolve: any, reject: any) => {
                    ((recorder.ondataavailable = (event) => {
                        event.data && event.data.size > 0 && exportChunks.push(event.data);
                      }),
                      (recorder.onerror = (event) => {
                        reject(event.error || Error(`视频录制失败`));
                      }),
                      (recorder.onstop = () => {
                        resolve(new Blob(exportChunks, {
                          type: mimeType || `video/webm`
                        }));
                      }));
                  });
                  let isPainting = !0,
                    paintFrame = () => {
                      if (!isPainting) return;
                      try {
                        ctx.drawImage(
                          exportVideo,
                          sourceRect.x,
                          sourceRect.y,
                          sourceRect.width,
                          sourceRect.height,
                          0,
                          0,
                          canvas.width,
                          canvas.height,
                        );
                      } catch (err) {
                        frameRenderError = err;
                        return;
                      }
                      paintFrameId = requestAnimationFrame(paintFrame);
                    };
                  (recorder.start(200),
                    typeof recorder.pause == `function` && recorder.state === `recording` && recorder.pause(),
                    paintFrame());
                  let totalSelectedDuration = segments.reduce((sum, segment) => sum + Math.max(0, segment.end - segment.start), 0),
                    completedDuration = 0;
                  for (let segIndex = 0; segIndex < segments.length; segIndex++) {
                    let segment = segments[segIndex];
                    (setStatusMessage(`正在导出片段 ${segIndex + 1}/${segments.length}...`), await seekTo(exportVideo, segment.start));
                    if (frameRenderError) throw frameRenderError;
                    (typeof recorder.resume == `function` && recorder.state === `paused` && recorder.resume(),
                      await exportVideo.play(),
                      await new Promise((resolve: any, reject: any) => {
                        let settled = !1,
                          intervalId = null,
                          timeoutId = window.setTimeout(
                            () => fail(Error(`视频导出超时，请重试或使用本地可访问的视频源`)),
                            Math.max(15e3, Math.ceil((segment.end - segment.start) * 4e3 + 8e3)),
                          ),
                          complete = () => {
                            if (settled) return;
                            settled = !0;
                            (window.clearTimeout(timeoutId),
                              clearInterval(intervalId),
                              exportVideo.pause(),
                              exportVideo.removeEventListener(`timeupdate`, onTimeUpdate),
                              exportVideo.removeEventListener(`ended`, onEnded),
                              resolve());
                          },
                          fail = (reason) => {
                            if (settled) return;
                            settled = !0;
                            (window.clearTimeout(timeoutId),
                              clearInterval(intervalId),
                              exportVideo.pause(),
                              exportVideo.removeEventListener(`timeupdate`, onTimeUpdate),
                              exportVideo.removeEventListener(`ended`, onEnded),
                              reject(reason));
                          },
                          onTimeUpdate = () => {
                            if (frameRenderError) {
                              fail(frameRenderError);
                              return;
                            }
                            let now = Math.min(segment.end, exportVideo.currentTime || 0);
                            (setStatusMessage(
                                `正在导出 ${Math.min(100, Math.round(((completedDuration + Math.max(0, now - segment.start)) / Math.max(0.1, totalSelectedDuration)) * 100))}%`,
                              ),
                              (exportVideo.currentTime >= segment.end - 0.02 || exportVideo.ended) && complete());
                          },
                          onEnded = () => complete();
                        (exportVideo.addEventListener(`timeupdate`, onTimeUpdate),
                          exportVideo.addEventListener(`ended`, onEnded, {
                            once: !0
                          }),
                          (intervalId = setInterval(onTimeUpdate, 33)),
                          onTimeUpdate());
                      }),
                      typeof recorder.pause == `function` &&
                      recorder.state === `recording` &&
                      recorder.pause(),
                      (completedDuration += Math.max(0, segment.end - segment.start)));
                  }
                  (isPainting = !1,
                    paintFrameId && cancelAnimationFrame(paintFrameId),
                    exportVideo.pause(),
                    recorder.state !== `inactive` && recorder.stop());
                  let outputBlob: any = await recordingDone;
                  if (!outputBlob || outputBlob.size < 1024) throw Error(`导出结果为空，请重试或调整剪辑区间`);
                  var outputUrl = URL.createObjectURL(outputBlob);
                  await new Promise((resolve: any, reject: any) => {
                    let probe = document.createElement(`video`),
                      timeoutId = window.setTimeout(() => {
                        (probe.removeAttribute(`src`), probe.load(), reject(Error(`导出视频校验超时，请重试`)));
                      }, 5e3),
                      cleanup = () => {
                        (window.clearTimeout(timeoutId), probe.removeAttribute(`src`), probe.load());
                      };
                    ((probe.preload = `metadata`),
                      (probe.muted = !0),
                      (probe.playsInline = !0),
                      (probe.onloadedmetadata = () => {
                        let ok = probe.videoWidth > 0 && probe.videoHeight > 0;
                        (cleanup(), ok ? resolve() : reject(Error(`导出视频不可播放，请重试`)));
                      }),
                      (probe.onloadeddata = () => {
                        let ok = probe.videoWidth > 0 && probe.videoHeight > 0;
                        ok && (cleanup(), resolve());
                      }),
                      (probe.onerror = () => {
                        (cleanup(), reject(Error(`导出视频不可播放，请重试`)));
                      }),
                      (probe.src = outputUrl));
                  });
                  (setIsExporting(!1), setStatusMessage(`导出完成`), onSave({
                    url: outputUrl,
                    label: `${outputBaseName}-edited.webm`,
                    mime: outputBlob.type || mimeType || `video/webm`,
                    size: outputBlob.size || 0,
                    duration: totalOutputDuration
                  }));
                } catch (err) {
                  let message =
                    /cross-origin|tainted|insecure/i.test(String(err?.message || err)) ?
                    `当前视频源不支持本地时长剪辑，请先上传本地视频或可跨域访问的视频链接` :
                    err?.message || `视频导出失败`;
                  (console.error(`Video editor export failed`, err), setIsExporting(!1), setStatusMessage(`导出失败：${message}`));
                  try {
                    outputUrl && URL.revokeObjectURL(outputUrl);
                  } catch {}
                } finally {
                  recorder &&
                    recorder.state !== `inactive` &&
                    (() => {
                      try {
                        recorder.stop();
                      } catch {}
                    })();
                  paintFrameId && cancelAnimationFrame(paintFrameId);
                }
              };
  useEffect(() => {
    let video = videoRef.current;
    if (!video) return;
    let loadMetadata = async () => {
      try {
        (await waitForMetadata(video),
          setDuration(video.duration || 0),
          setStartTime(0),
          setEndTime(video.duration || 0),
          setPlayheadTime(0),
          setCropRegion({
            unit: `%`,
            x: 0,
            y: 0,
            width: 100,
            height: 100
          }),
          setPreviewError(null),
          setStatusMessage(`已进入剪辑台，拖动入点/出点只会剪辑时长，不会裁剪画面`));
      } catch (err) {
        (console.error(`Video editor metadata failed`, err),
          setStatusMessage(err.message || `视频加载失败`));
      }
    };
    return (
      loadMetadata(),
      () => {
        video.pause();
      }
    );
  }, [videoUrl]);
  useEffect(() => {
    let onMouseMove = (event) => {
        let drag = trimDragRef.current;
        if (!drag || !duration) return;
        let time = trackTimeFromClientX(event.clientX);
        drag.mode === `start` ?
          setStartTime((prev) => clamp(Math.min(time, endTime - 0.1), duration)) :
          drag.mode === `end` ?
          setEndTime((prev) => clamp(Math.max(time, startTime + 0.1), duration)) :
          drag.mode === `playhead` && setPlayheadTime(time);
      },
      onMouseUp = async (event) => {
        let drag = trimDragRef.current;
        if (!drag) return;
        let mode = drag.mode,
          time = trackTimeFromClientX(event.clientX);
        trimDragRef.current = null;
        mode === `playhead` && (await seekToTime(time));
      };
    return (
      window.addEventListener(`mousemove`, onMouseMove),
      window.addEventListener(`mouseup`, onMouseUp),
      () => {
        (window.removeEventListener(`mousemove`, onMouseMove),
          window.removeEventListener(`mouseup`, onMouseUp));
      }
    );
  }, [duration, startTime, endTime, seekToTime]);
  useEffect(() => {
    (isSidebarCollapsed && maximizedPanel === `sidebar` && setMaximizedPanel(null),
      isTimelineCollapsed && maximizedPanel === `timeline` && setMaximizedPanel(null));
  }, [isSidebarCollapsed, isTimelineCollapsed, maximizedPanel]);
  useEffect(() => {
    let onMouseMove = (event) => {
        let resize = previewResizeRef.current;
        if (!resize) return;
        let dx = event.clientX - resize.startX,
          dy = event.clientY - resize.startY,
          zoom = clampRatio(resize.startZoom + (dx - dy) / 420, 0.35, 1.25);
        (setPreviewZoom(zoom),
          setGuideState({
            kind: `preview-size`,
            label: `预览画面 ${Math.round(zoom * 100)}%`,
          }));
      },
      onMouseUp = () => {
        previewResizeRef.current &&
          ((previewResizeRef.current = null), setGuideState(null));
      };
    return (
      window.addEventListener(`mousemove`, onMouseMove),
      window.addEventListener(`mouseup`, onMouseUp),
      () => {
        (window.removeEventListener(`mousemove`, onMouseMove),
          window.removeEventListener(`mouseup`, onMouseUp));
      }
    );
  }, []);
  useEffect(() => {
    let onMouseMove = (event) => {
        let drag = layoutDragRef.current,
          rect = editorShellRef.current?.getBoundingClientRect();
        if (!drag || !rect) return;
        if (drag.mode === `horizontal`) {
          let ratio = (event.clientX - rect.left - 24) / Math.max(1, rect.width - 48),
            snap = snapRatio(ratio, 0.54, 0.84, [0.62, 0.72, 0.8]);
          (setHorizontalRatio(snap.value),
            setGuideState({
              kind: `horizontal`,
              label: snap.snap !== null ?
                `参考线吸附 ${Math.round(snap.value * 100)}%` :
                `左右布局 ${Math.round(snap.value * 100)}%`,
            }));
          return;
        }
        let ratio = (event.clientY - rect.top - 118) / Math.max(1, rect.height - 240),
          snap = snapRatio(ratio, 0.48, 0.72, [0.52, 0.62, 0.68]);
        (setVerticalRatio(snap.value),
          setGuideState({
            kind: `vertical`,
            label: snap.snap !== null ?
              `参考线吸附 ${Math.round(snap.value * 100)}%` :
              `预览区域 ${Math.round(snap.value * 100)}%`,
          }));
      },
      onMouseUp = () => {
        (layoutArmTimerRef.current &&
          (window.clearTimeout(layoutArmTimerRef.current),
            (layoutArmTimerRef.current = null),
            !layoutDragRef.current && guideState?.kind !== `preset` && guideState?.kind !== `panel` && setGuideState(null)),
          layoutDragRef.current && ((layoutDragRef.current = null), setGuideState(null)));
      };
    return (
      window.addEventListener(`mousemove`, onMouseMove),
      window.addEventListener(`mouseup`, onMouseUp),
      () => {
        (window.removeEventListener(`mousemove`, onMouseMove),
          window.removeEventListener(`mouseup`, onMouseUp));
      }
    );
  }, []);
  return createPortal(
    jsxs(`div`, {
      className: `fixed inset-0 z-[9999] bg-[#08090c] flex flex-col nodrag nopan wanjuan-video-editor-modal`,
      style: {
        position: `fixed`,
        inset: 0,
        zIndex: 2147483647,
        display: `flex`,
        flexDirection: `column`,
        gap: 8,
        padding: 12,
        boxSizing: `border-box`,
        background: `radial-gradient(circle at top, rgba(67,84,124,0.22), rgba(8,9,12,0.98) 36%), #08090c`,
        color: `#ffffff`,
        pointerEvents: `auto`,
        fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      },
      children: [
        jsxs(`div`, {
          className: `flex items-center justify-between gap-4 px-5 py-3 bg-[#111317] border-b border-[#23262d] nodrag nopan wanjuan-video-editor-toolbar`,
          onPointerDown: (event) => event.stopPropagation(),
          onMouseDown: (event) => event.stopPropagation(),
          onClick: (event) => event.stopPropagation(),
          style: {
            display: `flex`,
            alignItems: `center`,
            justifyContent: `space-between`,
            gap: 12,
            padding: `10px 14px`,
            background: `rgba(17,19,23,0.9)`,
            border: `1px solid rgba(67,75,90,0.82)`,
            borderRadius: 18,
            boxShadow: `0 12px 32px rgba(0,0,0,0.22)`,
            backdropFilter: `blur(14px)`,
            flex: `0 0 auto`,
          },
          children: [
            jsxs(`div`, {
              className: `flex flex-col`,
              children: [
                jsx(`span`, {
                  className: `text-white text-[15px] font-medium leading-none`,
                  children: `视频剪辑台`,
                }),
                jsx(`span`, {
                  className: `text-[10px] leading-4 text-gray-500`,
                  children: `只剪辑视频片段时长，保留完整画面；导出会在画布中生成副本`,
                }),
              ],
            }),
            jsxs(`div`, {
              className: `flex items-center gap-2`,
              style: {
                display: `flex`,
                alignItems: `center`,
                gap: 6,
                flexWrap: `wrap`,
                justifyContent: `flex-end`,
              },
              children: [
                guideState?.label &&
                jsx(`span`, {
                  style: {
                    padding: `4px 8px`,
                    borderRadius: 999,
                    border: `1px solid rgba(96,165,250,0.28)`,
                    background: `rgba(59,130,246,0.12)`,
                    color: `#bfdbfe`,
                    fontSize: 10,
                    whiteSpace: `nowrap`,
                  },
                  children: guideState.label,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm transition-colors nodrag nopan`,
                  style: {
                    background: layoutPreset === `balanced` ? `#2563eb` : `#1f2430`,
                    color: `#ffffff`,
                  },
                  onClick: () => applyLayoutPreset(`balanced`),
                  children: `均衡布局`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm transition-colors nodrag nopan`,
                  style: {
                    background: layoutPreset === `focus-preview` ? `#2563eb` : `#1f2430`,
                    color: `#ffffff`,
                  },
                  onClick: () => applyLayoutPreset(`focus-preview`),
                  children: `预览优先`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm transition-colors nodrag nopan`,
                  style: {
                    background: layoutPreset === `timeline-focus` ? `#2563eb` : `#1f2430`,
                    color: `#ffffff`,
                  },
                  onClick: () => applyLayoutPreset(`timeline-focus`),
                  children: `时间线优先`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm transition-colors nodrag nopan`,
                  style: {
                    background: maximizedPanel === `preview` ? `#2563eb` : `#1f2430`,
                    color: `#ffffff`,
                  },
                  onClick: () => togglePanelMaximize(`preview`),
                  children: maximizedPanel === `preview` ? `还原预览` : `放大预览`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm transition-colors nodrag nopan`,
                  style: {
                    background: maximizedPanel === `timeline` ? `#2563eb` : `#1f2430`,
                    color: `#ffffff`,
                  },
                  onClick: () => togglePanelMaximize(`timeline`),
                  children: maximizedPanel === `timeline` ? `还原轨道` : `放大轨道`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-[#23262d] transition-colors nodrag nopan`,
                  onClick: () => applyLayoutPreset(`balanced`),
                  children: `重置工作区`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-[#23262d] transition-colors nodrag nopan`,
                  onClick: () => setIsTimelineCollapsed((prev) => !prev),
                  children: isTimelineCollapsed ? `展开时间线` : `隐藏时间线`,
                }),
                jsx(`button`, {
                  className: `px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-[#23262d] transition-colors nodrag nopan`,
                  onClick: () => {
                    !isExporting && onClose();
                  },
                  children: `关闭`,
                }),
                jsx(`button`, {
                  className: `px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors nodrag nopan`,
                  onClick: (event) => {
                    event.stopPropagation();
                    exportClip();
                  },
	                  disabled: isExporting || totalOutputDuration <= 0.05,
	                  children: isExporting ? `导出中...` : totalOutputDuration <= 0.05 ? `选区无效` : `导出副本`,
                }),
              ],
            }),
          ],
        }),
        jsxs(`div`, {
          ref: editorShellRef,
          className: `flex-1 min-h-0 flex flex-col`,
          style: {
            flex: `1 1 auto`,
            minHeight: 0,
            display: `flex`,
            flexDirection: `column`,
            position: `relative`,
            overflow: `hidden`,
            borderRadius: 28,
            border: `1px solid rgba(41,48,60,0.98)`,
            boxShadow: `0 28px 80px rgba(0,0,0,0.34)`,
            background: `#08090c`,
          },
          children: [
            guideState?.kind === `horizontal` &&
            showSidebar &&
            jsx(`div`, {
              style: {
                position: `absolute`,
                top: 20,
                bottom: showTimeline ? `calc(${Math.max(18, Math.round((1 - topAreaRatio) * 100))}% + 18px)` : 20,
                left: `calc(${Math.round(previewAreaRatio * 1e4) / 100}% - 6px)`,
                width: 12,
                borderRadius: 999,
                border: `1px solid rgba(147,197,253,0.52)`,
                background: `rgba(59,130,246,0.22)`,
                boxShadow: `0 0 0 1px rgba(191,219,254,0.18)`,
                pointerEvents: `none`,
                zIndex: 4,
              },
            }),
            guideState?.kind === `vertical` &&
            showTimeline &&
            jsx(`div`, {
              style: {
                position: `absolute`,
                left: 20,
                right: 20,
                top: `calc(${Math.round(topAreaRatio * 1e4) / 100}% - 6px)`,
                height: 12,
                borderRadius: 999,
                border: `1px solid rgba(147,197,253,0.52)`,
                background: `rgba(59,130,246,0.22)`,
                boxShadow: `0 0 0 1px rgba(191,219,254,0.18)`,
                pointerEvents: `none`,
                zIndex: 4,
              },
            }),
            jsxs(`div`, {
              className: `flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)_320px]`,
              style: {
                flex: showTimeline ? `0 0 ${Math.round(topAreaRatio * 1e3) / 10}%` : `1 1 auto`,
                minHeight: 0,
                display: `grid`,
                gridTemplateColumns: showSidebar ?
                  `minmax(0, ${Math.max(0.54, previewAreaRatio).toFixed(3)}fr) 12px minmax(260px, ${Math.max(0.16, 1 - previewAreaRatio).toFixed(3)}fr)` :
                  `minmax(0, 1fr)`,
                transition: `grid-template-columns 160ms ease, flex-basis 160ms ease`,
                background: `#08090c`,
              },
              children: [
                jsxs(`div`, {
                  className: `min-w-0 border-r border-[#1d2026] p-4 flex flex-col gap-4`,
                  style: {
                    minWidth: 0,
                    padding: 12,
                    display: `flex`,
                    flexDirection: `column`,
	                    gap: 10,
	                    borderRight: showSidebar ? `1px solid #1d2026` : `none`,
	                    background: `#08090c`,
	                    overflow: `hidden`,
	                  },
                  onDoubleClick: (event) => {
                    event.target instanceof HTMLButtonElement ||
                      event.target instanceof HTMLInputElement ||
                      event.target instanceof HTMLTextAreaElement ||
                      togglePanelMaximize(`preview`);
                  },
                  children: [
                    jsx(`style`, {
                      children: `.wanjuan-config-error-assistant,.wanjuan-config-error-assistant *{box-sizing:border-box}.wanjuan-config-error-assistant-action{cursor:pointer;user-select:none}.wanjuan-config-error-assistant-action:hover{filter:brightness(1.04)}`,
                    }),
                    jsxs(`div`, {
                      className: `rounded-2xl border border-[#23262d] bg-[#0f1115] overflow-hidden flex-1 min-h-0 flex flex-col`,
                      style: {
                        flex: `1 1 auto`,
                        minHeight: 0,
                        display: `flex`,
                        flexDirection: `column`,
                        overflow: `hidden`,
                        borderRadius: 16,
                        border: `1px solid #23262d`,
                        background: `#0f1115`,
                      },
                      children: [
                        jsxs(`div`, {
                          className: `px-4 py-2 border-b border-[#23262d] flex items-center justify-between text-xs text-gray-500`,
                          style: {
                            display: `flex`,
                            alignItems: `center`,
                            justifyContent: `space-between`,
                            padding: `8px 12px`,
                            borderBottom: `1px solid #23262d`,
                            color: `#9ca3af`,
                            background: `#13161c`,
                            flex: `0 0 auto`,
                          },
                          children: [
                            jsxs(`span`, {
                              children: [`节目监视器`, setIsPlaying ? ` · 播放中` : ``],
                            }),
                            jsxs(`span`, {
                              children: [`输出文件：`, `${outputBaseName}-edited.webm`],
                            }),
                          ],
                        }),
                        jsx(`div`, {
                          className: `flex-1 min-h-0 overflow-auto flex items-center justify-center p-4`,
                          style: {
                            flex: `1 1 auto`,
                            minHeight: 0,
                            overflow: `hidden`,
                            display: `flex`,
                            alignItems: `center`,
                            justifyContent: `center`,
                            padding: 10,
                            background: `#0b0d11`,
                          },
                          children: jsxs(`div`, {
                            className: `max-w-full max-h-full`,
                            style: {
                              maxWidth: `100%`,
	                              maxHeight: `100%`,
	                              height: `100%`,
	                              minHeight: 0,
	                              display: `flex`,
                              flexDirection: `column`,
                              alignItems: `center`,
                              justifyContent: `center`,
                              gap: 8,
                            },
                            children: [
                              jsxs(`div`, {
                                style: {
                                  position: `relative`,
                                  width: previewFrameWidth,
                                  height: previewFrameHeight,
                                  aspectRatio: `${Math.max(1, videoFrame.width)} / ${Math.max(1, videoFrame.height)}`,
                                  maxHeight: previewFrameMaxHeight,
                                  maxWidth: `100%`,
                                  background: `radial-gradient(circle at top, rgba(64,82,121,0.22), rgba(8,9,12,0.98) 72%)`,
                                  borderRadius: 20,
                                  overflow: `hidden`,
                                  border: `1px solid #23262d`,
                                  boxShadow: `0 24px 80px rgba(0,0,0,0.42)`,
                                },
                                children: [
                                  jsx(`video`, {
                                    ref: videoRef,
                                    src: videoUrl,
                                    controls: !1,
                                    playsInline: !0,
                                    className: `max-w-full max-h-full object-contain bg-black rounded-xl shadow-2xl`,
                                    style: {
                                      display: `block`,
                                      width: `100%`,
                                      height: `100%`,
                                      objectFit: `contain`,
                                      background: `#000000`,
                                    },
                                    onTimeUpdate: (event) => {
                                      let time = roundToTenth(event.currentTarget.currentTime || 0);
                                      (setPlayheadTime(time),
                                        isPreviewing &&
                                        time >= endTime &&
                                        (event.currentTarget.pause(), setIsPreviewing(!1), setStatusMessage(`片段预览结束`)));
                                    },
                                    onLoadedMetadata: (event) => {
                                      let dur = event.currentTarget.duration || 0,
                                        width = event.currentTarget.videoWidth || 9,
                                        height = event.currentTarget.videoHeight || 16;
                                      (setDuration(dur),
                                        setStartTime(0),
                                        setEndTime(dur),
                                        setPlayheadTime(0),
                                        setPreviewZoom(height > width ? 1 : 0.95),
                                        setVideoFrame({
                                          width,
                                          height,
                                        }));
                                    },
                                    onPlay: () => setIsPlaying(!0),
                                    onPause: () => setIsPlaying(!1),
                                    onEnded: () => {
                                      (setIsPlaying(!1), setIsPreviewing(!1));
                                    },
                                  }),
                                  jsx(`button`, {
                                    type: `button`,
                                    title: `拖动缩放预览画面`,
                                    onMouseDown: beginPreviewResize,
                                    style: {
                                      position: `absolute`,
                                      right: 8,
                                      bottom: 8,
                                      width: 28,
                                      height: 28,
                                      borderRadius: 10,
                                      border: `1px solid rgba(255,255,255,0.18)`,
                                      background: `rgba(9,12,18,0.72)`,
                                      color: `#ffffff`,
                                      cursor: `nwse-resize`,
                                      display: `flex`,
                                      alignItems: `center`,
                                      justifyContent: `center`,
                                      boxShadow: `0 8px 22px rgba(0,0,0,0.32)`,
                                    },
                                    children: `↘`,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `rounded-2xl border border-[#23262d] bg-[#0f1115] px-4 py-3 flex flex-wrap items-center gap-2`,
	                      style: {
		                        display: `flex`,
		                        flexWrap: `wrap`,
		                        alignItems: `center`,
		                        justifyContent: `space-between`,
		                        gap: 8,
	                        padding: `9px 12px`,
	                        borderRadius: 16,
	                        border: `1px solid #23262d`,
	                        background: `#0f1115`,
	                        flex: `0 0 auto`,
	                      },
	                      children: [
	                        jsx(`button`, {
	                          className: `px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white transition-colors`,
	                          onClick: togglePlayback,
	                          children: setIsPlaying ? `暂停` : `播放`,
	                        }),
	                        jsx(`button`, {
	                          className: `px-3 py-1.5 rounded-lg bg-[#1d2129] hover:bg-[#272c36] text-sm text-gray-200 transition-colors`,
	                          onClick: previewSelection,
	                          disabled: isPreviewing,
	                          children: isPreviewing ? `预览中...` : `预览选区`,
	                        }),
	                        jsxs(`div`, {
	                          style: {
		                            display: `flex`,
		                            alignItems: `center`,
		                            gap: 6,
		                            flexWrap: `wrap`,
		                            minWidth: 0,
	                          },
	                          children: [
	                            jsxs(`label`, {
	                              style: {
	                                display: `flex`,
	                                alignItems: `center`,
	                                gap: 5,
	                                color: `#9ca3af`,
	                                fontSize: 12,
	                                whiteSpace: `nowrap`,
	                              },
	                              children: [
	                                `入点`,
	                                jsx(`input`, {
	                                  type: `number`,
	                                  min: 0,
	                                  max: Math.max(0, duration),
	                                  step: 0.1,
	                                  value: Number.isFinite(startTime) ? startTime.toFixed(1) : `0.0`,
	                                  onChange: (event) => setStartSeconds(event.currentTarget.value),
		                                  onBlur: (event) => seekToTime(event.currentTarget.value),
	                                  style: {
	                                    width: 72,
	                                    height: 28,
	                                    borderRadius: 8,
	                                    border: `1px solid #2a3140`,
	                                    background: `#0b0f15`,
	                                    color: `#f9fafb`,
	                                    padding: `0 8px`,
	                                    fontSize: 12,
	                                  },
	                                }),
		                              ],
		                            }),
	                            jsxs(`label`, {
	                              style: {
	                                display: `flex`,
	                                alignItems: `center`,
	                                gap: 5,
	                                color: `#9ca3af`,
	                                fontSize: 12,
	                                whiteSpace: `nowrap`,
	                              },
	                              children: [
	                                `出点`,
	                                jsx(`input`, {
	                                  type: `number`,
	                                  min: 0,
	                                  max: Math.max(0, duration),
	                                  step: 0.1,
	                                  value: Number.isFinite(endTime) ? endTime.toFixed(1) : `0.0`,
	                                  onChange: (event) => setEndSeconds(event.currentTarget.value),
		                                  onBlur: (event) => seekToTime(event.currentTarget.value),
	                                  style: {
	                                    width: 72,
	                                    height: 28,
	                                    borderRadius: 8,
	                                    border: `1px solid #2a3140`,
	                                    background: `#0b0f15`,
	                                    color: `#f9fafb`,
	                                    padding: `0 8px`,
	                                    fontSize: 12,
	                                  },
	                                }),
	                              ],
	                            }),
	                            jsx(`span`, {
	                              style: {
	                                padding: `5px 8px`,
	                                borderRadius: 999,
	                                background: `rgba(59,130,246,0.12)`,
	                                color: `#bfdbfe`,
	                                fontSize: 12,
	                                whiteSpace: `nowrap`,
	                              },
	                              children: [`导出 `, formatTime(totalOutputDuration)],
	                            }),
	                          ],
	                        }),
	                        jsxs(`div`, {
	                          style: {
	                            display: `flex`,
	                            alignItems: `center`,
		                            justifyContent: `flex-end`,
		                            gap: 6,
		                            flexWrap: `wrap`,
		                            marginLeft: `auto`,
	                          },
	                          children: [
	                            jsx(`button`, {
	                              className: `px-3 py-1.5 rounded-lg bg-[#1d2129] hover:bg-[#272c36] text-sm text-gray-200 transition-colors`,
	                              onClick: () => seekToTime(startTime),
	                              children: `到入点`,
	                            }),
	                            jsx(`button`, {
	                              className: `px-3 py-1.5 rounded-lg bg-[#1d2129] hover:bg-[#272c36] text-sm text-gray-200 transition-colors`,
	                              onClick: () => seekToTime(endTime),
	                              children: `到出点`,
	                            }),
	                            jsx(`button`, {
	                              className: `px-3 py-1.5 rounded-lg bg-[#1d2129] hover:bg-[#272c36] text-sm text-gray-200 transition-colors`,
	                              onClick: markInPoint,
	                              children: `设入点`,
	                            }),
	                            jsx(`button`, {
	                              className: `px-3 py-1.5 rounded-lg bg-[#1d2129] hover:bg-[#272c36] text-sm text-gray-200 transition-colors`,
	                              onClick: markOutPoint,
	                              children: `设出点`,
	                            }),
	                            jsx(`button`, {
	                              className: `px-3 py-1.5 rounded-lg bg-[#1d2129] hover:bg-[#272c36] text-sm text-gray-200 transition-colors`,
	                              onClick: resetSelection,
	                              children: `恢复全片`,
	                            }),
	                          ],
	                        }),
	                        jsxs(`div`, {
	                          className: `text-xs text-gray-400 flex items-center gap-2`,
	                          style: {
	                            justifyContent: `flex-end`,
	                            whiteSpace: `nowrap`,
	                          },
	                          children: [formatTime(playheadTime), jsx(`span`, {
	                            children: `/`
	                          }), formatTime(duration)],
                        }),
                      ],
                    }),
                  ],
                }),
                showSidebar &&
                jsx(`div`, {
                  style: {
                    position: `relative`,
                    display: `flex`,
                    alignItems: `stretch`,
                    justifyContent: `center`,
                    padding: `10px 0`,
                    background: `linear-gradient(180deg, rgba(15,17,21,0), rgba(15,17,21,0.92) 22%, rgba(15,17,21,0.92) 78%, rgba(15,17,21,0))`,
                  },
                  children: jsx(`button`, {
                    type: `button`,
                    onMouseDown: (event) => beginLayoutDrag(`horizontal`, event),
                    title: `拖动调整左右面板`,
                    style: {
                      width: 12,
                      borderRadius: 999,
                      border: `1px solid rgba(71,85,105,0.72)`,
                      background: `linear-gradient(180deg, rgba(30,41,59,0.96), rgba(15,23,42,0.96))`,
                      cursor: `col-resize`,
                      display: `flex`,
                      alignItems: `center`,
                      justifyContent: `center`,
                      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04)`,
                    },
                    children: jsx(`span`, {
                      style: {
                        width: 4,
                        height: 48,
                        borderRadius: 999,
                        background: `rgba(191,219,254,0.92)`,
                      },
                    }),
                  }),
                }),
                showSidebar &&
                jsxs(`div`, {
                  className: `min-w-0 p-4 space-y-4 overflow-y-auto bg-[#0d0f13]`,
                  style: {
                    minWidth: 0,
                    padding: 12,
                    display: `flex`,
                    flexDirection: `column`,
                    gap: 12,
                    overflowY: `auto`,
                    background: `#0d0f13`,
                  },
                  onDoubleClick: (event) => {
                    event.target instanceof HTMLButtonElement ||
                      event.target instanceof HTMLInputElement ||
                      event.target instanceof HTMLTextAreaElement ||
                      togglePanelMaximize(`sidebar`);
                  },
                  children: [
                    jsx(`style`, {
                      children: `.wanjuan-config-error-assistant,.wanjuan-config-error-assistant *{box-sizing:border-box}.wanjuan-config-error-assistant-action{cursor:pointer;user-select:none}.wanjuan-config-error-assistant-action:hover{filter:brightness(1.04)}`,
                    }),
                    jsxs(`div`, {
                      className: `rounded-2xl border border-[#23262d] bg-[#13161c] p-4 space-y-3`,
                      children: [
                        jsxs(`div`, {
                          className: `flex items-center justify-between`,
                          children: [
                            jsx(`div`, {
                              className: `text-sm font-medium text-white`,
                              children: `剪辑摘要`,
                            }),
                            jsx(`div`, {
                              className: `text-[11px] text-gray-500`,
                              children: `选区用时间线直接拖动`,
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `grid grid-cols-2 gap-2 text-sm`,
                          children: [
                            jsxs(`div`, {
                              className: `rounded-xl bg-[#0d1015] border border-[#23262d] px-3 py-2 flex flex-col`,
                              children: [
                                jsx(`span`, {
                                  className: `text-xs text-gray-500`,
                                  children: `入点`,
                                }),
                                jsx(`span`, {
                                  className: `text-white mt-1`,
                                  children: formatTime(startTime),
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              className: `rounded-xl bg-[#0d1015] border border-[#23262d] px-3 py-2 flex flex-col`,
                              children: [
                                jsx(`span`, {
                                  className: `text-xs text-gray-500`,
                                  children: `出点`,
                                }),
                                jsx(`span`, {
                                  className: `text-white mt-1`,
                                  children: formatTime(endTime),
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              className: `rounded-xl bg-[#0d1015] border border-[#23262d] px-3 py-2 flex flex-col`,
                              children: [
                                jsx(`span`, {
                                  className: `text-xs text-gray-500`,
                                  children: `选区长度`,
                                }),
                                jsx(`span`, {
                                  className: `text-white mt-1`,
                                  children: `${Math.max(0, clamp(roundToTenth(endTime), duration) - clamp(roundToTenth(startTime), duration)).toFixed(1)}s`,
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              className: `rounded-xl bg-[#0d1015] border border-[#23262d] px-3 py-2 flex flex-col`,
                              children: [
                                jsx(`span`, {
                                  className: `text-xs text-gray-500`,
                                  children: `导出时长`,
                                }),
                                jsx(`span`, {
                                  className: `text-white mt-1`,
                                  children: formatTime(totalOutputDuration),
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsx(`div`, {
                          className: `rounded-xl bg-[#10141b] border border-[#1d2733] px-3 py-2 text-[11px] leading-5 text-gray-400`,
                          children: `预览窗只影响查看大小，不会裁剪画面；拖动时间线两端调整最终片段时长。`,
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `rounded-2xl border border-[#23262d] bg-[#13161c] p-4 space-y-3`,
                      style: {
                        flex: `1 1 auto`,
                        minHeight: 180,
                      },
                      children: [
                        jsxs(`div`, {
                          className: `flex items-center justify-between`,
                          children: [
                            jsx(`div`, {
                              className: `text-sm font-medium text-white`,
                              children: `当前导出片段`,
                            }),
                            jsx(`div`, {
                              className: `text-[11px] text-gray-500`,
                              children: `导出时会生成当前画布里的副本`,
                            }),
                          ],
                        }),
                        jsx(`div`, {
                          className: `space-y-2 overflow-y-auto`,
                          style: {
                            minHeight: 120,
                            maxHeight: 320,
                          },
                          children: outputSegments.length === 0 ?
                            jsx(`div`, {
                              className: `rounded-xl border border-dashed border-[#2a2f38] px-3 py-6 text-center text-xs text-gray-500`,
                              children: `还没有有效选区。先在时间线上设定入点和出点。`,
                            }) :
                            outputSegments.map((segment, index) =>
                              jsxs(
                                `button`, {
                                  className: `w-full text-left rounded-xl border border-[#23262d] bg-[#0d1015] px-3 py-2 hover:border-blue-500/50 transition-colors`,
                                  onClick: () => seekToTime(segment.start),
                                  children: [
                                    jsxs(`div`, {
                                      className: `flex items-center justify-between`,
                                      children: [
                                        jsxs(`span`, {
                                          className: `text-sm text-white`,
                                          children: [`片段 `, index + 1],
                                        }),
                                      ],
                                    }),
                                    jsxs(`div`, {
                                      className: `mt-1 text-xs text-gray-500`,
                                      children: [
                                        formatTime(segment.start),
                                        ` → `,
                                        formatTime(segment.end),
                                        ` / `,
                                        segment.duration.toFixed(1),
                                        `s`,
                                      ],
                                    }),
                                  ],
                                },
                                segment.id,
                              ),
                            ),
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `rounded-2xl border border-[#23262d] bg-[#13161c] p-4 space-y-2`,
                      children: [
                        jsxs(`div`, {
                          className: `flex items-center justify-between gap-2 text-xs text-gray-500`,
                          children: [
                            jsxs(`span`, {
                              children: [`播放头 `, formatTime(playheadTime)],
                            }),
                            jsxs(`span`, {
                              children: [`源视频 `, formatTime(duration)],
                            }),
                          ],
                        }),
                        jsx(`div`, {
                          className: `text-xs text-blue-300`,
                          children: statusMessage,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            showTimeline &&
            jsx(`div`, {
              style: {
                flex: `0 0 16px`,
                display: `flex`,
                alignItems: `center`,
                justifyContent: `center`,
                padding: `0 16px`,
                background: `#08090c`,
              },
              children: jsx(`button`, {
                type: `button`,
                onMouseDown: (event) => beginLayoutDrag(`vertical`, event),
                title: `拖动调整预览与时间线`,
                style: {
                  width: `100%`,
                  height: 12,
                  borderRadius: 999,
                  border: `1px solid rgba(71,85,105,0.72)`,
                  background: `linear-gradient(90deg, rgba(30,41,59,0.96), rgba(15,23,42,0.96))`,
                  cursor: `row-resize`,
                  display: `flex`,
                  alignItems: `center`,
                  justifyContent: `center`,
                  boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04)`,
                },
                children: jsx(`span`, {
                  style: {
                    width: 54,
                    height: 4,
                    borderRadius: 999,
                    background: `rgba(191,219,254,0.92)`,
                  },
                }),
              }),
            }),
            showTimeline &&
            jsxs(`div`, {
              className: `border-t border-[#1d2026] bg-[#0c0f14] px-3 py-3 flex flex-col gap-2`,
              style: {
                flex: `1 1 ${Math.round((1 - topAreaRatio) * 1e3) / 10}%`,
                minHeight: 168,
                borderTop: `1px solid #1d2026`,
                background: `#0c0f14`,
                padding: 10,
                display: `flex`,
                flexDirection: `column`,
                gap: 8,
              },
              onDoubleClick: (event) => {
                event.target instanceof HTMLButtonElement ||
                  event.target instanceof HTMLInputElement ||
                  event.target instanceof HTMLTextAreaElement ||
                  togglePanelMaximize(`timeline`);
              },
              children: [
                jsxs(`div`, {
                  className: `flex items-center justify-between`,
                  children: [
                    jsx(`div`, {
                      className: `text-sm font-medium text-white`,
                      children: `时间线`,
                    }),
                    jsxs(`div`, {
                      className: `text-xs text-gray-500 flex items-center gap-4`,
                      children: [
                        jsxs(`span`, {
                          children: [`入点 `, formatTime(startTime)],
                        }),
                        jsxs(`span`, {
                          children: [`出点 `, formatTime(endTime)],
                        }),
                        jsxs(`span`, {
                          children: [`导出时长 `, formatTime(totalOutputDuration)],
                        }),
                      ],
                    }),
                  ],
                }),
                jsxs(`div`, {
                  className: `rounded-2xl border border-[#23262d] bg-[#111317] px-3 py-3 space-y-2`,
                  style: {
                    borderRadius: 20,
                    border: `1px solid #23262d`,
                    background: `linear-gradient(180deg, #12151b 0%, #0d1015 100%)`,
                    padding: 10,
                    display: `flex`,
                    flexDirection: `column`,
                    gap: 8,
                    flex: `1 1 auto`,
                    minHeight: 0,
                  },
                  children: [
                    jsx(`style`, {
                      children: `.wanjuan-config-error-assistant,.wanjuan-config-error-assistant *{box-sizing:border-box}.wanjuan-config-error-assistant-action{cursor:pointer;user-select:none}.wanjuan-config-error-assistant-action:hover{filter:brightness(1.04)}`,
                    }),
                    jsxs(`div`, {
                      style: {
                        display: `flex`,
                        alignItems: `center`,
                        justifyContent: `space-between`,
                        gap: 8,
                      },
                      children: [
                        jsxs(`div`, {
                          style: {
                            display: `flex`,
                            alignItems: `center`,
                            gap: 8,
                          },
                          children: [
                            jsx(`div`, {
                              style: {
                                padding: `4px 8px`,
                                borderRadius: 999,
                                background: `rgba(64,124,255,0.14)`,
                                color: `#b9d1ff`,
                                fontSize: 10,
                                border: `1px solid rgba(96,165,250,0.24)`,
                              },
                              children: `时长剪辑`,
                            }),
                            jsx(`span`, {
                              style: {
                                fontSize: 10,
                                color: `#6b7280`,
                              },
	                              children: `拖动蓝色片段两端，或在预览下方输入秒数来精确设置入点和出点`,
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          style: {
                            display: `flex`,
                            alignItems: `center`,
                            gap: 6,
                            fontSize: 10,
                            color: `#9ca3af`,
                          },
                          children: [
                            jsxs(`span`, {
                              children: [`播放头 `, formatTime(playheadTime)],
                            }),
                            jsxs(`span`, {
                              children: [`选区 `, `${Math.max(0, clamp(roundToTenth(endTime), duration) - clamp(roundToTenth(startTime), duration)).toFixed(1)}s`],
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      style: {
                        position: `relative`,
                        flex: `1 1 auto`,
                        minHeight: 0,
                        borderRadius: 18,
                        border: `1px solid #1f2430`,
                        background: `linear-gradient(180deg, rgba(12,15,20,0.96), rgba(10,12,17,0.98))`,
                        overflow: `hidden`,
                        padding: 8,
                        display: `flex`,
                        flexDirection: `column`,
                        gap: 8,
                      },
                      children: [
                        Array.from({
                          length: 9
                        }).map((_, index) =>
                          jsx(
                            `div`, {
                              style: {
                                position: `absolute`,
                                top: 0,
                                bottom: 0,
                                left: `${(index / 8) * 100}%`,
                                width: 1,
                                background: `linear-gradient(180deg, rgba(148,163,184,0.14), rgba(148,163,184,0.04))`,
                                pointerEvents: `none`,
                              },
                            },
                            `grid-${index}`,
                          ),
                        ),
                        jsxs(`div`, {
                          style: {
                            position: `relative`,
                            zIndex: 1,
                            display: `flex`,
                            justifyContent: `space-between`,
                            padding: `0 8px 0 48px`,
                            fontSize: 10,
                            color: `#6b7280`,
                          },
                          children: Array.from({
                            length: 9
                          }).map((_, index) =>
                            jsx(`span`, {
                              children: formatTime((duration / 8) * index)
                            }, index),
                          ),
                        }),
                        jsxs(`div`, {
                          className: `grid grid-cols-[38px_minmax(0,1fr)] items-center gap-2`,
                          style: {
                            position: `relative`,
                            zIndex: 1,
                            display: `grid`,
                            gridTemplateColumns: `38px minmax(0, 1fr)`,
                            alignItems: `center`,
                            gap: 8,
                          },
                          children: [
                            jsxs(`div`, {
                              style: {
                                display: `flex`,
                                flexDirection: `column`,
                                gap: 2,
                                color: `#9ca3af`,
                              },
                              children: [
                                jsx(`span`, {
                                  style: {
                                    fontSize: 11,
                                    color: `#f3f4f6`,
                                    fontWeight: 600,
                                    writingMode: `vertical-rl`,
                                    letterSpacing: 1
                                  },
                                  children: `导出`,
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              ref: timelineTrackRef,
                              className: `relative overflow-hidden cursor-pointer`,
                              style: {
                                position: `relative`,
                                height: 98,
                                borderRadius: 18,
                                border: `1px solid #2a3140`,
                                background: `linear-gradient(180deg, #0d1118 0%, #0b0e14 100%)`,
                                overflow: `hidden`,
                                cursor: `pointer`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
                              },
                              onMouseDown: (event) => {
                                if (!duration) return;
                                (setPlayheadTime(trackTimeFromClientX(event.clientX)),
                                  beginTrimDrag(`playhead`, event));
                              },
                              children: [
                                jsx(`div`, {
                                  style: {
                                    position: `absolute`,
                                    inset: 10,
                                    borderRadius: 14,
                                    background: `linear-gradient(180deg, rgba(36,44,57,0.92), rgba(24,30,40,0.92))`,
                                  },
                                }),
                                Array.from({
                                  length: 18
                                }).map((_, index) =>
                                  jsx(
                                    `div`, {
                                      style: {
                                        position: `absolute`,
                                        top: 18,
                                        bottom: 26,
                                        left: `calc(${(index / 18) * 100}% + 10px)`,
                                        width: `calc(${100 / 18}% - 12px)`,
                                        minWidth: 18,
                                        borderRadius: 10,
                                        background: index % 2 === 0 ?
                                          `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))` :
                                          `linear-gradient(180deg, rgba(148,163,184,0.1), rgba(71,85,105,0.05))`,
                                        border: `1px solid rgba(255,255,255,0.03)`,
                                      },
                                    },
                                    `thumb-${index}`,
                                  ),
                                ),
                                duration > 0 &&
                                jsxs(`div`, {
                                  style: {
                                    position: `absolute`,
                                    top: 10,
                                    bottom: 24,
                                    left: toPercent(startTime),
                                    width: `calc(${toPercent(Math.max(0, endTime - startTime))} + 2px)`,
                                    minWidth: 44,
                                    borderRadius: 14,
                                    background: `linear-gradient(90deg, rgba(50,104,255,0.92), rgba(50,193,255,0.84))`,
                                    boxShadow: `0 12px 28px rgba(31,96,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.24)`,
                                  },
                                  children: [
                                    jsx(`button`, {
                                      onMouseDown: (event) => beginTrimDrag(`start`, event),
                                      style: {
                                        position: `absolute`,
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 18,
                                        border: `none`,
                                        borderRadius: `14px 0 0 14px`,
                                        background: `rgba(255,255,255,0.24)`,
                                        cursor: `ew-resize`,
                                      },
                                      children: jsx(`span`, {
                                        style: {
                                          display: `block`,
                                          width: 3,
                                          height: 28,
                                          borderRadius: 999,
                                          background: `rgba(255,255,255,0.98)`,
                                          margin: `18px auto`,
                                        },
                                      }),
                                    }),
                                    jsxs(`div`, {
                                      style: {
                                        position: `absolute`,
                                        left: 26,
                                        right: 26,
                                        top: 12,
                                        display: `flex`,
                                        alignItems: `center`,
                                        justifyContent: `space-between`,
                                        gap: 10,
                                        pointerEvents: `none`,
                                        color: `#ffffff`,
                                      },
                                      children: [
                                        jsxs(`div`, {
                                          style: {
                                            display: `flex`,
                                            flexDirection: `column`,
                                            gap: 4,
                                            minWidth: 0,
                                          },
                                          children: [
                                            jsx(`span`, {
                                              style: {
                                                fontSize: 11,
                                                fontWeight: 700,
                                                whiteSpace: `nowrap`,
                                              },
                                              children: `导出片段`,
                                            }),
                                            jsx(`span`, {
                                              style: {
                                                fontSize: 10,
                                                color: `rgba(255,255,255,0.82)`,
                                                whiteSpace: `nowrap`,
                                              },
                                              children: `${Math.max(0, clamp(roundToTenth(endTime), duration) - clamp(roundToTenth(startTime), duration)).toFixed(1)}s`,
                                            }),
                                          ],
                                        }),
                                        jsxs(`span`, {
                                          style: {
                                            fontSize: 10,
                                            color: `rgba(255,255,255,0.82)`,
                                            whiteSpace: `nowrap`,
                                          },
                                          children: [formatTime(startTime), ` - `, formatTime(endTime)],
                                        }),
                                      ],
                                    }),
                                    jsx(`button`, {
                                      onMouseDown: (event) => beginTrimDrag(`end`, event),
                                      style: {
                                        position: `absolute`,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 18,
                                        border: `none`,
                                        borderRadius: `0 14px 14px 0`,
                                        background: `rgba(255,255,255,0.24)`,
                                        cursor: `ew-resize`,
                                      },
                                      children: jsx(`span`, {
                                        style: {
                                          display: `block`,
                                          width: 3,
                                          height: 28,
                                          borderRadius: 999,
                                          background: `rgba(255,255,255,0.98)`,
                                          margin: `18px auto`,
                                        },
                                      }),
                                    }),
                                  ],
                                }),
                                duration > 0 &&
                                jsxs(`div`, {
                                  style: {
                                    position: `absolute`,
                                    left: 14,
                                    bottom: 8,
                                    display: `flex`,
                                    alignItems: `center`,
                                    gap: 8,
                                    fontSize: 10,
                                    color: `#8ea2c3`,
                                    background: `rgba(9,12,18,0.66)`,
                                    borderRadius: 999,
                                    padding: `4px 8px`,
                                  },
                                  children: [
                                    jsx(`span`, {
	                                    children: `拖两端改时长`,
                                    }),
                                    jsx(`span`, {
                                      children: `拖白线走位`,
                                    }),
                                  ],
                                }),
                                savedSegments.map((segment, index) =>
                                  jsx(
                                    `div`, {
                                      style: {
                                        position: `absolute`,
                                        top: 74,
                                        height: 10,
                                        borderRadius: 999,
                                        background: `rgba(52,211,153,0.72)`,
                                        border: `1px solid rgba(167,243,208,0.62)`,
                                        left: toPercent(segment.start),
                                        width: `calc(${toPercent(Math.max(0, segment.end - segment.start))} + 2px)`,
                                      },
                                      title: `片段 ${index + 1}: ${formatTime(segment.start)} - ${formatTime(segment.end)}`,
                                    },
                                    segment.id,
                                  ),
                                ),
                                duration > 0 &&
                                jsxs(`div`, {
                                  onMouseDown: (event) => beginTrimDrag(`playhead`, event),
                                  style: {
                                    position: `absolute`,
                                    top: 0,
                                    bottom: 0,
                                    left: toPercent(playheadTime),
                                    width: 2,
                                    background: `rgba(255,255,255,0.98)`,
                                    boxShadow: `0 0 14px rgba(255,255,255,0.42)`,
                                    cursor: `ew-resize`,
                                  },
                                  children: [
                                    jsx(`div`, {
                                      style: {
                                        position: `absolute`,
                                        left: -7,
                                        top: 8,
                                        width: 16,
                                        height: 16,
                                        borderRadius: 999,
                                        background: `#ffffff`,
                                        boxShadow: `0 4px 12px rgba(0,0,0,0.28)`,
                                      },
                                    }),
                                    jsx(`div`, {
                                      style: {
                                        position: `absolute`,
                                        left: playheadTime <= 0.4 ?
                                          4 :
                                          playheadTime >= Math.max(0, duration - 0.4) ?
                                          -46 :
                                          -18,
                                        top: -2,
                                        minWidth: 40,
                                        padding: `3px 6px`,
                                        borderRadius: 999,
                                        background: `rgba(8,9,12,0.92)`,
                                        color: `#ffffff`,
                                        fontSize: 10,
                                        textAlign: `center`,
                                      },
                                      children: formatTime(playheadTime),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3`,
                          style: {
                            position: `relative`,
                            zIndex: 1,
                            display: `none`,
                            gridTemplateColumns: `88px minmax(0, 1fr)`,
                            alignItems: `center`,
                            gap: 12,
                          },
                          children: [
                            jsxs(`div`, {
                              style: {
                                display: `flex`,
                                flexDirection: `column`,
                                gap: 6,
                                color: `#9ca3af`,
                              },
                              children: [
                                jsx(`span`, {
                                  style: {
                                    fontSize: 12,
                                    color: `#f3f4f6`,
                                    fontWeight: 600
                                  },
                                  children: `成片轨`,
                                }),
                                jsx(`span`, {
                                  style: {
                                    fontSize: 11
                                  },
                                  children: `输出顺序`,
                                }),
                              ],
                            }),
                            jsx(`div`, {
                              className: `relative overflow-hidden`,
                              style: {
                                position: `relative`,
                                height: 114,
                                borderRadius: 18,
                                border: `1px solid #2a3140`,
                                background: `linear-gradient(180deg, #0d1118 0%, #0b0e14 100%)`,
                                overflow: `hidden`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
                              },
                              children: outputSegments.length === 0 ?
                                jsxs(`div`, {
                                  style: {
                                    position: `absolute`,
                                    inset: 12,
                                    borderRadius: 14,
                                    border: `1px dashed rgba(148,163,184,0.22)`,
                                    display: `flex`,
                                    flexDirection: `column`,
                                    alignItems: `center`,
                                    justifyContent: `center`,
                                    color: `#6b7280`,
                                    gap: 6,
                                    fontSize: 11,
                                  },
                                  children: [
                                    jsx(`span`, {
                                      children: `成片轨还是空的`,
                                    }),
                                    jsx(`span`, {
                                      children: `把上面的选区加入成片轨后，会在这里按顺序拼接`,
                                    }),
                                  ],
                                }) :
                                outputSegments.map((segment, index) =>
                                  jsxs(
                                    `button`, {
                                      className: `absolute rounded-2xl text-left overflow-hidden`,
                                      style: {
                                        left: toPercent(segment.outputStart, totalOutputDuration),
                                        width: `calc(${toPercent(Math.max(0, segment.outputEnd - segment.outputStart), totalOutputDuration)} + 4px)`,
                                        top: 14,
                                        bottom: 14,
                                        minWidth: 96,
                                        border: `1px solid rgba(147,197,253,0.32)`,
                                        background: index % 2 === 0 ?
                                          `linear-gradient(90deg, rgba(59,130,246,0.9), rgba(56,189,248,0.82))` :
                                          `linear-gradient(90deg, rgba(99,102,241,0.88), rgba(45,212,191,0.82))`,
                                        boxShadow: `0 12px 28px rgba(15,23,42,0.24)`,
                                      },
                                      onClick: () => seekToTime(segment.start),
                                      children: [
                                        jsx(`div`, {
                                          style: {
                                            position: `absolute`,
                                            left: 8,
                                            right: 8,
                                            top: 8,
                                            height: 16,
                                            borderRadius: 10,
                                            background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 18px, rgba(255,255,255,0.05) 18px 36px)`,
                                          },
                                        }),
                                        jsxs(`div`, {
                                          style: {
                                            position: `absolute`,
                                            left: 12,
                                            right: 12,
                                            bottom: 12,
                                            display: `flex`,
                                            flexDirection: `column`,
                                            gap: 4,
                                            color: `#ffffff`,
                                          },
                                          children: [
                                            jsxs(`div`, {
                                              style: {
                                                display: `flex`,
                                                alignItems: `center`,
                                                justifyContent: `space-between`,
                                                gap: 8,
                                              },
                                              children: [
                                                jsxs(`span`, {
                                                  style: {
                                                    fontSize: 11,
                                                    fontWeight: 700
                                                  },
                                                  children: [`片段 `, index + 1],
                                                }),
                                                jsx(`span`, {
                                                  style: {
                                                    fontSize: 10,
                                                    color: `rgba(255,255,255,0.8)`,
                                                  },
                                                  children: `${segment.duration.toFixed(1)}s`,
                                                }),
                                              ],
                                            }),
                                            jsxs(`div`, {
                                              style: {
                                                fontSize: 10,
                                                color: `rgba(255,255,255,0.82)`,
                                                whiteSpace: `nowrap`,
                                                overflow: `hidden`,
                                                textOverflow: `ellipsis`,
                                              },
                                              children: [formatTime(segment.start), ` → `, formatTime(segment.end)],
                                            }),
                                          ],
                                        }),
                                      ],
                                    },
                                    `${segment.id}-output`,
                                  ),
                                ),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    document.body,
  );
}

