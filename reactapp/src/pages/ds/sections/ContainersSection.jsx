import { MoreHorizontal } from "lucide-react";
import { Badge, Button, IconButton, Kbd, Panel } from "@/components/ds";
import { Demo, Section } from "./Section";

export default function ContainersSection() {
  return (
    <Section id="containers" title="Panel / Badge / Kbd">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel label="Default panel" actions={<IconButton icon={MoreHorizontal} size="sm" aria-label="Panel actions" />}>
          <p className="font-mono text-body text-fg-muted">Flat --surface, 1px --border, header row with label and actions.</p>
        </Panel>
        <Panel variant="accent" label="Accent panel">
          <p className="font-mono text-body text-fg-muted">1px --accent-ink border for the one thing that matters.</p>
        </Panel>
        <Panel variant="interactive" as="button" type="button" label="Interactive panel">
          <p className="font-mono text-body text-fg-muted">Border goes to --border-strong on hover. Focusable.</p>
        </Panel>
        <Panel variant="interactive" as="button" type="button" label="Interactive (hover forced)" data-force="hover">
          <p className="font-mono text-body text-fg-muted">Static hover example.</p>
        </Panel>
        <Panel label="Panel with inset">
          <Panel variant="inset">
            <p className="font-mono text-body text-fg-muted">Inset panel on --bg inside a panel.</p>
          </Panel>
        </Panel>
        <Panel>
          <p className="font-mono text-body text-fg-muted">No header, padded body.</p>
          <div className="mt-4">
            <Button size="sm">Action</Button>
          </div>
        </Panel>
      </div>
      <Demo label="Badge tones">
        {["neutral", "accent", "ok", "warn", "err", "outline"].map((t) => (
          <Badge key={t} tone={t}>
            {t} 128
          </Badge>
        ))}
      </Demo>
      <Demo label="Kbd">
        <span className="font-mono text-small text-fg-muted">
          Search <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
        </span>
        <span className="font-mono text-small text-fg-muted">
          Close <Kbd>Esc</Kbd>
        </span>
        <span className="font-mono text-small text-fg-muted">
          Step <Kbd>←</Kbd> <Kbd>→</Kbd>
        </span>
      </Demo>
    </Section>
  );
}
