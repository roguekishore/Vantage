import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * OpsAux (ops). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {string[]} ops
 * @param {number} active  index of the running op
 * @param {string[]} [results]
 */
export default function OpsAux(props) {
  return <PlaceholderDump kind="ops" props={props} />;
}
