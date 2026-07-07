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
    [filmstrip, setFilmstrip] = useState([]),
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
            beginTrimHandleDrag = (edge) => (event) => {
              (event.preventDefault(), event.stopPropagation());
              let track = timelineTrackRef.current;
              if (!track || !duration) return;
              let move = (e) => {
                let rect = track.getBoundingClientRect(),
                  ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
                  t = roundToTenth(ratio * duration);
                edge === `start` ? setStartSeconds(t) : setEndSeconds(t);
                let v = videoRef.current;
                v && ((v.currentTime = t), setPlayheadTime(t));
              },
                up = () => {
                  (window.removeEventListener(`mousemove`, move), window.removeEventListener(`mouseup`, up));
                };
              (window.addEventListener(`mousemove`, move), window.addEventListener(`mouseup`, up));
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
  useEffect(() => {
    if (!videoUrl || !(duration > 0)) return;
    let cancelled = false,
      probe = document.createElement(`video`),
      canvas = document.createElement(`canvas`),
      frames = [],
      count = 12;
    ((probe.src = videoUrl), (probe.crossOrigin = `anonymous`), (probe.muted = !0), (probe.preload = `auto`), (probe.playsInline = !0));
    let run = async () => {
      await waitForMetadata(probe);
      let vw = probe.videoWidth || 16,
        vh = probe.videoHeight || 9,
        tw = 96,
        th = Math.max(24, Math.round((tw * vh) / vw)) || 54;
      ((canvas.width = tw), (canvas.height = th));
      let ctx = canvas.getContext(`2d`);
      if (!ctx) return;
      for (let idx = 0; idx < count; idx++) {
        if (cancelled) return;
        try {
          await seekTo(probe, ((idx + 0.5) / count) * duration);
          ctx.drawImage(probe, 0, 0, tw, th);
          frames.push(canvas.toDataURL(`image/jpeg`, 0.55));
          cancelled || setFilmstrip(frames.slice());
        } catch {}
      }
    };
    return (run().catch(() => {}), () => { cancelled = true; });
  }, [videoUrl, duration]);
  let selectionSeconds = Math.max(0, roundToTenth(endTime - startTime)),
    pct = (t) => (duration > 0 ? Math.max(0, Math.min(100, (t / duration) * 100)) : 0);
  let inputStyle = { width: 64, background: `#0d0d0d`, border: `1px solid #333`, borderRadius: 4, padding: `4px 8px`, color: `#fff`, fontSize: 12 },
    labelStyle = { display: `flex`, alignItems: `center`, gap: 4, fontSize: 12, color: `#9ca3af`, whiteSpace: `nowrap` };
  return createPortal(
    jsxs(`div`, {
      style: { position: `fixed`, inset: 0, zIndex: 9999, display: `flex`, flexDirection: `column`, background: `#0d0d0d`, userSelect: `none`, WebkitAppRegion: `no-drag` },
      children: [
        jsxs(`div`, {
          style: { flexShrink: 0, display: `flex`, alignItems: `center`, justifyContent: `space-between`, padding: `32px 20px 12px`, borderBottom: `1px solid #222` },
          children: [
            jsxs(`div`, {
              style: { display: `flex`, alignItems: `baseline`, gap: 12 },
              children: [
                jsx(`span`, { style: { color: `#fff`, fontWeight: 600, fontSize: 15 }, children: `视频剪辑` }),
                jsx(`span`, { style: { fontSize: 11, color: `#6b7280` }, children: `拖动两端裁剪时长，保留完整画面` }),
              ],
            }),
            jsxs(`div`, {
              style: { display: `flex`, alignItems: `center`, gap: 8 },
              children: [
                jsx(`button`, { onClick: onClose, style: { padding: `6px 12px`, borderRadius: 8, fontSize: 13, color: `#d1d5db`, background: `transparent`, border: `none`, cursor: `pointer` }, children: `关闭` }),
                jsx(`button`, { onClick: exportClip, disabled: isExporting, style: { padding: `6px 16px`, borderRadius: 8, fontSize: 13, fontWeight: 500, border: `none`, cursor: isExporting ? `default` : `pointer`, background: isExporting ? `#333` : `#2563eb`, color: isExporting ? `#6b7280` : `#fff` }, children: isExporting ? `导出中…` : `完成并导出` }),
              ],
            }),
          ],
        }),
        jsxs(`div`, {
          style: { flex: `1 1 0%`, minHeight: 0, display: `flex`, alignItems: `center`, justifyContent: `center`, background: `#000`, position: `relative`, padding: 16 },
          children: [
            jsx(`video`, {
              ref: videoRef,
              src: videoUrl,
              controls: !1,
              playsInline: !0,
              style: { maxWidth: `100%`, maxHeight: `100%`, objectFit: `contain`, borderRadius: 8, cursor: `pointer`, background: `#000` },
              onClick: togglePlayback,
              onTimeUpdate: (event) => {
                let time = roundToTenth(event.currentTarget.currentTime || 0);
                (setPlayheadTime(time), isPreviewing && time >= endTime && (event.currentTarget.pause(), setIsPreviewing(!1)));
              },
              onLoadedMetadata: (event) => {
                let dur = event.currentTarget.duration || 0;
                (setDuration(dur), setStartTime(0), setEndTime(dur), setPlayheadTime(0), setVideoFrame({ width: event.currentTarget.videoWidth || 9, height: event.currentTarget.videoHeight || 16 }));
              },
              onPlay: () => setIsPlaying(!0),
              onPause: () => setIsPlaying(!1),
              onEnded: () => { (setIsPlaying(!1), setIsPreviewing(!1)); },
            }),
            previewError && jsx(`div`, { style: { position: `absolute`, inset: 0, display: `flex`, alignItems: `center`, justifyContent: `center`, color: `#f87171`, fontSize: 14, textAlign: `center`, padding: 24 }, children: previewError }),
          ],
        }),
        jsxs(`div`, {
          style: { flexShrink: 0, padding: `16px 24px`, background: `#141414`, borderTop: `1px solid #222`, display: `flex`, flexDirection: `column`, gap: 12 },
          children: [
            jsxs(`div`, {
              style: { display: `flex`, alignItems: `center`, gap: 12, flexWrap: `wrap` },
              children: [
                jsx(`button`, { onClick: togglePlayback, style: { width: 36, height: 36, flexShrink: 0, borderRadius: `50%`, background: `#2563eb`, color: `#fff`, border: `none`, cursor: `pointer`, fontSize: 12 }, children: isPlaying ? `❚❚` : `▶` }),
                jsx(`span`, { style: { fontSize: 12, color: `#9ca3af`, whiteSpace: `nowrap`, fontVariantNumeric: `tabular-nums` }, children: `${formatTime(playheadTime)} / ${formatTime(duration)}` }),
                jsx(`div`, { style: { flex: 1, minWidth: 12 } }),
                jsxs(`label`, { style: labelStyle, children: [`入点`, jsx(`input`, { type: `number`, step: `0.1`, min: `0`, value: startTime, onChange: (e) => setStartSeconds(parseFloat(e.target.value)), style: inputStyle })] }),
                jsxs(`label`, { style: labelStyle, children: [`出点`, jsx(`input`, { type: `number`, step: `0.1`, min: `0`, value: endTime, onChange: (e) => setEndSeconds(parseFloat(e.target.value)), style: inputStyle })] }),
                jsx(`button`, { onClick: resetSelection, style: { padding: `4px 10px`, borderRadius: 4, fontSize: 12, color: `#9ca3af`, background: `transparent`, border: `none`, cursor: `pointer`, whiteSpace: `nowrap` }, children: `恢复全片` }),
                jsx(`span`, { style: { fontSize: 12, color: `#6b7280`, whiteSpace: `nowrap` }, children: `选段 ${formatTime(selectionSeconds)}` }),
              ],
            }),
            jsxs(`div`, {
              ref: timelineTrackRef,
              style: { position: `relative`, height: 64, borderRadius: 8, overflow: `hidden`, background: `#0a0a0a`, cursor: `pointer` },
              onClick: (event) => {
                let track = timelineTrackRef.current;
                if (!track || !duration) return;
                let rect = track.getBoundingClientRect(), ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
                seekToTime(ratio * duration);
              },
              children: [
                jsx(`div`, {
                  style: { position: `absolute`, inset: 0, display: `flex` },
                  children: (filmstrip.length ? filmstrip : new Array(12).fill(``)).map((src, i) =>
                    jsx(`div`, { style: { height: `100%`, flex: 1, background: src ? `center/cover no-repeat url(${src})` : `#1a1a1a` } }, `f${i}`),
                  ),
                }),
                duration > 0 && jsx(`div`, { style: { position: `absolute`, top: 0, bottom: 0, left: 0, width: `${pct(startTime)}%`, background: `rgba(0,0,0,0.55)`, pointerEvents: `none` } }),
                duration > 0 && jsx(`div`, { style: { position: `absolute`, top: 0, bottom: 0, right: 0, width: `${100 - pct(endTime)}%`, background: `rgba(0,0,0,0.55)`, pointerEvents: `none` } }),
                duration > 0 && jsx(`div`, { style: { position: `absolute`, top: 0, bottom: 0, left: `${pct(startTime)}%`, right: `${100 - pct(endTime)}%`, borderTop: `3px solid #facc15`, borderBottom: `3px solid #facc15`, pointerEvents: `none` } }),
                duration > 0 && jsx(`div`, {
                  style: { position: `absolute`, top: 0, bottom: 0, left: `${pct(startTime)}%`, width: 12, background: `#facc15`, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, cursor: `ew-resize`, display: `flex`, alignItems: `center`, justifyContent: `center`, zIndex: 10 },
                  onMouseDown: beginTrimHandleDrag(`start`),
                  onClick: (e) => e.stopPropagation(),
                  children: jsx(`div`, { style: { width: 2, height: 24, background: `rgba(0,0,0,0.45)`, borderRadius: 2 } }),
                }),
                duration > 0 && jsx(`div`, {
                  style: { position: `absolute`, top: 0, bottom: 0, left: `calc(${pct(endTime)}% - 12px)`, width: 12, background: `#facc15`, borderTopRightRadius: 6, borderBottomRightRadius: 6, cursor: `ew-resize`, display: `flex`, alignItems: `center`, justifyContent: `center`, zIndex: 10 },
                  onMouseDown: beginTrimHandleDrag(`end`),
                  onClick: (e) => e.stopPropagation(),
                  children: jsx(`div`, { style: { width: 2, height: 24, background: `rgba(0,0,0,0.45)`, borderRadius: 2 } }),
                }),
                duration > 0 && jsx(`div`, { style: { position: `absolute`, top: 0, bottom: 0, left: `${pct(playheadTime)}%`, width: 2, background: `#fff`, pointerEvents: `none`, zIndex: 20 } }),
              ],
            }),
            jsx(`div`, { style: { fontSize: 11, color: `#6b7280`, height: 16 }, children: isExporting ? statusMessage : `` }),
          ],
        }),
      ],
    }),
    document.body,
  );
}
