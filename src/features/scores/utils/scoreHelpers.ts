import type { Attempt } from "../../../types/lms";

export const calculatePercentage = (score: number, total: number) =>
  total > 0 ? (score * 100) / total : 0;

export const getLatestAttempts = (attempts: Attempt[]) => {
  const latestMap = new Map<string, Attempt>();
  for (const a of attempts) {
    const anyAttempt = a as any;
    const quizKey =
      anyAttempt?.quiz?.id ?? anyAttempt?.quizId ?? anyAttempt?.quiz?.lesson?.title ?? "quiz";
    const studentKey =
      anyAttempt?.student?.id ?? anyAttempt?.studentId ?? anyAttempt?.student?.fullName ?? "me";
    const key = a.student ? `${quizKey}:${studentKey}` : `${quizKey}:me`;
    const prev = latestMap.get(key);
    const prevAt = prev ? new Date((prev as any).createdAt || 0).getTime() : 0;
    const nextAt = new Date(anyAttempt?.createdAt || 0).getTime();
    if (!prev || nextAt >= prevAt) latestMap.set(key, a);
  }
  return Array.from(latestMap.values());
};
