import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * StackStage (stack). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ value: *, sub?: string, tone?: string }[]} items  top first (same shape as the stack aux)
 */
export default function StackStage(props) {
  return <PlaceholderDump kind="stack" props={props} />;
}
