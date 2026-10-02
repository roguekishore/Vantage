import React, { lazy } from "react";

/**
 * Legacy visualizer boundary (POLISH_PLAN §3.4).
 *
 * The global radius reset in src/styles/tokens.css skips `[data-legacy-viz] *`
 * so not-yet-migrated visualizers keep their circular graph/tree/list nodes.
 *
 * The decision reads a marker on the component itself, so it can't drift from
 * reality: components produced by `defineVisualizer()` set the static flag
 *
 *     Component.isVisualizerV2 = true;
 *
 * and render without the wrapper. Everything else is legacy. Visualizers are
 * React.lazy() components, whose real component is only known once the module
 * loads, so the check runs inside the lazy factory (`lazyVisualizer`).
 * Use `lazyVisualizer` wherever a visualizer module is lazy-loaded (routes,
 * judge drawer). The wrapper uses `display: contents`, so it adds no box.
 */
export function LegacyVizRoot({ children }) {
  return (
    <div data-legacy-viz="" style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export function isVisualizerV2(Component) {
  return Boolean(Component && Component.isVisualizerV2 === true);
}

export function withLegacyViz(Component) {
  if (isVisualizerV2(Component)) return Component;
  function LegacyVisualizer(props) {
    return (
      <LegacyVizRoot>
        <Component {...props} />
      </LegacyVizRoot>
    );
  }
  LegacyVisualizer.displayName = `LegacyViz(${Component.displayName || Component.name || "Visualizer"})`;
  return LegacyVisualizer;
}

export function lazyVisualizer(factory) {
  return lazy(() =>
    factory().then((mod) => ({ ...mod, default: withLegacyViz(mod.default) }))
  );
}
