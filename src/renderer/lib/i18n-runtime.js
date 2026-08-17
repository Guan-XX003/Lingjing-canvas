import DEEP_LANGUAGE_PACKS from "./i18n-deep-packs.json";

const LANGUAGE_ALIASES = {
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "zh-hant": "zh-TW",
  en: "en-US",
  "en-us": "en-US",
  "en-gb": "en-US",
};

const LANGUAGE_PACKS = {
  "zh-CN": {},
  "zh-TW": {
    "StarCanvas": "StarCanvas",
    "画布": "畫布",
    "资源": "資源",
    "智能体": "智慧體",
    "工作空间": "工作空間",
    "设置": "設定",
    "设置菜单": "設定選單",
    "账号": "帳號",
    "我的账号": "我的帳號",
    "模型服务": "模型服務",
    "运行": "執行",
    "数据": "資料",
    "基础": "基礎",
    "一站式中心": "一站式中心",
    "API 配置": "API 配置",
    "模型配置": "模型配置",
    "上传与直链": "上傳與直連",
    "生成与下载": "生成與下載",
    "本地工具": "本機工具",
    "项目与备份": "專案與備份",
    "外观与通用": "外觀與通用",
    "界面主题": "介面主題",
    "语言设置": "語言設定",
    "关于": "關於",
    "版本更新日志": "版本更新日誌",
    "当前版本": "目前版本",
    "个性设置": "個人化設定",
    "云盘设置": "雲端硬碟設定",
    "生成设置": "生成設定",
    "拓展功能": "擴充功能",
    "数据管理": "資料管理",
    "当前已启用全局统一API配置": "目前已啟用全域統一 API 配置",
    "切换石墨灰、曜石黑、晴空蓝、暖砂白、樱雾粉、薄荷绿或跟随系统外观，不改变现有布局结构": "切換石墨灰、曜石黑、晴空藍、暖砂白、櫻霧粉、薄荷綠或跟隨系統外觀，不改變現有布局結構",
    "选择界面语言偏好，后续多语言文案将按此设置展示": "選擇介面語言偏好，後續多語言文案會依此設定顯示",
    "曜石黑": "曜石黑",
    "晴空蓝": "晴空藍",
    "暖砂白": "暖砂白",
    "樱雾粉": "櫻霧粉",
    "薄荷绿": "薄荷綠",
    "石墨灰": "石墨灰",
    "跟随系统": "跟隨系統",
    "全部": "全部",
    "图片": "圖片",
    "视频": "影片",
    "音频": "音訊",
    "文本": "文字",
    "全部来源": "全部來源",
    "AI生成": "AI 生成",
    "外部素材": "外部素材",
    "显示大小": "顯示大小",
    "下载目录": "下載目錄",
    "打开下载目录": "開啟下載目錄",
    "清理失效素材": "清理失效素材",
    "检查中...": "檢查中...",
    "清空全部": "清空全部",
    "暂无资源": "暫無資源",
    "当前筛选没有资源": "目前篩選沒有資源",
    "只看收藏": "只看收藏",
    "显示全部收藏筛选": "顯示全部收藏篩選",
    "右键自由生成你的想象": "右鍵自由生成你的想像",
    "文字生成": "文字生成",
    "图片生成": "圖片生成",
    "视频生成": "影片生成",
    "音乐生成": "音樂生成",
    "错误查询": "錯誤查詢",
    "任务清单": "任務清單",
    "保存设置": "儲存設定",
    "设置已保存": "設定已儲存",
    "生图": "生圖",
    "即梦": "即夢",
    "音乐": "音樂",
    "万能": "萬能",
    "工具": "工具",
    "上传": "上傳",
    "素材": "素材",
    "格式转换": "格式轉換",
    "文本拼接": "文字拼接",
    "网址转图片": "網址轉圖片",
    "文件转网址": "檔案轉網址",
    "常用工具": "常用工具",
    "九宫格拼图": "九宮格拼圖",
    "九宫格切分": "九宮格切分",
    "视频抽帧": "影片擷取影格",
    "视频人脸打码": "影片人臉模糊",
    "Qwen-TTS 语音生成": "Qwen-TTS 語音生成",
    "本地视频超分": "本機影片超解析",
    "打开工具": "開啟工具",
    "上传文件": "上傳檔案",
    "选择素材": "選擇素材",
    "{label}（点击创建，拖动可指定位置）": "{label}（點擊建立，拖曳可指定位置）",
    "登录 / 注册": "登入 / 註冊",
    "退出登录": "登出",
    "本地模式": "本機模式",
    "离线宽限": "離線寬限",
    "已登录": "已登入",
    "账号服务暂时不可用": "帳號服務暫時無法使用",
    "本地画布、项目和自有 API 不受影响，请稍后重试。": "本機畫布、專案和自有 API 不受影響，請稍後重試。",
    "会员状态": "會員狀態",
    "查看当前账号的会员方案与有效状态": "查看目前帳號的會員方案與有效狀態",
    "会员权益": "會員權益",
    "当前方案": "目前方案",
    "有效": "有效",
    "未开通": "未開通",
    "企业空间的会员权益由企业管理员单独管理。": "企業空間的會員權益由企業管理員單獨管理。",
    "设备与安全": "裝置與安全",
    "登录令牌由系统安全存储加密，不写入项目和导出包": "登入權杖由系統安全儲存加密，不寫入專案和匯出包",
    "令牌加密存储": "權杖加密儲存",
    "云端身份校验": "雲端身分驗證",
    "当前设备": "目前裝置",
    "企业与组织": "企業與組織",
    "企业配置与个人统一 API 配置完全隔离": "企業配置與個人統一 API 配置完全隔離",
    "接管企业网关": "接管企業網關",
    "创建企业网关": "建立企業網關",
    "连接企业网关": "連線企業網關",
    "密钥受保护": "金鑰受保護",
    "刷新配置": "刷新配置",
    "断开": "中斷連線",
    "StarCanvas账号": "StarCanvas 帳號",
    "随时随地开始创作": "隨時隨地開始創作",
    "登录后可启用云备份、多设备同步、会员权益和企业私密空间。本地项目不会因为登录、退出或会员到期而被删除。": "登入後可啟用雲端備份、多裝置同步、會員權益和企業私密空間。本機專案不會因登入、登出或會員到期而被刪除。",
    "云端备份与设备恢复": "雲端備份與裝置復原",
    "企业局域网与成员权限": "企業區域網路與成員權限",
    "企业密钥不进入客户端": "企業金鑰不進入用戶端",
    "企业空间采用账号身份 + 局域网网关双重验证，离开企业网络后自动停止企业模型访问。": "企業空間採用帳號身分 + 區域網路網關雙重驗證，離開企業網路後會自動停止企業模型存取。",
    "登录方式": "登入方式",
    "登录": "登入",
    "注册": "註冊",
    "创建StarCanvas账号": "建立 StarCanvas 帳號",
    "欢迎回来": "歡迎回來",
    "内测阶段可通过邀请码创建账号": "內測階段可透過邀請碼建立帳號",
    "使用邮箱验证码登录": "使用電子郵件驗證碼登入",
    "账号服务暂时不可用，请稍后重试。本地画布和项目不会受到影响。": "帳號服務暫時無法使用，請稍後重試。本機畫布和專案不會受到影響。",
    "邮箱": "電子郵件",
    "验证码": "驗證碼",
    "输入验证码": "輸入驗證碼",
    "获取验证码": "取得驗證碼",
    "邀请码": "邀請碼",
    "内测邀请码": "內測邀請碼",
    "正在验证": "正在驗證",
    "注册并继续": "註冊並繼續",
    "登录并继续": "登入並繼續",
    "或者": "或者",
    "先本地使用": "先使用本機模式",
    "本地模式保留完整画布、自有 API、项目与资源功能，之后可随时在设置中登录。": "本機模式保留完整畫布、自有 API、專案與資源功能，之後可隨時在設定中登入。",
    "请输入有效的邮箱地址": "請輸入有效的電子郵件地址",
    "验证码已发送，请检查邮箱": "驗證碼已傳送，請檢查電子郵件",
    "关闭会员权益": "關閉會員權益",
    "StarCanvas会员": "StarCanvas 會員",
    "内测开放": "內測開放",
    "为个人创作与团队协作提供更完整的模型和提示词能力": "為個人創作與團隊協作提供更完整的模型和提示詞能力",
    "会员价格每月 19.9 元": "會員價格每月 19.9 元",
    "/月": "/月",
    "会员权益列表": "會員權益清單",
    "企业模型统一管理": "企業模型統一管理",
    "企业管理员配置模型后，可统一管理所有成员的模型与使用量。": "企業管理員配置模型後，可統一管理所有成員的模型與使用量。",
    "云端提示词库": "雲端提示詞庫",
    "不受局域网限制，保存、管理和分享提示词资产。": "不受區域網路限制，儲存、管理和分享提示詞資產。",
    "极鑫模型 85 折": "極鑫模型 85 折",
    "会员调用极鑫中转站模型享受 85 折。": "會員呼叫極鑫中轉站模型享有 85 折。",
    "开通会员需要内测码，详情联系 QQ：": "開通會員需要內測碼，詳情請聯絡 QQ：",
    "复制 QQ": "複製 QQ",
    "QQ 已复制": "QQ 已複製",
    "复制失败，请手动复制 QQ": "複製失敗，請手動複製 QQ",
    "本地免费版": "本機免費版",
    "专业版": "專業版",
    "团队版": "團隊版",
    "企业版": "企業版",
    "未登录": "未登入",
    "暂时离线": "暫時離線",
    "本机加密存储": "本機加密儲存",
    "系统安全存储": "系統安全儲存",
    "旧客户端": "舊版用戶端",
    "不可用": "無法使用",
    "当前使用本地模式。登录不会移动、覆盖或删除现有画布项目。": "目前使用本機模式。登入不會移動、覆蓋或刪除現有畫布專案。",
    "登录后可绑定企业空间": "登入後可綁定企業空間",
    "本机网关": "本機網關",
    "企业私密空间": "企業私密空間",
    "尚未绑定企业空间": "尚未綁定企業空間",
    "可将当前电脑设为新的主网关，企业成员和配额不会被删除。": "可將目前電腦設為新的主網關，企業成員和配額不會被刪除。",
    "企业 API Key 只保存在局域网网关，客户端仅持有短期企业会话。": "企業 API Key 只儲存在區域網路網關，用戶端僅持有短期企業工作階段。",
    "企业网关地址": "企業網關位址",
    "企业邀请码": "企業邀請碼",
    "首次绑定时填写": "首次綁定時填寫",
    "取消": "取消",
    "网关地址": "網關位址",
    "等待局域网地址": "等待區域網路位址",
    "配置版本": "配置版本",
    "云端状态": "雲端狀態",
    "已激活": "已啟用",
    "等待激活": "等待啟用",
    "正在运行": "正在執行",
    "已停止": "已停止",
    "已验证": "已驗證",
    "正在同步": "正在同步",
    "同步本机配置": "同步本機配置",
    "停止网关": "停止網關",
    "启动网关": "啟動網關",
    "移除本机网关": "移除本機網關",
    "未命名企业": "未命名企業",
    "未知平台": "未知平台",
    "StarCanvas桌面端": "StarCanvas 桌面版",
    "退出账号不会删除本地项目，确定继续吗？": "登出帳號不會刪除本機專案，確定繼續嗎？",
    "移除后，当前电脑会停止企业网关并删除本机企业密钥库。企业、成员和配额仍会保留，可在本机或另一台电脑重新接管。确定继续吗？": "移除後，目前電腦會停止企業網關並刪除本機企業金鑰庫。企業、成員和配額仍會保留，可在本機或另一台電腦重新接管。確定繼續嗎？",
    "配置管家": "配置管家",
    "文本大模型": "文字大模型",
    "图像大模型": "圖片大模型",
    "视频大模型": "影片大模型",
    "音频大模型": "音訊大模型",
    "音乐大模型": "音樂大模型",
    "即梦节点": "即夢節點",
    "已存储统一全局配置": "已儲存統一全域配置",
    "保存并切换整套模型列表、API 绑定、协议配置和接口文档链接。": "儲存並切換整套模型清單、API 綁定、協議配置和介面文件連結。",
    "当前：自定义配置（空白）": "目前：自訂配置（空白）",
    "给文档、模型，并选择统一 API 配置，自动识别并应用模型配置": "提供文件與模型並選擇統一 API 配置，自動識別並套用模型配置",
    "火山方舟 / 智创聚合专用": "火山方舟 / 智創聚合專用",
    "收起": "收起",
    "展开": "展開",
    "收起高级设置": "收起進階設定",
    "展开全部高级设置": "展開全部進階設定",
    "一站式中心网址": "一站式中心網址",
    "在应用内打开自定义的模型服务管理网站。": "在 App 內開啟自訂的模型服務管理網站。",
    "外部打开": "在外部開啟",
    "打开": "開啟",
    "恢复默认": "恢復預設",
    "由企业网关管理": "由企業網關管理",
    "当前配置来自企业网关。断开企业网关后，将恢复绑定前的个人配置。": "目前配置來自企業網關。中斷企業網關後，將恢復綁定前的個人配置。",
    "知道了": "知道了",
    "🚀 发现新版本 v": "🚀 發現新版本 v",
    "修复了一些已知问题，优化了使用体验。": "修復了一些已知問題，並改善使用體驗。",
    "立即更新": "立即更新",
    "画布压力": "畫布壓力",
    "低": "低",
    "中": "中",
    "高": "高",
    "过载": "過載",
    "当前画布渲染压力：{label}（{pressure}%）\nFPS {fps}\n节点 {nodes}，连线 {edges}，完整 {full}，轻量 {lite}，外壳 {shell}": "目前畫布渲染壓力：{label}（{pressure}%）\nFPS {fps}\n節點 {nodes}，連線 {edges}，完整 {full}，輕量 {lite}，外殼 {shell}",
    "{count} 节点 · {fps} FPS": "{count} 節點 · {fps} FPS",
    "个人空间": "個人空間",
    "团队空间": "團隊空間",
    "关闭工作空间": "關閉工作空間",
    "个人提示词资产和局域网团队模板共享": "個人提示詞資產與區域網路團隊模板共享",
    "提示词模板": "提示詞模板",
    "功能提示词": "功能提示詞",
    "新建分组": "新建分組",
    "新增功能提示词": "新增功能提示詞",
    "全部模板": "全部模板",
    "未分组": "未分組",
    "搜索标题、提示词、模型": "搜尋標題、提示詞、模型",
    "返回": "返回",
    "暂无提示词模板。可以先新建分组，后续从生成结果整理为模板。": "暫無提示詞模板。可以先新建分組，後續從生成結果整理為模板。",
    "暂无功能提示词": "暫無功能提示詞",
    "关闭": "關閉",
    "复制": "複製",
    "删除": "刪除",
    "启用": "啟用",
    "添加成员": "新增成員",
    "刷新团队": "刷新團隊",
    "保存团队设置": "儲存團隊設定",
    "重命名分组": "重新命名分組",
    "删除分组": "刪除分組",
    "模板分组": "模板分組",
    "无结果预览": "無結果預覽",
    "使用": "使用",
    "存到个人": "存到個人",
    "发到团队": "發到團隊",
    "复制提示词": "複製提示詞",
    "功能提示词类型": "功能提示詞類型",
    "通用": "通用",
    "本机": "本機",
    "已开启，其他成员优先添加：": "已開啟，其他成員優先新增：",
    "端口": "連接埠",
    "当前共享模板：{count} 个。可在另一台电脑浏览器打开此地址检查是否连通。": "目前共享模板：{count} 個。可在另一台電腦瀏覽器開啟此地址檢查是否連通。",
    "其他可用地址：{urls}": "其他可用地址：{urls}",
    "如果推荐地址连不上，让对方改用同一 Wi-Fi/网线网段里的另一个 192.168/10/172 地址。": "如果推薦地址連不上，讓對方改用同一 Wi-Fi/網路線網段裡的另一個 192.168/10/172 地址。",
    "未开启。Windows 首次开启如无法访问，请允许防火墙访问当前端口。": "未開啟。Windows 首次開啟如無法存取，請允許防火牆存取目前連接埠。",
    "错误：{message}": "錯誤：{message}",
    "{count} 个模板": "{count} 個模板",
    "连接失败：{message}": "連線失敗：{message}",
    "未知错误": "未知錯誤",
    "未刷新": "未刷新",
    "系统错误码：{code}": "系統錯誤碼：{code}",
    "移除": "移除",
    "更换网络环境（如更换Wi-Fi频段，更换有线网，开启VPN等情况）需要关闭团队空间后关闭软件再重新开启软件与团队空间，重新复制更换后的局域网端口。": "更換網路環境（如更換 Wi-Fi 頻段、更換有線網路、開啟 VPN 等情況）需要關閉團隊空間後關閉軟體，再重新開啟軟體與團隊空間，重新複製更換後的區域網路連接埠。",
    "关闭团队空间": "關閉團隊空間",
    "开启团队空间": "開啟團隊空間",
    "我的团队昵称": "我的團隊暱稱",
    "例如：设计一号机": "例如：設計一號機",
    "团队空间端口": "團隊空間連接埠",
    "这是本机对外共享团队空间使用的端口；其他电脑共享时可使用各自设置的端口。": "這是本機對外共享團隊空間使用的連接埠；其他電腦共享時可使用各自設定的連接埠。",
    "成员地址，如 192.168.1.8:39218": "成員地址，如 192.168.1.8:39218",
    "刷新中": "刷新中",
    "标题": "標題",
    "提示词内容": "提示詞內容",
    "没有匹配的功能提示词": "沒有匹配的功能提示詞",
    "暂无团队模板。先添加成员地址并刷新，或让本机发布模板。": "暫無團隊模板。先新增成員地址並刷新，或讓本機發布模板。",
    "团队空间开启失败：{message}": "團隊空間開啟失敗：{message}",
    "端口可能被占用或被防火墙拦截": "連接埠可能被占用或被防火牆攔截",
    "已复制": "已複製",
    "复制失败": "複製失敗",
    "已刷新 {count} 个成员": "已刷新 {count} 個成員",
    "输入新的分组名称": "輸入新的分組名稱",
    "未命名分组": "未命名分組",
    "分组已重命名": "分組已重新命名",
    "删除分组“{name}”？": "刪除分組「{name}」？",
    "该分组下 {count} 个模板会移到“未分组”。": "該分組下 {count} 個模板會移到「未分組」。",
    "分组已删除": "分組已刪除",
    "输入提示词模板分组名称": "輸入提示詞模板分組名稱",
    "新分组": "新分組",
    "新功能提示词": "新功能提示詞",
    "已删除模板": "已刪除模板",
    "已从团队空间删除": "已從團隊空間刪除",
    "已存到个人空间": "已存到個人空間",
    "团队设置已保存": "團隊設定已儲存",
    "已保存到工作空间": "已儲存到工作空間",
    "已发布到团队空间": "已發布到團隊空間",
    "已加入团队发布列表，开启团队空间后可被成员拉取": "已加入團隊發布列表，開啟團隊空間後可被成員拉取",
    "个人提示词资产、局域网团队共享与账号云提示词库": "個人提示詞資產、區域網路團隊共享與帳號雲端提示詞庫",
    "云端工作空间": "雲端工作空間",
    "发送到": "傳送到",
    "保存到本地工作空间": "儲存到本機工作空間",
    "发送到企业网关团队": "傳送到企業網關團隊",
    "发布到局域网团队": "發布到區域網路團隊",
    "发送到云端工作空间": "傳送到雲端工作空間",
    "该模板已保存在本地工作空间": "此模板已儲存在本機工作空間",
    "云提示词操作失败：{message}": "雲端提示詞操作失敗：{message}",
    "企业网关": "企業網關",
    "企业网关团队": "企業網關團隊",
    "作者：团队成员": "作者：團隊成員",
    "作者：我": "作者：我",
    "作者：{name}": "作者：{name}",
    "所有者": "擁有者",
    "管理员": "管理員",
    "成员": "成員",
    "只读": "唯讀",
    "可编辑": "可編輯",
    "可管理": "可管理",
    "编辑": "編輯",
    "撤销": "撤銷",
    "正在同步企业团队模板": "正在同步企業團隊模板",
    "等待同步企业团队模板": "等待同步企業團隊模板",
    "已连接企业网关团队": "已連線企業網關團隊",
    "网关离线，显示上次同步缓存": "網關離線，顯示上次同步快取",
    "团队权限已失效，本地缓存已清理": "團隊權限已失效，本機快取已清理",
    "角色：{role} · 团队模板：{count} 个": "角色：{role} · 團隊模板：{count} 個",
    "可向当前企业网关发布模板": "可向目前企業網關發布模板",
    "发布权限以网关同步结果为准": "發布權限以網關同步結果為準",
    "上次同步：{time}": "上次同步：{time}",
    "同步中": "同步中",
    "刷新企业团队": "刷新企業團隊",
    "连接企业网关后，会自动显示同一组织成员发布的模板。": "連線企業網關後，會自動顯示同一組織成員發布的模板。",
    "个人模板不会自动共享；云端工作空间与此处相互独立。": "個人模板不會自動共享；雲端工作空間與此處相互獨立。",
    "局域网兼容共享": "區域網路相容共享",
    "以下设置仅用于旧版手动地址共享，不会写入云端工作空间或企业网关团队。": "以下設定僅用於舊版手動地址共享，不會寫入雲端工作空間或企業網關團隊。",
    "暂无团队模板。连接企业网关后会自动同步同组织模板；也可继续使用局域网兼容共享。": "暫無團隊模板。連線企業網關後會自動同步同組織模板；也可繼續使用區域網路相容共享。",
    "发送团队失败：{message}": "傳送團隊失敗：{message}",
    "已发送到企业网关团队": "已傳送到企業網關團隊",
    "已发布到局域网团队": "已發布到區域網路團隊",
    "已加入局域网发布列表，开启团队空间后可被成员拉取": "已加入區域網路發布清單，開啟團隊空間後可由成員取得",
    "编辑团队模板标题": "編輯團隊模板標題",
    "仅作者或企业管理员可修改": "僅作者或企業管理員可修改",
    "编辑团队提示词": "編輯團隊提示詞",
    "多行内容使用 Command/Ctrl + Enter 确认": "多行內容使用 Command/Ctrl + Enter 確認",
    "团队模板已更新": "團隊模板已更新",
    "模板已被其他成员更新，已刷新服务器版本，未覆盖": "模板已被其他成員更新，已刷新伺服器版本，未覆蓋",
    "更新团队模板失败：{message}": "更新團隊模板失敗：{message}",
    "已从企业网关团队撤销": "已從企業網關團隊撤銷",
    "模板版本已变更，已刷新服务器版本，未删除": "模板版本已變更，已刷新伺服器版本，未刪除",
    "撤销团队模板失败：{message}": "撤銷團隊模板失敗：{message}",
    "从企业网关团队撤销“{name}”？": "從企業網關團隊撤銷「{name}」？",
    "点击展开网络环境提示": "點擊展開網路環境提示",
    "展开或收起网络环境提示": "展開或收起網路環境提示",
    "企业网关团队模板请求失败": "企業網關團隊模板請求失敗",
    "企业团队模板返回的组织或网关与当前会话不一致": "企業團隊模板回傳的組織或網關與目前工作階段不一致",
    "企业网关离线，正在显示上次同步缓存": "企業網關離線，正在顯示上次同步快取",
    "企业团队权限已失效，本地缓存已清理": "企業團隊權限已失效，本機快取已清理",
    "企业网关暂时不可用，正在显示缓存": "企業網關暫時無法使用，正在顯示快取",
    "企业网关离线，未发送；重连后请重试": "企業網關離線，未傳送；重新連線後請重試",
    },
  "en-US": {
    "StarCanvas": "StarCanvas",
    "画布": "Canvas",
    "资源": "Assets",
    "智能体": "Agents",
    "工作空间": "Workspace",
    "设置": "Settings",
    "设置菜单": "Settings Menu",
    "账号": "Account",
    "我的账号": "My Account",
    "模型服务": "Model Services",
    "运行": "Run",
    "数据": "Data",
    "基础": "Basics",
    "一站式中心": "One-stop Center",
    "API 配置": "API Config",
    "模型配置": "Model Config",
    "上传与直链": "Uploads & Links",
    "生成与下载": "Generation & Downloads",
    "本地工具": "Local Tools",
    "项目与备份": "Projects & Backup",
    "外观与通用": "Appearance & General",
    "界面主题": "Theme",
    "语言设置": "Language",
    "关于": "About",
    "版本更新日志": "Release Notes",
    "当前版本": "Current Version",
    "个性设置": "Personalization",
    "云盘设置": "Cloud Storage",
    "生成设置": "Generation",
    "拓展功能": "Extensions",
    "数据管理": "Data",
    "当前已启用全局统一API配置": "Global unified API config is enabled",
    "切换石墨灰、曜石黑、晴空蓝、暖砂白、樱雾粉、薄荷绿或跟随系统外观，不改变现有布局结构": "Switch the visual theme without changing the current layout.",
    "选择界面语言偏好，后续多语言文案将按此设置展示": "Choose the interface language. Supported interface text follows this setting.",
    "曜石黑": "Obsidian",
    "晴空蓝": "Sky Blue",
    "暖砂白": "Warm Sand",
    "樱雾粉": "Rose Mist",
    "薄荷绿": "Mint",
    "石墨灰": "Graphite",
    "跟随系统": "Follow System",
    "全部": "All",
    "图片": "Images",
    "视频": "Videos",
    "音频": "Audio",
    "文本": "Text",
    "全部来源": "All Sources",
    "AI生成": "AI Generated",
    "外部素材": "External",
    "显示大小": "Size",
    "下载目录": "Downloads",
    "打开下载目录": "Open Downloads",
    "清理失效素材": "Clean Invalid Assets",
    "检查中...": "Checking...",
    "清空全部": "Clear All",
    "暂无资源": "No assets yet",
    "当前筛选没有资源": "No assets match this filter",
    "只看收藏": "Favorites Only",
    "显示全部收藏筛选": "Show All Favorites Filter",
    "右键自由生成你的想象": "Right-click to create freely",
    "文字生成": "Text",
    "图片生成": "Image",
    "视频生成": "Video",
    "音乐生成": "Music",
    "错误查询": "Errors",
    "任务清单": "Tasks",
    "保存设置": "Save Settings",
    "设置已保存": "Settings saved",
    "生图": "Image",
    "即梦": "Seedance",
    "音乐": "Music",
    "万能": "Universal",
    "工具": "Tools",
    "上传": "Upload",
    "素材": "Assets",
    "格式转换": "Format Conversion",
    "文本拼接": "Text Merge",
    "网址转图片": "URL to Image",
    "文件转网址": "File to URL",
    "常用工具": "Utilities",
    "九宫格拼图": "Grid Collage",
    "九宫格切分": "Split Grid",
    "视频抽帧": "Extract Frames",
    "视频人脸打码": "Face Blur",
    "Qwen-TTS 语音生成": "Qwen-TTS Voice",
    "本地视频超分": "Local Video Upscale",
    "打开工具": "Open Tools",
    "上传文件": "Upload File",
    "选择素材": "Choose Asset",
    "{label}（点击创建，拖动可指定位置）": "{label} (click to create, drag to position)",
    "登录 / 注册": "Sign In / Register",
    "退出登录": "Sign Out",
    "本地模式": "Local Mode",
    "离线宽限": "Offline Grace Period",
    "已登录": "Signed In",
    "账号服务暂时不可用": "Account service is temporarily unavailable",
    "本地画布、项目和自有 API 不受影响，请稍后重试。": "Local canvases, projects, and your own APIs are unaffected. Try again later.",
    "会员状态": "Membership",
    "查看当前账号的会员方案与有效状态": "View the current account plan and status",
    "会员权益": "Member Benefits",
    "当前方案": "Current Plan",
    "有效": "Active",
    "未开通": "Not Active",
    "企业空间的会员权益由企业管理员单独管理。": "Enterprise membership benefits are managed separately by the enterprise administrator.",
    "设备与安全": "Devices & Security",
    "登录令牌由系统安全存储加密，不写入项目和导出包": "Sign-in tokens are encrypted by secure system storage and are never written to projects or exports",
    "令牌加密存储": "Encrypted Token Storage",
    "云端身份校验": "Cloud Identity Verification",
    "当前设备": "Current Device",
    "企业与组织": "Enterprise & Organization",
    "企业配置与个人统一 API 配置完全隔离": "Enterprise configuration is fully isolated from personal unified API configuration",
    "接管企业网关": "Take Over Gateway",
    "创建企业网关": "Create Gateway",
    "连接企业网关": "Connect Gateway",
    "密钥受保护": "Keys Protected",
    "刷新配置": "Refresh Config",
    "断开": "Disconnect",
    "StarCanvas账号": "StarCanvas Account",
    "随时随地开始创作": "Create Anywhere",
    "登录后可启用云备份、多设备同步、会员权益和企业私密空间。本地项目不会因为登录、退出或会员到期而被删除。": "Sign in to enable cloud backup, multi-device sync, membership benefits, and private enterprise spaces. Local projects are never deleted by sign-in, sign-out, or membership expiry.",
    "云端备份与设备恢复": "Cloud Backup & Device Recovery",
    "企业局域网与成员权限": "Enterprise LAN & Member Permissions",
    "企业密钥不进入客户端": "Enterprise Keys Stay Off Clients",
    "企业空间采用账号身份 + 局域网网关双重验证，离开企业网络后自动停止企业模型访问。": "Enterprise spaces use account identity plus LAN gateway verification. Enterprise model access stops automatically outside the enterprise network.",
    "登录方式": "Sign-in Method",
    "登录": "Sign In",
    "注册": "Register",
    "创建StarCanvas账号": "Create a StarCanvas Account",
    "欢迎回来": "Welcome Back",
    "内测阶段可通过邀请码创建账号": "Create an account with an invitation code during beta",
    "使用邮箱验证码登录": "Sign in with an email verification code",
    "账号服务暂时不可用，请稍后重试。本地画布和项目不会受到影响。": "The account service is temporarily unavailable. Local canvases and projects are unaffected.",
    "邮箱": "Email",
    "验证码": "Verification Code",
    "输入验证码": "Enter verification code",
    "获取验证码": "Get Code",
    "邀请码": "Invitation Code",
    "内测邀请码": "Beta invitation code",
    "正在验证": "Verifying",
    "注册并继续": "Register & Continue",
    "登录并继续": "Sign In & Continue",
    "或者": "or",
    "先本地使用": "Continue Locally",
    "本地模式保留完整画布、自有 API、项目与资源功能，之后可随时在设置中登录。": "Local mode keeps the full canvas, your own APIs, projects, and assets. You can sign in later from Settings.",
    "请输入有效的邮箱地址": "Enter a valid email address",
    "验证码已发送，请检查邮箱": "Verification code sent. Check your email.",
    "关闭会员权益": "Close Member Benefits",
    "StarCanvas会员": "StarCanvas Membership",
    "内测开放": "Beta Access",
    "为个人创作与团队协作提供更完整的模型和提示词能力": "Expanded model and prompt capabilities for individual creation and team collaboration",
    "会员价格每月 19.9 元": "Membership price: CNY 19.9 per month",
    "/月": "/month",
    "会员权益列表": "Member benefits list",
    "企业模型统一管理": "Centralized Enterprise Model Management",
    "企业管理员配置模型后，可统一管理所有成员的模型与使用量。": "Enterprise administrators can configure models and centrally manage model access and usage for all members.",
    "云端提示词库": "Cloud Prompt Library",
    "不受局域网限制，保存、管理和分享提示词资产。": "Save, manage, and share prompt assets without LAN restrictions.",
    "极鑫模型 85 折": "15% Off Jixin Models",
    "会员调用极鑫中转站模型享受 85 折。": "Members receive 15% off models accessed through the Jixin relay.",
    "开通会员需要内测码，详情联系 QQ：": "A beta code is required for membership. Contact QQ: ",
    "复制 QQ": "Copy QQ",
    "QQ 已复制": "QQ copied",
    "复制失败，请手动复制 QQ": "Copy failed. Copy the QQ number manually.",
    "本地免费版": "Local Free",
    "专业版": "Pro",
    "团队版": "Team",
    "企业版": "Enterprise",
    "未登录": "Signed Out",
    "暂时离线": "Temporarily Offline",
    "本机加密存储": "Encrypted Local Storage",
    "系统安全存储": "Secure System Storage",
    "旧客户端": "Legacy Client",
    "不可用": "Unavailable",
    "当前使用本地模式。登录不会移动、覆盖或删除现有画布项目。": "You are using local mode. Signing in will not move, overwrite, or delete existing canvas projects.",
    "登录后可绑定企业空间": "Sign in to connect an enterprise space",
    "本机网关": "Local Gateway",
    "企业私密空间": "Private Enterprise Space",
    "尚未绑定企业空间": "No Enterprise Space Connected",
    "可将当前电脑设为新的主网关，企业成员和配额不会被删除。": "You can make this computer the new primary gateway without deleting enterprise members or quotas.",
    "企业 API Key 只保存在局域网网关，客户端仅持有短期企业会话。": "Enterprise API keys stay on the LAN gateway. Clients only hold short-lived enterprise sessions.",
    "企业网关地址": "Enterprise Gateway Address",
    "企业邀请码": "Enterprise Invitation Code",
    "首次绑定时填写": "Required for first-time connection",
    "取消": "Cancel",
    "网关地址": "Gateway Address",
    "等待局域网地址": "Waiting for LAN address",
    "配置版本": "Config Version",
    "云端状态": "Cloud Status",
    "已激活": "Active",
    "等待激活": "Pending Activation",
    "正在运行": "Running",
    "已停止": "Stopped",
    "已验证": "Verified",
    "正在同步": "Syncing",
    "同步本机配置": "Sync Local Config",
    "停止网关": "Stop Gateway",
    "启动网关": "Start Gateway",
    "移除本机网关": "Remove Local Gateway",
    "未命名企业": "Unnamed Enterprise",
    "未知平台": "Unknown Platform",
    "StarCanvas桌面端": "StarCanvas Desktop",
    "退出账号不会删除本地项目，确定继续吗？": "Signing out will not delete local projects. Continue?",
    "移除后，当前电脑会停止企业网关并删除本机企业密钥库。企业、成员和配额仍会保留，可在本机或另一台电脑重新接管。确定继续吗？": "Removing this gateway stops it on this computer and deletes the local enterprise key store. The enterprise, members, and quotas remain available for takeover on this or another computer. Continue?",
    "配置管家": "Config Butler",
    "文本大模型": "Text Models",
    "图像大模型": "Image Models",
    "视频大模型": "Video Models",
    "音频大模型": "Audio Models",
    "音乐大模型": "Music Models",
    "即梦节点": "Seedance Node",
    "已存储统一全局配置": "Saved Unified Configs",
    "保存并切换整套模型列表、API 绑定、协议配置和接口文档链接。": "Save and switch complete model lists, API bindings, protocol configuration, and API documentation links.",
    "当前：自定义配置（空白）": "Current: Custom Config (Blank)",
    "给文档、模型，并选择统一 API 配置，自动识别并应用模型配置": "Provide documentation and a model, then choose a unified API config to detect and apply the model configuration automatically",
    "火山方舟 / 智创聚合专用": "Volcengine Ark / Zhichuang Relay",
    "收起": "Collapse",
    "展开": "Expand",
    "收起高级设置": "Collapse Advanced Settings",
    "展开全部高级设置": "Expand All Advanced Settings",
    "一站式中心网址": "One-stop Center URL",
    "在应用内打开自定义的模型服务管理网站。": "Open a custom model service management site inside the app.",
    "外部打开": "Open Externally",
    "打开": "Open",
    "恢复默认": "Restore Default",
    "由企业网关管理": "Managed by Enterprise Gateway",
    "当前配置来自企业网关。断开企业网关后，将恢复绑定前的个人配置。": "The current configuration comes from the enterprise gateway. Disconnecting restores the personal configuration used before connection.",
    "知道了": "Got It",
    "🚀 发现新版本 v": "🚀 New version v",
    "修复了一些已知问题，优化了使用体验。": "Fixed known issues and improved the experience.",
    "立即更新": "Update Now",
    "画布压力": "Canvas Load",
    "低": "Low",
    "中": "Medium",
    "高": "High",
    "过载": "Overloaded",
    "当前画布渲染压力：{label}（{pressure}%）\nFPS {fps}\n节点 {nodes}，连线 {edges}，完整 {full}，轻量 {lite}，外壳 {shell}": "Canvas rendering load: {label} ({pressure}%)\nFPS {fps}\nNodes {nodes}, edges {edges}, full {full}, lite {lite}, shells {shell}",
    "{count} 节点 · {fps} FPS": "{count} nodes · {fps} FPS",
    "个人空间": "Personal",
    "团队空间": "Team",
    "关闭工作空间": "Close Workspace",
    "个人提示词资产和局域网团队模板共享": "Personal prompt assets and LAN team templates",
    "提示词模板": "Prompt Templates",
    "功能提示词": "Function Prompts",
    "新建分组": "New Group",
    "新增功能提示词": "New Function Prompt",
    "全部模板": "All Templates",
    "未分组": "Ungrouped",
    "搜索标题、提示词、模型": "Search titles, prompts, models",
    "返回": "Back",
    "暂无提示词模板。可以先新建分组，后续从生成结果整理为模板。": "No prompt templates yet. Create a group first, then organize generated results into templates.",
    "暂无功能提示词": "No function prompts yet",
    "关闭": "Close",
    "复制": "Copy",
    "删除": "Delete",
    "启用": "Enabled",
    "添加成员": "Add Member",
    "刷新团队": "Refresh Team",
    "保存团队设置": "Save Team Settings",
    "重命名分组": "Rename Group",
    "删除分组": "Delete Group",
    "模板分组": "Template Group",
    "无结果预览": "No Preview",
    "使用": "Use",
    "存到个人": "Save to Personal",
    "发到团队": "Publish to Team",
    "复制提示词": "Copy Prompt",
    "功能提示词类型": "Function Prompt Type",
    "通用": "General",
    "本机": "This Device",
    "已开启，其他成员优先添加：": "Enabled. Other members should add:",
    "端口": "Port",
    "当前共享模板：{count} 个。可在另一台电脑浏览器打开此地址检查是否连通。": "{count} templates shared. Open this address in a browser on another computer to check the connection.",
    "其他可用地址：{urls}": "Other available addresses: {urls}",
    "如果推荐地址连不上，让对方改用同一 Wi-Fi/网线网段里的另一个 192.168/10/172 地址。": "If the recommended address does not connect, ask them to use another 192.168/10/172 address on the same Wi-Fi or wired network.",
    "未开启。Windows 首次开启如无法访问，请允许防火墙访问当前端口。": "Disabled. On Windows, allow firewall access to this port if it is not reachable the first time.",
    "错误：{message}": "Error: {message}",
    "{count} 个模板": "{count} templates",
    "连接失败：{message}": "Connection failed: {message}",
    "未知错误": "Unknown error",
    "未刷新": "Not refreshed",
    "系统错误码：{code}": "System error code: {code}",
    "移除": "Remove",
    "更换网络环境（如更换Wi-Fi频段，更换有线网，开启VPN等情况）需要关闭团队空间后关闭软件再重新开启软件与团队空间，重新复制更换后的局域网端口。": "After changing networks, such as switching Wi-Fi bands, changing wired networks, or enabling a VPN, close Team Space, quit the app, reopen both, and copy the new LAN address.",
    "关闭团队空间": "Turn Off Team Space",
    "开启团队空间": "Turn On Team Space",
    "我的团队昵称": "My Team Nickname",
    "例如：设计一号机": "Example: Design Station 1",
    "团队空间端口": "Team Space Port",
    "这是本机对外共享团队空间使用的端口；其他电脑共享时可使用各自设置的端口。": "This port is used by this device to share Team Space. Other computers can use their own configured ports.",
    "成员地址，如 192.168.1.8:39218": "Member address, e.g. 192.168.1.8:39218",
    "刷新中": "Refreshing",
    "标题": "Title",
    "提示词内容": "Prompt Content",
    "没有匹配的功能提示词": "No matching function prompts",
    "暂无团队模板。先添加成员地址并刷新，或让本机发布模板。": "No team templates yet. Add a member address and refresh, or publish templates from this device.",
    "团队空间开启失败：{message}": "Failed to start Team Space: {message}",
    "端口可能被占用或被防火墙拦截": "The port may be occupied or blocked by the firewall",
    "已复制": "Copied",
    "复制失败": "Copy failed",
    "已刷新 {count} 个成员": "Refreshed {count} members",
    "输入新的分组名称": "Enter a new group name",
    "未命名分组": "Untitled Group",
    "分组已重命名": "Group renamed",
    "删除分组“{name}”？": "Delete group \"{name}\"?",
    "该分组下 {count} 个模板会移到“未分组”。": "{count} templates in this group will move to Ungrouped.",
    "分组已删除": "Group deleted",
    "输入提示词模板分组名称": "Enter a prompt template group name",
    "新分组": "New Group",
    "新功能提示词": "New Function Prompt",
    "已删除模板": "Template deleted",
    "已从团队空间删除": "Deleted from Team Space",
    "已存到个人空间": "Saved to Personal Space",
    "团队设置已保存": "Team settings saved",
    "已保存到工作空间": "Saved to Workspace",
    "已发布到团队空间": "Published to Team Space",
    "已加入团队发布列表，开启团队空间后可被成员拉取": "Added to the team publish list. Members can fetch it after Team Space is enabled.",
    "个人提示词资产、局域网团队共享与账号云提示词库": "Personal prompts, LAN team sharing, and cloud prompt workspaces",
    "云端工作空间": "Cloud Workspace",
    "发送到": "Send to",
    "保存到本地工作空间": "Save to Local Workspace",
    "发送到企业网关团队": "Send to Enterprise Gateway Team",
    "发布到局域网团队": "Publish to LAN Team",
    "发送到云端工作空间": "Send to Cloud Workspace",
    "该模板已保存在本地工作空间": "This template is already saved locally",
    "云提示词操作失败：{message}": "Cloud prompt operation failed: {message}",
    "企业网关": "Enterprise Gateway",
    "企业网关团队": "Enterprise Gateway Team",
    "作者：团队成员": "Author: Team member",
    "作者：我": "Author: Me",
    "作者：{name}": "Author: {name}",
    "所有者": "Owner",
    "管理员": "Admin",
    "成员": "Member",
    "只读": "Read-only",
    "可编辑": "Editable",
    "可管理": "Manageable",
    "编辑": "Edit",
    "撤销": "Revoke",
    "正在同步企业团队模板": "Syncing enterprise team templates",
    "等待同步企业团队模板": "Enterprise team sync pending",
    "已连接企业网关团队": "Connected to enterprise gateway team",
    "网关离线，显示上次同步缓存": "Gateway offline; showing the last synced cache",
    "团队权限已失效，本地缓存已清理": "Team access expired; local cache cleared",
    "角色：{role} · 团队模板：{count} 个": "Role: {role} · Team templates: {count}",
    "可向当前企业网关发布模板": "Can publish to the current enterprise gateway",
    "发布权限以网关同步结果为准": "Publishing permission depends on the gateway sync result",
    "上次同步：{time}": "Last synced: {time}",
    "同步中": "Syncing",
    "刷新企业团队": "Refresh Enterprise Team",
    "连接企业网关后，会自动显示同一组织成员发布的模板。": "Connect to an enterprise gateway to automatically see templates published by organization members.",
    "个人模板不会自动共享；云端工作空间与此处相互独立。": "Personal templates are not shared automatically. Cloud workspaces remain separate.",
    "局域网兼容共享": "Legacy LAN Sharing",
    "以下设置仅用于旧版手动地址共享，不会写入云端工作空间或企业网关团队。": "These settings are only for legacy address-based sharing and do not write to cloud workspaces or enterprise gateway teams.",
    "暂无团队模板。连接企业网关后会自动同步同组织模板；也可继续使用局域网兼容共享。": "No team templates yet. Connect to an enterprise gateway for automatic organization sync, or continue using legacy LAN sharing.",
    "发送团队失败：{message}": "Failed to send to team: {message}",
    "已发送到企业网关团队": "Sent to enterprise gateway team",
    "已发布到局域网团队": "Published to LAN team",
    "已加入局域网发布列表，开启团队空间后可被成员拉取": "Added to the LAN publish list. Members can fetch it after Team Space is enabled.",
    "编辑团队模板标题": "Edit Team Template Title",
    "仅作者或企业管理员可修改": "Only the author or an enterprise administrator can edit this template",
    "编辑团队提示词": "Edit Team Prompt",
    "多行内容使用 Command/Ctrl + Enter 确认": "Press Command/Ctrl + Enter to confirm multiline content",
    "团队模板已更新": "Team template updated",
    "模板已被其他成员更新，已刷新服务器版本，未覆盖": "Another member updated this template. The server version was refreshed without overwriting it.",
    "更新团队模板失败：{message}": "Failed to update team template: {message}",
    "已从企业网关团队撤销": "Revoked from enterprise gateway team",
    "模板版本已变更，已刷新服务器版本，未删除": "The template version changed. The server version was refreshed and nothing was deleted.",
    "撤销团队模板失败：{message}": "Failed to revoke team template: {message}",
    "从企业网关团队撤销“{name}”？": "Revoke \"{name}\" from the enterprise gateway team?",
    "点击展开网络环境提示": "Show network environment guidance",
    "展开或收起网络环境提示": "Expand or collapse network environment guidance",
    "企业网关团队模板请求失败": "Enterprise gateway team template request failed",
    "企业团队模板返回的组织或网关与当前会话不一致": "The team template organization or gateway does not match the current session",
    "企业网关离线，正在显示上次同步缓存": "Enterprise gateway offline; showing the last synced cache",
    "企业团队权限已失效，本地缓存已清理": "Enterprise team access expired; local cache cleared",
    "企业网关暂时不可用，正在显示缓存": "Enterprise gateway temporarily unavailable; showing cached templates",
    "企业网关离线，未发送；重连后请重试": "Enterprise gateway offline. Nothing was sent; reconnect and try again",
  },
};

