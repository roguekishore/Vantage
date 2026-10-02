import { ArrowRight, Plus, Settings, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, IconButton, ThemeToggle } from "@/components/ds";
import { Demo, Section } from "./Section";

const VARIANTS = ["primary", "secondary", "ghost", "danger", "link"];

export default function ActionsSection() {
  return (
    <Section id="actions" title="Button / IconButton">
      <Demo label="Variants (md)">
        {VARIANTS.map((v) => (
          <Button key={v} variant={v} data-ds-demo={`button-${v}`}>
            {v}
          </Button>
        ))}
      </Demo>
      <Demo label="Sizes sm 28 / md 36 / lg 44">
        {["sm", "md", "lg"].map((s) => (
          <Button key={s} variant="primary" size={s} data-ds-demo={`button-size-${s}`}>
            <Plus /> Size {s}
          </Button>
        ))}
        {["sm", "md", "lg"].map((s) => (
          <IconButton key={s} variant="secondary" size={s} icon={Settings} aria-label={`Settings (${s})`} />
        ))}
      </Demo>
      <Demo label="States: hover (forced) / focus-visible (forced) / disabled / loading">
        {VARIANTS.slice(0, 4).map((v) => (
          <Button key={v} variant={v} data-force="hover">
            {v} hover
          </Button>
        ))}
        <Button variant="primary" data-force="focus">
          Focus
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
        <Button variant="primary" loading data-ds-demo="button-loading">
          Submitting
        </Button>
        <Button variant="secondary" loading>
          Loading
        </Button>
      </Demo>
      <Demo label="IconButton / asChild link / ThemeToggle">
        <IconButton icon={Trash2} variant="danger" aria-label="Delete" />
        <IconButton icon={Settings} aria-label="Settings" />
        <IconButton icon={Settings} aria-label="Settings (hover)" data-force="hover" />
        <IconButton icon={Settings} aria-label="Settings (loading)" variant="secondary" loading />
        <Button variant="secondary" asChild>
          <Link to="/visualizers">
            Visualizers <ArrowRight />
          </Link>
        </Button>
        <ThemeToggle />
      </Demo>
    </Section>
  );
}
