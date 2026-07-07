// @ts-nocheck
/**
 * useSafeEffect22（自 bundle 抽出的后置 useEffect，无组件级前向引用，行为不变）。
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

export function useSafeEffect22(deps: any) {
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
