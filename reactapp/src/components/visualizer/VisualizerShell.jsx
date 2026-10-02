import React from "react";
import { V, MONO, LABEL_STYLE } from "./theme";

/**
 * VisualizerShell — Full-page wrapper for algorithm visualizers.
 *
 * Applies the dark background, mono font, and proper padding.
 * Wraps the entire visualizer page to enforce consistent layout.
 *
 * @param {React.ReactNode} children – Page content
 * @param {object}          [style]  – Extra styles on the container
 */
export default function VisualizerShell({ children, style }) {
    return (
        <div
            style={{
                background: V.bg,
                minHeight: "100vh",
                color: V.text,
                fontFamily: MONO,
                padding: "32px 48px",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
