/**
 * ProblemListPage � /problems
 * Spring Boot-backed problem listing with full pagination, sorting,
 * filtering, status tracking and detail dialog.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { fetchProblems, fetchProblemById, fetchStages } from "../../services/problemApi";
import ProblemsTable from "../../components/problems/ProblemsTable";
import { resolveJudgeProblemId } from "../../lib/judgeProblemIdResolver";

export default function ProblemListPage() {
  const navigate = useNavigate();

  return (
    <ProblemsTable
      source="spring"
      fetchList={fetchProblems}
      fetchDetail={fetchProblemById}
      fetchStages={fetchStages}
      title="Problems"
      subtitle="Practice & master DSA"
      icon={BookOpen}
      showLeetCode
      showStage
      onRowClick={(id, problem) => {
        const targetId = resolveJudgeProblemId({
          lcslug: problem?.lcslug,
          title: problem?.title,
          fallbackId: problem?.id || id,
        });
        navigate(`/problem/${targetId}`);
      }}
    />
  );
}
