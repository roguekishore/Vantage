import { useEffect, useRef } from "react";

/** True when a key press should be left to the focused element. */
export function isTypingTarget(el) {
  if (!el || typeof el.closest !== "function") return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.closest("[contenteditable=''], [contenteditable='true'], .monaco-editor")) return true;
  if (el.closest("[role='dialog'], [role='listbox'], [role='menu'], [role='tablist']")) return true;
  return false;
}

/**
 * Window keyboard map: ArrowLeft/Right step, Space play, Home/End jump.
 * Disabled when `enabled` is false (embedded) and while typing.
 */
export function useVisualizerKeys(player, enabled) {
  const ref = useRef(player);
  ref.current = player;
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const p = ref.current;
      switch (e.key) {
        case "ArrowLeft":
          p.prev();
          break;
        case "ArrowRight":
          p.next();
          break;
        case "Home":
          p.first();
          break;
        case "End":
          p.last();
          break;
        case " ":
        case "Spacebar":
          // A focused button handles Space itself (click), do not double fire.
          if (e.target && e.target.tagName === "BUTTON") return;
          p.toggle();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

export const KEY_MAP = [
  ["Left / Right", "Previous / next step"],
  ["Space", "Play or pause"],
  ["Home / End", "First / last step"],
];
