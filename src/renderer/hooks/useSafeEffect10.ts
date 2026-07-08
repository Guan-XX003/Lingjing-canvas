/**
 * useSafeEffect10（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Ref, SetAny } from "../lib/app-types";

interface UseSafeEffect10Deps {
  setWanjuanViewportSize: SetAny;
  wrapperRef: Ref;
}

export function useSafeEffect10(deps: UseSafeEffect10Deps) {
  const {
    setWanjuanViewportSize,
    wrapperRef,
  } = deps;
  useEffect(() => {
      let updateViewportSize = () => {
        let rect = wrapperRef.current?.getBoundingClientRect();
        rect &&
          setWanjuanViewportSize((prev) =>
            Math.abs(prev.width - rect.width) > 1 || Math.abs(prev.height - rect.height) > 1 ?
            {
              width: rect.width,
              height: rect.height
            } :
            prev,
          );
      };
      updateViewportSize();
      if (typeof ResizeObserver == `function` && wrapperRef.current) {
        let observer = new ResizeObserver(updateViewportSize);
        observer.observe(wrapperRef.current);
        return () => observer.disconnect();
      }
      return (
        window.addEventListener(`resize`, updateViewportSize),
        () => window.removeEventListener(`resize`, updateViewportSize)
      );
    }, []);
}
