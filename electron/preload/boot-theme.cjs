// 职责：启动主题解析与开机启动画面(boot splash)样式注入及主题镜像。
const { fs, os, path } = require("./runtime.cjs");
const {
  LEGACY_THEME_STORAGE_KEYS,
  BOOT_THEME_MIRROR_KEY,
  BOOT_THEME_STORAGE_KEYS,
} = require("./constants.cjs");

function mergeRecoveredApiConfigs(currentValue, recoveryValue) {
  const recoveredConfigs = Array.isArray(recoveryValue) ? recoveryValue : [];
  const firstRecoveredConfig = recoveredConfigs[0];
  if (!firstRecoveredConfig) return currentValue;
  const currentConfigs = Array.isArray(currentValue) ? currentValue : [];
  return [
    firstRecoveredConfig,
    ...currentConfigs.slice(1).filter((item) => item && item.id !== firstRecoveredConfig.id),
  ];
}

function clearLegacyThemeStorage() {
  for (const key of LEGACY_THEME_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("legacy theme storage cleanup skipped", key, error);
    }
  }
}

// 渲染进程日志：异步批量写（避免同步 IO 阻塞渲染帧），相同 type+message 一分钟内只记一次。
const rendererDebugLogState = {
  buffer: [],
  flushTimer: null,
  recent: new Map()
};

function flushRendererDebugLog() {
  rendererDebugLogState.flushTimer = null;
  if (!rendererDebugLogState.buffer.length) return;
  const lines = rendererDebugLogState.buffer.join("");
  rendererDebugLogState.buffer = [];
  try {
    const logPath = path.join(os.tmpdir(), "wanjuan-renderer-debug.log");
    fs.appendFile(logPath, lines, () => {});
  } catch {}
}

function appendRendererDebugLog(type, payload) {
  try {
    const dedupeKey = `${type}\0${String(payload?.message || "")}`;
    const now = Date.now();
    const lastSeen = rendererDebugLogState.recent.get(dedupeKey);
    if (lastSeen && now - lastSeen < 60000) return;
    rendererDebugLogState.recent.set(dedupeKey, now);
    if (rendererDebugLogState.recent.size > 200) {
      for (const [key, time] of rendererDebugLogState.recent) {
        if (now - time >= 60000) rendererDebugLogState.recent.delete(key);
      }
    }
    rendererDebugLogState.buffer.push(
      `${JSON.stringify({ time: new Date().toISOString(), type, payload })}\n`
    );
    if (!rendererDebugLogState.flushTimer) {
      rendererDebugLogState.flushTimer = setTimeout(flushRendererDebugLog, 1000);
    }
  } catch {}
}

function resolveBootThemeMode() {
  const readStoredThemeMode = () => {
    try {
      const root = document.documentElement;
      const datasetTheme = normalizeThemeValue(String(root?.dataset?.wanjuanThemeMode || "").trim().toLowerCase());
      if (datasetTheme && datasetTheme !== "graphite") return datasetTheme;
      const className = Array.from(root?.classList || []).find((item) => /^theme-/.test(item));
      const fromClass = normalizeThemeValue(className ? className.replace(/^theme-/, "") : "");
      if (fromClass && fromClass !== "graphite") return fromClass;
      const keys = BOOT_THEME_STORAGE_KEYS;
      let lsFallback = null;
      for (const key of keys) {
        const raw = String(window.localStorage.getItem(key) || "").trim().toLowerCase();
        if (raw === "system") continue;
        const normalized = normalizeThemeValue(raw);
        if (!normalized) continue;
        if (normalized !== "light") return normalized;
        if (!lsFallback) lsFallback = normalized;
      }
      if (lsFallback) return lsFallback;
      const mirroredTheme = normalizeThemeValue(window.localStorage.getItem(BOOT_THEME_MIRROR_KEY));
      if (mirroredTheme) return mirroredTheme;
      if (datasetTheme) return datasetTheme;
      if (fromClass) return fromClass;
      return "graphite";
    } catch {
      return "graphite";
    }
  };
  return readStoredThemeMode();
}

function normalizeBootThemeFromStore(store) {
  if (!store || typeof store !== "object") return null;
  let fallback = null;
  for (const key of BOOT_THEME_STORAGE_KEYS) {
    const normalized = normalizeThemeValue(store[key]);
    if (!normalized) continue;
    // Prefer specific theme over generic "light"
    if (normalized !== "light") return normalized;
    if (!fallback) fallback = normalized;
  }
  return fallback;
}

function mirrorBootThemeMode(theme) {
  const normalized = normalizeThemeValue(theme);
  if (!normalized) return;
  try {
    window.localStorage.setItem(BOOT_THEME_MIRROR_KEY, normalized);
  } catch (error) {
    console.warn("boot theme mirror skipped", error);
  }
}

function mirrorBootThemeFromStore(store) {
  const theme = normalizeBootThemeFromStore(store);
  if (theme) mirrorBootThemeMode(theme);
}

async function resolveBootThemeModeAsync(timeoutMs = 360) {
  const immediateTheme = resolveBootThemeMode();
  if (immediateTheme && immediateTheme !== "graphite") return immediateTheme;
  try {
    const storedTheme = await Promise.race([
      getDesktopStorageItems(BOOT_THEME_STORAGE_KEYS).then((store) => {
        const theme = normalizeBootThemeFromStore(store);
        if (theme) mirrorBootThemeMode(theme);
        return theme;
      }),
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
    ]);
    if (storedTheme) return storedTheme;
  } catch (error) {
    console.warn("boot theme async resolve skipped", error);
  }
  return immediateTheme || "graphite";
}

function buildBootParticleMarkup(className, count, seedOffset = 0) {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1 + seedOffset;
    const left = (seed * 17) % 100;
    const top = (seed * 29) % 100;
    const size = 4 + ((seed * 7) % 7);
    const delay = (((seed * 19) % 37) / 10).toFixed(2);
    const duration = (4.5 + ((seed * 11) % 29) / 10).toFixed(2);
    const drift = ((seed * 23) % 34) - 17;
    const sway = ((seed * 13) % 22) - 11;
    const rot = (seed * 31) % 360;
    return `<span class="${className}" style="--boot-left:${left}%;--boot-top:${top}%;--boot-size:${size}px;--boot-delay:${delay}s;--boot-duration:${duration}s;--boot-drift:${drift}px;--boot-sway:${sway}px;--boot-rot:${rot}deg"></span>`;
  }).join("");
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    appendRendererDebugLog("error", {
      message: event?.message || "",
      filename: event?.filename || "",
      lineno: event?.lineno || 0,
      colno: event?.colno || 0,
      stack: event?.error?.stack || ""
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    appendRendererDebugLog("unhandledrejection", {
      reason: String(event?.reason?.message || event?.reason || ""),
      stack: event?.reason?.stack || ""
    });
  });
}

