import * as React from "react";
import PlaceholderDump from "../PlaceholderDump";

/**
 * TreeStage (tree). Placeholder: W7 replaces this body, keep the props contract.
 *
 * @param {TreeNode|null} root
 * @param {(node) => TreeNode[]} [getChildren]
 * @param {(node) => string} [nodeTone]  returns a Tone
 * @param {(node) => string} [edgeTone]
 * @param {(node) => string} [badges]
 */
export default function TreeStage(props) {
  return <PlaceholderDump kind="tree" props={props} />;
}
