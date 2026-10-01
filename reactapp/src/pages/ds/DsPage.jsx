import { PageHeader, PageShell, ThemeToggle } from "@/components/ds";
import ActionsSection from "./sections/ActionsSection";
import FormsSection from "./sections/FormsSection";
import ContainersSection from "./sections/ContainersSection";
import OverlaysSection from "./sections/OverlaysSection";
import NavigationSection from "./sections/NavigationSection";
import DataSection from "./sections/DataSection";
import StatesSection from "./sections/StatesSection";

/*
 * Hidden design-system preview (/__ds, lazy route, not linked anywhere).
 * Renders every ds/* primitive with its variants, sizes and states in the
 * current theme; the ThemeToggle in the header flips themes for the
 * screenshot gate. One section component per primitive group.
 */
const SECTIONS = [ActionsSection, FormsSection, ContainersSection, OverlaysSection, NavigationSection, DataSection, StatesSection];

export default function DsPage() {
  return (
    <PageShell className="pt-8">
      <PageHeader
        eyebrow="Internal"
        title={
          <>
            Design <em>system</em>
          </>
        }
        description="Every ds/* primitive, variant, size and state. Hover and focus examples are forced with data-force so both themes can be screenshotted."
        actions={<ThemeToggle />}
        className="mb-0 border-b-0 pb-6"
      />
      <div className="grid gap-12 pt-8">
        {SECTIONS.map((S, i) => (
          <S key={i} />
        ))}
      </div>
    </PageShell>
  );
}
