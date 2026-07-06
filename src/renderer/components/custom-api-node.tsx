/**
 * 自定义 API 节点：用户自配 endpoint/请求模板/响应路径的通用生成节点，支持图片与视频输出。（原 bundle 局部名 qe）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useState } from "react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Position, useReactFlow } from "@xyflow/react";
import { CircleAlert, Play, Puzzle, RefreshCw, Save, Sparkles, Square, Upload } from "lucide-react";
import { WanJuanNodeHandle } from "./render-mode";

export const WanJuanCustomApiNode = reactMemo(({
      id: nodeId,
      data: nodeData,
      selected: selected
    }: any) => {
      let {
        updateNodeData: updateNodeData
      } = useReactFlow(),
        data = nodeData,
        [label, setLabel] = useState(data.label || `万能节点`),
        [configMode, setConfigMode] = useState(data.configMode === void 0 ? !0 : data.configMode),
        [variables, setVariables] = useState(data.config?.variables || {}),
        [detectedVariables, setDetectedVariables] = useState([]),
        [config, setConfig] = useState(
          data.config || {
            apiUrl: ``,
            method: `POST`,
            headers: `{
  "Content-Type": "application/json"
}`,
            body: `{
  "prompt": "{{prompt}}"
}`,
            outputType: `text`,
            executionMode: `sync`,
            resultPath: `data.result`,
          },
        ),
        [aiPrompt, setAiPrompt] = useState(``),
        [_, setAiLoading] = useState(!1);
      useEffect(() => {
        let combinedText = (config.body || ``) + ` ` + (config.apiUrl || ``) + ` ` + (config.headers || ``),
          pattern = /\{\{([^}]+)\}\}/g,
          match,
          parsedVariables = [],
          seen = new Set();
        for (;
          (match = pattern.exec(combinedText)) !== null;) {
          let variableExpr = match[1].trim();
          if (!seen.has(variableExpr))
            if ((seen.add(variableExpr), variableExpr.includes(`|`))) {
              let [varName, optionsStr] = variableExpr.split(`|`);
              parsedVariables.push({
                name: varName.trim(),
                options: optionsStr.split(`,`).map((option) => option.trim()),
              });
            } else parsedVariables.push({
              name: variableExpr
            });
        }
        setDetectedVariables(parsedVariables);
      }, [config.body, config.apiUrl, config.headers]);
      let handleAiAssist = async () => {
          if (aiPrompt.trim()) {
            if (!data.onAIAssist) {
              data.onShowToast?.(`AI辅助不可用，请检查API配置`);
              return;
            }
            setAiLoading(!0);
            try {
              let aiResponse = await data.onAIAssist(aiPrompt, config);
              try {
                let parsedConfig = JSON.parse(aiResponse);
                (setConfig((prevConfig) => ({
                    ...prevConfig,
                    apiUrl: parsedConfig.apiUrl || prevConfig.apiUrl,
                    method: parsedConfig.method || prevConfig.method,
                    headers: parsedConfig.headers || prevConfig.headers,
                    body: parsedConfig.body || prevConfig.body,
                    outputType: parsedConfig.outputType || prevConfig.outputType,
                    executionMode: parsedConfig.executionMode || prevConfig.executionMode,
                    resultPath: parsedConfig.resultPath || prevConfig.resultPath,
                    taskIdPath: parsedConfig.taskIdPath || prevConfig.taskIdPath,
                    pollingUrl: parsedConfig.pollingUrl || prevConfig.pollingUrl,
                    pollingMethod: parsedConfig.pollingMethod || prevConfig.pollingMethod,
                    pollingHeaders: parsedConfig.pollingHeaders || prevConfig.pollingHeaders,
                    pollingBody: parsedConfig.pollingBody || prevConfig.pollingBody,
                    pollingResultPath: parsedConfig.pollingResultPath || prevConfig.pollingResultPath,
                    pollingCompletedValue: parsedConfig.pollingCompletedValue || prevConfig.pollingCompletedValue,
                    pollingFailedValue: parsedConfig.pollingFailedValue || prevConfig.pollingFailedValue,
                    pollingErrorPath: parsedConfig.pollingErrorPath || prevConfig.pollingErrorPath,
                    pollingProgressPath: parsedConfig.pollingProgressPath === void 0 ?
                      prevConfig.pollingProgressPath :
                      parsedConfig.pollingProgressPath,
                    pollingResultDataPath: parsedConfig.pollingResultDataPath === void 0 ?
                      prevConfig.pollingResultDataPath :
                      parsedConfig.pollingResultDataPath,
                    rawTextOutput: parsedConfig.rawTextOutput === void 0 ?
                      prevConfig.rawTextOutput :
                      parsedConfig.rawTextOutput,
                  })),
                  data.onShowToast?.(`AI 生成配置成功`));
              } catch (error) {
                (console.error(`AI 返回的 JSON 解析失败`, error, aiResponse),
                  data.onShowToast?.(`AI 生成格式错误，请重试`));
              }
            } catch (error) {
              data.onShowToast?.(error.message || `AI 生成失败`);
            } finally {
              setAiLoading(!1);
            }
          }
        },
        handleApplyConfig = () => {
          (updateNodeData(nodeId, {
            config: {
              ...config,
              variables: variables
            },
            configMode: !1
          }), setConfigMode(!1));
        },
        handleSaveTemplate = async () => {
          if (!config.apiUrl) {
            data.onShowToast?.(`请至少填写 API URL`);
            return;
          }
          let templateName = await window.wanjuanDesktop?.showInputDialog?.({
            title: `保存自定义节点`,
            message: `请输入自定义节点名称:`,
            defaultValue: label,
          });
          templateName && data.onSaveTemplate && data.onSaveTemplate(templateName, {
            ...config,
            variables: variables
          });
        },
        handleGenerate = (event) => {
          if ((event.stopPropagation(), configMode)) {
            data.onShowToast?.(`请先完成配置`);
            return;
          }
          let newConfig = {
            ...config,
            variables: variables
          };
          (setConfig(newConfig),
            updateNodeData(nodeId, {
              config: newConfig
            }),
            setTimeout(() => {
              (console.log(
                  `CustomNode handleRun triggered, calling onGenerateCustom`,
                  data.onGenerateCustom,
                ),
                data.onGenerateCustom ?
                data.onGenerateCustom(nodeId) :
                data.onShowToast?.(`未找到执行方法，请刷新页面重试`));
            }, 50));
        },
        handleFileRead = (varName, file) => {
          let reader = new FileReader();
          ((reader.onload = (event) => {
              event.target?.result && setVariables((prevVariables) => ({
                ...prevVariables,
                [varName]: event.target.result
              }));
            }),
            reader.readAsDataURL(file));
        };
      return jsx(`div`, {
        className: `flex flex-col items-center group/node transition-all wanjuan-custom-node ${selected ? `z-50` : `z-10`}`,
        children: jsxs(`div`, {
	          className: `relative bg-[#1c1c1c] rounded-xl overflow-visible border shadow-xl transition-all flex flex-col wanjuan-custom-node-frame ${data.loading ? `wanjuan-loading-node-frame` : ``}
	                ${selected ? `border-blue-500 shadow-blue-500/20` : `border-[#333] hover:border-gray-500`}
	                `,
          style: {
            width: `400px`,
            minHeight: configMode ? `450px` : `250px`
          },
          children: [
            jsxs(`div`, {
              className: `flex items-center justify-between px-3 py-2 bg-[#222] border-b border-[#2a2a2a] drag-handle rounded-t-xl wanjuan-custom-node-header`,
              children: [
                jsxs(`div`, {
                  className: `flex items-center gap-2 flex-1 min-w-0`,
                  children: [
                    jsx(Puzzle, {
                      size: 14,
                      className: `text-purple-400`
                    }),
                    jsx(`input`, {
                      className: `bg-transparent text-xs font-bold text-gray-300 outline-none w-24 hover:bg-white/5 rounded px-1 transition-colors nodrag wanjuan-custom-node-title-input`,
                      value: label,
                      onChange: (event) => {
                        (setLabel(event.target.value), updateNodeData(nodeId, {
                          label: event.target.value
                        }));
                      },
                      placeholder: `万能节点`,
                    }),
                    data.loading &&
                    jsx(RefreshCw, {
                      size: 12,
                      className: `animate-spin text-blue-500 flex-shrink-0`,
                    }),
                  ],
                }),
                jsxs(`div`, {
                  className: `flex bg-[#121212] rounded p-0.5 border border-[#333] nodrag wanjuan-custom-node-mode-switch`,
                  children: [
                    jsx(`button`, {
                      className: `px-2 py-1 text-[10px] rounded transition-colors wanjuan-custom-node-mode-button ${configMode ? `bg-[#333] text-white wanjuan-custom-node-mode-button-active` : `text-gray-400 hover:text-gray-200`}`,
                      onClick: () => {
                        (setConfigMode(!0), updateNodeData(nodeId, {
                          configMode: !0
                        }));
                      },
                      children: `编辑模式`,
                    }),
                    jsx(`button`, {
                      className: `px-2 py-1 text-[10px] rounded transition-colors wanjuan-custom-node-mode-button ${configMode ? `text-gray-400 hover:text-gray-200` : `bg-[#333] text-white wanjuan-custom-node-mode-button-active`}`,
                      onClick: () => {
                        (setConfigMode(!1), updateNodeData(nodeId, {
                          configMode: !1
                        }));
                      },
                      children: `工作模式`,
                    }),
                  ],
                }),
              ],
            }),
            jsxs(`div`, {
              className: `flex-1 flex flex-col p-3 bg-[#1a1a1a] relative drag-handle rounded-b-xl wanjuan-custom-node-body`,
              children: [
                data.loading &&
                jsxs(`div`, {
                  className: `absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 bg-[#1a1a1a]/80 backdrop-blur-sm z-10 wanjuan-custom-node-loading-overlay`,
                  children: [
                    jsx(RefreshCw, {
                      className: `w-6 h-6 animate-spin text-blue-500`,
                    }),
                    jsx(`span`, {
                      className: `text-xs`,
                      children: config.executionMode === `async` ?
                        `请求中... ${data.progress || 0}%` :
                        `请求中...`,
                    }),
                    jsxs(`button`, {
                      onClick: (event) => {
                        (event.stopPropagation(), data.onStop && data.onStop(nodeId));
                      },
                      className: `mt-2 bg-[#222]/80 hover:bg-[#333] border border-[#444] text-gray-400 hover:text-gray-200 px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5 transition-colors backdrop-blur-sm nodrag wanjuan-custom-node-secondary-button`,
                      children: [
                        jsx(Square, {
                          size: 10,
                          fill: `currentColor`
                        }),
                        `停止`,
                      ],
                    }),
                  ],
                }),
                data.errorMessage &&
                jsxs(`div`, {
                  className: `text-red-400 text-[10px] p-2 mb-2 border border-red-500/30 rounded bg-red-500/10 flex items-start gap-1.5`,
                  children: [
                    jsx(CircleAlert, {
                      size: 12,
                      className: `mt-0.5 flex-shrink-0`,
                    }),
                    jsx(`span`, {
                      className: `break-all`,
                      children: data.errorMessage,
                    }),
                  ],
                }),
                configMode ?
                jsxs(`div`, {
                  className: `flex flex-col gap-3 nodrag text-xs`,
                  children: [
                    jsxs(`div`, {
                      className: `flex flex-col gap-1`,
                      children: [
                        jsxs(`label`, {
                          className: `text-gray-500 flex items-center gap-1`,
                          children: [
                            jsx(Sparkles, {
                              size: 12,
                              className: `text-yellow-500`,
                            }),
                            `AI 辅助配置`,
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex flex-col gap-2`,
                          children: [
                            jsx(`textarea`, {
                              className: `flex-1 bg-[#121212] border border-[#333] rounded p-2 text-gray-200 focus:border-blue-500 outline-none custom-scrollbar text-[10px] resize-y nodrag wanjuan-custom-node-field`,
                              placeholder: `描述你想调用的API... (如：调用百度翻译)`,
                              value: aiPrompt,
                              onChange: (event) => setAiPrompt(event.target.value),
                              onKeyDown: (event) => {
                                event.key === `Enter` &&
                                  (event.ctrlKey || event.metaKey) &&
                                  handleAiAssist();
                              },
                              onWheel: (event) => event.stopPropagation(),
                              rows: 3,
                            }),
                            jsxs(`button`, {
                              onClick: handleAiAssist,
                              disabled: _,
                              className: `py-1.5 w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded transition-colors flex items-center justify-center gap-1 wanjuan-custom-node-primary-soft-button`,
                              children: [
                                _ ?
                                jsx(RefreshCw, {
                                  size: 12,
                                  className: `animate-spin`,
                                }) :
                                `生成`,
                                !_ &&
                                jsx(`span`, {
                                  className: `text-[10px] text-blue-400/70`,
                                  children: `(Ctrl+Enter)`,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex gap-2`,
                      children: [
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 w-20`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `Method`,
                            }),
                            jsxs(`select`, {
                              className: `bg-[#121212] border border-[#333] rounded px-1 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                              value: config.method,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  method: event.target.value
                                }),
                              children: [
                                jsx(`option`, {
                                  children: `GET`
                                }),
                                jsx(`option`, {
                                  children: `POST`
                                }),
                                jsx(`option`, {
                                  children: `PUT`
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 flex-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `API URL`,
                            }),
                            jsx(`input`, {
                              className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 focus:border-blue-500 outline-none wanjuan-custom-node-field`,
                              value: config.apiUrl,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  apiUrl: event.target.value
                                }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex flex-col gap-1`,
                      children: [
                        jsxs(`div`, {
                          className: `flex justify-between items-center`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `Headers (JSON格式)`,
                            }),
                            jsxs(`div`, {
                              className: `flex gap-1`,
                              children: [
                                jsx(`button`, {
                                  onClick: () =>
                                    setConfig({
                                      ...config,
                                      headers: `{
  "Content-Type": "application/json"
}`,
                                    }),
                                  className: `text-[9px] bg-[#333] hover:bg-[#444] px-1.5 py-0.5 rounded text-gray-300 transition-colors wanjuan-custom-node-secondary-button`,
                                  children: `JSON`,
                                }),
                                jsx(`button`, {
                                  onClick: () =>
                                    setConfig({
                                      ...config,
                                      headers: `{
  "Content-Type": "multipart/form-data"
}`,
                                    }),
                                  className: `text-[9px] bg-[#333] hover:bg-[#444] px-1.5 py-0.5 rounded text-gray-300 transition-colors wanjuan-custom-node-secondary-button`,
                                  children: `FormData`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsx(`textarea`, {
                          className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 font-mono text-[10px] h-16 resize-y focus:border-blue-500 outline-none custom-scrollbar nodrag wanjuan-custom-node-field`,
                          value: config.headers,
                          onChange: (event) =>
                            setConfig({
                              ...config,
                              headers: event.target.value
                            }),
                          onWheel: (event) => event.stopPropagation(),
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex flex-col gap-1`,
                      children: [
                        jsx(`label`, {
                          className: `text-gray-500 flex justify-between`,
                          children: jsxs(`span`, {
                            children: [
                              `Body (支持变量: `,
                              `{{prompt}}`,
                              `, `,
                              `{{image_1}}`,
                              `)`,
                            ],
                          }),
                        }),
                        jsx(`textarea`, {
                          className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 font-mono text-[10px] h-24 resize-y focus:border-blue-500 outline-none custom-scrollbar nodrag wanjuan-custom-node-field`,
                          value: config.body,
                          onChange: (event) => setConfig({
                            ...config,
                            body: event.target.value
                          }),
                          onWheel: (event) => event.stopPropagation(),
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex gap-2`,
                      children: [
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 flex-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `输出类型`,
                            }),
                            jsxs(`select`, {
                              className: `bg-[#121212] border border-[#333] rounded px-1 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                              value: config.outputType,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  outputType: event.target.value
                                }),
                              children: [
                                jsx(`option`, {
                                  value: `text`,
                                  children: `文本 (Text)`,
                                }),
                                jsx(`option`, {
                                  value: `image`,
                                  children: `图片 (Image URL)`,
                                }),
                                jsx(`option`, {
                                  value: `video`,
                                  children: `视频 (Video URL)`,
                                }),
                                jsx(`option`, {
                                  value: `audio`,
                                  children: `音频 (Audio URL)`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 flex-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `执行模式`,
                            }),
                            jsxs(`select`, {
                              className: `bg-[#121212] border border-[#333] rounded px-1 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                              value: config.executionMode,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  executionMode: event.target.value
                                }),
                              children: [
                                jsx(`option`, {
                                  value: `sync`,
                                  children: `同步 (立即返回)`,
                                }),
                                jsx(`option`, {
                                  value: `async`,
                                  children: `异步 (需轮询)`,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex gap-2`,
                      children: [
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 flex-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `提取结果字段 (JSON Path, 如 data.url)`,
                            }),
                            jsx(`input`, {
                              className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 focus:border-blue-500 outline-none wanjuan-custom-node-field`,
                              value: config.resultPath,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  resultPath: event.target.value
                                }),
                              placeholder: `如 choices[0].message.content`,
                            }),
                          ],
                        }),
                        config.outputType === `text` &&
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 w-24`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500 text-center`,
                              children: `纯文本输出`,
                            }),
                            jsx(`div`, {
                              className: `flex items-center justify-center h-full`,
                              children: jsx(`input`, {
                                type: `checkbox`,
                                checked: config.rawTextOutput || !1,
                                onChange: (event) =>
                                  setConfig({
                                    ...config,
                                    rawTextOutput: event.target.checked,
                                  }),
                                className: `w-4 h-4 accent-blue-500 cursor-pointer`,
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    config.executionMode === `async` &&
                    jsxs(`div`, {
                      className: `flex flex-col gap-2 p-2 bg-[#222] border border-[#333] rounded mt-1 wanjuan-custom-node-subpanel`,
                      children: [
                        jsxs(`div`, {
                          className: `flex flex-col gap-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `提取 Task ID 字段`,
                            }),
                            jsx(`input`, {
                              className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                              value: config.taskIdPath || ``,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  taskIdPath: event.target.value
                                }),
                              placeholder: `如 data.task_id`,
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex gap-2`,
                          children: [
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 w-24`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500`,
                                  children: `轮询 Method`,
                                }),
                                jsxs(`select`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field h-[30px]`,
                                  value: config.pollingMethod || `GET`,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingMethod: event.target.value,
                                    }),
                                  children: [
                                    jsx(`option`, {
                                      value: `GET`,
                                      children: `GET`,
                                    }),
                                    jsx(`option`, {
                                      value: `POST`,
                                      children: `POST`,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 flex-1`,
                              children: [
                                jsxs(`label`, {
                                  className: `text-gray-500`,
                                  children: [
                                    `轮询 API URL (支持 `,
                                    `{{task_id}}`,
                                    `)`,
                                  ],
                                }),
                                jsx(`input`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field h-[30px]`,
                                  value: config.pollingUrl || ``,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingUrl: event.target.value
                                    }),
                                  placeholder: `如果与上方一致可留空`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex flex-col gap-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `轮询 Headers (JSON格式, 留空同上)`,
                            }),
                            jsx(`textarea`, {
                              className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 font-mono text-[10px] h-12 resize-y focus:border-blue-500 outline-none custom-scrollbar nodrag wanjuan-custom-node-field`,
                              value: config.pollingHeaders || ``,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  pollingHeaders: event.target.value
                                }),
                              placeholder: `例如: {"Authorization": "Bearer xxx"}`,
                              onWheel: (event) => event.stopPropagation(),
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex flex-col gap-1 ${config.pollingMethod === `GET` || !config.pollingMethod ? `hidden` : ``}`,
                          children: [
                            jsxs(`label`, {
                              className: `text-gray-500`,
                              children: [
                                `轮询 Body (JSON格式, 支持 `,
                                `{{task_id}}`,
                                `)`,
                              ],
                            }),
                            jsx(`textarea`, {
                              className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 font-mono text-[10px] h-12 resize-y focus:border-blue-500 outline-none custom-scrollbar nodrag wanjuan-custom-node-field`,
                              value: config.pollingBody || ``,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  pollingBody: event.target.value
                                }),
                              placeholder: `例如: {"taskId": "{{task_id}}"}`,
                              onWheel: (event) => event.stopPropagation(),
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex gap-2`,
                          children: [
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 flex-1`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500`,
                                  children: `状态判断字段`,
                                }),
                                jsx(`input`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                                  value: config.pollingResultPath || ``,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingResultPath: event.target.value,
                                    }),
                                  placeholder: `如 data.status`,
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 flex-1`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500`,
                                  children: `完成状态值`,
                                }),
                                jsx(`input`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                                  value: config.pollingCompletedValue || ``,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingCompletedValue: event.target.value,
                                    }),
                                  placeholder: `如 completed`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex gap-2`,
                          children: [
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 flex-1`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500`,
                                  children: `失败状态值`,
                                }),
                                jsx(`input`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                                  value: config.pollingFailedValue || ``,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingFailedValue: event.target.value,
                                    }),
                                  placeholder: `如 failed`,
                                }),
                              ],
                            }),
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 flex-1`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500`,
                                  children: `失败信息字段`,
                                }),
                                jsx(`input`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                                  value: config.pollingErrorPath || ``,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingErrorPath: event.target.value,
                                    }),
                                  placeholder: `如 data.error`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex flex-col gap-1`,
                          children: [
                            jsx(`label`, {
                              className: `text-gray-500`,
                              children: `进度判断字段`,
                            }),
                            jsx(`input`, {
                              className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                              value: config.pollingProgressPath || ``,
                              onChange: (event) =>
                                setConfig({
                                  ...config,
                                  pollingProgressPath: event.target.value,
                                }),
                              placeholder: `如 data.progress (选填)`,
                            }),
                          ],
                        }),
                        jsxs(`div`, {
                          className: `flex gap-2`,
                          children: [
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 flex-1`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500`,
                                  children: `异步结果提取字段 (如轮询返回的 data.url)`,
                                }),
                                jsx(`input`, {
                                  className: `bg-[#121212] border border-[#333] rounded px-2 py-1 text-gray-200 outline-none wanjuan-custom-node-field`,
                                  value: config.pollingResultDataPath || ``,
                                  onChange: (event) =>
                                    setConfig({
                                      ...config,
                                      pollingResultDataPath: event.target.value,
                                    }),
                                  placeholder: `留空则使用上方主请求提取字段`,
                                }),
                              ],
                            }),
                            config.outputType === `text` &&
                            jsxs(`div`, {
                              className: `flex flex-col gap-1 w-24`,
                              children: [
                                jsx(`label`, {
                                  className: `text-gray-500 text-center`,
                                  children: `纯文本输出`,
                                }),
                                jsx(`div`, {
                                  className: `flex items-center justify-center h-full`,
                                  children: jsx(`input`, {
                                    type: `checkbox`,
                                    checked: config.rawTextOutput || !1,
                                    onChange: (event) =>
                                      setConfig({
                                        ...config,
                                        rawTextOutput: event.target.checked,
                                      }),
                                    className: `w-4 h-4 accent-blue-500 cursor-pointer`,
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    jsxs(`div`, {
                      className: `flex gap-2 mt-2`,
                      children: [
                        jsx(`button`, {
                          onClick: handleApplyConfig,
                          className: `flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-xs wanjuan-custom-node-primary-button`,
                          children: `完成配置`,
                        }),
                        jsxs(`button`, {
                          onClick: handleSaveTemplate,
                          className: `py-1.5 px-3 bg-[#333] hover:bg-[#444] text-white rounded transition-colors flex items-center justify-center gap-1 text-xs wanjuan-custom-node-secondary-button wanjuan-custom-node-save-button`,
                          title: `保存为自定义节点供下次使用`,
                          children: [
                            jsx(Save, {
                              size: 12
                            }),
                            `保存模板`,
                          ],
                        }),
                      ],
                    }),
                  ],
                }) :
                jsx(`div`, {
                  className: `flex flex-col h-full nodrag`,
                  children: jsxs(`div`, {
                    className: `flex-1 flex flex-col min-h-[100px] pr-1`,
                    children: [
                      data.resultData &&
                      jsxs(`div`, {
                        className: `flex-1 bg-[#121212] border border-[#333] rounded p-2 mb-2 overflow-auto custom-scrollbar flex min-h-[60px] max-h-[250px] wanjuan-custom-node-result ${config.outputType === `text` ? `items-start justify-start` : `items-center justify-center`}`,
                        children: [
                          config.outputType === `text` &&
                          jsx(`div`, {
                            className: `text-gray-300 text-xs whitespace-pre-wrap w-full align-top break-all`,
                            children: data.resultData,
                          }),
                          config.outputType === `image` &&
                          jsx(`img`, {
                            src: data.resultData,
                            className: `max-w-full max-h-full object-contain`,
                          }),
                          config.outputType === `video` &&
                          jsx(`video`, {
                            src: data.resultData,
                            controls: !0,
                            className: `max-w-full max-h-full`,
                          }),
                          config.outputType === `audio` &&
                          jsx(`audio`, {
                            src: data.resultData,
                            controls: !0,
                            className: `w-full`,
                          }),
                        ],
                      }),
                      jsx(`div`, {
                        className: `flex flex-col gap-3 mt-auto pt-2 pb-2`,
                        children: detectedVariables.length > 0 ?
                          jsx(Fragment, {
                            children: detectedVariables.map((variable) =>
                              jsxs(
                                `div`, {
                                  className: `flex flex-col gap-1 relative nodrag`,
                                  children: [
                                    jsx(`div`, {
                                      className: `absolute top-1/2 -translate-y-1/2`,
                                      style: {
                                        left: `-12px`
                                      },
                                      children: jsx(WanJuanNodeHandle, {
                                        type: `target`,
                                        id: `var-${variable.name}`,
                                        position: Position.Left,
                                        variant: `small`,
                                        title: `连接到变量: ${variable.name}`,
                                      }),
                                    }),
                                    jsxs(`div`, {
                                      className: `flex justify-between items-center mb-1`,
                                      children: [
                                        jsx(`label`, {
                                          className: `text-gray-400 text-[10px] ml-1`,
                                          children: variable.name,
                                        }),
                                        !variable.options &&
                                        !variable.name.startsWith(`image`) &&
                                        !variable.name.startsWith(`audio`) &&
                                        !variable.name.startsWith(`video`) &&
                                        !variable.name.startsWith(`file`) &&
                                        jsxs(`div`, {
                                          className: `flex items-center gap-1 text-[9px]`,
                                          children: [
                                            jsx(`span`, {
                                              className: `${config.variableFormats?.[variable.name] === `json` ? `text-gray-500` : `text-blue-400 font-bold`}`,
                                              children: `Text`,
                                            }),
                                            jsx(`div`, {
                                              className: `w-5 h-2.5 bg-[#333] rounded-full relative cursor-pointer`,
                                              onClick: () => {
                                                let variableFormat =
                                                  (config.variableFormats?.[
                                                    variable.name
                                                  ] || `text`) ===
                                                  `text` ?
                                                  `json` :
                                                  `text`;
                                                setConfig((prev) => ({
                                                  ...prev,
                                                  variableFormats: {
                                                    ...prev.variableFormats,
                                                    [variable.name]: variableFormat,
                                                  },
                                                }));
                                              },
                                              children: jsx(
                                                `div`, {
                                                  className: `absolute top-[1px] w-2 h-2 rounded-full transition-all ${config.variableFormats?.[variable.name] === `json` ? `bg-blue-400 right-[1px]` : `bg-gray-400 left-[1px]`}`,
                                                },
                                              ),
                                            }),
                                            jsx(`span`, {
                                              className: `${config.variableFormats?.[variable.name] === `json` ? `text-blue-400 font-bold` : `text-gray-500`}`,
                                              children: `JSON`,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    variable.options ?
                                    jsx(`select`, {
                                      className: `w-full bg-[#121212] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500 wanjuan-custom-node-field`,
                                      value: variables[variable.name] || variable.options[0],
                                      onChange: (event) =>
                                        setVariables((prev) => ({
                                          ...prev,
                                          [variable.name]: event.target.value,
                                        })),
                                      children: variable.options.map((optionValue) =>
                                        jsx(
                                          `option`, {
                                            value: optionValue,
                                            children: optionValue
                                          },
                                          optionValue,
                                        ),
                                      ),
                                    }) :
                                    variable.name.startsWith(`image`) ||
                                    variable.name.startsWith(`audio`) ||
                                    variable.name.startsWith(`video`) ||
                                    variable.name.startsWith(`file`) ?
                                    jsx(`div`, {
                                      className: `flex items-center gap-2`,
                                      children: variables[variable.name] ?
                                        jsxs(`div`, {
                                          className: `relative w-full h-12 rounded overflow-hidden border border-[#444] flex items-center justify-center bg-[#121212] wanjuan-custom-node-upload-preview`,
                                          children: [
                                            variable.name.startsWith(
                                              `image`,
                                            ) &&
                                            jsx(`img`, {
                                              src: variables[variable.name],
                                              className: `w-full h-full object-cover`,
                                            }),
                                            variable.name.startsWith(
                                              `audio`,
                                            ) &&
                                            jsx(
                                              `audio`, {
                                                src: variables[variable.name],
                                                controls: !0,
                                                className: `w-full h-full`,
                                              },
                                            ),
                                            variable.name.startsWith(
                                              `video`,
                                            ) &&
                                            jsx(
                                              `video`, {
                                                src: variables[variable.name],
                                                className: `w-full h-full object-cover`,
                                              },
                                            ),
                                            variable.name.startsWith(
                                              `file`,
                                            ) &&
                                            jsx(`div`, {
                                              className: `text-xs text-gray-400 break-all p-1 text-center line-clamp-2`,
                                              children: `文件已上传`,
                                            }),
                                            jsx(`button`, {
                                              onClick: () =>
                                                setVariables((prev) => {
                                                  let updatedFormats = {
                                                    ...prev,
                                                  };
                                                  return (
                                                    delete updatedFormats[
                                                      variable.name
                                                    ],
                                                    updatedFormats
                                                  );
                                                }),
                                              className: `absolute top-0 right-0 bg-red-500/80 text-white p-0.5 rounded-bl z-10 wanjuan-custom-node-danger-button wanjuan-danger-icon-action`,
                                              children: jsx(Square, {
                                                size: 8,
                                                fill: `currentColor`,
                                              }),
                                            }),
                                          ],
                                        }) :
                                        jsxs(`label`, {
                                          className: `flex-1 border border-dashed border-[#444] hover:border-blue-500 rounded p-2 flex items-center justify-center cursor-pointer text-gray-500 hover:text-blue-400 transition-colors text-xs wanjuan-custom-node-upload-target`,
                                          children: [
                                            jsx(Upload, {
                                              size: 12,
                                              className: `mr-1`,
                                            }),
                                            variable.name.startsWith(
                                              `image`,
                                            ) ?
                                            `上传图片` :
                                            variable.name.startsWith(
                                              `audio`,
                                            ) ?
                                            `上传音频` :
                                            variable.name.startsWith(
                                              `video`,
                                            ) ?
                                            `上传视频` :
                                            `上传文件`,
                                            jsx(`input`, {
                                              type: `file`,
                                              accept: variable.name.startsWith(
                                                  `image`,
                                                ) ?
                                                `image/*` :
                                                variable.name.startsWith(
                                                  `audio`,
                                                ) ?
                                                `audio/*` :
                                                variable.name.startsWith(
                                                  `video`,
                                                ) ?
                                                `video/*` :
                                                `*/*`,
                                              className: `hidden`,
                                              onChange: (event) => {
                                                event.target
                                                  .files?.[0] &&
                                                  handleFileRead(
                                                    variable.name,
                                                    event.target
                                                    .files[0],
                                                  );
                                              },
                                            }),
                                          ],
                                        }),
                                    }) :
                                    jsx(`textarea`, {
                                      className: `w-full bg-[#121212] border border-[#333] rounded px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500 wanjuan-custom-node-field custom-scrollbar resize-y nodrag min-h-[30px]`,
                                      placeholder: `输入 ${variable.name}...`,
                                      value: variables[variable.name] || ``,
                                      onChange: (event) =>
                                        setVariables((prev) => ({
                                          ...prev,
                                          [variable.name]: event.target.value,
                                        })),
                                      onWheel: (event) =>
                                        event.stopPropagation(),
                                    }),
                                  ],
                                },
                                variable.name,
                              ),
                            ),
                          }) :
                          jsxs(`div`, {
                            className: `text-gray-500 text-xs text-center py-4 border border-dashed border-[#444] rounded wanjuan-custom-node-empty`,
                            children: [
                              `当前配置未提取到变量。`,
                              jsx(`br`, {}),
                              `在编辑模式下使用 `,
                              `{{变量名}}`,
                              ` 添加变量。`,
                            ],
                          }),
                      }),
                      jsx(`div`, {
                        className: `mt-auto pt-2`,
                        children: jsxs(`button`, {
                          onClick: (event) => {
                            (event.stopPropagation(), handleGenerate(event));
                          },
                          disabled: data.loading,
                          className: `w-full py-2 bg-white hover:bg-gray-100 text-black rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 font-medium text-sm wanjuan-custom-node-run-button`,
                          children: [
                            data.loading ?
                            jsx(RefreshCw, {
                              size: 14,
                              className: `animate-spin`,
                            }) :
                            jsx(Play, {
                              size: 14,
                              fill: `currentColor`,
                            }),
                            data.loading ? `处理中...` : `开始处理`,
                          ],
                        }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
            jsx(WanJuanNodeHandle, {
              type: `source`,
              position: Position.Right,
              variant: `small`,
            }),
          ],
        }),
      });
    });