for (const language of ["zh-TW", "en-US"]) {
  Object.assign(LANGUAGE_PACKS[language], DEEP_LANGUAGE_PACKS[language] || {});
}

const TEXT_NODE_ROOTS = [
  "[data-wanjuan-i18n-root]",
  ".wanjuan-app-top-nav",
  ".wanjuan-settings-page",
  ".wanjuan-agent-page",
  ".wanjuan-account-overlay",
  ".wanjuan-membership-dialog-backdrop",
  ".wanjuan-canvas-bottom-dock-wrap",
  ".wanjuan-canvas-pressure-meter",
  ".wanjuan-canvas-top-tools",
  ".wanjuan-canvas-controls",
  ".wanjuan-canvas-minimap",
  ".wanjuan-video-node-toolbar",
  ".wanjuan-resource-toolbar",
  ".wanjuan-resource-main",
  ".wanjuan-workspace-page",
  ".react-flow__node",
  ".wanjuan-node-config-panel",
  ".wanjuan-context-flyout-panel",
  ".wanjuan-context-menu-item",
  ".wanjuan-toast",
  ".wanjuan-backup-dialog",
  ".wanjuan-project-group-dialog",
  ".wanjuan-task-drawer",
  ".wanjuan-enterprise-dialog-backdrop",
  ".wanjuan-enterprise-managed-dialog-backdrop",
  ".wanjuan-system-notification-overlay",
  ".wanjuan-tianji-points-native-overlay",
  ".wanjuan-video-fullscreen-modal",
  ".wanjuan-image-zoom-toolbar",
];

