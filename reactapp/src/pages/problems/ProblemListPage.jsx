/**
 * ProblemListPage � /problems
 * Spring Boot-backed problem listing with full pagination, sorting,
 * filtering, status tracking and detail dialog.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { fetchProblems, fetchProblemById, fetchStages } from "../../services/problemApi";
import ProblemsTable from "../../components/ProblemsTable";
import { ALL_PROBLEMS } from "../../data/dsa-conquest-map";

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
        // Try to find the matching problem in our local map to get its judgeId
        const localProblem = ALL_PROBLEMS.find(p => p.lcSlug === problem.lcslug);
        const targetId = localProblem?.judgeId || problem.lcslug || problem.id || id;
        navigate(`/problem/${targetId}`);
      }}
    />
  );
}
