/**
 * 音频域节点与工具。
 *
 * - wanjuanTranscribeAudioClip（原 Ge）：调用文本 API 对音频做转写（带起止静音阈值）。
 * - WanJuanTtsMusic*：TTS/音乐（Suno）任务的 API 地址、任务 id/音频/歌词提取、voice clone 判定等工具。
 * - WanJuanTtsMusicNode：TTS/音乐生成节点；WanJuanAudioNode（原 Ke）：音频素材节点；
 *   WanJuanUnifiedAudioNode：按 data.audioMode 在两者间分派。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useRef, useState } from "react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { CircleAlert, CirclePlay, Copy, RefreshCw, Settings2, Upload } from "lucide-react";
import { resolveModelApiBindingIdHelper } from "../lib/model-binding";
import { WanJuanGetPreferredModel, WanJuanShouldAutoPreferredModel, WanJuanUseFavoriteModels } from "../lib/model-favorites";
import { WanJuanSameModelId } from "../lib/model-id";
import { buildProjectMediaFileUrl } from "../lib/resource";
import { WanJuanNodeHandle } from "./render-mode";

export const wanjuanTranscribeAudioClip = async (audioFile, baseUrl, apiKey, model, prompt, startGapThreshold, endGapThreshold, wanJuanAudioProtocolProfile: any = {}) => {
	      if (!apiKey) throw Error(`请先在设置中配置听音 API Key`);
	      let normalizedBaseUrl = baseUrl.trim().replace(/[`'"]/g, ``).replace(/\/$/, ``),
	        wanJuanAudioSubmitPath = String(wanJuanAudioProtocolProfile?.submitPath || `/v1/audio/transcriptions`).trim(),
	        requestUrl = /^https?:\/\//i.test(wanJuanAudioSubmitPath) ?
	        wanJuanAudioSubmitPath :
	        normalizedBaseUrl.endsWith(wanJuanAudioSubmitPath) ?
	        normalizedBaseUrl :
	        `${normalizedBaseUrl}${wanJuanAudioSubmitPath.startsWith(`/`) ? `` : `/`}${wanJuanAudioSubmitPath}`,
	        apiKey2 = apiKey.trim(),
	        formData = new FormData(),
	        wanJuanAudioFieldMapping = {
	          file: `file`,
	          model: `model`,
	          prompt: `prompt`,
	          responseFormat: `response_format`,
	          timestampGranularity: `timestamp_granularities[]`,
	          ...(wanJuanAudioProtocolProfile?.fieldMapping || {}),
	        },
	        wanJuanAudioFieldValueTypes =
	        wanJuanAudioProtocolProfile?.fieldValueTypes &&
	        typeof wanJuanAudioProtocolProfile.fieldValueTypes == `object` ?
	        wanJuanAudioProtocolProfile.fieldValueTypes :
	        {},
	        wanJuanCoerceAudioValue = (field, value) => {
	          let fieldName = String(field || ``).trim(),
	            valueType = wanJuanAudioFieldValueTypes[fieldName] ?
	            String(wanJuanAudioFieldValueTypes[fieldName]).trim().toLowerCase() :
	            ``;
	          return valueType === `string` ?
	            String(value ?? ``) :
	            valueType === `number` ?
	            Number(value) :
	            valueType === `boolean` ?
	            value === !0 || value === `true` :
	            value;
	        },
	        wanJuanAppendAudioField = (field, value) => {
	          let fieldName = String(field || ``).trim();
	          fieldName && value !== void 0 && value !== null && value !== `` && formData.append(fieldName, wanJuanCoerceAudioValue(fieldName, value));
	        };
	      (wanJuanAppendAudioField(wanJuanAudioFieldMapping.file, audioFile),
	        wanJuanAppendAudioField(wanJuanAudioFieldMapping.model, model),
	        wanJuanAppendAudioField(wanJuanAudioFieldMapping.responseFormat, `verbose_json`),
	        wanJuanAppendAudioField(wanJuanAudioFieldMapping.timestampGranularity, `word`),
	        prompt && wanJuanAppendAudioField(wanJuanAudioFieldMapping.prompt, prompt),
	        wanJuanAudioProtocolProfile?.extraBody &&
	        typeof wanJuanAudioProtocolProfile.extraBody == `object` &&
	        Object.entries(wanJuanAudioProtocolProfile.extraBody).forEach(([key, value]) =>
	          wanJuanAppendAudioField(key, value),
	        ));
	      let wanJuanAudioHeaders: any = {},
	        wanJuanAudioAuthType = String(wanJuanAudioProtocolProfile?.authType || ``).trim().toLowerCase();
	      (wanJuanAudioProtocolProfile?.headers &&
	        typeof wanJuanAudioProtocolProfile.headers == `object` &&
	        Object.entries(wanJuanAudioProtocolProfile.headers).forEach(([headerName, headerValue]) => {
	          wanJuanAudioHeaders[headerName] = String(headerValue).replace(/\{apiKey\}/gi, apiKey2);
	        }),
	        wanJuanAudioProtocolProfile?.extraHeaders &&
	        typeof wanJuanAudioProtocolProfile.extraHeaders == `object` &&
	        Object.entries(wanJuanAudioProtocolProfile.extraHeaders).forEach(([headerName, headerValue]) => {
	          wanJuanAudioHeaders[headerName] = String(headerValue).replace(/\{apiKey\}/gi, apiKey2);
	        }),
	        wanJuanAudioAuthType === `none` ?
	        null :
	        wanJuanAudioAuthType === `x-api-key` ?
	        (wanJuanAudioHeaders[`x-api-key`] = apiKey2) :
	        wanJuanAudioAuthType === `api-key` ?
	        (wanJuanAudioHeaders[`api-key`] = apiKey2) :
	        (wanJuanAudioHeaders.Authorization || (wanJuanAudioHeaders.Authorization = `Bearer ${apiKey2}`)));
	      let response = await fetch(requestUrl, {
	        method: `POST`,
	        headers: wanJuanAudioHeaders,
	        body: formData,
	      });
      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          let responseText = await response.text();
          try {
            let parsedBody = JSON.parse(responseText);
            errorMessage = parsedBody.error && parsedBody.error.message ? parsedBody.error.message : JSON.stringify(parsedBody);
          } catch {
            errorMessage = responseText || errorMessage;
          }
        } catch {}
        throw Error(`API 请求失败: ${errorMessage}`);
      }
	      let wanJuanAudioJson = await response.json(),
	        wanJuanReadAudioPath = (data, path) => String(path || ``).trim().split(`.`).filter(Boolean).reduce((current, key) => current == null ? void 0 : /^\d+$/.test(key) ? current?.[Number(key)] : current?.[key], data),
	        wanJuanWordsPath = wanJuanAudioProtocolProfile?.responseMapping?.words,
	        words = (wanJuanWordsPath ? wanJuanReadAudioPath(wanJuanAudioJson, wanJuanWordsPath) : null) || wanJuanAudioJson.words || [];
      if (!words || words.length === 0) return [];
      let segments = [],
        currentSegment = null,
        nextId = 1;
      for (let index = 0; index < words.length; index++) {
        let wordItem = words[index],
          wordText = wordItem.word,
          startTime = wordItem.start,
          endTime = wordItem.end;
        if (!currentSegment) currentSegment = {
          id: nextId++,
          text: wordText,
          start_time: startTime,
          end_time: endTime
        };
        else {
          let endGap = startTime - currentSegment.end_time,
            startGap = endTime - currentSegment.start_time;
          endGap >= endGapThreshold || startGap > startGapThreshold ?
            ((currentSegment.duration = Number((currentSegment.end_time - currentSegment.start_time).toFixed(2))),
              (currentSegment.start_time = Number(currentSegment.start_time.toFixed(2))),
              (currentSegment.end_time = Number(currentSegment.end_time.toFixed(2))),
              segments.push(currentSegment),
              (currentSegment = {
                id: nextId++,
                text: wordText,
                start_time: startTime,
                end_time: endTime
              })) :
            ((currentSegment.text += wordText), (currentSegment.end_time = endTime));
        }
      }
      return (
        currentSegment &&
        ((currentSegment.duration = Number((currentSegment.end_time - currentSegment.start_time).toFixed(2))),
          (currentSegment.start_time = Number(currentSegment.start_time.toFixed(2))),
          (currentSegment.end_time = Number(currentSegment.end_time.toFixed(2))),
          segments.push(currentSegment)),
        segments
      );
    };
export const WanJuanTtsMusicPickText = (result) => {
      let texts = [];
      if (result?.data) texts.push(result.data.text, result.data.prompt, result.data.resultData);
      let chunks = result?.data?.chunks;
      if (Array.isArray(chunks)) texts.push(chunks.map((chunk) => chunk?.text || ``).join(``));
      for (let text of texts)
        if (typeof text == `string` && text.trim()) return text.trim();
      return ``;
    };
export const WanJuanTtsMusicApiUrl = (base, suffix) => {
      let normalizedBase = String(base || ``).trim().replace(/[`'"]/g, ``).replace(/\/$/, ``);
      if (!normalizedBase) return ``;
      return normalizedBase.endsWith(suffix) ? normalizedBase : `${normalizedBase}${suffix}`;
    };
export const WanJuanTtsMusicExtractTaskId = (result) =>
      typeof result == `string` ?
      result :
      result?.task_id ||
      result?.taskId ||
      result?.id ||
      result?.data?.task_id ||
      result?.data?.taskId ||
      result?.data?.id ||
      (typeof result?.data == `string` ? result.data : ``);
export const WanJuanTtsMusicExtractAudio = (input) => {
      let urls = [],
        collectUrls = (value) => {
          if (!value) return;
          if (typeof value == `string`) {
            /^(https?:\/\/|data:audio\/)/i.test(value) && urls.push(value);
            try {
              collectUrls(JSON.parse(value));
            } catch {}
            return;
          }
          if (Array.isArray(value)) {
            value.forEach(collectUrls);
            return;
          }
          if (typeof value == `object`) {
            [
              `audio_url`,
              `audioUrl`,
              `source_audio_url`,
              `stream_audio_url`,
              `url`,
              `mp3_url`,
              `wav_url`,
              `video_url`,
            ].forEach((key) => collectUrls(value[key]));
            collectUrls(value.audio);
            collectUrls(value.data);
            collectUrls(value.result);
            collectUrls(value.output);
            collectUrls(value.clips);
          }
        };
      return (collectUrls(input), urls[0] || ``);
    };
export const WanJuanTtsMusicIsPlayableAudioUrl = (value) =>
      typeof value == `string` && /^(https?:\/\/|blob:|file:\/\/|data:audio\/)/i.test(value.trim());
export const WanJuanTtsMusicFileUrl = (filePath) =>
      buildProjectMediaFileUrl(filePath);
export const WanJuanTtsMusicBindingAudioUrl = (data) => {
      let audioBinding = data?.projectAssetBindings?.audioUrl || data?.data?.projectAssetBindings?.audioUrl;
      if (!audioBinding || typeof audioBinding != `object`) return ``;
      let fileUrl = audioBinding.localPath ? WanJuanTtsMusicFileUrl(audioBinding.localPath) : ``;
      return (
        WanJuanTtsMusicIsPlayableAudioUrl(fileUrl) ?
        fileUrl :
        WanJuanTtsMusicIsPlayableAudioUrl(audioBinding.sourceSignature) ?
        String(audioBinding.sourceSignature).trim() :
        WanJuanTtsMusicIsPlayableAudioUrl(audioBinding.value) ?
        String(audioBinding.value).trim() :
        WanJuanTtsMusicIsPlayableAudioUrl(audioBinding.portableData) ?
        String(audioBinding.portableData).trim() :
        ``
      );
    };
export const WanJuanTtsMusicTaskAudioUrl = (result) => {
      let audioUrl =
        result?.resultUrl ||
        result?.audioUrl ||
        result?.resultAudioUrl ||
        result?.outputAudioUrl ||
        result?.audio_url ||
        WanJuanTtsMusicBindingAudioUrl(result) ||
        WanJuanTtsMusicExtractAudio(result?.customResultData) ||
        WanJuanTtsMusicExtractAudio(result?.resultData) ||
        WanJuanTtsMusicExtractAudio(result);
      return WanJuanTtsMusicIsPlayableAudioUrl(audioUrl) ? String(audioUrl).trim() : ``;
    };
export const WanJuanIsMusicModel = (model) => {
      let normalizedModel = String(model || ``).trim().toLowerCase();
      return /^suno(?:_|-)/.test(normalizedModel) || [`suno`, `chirp-v3`, `chirp-v3-5`, `chirp-v4`].includes(normalizedModel) || /music|song|lyrics|concat|stems/.test(normalizedModel);
    };
export const WanJuanFilterModelList = (modelsInput, musicOnly) => {
      let models = String(modelsInput || ``)
        .split(/[\n,，、]+/)
        .map((model) => model.trim())
        .filter((model, index, array) => model && array.indexOf(model) === index);
      return models.filter((model) => (musicOnly ? WanJuanIsMusicModel(model) : !WanJuanIsMusicModel(model)));
    };
export const WanJuanTtsMusicExtractClipId = (input) => {
      let foundUrl = ``,
        collect = (value) => {
          if (!value || foundUrl) return;
          if (typeof value == `string`) {
            /^(https?:\/\/|data:)/i.test(value) || (foundUrl = value);
            return;
          }
          if (Array.isArray(value)) {
            value.forEach(collect);
            return;
          }
          if (typeof value == `object`) {
            foundUrl = value.clip_id || value.clipId || value.id || value.audio_id || value.audioId || ``;
            foundUrl || (collect(value.clip), collect(value.audio), collect(value.data), collect(value.result), collect(value.output), collect(value.clips));
          }
        };
      return (collect(input), foundUrl || ``);
    };
export const WanJuanTtsMusicExtractTaskIds = (modelsInput) =>
      String(modelsInput || ``)
      .split(/[\n,，、\s]+/)
      .map((model) => model.trim())
      .filter((model, index, array) => model && array.indexOf(model) === index);
export const WanJuanTtsMusicIsVoiceCloneModel = (model) =>
      /^(?:cosyvoice-v3|qwen3-tts-vc|qwen-tts-vc|qwen.*voice.*clone|.*voice.*clone)/i.test(String(model || ``).trim());
export const WanJuanTtsMusicExtractVoiceId = (payload) => {
      let found = ``,
        collect = (value) => {
          if (!value || found) return;
          if (typeof value == `string`) {
            let text = value.trim();
            try {
              collect(JSON.parse(text));
            } catch {
              text && !/^https?:\/\//i.test(text) && (found = text);
            }
            return;
          }
          if (Array.isArray(value)) {
            value.forEach(collect);
            return;
          }
          if (typeof value == `object`) {
            [
              `voice_id`,
              `voiceId`,
              `voice`,
              `speaker_id`,
              `speakerId`,
              `id`,
            ].some((key) => {
              let item = value[key];
              if (typeof item == `string` && item.trim()) {
                found = item.trim();
                return !0;
              }
              return !1;
            });
            found || (collect(value.data), collect(value.result), collect(value.output));
          }
        };
      return (collect(payload), found);
    };
export const WanJuanSunoHeaders = (apiKey, includeContentType = !0) => {
      let headers = {
        Accept: `application/json`,
        Authorization: `Bearer ${String(apiKey || ``).trim()}`
      };
      return (includeContentType && (headers[`Content-Type`] = `application/json`), headers);
    };
export const WanJuanSunoTaskStatus = (payload) =>
      String(payload?.data?.status || payload?.status || payload?.data?.data?.status || payload?.result?.status || ``).trim().toUpperCase();
export const WanJuanSunoTaskFailed = (payload) => {
      let status = WanJuanSunoTaskStatus(payload),
        serialized = JSON.stringify(payload || {}).toLowerCase();
      return /fail|error|cancel/.test(status) || /"status"\s*:\s*"(?:fail|failed|failure|error|cancelled|canceled)"/i.test(serialized);
    };
export const WanJuanSunoTaskSucceeded = (payload) => {
      let status = WanJuanSunoTaskStatus(payload),
        serialized = JSON.stringify(payload || {}).toLowerCase();
      return /^(SUCCESS|SUCCEEDED|COMPLETE|COMPLETED|FINISHED|DONE)$/i.test(status) || /"status"\s*:\s*"(?:success|succeeded|complete|completed|finished|done)"/i.test(serialized);
    };
export const WanJuanTtsMusicNode = reactMemo(({
      id: nodeId,
      data: nodeData,
      selected: selected
    }: any) => {
      let {
        updateNodeData: updateNodeData,
        getNodes: getNodes,
        getEdges: getEdges
      } = useReactFlow(),
        data = nodeData,
      [mode, setMode] = useState(nodeData.mode || (nodeData.nodeKind === `music` ? `suno` : `tts`)),
      [prompt, setPrompt] = useState(nodeData.prompt || ``),
      [ttsModel, setTtsModel] = useState(nodeData.ttsModel || ``),
      [voice, setVoice] = useState(nodeData.voice || `alloy`),
      [wanJuanTtsFormat, setWanJuanTtsFormat] = useState(nodeData.responseFormat || `mp3`),
      [wanJuanTtsSpeed, setWanJuanTtsSpeed] = useState(nodeData.speed || `1`),
      [wanJuanTtsInstructions, setWanJuanTtsInstructions] = useState(nodeData.instructions || ``),
      [wanJuanTtsReferenceAudioUrl, setWanJuanTtsReferenceAudioUrl] = useState(nodeData.referenceAudioUrl || ``),
      [wanJuanTtsExtraJson, setWanJuanTtsExtraJson] = useState(nodeData.extraJson || ``),
        [wanJuanTtsModelOpen, setWanJuanTtsModelOpen] = useState(!1),
        [sunoModel, _] = useState(nodeData.sunoModel || ``),
        [wanJuanSunoMv, setWanJuanSunoMv] = useState(nodeData.sunoMv || nodeData.mv || `chirp-v3-5`),
        [title, setTitle] = useState(nodeData.title || `AI Music`),
        [tags, setTags] = useState(nodeData.tags || `pop, cinematic`),
        [instrumental, setWanJuanTtsMusicInstrumental] = useState(!!nodeData.instrumental),
        [wanJuanMusicAction, setWanJuanMusicAction] = useState([`song`, `lyrics_to_song`, `lyrics`, `concat`].includes(nodeData.musicAction) ? nodeData.musicAction : `song`),
        [wanJuanMusicModelOpen, setWanJuanMusicModelOpen] = useState(!1),
        [wanJuanRemoteTaskId, setWanJuanRemoteTaskId] = useState(nodeData.remoteTaskId || ``),
        [wanJuanClipId, setWanJuanClipId] = useState(nodeData.clipId || ``),
        [wanJuanBatchIds, setWanJuanBatchIds] = useState(nodeData.batchIds || ``),
        [wanJuanSunoExtraJson, setWanJuanSunoExtraJson] = useState(nodeData.sunoExtraJson || ``),
        [wanJuanSunoIsInfill, setWanJuanSunoIsInfill] = useState(!!nodeData.isInfill),
        [showHelp, setWanJuanTtsMusicHelp] = useState(!1);
      let wanJuanNodeKind = nodeData.nodeKind || (mode === `suno` || WanJuanIsMusicModel(nodeData.sunoModel || nodeData.ttsModel || ``) ? `music` : `audio`),
        wanJuanIsMusicNode = wanJuanNodeKind === `music`,
        wanJuanNodeTitle = wanJuanIsMusicNode ? `音乐节点` : `音频节点`;
      let favoriteModels = WanJuanUseFavoriteModels();
      let wanJuanTtsModelManualRef = useRef(nodeData.wanjuanTtsModelManual === !0),
        wanJuanMusicModelManualRef = useRef(nodeData.wanjuanMusicModelManual === !0);
      useEffect(() => {
        updateNodeData(nodeId, {
          mode: mode,
          nodeKind: wanJuanNodeKind,
          prompt: prompt,
          text: data.audioUrl || data.videoUrl || data.resultData || ``,
          ttsModel: ttsModel,
          voice: voice,
          responseFormat: wanJuanTtsFormat,
          speed: wanJuanTtsSpeed,
          instructions: wanJuanTtsInstructions,
          referenceAudioUrl: wanJuanTtsReferenceAudioUrl,
          extraJson: wanJuanTtsExtraJson,
          sunoModel: sunoModel,
          sunoMv: wanJuanSunoMv,
          title: title,
          tags: tags,
          instrumental: instrumental,
          musicAction: wanJuanMusicAction,
          remoteTaskId: wanJuanRemoteTaskId,
          clipId: wanJuanClipId,
          batchIds: wanJuanBatchIds,
          sunoExtraJson: wanJuanSunoExtraJson,
          isInfill: wanJuanSunoIsInfill
        });
      }, [nodeId, updateNodeData, mode, wanJuanNodeKind, prompt, ttsModel, voice, wanJuanTtsFormat, wanJuanTtsSpeed, wanJuanTtsInstructions, wanJuanTtsReferenceAudioUrl, wanJuanTtsExtraJson, sunoModel, wanJuanSunoMv, title, tags, instrumental, wanJuanMusicAction, wanJuanRemoteTaskId, wanJuanClipId, wanJuanBatchIds, wanJuanSunoExtraJson, wanJuanSunoIsInfill, data.audioUrl, data.videoUrl, data.resultData]);
      let wanJuanAllTtsMusicModels = String(`${data.ttsMusicModels || ``}
${data.audioModel || ``}`)
          .split(/[\n,，、]+/)
          .map((model) => model.trim())
          .filter((model, index, array) => model && array.indexOf(model) === index),
        wanJuanTtsMusicModels = WanJuanFilterModelList(wanJuanAllTtsMusicModels.join(`
`), !1),
        wanJuanMusicModels = WanJuanFilterModelList(wanJuanAllTtsMusicModels.join(`
`), !0);
      let wanJuanTtsMusicModelsForDropdown = wanJuanIsMusicNode ? wanJuanMusicModels : wanJuanTtsMusicModels,
        wanJuanEffectiveSunoModel = sunoModel || (wanJuanMusicAction === `lyrics` ? `suno_lyrics` : wanJuanMusicAction === `concat` ? `suno_concat` : ``),
        wanJuanApplyPreferredTtsModel = (favoritesOverride = favoriteModels.favorites) => {
          let ttsModelText = wanJuanTtsMusicModels.join(`
`);
          if (!ttsModelText) return;
          if (!WanJuanShouldAutoPreferredModel(ttsModelText, ttsModel, {
              manual: wanJuanTtsModelManualRef.current || nodeData.wanjuanTtsModelManual === !0,
              auto: nodeData.wanjuanTtsModelAuto === !0,
            })) return;
          let nextModel = WanJuanGetPreferredModel(ttsModelText, ttsModel, favoritesOverride, {
            auto: !0
          });
          nextModel &&
            !WanJuanSameModelId(nextModel, ttsModel) &&
            ((wanJuanTtsModelManualRef.current = !1),
              setTtsModel(nextModel),
              updateNodeData(nodeId, {
                ttsModel: nextModel,
                wanjuanTtsModelAuto: !0,
                wanjuanTtsModelManual: !1
              }));
        },
        wanJuanApplyPreferredMusicModel = (favoritesOverride = favoriteModels.favorites) => {
          let musicModelText = wanJuanMusicModels.join(`
`);
          if (!musicModelText) return;
          if (!WanJuanShouldAutoPreferredModel(musicModelText, sunoModel, {
              manual: wanJuanMusicModelManualRef.current || nodeData.wanjuanMusicModelManual === !0,
              auto: nodeData.wanjuanMusicModelAuto === !0,
            })) return;
          let nextModel = WanJuanGetPreferredModel(musicModelText, sunoModel, favoritesOverride, {
            auto: !0
          });
          nextModel &&
            !WanJuanSameModelId(nextModel, sunoModel) &&
            ((wanJuanMusicModelManualRef.current = !1),
              _(nextModel),
              updateNodeData(nodeId, {
                sunoModel: nextModel,
                wanjuanMusicModelAuto: !0,
                wanjuanMusicModelManual: !1
              }));
        },
        gatherInputText = () => {
          let edges = getEdges(),
            nodes: any = getNodes(),
            incomingEdges = edges.filter((edge: any) => edge.target === nodeId);
          for (let edge of incomingEdges) {
            let sourceNode = nodes.find((node: any) => node.id === edge.source),
              sourceText = WanJuanTtsMusicPickText(sourceNode);
            if (sourceText) return sourceText;
          }
          return prompt.trim();
        },
        wanJuanFindReferenceAudio = () => {
          if (wanJuanTtsReferenceAudioUrl.trim()) return wanJuanTtsReferenceAudioUrl.trim();
          let edges = getEdges(),
            nodes: any = getNodes(),
            incomingEdges = edges.filter((edge: any) => edge.target === nodeId);
          for (let edge of incomingEdges) {
            let sourceNode = nodes.find((node: any) => node.id === edge.source),
              nodeData2 = sourceNode?.data || {},
              mediaUrl = nodeData2.audioUrl || nodeData2.videoUrl || nodeData2.imageUrl || ``;
            if (typeof mediaUrl == `string` && /^(https?:\/\/|data:audio\/|data:video\/)/i.test(mediaUrl)) return mediaUrl;
          }
          return ``;
	        },
	        wanJuanFindUpstreamSunoRef = () => {
	          let edges = getEdges(),
	            nodes: any = getNodes(),
	            incomingEdges = edges.filter((edge: any) => edge.target === nodeId),
	            taskInfo = {
	              taskId: ``,
	              clipId: ``
	            };
	          for (let edge of incomingEdges) {
	            let sourceNode = nodes.find((node: any) => node.id === edge.source),
	              nodeData2 = sourceNode?.data || {};
	            if (!taskInfo.taskId && nodeData2.remoteTaskId) taskInfo.taskId = nodeData2.remoteTaskId;
	            if (!taskInfo.clipId && nodeData2.clipId) taskInfo.clipId = nodeData2.clipId;
	            if ((!taskInfo.taskId || !taskInfo.clipId) && nodeData2.resultData) {
	              try {
	                let resultData = typeof nodeData2.resultData == `string` ? JSON.parse(nodeData2.resultData) : nodeData2.resultData;
	                taskInfo.taskId || (taskInfo.taskId = WanJuanTtsMusicExtractTaskId(resultData));
	                taskInfo.clipId || (taskInfo.clipId = WanJuanTtsMusicExtractClipId(resultData));
	              } catch {}
	            }
	            if (taskInfo.taskId && taskInfo.clipId) break;
	          }
	          return taskInfo;
	        },
	        runWanJuanTtsMusic = async () => {
		          let inputText = gatherInputText();
			          let wanJuanAudioModelForBinding = mode === `tts` ? ttsModel || data.audioModel || `` : wanJuanEffectiveSunoModel,
			            wanJuanAudioConfigs = Array.isArray(data.apiConfigs) ? data.apiConfigs : [],
			            wanJuanBoundAudioConfigId = resolveModelApiBindingIdHelper(data.audioModelApiBindings, wanJuanAudioModelForBinding, ``),
			            wanJuanUsableAudioConfigs = wanJuanAudioConfigs.filter((item: any) => item?.url && item?.key),
			            wanJuanDefaultAudioConfig = wanJuanUsableAudioConfigs.find((item: any) => /zhichuang|智创|聚合|suno|lconai/i.test(`${item?.id || ``} ${item?.name || ``} ${item?.url || ``}`)) || wanJuanUsableAudioConfigs.find((item: any) => item?.id === `default`) || wanJuanUsableAudioConfigs[0] || wanJuanAudioConfigs.find((item: any) => item?.id === `default`) || wanJuanAudioConfigs[0] || null,
			            wanJuanBoundAudioConfig = wanJuanBoundAudioConfigId && wanJuanAudioConfigs.length ?
			            wanJuanAudioConfigs.find((config) => config.id === wanJuanBoundAudioConfigId) :
			            null,
			            wanJuanTtsMusicProtocolName = data.audioModelProtocolBindings?.[wanJuanAudioModelForBinding],
			            wanJuanTtsMusicProtocolProfile = data.modelProtocolRegistry?.[wanJuanTtsMusicProtocolName] || {},
			            wanJuanAudioApiUrl = wanJuanBoundAudioConfig?.url || data.audioApiUrl || wanJuanDefaultAudioConfig?.url,
			            wanJuanAudioApiKey = wanJuanBoundAudioConfig?.key || data.audioApiKey || wanJuanDefaultAudioConfig?.key;
	          if (mode === `tts` && !inputText) {
            data.onShowToast?.(`请输入文本或连接文本节点`);
            updateNodeData(nodeId, {
              errorMessage: `请输入文本或连接文本节点`
            });
            return;
          }
          if (mode === `suno` && [`song`, `lyrics`].includes(wanJuanMusicAction) && !inputText) {
            data.onShowToast?.(`请输入歌词/描述，或连接文本节点`);
            updateNodeData(nodeId, {
              errorMessage: `请输入歌词/描述，或连接文本节点`
            });
            return;
          }
          if (mode === `suno` && wanJuanMusicAction === `lyrics_to_song` && !inputText) {
            data.onShowToast?.(`请输入歌词，或连接歌词文本节点`);
            updateNodeData(nodeId, {
              errorMessage: `请输入歌词，或连接歌词文本节点`
            });
            return;
          }
          let wanJuanUpstreamSunoRef = mode === `suno` ? wanJuanFindUpstreamSunoRef() : {
            taskId: ``,
            clipId: ``
          };
          if (mode === `suno` && wanJuanMusicAction === `concat` && !(wanJuanClipId.trim() || wanJuanUpstreamSunoRef.clipId)) {
            updateNodeData(nodeId, {
              errorMessage: `请填写要拼接的 clip_id，或从上游音乐节点结果中获取`
            });
            return;
          }
          if (mode === `suno` && wanJuanMusicAction === `single` && !wanJuanRemoteTaskId.trim()) {
            updateNodeData(nodeId, {
              errorMessage: `请填写 task_id`
            });
            return;
          }
          if (mode === `suno` && wanJuanMusicAction === `batch` && !WanJuanTtsMusicExtractTaskIds(wanJuanBatchIds).length) {
            updateNodeData(nodeId, {
              errorMessage: `请填写一个或多个 task_id`
            });
            return;
          }
          if (mode === `suno` && wanJuanMusicAction === `wav` && !wanJuanClipId.trim()) {
            updateNodeData(nodeId, {
              errorMessage: `请填写 clip_id`
            });
            return;
          }
	          if (!wanJuanAudioApiUrl || !wanJuanAudioApiKey) {
            updateNodeData(nodeId, {
              errorMessage: `请在设置中配置听音 API`
            });
            return;
          }
          let itemId = `tts-music-${nodeId}-${Date.now()}`;
          mode === `suno` && (setWanJuanRemoteTaskId(``), setWanJuanClipId(``));
          updateNodeData(nodeId, {
            loading: !0,
            errorMessage: void 0,
            taskId: itemId,
            audioUrl: void 0,
            audioName: void 0,
            resultData: void 0,
            text: ``,
            remoteTaskId: void 0,
            clipId: void 0
          });
          data.updateGlobalTasks?.((items) => [...items, {
            id: itemId,
            type: `audio`,
            projectId: data.projectId,
            nodeId: nodeId,
            status: `running`,
            progress: 0,
            createdAt: Date.now(),
            prompt: inputText.slice(0, 120),
            customOutputType: `audio`,
            provider: mode === `suno` ? `suno` : `tts`,
            modelName: wanJuanAudioModelForBinding,
            apiConfigId: wanJuanBoundAudioConfig?.id || wanJuanDefaultAudioConfig?.id || ``,
            apiBaseUrl: wanJuanAudioApiUrl,
            requestProfile: mode === `suno` ?
              {
                requestType: `suno-music`,
                submitPath: `/suno/submit/music`,
                pollPath: `/suno/fetch/{taskId}`,
                action: wanJuanMusicAction
              } :
              {
                requestType: `audio-speech`,
                submitPath: wanJuanTtsMusicProtocolProfile?.submitPath || `/v1/audio/speech`
              }
          }]);
          try {
            if (mode === `tts`) {
              let wanJuanTtsExtraParams: any = {};
              if (wanJuanTtsExtraJson.trim())
                try {
                  wanJuanTtsExtraParams = JSON.parse(wanJuanTtsExtraJson);
                } catch (error) {
                  throw Error(`额外 JSON 参数格式错误：${error.message}`);
                }
              let wanJuanVoiceCloneOptions = {
                text: wanJuanTtsExtraParams.voiceEnrollmentText || wanJuanTtsExtraParams.refText || wanJuanTtsExtraParams.referenceText || ``,
                language: wanJuanTtsExtraParams.voiceEnrollmentLanguage || wanJuanTtsExtraParams.language || ``,
                languageHints: wanJuanTtsExtraParams.voiceEnrollmentLanguageHints || wanJuanTtsExtraParams.language_hints || wanJuanTtsExtraParams.languageHints,
                prefix: wanJuanTtsExtraParams.voiceEnrollmentPrefix || wanJuanTtsExtraParams.prefix || ``,
                enrollmentPath: wanJuanTtsExtraParams.voiceEnrollmentPath || wanJuanTtsExtraParams.enrollmentPath || ``,
              };
              [
                `voiceEnrollmentText`,
                `refText`,
                `referenceText`,
                `voiceEnrollmentLanguage`,
                `voiceEnrollmentLanguageHints`,
                `languageHints`,
                `language_hints`,
                `voiceEnrollmentPrefix`,
                `prefix`,
                `voiceEnrollmentPath`,
                `enrollmentPath`,
              ].forEach((key) => delete wanJuanTtsExtraParams[key]);
	              let wanJuanRefAudio = wanJuanFindReferenceAudio(),
	                wanJuanTtsFieldMapping = {
	                  model: `model`,
	                  input: `input`,
	                  voice: `voice`,
	                  format: `response_format`,
	                  speed: `speed`,
	                  instructions: `instructions`,
	                  referenceAudio: `reference_audio_url`,
	                  ...(wanJuanTtsMusicProtocolProfile?.fieldMapping || {}),
	                },
	                wanJuanTtsFieldValueTypes =
	                wanJuanTtsMusicProtocolProfile?.fieldValueTypes &&
	                typeof wanJuanTtsMusicProtocolProfile.fieldValueTypes == `object` ?
	                wanJuanTtsMusicProtocolProfile.fieldValueTypes :
	                {},
	                wanJuanTtsBody: any = {},
	                wanJuanRawTtsModel = ttsModel || data.audioModel || ``,
	                wanJuanEffectiveTtsModel = /^qwen-voice-enrollment$/i.test(String(wanJuanRawTtsModel || ``).trim()) ?
	                `qwen3-tts-vc-realtime-2026-01-15` :
	                wanJuanRawTtsModel,
	                wanJuanCoerceTtsValue = (key, value) => {
	                  let fieldKey = String(key || ``).trim(),
	                    valueType = wanJuanTtsFieldValueTypes[fieldKey] ?
	                    String(wanJuanTtsFieldValueTypes[fieldKey]).trim().toLowerCase() :
	                    ``;
	                  return valueType === `string` ?
	                    String(value ?? ``) :
	                    valueType === `number` ?
	                    Number(value) :
	                    valueType === `boolean` ?
	                    value === !0 || value === `true` :
	                    value;
	                },
	                wanJuanPutTtsField = (key, value) => {
	                  let fieldKey = String(key || ``).trim();
	                  fieldKey && value !== void 0 && value !== null && value !== `` && (wanJuanTtsBody[fieldKey] = wanJuanCoerceTtsValue(fieldKey, value));
	                };
	              (wanJuanPutTtsField(wanJuanTtsFieldMapping.model, wanJuanEffectiveTtsModel),
	                wanJuanPutTtsField(wanJuanTtsFieldMapping.input, inputText),
	                wanJuanPutTtsField(wanJuanTtsFieldMapping.voice, voice || `alloy`),
	                wanJuanTtsFormat && wanJuanPutTtsField(wanJuanTtsFieldMapping.format, wanJuanTtsFormat),
	                wanJuanTtsSpeed && wanJuanPutTtsField(wanJuanTtsFieldMapping.speed, Number(wanJuanTtsSpeed) || 1),
	                wanJuanTtsInstructions.trim() && wanJuanPutTtsField(wanJuanTtsFieldMapping.instructions, wanJuanTtsInstructions.trim()),
	                wanJuanRefAudio && wanJuanPutTtsField(wanJuanTtsFieldMapping.referenceAudio, wanJuanRefAudio),
	                Object.assign(wanJuanTtsBody, wanJuanTtsExtraParams),
	                wanJuanTtsMusicProtocolProfile?.extraBody &&
	                typeof wanJuanTtsMusicProtocolProfile.extraBody == `object` &&
	                Object.entries(wanJuanTtsMusicProtocolProfile.extraBody).forEach(([key, value]) =>
	                  wanJuanPutTtsField(key, value),
	                ));
		              let requestUrl = WanJuanTtsMusicApiUrl(wanJuanAudioApiUrl, wanJuanTtsMusicProtocolProfile?.submitPath || `/v1/audio/speech`),
		                wanJuanTtsHeaders: any = {
		                  "Content-Type": String(wanJuanTtsMusicProtocolProfile?.contentType || `application/json`).trim() || `application/json`
		                },
		                wanJuanTtsAuthType = String(wanJuanTtsMusicProtocolProfile?.authType || ``).trim().toLowerCase();
		              (wanJuanTtsMusicProtocolProfile?.headers &&
		                typeof wanJuanTtsMusicProtocolProfile.headers == `object` &&
		                Object.entries(wanJuanTtsMusicProtocolProfile.headers).forEach(([key, value]) => {
		                  wanJuanTtsHeaders[key] = String(value).replace(/\{apiKey\}/gi, String(wanJuanAudioApiKey || ``).trim());
		                }),
		                wanJuanTtsMusicProtocolProfile?.extraHeaders &&
		                typeof wanJuanTtsMusicProtocolProfile.extraHeaders == `object` &&
		                Object.entries(wanJuanTtsMusicProtocolProfile.extraHeaders).forEach(([key, value]) => {
		                  wanJuanTtsHeaders[key] = String(value).replace(/\{apiKey\}/gi, String(wanJuanAudioApiKey || ``).trim());
		                }),
		                wanJuanTtsAuthType === `none` ?
		                null :
		                wanJuanTtsAuthType === `x-api-key` ?
		                (wanJuanTtsHeaders[`x-api-key`] = String(wanJuanAudioApiKey || ``).trim()) :
		                wanJuanTtsAuthType === `api-key` ?
		                (wanJuanTtsHeaders[`api-key`] = String(wanJuanAudioApiKey || ``).trim()) :
		                (wanJuanTtsHeaders.Authorization || (wanJuanTtsHeaders.Authorization = `Bearer ${String(wanJuanAudioApiKey || ``).trim()}`)));
		              if (wanJuanRefAudio && WanJuanTtsMusicIsVoiceCloneModel(wanJuanRawTtsModel)) {
		                let wanJuanIsCosyVoiceClone = /^cosyvoice/i.test(String(wanJuanEffectiveTtsModel || ``).trim()),
		                  wanJuanEnrollmentModel = wanJuanIsCosyVoiceClone ? `voice-enrollment` : `qwen-voice-enrollment`,
		                  wanJuanEnrollmentPath =
		                    wanJuanTtsMusicProtocolProfile?.voiceEnrollmentPath ||
		                    wanJuanTtsMusicProtocolProfile?.enrollmentPath ||
		                    wanJuanVoiceCloneOptions.enrollmentPath,
		                  wanJuanVoiceNamePrefix = String(wanJuanVoiceCloneOptions.prefix || `wanjuan`).replace(/[^a-z0-9_]/gi, ``).slice(0, wanJuanIsCosyVoiceClone ? 10 : 16) || `wanjuan`,
		                  wanJuanEnrollmentBody = wanJuanIsCosyVoiceClone ?
		                  {
		                    model: wanJuanEnrollmentModel,
		                    input: {
		                      action: `create_voice`,
		                      target_model: wanJuanEffectiveTtsModel,
		                      prefix: wanJuanVoiceNamePrefix.replace(/_/g, ``).slice(0, 10) || `wanjuan`,
		                      url: wanJuanRefAudio,
		                      language_hints: Array.isArray(wanJuanVoiceCloneOptions.languageHints) ?
		                        wanJuanVoiceCloneOptions.languageHints :
		                        [String(wanJuanVoiceCloneOptions.language || `zh`).trim() || `zh`],
		                      max_prompt_audio_length: 10,
		                      enable_preprocess: !0
		                    }
		                  } :
		                  {
		                    model: wanJuanEnrollmentModel,
		                    input: {
		                      action: `create`,
		                      target_model: wanJuanEffectiveTtsModel,
		                      preferred_name: wanJuanVoiceNamePrefix,
		                      audio: {
		                        data: wanJuanRefAudio
		                      },
		                      ...(String(wanJuanVoiceCloneOptions.text || ``).trim() ? {
		                        text: String(wanJuanVoiceCloneOptions.text).trim()
		                      } : {}),
		                      ...(String(wanJuanVoiceCloneOptions.language || ``).trim() ? {
		                        language: String(wanJuanVoiceCloneOptions.language).trim()
		                      } : {})
		                    }
		                  };
		                if (!String(wanJuanEnrollmentPath || ``).trim()) {
		                  throw Error(`当前音频 API 文档未提供 ${wanJuanRawTtsModel} 的音色克隆注册接口，不能直接用参考音频 URL 克隆。请改用普通 TTS 音色，或在模型协议/额外 JSON 中配置 voiceEnrollmentPath 后再试。`);
		                }
		                let enrollmentResponse = await fetch(WanJuanTtsMusicApiUrl(wanJuanAudioApiUrl, wanJuanEnrollmentPath), {
		                  method: `POST`,
		                  headers: wanJuanTtsHeaders,
		                  body: JSON.stringify(wanJuanEnrollmentBody)
		                });
		                if (!enrollmentResponse.ok) {
		                  let errorText = await enrollmentResponse.text().catch(() => enrollmentResponse.statusText);
		                  try {
		                    let errorData = JSON.parse(errorText);
		                    errorText = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
		                  } catch {}
		                  throw Error(errorText || `音色克隆注册失败`);
		                }
		                let enrollmentText = await enrollmentResponse.text().catch(() => ``),
		                  enrollmentPayload;
		                try {
		                  enrollmentPayload = enrollmentText ? JSON.parse(enrollmentText) : {};
		                } catch {
		                  enrollmentPayload = enrollmentText;
		                }
		                let clonedVoice = WanJuanTtsMusicExtractVoiceId(enrollmentPayload);
		                if (!clonedVoice) throw Error(`音色克隆注册成功但未返回 voice_id`);
		                wanJuanPutTtsField(wanJuanTtsFieldMapping.voice, clonedVoice);
		                let referenceField = String(wanJuanTtsFieldMapping.referenceAudio || ``).trim();
		                referenceField && delete wanJuanTtsBody[referenceField];
		                updateNodeData(nodeId, {
		                  voice: clonedVoice,
		                  clonedVoiceId: clonedVoice,
		                  clonedVoiceEnrollment: typeof enrollmentPayload == `string` ? enrollmentPayload : JSON.stringify(enrollmentPayload, null, 2),
		                  loadingText: `音色已克隆，正在合成...`
		                });
		              }
		              let
	                response = await fetch(requestUrl, {
	                  method: `POST`,
	                  headers: wanJuanTtsHeaders,
	                  body: JSON.stringify(wanJuanTtsBody)
	                });
              if (!response.ok) {
                let errorText = await response.text().catch(() => response.statusText);
                try {
                  let errorData = JSON.parse(errorText);
                  errorText = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
                } catch {}
                throw Error(errorText || `TTS 请求失败`);
              }
              let contentType = response.headers.get(`content-type`) || `audio/mpeg`,
                audioBlob = await response.blob(),
                audioUrl = URL.createObjectURL(audioBlob),
                fileName = `tts-${Date.now()}.${contentType.includes(`wav`) ? `wav` : contentType.includes(`ogg`) ? `ogg` : `mp3`}`;
              (updateNodeData(nodeId, {
                  loading: !1,
                  audioUrl: audioUrl,
                  videoUrl: void 0,
                  audioName: fileName,
                  resultData: audioUrl,
                  text: audioUrl
                }),
                data.updateGlobalTasks?.((items) => items.map((item: any) => item.id === requestUrl ? {
                  ...item,
                  status: `completed`,
                  progress: 100,
                  customResultData: audioUrl
                } : item)),
                data.addTransitResource?.(audioUrl, `audio`, fileName || `TTS 音频`),
                data.onShowToast?.(`TTS 生成完成`));
            } else {
              let wanJuanSunoExtraParams = {};
              if (wanJuanSunoExtraJson.trim())
                try {
                  wanJuanSunoExtraParams = JSON.parse(wanJuanSunoExtraJson);
                } catch (error) {
                  throw Error(`Suno 额外 JSON 参数格式错误：${error.message}`);
                }
              let wanJuanSunoFinish = (result, taskLabel = `Suno 任务`, options: any = {}) => {
	                  let audioUrl = WanJuanTtsMusicExtractAudio(result),
	                    taskId = WanJuanTtsMusicExtractTaskId(result) || wanJuanRemoteTaskId,
	                    clipId = WanJuanTtsMusicExtractClipId(result) || wanJuanClipId,
	                    resultText = typeof result == `string` ? result : JSON.stringify(result, null, 2),
	                    requireAudio = options.requireAudio === !0,
	                    statePatch = {
	                      loading: !1,
	                      errorMessage: void 0,
	                      audioUrl: audioUrl || void 0,
	                      audioName: audioUrl ? `${title || taskLabel || `suno`}.mp3` : data.audioName,
	                      resultData: resultText,
	                      text: audioUrl || resultText,
	                      remoteTaskId: taskId || void 0,
	                      clipId: clipId || void 0
	                    };
	                  if (requireAudio && !audioUrl) {
	                    return (
	                      taskId && setWanJuanRemoteTaskId(taskId),
	                      clipId && setWanJuanClipId(clipId),
	                      updateNodeData(nodeId, {
	                        loading: !0,
	                        errorMessage: `Suno 任务已完成，等待音频地址...`,
	                        resultData: resultText,
	                        remoteTaskId: taskId || void 0,
	                        clipId: clipId || void 0
	                      }),
	                      data.updateGlobalTasks?.((items) => items.map((item: any) => item.id === itemId ? {
	                        ...item,
	                        type: `audio`,
	                        status: `running`,
	                        progress: Math.max(item.progress || 0, 98),
	                        customOutputType: `audio`,
	                        customResultData: resultText,
	                        remoteTaskId: taskId || item.remoteTaskId,
	                        clipId: clipId || item.clipId,
	                        errorMsg: `Suno 已完成，音频地址还未返回，稍后刷新会继续拉取`
	                      } : item)),
	                      !1
	                    );
	                  }
	                  (taskId && setWanJuanRemoteTaskId(taskId),
	                    clipId && setWanJuanClipId(clipId),
	                    updateNodeData(nodeId, statePatch),
	                    audioUrl && [300, 1200, 2600].forEach((delay) => window.setTimeout(() => updateNodeData(nodeId, statePatch), delay)),
	                    data.updateGlobalTasks?.((items) => items.map((item: any) => item.id === itemId ? {
	                      ...item,
	                      type: `audio`,
	                      status: `completed`,
	                      progress: 100,
	                      customOutputType: `audio`,
	                      customResultData: resultText,
	                      remoteTaskId: taskId || item.remoteTaskId,
	                      resultUrl: audioUrl || item.resultUrl
	                    } : item)),
                    audioUrl && data.addTransitResource?.(audioUrl, `audio`, `${title || taskLabel || `suno`}.mp3`),
                    data.onShowToast?.(audioUrl ? `Suno 音频已就绪` : `${taskLabel} 查询完成`));
                  return !0;
                },
                wanJuanSunoReadJson = async (response) => {
                  let responseText = await response.text().catch(() => ``);
                  try {
                    return responseText ? JSON.parse(responseText) : {};
                  } catch {
                    return responseText;
                  }
                },
                wanJuanSunoThrowIfBad = async (response, fallbackMessage) => {
                  if (response.ok) return;
                  let errorData = await wanJuanSunoReadJson(response),
                    errorMessage = errorData?.error?.message || errorData?.message || (typeof errorData == `string` ? errorData : JSON.stringify(errorData));
                  throw Error(errorMessage || fallbackMessage || `Suno 请求失败`);
                },
                wanJuanSunoPost = async (path, body) => {
                  let response = await fetch(WanJuanTtsMusicApiUrl(wanJuanAudioApiUrl, path), {
                    method: `POST`,
                    headers: WanJuanSunoHeaders(wanJuanAudioApiKey, !0),
                    body: JSON.stringify(body)
                  });
                  return (await wanJuanSunoThrowIfBad(response, `Suno 请求失败`), wanJuanSunoReadJson(response));
                },
                wanJuanSunoGet = async (path) => {
                  let response = await fetch(WanJuanTtsMusicApiUrl(wanJuanAudioApiUrl, path), {
                    method: `GET`,
                    headers: WanJuanSunoHeaders(wanJuanAudioApiKey, !1)
                  });
                  return (await wanJuanSunoThrowIfBad(response, `Suno 请求失败`), wanJuanSunoReadJson(response));
                },
	                wanJuanPollSunoTask = async (taskId, taskLabel, options: any = {}) => {
	                  let expectAudio = options.expectAudio !== !1;
	                  if (!taskId) throw Error(`Suno 未返回任务ID`);
	                  (setWanJuanRemoteTaskId(taskId),
	                    updateNodeData(nodeId, {
	                      remoteTaskId: taskId,
	                      errorMessage: `Suno 任务已提交，正在查询...`
                    }));
                  let taskResult = null;
                  for (let attempt = 0; attempt < 80; attempt++) {
                    await new Promise((resolve: any) => setTimeout(resolve, attempt === 0 ? 1500 : 5000));
                    try {
                      taskResult = await wanJuanSunoGet(`/suno/fetch/${encodeURIComponent(taskId)}`);
                    } catch {
                      continue;
                    }
	                    let audioUrl = WanJuanTtsMusicExtractAudio(taskResult),
	                      isFailed = WanJuanSunoTaskFailed(taskResult),
	                      isSuccess = WanJuanSunoTaskSucceeded(taskResult);
	                    if (isFailed) throw Error(taskResult?.data?.fail_reason || taskResult?.fail_reason || taskResult?.message || `Suno 任务失败`);
	                    if (audioUrl || (isSuccess && !expectAudio)) {
	                      wanJuanSunoFinish(taskResult, taskLabel, {
	                        requireAudio: expectAudio
	                      });
	                      return;
	                    }
                    data.updateGlobalTasks?.((items) => items.map((item: any) => item.id === itemId ? {
                      ...item,
                      status: `running`,
                      progress: isSuccess ? Math.max(item.progress || 0, 98) : Math.min(95, 5 + attempt * 2),
                      errorMsg: isSuccess ? `Suno 已完成，等待音频地址返回...` : item.errorMsg
                    } : item));
                    isSuccess &&
                      updateNodeData(nodeId, {
                        loading: !0,
                        errorMessage: `Suno 任务已完成，等待音频地址...`,
                        resultData: typeof taskResult == `string` ? taskResult : JSON.stringify(taskResult, null, 2),
                        remoteTaskId: WanJuanTtsMusicExtractTaskId(taskResult) || taskId,
                        clipId: WanJuanTtsMusicExtractClipId(taskResult) || void 0
                      });
                  }
                  throw Error(`Suno 查询超时，请稍后用任务ID手动查询：${taskId}`);
                };
              if (wanJuanMusicAction === `song`) {
                let response = await wanJuanSunoPost(`/suno/submit/music`, {
                    prompt: inputText,
                    mv: String(wanJuanSunoMv || ``).trim() || `chirp-v3-5`,
                    title: title || `AI Music`,
                    tags: tags || ``,
                    make_instrumental: !!instrumental,
                    ...wanJuanSunoExtraParams
                  }),
                  taskId = WanJuanTtsMusicExtractTaskId(response);
                await wanJuanPollSunoTask(taskId, `Suno 歌曲`, {
                  expectAudio: !0
                });
              } else if (wanJuanMusicAction === `lyrics_to_song`) {
                let response = await wanJuanSunoPost(`/suno/submit/music`, {
                    prompt: inputText,
                    mv: String(wanJuanSunoMv || ``).trim() || `chirp-v3-5`,
                    title: title || `AI Music`,
                    tags: tags || ``,
                    make_instrumental: !!instrumental,
                    ...wanJuanSunoExtraParams
                  }),
                  taskId = WanJuanTtsMusicExtractTaskId(response);
                await wanJuanPollSunoTask(taskId, `Suno 歌词成歌`, {
                  expectAudio: !0
                });
              } else if (wanJuanMusicAction === `lyrics`) {
                let response = await wanJuanSunoPost(`/suno/submit/lyrics`, {
                    prompt: inputText,
                    ...wanJuanSunoExtraParams
                  }),
                  taskId = WanJuanTtsMusicExtractTaskId(response);
                taskId ? await wanJuanPollSunoTask(taskId, `Suno 歌词`, {
                  expectAudio: !1
                }) : wanJuanSunoFinish(response, `Suno 歌词`, {
                  requireAudio: !1
                });
              } else if (wanJuanMusicAction === `concat`) {
                let response = await wanJuanSunoPost(`/suno/submit/concat`, {
                    clip_id: wanJuanClipId.trim() || wanJuanUpstreamSunoRef.clipId,
                    is_infill: !!wanJuanSunoIsInfill,
                    ...wanJuanSunoExtraParams
                  }),
                  taskId = WanJuanTtsMusicExtractTaskId(response);
                await wanJuanPollSunoTask(taskId, `Suno 拼接`, {
                  expectAudio: !0
                });
              } else if (wanJuanMusicAction === `single`) {
                let response = await wanJuanSunoGet(`/suno/fetch/${encodeURIComponent(wanJuanRemoteTaskId.trim())}`);
                wanJuanSunoFinish(response, `Suno 单任务`, {
                  requireAudio: wanJuanEffectiveSunoModel !== `suno_lyrics`
                });
              } else if (wanJuanMusicAction === `batch`) {
                let taskIds = WanJuanTtsMusicExtractTaskIds(wanJuanBatchIds),
                  response = await wanJuanSunoPost(`/suno/fetch`, {
                    ids: taskIds,
                    ...wanJuanSunoExtraParams
                  });
                wanJuanSunoFinish(response, `Suno 批量任务`, {
                  requireAudio: wanJuanEffectiveSunoModel !== `suno_lyrics`
                });
              } else if (wanJuanMusicAction === `wav`) {
                let response = await wanJuanSunoGet(`/suno/act/wav/${encodeURIComponent(wanJuanClipId.trim())}`);
                wanJuanSunoFinish(response, `Suno WAV`, {
                  requireAudio: !0
                });
              }
            }
          } catch (error) {
            (updateNodeData(nodeId, {
                loading: !1,
                errorMessage: error.message || `生成失败`
              }),
              data.updateGlobalTasks?.((items) => items.map((item: any) => item.id === itemId ? {
                ...item,
                status: `failed`,
                errorMsg: error.message || `生成失败`
              } : item)));
          }
        };
      useEffect(() => {
        if (mode !== `suno` || !wanJuanRemoteTaskId || data.audioUrl) return;
        let cancelled = !1;
        const recoverSubmittedSunoTask = async () => {
          let wanJuanAudioConfigs = Array.isArray(data.apiConfigs) ? data.apiConfigs : [],
            wanJuanBoundAudioConfigId = resolveModelApiBindingIdHelper(data.audioModelApiBindings, wanJuanEffectiveSunoModel, ``),
            wanJuanUsableAudioConfigs = wanJuanAudioConfigs.filter((item: any) => item?.url && item?.key),
            wanJuanDefaultAudioConfig = wanJuanUsableAudioConfigs.find((item: any) => /zhichuang|智创|聚合|suno|lconai/i.test(`${item?.id || ``} ${item?.name || ``} ${item?.url || ``}`)) || wanJuanUsableAudioConfigs.find((item: any) => item?.id === `default`) || wanJuanUsableAudioConfigs[0] || wanJuanAudioConfigs.find((item: any) => item?.id === `default`) || wanJuanAudioConfigs[0] || null,
            wanJuanBoundAudioConfig = wanJuanBoundAudioConfigId && wanJuanAudioConfigs.length ? wanJuanAudioConfigs.find((config) => config.id === wanJuanBoundAudioConfigId) : null,
            wanJuanAudioApiUrl = wanJuanBoundAudioConfig?.url || data.audioApiUrl || wanJuanDefaultAudioConfig?.url,
            wanJuanAudioApiKey = wanJuanBoundAudioConfig?.key || data.audioApiKey || wanJuanDefaultAudioConfig?.key;
          if (!wanJuanAudioApiUrl || !wanJuanAudioApiKey) return;
          let taskId = data.taskId || `tts-music-recover-${nodeId}-${Date.now()}`;
          updateNodeData(nodeId, {
            loading: !0,
            taskId,
            errorMessage: `Suno 任务已提交，正在查询...`
          });
          data.updateGlobalTasks?.((tasks) => {
            let list = Array.isArray(tasks) ? tasks : [];
            return list.some((item: any) => item.id === taskId) ? list.map((item: any) => item.id === taskId ? {
              ...item,
              type: `audio`,
              status: item.status === `completed` ? item.status : `running`,
              customOutputType: `audio`
            } : item) : [...list, {
              id: taskId,
              type: `audio`,
              projectId: data.projectId,
              nodeId: nodeId,
              status: `running`,
              progress: 0,
              createdAt: Date.now(),
              prompt: (prompt || title || `Suno 音乐任务`).slice(0, 120),
              customOutputType: `audio`,
              provider: `suno`,
              modelName: wanJuanEffectiveSunoModel,
              apiConfigId: wanJuanBoundAudioConfig?.id || wanJuanDefaultAudioConfig?.id || ``,
              apiBaseUrl: wanJuanAudioApiUrl,
              requestProfile: {
                requestType: `suno-music`,
                pollPath: `/suno/fetch/{taskId}`
              },
              remoteTaskId: wanJuanRemoteTaskId
            }];
          });
          let lastPayload = null;
          try {
            for (let index = 0; index < 80 && !cancelled; index++) {
              await new Promise((resolve: any) => setTimeout(resolve, index === 0 ? 800 : 5000));
              let response = await fetch(WanJuanTtsMusicApiUrl(wanJuanAudioApiUrl, `/suno/fetch/${encodeURIComponent(wanJuanRemoteTaskId)}`), {
                method: `GET`,
                headers: WanJuanSunoHeaders(wanJuanAudioApiKey, !1)
              });
              if (!response.ok) continue;
              let text = await response.text().catch(() => ``), payload;
              try {
                payload = text ? JSON.parse(text) : {};
              } catch {
                payload = text;
              }
              lastPayload = payload;
              let audio = WanJuanTtsMusicExtractAudio(payload),
                taskIdFromPayload = WanJuanTtsMusicExtractTaskId(payload) || wanJuanRemoteTaskId,
                clipIdFromPayload = WanJuanTtsMusicExtractClipId(payload) || wanJuanClipId,
                failed = WanJuanSunoTaskFailed(payload),
                completed = WanJuanSunoTaskSucceeded(payload);
              if (failed) throw Error(payload?.data?.fail_reason || payload?.fail_reason || payload?.message || `Suno 任务失败`);
              data.updateGlobalTasks?.((tasks) => (Array.isArray(tasks) ? tasks : []).map((item: any) => item.id === taskId ? {
                ...item,
                type: `audio`,
                status: `running`,
                progress: completed && !audio ? Math.max(item.progress || 0, 98) : Math.min(95, 10 + index * 2),
                customOutputType: `audio`,
                remoteTaskId: taskIdFromPayload,
                clipId: clipIdFromPayload || item.clipId,
                errorMsg: completed && !audio ? `Suno 已完成，等待音频地址返回...` : item.errorMsg
              } : item));
              if (completed && !audio) {
                updateNodeData(nodeId, {
                  loading: !0,
                  errorMessage: `Suno 任务已完成，等待音频地址...`,
                  resultData: typeof payload == `string` ? payload : JSON.stringify(payload, null, 2),
                  remoteTaskId: taskIdFromPayload || void 0,
                  clipId: clipIdFromPayload || void 0
                });
                continue;
              }
              if (audio) {
                let resultData = typeof payload == `string` ? payload : JSON.stringify(payload, null, 2),
                  audioName = audio ? `${title || `Suno 音乐`}.mp3` : data.audioName;
                if (cancelled) return;
                updateNodeData(nodeId, {
                  loading: !1,
                  errorMessage: void 0,
                  audioUrl: audio || data.audioUrl,
                  audioName,
                  resultData,
                  text: audio || resultData,
                  remoteTaskId: taskIdFromPayload || void 0,
                  clipId: clipIdFromPayload || void 0
                });
                taskIdFromPayload && setWanJuanRemoteTaskId(taskIdFromPayload);
                clipIdFromPayload && setWanJuanClipId(clipIdFromPayload);
                data.updateGlobalTasks?.((tasks) => (Array.isArray(tasks) ? tasks : []).map((item: any) => item.id === taskId ? {
                  ...item,
                  type: `audio`,
                  status: `completed`,
                  progress: 100,
                  customOutputType: `audio`,
                  customResultData: resultData,
                  remoteTaskId: taskIdFromPayload,
                  resultUrl: audio || item.resultUrl
                } : item));
                audio && data.addTransitResource?.(audio, `audio`, audioName || `Suno 音乐.mp3`);
                data.onShowToast?.(audio ? `Suno 音频已就绪` : `Suno 任务查询完成`);
                return;
              }
            }
            if (!cancelled) throw Error(`Suno 查询超时，请稍后在任务清单刷新：${wanJuanRemoteTaskId}`);
          } catch (error) {
            if (cancelled) return;
            updateNodeData(nodeId, {
              loading: !1,
              errorMessage: error.message || `Suno 查询失败`,
              resultData: lastPayload ? JSON.stringify(lastPayload, null, 2) : data.resultData
            });
            data.updateGlobalTasks?.((tasks) => (Array.isArray(tasks) ? tasks : []).map((item: any) => item.id === taskId ? {
              ...item,
              type: `audio`,
              status: `failed`,
              errorMsg: error.message || `Suno 查询失败`
            } : item));
          }
        };
        recoverSubmittedSunoTask();
        return () => {
          cancelled = !0;
        };
      }, [nodeId, updateNodeData, mode, wanJuanRemoteTaskId, wanJuanEffectiveSunoModel, wanJuanClipId, title, prompt, data.audioUrl, data.loading, data.audioApiUrl, data.audioApiKey, data.taskId]);

      useEffect(() => {
        wanJuanApplyPreferredTtsModel();
        wanJuanApplyPreferredMusicModel();
      }, [
        wanJuanTtsMusicModels.join(`\n`),
        wanJuanMusicModels.join(`\n`),
        ttsModel,
        sunoModel,
        nodeData.wanjuanTtsModelAuto,
        nodeData.wanjuanTtsModelManual,
        nodeData.wanjuanMusicModelAuto,
        nodeData.wanjuanMusicModelManual,
        favoriteModels.favorites,
        nodeId,
        updateNodeData,
      ]);

      useEffect(() => {
        updateNodeData(nodeId, {
          onGenerateTtsMusic: runWanJuanTtsMusic
        });
      }, [nodeId, updateNodeData, mode, prompt, ttsModel, voice, wanJuanTtsFormat, wanJuanTtsSpeed, wanJuanTtsInstructions, wanJuanTtsReferenceAudioUrl, wanJuanTtsExtraJson, sunoModel, wanJuanSunoMv, title, tags, instrumental, wanJuanMusicAction, wanJuanRemoteTaskId, wanJuanClipId, wanJuanBatchIds, wanJuanSunoExtraJson, wanJuanSunoIsInfill, data.audioApiUrl, data.audioApiKey]);
      return jsxs(`div`, {
        className: `flex flex-col group/node transition-all w-[380px] wanjuan-tts-node ${selected ? `z-50` : `z-10`}`,
        children: [jsxs(`div`, {
          className: `relative bg-[#1c1c1c] rounded-xl overflow-visible border shadow-xl transition-all flex flex-col wanjuan-tts-node-frame ${data.loading ? `wanjuan-loading-node-frame` : ``} ${selected ? `border-blue-500 shadow-blue-500/20 wanjuan-tts-node-frame-selected` : `border-[#333] hover:border-gray-500`}`,
          children: [jsx(WanJuanNodeHandle, {
            type: `target`,
            position: Position.Left
          }), jsx(WanJuanNodeHandle, {
            type: `source`,
            position: Position.Right
          }), jsxs(`div`, {
            className: `flex justify-between items-center px-3 py-2 bg-[#222] border-b border-[#2a2a2a] drag-handle cursor-move rounded-t-xl wanjuan-tts-node-header`,
            children: [jsxs(`div`, {
              className: `flex items-center gap-2 text-xs font-bold text-gray-200`,
              children: [jsx(`span`, {
                className: wanJuanIsMusicNode ? `text-yellow-400` : `text-green-400`,
                children: wanJuanIsMusicNode ? `♫` : `🎙️`
              }), wanJuanNodeTitle]
            }), data.loading && jsx(RefreshCw, {
              size: 14,
              className: `animate-spin text-blue-400`
            })]
          }), jsxs(`div`, {
            className: `p-3 bg-[#1a1a1a] flex flex-col gap-3 nodrag rounded-b-xl wanjuan-tts-node-body`,
            onClick: (event) => event.stopPropagation(),
            children: [jsxs(`div`, {
              className: `grid grid-cols-2 gap-2`,
              children: wanJuanIsMusicNode ? [jsx(`button`, {
                className: `col-span-2 px-2 py-1.5 rounded text-xs wanjuan-tts-node-mode-button bg-blue-600 text-white wanjuan-tts-node-mode-button-active`,
                onClick: () => setMode(`suno`),
                children: `音乐/Suno`
              })] : [jsx(`button`, {
                className: `col-span-2 px-2 py-1.5 rounded text-xs wanjuan-tts-node-mode-button ${mode === `tts` ? `bg-blue-600 text-white wanjuan-tts-node-mode-button-active` : `bg-[#2a2a2a] text-gray-300 hover:bg-[#333]`}`,
                onClick: () => setMode(`tts`),
                children: `配音/TTS`
              })]
            }), jsx(`textarea`, {
              className: `w-full h-24 bg-[#111] border border-[#333] rounded p-2 text-xs text-gray-200 outline-none focus:border-blue-500 resize-none relative z-0 wanjuan-tts-node-field`,
              value: prompt,
              onChange: (event) => setPrompt(event.target.value),
              placeholder: mode === `tts` ? `输入要朗读的文本，或连接文本节点` : `输入歌词/音乐描述，或连接文本节点`
            }), mode === `tts` ? jsxs(Fragment, {
              children: [jsxs(`div`, {
                className: `grid grid-cols-2 gap-2`,
                children: [jsxs(`div`, {
                  className: `relative ${wanJuanTtsModelOpen ? `z-[1000000]` : `z-10`}`,
                  children: [jsx(`button`, {
                    className: `w-full bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none text-left truncate hover:border-[#555] relative z-0 wanjuan-tts-node-field`,
                    onClick: (event) => {
                      (event.stopPropagation(), setWanJuanTtsModelOpen(!wanJuanTtsModelOpen));
                    },
                    title: ttsModel,
                    children: ttsModel || `选择模型`
                  }), wanJuanTtsModelOpen && jsxs(`div`, {
                    className: `absolute bottom-full left-0 mb-1 bg-[#222] border border-[#333] rounded-lg shadow-2xl p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar nopan`,
                    style: {
                      width: 320,
                      maxWidth: `calc(100vw - 32px)`,
                      maxHeight: 150,
                      position: `absolute`,
                      zIndex: 2147483647,
                      background: `#222`,
                      backgroundColor: `#222`,
                      backgroundClip: `padding-box`,
                      isolation: `isolate`,
                      transform: `translateZ(0)`,
                      contain: `layout paint`,
                      pointerEvents: `auto`,
                      boxShadow: `0 18px 48px rgba(0,0,0,0.46)`,
                      overflowY: `auto`,
                      overflowX: `hidden`,
                      scrollbarGutter: `stable`,
                      overscrollBehavior: `contain`,
                    },
                    onClick: (event) => event.stopPropagation(),
                    onWheel: (event) => event.stopPropagation(),
                    children: [jsx(`div`, {
                      className: `text-[10px] text-gray-500 mb-1 px-1`,
                      children: `音频模型`
                    }), ...favoriteModels.sortModels(wanJuanTtsMusicModelsForDropdown).map((model) => jsxs(`button`, {
                      className: `wanjuan-node-model-option text-left px-2 py-2 text-[12px] rounded-md transition-colors flex items-center gap-2 ${ttsModel === model ? `wanjuan-node-model-option-active bg-blue-600 text-white` : `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                      style: {
                        width: `100%`,
                        minHeight: 38,
                        lineHeight: `18px`,
	                        whiteSpace: `normal`,
	                        wordBreak: `break-word`,
	                        overflowWrap: `anywhere`,
	                        boxSizing: `border-box`,
	                        border: ttsModel === model ? `1px solid currentColor` : `1px solid transparent`,
	                      },
                      onClick: () => {
                        (setTtsModel(model),
                          updateNodeData(nodeId, {
                            ttsModel: model,
                            wanjuanTtsModelAuto: !1,
                            wanjuanTtsModelManual: !0
                          }),
                          (wanJuanTtsModelManualRef.current = !0),
                          setWanJuanTtsModelOpen(!1));
                      },
                      title: model,
                      children: [jsx(`span`, {
                        className: `flex-1 min-w-0 break-words`,
                        children: model
                      }), jsx(`span`, {
                        className: `wanjuan-model-favorite-star flex-shrink-0 text-base leading-none ${favoriteModels.isFavorite(model) ? `wanjuan-model-favorite-star-active` : ``}`,
                        onClick: (event) => {
                          (event.stopPropagation(),
                            wanJuanApplyPreferredTtsModel(favoriteModels.toggleFavorite(model)));
                        },
                        title: favoriteModels.isFavorite(model) ? `取消收藏` : `收藏并置顶`,
                        children: favoriteModels.isFavorite(model) ? `★` : `☆`
                      })]
                    }, model))]
                  })]
                }), jsx(`input`, {
                  className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                  value: voice,
                  onChange: (event) => setVoice(event.target.value),
                  placeholder: `voice，如 alloy`
                })]
              }), jsxs(`div`, {
                className: `grid grid-cols-2 gap-2`,
                children: [jsx(`input`, {
                  className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                  value: wanJuanTtsFormat,
                  onChange: (event) => setWanJuanTtsFormat(event.target.value),
                  placeholder: `mp3 / wav`
                }), jsx(`input`, {
                  type: `number`,
                  step: `0.1`,
                  min: `0.25`,
                  max: `4`,
                  className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                  value: wanJuanTtsSpeed,
                  onChange: (event) => setWanJuanTtsSpeed(event.target.value),
                  placeholder: `speed`
                })]
              }), jsx(`input`, {
                className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                value: wanJuanTtsReferenceAudioUrl,
                onChange: (event) => setWanJuanTtsReferenceAudioUrl(event.target.value),
                placeholder: `参考音频 URL（用于支持音色克隆的模型；也可连接音频节点）`
              }), jsx(`textarea`, {
                className: `w-full h-14 bg-[#111] border border-[#333] rounded p-2 text-xs text-gray-200 outline-none focus:border-blue-500 resize-none relative z-0 wanjuan-tts-node-field`,
                value: wanJuanTtsInstructions,
                onChange: (event) => setWanJuanTtsInstructions(event.target.value),
                placeholder: `instructions，可选`
              }), jsx(`textarea`, {
                className: `w-full h-16 bg-[#111] border border-[#333] rounded p-2 text-xs text-gray-200 outline-none focus:border-blue-500 resize-none font-mono relative z-0 wanjuan-tts-node-field`,
                value: wanJuanTtsExtraJson,
                onChange: (event) => setWanJuanTtsExtraJson(event.target.value),
                placeholder: `额外 JSON 参数，例如 {"speaker":"xxx"}`
              })]
            }) : jsxs(Fragment, {
              children: [jsxs(`div`, {
                className: `flex flex-col gap-1`,
                children: [jsx(`div`, {
                  className: `text-[10px] text-gray-500 px-0.5`,
                  children: `创作方式`
                }), jsx(`div`, {
                  className: `grid grid-cols-4 gap-1.5`,
                  children: [{
                    id: `song`,
                    label: `描述成歌`
                  }, {
                    id: `lyrics_to_song`,
                    label: `歌词成歌`
                  }, {
                    id: `lyrics`,
                    label: `生成歌词`
                  }, {
                    id: `concat`,
                    label: `歌曲拼接`
                  }].map((action) => jsx(`button`, {
                    type: `button`,
                    className: `px-2 py-1.5 rounded text-[11px] transition-colors wanjuan-tts-node-mode-button ${wanJuanMusicAction === action.id ? `bg-blue-600 text-white wanjuan-tts-node-mode-button-active` : `bg-[#2a2a2a] text-gray-300 hover:bg-[#333]`}`,
                    onClick: () => setWanJuanMusicAction(action.id),
                    children: action.label
                  }, action.id))
                })]
              }), jsxs(`div`, {
                className: `flex flex-col gap-1`,
                children: [jsx(`div`, {
                  className: `text-[10px] text-gray-500 px-0.5`,
                  children: `中转模型`
                }), jsxs(`div`, {
                  className: `relative ${wanJuanMusicModelOpen ? `z-[1000000]` : `z-10`}`,
                  children: [jsx(`button`, {
                    className: `w-full bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none text-left truncate hover:border-[#555] relative z-0 wanjuan-tts-node-field`,
                    onClick: (event) => {
                      (event.stopPropagation(), setWanJuanMusicModelOpen(!wanJuanMusicModelOpen));
                    },
                    title: `中转模型：${wanJuanEffectiveSunoModel}；Suno版本：${wanJuanSunoMv || `chirp-v3-5`}`,
                    children: wanJuanEffectiveSunoModel
                  }), wanJuanMusicModelOpen && jsxs(`div`, {
                    className: `absolute bottom-full left-0 mb-1 bg-[#222] border border-[#333] rounded-lg shadow-2xl p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar nopan`,
                    style: {
                      width: 320,
                      maxWidth: `calc(100vw - 32px)`,
                      maxHeight: 150,
                      position: `absolute`,
                      zIndex: 2147483647,
                      background: `#222`,
                      backgroundColor: `#222`,
                      backgroundClip: `padding-box`,
                      isolation: `isolate`,
                      transform: `translateZ(0)`,
                      contain: `layout paint`,
                      pointerEvents: `auto`,
                      boxShadow: `0 18px 48px rgba(0,0,0,0.46)`,
                      overflowY: `auto`,
                      overflowX: `hidden`,
                      scrollbarGutter: `stable`,
                      overscrollBehavior: `contain`,
                    },
                    onClick: (event) => event.stopPropagation(),
                    onWheel: (event) => event.stopPropagation(),
                    children: [jsx(`div`, {
                      className: `text-[10px] text-gray-500 mb-1 px-1`,
                      children: `中转模型`
                    }), ...favoriteModels.sortModels(wanJuanMusicModels).map((model) => jsxs(`button`, {
                      className: `wanjuan-node-model-option text-left px-2 py-2 text-[12px] rounded-md transition-colors flex items-center gap-2 ${wanJuanEffectiveSunoModel === model ? `wanjuan-node-model-option-active bg-blue-600 text-white` : `text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200`}`,
                      style: {
                        width: `100%`,
                        minHeight: 38,
                        lineHeight: `18px`,
                        whiteSpace: `normal`,
                        wordBreak: `break-word`,
                        overflowWrap: `anywhere`,
                        boxSizing: `border-box`,
                        border: wanJuanEffectiveSunoModel === model ? `1px solid currentColor` : `1px solid transparent`,
                      },
                      onClick: () => {
                        (_(model),
                          updateNodeData(nodeId, {
                            sunoModel: model,
                            wanjuanMusicModelAuto: !1,
                            wanjuanMusicModelManual: !0
                          }),
                          (wanJuanMusicModelManualRef.current = !0),
                          setWanJuanMusicModelOpen(!1));
                      },
                      title: model,
                      children: [jsx(`span`, {
                        className: `flex-1 min-w-0 break-words`,
                        children: model
                      }), jsx(`span`, {
                        className: `wanjuan-model-favorite-star flex-shrink-0 text-base leading-none ${favoriteModels.isFavorite(model) ? `wanjuan-model-favorite-star-active` : ``}`,
                        onClick: (event) => {
                          (event.stopPropagation(),
                            wanJuanApplyPreferredMusicModel(favoriteModels.toggleFavorite(model)));
                        },
                        title: favoriteModels.isFavorite(model) ? `取消收藏` : `收藏并置顶`,
                        children: favoriteModels.isFavorite(model) ? `★` : `☆`
                      })]
                    }, model))]
                  })]
                })]
              }), [`song`, `lyrics_to_song`].includes(wanJuanMusicAction) && jsxs(`div`, {
                className: `flex flex-col gap-1`,
                children: [jsx(`div`, {
                  className: `text-[10px] text-gray-500 px-0.5`,
                  children: `Suno版本（mv）`
                }), jsx(`input`, {
                  className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                  value: wanJuanSunoMv,
                  onChange: (event) => setWanJuanSunoMv(event.target.value),
                  placeholder: `chirp-v3-5`
                })]
              }), [`song`, `lyrics_to_song`].includes(wanJuanMusicAction) && jsxs(`div`, {
                className: `grid grid-cols-2 gap-2`,
                children: [jsxs(`div`, {
                  className: `flex flex-col gap-1`,
                  children: [jsx(`div`, {
                    className: `text-[10px] text-gray-500 px-0.5`,
                    children: `歌曲标题`
                  }), jsx(`input`, {
                    className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                    value: title,
                    onChange: (event) => setTitle(event.target.value),
                    placeholder: `AI Music`
                  })]
                }), jsxs(`div`, {
                  className: `flex flex-col gap-1`,
                  children: [jsx(`div`, {
                    className: `text-[10px] text-gray-500 px-0.5`,
                    children: `风格标签`
                  }), jsx(`input`, {
                    className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                    value: tags,
                    onChange: (event) => setTags(event.target.value),
                    placeholder: `pop, piano`
                  })]
                })]
              }), [`song`, `lyrics_to_song`].includes(wanJuanMusicAction) && jsxs(`label`, {
                className: `flex items-center gap-2 text-xs text-gray-300`,
                children: [jsx(`input`, {
                  type: `checkbox`,
                  checked: instrumental,
                  onChange: (event) => setWanJuanTtsMusicInstrumental(event.target.checked)
                }), `纯音乐`]
              }), wanJuanMusicAction === `concat` && jsx(`input`, {
                className: `bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none relative z-0 wanjuan-tts-node-field`,
                value: wanJuanClipId,
                onChange: (event) => setWanJuanClipId(event.target.value),
                placeholder: `上游音乐结果会自动回填 clip_id，也可以手动填写`
              }), jsx(`textarea`, {
                className: `w-full h-14 bg-[#111] border border-[#333] rounded p-2 text-xs text-gray-200 outline-none focus:border-blue-500 resize-none font-mono relative z-0 wanjuan-tts-node-field`,
                value: wanJuanSunoExtraJson,
                onChange: (event) => setWanJuanSunoExtraJson(event.target.value),
                placeholder: `高级参数 JSON，可选`
              })]
            }), data.errorMessage && jsxs(`div`, {
              className: `text-red-400 text-[10px] p-2 border border-red-500/30 rounded bg-red-500/10 flex items-start gap-1.5`,
              children: [jsx(CircleAlert, {
                size: 12,
                className: `mt-0.5 flex-shrink-0`
              }), jsx(`span`, {
                className: `break-all leading-tight`,
                children: data.errorMessage
              })]
            }), data.audioUrl && jsxs(`div`, {
              className: `bg-[#111] border border-[#333] rounded p-2 flex flex-col gap-2 wanjuan-tts-node-subpanel`,
              children: [jsx(`audio`, {
                src: data.audioUrl,
                controls: !0,
                className: `w-full h-8 outline-none nodrag`
              }), jsx(`button`, {
                className: `text-[10px] text-gray-400 hover:text-white text-left truncate`,
                onClick: () => navigator.clipboard.writeText(data.audioUrl),
                title: data.audioUrl,
                children: data.audioName || data.audioUrl
              })]
            }), jsxs(`div`, {
              className: `flex justify-between items-center wanjuan-tts-node-footer`,
              children: [jsx(`button`, {
                className: `p-1.5 rounded flex items-center gap-1 text-gray-400 hover:bg-[#333] wanjuan-tts-node-icon-button`,
                onClick: () => setWanJuanTtsMusicHelp(!showHelp),
                title: `参数提示`,
                children: jsx(Settings2, {
                  size: 14
                })
              }), !wanJuanIsMusicNode && jsx(`button`, {
                className: `px-3 py-1.5 rounded-full text-xs bg-[#2a2a2a] text-gray-300 hover:bg-[#333] transition-all`,
                onClick: () => updateNodeData(nodeId, {
                  audioMode: `transcribe`,
                  mode: `transcribe`
                }),
                children: `转写`
              }), jsxs(`button`, {
                className: `px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all wanjuan-tts-node-run-button ${data.loading ? `bg-blue-600/50 text-white cursor-wait` : `bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20`}`,
                onClick: runWanJuanTtsMusic,
                disabled: data.loading,
                children: [data.loading ? jsx(RefreshCw, {
                  size: 12,
                  className: `animate-spin`
                }) : jsx(CirclePlay, {
                  size: 12
                }), data.loading ? `生成中...` : `生成`]
              })]
            }), showHelp && jsx(`div`, {
              className: `text-[10px] text-gray-500 leading-relaxed bg-[#111] border border-[#333] rounded p-2 wanjuan-tts-node-subpanel`,
              children: mode === `tts` ? `音频配音使用 /v1/audio/speech；参考音频 URL 可用于音色克隆类模型。` : `中转模型选择智创聚合能力标识；Suno版本（mv）决定生成版本，例如 chirp-v3-5。`
            })]
          })]
        })]
      });
    });
export const WanJuanAudioNode = reactMemo(({
      id: nodeId,
      data: nodeData,
      selected: selected
    }: any) => {
      let {
        updateNodeData: updateNodeData,
        getNodes: getNodes,
        getEdges: getEdges
      } = useReactFlow(),
        data = nodeData,
        fileInputRef = useRef(null),
        [audioFile, setAudioFile] = useState(null),
        [showSettings, setShowSettings] = useState(!1),
        [prompt, setPrompt] = useState(nodeData.prompt || `请输出简体中文。`),
        [maxDuration, setMaxDuration] = useState(nodeData.maxDuration || 10),
        [_, setPauseGap] = useState(nodeData.pauseGap || 0.3);
      useEffect(() => {
        updateNodeData(nodeId, {
          prompt: prompt,
          maxDuration: maxDuration,
          pauseGap: _
        });
      }, [prompt, maxDuration, _, nodeId, updateNodeData]);
      let sourceNodes = useNodesData(useNodeConnections({
          handleType: `target`
        }).map((connection) => connection.source)),
        lastUrlRef = useRef(``);
      (useEffect(() => {
          if (audioFile) return;
          let connectedNodes = Array.isArray(sourceNodes) ? sourceNodes : sourceNodes ? [sourceNodes] : [],
            connectedUrl = ``;
          for (let sourceNode of connectedNodes)
            if (sourceNode?.data) {
              if (sourceNode.data.videoUrl && typeof sourceNode.data.videoUrl == `string`) {
                let videoUrl = sourceNode.data.videoUrl;
                if (
                  videoUrl.startsWith(`data:audio/`) ||
                  videoUrl.startsWith(`data:video/`) ||
                  /\.(mp3|wav|ogg|m4a|mp4|webm|mov)($|\?)/i.test(videoUrl)
                ) {
                  connectedUrl = videoUrl;
                  break;
                }
              }
              if (sourceNode.data.imageUrl && typeof sourceNode.data.imageUrl == `string`) {
                let imageUrl = sourceNode.data.imageUrl;
                if (
                  imageUrl.startsWith(`data:audio/`) ||
                  imageUrl.startsWith(`data:video/`) ||
                  /\.(mp3|wav|ogg|m4a|mp4|webm|mov)($|\?)/i.test(imageUrl)
                ) {
                  connectedUrl = imageUrl;
                  break;
                }
              }
              if (sourceNode.data.text && typeof sourceNode.data.text == `string`) {
                let urlMatch = sourceNode.data.text.match(
                  /(https?:\/\/[^\s"'`<>]+)|(data:(audio|video)\/[^\s"']+)/i,
                );
                if (urlMatch) {
                  connectedUrl = urlMatch[0];
                  break;
                }
              }
            }
          if (connectedUrl && connectedUrl !== lastUrlRef.current) {
            lastUrlRef.current = connectedUrl;
            let audioName = `connected_audio.mp3`;
            if (connectedUrl.startsWith(`data:audio/`)) audioName = `base64_audio.mp3`;
            else
              try {
                let parsedUrl = new URL(connectedUrl),
                  fileName = parsedUrl.pathname.split(`/`).pop();
                audioName =
                  fileName && fileName.length > 0 && fileName !== `/` && fileName.includes(`.`) ?
                  fileName + parsedUrl.search :
                  connectedUrl;
              } catch {
                audioName = connectedUrl;
              }
              ((data.audioUrl = connectedUrl),
                (data.audioName = audioName),
                setPrompt((e) => e),
                updateNodeData(nodeId, {
                  audioUrl: connectedUrl,
                  audioName: audioName,
                  errorMessage: void 0
                }));
          } else
            !connectedUrl &&
            lastUrlRef.current &&
            ((lastUrlRef.current = ``),
              audioFile || updateNodeData(nodeId, {
                audioUrl: void 0,
                audioName: void 0
              }));
        }, [sourceNodes, audioFile, nodeId, updateNodeData]),
        useEffect(() => {
          updateNodeData(nodeId, {
            onGenerateAudio: handleGenerateAudio
          });
        }, [audioFile, data.audioApiUrl, data.audioApiKey, data.audioModel, prompt, maxDuration, _]));
      let handleFileChange = (event) => {
          let file = event.target.files?.[0];
          if (!file) return;
          setAudioFile(file);
          let objectUrl = URL.createObjectURL(file);
          ((data.audioUrl = objectUrl),
            (data.audioName = file.name),
            setPrompt((e) => e),
            updateNodeData(nodeId, {
              audioUrl: objectUrl,
              audioName: file.name,
              errorMessage: void 0,
              chunks: void 0,
            }),
            (event.target.value = ``));
        },
        handleGenerateAudio = async () => {
          let selectedFile = audioFile;
          let audioTaskId = `audio-${nodeId}-${Date.now()}`;
          updateNodeData(nodeId, {
            taskId: audioTaskId,
            seedanceTaskId: void 0,
            loading: !0,
            errorMessage: void 0,
          });
          data.updateGlobalTasks?.((tasks) => [
            ...tasks,
            {
              id: audioTaskId,
              type: `audio`,
              projectId: data.projectId,
              nodeId: nodeId,
              status: `running`,
              progress: 0,
              createdAt: Date.now(),
              prompt: data.audioName || `音频任务`,
              customOutputType: `text`,
            },
          ]);
          if (!selectedFile) {
            let edges = getEdges(),
              nodes: any = getNodes(),
              incomingEdges = edges.filter((edge: any) => edge.target === nodeId),
              audioUrl = ``;
            for (let edge of incomingEdges) {
              let sourceNode = nodes.find((node: any) => node.id === edge.source);
              if (sourceNode) {
                if (sourceNode.data.audioUrl && typeof sourceNode.data.audioUrl == `string`) {
                  audioUrl = sourceNode.data.audioUrl;
                  break;
                }
                if (sourceNode.data.videoUrl && typeof sourceNode.data.videoUrl == `string`) {
                  let videoUrl = sourceNode.data.videoUrl;
                  if (
                    videoUrl.startsWith(`data:audio/`) ||
                    videoUrl.startsWith(`data:video/`) ||
                    /\.(mp3|wav|ogg|m4a|mp4|webm|mov)($|\?)/i.test(videoUrl)
                  ) {
                    audioUrl = videoUrl;
                    break;
                  }
                }
                if (sourceNode.data.imageUrl && typeof sourceNode.data.imageUrl == `string`) {
                  let imageUrl = sourceNode.data.imageUrl;
                  if (
                    imageUrl.startsWith(`data:audio/`) ||
                    imageUrl.startsWith(`data:video/`) ||
                    /\.(mp3|wav|ogg|m4a|mp4|webm|mov)($|\?)/i.test(imageUrl)
                  ) {
                    audioUrl = imageUrl;
                    break;
                  }
                }
                if (sourceNode.data.text && typeof sourceNode.data.text == `string`) {
                  let urlMatch = sourceNode.data.text.match(
                    /(https?:\/\/[^\s"'`<>]+)|(data:(audio|video)\/[^\s"']+)/i,
                  );
                  if (urlMatch) {
                    audioUrl = urlMatch[0];
                    break;
                  }
                }
              }
            }
            if (audioUrl) {
              updateNodeData(nodeId, {
                loading: !0,
                errorMessage: `正在下载音频...`
              });
              try {
                if (audioUrl.startsWith(`data:audio/`) || audioUrl.startsWith(`data:video/`)) {
                  let parts = audioUrl.split(`,`),
                    mimeMatch = parts[0].match(/:(.*?);/),
                    mimeType = mimeMatch ? mimeMatch[1] : `audio/mpeg`,
                    byteString = atob(parts[1]),
                    byteLength = byteString.length,
                    byteArray = new Uint8Array(byteLength);
                  for (; byteLength--;) byteArray[byteLength] = byteString.charCodeAt(byteLength);
                  let fileName = `media_generated.${mimeType.split(`/`)[1] || `mp3`}`;
                  ((selectedFile = new File([byteArray], fileName, {
                      type: mimeType
                    })),
                    updateNodeData(nodeId, {
                      audioUrl: URL.createObjectURL(selectedFile),
                      audioName: fileName
                    }));
                } else {
                  let response = await fetch(audioUrl);
                  if (!response.ok)
                    throw Error(`下载失败: ${response.status}`);
                  let blob = await response.blob(),
                    fileName = audioUrl.split(`/`).pop() || `audio.mp3`;
                  ((selectedFile = new File([blob], fileName, {
                      type: blob.type || `audio/mpeg`
                    })),
                    updateNodeData(nodeId, {
                      audioUrl: URL.createObjectURL(selectedFile),
                      audioName: fileName
                    }));
                }
              } catch (error) {
                (nodes.updateGlobalTasks?.((tasks) =>
                    tasks.map((task: any) =>
                      task.id === audioTaskId ?
                      {
                        ...task,
                        status: `failed`,
                        errorMsg: error.name === `AbortError` ?
                          `音频下载超时 (3分钟)` :
                          `音频下载失败: ${error.message}`,
                      } :
                      task,
                    ),
                  ),
                  updateNodeData(nodeId, {
                    loading: !1,
                    errorMessage: error.name === `AbortError` ?
                      `音频下载超时 (3分钟)` :
                      `音频下载失败: ${error.message}`,
                  }));
                return;
              }
            }
          }
          if (!selectedFile) {
            data.updateGlobalTasks?.((tasks) =>
              tasks.map((task: any) =>
                task.id === audioTaskId ?
                {
                  ...task,
                  status: `failed`,
                  errorMsg: `未找到音频文件或音频URL`
                } :
                task,
              ),
            );
            data.onShowToast?.(`请先上传音频文件或连接包含音频URL的节点`);
            updateNodeData(nodeId, {
              loading: !1,
              errorMessage: `未找到音频文件或音频URL`
            });
            return;
          }
		          let wanJuanAudioModelName = data.audioModel || ``,
		            wanJuanBoundAudioConfigId = resolveModelApiBindingIdHelper(data.audioModelApiBindings, wanJuanAudioModelName, ``),
		            wanJuanBoundAudioConfig = wanJuanBoundAudioConfigId && Array.isArray(data.apiConfigs) ?
		            data.apiConfigs.find((task: any) => task.id === wanJuanBoundAudioConfigId) :
		            null,
		            wanJuanAudioProtocolName = data.audioModelProtocolBindings?.[wanJuanAudioModelName],
		            wanJuanAudioProtocolProfile = data.modelProtocolRegistry?.[wanJuanAudioProtocolName] || {},
		            wanJuanAudioApiUrl = wanJuanBoundAudioConfig?.url || data.audioApiUrl,
		            wanJuanAudioApiKey = wanJuanBoundAudioConfig?.key || data.audioApiKey;
	          if (!wanJuanAudioApiUrl || !wanJuanAudioApiKey) {
	            data.updateGlobalTasks?.((tasks) =>
              tasks.map((task: any) =>
                task.id === audioTaskId ?
                {
                  ...task,
                  status: `failed`,
                  errorMsg: `请在设置中配置听音 API Key`
                } :
                task,
              ),
            );
            updateNodeData(nodeId, {
              loading: !1,
              errorMessage: `请在设置中配置听音 API Key`
            });
            return;
          }
          updateNodeData(nodeId, {
            loading: !0,
            errorMessage: void 0
          });
          try {
	            let result = await wanjuanTranscribeAudioClip(
	              selectedFile,
	              wanJuanAudioApiUrl,
	              wanJuanAudioApiKey,
	              wanJuanAudioModelName,
		              prompt,
		              maxDuration,
		              _,
	              wanJuanAudioProtocolProfile,
	            );
            (data.updateGlobalTasks?.((tasks) =>
                tasks.map((task: any) =>
                  task.id === audioTaskId ?
                  {
                    ...task,
                    status: `completed`,
                    progress: 100,
                    customResultData: JSON.stringify(result, null, 2),
                  } :
                  task,
                ),
              ),
              updateNodeData(nodeId, {
                loading: !1,
                chunks: result,
                text: JSON.stringify(result, null, 2)
              }),
              data.onShowToast?.(`音频处理完成！`));
          } catch (error) {
            (console.error(`Audio processing failed:`, error),
              data.updateGlobalTasks?.((tasks) =>
                tasks.map((task: any) =>
                  task.id === audioTaskId ?
                  {
                    ...task,
                    status: `failed`,
                    errorMsg: error.message || `处理失败`
                  } :
                  task,
                ),
              ),
              updateNodeData(nodeId, {
                loading: !1,
                errorMessage: error.message || `处理失败，请重试`,
              }));
          }
        };
      return jsxs(`div`, {
        className: `flex flex-col group/node transition-all w-[360px] ${selected ? `z-50` : `z-10`}`,
        children: [
          jsx(`input`, {
            type: `file`,
            ref: fileInputRef,
            style: {
              display: `none`
            },
            accept: `audio/*,video/*`,
            onChange: handleFileChange,
          }),
          jsxs(`div`, {
	            className: `relative bg-[#1c1c1c] rounded-xl overflow-visible border shadow-xl transition-all flex flex-col ${data.loading ? `wanjuan-loading-node-frame` : ``}
	          ${selected ? `border-blue-500 shadow-blue-500/20` : `border-[#333] hover:border-gray-500`}
	        `,
            style: {
              minHeight: `160px`
            },
            children: [
              jsx(WanJuanNodeHandle, {
                type: `target`,
                position: Position.Left
              }),
              jsx(WanJuanNodeHandle, {
                type: `source`,
                position: Position.Right
              }),
              jsxs(`div`, {
                className: `flex justify-between items-center px-3 py-2 bg-[#222] border-b border-[#2a2a2a] drag-handle cursor-move rounded-t-xl`,
                children: [
                  jsxs(`div`, {
                    className: `flex items-center gap-2 text-xs font-bold text-gray-200`,
                    children: [
                      jsx(`span`, {
                        className: `text-green-500`,
                        children: `🎙️`,
                      }),
                      `音频节点`,
                    ],
                  }),
                  jsx(`div`, {
                    className: `flex items-center gap-1 nodrag`,
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `flex-1 p-3 overflow-y-auto bg-[#1a1a1a] custom-scrollbar relative min-h-[80px] max-h-[160px]`,
                children: [
                  data.loading &&
                  jsxs(`div`, {
                    className: `absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 bg-[#1a1a1a]/80 backdrop-blur-sm z-10`,
                    children: [
                      jsx(RefreshCw, {
                        className: `w-6 h-6 animate-spin text-blue-500`,
                      }),
                      jsx(`span`, {
                        className: `text-xs`,
                        children: `处理中...`,
                      }),
                    ],
                  }),
                  data.errorMessage && !data.loading ?
                  jsxs(`div`, {
                    className: `text-red-400 text-[10px] p-2 border border-red-500/30 rounded bg-red-500/10 flex items-start gap-1.5`,
                    children: [
                      jsx(CircleAlert, {
                        size: 12,
                        className: `mt-0.5 flex-shrink-0`,
                      }),
                      jsx(`span`, {
                        className: `break-all leading-tight`,
                        children: data.errorMessage,
                      }),
                    ],
                  }) :
                  data.chunks ?
                  jsxs(`div`, {
                    className: `flex flex-col gap-1 nodrag`,
                    children: [
                      jsxs(`div`, {
                        className: `flex justify-between items-center`,
                        children: [
                          jsxs(`span`, {
                            className: `text-[10px] text-gray-500`,
                            children: [
                              `处理结果 (`,
                              data.chunks.length,
                              ` 句)`,
                            ],
                          }),
                          jsxs(`button`, {
                            onClick: (event) => {
                              (event.stopPropagation(),
                                data.chunks &&
                                (navigator.clipboard.writeText(
                                    JSON.stringify(data.chunks, null, 2),
                                  ),
                                  data.onShowToast?.(`JSON 已复制到剪贴板`)));
                            },
                            className: `text-[10px] flex items-center gap-1 text-gray-400 hover:text-white transition-colors`,
                            children: [
                              jsx(Copy, {
                                size: 10
                              }),
                              ` 复制 JSON`,
                            ],
                          }),
                        ],
                      }),
                      jsx(`pre`, {
                        className: `text-[10px] text-gray-400 font-mono whitespace-pre-wrap break-all nodrag select-text mt-1`,
                        children: JSON.stringify(data.chunks, null, 2),
                      }),
                    ],
                  }) :
                  jsx(`div`, {
                    className: `flex items-center justify-center h-full text-gray-500 text-xs mt-8`,
                    children: `等待上传并处理...`,
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `p-3 bg-[#1a1a1a] flex flex-col gap-3 nodrag border-t border-[#2a2a2a] rounded-b-xl relative z-10`,
                onClick: (event) => event.stopPropagation(),
                children: [
                  data.audioUrl ?
                  jsxs(`div`, {
                    className: `w-full flex flex-col gap-2 bg-[#111] p-2 rounded-lg border border-[#333]`,
                    children: [
                      jsxs(`div`, {
                        className: `flex items-center justify-between`,
                        children: [
                          jsxs(`div`, {
                            className: `flex items-center gap-2 overflow-hidden`,
                            children: [
                              jsx(CirclePlay, {
                                size: 14,
                                className: `text-green-500 flex-shrink-0`,
                              }),
                              jsx(`span`, {
                                className: `text-xs text-gray-300 truncate`,
                                title: data.audioName,
                                children: data.audioName,
                              }),
                            ],
                          }),
                          jsx(`button`, {
                            className: `text-[10px] text-red-400 hover:text-red-300 whitespace-nowrap ml-2`,
                            onClick: () => {
                              (setAudioFile(null),
                                updateNodeData(nodeId, {
                                  audioUrl: void 0,
                                  audioName: void 0,
                                  chunks: void 0,
                                  errorMessage: void 0,
                                }));
                            },
                            children: `清除`,
                          }),
                        ],
                      }),
                      data.audioUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ||
                      data.audioUrl.startsWith(`data:video/`) ?
                      jsx(`video`, {
                        src: data.audioUrl,
                        controls: !0,
                        className: `w-full h-24 object-contain outline-none nodrag bg-black rounded`,
                      }) :
                      jsx(`audio`, {
                        src: data.audioUrl,
                        controls: !0,
                        className: `w-full h-8 outline-none nodrag`,
                      }),
                    ],
                  }) :
                  jsxs(`div`, {
                    className: `w-full py-4 rounded-lg border border-dashed border-[#444] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#666] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group/upload`,
                    onClick: () => fileInputRef.current?.click(),
                    children: [
                      jsx(Upload, {
                        size: 16,
                        className: `text-gray-500 group-hover/upload:text-green-500 transition-colors`,
                      }),
                      jsx(`span`, {
                        className: `text-[10px] text-gray-500`,
                        children: `点击上传音视频或连接含音频的节点`,
                      }),
                    ],
                  }),
                  showSettings &&
                  jsxs(`div`, {
                    className: `flex flex-col gap-3 bg-[#111] border border-[#333] rounded p-3 mt-1 animate-fade-in nodrag`,
                    children: [
                      jsxs(`div`, {
                        className: `flex flex-col gap-1.5`,
                        children: [
                          jsx(`label`, {
                            className: `text-[10px] text-gray-400`,
                            children: `提示词 (Prompt)`,
                          }),
                          jsx(`input`, {
                            type: `text`,
                            className: `w-full bg-[#222] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500`,
                            value: prompt,
                            onChange: (event) => setPrompt(event.target.value),
                            placeholder: `请输出简体中文。`,
                          }),
                        ],
                      }),
                      jsxs(`div`, {
                        className: `flex gap-2`,
                        children: [
                          jsxs(`div`, {
                            className: `flex flex-col gap-1.5 flex-1`,
                            children: [
                              jsx(`label`, {
                                className: `text-[10px] text-gray-400`,
                                children: `换气停顿 (秒)`,
                              }),
                              jsx(`input`, {
                                type: `number`,
                                step: `0.1`,
                                min: `0`,
                                className: `w-full bg-[#222] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500`,
                                value: _,
                                onChange: (event) =>
                                  setPauseGap(parseFloat(event.target.value) || 0.3),
                              }),
                            ],
                          }),
                          jsxs(`div`, {
                            className: `flex flex-col gap-1.5 flex-1`,
                            children: [
                              jsx(`label`, {
                                className: `text-[10px] text-gray-400`,
                                children: `强制熔断 (秒)`,
                              }),
                              jsx(`input`, {
                                type: `number`,
                                step: `1`,
                                min: `1`,
                                className: `w-full bg-[#222] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500`,
                                value: maxDuration,
                                onChange: (event) =>
                                  setMaxDuration(parseFloat(event.target.value) || 10),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `flex justify-between items-center mt-1`,
                    children: [
                      jsxs(`button`, {
                        className: `p-1.5 rounded flex items-center gap-1 transition-colors ${showSettings ? `text-blue-400 bg-[#333]` : `text-gray-400 hover:bg-[#333]`}`,
                        onClick: (event) => {
                          (event.stopPropagation(), setShowSettings(!showSettings));
                        },
                        title: `参数配置`,
                        children: [
                          jsx(Settings2, {
                            size: 14
                          }),
                          jsx(`span`, {
                            className: `text-[10px]`,
                            children: showSettings ? `收起配置` : `配置`,
                          }),
                        ],
                      }),
                      jsx(`button`, {
                        className: `px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all bg-[#2a2a2a] text-gray-300 hover:bg-[#333]`,
                        onClick: (event) => {
                          (event.stopPropagation(),
                            updateNodeData(nodeId, {
                              audioMode: `tts`,
                              mode: `tts`,
                              nodeKind: `audio`,
                              prompt: data.prompt || ``
                            }));
                        },
                        title: `切换到配音 / TTS / 音色克隆`,
                        children: `配音`
                      }),
                      jsx(`button`, {
                        className: `px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${data.audioUrl ? (data.loading ? `bg-blue-600/50 text-white cursor-wait` : `bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20`) : `bg-[#333] text-gray-500 cursor-not-allowed`}`,
                        onClick: handleGenerateAudio,
                        disabled: !data.audioUrl || data.loading,
                        children: data.loading ?
                          jsxs(Fragment, {
                            children: [
                              jsx(RefreshCw, {
                                size: 12,
                                className: `animate-spin`,
                              }),
                              `处理中...`,
                            ],
                          }) :
                          jsxs(Fragment, {
                            children: [jsx(CirclePlay, {
                              size: 12
                            }), `开始断句`],
                          }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });
export const WanJuanUnifiedAudioNode = reactMemo((node: any) =>
      node?.data?.audioMode === `tts` || node?.data?.mode === `ttsSpeech` ?
      jsx(WanJuanTtsMusicNode, {
        ...node,
        data: {
          ...node.data,
          mode: `tts`,
          nodeKind: `audio`
        }
      }) :
      jsx(WanJuanAudioNode, node),
    );
