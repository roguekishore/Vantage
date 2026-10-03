// Note: `examples[].values` and `embed.fromExternalArray()` return coerced field
// values keyed by input key (the same shape `parse` receives).
import * as React from "react";
import { Panel, Tabs, TabsContent, TabsList, TabsTrigger, TooltipProvider } from "@/components/ds";
import { cn } from "@/lib/utils";
import { fieldError, isFieldError } from "./fieldError";
import { assertSteps, coerceAll, defaultValues, draftsFromValues } from "./inputModel";
import { usePlayer } from "./usePlayer";
import { useVisualizerKeys } from "./keyboard";
import useLayoutMode from "./useLayoutMode";
import Header from "./Header";
import InputsBar from "./InputsBar";
import { MiniTransport, TransportButtons, TransportRow, Scrubber, StepCounter, SpeedPresets, KeysPopover } from "./Transport";
import CodePanel from "./CodePanel";
import Caption from "./Caption";
import LogPanel from "./LogPanel";
import Inspector from "./Inspector";
import StageView from "./StageView";

/* Resolve the active mode's generate / code / complexity / legend. */
function resolveMode(config, mode) {
  if (config.modes) {
    const m = config.modes[mode] || config.modes[config.defaultMode] || Object.values(config.modes)[0];
    return { generate: m.generate, code: m.code, complexity: m.complexity, legend: m.legend || config.legend, label: m.label };
  }
  return { generate: config.generate, code: config.code, complexity: config.complexity, legend: config.legend, label: null };
}

const FALLBACK = (msg) => [{ msg, phase: "fail" }];

/*
 * values (coerced field values) + mode -> { ok, input, steps, errors, general }.
 * Never throws: failures come back as errors keyed by field or a general line.
 */
function compute(config, values, mode) {
  const spec = resolveMode(config, mode);
  try {
    const input = config.parse ? config.parse(values) : values;
    if (config.validate) {
      const errs = config.validate(input);
      if (errs && Object.keys(errs).length) return { ok: false, errors: errs, general: null };
    }
    const steps = spec.generate(input);
    if (!Array.isArray(steps) || !steps.length) return { ok: false, errors: {}, general: "This input produced no steps." };
    if (process.env.NODE_ENV !== "production") {
      const problems = assertSteps(steps, spec.code.lines);
      if (problems.length) {
        const text = `[visualizer:${config.meta.title}] ${problems.length} step problem(s): ${problems.slice(0, 5).join("; ")}`;
        if (process.env.NODE_ENV === "test") throw new Error(text);
        // eslint-disable-next-line no-console
        console.error(text);
      }
    }
    return { ok: true, input, steps, errors: {}, general: null };
  } catch (e) {
    if (isFieldError(e)) return { ok: false, errors: { [e.fieldKey]: e.message }, general: null };
    return { ok: false, errors: {}, general: `Could not generate steps: ${e && e.message ? e.message : e}` };
  }
}

function initialModel(config, embedded, externalArray) {
  const mode = config.modes ? config.defaultMode || Object.keys(config.modes)[0] : "default";
  let values = { ...defaultValues(config.inputs), ...((config.examples && config.examples[0] && config.examples[0].values) || {}) };
  if (embedded && externalArray && config.embed) values = { ...values, ...config.embed.fromExternalArray(externalArray) };
  const r = compute(config, values, mode);
  const spec = resolveMode(config, mode);
  return {
    mode,
    values,
    drafts: draftsFromValues(config.inputs, values),
    errors: r.errors,
    general: r.general,
    input: r.ok ? r.input : values,
    steps: r.ok ? r.steps : FALLBACK(r.general || "Fix the input above to see the steps."),
    spec,
    example: config.examples && config.examples.length ? 0 : -1,
  };
}

