import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * CallstackStage (callstack). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ fn: string, args: *, ret?: *, status: "active"|"waiting"|"returned" }[]} frames  (same shape as the callstack aux)
 */
export default function CallstackStage(props) {
  return <PlaceholderDump kind="callstack" props={props} />;
}
