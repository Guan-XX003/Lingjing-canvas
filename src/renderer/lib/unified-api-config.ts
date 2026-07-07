/**
 * 统一 API 配置：名称推断与规范化（自 bundle 反混淆迁出，行为保持一致）。
 */


export const guessApiConfigName = (name, url) => {
      if (name) return name;
      try {
        let hostname = new URL(url).host.replace(/^www\./, ``);
        return hostname || `新配置`;
      } catch {
        return `新配置`;
      }
    };

export const normalizeUnifiedApiConfig = (config) =>
    config && typeof config == `object` ?
    {
      ...config,
      protocolFormat: String(config.protocolFormat || ``).trim() || `auto`,
    } :
    config;

export const normalizeUnifiedApiConfigs = (configs) =>
    Array.isArray(configs) ? configs.map(normalizeUnifiedApiConfig) : configs;
