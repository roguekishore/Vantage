import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * CallstackAux (callstack). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ fn: string, args: *, ret?: *, status: "active"|"waiting"|"returned" }[]} frames
 */
export default function CallstackAux(props) {
  return <PlaceholderDump kind="callstack" props={props} />;
}
