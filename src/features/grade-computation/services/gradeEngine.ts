import type { Attempt } from "../../../shared/types/lms";

export type RowMeta = {
  isLocked: boolean;
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
};

export type TaskRow = {
  submissions?: Array<{
    studentId: number;
    grade?: number | null;
    createdAt: string;
  }>;
};

export type ManualInputs = Record<
  string,
  { midterm?: number; finals?: number; attendance?: number }
>;

export type GradeWeights = {
  quiz: number;
  assignment: number;
  activity: number;
  termExam: number;
  attendance: number;
};

export type ComputedGradeRow = {
  studentId: number;
  studentName: string;
  blockName: string;
  quizAvg: number;
  assignmentAvg: number;
  activityAvg: number;
  midterm?: number;
  finals?: number;
  attendance?: number;
  finalGrade: number;
  equivalentGrade: number;
  result: "PASSED" | "FAILED";
  meta: RowMeta;
};

export function toEquivalentGrade(percent: number) {
  const clamped = Math.max(0, Math.min(100, percent));
  return Math.max(1, Math.min(5, Number((1 + (100 - clamped) / 20).toFixed(2))));
}

function latestTaskAverage(tasks: TaskRow[], studentId: number) {
  const values: number[] = [];
  for (const task of tasks) {
    const latest = (task.submissions || [])
      .filter(
        (submission) =>
          Number(submission.studentId) === studentId &&
          submission.grade !== null &&
          submission.grade !== undefined,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    if (latest?.grade !== null && latest?.grade !== undefined) {
      values.push(Number(latest.grade));
    }
  }
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function computeGradeRows(params: {
  selectedCourseId: number;
  roster: any[];
  attempts: Attempt[];
  assignmentTasks: TaskRow[];
  activityTasks: TaskRow[];
  manual: ManualInputs;
  metaByStudent: Record<string, RowMeta>;
  weights: GradeWeights;
  gradingPeriod: string;
}): ComputedGradeRow[] {
  const {
    selectedCourseId,
    roster,
    attempts,
    assignmentTasks,
    activityTasks,
    manual,
    metaByStudent,
    weights,
    gradingPeriod,
  } = params;
  const quizAttempts = attempts.filter(
    (attempt: any) => attempt?.quiz?.lesson?.course?.id === selectedCourseId,
  );

  return roster.map((enrollment: any) => {
    const studentId = Number(enrollment?.student?.id || 0);
    const studentName = String(enrollment?.student?.fullName || "Student");
    const blockName = String(enrollment?.section?.name || "-");

    const latestQuizByLesson = new Map<number, { pct: number; createdAt: number }>();
    for (const attempt of quizAttempts) {
      if (Number((attempt as any)?.student?.id) !== studentId) continue;
      const lessonId = Number((attempt as any)?.quiz?.lesson?.id || 0);
      const total = Math.max(1, Number((attempt as any)?.total || 0));
      const score = Number((attempt as any)?.score || 0);
      const pct = (score / total) * 100;
      const createdAt = new Date((attempt as any)?.createdAt || 0).getTime();
      const previous = latestQuizByLesson.get(lessonId);
      if (!previous || createdAt > previous.createdAt) {
        latestQuizByLesson.set(lessonId, { pct, createdAt });
      }
    }

    const quizValues = Array.from(latestQuizByLesson.values()).map((value) => value.pct);
    const quizAvg = quizValues.length
      ? quizValues.reduce((sum, value) => sum + value, 0) / quizValues.length
      : 0;
    const assignmentAvg = latestTaskAverage(assignmentTasks, studentId);
    const activityAvg = latestTaskAverage(activityTasks, studentId);
    const custom = manual[String(studentId)] || {};
    const activeTermExam =
      gradingPeriod === "FINALS" ? (custom.finals ?? 0) : (custom.midterm ?? 0);
    const totalWeight = Math.max(
      1,
      weights.quiz +
        weights.assignment +
        weights.activity +
        weights.termExam +
        weights.attendance,
    );
    const finalGrade =
      (quizAvg * weights.quiz +
        assignmentAvg * weights.assignment +
        activityAvg * weights.activity +
        activeTermExam * weights.termExam +
        (custom.attendance ?? 0) * weights.attendance) /
      totalWeight;
    const equivalentGrade = toEquivalentGrade(finalGrade);
    const result = equivalentGrade <= 3 ? "PASSED" : "FAILED";
    const meta = metaByStudent[String(studentId)] || {
      isLocked: false,
      reviewStatus: "DRAFT" as const,
    };

    return {
      studentId,
      studentName,
      blockName,
      quizAvg,
      assignmentAvg,
      activityAvg,
      midterm: custom.midterm,
      finals: custom.finals,
      attendance: custom.attendance,
      finalGrade,
      equivalentGrade,
      result,
      meta,
    };
  });
}