const SKIP_TEXT_SELECTOR = [
  "input",
  "textarea",
  "select",
  "script",
  "style",
  "code",
  "pre",
  "[contenteditable='true']",
  "[data-wanjuan-i18n-skip]",
  ".wanjuan-agent-page textarea",
].join(",");

const SKIP_ATTRIBUTE_SELECTOR = [
  "script",
  "style",
  "code",
  "pre",
  "[contenteditable='true']",
  "[data-wanjuan-i18n-skip]",
].join(",");

const textOriginals = new WeakMap();
const attrOriginals = new WeakMap();
const sourceKeys = new Set();
const translatedSources = new Map();
const sourcePatternMatchers = new Map();
const translatedPatternMatchers = new Map();
// 记录运行时自身写入触发的 mutation，observer 回调逐条消费，避免翻译操作自触发空转。
const selfSetAttrCounts = new WeakMap();
const selfSetTextCounts = new WeakMap();

const markSelfSetAttr = (element) => {
  selfSetAttrCounts.set(element, (selfSetAttrCounts.get(element) || 0) + 1);
};

const consumeSelfSetAttr = (element) => {
  const count = selfSetAttrCounts.get(element) || 0;
  if (!count) return false;
  if (count === 1) selfSetAttrCounts.delete(element);
  else selfSetAttrCounts.set(element, count - 1);
  return true;
};

