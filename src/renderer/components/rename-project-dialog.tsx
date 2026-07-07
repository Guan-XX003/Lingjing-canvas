/** 重命名项目弹窗。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanRenameProjectDialog({
  ConfirmRenameProject,
  renameProjectName,
  setRenameProjectId,
  setRenameProjectName,
}: any) {
  return jsx(`div`, {
                  className: `absolute inset-0 bg-black/50 flex items-center justify-center z-50`,
                  children: jsxs(`div`, {
                    className: `bg-[#2a2a2a] p-4 rounded-lg border border-[#333] w-64`,
                    children: [
                      jsx(`h3`, {
                        className: `text-gray-200 text-sm font-bold mb-3`,
                        children: `重命名项目`,
                      }),
                      jsx(`input`, {
                        className: `w-full bg-[#1c1c1c] border border-[#333] rounded p-2 text-gray-200 text-xs mb-3 focus:outline-none focus:border-blue-500`,
                        placeholder: `项目名称`,
                        value: renameProjectName,
                        onChange: (event) =>
                          setRenameProjectName(event.target.value),
                        onKeyDown: (event) => {
                          event.key === `Enter` && ConfirmRenameProject();
                        },
                        autoFocus: true,
                      }),
                      jsxs(`div`, {
                        className: `flex justify-end gap-2`,
                        children: [
                          jsx(`button`, {
                            onClick: () => {
                              (setRenameProjectId(null),
                                setRenameProjectName(``));
                            },
                            className: `text-gray-400 hover:text-white text-xs px-2 py-1`,
                            children: `取消`,
                          }),
                          jsx(`button`, {
                            onClick: ConfirmRenameProject,
                            className: `bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-500`,
                            children: `保存`,
                          }),
                        ],
                      }),
                    ],
                  }),
                });
}
