/**
 * 性能档位（performance profile）定义与读取。
 *
 * 三档预设（极速/均衡/高画质）+ 自定义档，控制分层并发、AI 请求并发与渲染模式；
 * 档位存于 localStorage（wanjuanPerformanceProfile / wanjuanPerformanceCustomSettings）。
 *
 * 自 bundle 反混淆迁入，行为保持一致。
 */

export const WANJUAN_PERFORMANCE_PROFILE_STORAGE_KEY = `wanjuanPerformanceProfile`;

export const WANJUAN_PERFORMANCE_PROFILE_CUSTOM_KEY = `wanjuanPerformanceCustomSettings`;

export const WANJUAN_PERFORMANCE_PROFILE_PRESETS = {
    performance: {
      key: `performance`,
      label: `极速性能`,
      description: `低渲染负载，推荐低配电脑或大项目批量生成。`,
      layeredRunConcurrencyOptions: `1
2
3`,
      layeredRunMaxConcurrency: 2,
      aiGenerateLimit: 2,
      aiChatLimit: 1,
      aiSubmitLimit: 1,
      aiPollLimit: 1,
      renderMode: `low`,
    },
    balanced: {
      key: `balanced`,
      label: `均衡`,
      description: `默认档位，兼顾稳定和体验。`,
      layeredRunConcurrencyOptions: `2
3
5`,
      layeredRunMaxConcurrency: 3,
      aiGenerateLimit: 3,
      aiChatLimit: 2,
      aiSubmitLimit: 1,
      aiPollLimit: 2,
      renderMode: `balanced`,
    },
    quality: {
      key: `quality`,
      label: `高画质`,
      description: `更完整的预览和动画，适合高性能电脑。`,
      layeredRunConcurrencyOptions: `3
5
8`,
      layeredRunMaxConcurrency: 5,
      aiGenerateLimit: 5,
      aiChatLimit: 3,
      aiSubmitLimit: 2,
      aiPollLimit: 2,
      renderMode: `quality`,
    },
    custom: {
      key: `custom`,
      label: `自定义`,
      description: `保留手动设置的并发和渲染策略。`,
      layeredRunConcurrencyOptions: `2
3
5`,
      layeredRunMaxConcurrency: 3,
      aiGenerateLimit: 3,
      aiChatLimit: 2,
      aiSubmitLimit: 1,
      aiPollLimit: 2,
      renderMode: `custom`,
    },
  };

export const WanJuanNormalizePerformanceProfile = (value) =>
  WANJUAN_PERFORMANCE_PROFILE_PRESETS[String(value || ``).trim()] ? String(value || ``).trim() : `balanced`;

export const WanJuanReadPerformanceProfile = () => {
    try {
      return WanJuanNormalizePerformanceProfile(window.localStorage?.getItem(WANJUAN_PERFORMANCE_PROFILE_STORAGE_KEY));
    } catch {
      return `balanced`;
    }
  };

export const WanJuanPerformanceProfileList = [`performance`, `balanced`, `quality`, `custom`];
