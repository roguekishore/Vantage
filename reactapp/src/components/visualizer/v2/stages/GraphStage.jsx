import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * GraphStage (graph). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ id, label, tone?: string, x?: number, y?: number }[]} nodes  shell lays out if x/y absent
 * @param {{ from, to, weight?: number, tone?: string }[]} edges
 * @param {boolean} directed
 */
export default function GraphStage(props) {
  return <PlaceholderDump kind="graph" props={props} />;
}