const markSelfSetText = (node) => {
  selfSetTextCounts.set(node, (selfSetTextCounts.get(node) || 0) + 1);
};

const consumeSelfSetText = (node) => {
  const count = selfSetTextCounts.get(node) || 0;
  if (!count) return false;
  if (count === 1) selfSetTextCounts.delete(node);
  else selfSetTextCounts.set(node, count - 1);
  return true;
};
let currentLanguage = "zh-CN";
let observer = null;
let scheduled = false;
let fullRefreshPending = false;
const pendingRoots = new Set();
const languageListeners = new Set();

const escapePatternText = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const compileTemplateMatcher = (template) => {
  const keys = [];
  let cursor = 0;
  let source = "^";
  const placeholder = /\{([a-zA-Z0-9_]+)\}/g;
  let match;
  while ((match = placeholder.exec(template))) {
    source += escapePatternText(template.slice(cursor, match.index));
    source += "([\\s\\S]+?)";
    keys.push(match[1]);
    cursor = match.index + match[0].length;
  }
  source += escapePatternText(template.slice(cursor));
  source += "$";
  return keys.length ? { regex: new RegExp(source), keys } : null;
};

const renderTemplateCaptures = (template, keys, match) => {
  const values = {};
  keys.forEach((key, index) => { values[key] = match[index + 1]; });
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (token, key) =>
    values[key] == null ? token : values[key]
  );
};

