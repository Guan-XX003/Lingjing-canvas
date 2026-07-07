/** TTS音乐设置面板。自 WanJuanAppRoot 抽出，props 传入，行为不变。 */
import { jsx, jsxs } from "react/jsx-runtime";
declare const chrome: any;

export function WanJuanTtsMusicSettingsPanel({
  apiConfigs,
  audioModelApiBindings,
  setAudioModelApiBindings,
  setTtsMusicModel,
  ttsMusicModel,
}: any) {
  return jsxs(`div`, {
	                                className: `px-4 pt-4 space-y-3`,
	                                children: [
	                                  jsx(`label`, {
	                                    className: `block text-xs font-medium text-gray-500 mb-2`,
		                                    children: `音乐大模型名称（换行分隔）`,
	                                  }),
	                                  jsx(`textarea`, {
	                                    value: ttsMusicModel,
	                                    onChange: (event) => setTtsMusicModel(event.target.value),
	                                    className: `w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[96px] resize-y`,
	                                    placeholder: `请输入音乐模型名称`,
	                                  }),
		                                  jsx(`p`, {
		                                    className: `text-[10px] text-gray-500 leading-relaxed`,
		                                    children: `音乐节点会读取这里的模型列表；Suno 生成、歌词、拼接、查询和 WAV 获取统一走当前音频 API 配置。`,
		                                  }),
		                                  jsxs(`div`, {
		                                    children: [jsx(`label`, {
		                                      className: `block text-xs font-medium text-gray-500 mb-2`,
			                                      children: `每个音乐大模型使用的 API 配置`,
		                                    }), jsx(`div`, {
		                                      className: `space-y-2 bg-[#121212] border border-[#333] rounded-lg p-3`,
		                                      children: ttsMusicModel.split(/[\n,，、]+/).map((item) => item.trim()).filter((item) => item !== ``).map((modelName) => jsxs(`div`, {
		                                        className: `flex items-center gap-3`,
		                                        children: [jsx(`div`, {
		                                          className: `flex-1 text-xs text-gray-300 truncate`,
		                                          title: modelName,
		                                          children: modelName,
		                                        }), jsxs(`select`, {
		                                          className: `w-52 bg-[#1a1a1a] border border-[#333] text-gray-300 text-xs px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 hover:bg-[#222] transition-colors wanjuan-settings-control wanjuan-settings-select`,
		                                          value: audioModelApiBindings[modelName] || ``,
		                                          onChange: (event) => {
		                                            let nextBindings = {
		                                              ...audioModelApiBindings
		                                            };
		                                            event.target.value ? nextBindings[modelName] = event.target.value : delete nextBindings[modelName];
		                                            setAudioModelApiBindings(nextBindings);
		                                          },
		                                          children: [jsx(`option`, {
		                                            value: ``,
		                                            children: `未指定（使用音频默认配置）`,
		                                          }, `__default`), ...apiConfigs.map((option) => jsx(`option`, {
		                                            value: option.id,
		                                            children: option.name || option.url,
		                                          }, option.id))],
		                                        })],
		                                      }, modelName)),
		                                    }), jsx(`p`, {
		                                      className: `text-[10px] text-gray-500 mt-1 wanjuan-settings-help`,
		                                      children: `音乐节点会优先使用这里绑定的 API 配置，未指定时回退到音频大模型默认配置。`,
		                                    })],
		                                  }),
		                                ],
		                              });
}