export function defineVisualizer(config) {
  if (process.env.NODE_ENV !== "production") {
    if (!config || !config.meta || !Array.isArray(config.inputs)) throw new Error("defineVisualizer: meta and inputs are required");
    if (!config.modes && !(config.generate && config.code)) throw new Error("defineVisualizer: give generate + code, or modes");
    if (!config.view) throw new Error("defineVisualizer: view is required");
  }

  function Visualizer({ embedded = false, externalArray }) {
    const [model, setModel] = React.useState(() => initialModel(config, embedded, externalArray));
    const layout = useLayoutMode();
    const player = usePlayer(model.steps.length, model.steps);
    useVisualizerKeys(player, !embedded);
    const step = model.steps[player.index] || model.steps[0];
    const spec = resolveMode(config, model.mode);

    /* run values/mode -> new steps (step 0, paused via usePlayer reset). */
    const run = React.useCallback((values, mode, extra = {}) => {
      const r = compute(config, values, mode);
      setModel((m) =>
        r.ok
          ? {
              ...m,
              ...extra,
              mode,
              values,
              drafts: draftsFromValues(config.inputs, values),
              errors: {},
              general: null,
              input: r.input,
              steps: r.steps,
              spec: resolveMode(config, mode),
            }
          : { ...m, ...extra, drafts: draftsFromValues(config.inputs, values), errors: r.errors, general: r.general }
      );
    }, []);

    const apply = React.useCallback(
      (drafts, extra) => {
        const { values, errors } = coerceAll(config.inputs, drafts);
        if (Object.keys(errors).length) {
          setModel((m) => ({ ...m, ...extra, drafts, errors, general: null }));
          return;
        }
        run(values, model.mode, extra);
      },
      [model.mode, run]
    );

    const onDraft = (key, value, immediate) => {
      const drafts = { ...model.drafts, [key]: value };
      if (immediate) apply(drafts, { example: -1 });
      else setModel((m) => ({ ...m, drafts, errors: { ...m.errors, [key]: undefined } }));
    };

    const onExample = (i) => {
      const values = { ...defaultValues(config.inputs), ...config.examples[i].values };
      run(values, model.mode, { example: i });
    };

    const onRandom = () => {
      const drafts = { ...model.drafts };
      config.inputs.forEach((s) => {
        if (typeof s.random === "function") drafts[s.key] = draftsFromValues([s], { [s.key]: s.random() })[s.key];
      });
      apply(drafts, { example: -1 });
    };

    const onMode = (mode) => {
      if (mode === model.mode) return;
      run(model.values, mode);
    };

    /* judge drawer: externalArray changes -> merge embed values, regenerate, step 0 */
    const lastExternal = React.useRef(JSON.stringify(externalArray ?? null));
    React.useEffect(() => {
      const key = JSON.stringify(externalArray ?? null);
      if (key === lastExternal.current) return;
      lastExternal.current = key;
      if (embedded && externalArray && config.embed) {
        run({ ...model.values, ...config.embed.fromExternalArray(externalArray) }, model.mode, { example: -1 });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalArray, embedded]);

    const stats = config.stats ? config.stats(step, player.index, player.total) : null;
    const stageNode = (
      <StageView view={config.view} step={step} input={model.input} mode={model.mode} resetKey={player.index} embedded={embedded} />
    );

    if (embedded) {
      return (
        <TooltipProvider>
          <div data-visualizer-embedded="" className="grid w-full max-w-full gap-3 bg-bg p-3 text-fg">
            {stageNode}
            <Caption step={step} compact />
            <MiniTransport player={player} />
          </div>
        </TooltipProvider>
      );
    }

    const caption = <Caption step={step} />;
    const code = (
      <Panel label="C++" padded={false}>
        <CodePanel lines={spec.code.lines} activeLine={step && step.line} />
      </Panel>
    );
    const inspector = <Inspector step={step} stats={stats} legend={spec.legend} strip={layout === "mid"} />;
    const stageBlock = (
      <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)] content-start gap-3" data-stage-block="">
        <div className="min-h-[200px] min-w-0 max-w-full overflow-x-auto border border-border bg-bg p-3" data-stage-frame="">{stageNode}</div>
        {caption}
        {layout === "narrow" ? null : <LogPanel steps={model.steps} index={player.index} onJump={player.scrub} />}
      </div>
    );

    const toolbar = (
      <div className={cn("z-sticky border-b border-border bg-bg py-3", layout !== "narrow" && "sticky top-[var(--nav-h)]")} data-toolbar="">
        <div className="grid gap-3">
          <InputsBar
            inputs={config.inputs}
            drafts={model.drafts}
            errors={model.errors}
            onDraft={onDraft}
            onApply={() => apply(model.drafts, { example: -1 })}
            examples={config.examples}
            activeExample={model.example}
            onExample={onExample}
            onRandom={onRandom}
            hasRandom={config.inputs.some((s) => typeof s.random === "function")}
            generalError={model.general}
          />
          {layout === "narrow" ? null : <TransportRow player={player} />}
        </div>
      </div>
    );

    let body;
    if (layout === "wide") {
      body = (
        <div className="grid grid-cols-[360px_minmax(0,1fr)_280px] items-start gap-4">
          {code}
          {stageBlock}
          {inspector}
        </div>
      );
    } else if (layout === "mid") {
      body = (
        <div className="grid grid-cols-[360px_minmax(0,1fr)] items-start gap-4">
          {code}
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
            {stageBlock}
            {inspector}
          </div>
        </div>
      );
    } else {
      body = (
        <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-3">
          {stageBlock}
          <Tabs defaultValue="code" variant="segmented">
            <TabsList aria-label="Panels">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="inspector">Inspector</TabsTrigger>
              <TabsTrigger value="log">Log</TabsTrigger>
            </TabsList>
            <div className="mt-3 min-w-0">
              <TabsContent value="code">{code}</TabsContent>
              <TabsContent value="inspector">{inspector}</TabsContent>
              <TabsContent value="log">
                <LogPanel steps={model.steps} index={player.index} onJump={player.scrub} alwaysOpen />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <main id="main" data-visualizer="" data-layout={layout} className="mx-auto w-full max-w-[1760px] px-[var(--gutter)] pb-6 pt-[calc(var(--nav-h)+16px)] text-fg">
          <Header meta={config.meta} modes={config.modes} mode={model.mode} onMode={onMode} complexity={spec.complexity} />
          {toolbar}
          <div className="pt-4">{body}</div>
          {layout === "narrow" ? (
            <div className="sticky bottom-0 z-sticky -mx-[var(--gutter)] mt-4 flex flex-wrap items-center gap-2 border-t border-border bg-bg px-[var(--gutter)] py-2" data-bottom-transport="">
              <TransportButtons player={player} size="sm" />
              <Scrubber player={player} />
              <StepCounter player={player} />
              <SpeedPresets player={player} />
              <KeysPopover />
            </div>
          ) : null}
        </main>
      </TooltipProvider>
    );
  }

  Visualizer.displayName = `Visualizer(${config.meta.title})`;
  Visualizer.isVisualizerV2 = true;
  Visualizer.config = config;
  return Visualizer;
}

export { fieldError };
