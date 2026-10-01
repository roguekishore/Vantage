/**
 * ProblemListPage: /problems
 * Spring Boot-backed problem listing with pagination, sorting, filtering and
 * status tracking. The view (PageShell, PageHeader, filters, Table) lives in
 * ProblemsTable; this page wires the data source and the row target.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { fetchProblems, fetchProblemById, fetchStages } from "../../services/problemApi";
import ProblemsTable from "../../components/problems/ProblemsTable";
import { resolveJudgeProblemId } from "../../lib/judgeProblemIdResolver";

const problemHref = (id, problem) => {
  const targetId = resolveJudgeProblemId({
    lcslug: problem?.lcslug,
    title: problem?.title,
    fallbackId: problem?.id || id,
  });
  return `/problem/${targetId}`;
};

export default function ProblemListPage() {
  const navigate = useNavigate();

  return (
    <ProblemsTable
      source="spring"
      fetchList={fetchProblems}
      fetchDetail={fetchProblemById}
      fetchStages={fetchStages}
      title="Problems"
      eyebrow="Practice"
      subtitle="Data-structure and algorithm problems with a built-in judge. Filter by difficulty, stage or status, then open one to solve it."
      icon={BookOpen}
      showLeetCode
      showStage
      rowHref={problemHref}
      onRowClick={(id, problem) => navigate(problemHref(id, problem))}
    />
  );
}
