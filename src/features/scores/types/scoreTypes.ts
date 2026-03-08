import type { Attempt } from "../../../shared/types/lms";

export type ScoreStatusFilter = "ALL" | "PASSED" | "FAILED" | "HIDDEN";

export type ScoreSortBy =
  | "NEWEST"
  | "OLDEST"
  | "PCT_DESC"
  | "PCT_ASC"
  | "LESSON_ASC"
  | "LESSON_DESC"
  | "STUDENT_ASC"
  | "STUDENT_DESC";

export type InstructorViewMode = "GRADEBOOK" | "LESSON";

export type ScoreRow = {
  attempt: Attempt;
  canShowInScores: boolean;
  pct: number;
  passing: number;
  passed: boolean;
  blockName: string;
  lessonTitle: string;
  studentName: string;
  createdAtTs: number;
  hidden: boolean;
  attemptCount: number;
};

export type GroupedRowsByBlockLesson = Record<string, Record<string, ScoreRow[]>>;

export type GradebookStudentRow = {
  key: string;
  blockName: string;
  studentId: number | null;
  studentName: string;
  cells: Record<string, ScoreRow>;
  latestTs: number;
  avgPct: number;
  submissions: number;
};

