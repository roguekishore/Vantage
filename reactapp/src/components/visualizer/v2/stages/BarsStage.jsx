import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * BarsStage (bars). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ value: number, tone?: string, fill?: number }[]} bars
 * @param {number} max
 * @param {{ index, label, role }[]} [pointers]
 * @param {{ from, to, tone }} [band]  (histogram / water)
 */
export default function BarsStage(props) {
  return <PlaceholderDump kind="bars" props={props} />;
}