const translateRegisteredPattern = (source, language) => {
  for (const matcher of sourcePatternMatchers.get(language) || []) {
    const match = matcher.regex.exec(source);
    if (match) return renderTemplateCaptures(matcher.translated, matcher.keys, match);
  }
  return "";
};

const restoreRegisteredPattern = (value) => {
  for (const matchers of translatedPatternMatchers.values()) {
    for (const matcher of matchers) {
      const match = matcher.regex.exec(value);
      if (match) return renderTemplateCaptures(matcher.source, matcher.keys, match);
    }
  }
  return "";
};

const rebuildTranslationCaches = () => {
  sourceKeys.clear();
  translatedSources.clear();
  sourcePatternMatchers.clear();
  translatedPatternMatchers.clear();
  for (const [language, pack] of Object.entries(LANGUAGE_PACKS)) {
    const sourceMatchers = [];
    const translatedMatchers = [];
    for (const [source, translated] of Object.entries(pack || {})) {
      sourceKeys.add(source);
      if (translated && !translatedSources.has(translated)) translatedSources.set(translated, source);
      const sourceMatcher = compileTemplateMatcher(source);
      const translatedMatcher = compileTemplateMatcher(translated);
      if (sourceMatcher && translatedMatcher) {
        sourceMatchers.push({ ...sourceMatcher, translated });
        translatedMatchers.push({ ...translatedMatcher, source });
      }
    }
    sourcePatternMatchers.set(language, sourceMatchers);
    translatedPatternMatchers.set(language, translatedMatchers);
  }
};

