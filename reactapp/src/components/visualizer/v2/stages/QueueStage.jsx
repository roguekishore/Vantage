import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * QueueStage (queue). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {{ value: *, sub?: string, tone?: string }[]} items
 * @param {number} [head]
 * @param {number} [tail]
 * @param {number} [capacity]
 * @param {boolean} [circular]
 */
export default function QueueStage(props) {
  return <PlaceholderDump kind="queue" props={props} />;
}