function installBootStabilityStyle() {
  const ensureSplash = async () => {
    try {
      if (!document.body) {
        setTimeout(ensureSplash, 0);
        return;
      }
      const splashThemeClass = (theme) => `boot-theme-${String(theme || "graphite").replace(/[^a-z0-9-]/g, "")}`;
      const initialTheme = await resolveBootThemeModeAsync();
      let splash = document.getElementById("wanjuan-boot-splash");
      if (!splash) splash = document.createElement("div");
      splash.id = "wanjuan-boot-splash";
      splash.setAttribute("aria-live", "polite");
      let activeThemeClass = splashThemeClass(initialTheme);
      Array.from(splash.classList)
        .filter((className) => className.startsWith("boot-theme-"))
        .forEach((className) => splash.classList.remove(className));
      splash.classList.remove("is-leaving");
      splash.classList.add(activeThemeClass);
      const scrollStageHTML = `
        <div class="wanjuan-scroll-stage">
          <div class="wanjuan-scroll" aria-hidden="true">
            <div class="wanjuan-scroll-roll left"></div>
            <div class="wanjuan-scroll-paper">
              <div class="wanjuan-scroll-ink ink-one"></div>
              <div class="wanjuan-scroll-ink ink-two"></div>
              <div class="wanjuan-scroll-ink ink-three"></div>
              <div class="wanjuan-scroll-pen"></div>
            </div>
            <div class="wanjuan-scroll-roll right"></div>
          </div>
          <div class="wanjuan-scroll-copy">
            <div class="wanjuan-scroll-title">万卷灵境</div>
          </div>
        </div>`;
      const mintVineHTML = `<span class="mint-halo h1"></span><span class="mint-halo h2"></span><span class="mint-thread t1"></span><span class="mint-thread t2"></span><span class="mint-thread t3"></span><span class="mint-dew d1"></span><span class="mint-dew d2"></span><span class="mint-dew d3"></span><span class="mint-dew d4"></span><svg class="mint-vine-scene" viewBox="0 0 620 270" aria-hidden="true"><path class="mint-vine-main vine-left" d="M166 136 C130 132 92 116 78 91 C66 70 82 49 106 57 C129 65 126 91 105 94 C88 96 78 87 77 74"/><path class="mint-vine-main vine-right" d="M454 136 C490 132 528 116 542 91 C554 70 538 49 514 57 C491 65 494 91 515 94 C532 96 542 87 543 74"/><path class="mint-vine-main vine-left-low" d="M168 142 C132 154 98 178 85 201 C73 224 94 241 116 228 C137 216 128 190 105 194 C90 197 84 208 89 219"/><path class="mint-vine-main vine-right-low" d="M452 142 C488 154 522 178 535 201 C547 224 526 241 504 228 C483 216 492 190 515 194 C530 197 536 208 531 219"/><path class="mint-vine-branch branch-left-top" d="M138 126 C126 103 136 82 158 72"/><path class="mint-vine-branch branch-right-top" d="M482 126 C494 103 484 82 462 72"/><path class="mint-vine-branch branch-left-bottom" d="M142 154 C126 171 126 193 144 209"/><path class="mint-vine-branch branch-right-bottom" d="M478 154 C494 171 494 193 476 209"/><path class="mint-vine-curl curl-top" d="M310 80 C304 55 332 42 346 62 C359 81 331 98 316 82"/><path class="mint-vine-curl curl-bottom" d="M310 190 C317 217 286 229 273 207 C263 188 291 174 306 191"/></svg>`;
      const sandDawnHTML = `<span class="sand-sun-halo"></span><span class="sand-sun"></span><span class="sand-line l1"></span><span class="sand-line l2"></span><span class="sand-line l3"></span><span class="sand-hill h3"></span><span class="sand-hill h2"></span><span class="sand-hill h1"></span><span class="sand-hill h4"></span>`;
      const themeAnimHTML = {
        "graphite": `<div class="wanjuan-boot-atmosphere" aria-hidden="true"><div class="wanjuan-boot-scene scene-book"><span class="wanjuan-boot-orbit orbit-one"></span><span class="wanjuan-boot-orbit orbit-two"></span><span class="wanjuan-boot-orbit orbit-three"></span><span class="wanjuan-boot-book-core"></span></div></div>`,
        "chrome-rose": `<div class="wanjuan-boot-animation rose-bloom" aria-hidden="true"><span class="rose-pistil"></span><span class="rose-petal p1"></span><span class="rose-petal p2"></span><span class="rose-petal p3"></span><span class="rose-petal p4"></span><span class="rose-petal p5"></span><span class="rose-ring r1"></span><span class="rose-ring r2"></span></div>`,
        "chrome-blue": `<div class="wanjuan-boot-animation sky-scene" aria-hidden="true"><span class="sky-sun"></span><span class="sky-cloud c1"></span><span class="sky-cloud c2"></span><span class="sky-cloud c3"></span></div>`,
        "sage-green": `<div class="wanjuan-boot-animation mint-vellum" aria-hidden="true">${mintVineHTML}</div>`,
        "chrome-sand": `<div class="wanjuan-boot-animation sand-vellum" aria-hidden="true">${sandDawnHTML}</div>`,
        "dark": `<div class="wanjuan-boot-animation dark-stars" aria-hidden="true">${buildBootParticleMarkup("dark-dust", 46, 120)}<svg class="star-lines" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet"><line x1="88" y1="86" x2="154" y2="132"/><line x1="154" y1="132" x2="225" y2="96"/><line x1="154" y1="132" x2="196" y2="214"/><line x1="196" y1="214" x2="296" y2="252"/><line x1="225" y1="96" x2="315" y2="158"/><line x1="315" y1="158" x2="296" y2="252"/><line x1="104" y1="278" x2="196" y2="214"/><line x1="104" y1="278" x2="58" y2="202"/><line x1="315" y1="158" x2="354" y2="92"/></svg><span class="dark-star s1"></span><span class="dark-star s2"></span><span class="dark-star s3"></span><span class="dark-star s4"></span><span class="dark-star s5"></span><span class="dark-star s6"></span><span class="dark-star s7"></span><span class="dark-star s8"></span><span class="dark-star s9"></span><span class="dark-star s10"></span><span class="dark-star s11"></span><span class="dark-star s12"></span></div>`
      };
      themeAnimHTML["light"] = themeAnimHTML["chrome-blue"];
      themeAnimHTML["warm-light"] = themeAnimHTML["chrome-sand"];
      themeAnimHTML["chrome-teal"] = themeAnimHTML["sage-green"];
      const initializeMintVines = () => {
        splash.querySelectorAll(".mint-vine-scene path").forEach((path) => {
          try {
            const length = path.getTotalLength();
            path.style.setProperty("--vine-length", String(Math.ceil(length * 100) / 100));
          } catch {}
        });
      };
      const renderSplashHTML = (theme) => {
        const resolvedHTML = themeAnimHTML[theme] || themeAnimHTML["graphite"];
        splash.innerHTML = resolvedHTML + scrollStageHTML;
        initializeMintVines();
      };
      renderSplashHTML(initialTheme);
      if (!splash.parentElement) document.body.appendChild(splash);
      const applyThemeToSplash = (nextTheme) => {
        const nextClass = splashThemeClass(nextTheme);
        if (nextClass === activeThemeClass) return;
        splash.classList.remove(activeThemeClass);
        splash.classList.add(nextClass);
        activeThemeClass = nextClass;
        renderSplashHTML(nextTheme);
      };
      const syncThemeFromRoot = () => applyThemeToSplash(resolveBootThemeMode());
      const themeObserver = new MutationObserver(syncThemeFromRoot);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-wanjuan-theme-mode"]
      });
      syncThemeFromRoot();
      getDesktopStorageItems(BOOT_THEME_STORAGE_KEYS)
        .then((store) => {
          const fromStorage = normalizeBootThemeFromStore(store);
          if (fromStorage) {
            mirrorBootThemeMode(fromStorage);
            applyThemeToSplash(fromStorage);
          }
        })
        .catch(() => {});
      const removeWhenReady = () => {
        if (document.documentElement.classList.contains("wanjuan-booting")) return;
        splash.classList.add("is-leaving");
        // 正常路径也断开两个 observer，避免 transitionend 不触发时永久泄漏。
        observer.disconnect();
        themeObserver.disconnect();
        // 减少动态效果时没有过渡动画，直接移除，不等 transitionend。
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
          splash.remove();
          return;
        }
        setTimeout(() => splash.remove(), 360);
      };
      const observer = new MutationObserver(removeWhenReady);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      splash.addEventListener("transitionend", () => {
        if (splash.classList.contains("is-leaving")) {
          observer.disconnect();
          themeObserver.disconnect();
          splash.remove();
        }
      });
      removeWhenReady();
    } catch (error) {
      console.warn("boot splash skipped", error);
    }
  };
  const install = () => {
    try {
      const root = document.documentElement;
      if (!root) {
        setTimeout(install, 0);
        return;
      }
      root.classList.add("wanjuan-booting");
      const releaseBootingFallback = () => {
        try {
          root.classList.remove("wanjuan-booting");
          root.dataset.wanjuanBootReady = "fallback";
          const splash = document.getElementById("wanjuan-boot-splash");
          if (splash) {
            splash.classList.add("is-leaving");
            setTimeout(() => splash.remove(), 360);
          }
        } catch {}
      };
      setTimeout(releaseBootingFallback, 8000);
      window.addEventListener("load", () => setTimeout(releaseBootingFallback, 3500), { once: true });
      if (document.getElementById("wanjuan-boot-stability-style")) return;
      const style = document.createElement("style");
      style.id = "wanjuan-boot-stability-style";
      style.textContent = `
        html.wanjuan-booting,
        html.wanjuan-booting body {
          background: color-mix(in srgb, var(--wanjuan-theme-bg, #20242b) 90%, #000 10%) !important;
        }
        html.theme-graphite.wanjuan-booting,
        html.theme-graphite.wanjuan-booting body {
          background: #2b3037 !important;
        }
        html.wanjuan-booting *,
        html.wanjuan-booting *::before,
        html.wanjuan-booting *::after {
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
        }

        /* ===== BASE SPLASH ===== */
        #wanjuan-boot-splash {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: grid;
          place-items: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
          opacity: 1;
          transform: translateZ(0);
          isolation: isolate;
          contain: layout paint style;
          transition: opacity 320ms ease, transform 320ms ease !important;
        }
        #wanjuan-boot-splash * {
          pointer-events: none;
        }
        #wanjuan-boot-splash.is-leaving {
          opacity: 0;
          transform: scale(1.008);
          pointer-events: none;
        }

        /* ===== GRAPHITE (default scroll) ===== */
        #wanjuan-boot-splash.boot-theme-graphite {
          color: #f7f9fc;
          background:
            radial-gradient(circle at 50% 36%, rgba(226,232,240,0.14), transparent 34%),
            linear-gradient(180deg, #383838 0%, #2f2f2f 54%, #262626 100%);
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-boot-orbit {
          position: absolute; left: 50%; top: 43%; transform: translate(-50%,-50%);
          width: 68vmax; height: 68vmax; border-radius: 50%;
          border: 1px solid rgba(226,232,240,0.12);
          animation: wjOrbit 18s linear infinite !important;
        }
        #wanjuan-boot-splash.boot-theme-graphite .orbit-two { width: 52vmax; height: 52vmax; animation-duration: 14s !important; animation-direction: reverse !important; }
        #wanjuan-boot-splash.boot-theme-graphite .orbit-three { width: 36vmax; height: 36vmax; animation-duration: 11s !important; opacity: 0.6; }

        /* ===== CHROME-ROSE: Flower Bloom ===== */
        #wanjuan-boot-splash.boot-theme-chrome-rose {
          color: #4a2030;
          background:
            radial-gradient(ellipse 60% 50% at 50% 42%, rgba(255,159,189,0.12), transparent 50%),
            linear-gradient(180deg, #fff5f8 0%, #ffecf2 50%, #ffe4ec 100%);
        }
        #wanjuan-boot-splash .rose-bloom { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        #wanjuan-boot-splash .rose-pistil {
          position: absolute; left: 50%; top: 50%; width: 36px; height: 36px; border-radius: 50%;
          background: radial-gradient(circle, #fff 20%, #f87faa 55%, #d6476f 85%);
          box-shadow: 0 0 40px rgba(214,71,111,0.6), 0 0 80px rgba(232,105,154,0.3);
          animation: wjRosePistil 3.6s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .rose-petal {
          position: absolute; left: calc(50% - 27px); top: calc(50% - 72px); width: 54px; height: 72px;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          background: linear-gradient(160deg, rgba(255,180,210,0.95) 0%, rgba(240,100,155,0.85) 45%, rgba(200,50,100,0.6) 100%);
          transform-origin: 50% 100%;
          opacity: 0;
          animation: wjRosePetalOpen 4.2s cubic-bezier(.2,.6,.3,1) infinite !important;
        }
        #wanjuan-boot-splash .rose-petal.p1 { --petal-angle: 0deg; animation-delay: 0s !important; }
        #wanjuan-boot-splash .rose-petal.p2 { --petal-angle: 72deg; animation-delay: 0.28s !important; }
        #wanjuan-boot-splash .rose-petal.p3 { --petal-angle: 144deg; animation-delay: 0.56s !important; }
        #wanjuan-boot-splash .rose-petal.p4 { --petal-angle: 216deg; animation-delay: 0.84s !important; }
        #wanjuan-boot-splash .rose-petal.p5 { --petal-angle: 288deg; animation-delay: 1.12s !important; }
        #wanjuan-boot-splash .rose-ring {
          position: absolute; left: 50%; top: 50%; border-radius: 50%;
          border: 2px solid rgba(214,71,111,0.35);
          animation: wjRoseRing 4.2s ease-out infinite !important;
        }
        #wanjuan-boot-splash .rose-ring.r1 { width: 160px; height: 160px; margin-left: -80px; margin-top: -80px; }
        #wanjuan-boot-splash .rose-ring.r2 { width: 160px; height: 160px; margin-left: -80px; margin-top: -80px; animation-delay: -2.1s !important; }

        /* ===== LIGHT / MIST-BLUE / CHROME-BLUE: Sky & Clouds ===== */
        #wanjuan-boot-splash.boot-theme-light,
        #wanjuan-boot-splash.boot-theme-chrome-blue {
          color: #1a2a44;
          background: linear-gradient(180deg, #c8ddf8 0%, #dfeaf8 40%, #edf3fa 100%);
        }
        #wanjuan-boot-splash .sky-scene { position: absolute; inset: 0; }
        #wanjuan-boot-splash .sky-sun {
          position: absolute; left: 50%; top: 28%; width: 48px; height: 48px; border-radius: 50%;
          background: radial-gradient(circle, #fff 30%, #ffe8a0 55%, #f0c850 80%);
          box-shadow: 0 0 40px rgba(240,200,80,0.5), 0 0 80px rgba(240,200,80,0.25);
          transform: translate(-50%, -50%);
          animation: wjSkySun 4s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sky-cloud {
          position: absolute;
          width: 120px; height: 40px;
          background: rgba(255,255,255,0.85);
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(100,140,200,0.1);
          animation: wjSkyCloudDrift 8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sky-cloud::before {
          content: ""; position: absolute; bottom: 50%;
          width: 50px; height: 50px; border-radius: 50%;
          background: rgba(255,255,255,0.9);
          left: 20%;
        }
        #wanjuan-boot-splash .sky-cloud::after {
          content: ""; position: absolute; bottom: 40%;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.88);
          left: 50%;
        }
        #wanjuan-boot-splash .sky-cloud.c1 { left: 18%; top: 32%; width: 110px; height: 36px; animation-delay: 0s !important; }
        #wanjuan-boot-splash .sky-cloud.c2 { left: 55%; top: 38%; width: 140px; height: 44px; animation-delay: -2.8s !important; }
        #wanjuan-boot-splash .sky-cloud.c3 { left: 35%; top: 50%; width: 100px; height: 32px; opacity: 0.6; animation-delay: -5.2s !important; }

        /* ===== SAGE-GREEN / CHROME-TEAL: Mint Vellum ===== */
        #wanjuan-boot-splash.boot-theme-sage-green,
        #wanjuan-boot-splash.boot-theme-chrome-teal {
          color: #183a2c;
          background:
            radial-gradient(ellipse 58% 42% at 50% 40%, rgba(139,207,179,0.26), transparent 58%),
            radial-gradient(circle at 25% 22%, rgba(234,252,243,0.82), transparent 32%),
            linear-gradient(180deg, #f7fcf8 0%, #edf8f1 54%, #d9efe3 100%);
        }
        #wanjuan-boot-splash .mint-vellum,
        #wanjuan-boot-splash .sand-vellum {
          position: absolute; inset: 0; overflow: hidden;
        }
        #wanjuan-boot-splash .mint-halo,
        #wanjuan-boot-splash .mint-thread,
        #wanjuan-boot-splash .mint-dew,
        #wanjuan-boot-splash .mint-vine-scene {
          position: absolute;
        }
        #wanjuan-boot-splash .mint-halo {
          left: 50%; top: 50%; border-radius: 999px;
          border: 1px solid rgba(78,145,111,0.18);
          background: radial-gradient(ellipse, rgba(188,235,213,0.18), transparent 66%);
          animation: wjMintHalo 6.8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .mint-halo.h1 { width: 620px; height: 250px; transform: translate(-50%, -50%); }
        #wanjuan-boot-splash .mint-halo.h2 { width: 760px; height: 330px; transform: translate(-50%, -50%); animation-delay: -2.6s !important; opacity: 0.46; }
        #wanjuan-boot-splash .mint-vine-scene {
          left: 50%; top: 50%; z-index: 2;
          width: min(620px, calc(100vw - 36px)); height: 270px;
          overflow: visible;
          transform: translate(-50%, -50%);
          animation: wjMintVineFloat 5.2s 2.2s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .mint-vine-scene path {
          fill: none;
          stroke-dasharray: var(--vine-length, 1000);
          stroke-dashoffset: var(--vine-length, 1000);
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
          animation: wjMintVineGrow 1200ms cubic-bezier(.45,.02,.25,1) forwards !important;
        }
        #wanjuan-boot-splash .mint-vine-main {
          stroke: rgba(54,132,84,0.74);
          stroke-width: 4.5;
          filter: drop-shadow(0 8px 14px rgba(44,112,70,0.13));
        }
        #wanjuan-boot-splash .mint-vine-branch {
          stroke: rgba(80,160,108,0.58);
          stroke-width: 3;
          animation-duration: 950ms !important;
        }
        #wanjuan-boot-splash .mint-vine-curl {
          stroke: rgba(104,178,128,0.52);
          stroke-width: 2.4;
          animation-duration: 1080ms !important;
        }
        #wanjuan-boot-splash .vine-left { animation-delay: 820ms !important; }
        #wanjuan-boot-splash .vine-right { animation-delay: 960ms !important; }
        #wanjuan-boot-splash .vine-left-low { animation-delay: 1100ms !important; }
        #wanjuan-boot-splash .vine-right-low { animation-delay: 1240ms !important; }
        #wanjuan-boot-splash .branch-left-top { animation-delay: 1780ms !important; }
        #wanjuan-boot-splash .branch-right-top { animation-delay: 1880ms !important; }
        #wanjuan-boot-splash .branch-left-bottom { animation-delay: 1980ms !important; }
        #wanjuan-boot-splash .branch-right-bottom { animation-delay: 2080ms !important; }
        #wanjuan-boot-splash .curl-top { animation-delay: 2160ms !important; }
        #wanjuan-boot-splash .curl-bottom { animation-delay: 2300ms !important; }
        #wanjuan-boot-splash .mint-dew {
          z-index: 2;
          width: 12px; height: 12px; border-radius: 999px;
          background: radial-gradient(circle at 34% 28%, rgba(255,255,255,0.95), rgba(181,239,215,0.52) 52%, rgba(91,166,132,0.22) 100%);
          box-shadow: 0 10px 22px rgba(60,128,96,0.16);
          animation: wjMintDew 5.8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .mint-dew.d1 { left: calc(50% - 150px); top: calc(50% - 74px); animation-delay: 660ms !important; }
        #wanjuan-boot-splash .mint-dew.d2 { left: calc(50% + 154px); top: calc(50% - 82px); width: 9px; height: 9px; animation-delay: 760ms !important; }
        #wanjuan-boot-splash .mint-dew.d3 { left: calc(50% + 206px); top: calc(50% + 38px); width: 11px; height: 11px; animation-delay: 860ms !important; }
        #wanjuan-boot-splash .mint-dew.d4 { left: calc(50% - 214px); top: calc(50% + 62px); width: 8px; height: 8px; animation-delay: 960ms !important; }
        #wanjuan-boot-splash .mint-thread {
          z-index: 1;
          left: 50%; top: 50%; width: 560px; height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(72,141,104,0.28), transparent);
          transform-origin: center;
          animation: wjMintThread 7.2s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .mint-thread.t1 { transform: translate(-50%, 92px) rotate(-7deg); }
        #wanjuan-boot-splash .mint-thread.t2 { transform: translate(-50%, -122px) rotate(9deg); animation-delay: -3.5s !important; opacity: 0.58; }
        #wanjuan-boot-splash .mint-thread.t3 { transform: translate(-50%, -4px) rotate(2deg); animation-delay: -1.6s !important; opacity: 0.5; }

        /* ===== WARM-LIGHT/CHROME-SAND: Sand Vellum ===== */
        #wanjuan-boot-splash.boot-theme-chrome-sand,
        #wanjuan-boot-splash.boot-theme-warm-light {
          color: #4a351c;
          background:
            radial-gradient(ellipse 72% 36% at 56% 26%, rgba(255,226,165,0.36), transparent 62%),
            radial-gradient(ellipse 86% 44% at 50% 92%, rgba(214,149,70,0.22), transparent 62%),
            linear-gradient(180deg, #fffaf3 0%, #fbf0dd 48%, #ecd5b4 100%);
        }
        #wanjuan-boot-splash .sand-sun-halo,
        #wanjuan-boot-splash .sand-sun,
        #wanjuan-boot-splash .sand-hill,
        #wanjuan-boot-splash .sand-line {
          position: absolute;
        }
        #wanjuan-boot-splash .sand-sun-halo {
          left: 50%; top: 50%; z-index: 0;
          width: 520px; height: 520px; border-radius: 999px;
          background: radial-gradient(circle, rgba(255,238,185,0.45), rgba(220,153,70,0.12) 58%, transparent 72%);
          transform: translate(-50%, -50%);
          animation: wjSandSunHaloRise 5.6s cubic-bezier(.2,.72,.18,1) infinite !important;
        }
        #wanjuan-boot-splash .sand-sun {
          left: 50%; top: 48%; z-index: 0;
          width: min(232px, 36vw); height: min(232px, 36vw); border-radius: 999px;
          background: radial-gradient(circle at 38% 32%, #fff6d2 0 18%, #f0be5f 52%, #d88b35 100%);
          box-shadow: 0 24px 70px rgba(206,130,46,0.26);
          transform: translate(-50%, -50%);
          animation: wjSandSunRise 5.6s cubic-bezier(.2,.72,.18,1) infinite !important;
        }
        #wanjuan-boot-splash .sand-hill {
          left: 50%; bottom: 0; z-index: 2;
          width: 118%; height: 284px;
          border-radius: 52% 48% 0 0 / 58% 54% 0 0;
          background: linear-gradient(180deg, rgba(225,175,101,0.74), rgba(197,126,50,0.10));
          border-top: 2px solid rgba(151,94,37,0.20);
          transform-origin: center bottom;
          animation: wjSandHillRise 5.8s cubic-bezier(.2,.72,.18,1) infinite !important;
        }
        #wanjuan-boot-splash .sand-hill.h2 {
          z-index: 1;
          bottom: 62px; width: 126%; height: 292px; opacity: 0.64;
          background: linear-gradient(180deg, rgba(244,205,145,0.64), rgba(210,146,70,0.08));
          animation-delay: 100ms !important;
        }
        #wanjuan-boot-splash .sand-hill.h3 {
          z-index: 1;
          bottom: 128px; width: 112%; height: 260px; opacity: 0.48;
          background: linear-gradient(180deg, rgba(255,230,181,0.52), rgba(230,177,99,0.06));
          animation-delay: 200ms !important;
        }
        #wanjuan-boot-splash .sand-hill.h4 {
          z-index: 2;
          bottom: -34px; width: 92%; height: 216px; opacity: 0.82;
          background: linear-gradient(180deg, rgba(238,190,116,0.70), rgba(195,124,50,0.14));
          animation-delay: 320ms !important;
        }
        #wanjuan-boot-splash .sand-line {
          left: 50%; top: 50%; z-index: 0;
          width: min(850px, 112vw); height: 2px; border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(190,120,49,0.24), transparent);
          transform-origin: center;
          animation: wjSandLineSweep 5.8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sand-line.l1 { transform: translateX(-50%) rotate(-7deg); }
        #wanjuan-boot-splash .sand-line.l2 { transform: translateX(-50%) rotate(5deg); animation-delay: 100ms !important; }
        #wanjuan-boot-splash .sand-line.l3 { transform: translateX(-50%) rotate(-2deg); animation-delay: 220ms !important; }
        #wanjuan-boot-splash .sand-sun-haze {
          position: absolute; left: 54%; top: 25%; width: min(560px, 76vw); height: min(260px, 38vw);
          border-radius: 999px;
          background:
            radial-gradient(ellipse at 50% 50%, rgba(255,236,188,0.54), rgba(232,177,90,0.13) 56%, transparent 74%);
          transform: translate(-50%, -50%);
          filter: blur(4px);
          opacity: 0.72;
          animation: wjSandHaze 8.8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sand-glow {
          position: absolute; left: 50%; top: 62%; width: min(980px, 108vw); height: min(330px, 44vw);
          border-radius: 999px;
          background: radial-gradient(ellipse, rgba(225,167,82,0.22), rgba(229,186,117,0.10) 58%, transparent 76%);
          transform: translate(-50%, -50%);
          animation: wjSandGlow 7.2s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sand-landscape {
          position: absolute; left: 50%; bottom: -5vh;
          width: max(1180px, 116vw); height: min(520px, 58vh);
          transform: translateX(-50%);
          filter: drop-shadow(0 24px 34px rgba(142,100,55,0.10));
          overflow: visible;
        }
        #wanjuan-boot-splash .sand-dune-layer {
          transform-box: fill-box;
          transform-origin: 50% 82%;
          animation: wjSandDuneDrift 9.4s cubic-bezier(.35,.65,.25,1) infinite !important;
          will-change: transform, opacity;
        }
        #wanjuan-boot-splash .dune-back { opacity: 0.72; animation-duration: 13s !important; animation-delay: -6.8s !important; }
        #wanjuan-boot-splash .dune-mid { opacity: 0.86; animation-duration: 10.8s !important; animation-delay: -3.4s !important; }
        #wanjuan-boot-splash .dune-front { opacity: 0.98; animation-duration: 8.6s !important; animation-delay: -1.2s !important; }
        #wanjuan-boot-splash .sand-dune-fill {
          animation: wjSandDuneBreathe 7.6s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sand-ridge {
          fill: none;
          stroke: rgba(168,99,31,0.22);
          stroke-width: 2.6;
          stroke-linecap: round;
          opacity: 0.46;
          animation: wjSandRidge 6.8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .ridge-a { stroke-width: 2; opacity: 0.26; animation-delay: -2.9s !important; }
        #wanjuan-boot-splash .ridge-b { stroke-width: 2.2; animation-delay: -1.7s !important; opacity: 0.34; }
        #wanjuan-boot-splash .ridge-c { stroke-width: 2.4; animation-delay: -3.2s !important; opacity: 0.38; }
        #wanjuan-boot-splash .ridge-d { stroke-width: 1.4; animation-delay: -4.6s !important; opacity: 0.24; }
        #wanjuan-boot-splash .sand-stream {
          position: absolute;
          left: -16vw;
          width: min(760px, 82vw);
          height: 84px;
          border-radius: 999px;
          background-image:
            radial-gradient(circle, rgba(181,108,33,0.34) 0 1px, transparent 1.8px),
            radial-gradient(circle, rgba(218,151,65,0.28) 0 1.2px, transparent 2.2px),
            radial-gradient(circle, rgba(248,218,157,0.40) 0 1px, transparent 1.9px);
          background-size: 32px 18px, 54px 26px, 76px 34px;
          background-position: 0 0, 18px 8px, 42px 14px;
          filter: blur(0.2px);
          -webkit-mask-image: radial-gradient(ellipse at center, #000 0 48%, transparent 78%);
          mask-image: radial-gradient(ellipse at center, #000 0 48%, transparent 78%);
          transform: rotate(-10deg);
          transform-origin: center;
          animation: wjSandStream 6.4s cubic-bezier(.16,.74,.24,1) infinite !important;
          will-change: transform, opacity, background-position;
        }
        #wanjuan-boot-splash .sand-stream::before,
        #wanjuan-boot-splash .sand-stream::after {
          content: "";
          position: absolute;
          inset: 16% 8%;
          border-radius: inherit;
          background-image:
            radial-gradient(circle, rgba(187,112,36,0.26) 0 0.8px, transparent 1.7px),
            radial-gradient(circle, rgba(244,205,139,0.34) 0 0.9px, transparent 1.8px);
          background-size: 45px 24px, 68px 36px;
          opacity: 0.68;
          animation: wjSandStreamScatter 4.8s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .sand-stream::after {
          inset: 6% 18%;
          background-size: 58px 31px, 92px 46px;
          opacity: 0.42;
          animation-duration: 6.2s !important;
          animation-direction: reverse !important;
        }
        #wanjuan-boot-splash .stream-a { top: 27%; height: 72px; animation-delay: -0.9s !important; transform: rotate(-13deg); }
        #wanjuan-boot-splash .stream-b { top: 42%; height: 96px; width: min(920px, 104vw); animation-name: wjSandStreamLow !important; animation-duration: 7.8s !important; animation-delay: -3.3s !important; opacity: 0.68; transform: rotate(-6deg); }
        #wanjuan-boot-splash .stream-c { top: 56%; height: 58px; width: min(620px, 76vw); animation-name: wjSandStreamCurl !important; animation-duration: 5.4s !important; animation-delay: -2.1s !important; opacity: 0.54; transform: rotate(-18deg); }
        #wanjuan-boot-splash .sand-vellum::before,
        #wanjuan-boot-splash .sand-vellum::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        #wanjuan-boot-splash .sand-vellum::before {
          background-image:
            radial-gradient(circle, rgba(178,111,37,0.18) 0 1px, transparent 1.8px),
            radial-gradient(circle, rgba(222,164,83,0.18) 0 0.8px, transparent 1.6px);
          background-size: 86px 38px, 132px 64px;
          background-position: 0 0, 42px 18px;
          opacity: 0.35;
          transform: rotate(-9deg) translateX(-4vw);
          animation: wjSandMotes 9.8s linear infinite !important;
        }
        #wanjuan-boot-splash .sand-vellum::after {
          background: linear-gradient(180deg, transparent 0%, rgba(255,250,242,0.28) 46%, transparent 76%);
          opacity: 0.58;
        }
        #wanjuan-boot-splash .sand-grain {
          position: absolute; width: 4px; height: 4px; border-radius: 999px;
          background: rgba(179,105,31,0.42);
          box-shadow: 0 0 12px rgba(225,168,86,0.42);
          animation: wjSandGrain 6.2s cubic-bezier(.16,.72,.22,1) infinite !important;
          will-change: transform, opacity;
        }
        #wanjuan-boot-splash .sand-grain.g1 { left: 12%; top: 35%; }
        #wanjuan-boot-splash .sand-grain.g2 { left: 32%; top: 42%; width: 3px; height: 3px; animation-delay: -1.4s !important; }
        #wanjuan-boot-splash .sand-grain.g3 { left: 48%; top: 30%; width: 5px; height: 5px; animation-delay: -2.5s !important; }
        #wanjuan-boot-splash .sand-grain.g4 { left: 66%; top: 52%; width: 3px; height: 3px; animation-delay: -3.2s !important; }
        #wanjuan-boot-splash .sand-grain.g5 { left: 82%; top: 39%; width: 4px; height: 4px; animation-delay: -4.1s !important; }
        #wanjuan-boot-splash .sand-grain.g6 { left: 22%; top: 58%; width: 3px; height: 3px; animation-delay: -5.0s !important; }
        #wanjuan-boot-splash .sand-grain.g7 { left: 58%; top: 63%; width: 2px; height: 2px; animation-delay: -2.0s !important; }
        #wanjuan-boot-splash .sand-grain.g8 { left: 74%; top: 28%; width: 3px; height: 3px; animation-delay: -5.7s !important; }

        /* ===== DARK: Constellation Breathe ===== */
        #wanjuan-boot-splash.boot-theme-dark {
          color: #e0e8f4;
          background:
            radial-gradient(ellipse 70% 55% at 50% 42%, rgba(138,180,248,0.06), transparent 50%),
            linear-gradient(180deg, #16191f 0%, #111418 50%, #0d0f13 100%);
        }
        #wanjuan-boot-splash .dark-stars { position: absolute; inset: 0; }
        #wanjuan-boot-splash .dark-dust {
          position: absolute;
          left: var(--boot-left);
          top: var(--boot-top);
          width: var(--boot-size);
          height: var(--boot-size);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(188,214,255,0.62) 42%, transparent 72%);
          opacity: 0.38;
          transform: translate3d(-50%, -50%, 0) rotate(var(--boot-rot));
          animation: wjDustTwinkle var(--boot-duration) ease-in-out infinite !important;
          animation-delay: calc(var(--boot-delay) * -1) !important;
        }
        #wanjuan-boot-splash .star-lines {
          position: absolute; inset: 0; width: 100%; height: 100%;
          stroke: rgba(195,220,255,0.36); stroke-width: 1.2; fill: none;
          opacity: 0;
          animation: wjStarLines 6s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .dark-star {
          position: absolute; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(185,215,255,0.7) 40%, transparent 70%);
          opacity: 0.2;
        }
        #wanjuan-boot-splash .dark-star.s1 { width: 10px; height: 10px; left: 30%; top: 25%; animation: wjStarBreathe 4.8s ease-in-out infinite !important; }
        #wanjuan-boot-splash .dark-star.s2 { width: 7px; height: 7px; left: 50%; top: 40%; animation: wjStarBreathe 3.6s ease-in-out infinite !important; animation-delay: -1.2s !important; }
        #wanjuan-boot-splash .dark-star.s3 { width: 12px; height: 12px; left: 70%; top: 30%; animation: wjStarBreathe 5.4s ease-in-out infinite !important; animation-delay: -2.4s !important; }
        #wanjuan-boot-splash .dark-star.s4 { width: 8px; height: 8px; left: 45%; top: 65%; animation: wjStarBreathe 4.2s ease-in-out infinite !important; animation-delay: -0.8s !important; }
        #wanjuan-boot-splash .dark-star.s5 { width: 14px; height: 14px; left: 75%; top: 70%; animation: wjStarBreathe 5.8s ease-in-out infinite !important; animation-delay: -3.2s !important; }
        #wanjuan-boot-splash .dark-star.s6 { width: 6px; height: 6px; left: 25%; top: 55%; animation: wjStarBreathe 3.8s ease-in-out infinite !important; animation-delay: -1.8s !important; }
        #wanjuan-boot-splash .dark-star.s7 { width: 5px; height: 5px; left: 80%; top: 55%; animation: wjStarBreathe 4.4s ease-in-out infinite !important; animation-delay: -2.8s !important; }
        #wanjuan-boot-splash .dark-star.s8 { width: 9px; height: 9px; left: 14%; top: 36%; animation: wjStarBreathe 4.6s ease-in-out infinite !important; animation-delay: -1.4s !important; }
        #wanjuan-boot-splash .dark-star.s9 { width: 11px; height: 11px; left: 62%; top: 18%; animation: wjStarBreathe 5.1s ease-in-out infinite !important; animation-delay: -2.0s !important; }
        #wanjuan-boot-splash .dark-star.s10 { width: 8px; height: 8px; left: 88%; top: 30%; animation: wjStarBreathe 4.1s ease-in-out infinite !important; animation-delay: -0.6s !important; }
        #wanjuan-boot-splash .dark-star.s11 { width: 10px; height: 10px; left: 16%; top: 78%; animation: wjStarBreathe 5.6s ease-in-out infinite !important; animation-delay: -3.6s !important; }
        #wanjuan-boot-splash .dark-star.s12 { width: 7px; height: 7px; left: 58%; top: 82%; animation: wjStarBreathe 3.9s ease-in-out infinite !important; animation-delay: -2.2s !important; }

        /* ===== SCROLL STAGE (shared) ===== */
        #wanjuan-boot-splash .wanjuan-scroll-stage {
          position: relative; z-index: 1;
          width: min(440px, calc(100vw - 56px));
          display: flex; flex-direction: column; align-items: center; gap: 22px; padding: 8px 0;
          animation: wjStageIn 520ms cubic-bezier(.2,.8,.2,1) both !important;
        }
        #wanjuan-boot-splash.boot-theme-sage-green .wanjuan-scroll-stage,
        #wanjuan-boot-splash.boot-theme-chrome-teal .wanjuan-scroll-stage,
        #wanjuan-boot-splash.boot-theme-chrome-sand .wanjuan-scroll-stage,
        #wanjuan-boot-splash.boot-theme-warm-light .wanjuan-scroll-stage {
          z-index: 3;
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-stage {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(50% - 84px);
          gap: 28px;
          margin: 0 auto;
        }
        #wanjuan-boot-splash .wanjuan-scroll { position: relative; width: 372px; max-width: calc(100vw - 80px); height: 142px; display: flex; align-items: center; justify-content: center; }
        #wanjuan-boot-splash:not(.boot-theme-graphite):not(.boot-theme-sage-green):not(.boot-theme-chrome-teal):not(.boot-theme-chrome-sand):not(.boot-theme-warm-light) .wanjuan-scroll {
          opacity: 0; height: 0; overflow: hidden; pointer-events: none;
        }
        #wanjuan-boot-splash .wanjuan-scroll-paper {
          position: relative; z-index: 1; width: 294px; height: 112px; overflow: hidden;
          border: 1px solid rgba(56,111,83,0.18); border-left: 0; border-right: 0;
          background:
            linear-gradient(90deg, rgba(255,255,255,0.34), #eef8f2 15%, #d5ecdf 50%, #eef8f2 85%, rgba(255,255,255,0.28)),
            repeating-linear-gradient(0deg, rgba(56,111,83,0.08) 0 1px, transparent 1px 12px);
          box-shadow: 0 24px 58px rgba(31,86,55,0.14);
          transform-origin: center;
          animation: wjPaperOpen 980ms cubic-bezier(.2,.78,.18,1) both !important;
        }
        #wanjuan-boot-splash .wanjuan-scroll-roll {
          position: relative; z-index: 2; width: 34px; height: 126px; border-radius: 18px;
          background: linear-gradient(90deg, rgba(255,255,255,0.82), #9dccb4 42%, #5f9f7e 64%, rgba(244,255,250,0.50));
          box-shadow: 0 16px 38px rgba(43,112,75,0.20);
          animation: wjRollSettle 980ms cubic-bezier(.2,.78,.18,1) both !important;
        }
        #wanjuan-boot-splash .wanjuan-scroll-roll.left { margin-right: -2px; }
        #wanjuan-boot-splash .wanjuan-scroll-roll.right { margin-left: -2px; }
        #wanjuan-boot-splash .wanjuan-scroll-ink {
          position: absolute; left: 54px; height: 3px; border-radius: 999px;
          background: linear-gradient(90deg, rgba(35,86,61,0.90), rgba(91,169,126,0.42));
          transform-origin: left center; transform: scaleX(0); opacity: 0.9;
          animation: wjInkWrite 1.9s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash .wanjuan-scroll-ink.ink-one { top: 34px; width: 168px; animation-delay: 720ms !important; }
        #wanjuan-boot-splash .wanjuan-scroll-ink.ink-two { top: 55px; width: 118px; animation-delay: 920ms !important; }
        #wanjuan-boot-splash .wanjuan-scroll-ink.ink-three { top: 76px; width: 146px; animation-delay: 1120ms !important; }
        #wanjuan-boot-splash .wanjuan-scroll-pen { display: none; }
        #wanjuan-boot-splash.boot-theme-chrome-sand .wanjuan-scroll-paper,
        #wanjuan-boot-splash.boot-theme-warm-light .wanjuan-scroll-paper {
          border-color: rgba(146,92,39,0.20);
          background:
            linear-gradient(90deg, rgba(255,250,236,0.30), #fff4dd 15%, #edd5ad 50%, #fff4dd 85%, rgba(255,250,236,0.28)),
            repeating-linear-gradient(0deg, rgba(123,77,31,0.08) 0 1px, transparent 1px 12px);
          box-shadow: 0 24px 58px rgba(95,57,24,0.14);
        }
        #wanjuan-boot-splash.boot-theme-chrome-sand .wanjuan-scroll-roll,
        #wanjuan-boot-splash.boot-theme-warm-light .wanjuan-scroll-roll {
          background: linear-gradient(90deg, rgba(255,250,238,0.82), #e0b878 42%, #a36629 64%, rgba(255,244,218,0.44));
          box-shadow: 0 16px 38px rgba(95,57,24,0.20);
        }
        #wanjuan-boot-splash.boot-theme-chrome-sand .wanjuan-scroll-ink,
        #wanjuan-boot-splash.boot-theme-warm-light .wanjuan-scroll-ink {
          background: linear-gradient(90deg, rgba(112,68,28,0.92), rgba(209,138,59,0.44));
        }
        #wanjuan-boot-splash .wanjuan-scroll-copy { text-align: center; }
        #wanjuan-boot-splash .wanjuan-scroll-title {
          font-size: 20px !important;
          line-height: 1.25 !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
        }
        #wanjuan-boot-splash.boot-theme-sage-green .wanjuan-scroll-title,
        #wanjuan-boot-splash.boot-theme-chrome-teal .wanjuan-scroll-title {
          font-size: 20px !important;
          line-height: 1.25 !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
        }
        #wanjuan-boot-splash .wanjuan-scroll-subtitle { margin-top: 8px; font-size: 13px; line-height: 1.4; opacity: 0.68; }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-copy { text-shadow: 0 1px 14px rgba(5,8,12,0.32); }

        /* Graphite scroll visuals */
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-paper {
          position: relative; z-index: 1; width: 294px; height: 112px; overflow: hidden;
          border: 1px solid rgba(214,220,228,0.38); border-left: 0; border-right: 0;
          background: linear-gradient(90deg, rgba(232,234,237,0.08), #dedede 13%, #cfcfcf 50%, #dedede 87%, rgba(232,234,237,0.08)), repeating-linear-gradient(0deg, rgba(45,45,45,0.09) 0 1px, transparent 1px 9px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.46) inset, 0 -1px 0 rgba(32,32,32,0.2) inset, 0 18px 42px rgba(8,8,8,0.26);
          animation: wjPaperOpen 980ms cubic-bezier(.2,.78,.18,1) both !important;
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-roll {
          position: relative; z-index: 2; width: 34px; height: 126px; border-radius: 18px;
          background: linear-gradient(90deg, rgba(244,244,244,0.54), #9a9a9a 42%, #5a5a5a 64%, rgba(238,238,238,0.32));
          box-shadow: 0 14px 30px rgba(8,8,8,0.32), 0 0 0 1px rgba(246,246,246,0.28) inset;
          animation: wjRollSettle 980ms cubic-bezier(.2,.78,.18,1) both !important;
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-roll.left { margin-right: -2px; }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-roll.right { margin-left: -2px; }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-ink {
          position: absolute; left: 54px; height: 3px; border-radius: 999px;
          background: linear-gradient(90deg, rgba(42,42,42,0.92), rgba(96,96,96,0.58));
          transform-origin: left center; transform: scaleX(0); opacity: 0.9;
          animation: wjInkWrite 1.9s ease-in-out infinite !important;
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-ink.ink-one { top: 34px; width: 168px; animation-delay: 720ms !important; }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-ink.ink-two { top: 55px; width: 118px; animation-delay: 920ms !important; }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-ink.ink-three { top: 76px; width: 146px; animation-delay: 1120ms !important; }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-pen {
          display: block;
          position: absolute; z-index: 3; top: 25px; left: 58px; width: 86px; height: 13px; border-radius: 999px;
          background: linear-gradient(90deg, #eeeeee, #979797 42%, #343434);
          box-shadow: 0 6px 14px rgba(7,7,7,0.28), 0 0 0 1px rgba(255,255,255,0.24) inset;
          transform-origin: 88% 50%;
          animation: wjPenWrite 1.9s ease-in-out infinite !important; animation-delay: 720ms !important;
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-pen::before {
          content: ""; position: absolute; left: -13px; top: 50%; width: 0; height: 0;
          border-top: 7px solid transparent; border-bottom: 7px solid transparent;
          border-right: 16px solid #dddddd; transform: translateY(-50%);
        }
        #wanjuan-boot-splash.boot-theme-graphite .wanjuan-scroll-pen::after {
          content: ""; position: absolute; left: -18px; top: 50%; width: 6px; height: 6px;
          border-radius: 50%; background: rgba(31,31,31,0.86); transform: translateY(-50%);
        }

        /* ===== KEYFRAMES ===== */
        @keyframes wjOrbit { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes wjStageIn { from { opacity: 0; transform: translateY(8px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes wjPaperOpen { 0% { transform: scaleX(0.04); opacity: 0.72; } 58% { opacity: 1; } 100% { transform: scaleX(1); opacity: 1; } }
        @keyframes wjRollSettle { 0% { transform: scaleX(1.18); } 100% { transform: scaleX(1); } }
        @keyframes wjInkWrite { 0%,14% { transform: scaleX(0); opacity: 0; } 34%,74% { transform: scaleX(1); opacity: 0.82; } 100% { transform: scaleX(1); opacity: 0.35; } }
        @keyframes wjPenWrite {
          0%,12% { transform: translate3d(0,0,0) rotate(-14deg); opacity: 0; }
          18% { opacity: 1; } 36% { transform: translate3d(156px,0,0) rotate(-9deg); }
          43% { transform: translate3d(34px,21px,0) rotate(-14deg); } 62% { transform: translate3d(116px,21px,0) rotate(-9deg); }
          69% { transform: translate3d(42px,42px,0) rotate(-14deg); } 86% { transform: translate3d(140px,42px,0) rotate(-9deg); }
          100% { transform: translate3d(140px,42px,0) rotate(-9deg); opacity: 0; }
        }

        /* Rose keyframes */
        @keyframes wjRosePistil { 0%,100% { transform: translate(-50%,-50%) scale(1); box-shadow: 0 0 40px rgba(214,71,111,0.6), 0 0 80px rgba(232,105,154,0.3); } 50% { transform: translate(-50%,-50%) scale(1.2); box-shadow: 0 0 60px rgba(214,71,111,0.8), 0 0 100px rgba(232,105,154,0.4); } }
        @keyframes wjRosePetalOpen {
          0% { opacity: 0; transform: rotate(var(--petal-angle)) translateY(-12px) scale(0.2); }
          20% { opacity: 0.92; transform: rotate(var(--petal-angle)) translateY(-52px) scale(0.85); }
          50% { opacity: 0.95; transform: rotate(var(--petal-angle)) translateY(-68px) scale(1); }
          80% { opacity: 0.7; transform: rotate(var(--petal-angle)) translateY(-74px) scale(1.02); }
          100% { opacity: 0; transform: rotate(var(--petal-angle)) translateY(-80px) scale(0.9); }
        }
        @keyframes wjRoseRing {
          0% { transform: scale(0.3); opacity: 0.7; border-color: rgba(214,71,111,0.5); }
          100% { transform: scale(2.8); opacity: 0; border-color: rgba(214,71,111,0.02); }
        }

        /* Sky keyframes */
        @keyframes wjSkySun { 0%,100% { transform: translate(-50%,-50%) scale(1); box-shadow: 0 0 40px rgba(240,200,80,0.5), 0 0 80px rgba(240,200,80,0.25); } 50% { transform: translate(-50%,-50%) scale(1.08); box-shadow: 0 0 56px rgba(240,200,80,0.65), 0 0 100px rgba(240,200,80,0.35); } }
        @keyframes wjSkyCloudDrift {
          0% { transform: translateX(0); opacity: 0.85; }
          50% { transform: translateX(20px); opacity: 0.95; }
          100% { transform: translateX(0); opacity: 0.85; }
        }

        /* Mint keyframes */
        @keyframes wjMintHalo {
          0%,100% { opacity: 0.34; transform: translate(-50%, -50%) scale(0.92); }
          48% { opacity: 0.78; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes wjMintVineGrow {
          from { stroke-dashoffset: var(--vine-length, 1000); opacity: 0.2; }
          12% { opacity: 1; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes wjMintVineFloat {
          0%,100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-4px); }
        }
        @keyframes wjMintDew {
          0%,100% { opacity: 0.24; transform: translate3d(0, 9px, 0) scale(0.72); }
          42% { opacity: 0.95; transform: translate3d(0, -5px, 0) scale(1.08); }
          68% { opacity: 0.72; transform: translate3d(0, -12px, 0) scale(0.94); }
        }
        @keyframes wjMintThread {
          0%,100% { opacity: 0; clip-path: inset(0 100% 0 0); }
          22% { opacity: 0.52; clip-path: inset(0 24% 0 24%); }
          58% { opacity: 0.36; clip-path: inset(0 0 0 0); }
          86% { opacity: 0; clip-path: inset(0 0 0 100%); }
        }

        /* Sand keyframes */
        @keyframes wjSandSunRise {
          0% { opacity: 0; transform: translate(-50%, calc(-50% + 188px)) scale(0.62); }
          24% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          72% { opacity: 1; transform: translate(-50%, calc(-50% - 54px)) scale(1.04); }
          100% { opacity: 0.86; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes wjSandSunHaloRise {
          0% { opacity: 0; transform: translate(-50%, calc(-50% + 134px)) scale(0.66); }
          26% { opacity: 0.72; transform: translate(-50%, -50%) scale(1); }
          74% { opacity: 0.84; transform: translate(-50%, -50%) scale(1.14); }
          100% { opacity: 0.54; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes wjSandHillRise {
          0% { opacity: 0; transform: translate(-50%, 86px) scaleY(0.08); }
          28% { opacity: 1; transform: translate(-50%, 0) scaleY(1); }
          72% { opacity: 1; transform: translate(-50%, -18px) scaleY(1); }
          100% { opacity: 0.86; transform: translate(-50%, 0) scaleY(1); }
        }
        @keyframes wjSandLineSweep {
          0% { opacity: 0; clip-path: inset(0 100% 0 0); }
          24% { opacity: 0.5; clip-path: inset(0 18% 0 18%); }
          68% { opacity: 0.32; clip-path: inset(0 0 0 0); }
          100% { opacity: 0; clip-path: inset(0 0 0 100%); }
        }
        @keyframes wjSandHaze {
          0%,100% { opacity: 0.56; transform: translate(-51%, -50%) scale(0.96); }
          48% { opacity: 0.86; transform: translate(-49%, -51%) scale(1.06); }
        }
        @keyframes wjSandGlow {
          0%,100% { opacity: 0.36; transform: translate(-50%, -50%) scale(0.96); }
          46% { opacity: 0.72; transform: translate(-50%, -51%) scale(1.08); }
        }
        @keyframes wjSandDuneDrift {
          0%,100% { transform: translate3d(-22px, 4px, 0) scaleY(0.99); }
          46% { transform: translate3d(20px, -5px, 0) scaleY(1.018); }
          74% { transform: translate3d(8px, 1px, 0) scaleY(1.004); }
        }
        @keyframes wjSandDuneBreathe {
          0%,100% { opacity: 0.74; }
          50% { opacity: 1; }
        }
        @keyframes wjSandRidge {
          0%,100% { stroke-dasharray: 140 1120; stroke-dashoffset: 280; opacity: 0.14; }
          42% { stroke-dasharray: 620 700; stroke-dashoffset: -120; opacity: 0.46; }
          72% { stroke-dasharray: 360 980; stroke-dashoffset: -320; opacity: 0.26; }
        }
        @keyframes wjSandStream {
          0% {
            opacity: 0;
            background-position: 0 0, 18px 8px, 42px 14px;
            transform: translate3d(-22vw, 30px, 0) rotate(-13deg) scale(0.74);
          }
          20% {
            opacity: 0.58;
            transform: translate3d(5vw, 2px, 0) rotate(-9deg) scale(0.94);
          }
          58% {
            opacity: 0.42;
            background-position: 122px 34px, 188px -18px, 254px 44px;
            transform: translate3d(42vw, -26px, 0) rotate(-16deg) scale(1.04);
          }
          100% {
            opacity: 0;
            background-position: 260px 68px, 344px -44px, 506px 82px;
            transform: translate3d(112vw, -64px, 0) rotate(-11deg) scale(0.80);
          }
        }
        @keyframes wjSandStreamLow {
          0% { opacity: 0; background-position: 16px 24px, 40px 0, 12px 32px; transform: translate3d(-24vw, -10px, 0) rotate(-5deg) scale(0.82); }
          24% { opacity: 0.5; transform: translate3d(8vw, 18px, 0) rotate(-8deg) scale(0.98); }
          62% { opacity: 0.36; background-position: 176px -18px, 126px 52px, 310px -8px; transform: translate3d(50vw, 4px, 0) rotate(-3deg) scale(1.08); }
          100% { opacity: 0; background-position: 340px -52px, 260px 96px, 520px -42px; transform: translate3d(120vw, 34px, 0) rotate(-9deg) scale(0.78); }
        }
        @keyframes wjSandStreamCurl {
          0% { opacity: 0; background-position: 0 30px, 28px 4px, 54px 18px; transform: translate3d(-18vw, 56px, 0) rotate(-18deg) scale(0.62); }
          18% { opacity: 0.48; transform: translate3d(4vw, 18px, 0) rotate(-21deg) scale(0.88); }
          50% { opacity: 0.34; background-position: 72px -20px, 154px 44px, 92px -12px; transform: translate3d(36vw, -8px, 0) rotate(-12deg) scale(1.02); }
          76% { opacity: 0.22; transform: translate3d(66vw, 20px, 0) rotate(-24deg) scale(0.92); }
          100% { opacity: 0; background-position: 180px -54px, 286px 82px, 220px -38px; transform: translate3d(104vw, -22px, 0) rotate(-16deg) scale(0.66); }
        }
        @keyframes wjSandStreamScatter {
          0%,100% {
            transform: translate3d(-18px, 8px, 0) rotate(2deg);
            background-position: 0 0, 18px 12px;
          }
          45% {
            transform: translate3d(24px, -12px, 0) rotate(-4deg);
            background-position: 82px -24px, -36px 30px;
          }
          72% {
            transform: translate3d(6px, 16px, 0) rotate(5deg);
            background-position: 128px 18px, 44px -18px;
          }
        }
        @keyframes wjSandMotes {
          from { background-position: 0 0, 42px 18px; transform: rotate(-9deg) translate3d(-7vw, 0, 0); }
          to { background-position: 360px 70px, 520px 114px; transform: rotate(-9deg) translate3d(7vw, -2vh, 0); }
        }
        @keyframes wjSandGrain {
          0% { opacity: 0; transform: translate3d(-42px, 34px, 0) scale(0.58); }
          22% { opacity: 0.72; transform: translate3d(18px, 6px, 0) scale(1); }
          64% { opacity: 0.44; transform: translate3d(86px, -34px, 0) scale(0.88); }
          100% { opacity: 0; transform: translate3d(150px, -70px, 0) scale(0.5); }
        }

        /* Dark keyframes */
        @keyframes wjStarBreathe { 0%,100% { opacity: 0.1; transform: scale(0.7); box-shadow: none; } 50% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 20px rgba(185,215,255,0.6); } }
        @keyframes wjStarLines { 0%,100% { opacity: 0; } 30%,70% { opacity: 1; } }
        @keyframes wjDustTwinkle {
          0%,100% { opacity: 0.22; transform: translate3d(-50%, -50%, 0) translateX(0) scale(0.78); }
          50% { opacity: 0.72; transform: translate3d(-50%, -50%, 0) translateX(var(--boot-drift)) scale(1.12); }
        }
      `;      (document.head || root).appendChild(style);
      ensureSplash();
    } catch (error) {
      console.warn("boot stability style skipped", error);
    }
  };
  install();
}

