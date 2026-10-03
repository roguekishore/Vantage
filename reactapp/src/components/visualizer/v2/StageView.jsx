import * as React from "react";
import { STAGES, AUX } from "./stages";

class Boundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <p role="alert" className="border border-err bg-err-soft p-3 font-mono text-small text-fg">
          This step could not be drawn: {String(this.state.error.message || this.state.error)}
        </p>
      );
    }
    return this.props.children;
  }
}

function AuxPanel({ spec, step, input, mode }) {
  const C = AUX[spec.kind];
  if (!C) return null;
  return (
    <section aria-label={spec.title || spec.kind} className="grid min-w-48 flex-1 content-start gap-2 border border-border bg-surface p-3" data-aux={spec.kind}>
      <h2 className="font-mono text-label uppercase text-fg-muted">{spec.title || spec.kind}</h2>
      <C {...spec.map(step, input, mode)} />
    </section>
  );
}

/** Renders the stage (and aux panels) for one step. Errors stay inline. */
export default function StageView({ view, step, input, mode, resetKey, embedded }) {
  return (
    <Boundary resetKey={resetKey}>
      {view.render ? (
        view.render(step, input, mode)
      ) : (
        <div className="grid gap-3">
          {(() => {
            const S = STAGES[view.stage];
            if (!S) return <p role="alert" className="font-mono text-small text-err">Unknown stage kind "{String(view.stage)}".</p>;
            return <S {...view.map(step, input, mode)} />;
          })()}
          {view.aux && view.aux.length ? (
            <div className={embedded ? "grid gap-2" : "flex flex-wrap gap-3"}>
              {view.aux.map((a, i) => (
                <AuxPanel key={i} spec={a} step={step} input={input} mode={mode} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </Boundary>
  );
}
