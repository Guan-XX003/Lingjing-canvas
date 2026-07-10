import { useCallback, useEffect, useRef, useState } from "react";

type MediaKind = "video" | "audio";
type MediaSlot = { id: string; touchedAt: number; evict: () => void };

const slots: Record<MediaKind, Map<string, MediaSlot>> = {
  video: new Map(),
  audio: new Map(),
};
const limits: Record<MediaKind, number> = { video: 4, audio: 2 };

const claimSlot = (kind: MediaKind, id: string, evict: () => void) => {
  const registry = slots[kind];
  registry.delete(id);
  while (registry.size >= limits[kind]) {
    const oldest = [...registry.values()].sort((a, b) => a.touchedAt - b.touchedAt)[0];
    if (!oldest) break;
    registry.delete(oldest.id);
    oldest.evict();
  }
  registry.set(id, { id, touchedAt: Date.now(), evict });
};

const releaseSlot = (kind: MediaKind, id: string) => slots[kind].delete(id);

export const useWanJuanMediaBudget = (kind: MediaKind, id: string, requested: boolean) => {
  const [enabled, setEnabled] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
    releaseSlot(kind, id);
  }, [kind, id]);
  const activate = useCallback(() => {
    claimSlot(kind, id, () => mountedRef.current && setEnabled(false));
    if (mountedRef.current) setEnabled(true);
  }, [kind, id]);
  useEffect(() => {
    if (requested) activate();
    else {
      releaseSlot(kind, id);
      setEnabled(false);
    }
  }, [activate, id, kind, requested]);
  return { enabled, activate };
};

export const wanjuanMediaBudgetSnapshot = () => ({ video: slots.video.size, audio: slots.audio.size });
