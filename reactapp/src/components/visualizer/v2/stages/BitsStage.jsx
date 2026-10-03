import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * BitsStage (bits). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ label: string, value: number, bits: number, bitTone?: (i: number) => string }[]} rows
 */
export default function BitsStage(props) {
  return <PlaceholderDump kind="bits" props={props} />;
}
