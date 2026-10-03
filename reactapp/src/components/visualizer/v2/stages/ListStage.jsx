import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * ListStage (list). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ id, value, tone?: string }[]} nodes
 * @param {{ from, to, tone?: string, curved?: boolean }[]} edges
 * @param {{ nodeId, label: string, role: 1|2|3 }[]} [pointers]
 */
export default function ListStage(props) {
  return <PlaceholderDump kind="list" props={props} />;
}
