import { Breadcrumb, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ds";
import { Demo, Section } from "./Section";

export default function NavigationSection() {
  return (
    <Section id="navigation" title="Tabs / Breadcrumb">
      <Demo label="Tabs: underline (arrow keys move)" className="block">
        <Tabs defaultValue="desc">
          <TabsList aria-label="Problem sections">
            <TabsTrigger value="desc">Description</TabsTrigger>
            <TabsTrigger value="sub">Submissions</TabsTrigger>
            <TabsTrigger value="sol">Solutions</TabsTrigger>
            <TabsTrigger value="off" disabled>
              Locked
            </TabsTrigger>
          </TabsList>
          <TabsContent value="desc" className="pt-4 font-mono text-body text-fg-muted">
            Description panel.
          </TabsContent>
          <TabsContent value="sub" className="pt-4 font-mono text-body text-fg-muted">
            Submissions panel.
          </TabsContent>
          <TabsContent value="sol" className="pt-4 font-mono text-body text-fg-muted">
            Solutions panel.
          </TabsContent>
        </Tabs>
      </Demo>
      <Demo label="Tabs: segmented (filters)">
        <Tabs defaultValue="all" variant="segmented">
          <TabsList aria-label="Difficulty filter">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="easy">Easy</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="hard">Hard</TabsTrigger>
          </TabsList>
        </Tabs>
      </Demo>
      <Demo label="Breadcrumb">
        <Breadcrumb
          items={[
            { label: "Visualizers", to: "/visualizers" },
            { label: "Sorting", to: "/visualizers" },
            { label: "Bubble sort" },
          ]}
        />
      </Demo>
    </Section>
  );
}