rebuildTranslationCaches();

const normalizeLanguage = (language) => {
  const raw = String(language || "").trim();
  const key = raw.toLowerCase();
  return LANGUAGE_ALIASES[key] || (LANGUAGE_PACKS[raw] ? raw : "zh-CN");
};

const getStoredLanguage = () => {
  try {
    return localStorage.getItem("appLanguage") || localStorage.getItem("uiLanguage") || "";
  } catch {
    return "";
  }
};

const missingSet = () => {
  const root = globalThis;
  if (!root.__wanjuanI18nMissing) root.__wanjuanI18nMissing = new Set();
  return root.__wanjuanI18nMissing;
};

const rememberMissing = (text, language) => {
  if (!text || language === "zh-CN") return;
  if (!/[\u4e00-\u9fff]/.test(text)) return;
  missingSet().add(`${language}:${text}`);
};

const renderedFromSource = (source, value) => {
  const normalizedSource = String(source ?? "");
  const normalizedValue = String(value ?? "");
  if (normalizedSource === normalizedValue) return true;
  return Object.entries(LANGUAGE_PACKS).some(([language, pack]) =>
    pack?.[normalizedSource] === normalizedValue || translateRegisteredPattern(normalizedSource, language) === normalizedValue
  );
};

const canonicalSource = (value) => {
  const source = String(value ?? "");
  if (sourceKeys.has(source)) return source;
  return translatedSources.get(source) || restoreRegisteredPattern(source) || source;
};

