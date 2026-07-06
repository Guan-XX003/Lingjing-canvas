/**
 * 文本拼接节点：把多个上游文本按分隔符/前后缀拼接输出。（原 bundle 局部名 Qe）
 * 自 bundle 反混淆迁入，行为保持一致。
 */
import { memo as reactMemo, useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { wanjuanNodeTextValue } from "../lib/reference-media";
import { Position, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { Type } from "lucide-react";
import { WanJuanNodeHandle } from "./render-mode";

export const WanJuanTextConcatNode = reactMemo(({
        id: id,
        data: data,
        selected: selected
      }: any) => {
        let {
          updateNodeData: updateNodeData
        } = useReactFlow(),
          connections = useNodeConnections({
            handleType: `target`
          }),
          nodes = useNodesData(connections.map((connection) => connection.source)),
          [separator, setSeparator] = useState(data.separator === void 0 ? `\\n` : data.separator),
          [prefix, setPrefix] = useState(data.prefix || ``),
          [suffix, setSuffix] = useState(data.suffix || ``),
          inputTexts = connections.map((connection) => wanjuanNodeTextValue(nodes.find((node: any) => node?.id === connection.source))).filter((text) => text),
          joinSeparator = separator.replace(
            /\\n/g,
            `
`,
          ),
          combinedText = inputTexts.length > 0 ? `${prefix}${inputTexts.join(joinSeparator)}${suffix}` : ``;
        return (
          useEffect(() => {
            data.text !== combinedText && updateNodeData(id, {
              text: combinedText
            });
          }, [combinedText, id, updateNodeData, data.text]),
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
                  jsx(Type, {
                    size: 16,
                    className: `text-gray-400`
                  }),
                  jsx(`span`, {
                    className: `text-xs font-bold`,
                    children: `文字拼接`,
                  }),
                ],
              }),
              jsxs(`div`, {
                className: `p-3 space-y-3`,
                children: [
                  jsxs(`div`, {
                    className: `space-y-1`,
                    children: [
                      jsx(`label`, {
                        className: `text-[10px] text-gray-500`,
                        children: `前缀`,
                      }),
                      jsx(`input`, {
                        type: `text`,
                        value: prefix,
                        onChange: (event) => {
                          (setPrefix(event.target.value), updateNodeData(id, {
                            prefix: event.target.value
                          }));
                        },
                        className: `w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500 nodrag`,
                        placeholder: `可选`,
                      }),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `space-y-1`,
                    children: [
                      jsx(`label`, {
                        className: `text-[10px] text-gray-500`,
                        children: `分隔符 (输入 \\n 表示换行)`,
                      }),
                      jsx(`input`, {
                        type: `text`,
                        value: separator,
                        onChange: (event) => {
                          (setSeparator(event.target.value), updateNodeData(id, {
                            separator: event.target.value
                          }));
                        },
                        className: `w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500 nodrag`,
                      }),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `space-y-1`,
                    children: [
                      jsx(`label`, {
                        className: `text-[10px] text-gray-500`,
                        children: `后缀`,
                      }),
                      jsx(`input`, {
                        type: `text`,
                        value: suffix,
                        onChange: (event) => {
                          (setSuffix(event.target.value), updateNodeData(id, {
                            suffix: event.target.value
                          }));
                        },
                        className: `w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500 nodrag`,
                        placeholder: `可选`,
                      }),
                    ],
                  }),
                  jsxs(`div`, {
                    className: `space-y-1 pt-2 border-t border-[#333]`,
                    children: [
                      jsx(`label`, {
                        className: `text-[10px] text-gray-500 flex justify-between`,
                        children: jsxs(`span`, {
                          children: [`拼接结果 (`, inputTexts.length, ` 个输入)`],
                        }),
                      }),
                      jsx(`textarea`, {
                        readOnly: !0,
                        value: combinedText,
                        className: `w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 h-[60px] resize-y custom-scrollbar`,
                        placeholder: `等待连入文本...`,
                      }),
                    ],
                  }),
                ],
              }),
              jsx(WanJuanNodeHandle, {
                type: `source`,
                position: Position.Right,
                id: `text`
              }),
            ],
          })
        );
      });
