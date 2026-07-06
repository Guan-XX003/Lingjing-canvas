/**
 * URL 转图片节点：抓取网页地址生成截图/封面图。（原 bundle 局部名 $e）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { CircleAlert, Image, Link, RefreshCw } from "lucide-react";
import { WanJuanNodeHandle } from "./render-mode";

export const WanJuanUrlToImageNode = reactMemo(({
        id: id,
        data: data,
        selected: selected
      }: any) => {
        let {
          updateNodeData: updateNodeData
        } = useReactFlow(),
          sourceNodes = useNodesData(useNodeConnections({
            handleType: `target`
          }).map((connection) => connection.source)),
          [inputUrl, setInputUrl] = useState(data.inputUrl || ``),
          [loading, setLoading] = useState(!1),
          [errorMsg, setErrorMsg] = useState(null);
        useEffect(() => {
          let inputText = ``;
          for (let node of sourceNodes)
            if (
              node?.data?.text &&
              typeof node.data.text == `string` &&
              node.data.text.startsWith(`http`)
            ) {
              inputText = node.data.text;
              break;
            }
          inputText && inputText !== inputUrl && (setInputUrl(inputText), updateNodeData(id, {
            inputUrl: inputText
          }));
        }, [sourceNodes, id, updateNodeData, inputUrl]);
        let fetchAndConvert = async () => {
          if (inputUrl) {
            (setLoading(!0), setErrorMsg(null));
            try {
              let response = await fetch(inputUrl);
              if (!response.ok) throw Error(`HTTP ${response.status}`);
              let blob = await response.blob();
              (updateNodeData(id, {
                  imageUrl: await new Promise((resolve: any, reject: any) => {
                    let reader = new FileReader();
                    ((reader.onloadend = () => resolve(reader.result)),
                      (reader.onerror = reject),
                      reader.readAsDataURL(blob));
                  }),
                }),
                data.onShowToast?.(`图片转换成功`));
            } catch (error) {
              (console.error(error),
                setErrorMsg(error.message || `转换失败`),
                updateNodeData(id, {
                  imageUrl: null
                }));
            } finally {
              setLoading(!1);
            }
          }
        };
        return (
          useEffect(() => {
            inputUrl &&
              inputUrl !== data.lastFetchedUrl &&
              fetchAndConvert().then(() => {
                updateNodeData(id, {
                  lastFetchedUrl: inputUrl
                });
              });
          }, [inputUrl, data.lastFetchedUrl]),
          jsxs(`div`, {
            className: `w-[260px] bg-[#1a1a1a] rounded-xl shadow-2xl border-2 transition-colors ${selected ? `border-gray-500` : `border-[#333] hover:border-[#444]`}`,
            children: [
              jsx(WanJuanNodeHandle, {
                type: `target`,
                position: Position.Left
              }),
              jsxs(`div`, {
                className: `flex items-center gap-2 p-3 border-b border-[#333] bg-[#222] rounded-t-xl text-gray-300`,
                children: [
                  jsx(Link, {
                    size: 16,
                    className: `text-gray-400`
                  }),
                  jsx(`span`, {
                    className: `text-xs font-bold`,
                    children: `网址转图片`,
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `p-3 space-y-3`,
                children: [
                  jsxs(`div`, {
                    className: `flex gap-2`,
                    children: [
                      jsx(`input`, {
                        type: `text`,
                        value: inputUrl,
                        onChange: (event) => {
                          (setInputUrl(event.target.value), updateNodeData(id, {
                            inputUrl: event.target.value
                          }));
                        },
                        className: `flex-1 bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500 nodrag`,
                        placeholder: `输入图片 URL (或连线传入)`,
                      }),
                      jsx(`button`, {
                        onClick: fetchAndConvert,
                        disabled: loading || !inputUrl,
                        className: `px-2 py-1 bg-[#333] hover:bg-[#444] rounded text-gray-300 disabled:opacity-50 transition-colors`,
                        title: `重新获取`,
                        children: jsx(RefreshCw, {
                          size: 14,
                          className: loading ? `animate-spin` : ``,
                        }),
                      }),
                    ],
                  }),
                  errorMsg &&
                  jsxs(`div`, {
                    className: `flex items-center gap-1 text-red-400 text-[10px]`,
                    children: [
                      jsx(CircleAlert, {
                        size: 12
                      }),
                      jsx(`span`, {
                        children: errorMsg
                      }),
                    ],
                  }),
                  jsx(`div`, {
                    className: `border border-[#333] rounded-lg overflow-hidden bg-[#111] relative aspect-video flex items-center justify-center`,
                    children: loading ?
                      jsxs(`div`, {
                        className: `text-xs text-gray-500 flex items-center gap-2`,
                        children: [
                          jsx(RefreshCw, {
                            size: 14,
                            className: `animate-spin`
                          }),
                          `转换中...`,
                        ],
                      }) :
                      data.imageUrl ?
                      jsx(`img`, {
                        src: data.imageUrl,
                        className: `w-full h-full object-contain cursor-pointer`,
                        onDoubleClick: (event) => {
                          (event.stopPropagation(),
                            data.onZoom && data.onZoom(data.imageUrl));
                        },
                      }) :
                      jsxs(`div`, {
                        className: `text-[10px] text-gray-600 flex flex-col items-center gap-1`,
                        children: [
                          jsx(Image, {
                            size: 20,
                            className: `opacity-50`
                          }),
                          jsx(`span`, {
                            children: `等待图片 URL`
                          }),
                        ],
                      }),
                  }),
                ],
              }),
              jsx(WanJuanNodeHandle, {
                type: `source`,
                position: Position.Right,
                id: `image`
              }),
            ],
          })
        );
	      });
