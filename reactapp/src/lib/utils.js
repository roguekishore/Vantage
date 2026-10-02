import { clsx } from "clsx";
import { extendTailwindMerge, validators } from "tailwind-merge";
import { TYPE_STEPS } from "../styles/typeScale";

/*
 * tailwind-merge 3 assumes Tailwind v4 class semantics; this app is on
 * Tailwind 3.4, and has a custom type scale. Without this config:
 *   - `text-label text-fg` would drop `text-label` (unknown names are read
 *     as colours, so the size and the colour looked like a conflict);
 *   - `outline outline-2` would drop `outline` (v4 reads bare `outline` as
 *     a 1px width; in v3 it is `outline-style: solid`), killing focus rings.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: [...TYPE_STEPS] },
    classGroups: { "outline-style": [{ outline: [""] }] },
  },
  override: {
    classGroups: {
      "outline-w": [
        { outline: [validators.isNumber, validators.isArbitraryVariableLength, validators.isArbitraryLength] },
      ],
    },
  },
});

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 * @param  {...any} inputs - Class names or conditional class objects
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