function applyInitialThemeClass(theme = "graphite") {
  try {
    const root = document.documentElement;
    if (!root) return;
    root.classList.remove(
      "theme-dark",
      "theme-light",
      "theme-warm-light",
      "theme-mist-blue",
      "theme-chrome-blue",
      "theme-chrome-rose",
      "theme-chrome-sand",
      "theme-chrome-teal",
      "theme-sage-green",
      "theme-graphite"
    );
    root.classList.add(`theme-${theme || "graphite"}`);
  } catch (error) {
    console.warn("initial theme class apply skipped", error);
  }
}

// 判断某个存储值是否“有内容”（数组非空 / 字符串非空白 / 对象有键 / 非 null）。
// 源 preload.cjs 行 1277，被 legacy-data 的恢复逻辑复用。
function hasStoredValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null;
}

module.exports = {
  mergeRecoveredApiConfigs,
  clearLegacyThemeStorage,
  appendRendererDebugLog,
  resolveBootThemeMode,
  normalizeBootThemeFromStore,
  mirrorBootThemeMode,
  mirrorBootThemeFromStore,
  resolveBootThemeModeAsync,
  buildBootParticleMarkup,
  installBootStabilityStyle,
  applyInitialThemeClass,
  hasStoredValue,
};

var { normalizeThemeValue } = require("./legacy-data.cjs");
var { getDesktopStorageItems } = require("./storage.cjs");
