import { useState } from "react";
import { Button, EmptyState, ErrorState, OfflineState, PageLoader } from "@/components/ds";
import { Demo, Section } from "./Section";

export default function StatesSection() {
  const [loading, setLoading] = useState(false);
  const showLoader = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  };
  return (
    <Section id="states" title="EmptyState / ErrorState / OfflineState / PageLoader">
      <div className="grid gap-4 md:grid-cols-3">
        <EmptyState title="No friends yet" description="Add players by username to challenge them." action={<Button variant="primary">Find players</Button>} />
        <ErrorState description="The leaderboard failed to load." onRetry={() => {}} />
        <OfflineState onRetry={() => {}} />
      </div>
      <Demo label="PageLoader (fixed under the nav)">
        <Button onClick={showLoader}>Show PageLoader for 2.5s</Button>
        {loading ? <PageLoader /> : null}
      </Demo>
    </Section>
  );
}
