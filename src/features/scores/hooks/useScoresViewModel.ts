import { useMemo, useState } from "react";
import type { Attempt, Course, User } from "../../../shared/types/lms";
import type {
  GradebookStudentRow,
  GroupedRowsByBlockLesson,
  InstructorViewMode,
  ScoreRow,
  ScoreSortBy,
  ScoreStatusFilter,
} from "../types/scoreTypes";

export function useScoresViewModel(
  selectedCourse: Course,
  attempts: Attempt[],
  user: User,
) {
  const [scoreQuery, setScoreQuery] = useState("");
  const [scoreLessonFilter, setScoreLessonFilter] = useState("ALL");
  const [scoreBlockFilter, setScoreBlockFilter] = useState("ALL");
  const [scoreStatusFilter, setScoreStatusFilter] =
    useState<ScoreStatusFilter>("ALL");
  const [scoreSortBy, setScoreSortBy] = useState<ScoreSortBy>("NEWEST");
  const [instructorViewMode, setInstructorViewMode] =
    useState<InstructorViewMode>("GRADEBOOK");
  const [collapsedLessons, setCollapsedLessons] = useState<
    Record<string, boolean>
  >({});
  const [collapsedLessonGroups, setCollapsedLessonGroups] = useState<
    Record<string, boolean>
  >({});
  const [scorePage, setScorePage] = useState(1);

  const pageSize = 10;

  const computed = useMemo(() => {
    const courseAttempts = attempts.filter(
      (a) => a.quiz.lesson.course.id === selectedCourse.id,
    );
    const latestMap = new Map<string, Attempt>();
    for (const a of courseAttempts) {
      const anyAttempt = a as any;
      const quizKey =
        anyAttempt?.quiz?.id ??
        anyAttempt?.quizId ??
        anyAttempt?.quiz?.lesson?.title ??
        "quiz";
      const studentKey =
        anyAttempt?.student?.id ??
        anyAttempt?.studentId ??
        anyAttempt?.student?.fullName ??
        "me";
      const key = a.student ? `${quizKey}:${studentKey}` : `${quizKey}:me`;
      const prev = latestMap.get(key);
      const prevAt = prev ? new Date((prev as any).createdAt || 0).getTime() : 0;
      const nextAt = new Date(anyAttempt?.createdAt || 0).getTime();
      if (!prev || nextAt >= prevAt) latestMap.set(key, a);
    }
    const latestAttempts = Array.from(latestMap.values()).sort(
      (a, b) =>
        new Date((b as any).createdAt || 0).getTime() -
        new Date((a as any).createdAt || 0).getTime(),
    );
    const scoreRows: ScoreRow[] = latestAttempts.map((a) => {
      const canShowInScores =
        user.role !== "STUDENT" ||
        Boolean((a as any)?.quiz?.showScoreInStudentScores ?? true);
      const pct =
        Number(a.total) > 0 ? (Number(a.score) * 100) / Number(a.total) : 0;
      const passing = Number((a as any)?.quiz?.passingPercentage || 60);
      const passed = pct >= passing;
      const blockName = String((a as any)?.quiz?.lesson?.sectionName || "");
      const lessonTitle = String((a as any)?.quiz?.lesson?.title || "");
      const studentName = String((a as any)?.student?.fullName || "");
      const createdAtTs = new Date((a as any)?.createdAt || 0).getTime();
      const quizId = Number((a as any)?.quiz?.id || (a as any)?.quizId || 0);
      const studentId = Number(
        (a as any)?.student?.id || (a as any)?.studentId || 0,
      );
      const attemptCount = attempts.filter((x: any) => {
        const qid = Number((x as any)?.quiz?.id || (x as any)?.quizId || 0);
        const sid = Number((x as any)?.student?.id || (x as any)?.studentId || 0);
        return qid === quizId && sid === studentId;
      }).length;
      return {
        attempt: a,
        canShowInScores,
        pct,
        passing,
        passed,
        blockName,
        lessonTitle,
        studentName,
        createdAtTs,
        hidden: !canShowInScores,
        attemptCount,
      };
    });

    const lessonOptions = Array.from(
      new Set(scoreRows.map((r) => r.lessonTitle).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    const blockOptions = Array.from(
      new Set(scoreRows.map((r) => r.blockName).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    let visibleRows = scoreRows.filter((r) => {
      if (scoreLessonFilter !== "ALL" && r.lessonTitle !== scoreLessonFilter)
        return false;
      if (scoreBlockFilter !== "ALL" && r.blockName !== scoreBlockFilter)
        return false;
      if (scoreStatusFilter === "PASSED" && !r.passed) return false;
      if (scoreStatusFilter === "FAILED" && r.passed) return false;
      if (scoreStatusFilter === "HIDDEN" && r.canShowInScores) return false;
      if (
        scoreStatusFilter !== "HIDDEN" &&
        scoreStatusFilter !== "ALL" &&
        !r.canShowInScores
      ) {
        return false;
      }
      if (scoreQuery.trim()) {
        const q = scoreQuery.trim().toLowerCase();
        const haystack =
          `${r.lessonTitle} ${r.blockName} ${r.studentName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    visibleRows = [...visibleRows].sort((a, b) => {
      if (scoreSortBy === "NEWEST") return b.createdAtTs - a.createdAtTs;
      if (scoreSortBy === "OLDEST") return a.createdAtTs - b.createdAtTs;
      if (scoreSortBy === "PCT_DESC") return b.pct - a.pct;
      if (scoreSortBy === "PCT_ASC") return a.pct - b.pct;
      if (scoreSortBy === "STUDENT_ASC")
        return a.studentName.localeCompare(b.studentName);
      if (scoreSortBy === "STUDENT_DESC")
        return b.studentName.localeCompare(a.studentName);
      if (scoreSortBy === "LESSON_ASC")
        return a.lessonTitle.localeCompare(b.lessonTitle);
      return b.lessonTitle.localeCompare(a.lessonTitle);
    });

    const totalSubmissions = visibleRows.length;
    const passedCount = visibleRows.filter((r) => r.passed && !r.hidden).length;
    const failedCount = visibleRows.filter((r) => !r.passed && !r.hidden).length;
    const avgPctRows = visibleRows.filter((r) => !r.hidden);
    const averageScore = avgPctRows.length
      ? Math.round(
          avgPctRows.reduce((sum, r) => sum + r.pct, 0) / avgPctRows.length,
        )
      : 0;

    const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
    const safePage = Math.min(scorePage, totalPages);
    const pagedRows = visibleRows.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize,
    );
    const groupedRows = pagedRows.reduce(
      (acc, row) => {
        const blockKey = row.blockName || "Unassigned block";
        const lessonKey = row.lessonTitle || "Untitled lesson";
        if (!acc[blockKey]) acc[blockKey] = {};
        if (!acc[blockKey][lessonKey]) acc[blockKey][lessonKey] = [];
        acc[blockKey][lessonKey].push(row);
        return acc;
      },
      {} as GroupedRowsByBlockLesson,
    );

    const gradebookLessonColumns = Array.from(
      new Set(
        visibleRows
          .map((r) => r.lessonTitle)
          .filter(
            (x) => x && (scoreLessonFilter === "ALL" || x === scoreLessonFilter),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const gradebookStudentRows = Array.from(
      visibleRows
        .reduce((acc, row) => {
          const sid = Number(
            (row.attempt as any)?.student?.id ||
              (row.attempt as any)?.studentId ||
              0,
          );
          const studentKey = sid
            ? `${row.blockName}::${sid}`
            : `${row.blockName}::${row.studentName}`;
          if (!acc.has(studentKey)) {
            acc.set(studentKey, {
              key: studentKey,
              blockName: row.blockName || "-",
              studentId: sid || null,
              studentName: row.studentName || "-",
              cells: {},
              latestTs: 0,
              avgPct: 0,
              submissions: 0,
            });
          }
          const entry = acc.get(studentKey) as GradebookStudentRow;
          entry.cells[row.lessonTitle] = row;
          entry.latestTs = Math.max(entry.latestTs, row.createdAtTs);
          entry.submissions += 1;
          const allCells = Object.values(entry.cells);
          entry.avgPct = allCells.length
            ? allCells.reduce((sum, c) => sum + Number(c.pct || 0), 0) /
              allCells.length
            : 0;
          return acc;
        }, new Map<string, GradebookStudentRow>())
        .values(),
    );

    const sortedGradebookStudentRows = [...gradebookStudentRows].sort((a, b) => {
      if (scoreSortBy === "STUDENT_ASC")
        return a.studentName.localeCompare(b.studentName);
      if (scoreSortBy === "STUDENT_DESC")
        return b.studentName.localeCompare(a.studentName);
      if (scoreSortBy === "NEWEST") return b.latestTs - a.latestTs;
      if (scoreSortBy === "OLDEST") return a.latestTs - b.latestTs;
      if (scoreSortBy === "PCT_DESC") return b.avgPct - a.avgPct;
      if (scoreSortBy === "PCT_ASC") return a.avgPct - b.avgPct;
      return a.studentName.localeCompare(b.studentName);
    });

    const gradebookTotalPages = Math.max(
      1,
      Math.ceil(sortedGradebookStudentRows.length / pageSize),
    );
    const gradebookSafePage = Math.min(scorePage, gradebookTotalPages);
    const gradebookPagedRows = sortedGradebookStudentRows.slice(
      (gradebookSafePage - 1) * pageSize,
      gradebookSafePage * pageSize,
    );

    return {
      lessonOptions,
      blockOptions,
      visibleRows,
      totalSubmissions,
      passedCount,
      failedCount,
      averageScore,
      totalPages,
      safePage,
      groupedRows,
      gradebookLessonColumns,
      sortedGradebookStudentRows,
      gradebookTotalPages,
      gradebookSafePage,
      gradebookPagedRows,
      pageSize,
    };
  }, [
    attempts,
    selectedCourse.id,
    user.role,
    scoreLessonFilter,
    scoreBlockFilter,
    scoreStatusFilter,
    scoreQuery,
    scoreSortBy,
    scorePage,
  ]);

  return {
    scoreQuery,
    setScoreQuery,
    scoreLessonFilter,
    setScoreLessonFilter,
    scoreBlockFilter,
    setScoreBlockFilter,
    scoreStatusFilter,
    setScoreStatusFilter,
    scoreSortBy,
    setScoreSortBy,
    instructorViewMode,
    setInstructorViewMode,
    collapsedLessons,
    setCollapsedLessons,
    collapsedLessonGroups,
    setCollapsedLessonGroups,
    scorePage,
    setScorePage,
    ...computed,
  };
}
