/**
 * useSafeEffect22（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { ProtocolRegistry, SetAny } from "../lib/app-types";

interface UseSafeEffect22Deps {
  activeProtocolName: any;
  modelProtocolRegistry: ProtocolRegistry;
  setActiveProtocolConfigText: SetAny;
  setActiveProtocolName: SetAny;
  setProtocolNamesText: SetAny;
}

export function useSafeEffect22(deps: UseSafeEffect22Deps) {
  const {
    activeProtocolName,
    modelProtocolRegistry,
    setActiveProtocolConfigText,
    setActiveProtocolName,
    setProtocolNamesText,
  } = deps;
  useEffect(() => {
    let protocolNames = Object.keys(modelProtocolRegistry || {});
    setProtocolNamesText(protocolNames.join(`
`));
    protocolNames.length === 0 ?
      (setActiveProtocolName(``), setActiveProtocolConfigText(`{}`)) :
      (!activeProtocolName || !modelProtocolRegistry[activeProtocolName]) &&
      (setActiveProtocolName(protocolNames[0]),
        setActiveProtocolConfigText(
          JSON.stringify(modelProtocolRegistry[protocolNames[0]], null, 2),
        ));
  }, [modelProtocolRegistry]);
}
