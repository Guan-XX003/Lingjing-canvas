/**
 * 应用通用小工具：从文本提取 JSON 块、字节大小格式化、扩展工具错误格式化、主题模式规范化。
 * 均为纯函数，自 bundle 反混淆迁出，行为保持一致。
 */


export const normalizeThemeMode = (themeName) => ({
    "mist-blue": `light`,
    "chrome-blue": `light`,
    "chrome-sand": `warm-light`,
    "chrome-teal": `sage-green`,
  } [themeName] || themeName || `graphite`);

export const formatExtensionToolError = (status) => {
	    let message = status?.error || ``,
	      logPath = status?.logPath || ``;
	    return logPath ? `${message}
日志：${logPath}` : message;
	  };

export const extractJsonBlock = (text) => {
      let configText = String(text || ``).trim();
      if (!configText) throw Error(`配置管家未返回内容`);
      let codeBlockMatch = configText.match(/```json\s*([\s\S]*?)```/i) || configText.match(/```\s*([\s\S]*?)```/i);
      if (codeBlockMatch && codeBlockMatch[1]) configText = codeBlockMatch[1].trim();
      let jsonMatch = configText.match(/\{[\s\S]*\}/);
      if (jsonMatch) configText = jsonMatch[0];
      try {
        return JSON.parse(configText);
      } catch {
        throw Error(`配置管家返回的不是有效的JSON格式`);
      }
    };

export const formatStorageBytes = (value) => {
          let bytes = Number(value || 0);
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
          if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
          return `${(bytes / 1073741824).toFixed(2)} GB`;
        };
