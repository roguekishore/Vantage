import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * MatrixStage (matrix). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ value: *, tone?: string }[][]} cells
 * @param {*[]} [rowHeaders]
 * @param {*[]} [colHeaders]
 * @param {[number, number]} [active]  [r, c]
 * @param {[number, number][]} [deps]  [r, c] cells this one depends on
 * (DP tables, boards, grids)
 */
export default function MatrixStage(props) {
  return <PlaceholderDump kind="matrix" props={props} />;
}
