import React from "react";
import { Breadcrumb } from "@/components/ds/Page";
import "../home/HomePage.css";

/**
 * VisualizerPage: the wrapper every visualizer route renders inside.
 * A slim row under the fixed nav holds the breadcrumb
 * VISUALIZERS / <TOPIC> / <NAME>, linking to real parent routes.
 *
 * `topic` is the topicConfig entry (src/routes/config.js) for this route.
 */
const topicLabel = (topic) => (topic?.title || topic?.key || "").replace(/ Algorithms$/, "");

const VisualizerPage = ({ children, title, topic }) => {
  const items = [{ label: "Visualizers", to: "/visualizers" }];
  if (topic?.path) items.push({ label: topicLabel(topic), to: topic.path });
  items.push({ label: title });

  return (
    <div className="min-h-screen bg-bg pt-[var(--nav-h)] text-fg">
      <div className="border-b border-border px-[var(--gutter)] py-3">
        <div className="mx-auto w-full max-w-[1280px]">
          <Breadcrumb items={items} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1280px] px-[var(--gutter)] py-6">
        {children}
      </div>
    </div>
  );
};

export default VisualizerPage;
