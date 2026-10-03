import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward, HelpCircle } from "lucide-react";
import { Button, IconButton, Kbd, Popover, PopoverContent, PopoverTrigger, Tooltip } from "@/components/ds";
import { cn } from "@/lib/utils";
import { SPEEDS } from "./usePlayer";
import { KEY_MAP } from "./keyboard";

/** first / prev / play-pause / next / last. `mini` drops nothing but the size. */
export function TransportButtons({ player, size = "md" }) {
  const { atStart, atEnd, playing } = player;
  return (
    <div role="group" aria-label="Playback" className="flex items-center gap-1">
      <Tooltip content="First step (Home)">
        <IconButton icon={SkipBack} size={size} aria-label="First step" disabled={atStart} onClick={player.first} />
      </Tooltip>
      <Tooltip content="Previous step (Left)">
        <IconButton icon={ChevronLeft} size={size} aria-label="Previous step" disabled={atStart} onClick={player.prev} />
      </Tooltip>
      <Tooltip content={playing ? "Pause (Space)" : "Play (Space)"}>
        <IconButton
          icon={playing ? Pause : Play}
          size={size}
          variant="primary"
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          onClick={player.toggle}
        />
      </Tooltip>
      <Tooltip content="Next step (Right)">
        <IconButton icon={ChevronRight} size={size} aria-label="Next step" disabled={atEnd} onClick={player.next} />
      </Tooltip>
      <Tooltip content="Last step (End)">
        <IconButton icon={SkipForward} size={size} aria-label="Last step" disabled={atEnd} onClick={player.last} />
      </Tooltip>
    </div>
  );
}

export function Scrubber({ player, className }) {
  const max = Math.max(0, player.total - 1);
  return (
    <input
      type="range"
      aria-label="Scrub steps"
      aria-valuetext={`Step ${player.index + 1} of ${player.total}`}
      min={0}
      max={max}
      step={1}
      value={player.index}
      disabled={max === 0}
      onChange={(e) => player.scrub(Number(e.target.value))}
      className={cn("h-7 min-w-24 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50", className)}
      style={{ accentColor: "var(--accent-ink)" }}
    />
  );
}

export function StepCounter({ player, className }) {
  return (
    <span
      data-testid="step-counter"
      className={cn("whitespace-nowrap font-mono text-small tabular-nums text-fg-muted", className)}
    >
      {player.total ? player.index + 1 : 0} / {player.total}
    </span>
  );
}

export function SpeedPresets({ player }) {
  return (
    <div role="group" aria-label="Speed" className="flex items-center gap-1">
      {SPEEDS.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={player.speed === s ? "primary" : "ghost"}
          aria-pressed={player.speed === s}
          aria-label={`Speed ${s} times`}
          onClick={() => player.setSpeed(s)}
          className="px-2 normal-case tracking-normal"
        >
          {s}x
        </Button>
      ))}
    </div>
  );
}

export function KeysPopover() {
  return (
    <Popover>
      <Tooltip content="Keyboard keys">
        <PopoverTrigger asChild>
          <IconButton icon={HelpCircle} size="sm" aria-label="Keyboard keys" />
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="end" aria-label="Keyboard keys">
        <p className="mb-2 font-mono text-label uppercase text-fg-muted">Keyboard</p>
        <dl className="grid gap-2">
          {KEY_MAP.map(([k, d]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <dt className="flex gap-1">
                {k.split(" / ").map((x) => (
                  <Kbd key={x}>{x}</Kbd>
                ))}
              </dt>
              <dd className="text-right text-small text-fg-muted">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-small text-fg-dim">Ignored while typing in a field.</p>
      </PopoverContent>
    </Popover>
  );
}

/** Embedded (360px): buttons, scrubber and counter on one compact strip. */
export function MiniTransport({ player }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2" data-mini-transport="">
      <TransportButtons player={player} size="sm" />
      <Scrubber player={player} />
      <StepCounter player={player} />
    </div>
  );
}

/** Full toolbar transport row. */
export function TransportRow({ player }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-transport="">
      <TransportButtons player={player} />
      <Scrubber player={player} className="basis-40" />
      <StepCounter player={player} />
      <SpeedPresets player={player} />
      <KeysPopover />
    </div>
  );
}