const t = (text, language = currentLanguage) => {
  const normalizedLanguage = normalizeLanguage(language);
  const source = String(text ?? "");
  if (!source || normalizedLanguage === "zh-CN") return source;
  const translated = LANGUAGE_PACKS[normalizedLanguage]?.[source] || translateRegisteredPattern(source, normalizedLanguage);
  if (!translated) rememberMissing(source, normalizedLanguage);
  return translated || source;
};

const format = (text, values = {}, language = currentLanguage) =>
  t(text, language).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) =>
    values[key] == null ? match : String(values[key])
  );

const splitWhitespace = (value) => {
  const source = String(value ?? "");
  const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return {
    lead: match?.[1] || "",
    core: match?.[2] || source,
    tail: match?.[3] || "",
  };
};

const isInUiRoot = (element) => {
  if (!element?.closest) return false;
  return TEXT_NODE_ROOTS.some((selector) => element.closest(selector));
};

const shouldSkipElement = (element) => !element || element.closest?.(SKIP_TEXT_SELECTOR);

const shouldSkipAttributeElement = (element) => !element || element.closest?.(SKIP_ATTRIBUTE_SELECTOR);

const translateTextNode = (node) => {
  const parent = node.parentElement;
  if (!parent || shouldSkipElement(parent) || !isInUiRoot(parent)) return;
  const currentValue = node.nodeValue;
  const storedOriginal = textOriginals.get(node);
  const original = storedOriginal && renderedFromSource(storedOriginal, currentValue) ?
    storedOriginal :
    canonicalSource(currentValue);
  const { lead, core, tail } = splitWhitespace(original);
  if (!core.trim()) return;
  textOriginals.set(node, original);
  const translated = t(core.trim());
  const nextValue = `${lead}${translated}${tail}`;
  if (node.nodeValue !== nextValue) {
    markSelfSetText(node);
    node.nodeValue = nextValue;
  }
};

