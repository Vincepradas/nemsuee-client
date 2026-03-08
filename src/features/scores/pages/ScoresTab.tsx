import { useState } from "react";
import type { Attempt, Course, User } from "../../../shared/types/lms";
import { InstructorGradebookTable } from "../components/InstructorGradebookTable";
import { InstructorLessonGroupsTable } from "../components/InstructorLessonGroupsTable";
import { ScoreAttemptDetailsModal } from "../components/ScoreAttemptDetailsModal";
import { ScoreResultModal } from "../components/ScoreResultModal";
import { ScoreSummaryStats } from "../components/ScoreSummaryStats";
import { ScoresFilterBar } from "../components/ScoresFilterBar";
import { ScoresPagination } from "../components/ScoresPagination";
import { StudentScoresList } from "../components/StudentScoresList";
import { useScoresViewModel } from "../hooks/useScoresViewModel";
import type { ScoreRow } from "../types/scoreTypes";

type ScoresTabProps = {
  selectedCourse: Course;
  attempts: Attempt[];
  user: User;
  api: any;
  headers: any;
  setMessage: (m: string) => void;
};

export function ScoresTab({
  selectedCourse,
  attempts,
  user,
  api,
  headers,
  setMessage,
}: ScoresTabProps) {
  const vm = useScoresViewModel(selectedCourse, attempts, user);
  const [viewResultOpen, setViewResultOpen] = useState(false);
  const [viewResultLoading, setViewResultLoading] = useState(false);
  const [viewResultData, setViewResultData] = useState<any | null>(null);
  const [selectedCellAttempt, setSelectedCellAttempt] = useState<ScoreRow | null>(
    null,
  );

  const handleStudentViewResult = async (row: ScoreRow) => {
    const a = row.attempt as any;
    try {
      setViewResultLoading(true);
      setViewResultOpen(true);
      const quizId = Number(a?.quiz?.id || a?.quizId || 0);
      const data = await api(`/quizzes/${quizId}/results/me`, { headers });
      setViewResultData(data);
    } catch (e) {
      setMessage((e as Error).message);
      setViewResultOpen(false);
    } finally {
      setViewResultLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {user.role === "INSTRUCTOR" && (
        <section>
          <ScoreSummaryStats
            totalSubmissions={vm.totalSubmissions}
            passedCount={vm.passedCount}
            failedCount={vm.failedCount}
            averageScore={vm.averageScore}
          />
        </section>
      )}

      <section>
        <ScoresFilterBar
          role={user.role}
          scoreQuery={vm.scoreQuery}
          scoreLessonFilter={vm.scoreLessonFilter}
          scoreBlockFilter={vm.scoreBlockFilter}
          scoreStatusFilter={vm.scoreStatusFilter}
          scoreSortBy={vm.scoreSortBy}
          lessonOptions={vm.lessonOptions}
          blockOptions={vm.blockOptions}
          instructorViewMode={vm.instructorViewMode}
          setScoreQuery={vm.setScoreQuery}
          setScoreLessonFilter={vm.setScoreLessonFilter}
          setScoreBlockFilter={vm.setScoreBlockFilter}
          setScoreStatusFilter={vm.setScoreStatusFilter}
          setScoreSortBy={vm.setScoreSortBy}
          setInstructorViewMode={vm.setInstructorViewMode}
          setScorePage={vm.setScorePage}
        />
      </section>

      {user.role === "INSTRUCTOR" ? (
        vm.instructorViewMode === "GRADEBOOK" ? (
          <InstructorGradebookTable
            rows={vm.gradebookPagedRows}
            lessonColumns={vm.gradebookLessonColumns}
            onSelectCell={setSelectedCellAttempt}
          />
        ) : (
          <InstructorLessonGroupsTable
            groupedRows={vm.groupedRows}
            collapsedLessons={vm.collapsedLessons}
            collapsedLessonGroups={vm.collapsedLessonGroups}
            setCollapsedLessons={vm.setCollapsedLessons}
            setCollapsedLessonGroups={vm.setCollapsedLessonGroups}
            onViewAttempt={() =>
              setMessage(
                "Detailed instructor attempt review will be added in the next patch.",
              )
            }
          />
        )
      ) : (
        <StudentScoresList
          rows={vm.visibleRows}
          onViewResult={handleStudentViewResult}
        />
      )}

      {!vm.visibleRows.length && (
        <p className="text-sm text-slate-500">No scores for this course yet.</p>
      )}

      {user.role === "INSTRUCTOR" && vm.visibleRows.length > 0 && (
        <ScoresPagination
          instructorViewMode={vm.instructorViewMode}
          scoreBlockFilter={vm.scoreBlockFilter}
          gradebookPagedRowsLength={vm.gradebookPagedRows.length}
          gradebookSafePage={vm.gradebookSafePage}
          gradebookTotalPages={vm.gradebookTotalPages}
          sortedGradebookRowsLength={vm.sortedGradebookStudentRows.length}
          visibleRowsLength={vm.visibleRows.length}
          safePage={vm.safePage}
          totalPages={vm.totalPages}
          pageSize={vm.pageSize}
          setScorePage={vm.setScorePage}
        />
      )}

      <ScoreAttemptDetailsModal
        selectedCellAttempt={selectedCellAttempt}
        onClose={() => setSelectedCellAttempt(null)}
      />

      <ScoreResultModal
        open={viewResultOpen}
        loading={viewResultLoading}
        data={viewResultData}
        selectedCourse={selectedCourse}
        onClose={() => {
          setViewResultOpen(false);
          setViewResultData(null);
        }}
      />
    </div>
  );
}
