/** 项目菜单。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanProjectMenu({
  handleCreateProject,
  newProjectGroupId,
  newProjectName,
  projectGroupList,
  setNewProjectGroupId,
  setNewProjectName,
  setProjectMenuOpen,
}: any) {
  return jsx(`div`, {
                  className: `absolute inset-0 bg-black/50 flex items-center justify-center z-50`,
                  children: jsxs(`div`, {
                    className: `bg-[#2a2a2a] p-4 rounded-lg border border-[#333] w-72`,
                    children: [
                      jsx(`h3`, {
                        className: `text-gray-200 text-sm font-bold mb-3`,
                        children: `新建项目`,
                      }),
                      jsx(`input`, {
                        className: `w-full bg-[#1c1c1c] border border-[#333] rounded p-2 text-gray-200 text-xs mb-3 focus:outline-none focus:border-blue-500`,
                        placeholder: `项目名称`,
                        value: newProjectName,
                        onChange: (event) => setNewProjectName(event.target.value),
                        autoFocus: true,
                      }),
                      jsxs(`label`, {
                        className: `block mb-3`,
                        children: [
                          jsx(`span`, {
                            className: `block text-[11px] font-semibold text-gray-400 mb-1.5`,
                            children: `项目分组`,
                          }),
                          jsxs(`select`, {
                            value: newProjectGroupId,
                            onChange: (event) => setNewProjectGroupId(event.target.value),
                            className: `w-full bg-[#1c1c1c] border border-[#333] rounded p-2 text-gray-200 text-xs outline-none focus:border-blue-500`,
                            title: `选择新项目所在分组`,
                            children: [
                              jsx(`option`, {
                                value: ``,
                                children: `未分组`,
                              }),
                              projectGroupList.map((group) =>
                                jsx(`option`, {
                                  value: group.id,
                                  children: group.name,
                                }, group.id),
                              ),
                            ],
                          }),
                        ],
                      }),
                      jsxs(`div`, {
                        className: `flex justify-end gap-2`,
                        children: [
                          jsx(`button`, {
                            onClick: () => {
                              setProjectMenuOpen(false);
                              setNewProjectGroupId(``);
                            },
                            className: `text-gray-400 hover:text-white text-xs px-2 py-1`,
                            children: `取消`,
                          }),
                          jsx(`button`, {
                            onClick: handleCreateProject,
                            className: `bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-500`,
                            children: `创建`,
                          }),
                        ],
                      }),
                    ],
                  }),
                });
}