const translateElementAttributes = (element) => {
  if (!element || shouldSkipAttributeElement(element) || !isInUiRoot(element)) return;
  const attrs = ["title", "aria-label", "placeholder"];
  let originalMap = attrOriginals.get(element);
  if (!originalMap) {
    originalMap = {};
    attrOriginals.set(element, originalMap);
  }
  attrs.forEach((attr) => {
    if (!element.hasAttribute(attr)) return;
    const currentValue = element.getAttribute(attr);
    const storedOriginal = originalMap[attr];
    const original = storedOriginal && renderedFromSource(storedOriginal, currentValue) ?
      storedOriginal :
      canonicalSource(currentValue);
    if (!original) return;
    originalMap[attr] = original;
    const translated = t(original);
    if (element.getAttribute(attr) !== translated) {
      markSelfSetAttr(element);
      element.setAttribute(attr, translated);
    }
  });
};

const translateTree = (root = document.body) => {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node);
    node = walker.nextNode();
  }
  if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root);
  root.querySelectorAll?.("[title], [aria-label], [placeholder]").forEach(translateElementAttributes);
};

const uiRootSelector = () => TEXT_NODE_ROOTS.join(",");

const elementForNode = (node) => {
  if (node?.nodeType === 1) return node;
  if (node?.nodeType === 3) return node.parentElement;
  return null;
};

const elementTouchesUiRoot = (element) => {
  if (!element) return false;
  if (isInUiRoot(element)) return true;
  const selector = uiRootSelector();
  return Boolean(element.matches?.(selector) || element.querySelector?.(selector));
};

const addPendingRoot = (node) => {
  if (fullRefreshPending) return;
  const element = elementForNode(node);
  if (!element || !elementTouchesUiRoot(element)) return;
  for (const existing of pendingRoots) {
    if (existing === element || existing.contains?.(element)) return;
    if (element.contains?.(existing)) pendingRoots.delete(existing);
  }
  pendingRoots.add(element);
};

const registeredUiRoots = () => {
  const roots = [];
  const selector = uiRootSelector();
  document.querySelectorAll?.(selector).forEach((element) => {
    if (roots.some((root) => root === element || root.contains?.(element))) return;
    for (let index = roots.length - 1; index >= 0; index--) {
      if (element.contains?.(roots[index])) roots.splice(index, 1);
    }
    roots.push(element);
  });
  return roots;
};

const flushTranslations = () => {
  scheduled = false;
  if (fullRefreshPending) {
    fullRefreshPending = false;
    pendingRoots.clear();
    registeredUiRoots().forEach(translateTree);
    return;
  }
  const roots = Array.from(pendingRoots);
  pendingRoots.clear();
  roots.forEach(translateTree);
};

const scheduleFrame = () => {
  if (scheduled) return;
  scheduled = true;
  const enqueue = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback) => setTimeout(callback, 16);
  enqueue(flushTranslations);
};

const scheduleTranslate = (root) => {
  addPendingRoot(root);
  if (pendingRoots.size) scheduleFrame();
};

const scheduleFullTranslate = () => {
  fullRefreshPending = true;
  pendingRoots.clear();
  scheduleFrame();
};

const setLanguage = (language) => {
  const nextLanguage = normalizeLanguage(language);
  const changed = currentLanguage !== nextLanguage;
  currentLanguage = nextLanguage;
  try {
    document.documentElement.dataset.wanjuanLanguage = nextLanguage;
  } catch {}
  if (changed) {
    languageListeners.forEach((listener) => {
      try { listener(); } catch {}
    });
  }
  scheduleFullTranslate();
};

const subscribe = (listener) => {
  if (typeof listener !== "function") return () => {};
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
};

const registerRoot = (selector) => {
  const normalizedSelector = String(selector || "").trim();
  if (!normalizedSelector || TEXT_NODE_ROOTS.includes(normalizedSelector)) return;
  TEXT_NODE_ROOTS.push(normalizedSelector);
  scheduleFullTranslate();
};

const addLanguagePack = (language, entries = {}) => {
  const normalizedLanguage = normalizeLanguage(language);
  LANGUAGE_PACKS[normalizedLanguage] = {
    ...(LANGUAGE_PACKS[normalizedLanguage] || {}),
    ...(entries || {}),
  };
  rebuildTranslationCaches();
  scheduleFullTranslate();
};

const install = () => {
  currentLanguage = normalizeLanguage(getStoredLanguage());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setLanguage(currentLanguage), { once: true });
  } else {
    setLanguage(currentLanguage);
  }
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        if (!consumeSelfSetAttr(mutation.target)) scheduleTranslate(mutation.target);
        continue;
      }
      if (mutation.type === "characterData") {
        if (!consumeSelfSetText(mutation.target)) scheduleTranslate(mutation.target);
        continue;
      }
      mutation.addedNodes.forEach(scheduleTranslate);
    }
  });
  const startObserver = () => {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title", "aria-label", "placeholder"],
    });
  };
  if (document.body) startObserver();
  else document.addEventListener("DOMContentLoaded", startObserver, { once: true });
};

globalThis.wanjuanI18nRuntime = {
  languagePacks: LANGUAGE_PACKS,
  normalizeLanguage,
  getLanguage: () => currentLanguage,
  subscribe,
  setLanguage,
  t,
  format,
  translateTree,
  registerRoot,
  addLanguagePack,
  install,
};

globalThis.wanjuanT = t;

install();
