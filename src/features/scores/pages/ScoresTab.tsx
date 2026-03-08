import { useState } from "react";
import type { Attempt, Course, User } from "../../../types/lms";

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
  const [viewResultOpen, setViewResultOpen] = useState(false);
  const [viewResultLoading, setViewResultLoading] = useState(false);
  const [viewResultData, setViewResultData] = useState<any | null>(null);
  const [scoreQuery, setScoreQuery] = useState("");
  const [scoreLessonFilter, setScoreLessonFilter] = useState("ALL");
  const [scoreBlockFilter, setScoreBlockFilter] = useState("ALL");
  const [scoreStatusFilter, setScoreStatusFilter] = useState<
    "ALL" | "PASSED" | "FAILED" | "HIDDEN"
  >("ALL");
  const [scoreSortBy, setScoreSortBy] = useState<
    "NEWEST" | "OLDEST" | "PCT_DESC" | "PCT_ASC" | "LESSON_ASC" | "LESSON_DESC"
  >("NEWEST");
  const [groupByLesson, setGroupByLesson] = useState(true);
  const [collapsedLessons, setCollapsedLessons] = useState<
    Record<string, boolean>
  >({});
  const [scorePage, setScorePage] = useState(1);
  const pageSize = 10;
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
  const scoreRows = latestAttempts.map((a) => {
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
    )
      return false;
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
      const key = row.lessonTitle || "Untitled lesson";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    },
    {} as Record<string, typeof pagedRows>,
  );

  return (
    <div className="space-y-2">
      {user.role === "INSTRUCTOR" && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-[11px] text-slate-500">Total Submissions</p>
            <p className="text-lg font-semibold text-slate-900">
              {totalSubmissions}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-[11px] text-slate-500">Passed</p>
            <p className="text-lg font-semibold text-emerald-700">
              {passedCount}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-[11px] text-slate-500">Failed</p>
            <p className="text-lg font-semibold text-rose-700">{failedCount}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-[11px] text-slate-500">Average Score</p>
            <p className="text-lg font-semibold text-slate-900">
              {averageScore}%
            </p>
          </div>
        </div>
      )}
      <div className="rounded-md border border-slate-200 bg-white p-2">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={scoreQuery}
            onChange={(e) => {
              setScoreQuery(e.target.value);
              setScorePage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1.5 text-xs"
            placeholder={
              user.role === "INSTRUCTOR"
                ? "Search lesson, block, student"
                : "Search lesson, block"
            }
          />
          <select
            value={scoreLessonFilter}
            onChange={(e) => {
              setScoreLessonFilter(e.target.value);
              setScorePage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value="ALL">All lessons</option>
            {lessonOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={scoreBlockFilter}
            onChange={(e) => {
              setScoreBlockFilter(e.target.value);
              setScorePage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value="ALL">All blocks</option>
            {blockOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={scoreStatusFilter}
            onChange={(e) =>
              setScoreStatusFilter(
                e.target.value as "ALL" | "PASSED" | "FAILED" | "HIDDEN",
              )
            }
            className="rounded border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value="ALL">All statuses</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            {user.role === "STUDENT" && (
              <option value="HIDDEN">Hidden by instructor</option>
            )}
          </select>
          <select
            value={scoreSortBy}
            onChange={(e) =>
              setScoreSortBy(
                e.target.value as
                  | "NEWEST"
                  | "OLDEST"
                  | "PCT_DESC"
                  | "PCT_ASC"
                  | "LESSON_ASC"
                  | "LESSON_DESC",
              )
            }
            className="rounded border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value="NEWEST">Newest</option>
            <option value="OLDEST">Oldest</option>
            <option value="PCT_DESC">Highest %</option>
            <option value="PCT_ASC">Lowest %</option>
            <option value="LESSON_ASC">Lesson A-Z</option>
            <option value="LESSON_DESC">Lesson Z-A</option>
          </select>
        </div>
        {user.role === "INSTRUCTOR" && (
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={groupByLesson}
              onChange={(e) => setGroupByLesson(e.target.checked)}
            />
            Group by lesson
          </label>
        )}
      </div>
      {user.role === "INSTRUCTOR" ? (
        groupByLesson ? (
          <div className="space-y-2">
            {Object.entries(groupedRows).map(([lesson, rows]) => (
              <section
                key={lesson}
                className="rounded-md border border-slate-200 bg-white"
              >
                <button
                  className="flex w-full items-center justify-between border-b border-slate-200 px-3 py-2 text-left"
                  onClick={() =>
                    setCollapsedLessons((prev) => ({
                      ...prev,
                      [lesson]: !prev[lesson],
                    }))
                  }
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {lesson}
                  </span>
                  <span className="text-xs text-slate-500">{rows.length}</span>
                </button>
                {!collapsedLessons[lesson] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Block</th>
                          <th className="px-3 py-2 text-left">Student</th>
                          <th className="px-3 py-2 text-left">Score</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Submitted</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const a = row.attempt;
                          return (
                            <tr
                              key={a.id}
                              className="border-t border-slate-100"
                            >
                              <td className="px-3 py-2">
                                {row.blockName || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {row.studentName || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {a.score}/{a.total} ({Math.round(row.pct)}%)
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded px-2 py-0.5 ${row.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                >
                                  {row.passed ? "Passed" : "Failed"}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {new Date(
                                  (a as any)?.createdAt || Date.now(),
                                ).toLocaleString()}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                                  onClick={() =>
                                    setMessage(
                                      "Detailed instructor attempt review will be added in the next patch.",
                                    )
                                  }
                                >
                                  View Attempt
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Lesson</th>
                  <th className="px-3 py-2 text-left">Block</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Submitted</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const a = row.attempt;
                  return (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{row.lessonTitle || "-"}</td>
                      <td className="px-3 py-2">{row.blockName || "-"}</td>
                      <td className="px-3 py-2">{row.studentName || "-"}</td>
                      <td className="px-3 py-2">
                        {a.score}/{a.total} ({Math.round(row.pct)}%)
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-0.5 ${row.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {row.passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {new Date(
                          (a as any)?.createdAt || Date.now(),
                        ).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                          onClick={() =>
                            setMessage(
                              "Detailed instructor attempt review will be added in the next patch.",
                            )
                          }
                        >
                          View Attempt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        visibleRows.map((row) => {
          const { attempt: a, canShowInScores, pct, passed } = row;
          return (
            <article
              key={a.id}
              className={`rounded border p-2 text-sm ${
                user.role === "INSTRUCTOR"
                  ? passed
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-rose-400 bg-rose-50"
                  : canShowInScores
                    ? passed
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-rose-400 bg-rose-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="font-medium">{a.quiz.lesson.title}</p>
              <p className="text-xs text-slate-500">
                {(a as any)?.quiz?.lesson?.sectionName
                  ? `${(a as any).quiz.lesson.sectionName}`
                  : ""}
              </p>
              {!canShowInScores && user.role === "STUDENT" && (
                <p className="text-xs text-slate-500">
                  Result hidden by instructor.
                </p>
              )}
              {a.student && <p>{a.student.fullName}</p>}
              {user.role === "INSTRUCTOR" && (
                <div className="mt-1 space-y-0.5 text-xs text-slate-700">
                  <p>
                    Score:{" "}
                    <span className="font-semibold">
                      {a.score}/{a.total}
                    </span>{" "}
                    ({Math.round(pct)}%)
                  </p>
                  <p>
                    Status:{" "}
                    <span
                      className={
                        passed
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-rose-700"
                      }
                    >
                      {passed ? "Passed" : "Failed"}
                    </span>
                  </p>
                  <p>
                    Submitted:{" "}
                    {new Date(
                      (a as any)?.createdAt || Date.now(),
                    ).toLocaleString()}
                  </p>
                </div>
              )}
              {user.role === "STUDENT" && canShowInScores && (
                <button
                  className="mt-2 rounded border border-slate-300 p-1.5 hover:bg-white"
                  title="View quiz result"
                  aria-label="View quiz result"
                  onClick={async () => {
                    try {
                      setViewResultLoading(true);
                      setViewResultOpen(true);
                      const quizId = Number(
                        (a as any)?.quiz?.id || (a as any)?.quizId || 0,
                      );
                      const data = await api(`/quizzes/${quizId}/results/me`, {
                        headers,
                      });
                      setViewResultData(data);
                    } catch (e) {
                      setMessage((e as Error).message);
                      setViewResultOpen(false);
                    } finally {
                      setViewResultLoading(false);
                    }
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}
            </article>
          );
        })
      )}
      {!visibleRows.length && (
        <p className="text-sm text-slate-500">No scores for this course yet.</p>
      )}
      {user.role === "INSTRUCTOR" && visibleRows.length > 0 && (
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
          <p>
            Showing {(safePage - 1) * pageSize + 1}-
            {Math.min(safePage * pageSize, visibleRows.length)} of{" "}
            {visibleRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setScorePage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              {safePage} / {totalPages}
            </span>
            <button
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setScorePage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {viewResultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Quiz Result</p>
              <button
                className="rounded border border-slate-300 px-2 py-1 text-xs"
                onClick={() => {
                  setViewResultOpen(false);
                  setViewResultData(null);
                }}
              >
                Close
              </button>
            </div>
            {viewResultLoading ? (
              <p className="text-sm text-slate-500">Loading result...</p>
            ) : !viewResultData ? (
              <p className="text-sm text-slate-500">No result data.</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const pct =
                    Number(viewResultData?.total) > 0
                      ? (Number(viewResultData?.score || 0) * 100) /
                        Number(viewResultData?.total || 1)
                      : 0;
                  const passing = Number(
                    viewResultData?.quiz?.passingPercentage || 60,
                  );
                  const passed = pct >= passing;
                  return (
                    <p
                      className={`rounded px-2 py-1 text-xs font-semibold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                    >
                      {passed
                        ? `Passed (${Math.round(pct)}% / ${passing}%)`
                        : `Failed (${Math.round(pct)}% / ${passing}%)`}
                    </p>
                  );
                })()}
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">
                    {viewResultData?.quiz?.title || "Quiz"}
                  </p>
                  <p className="text-slate-600">
                    Course:{" "}
                    {viewResultData?.quiz?.courseTitle || selectedCourse.title}
                  </p>
                  <p className="text-slate-600">
                    Block: {viewResultData?.quiz?.sectionName || "N/A"}
                  </p>
                  <p className="text-slate-600">
                    Lesson: {viewResultData?.quiz?.lessonTitle || "N/A"}
                  </p>
                  <p className="text-slate-600">
                    Attempt ID: {viewResultData?.attemptId}
                  </p>
                  <p className="font-semibold text-blue-700">
                    Score: {viewResultData?.score}/{viewResultData?.total}
                  </p>
                </div>
                {!viewResultData?.quiz?.canViewAnswerKey ? (
                  <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Answer key is hidden by instructor.
                  </p>
                ) : (
                  <div className="max-h-[45vh] space-y-2 overflow-auto">
                    {(viewResultData?.questions || []).map(
                      (q: any, idx: number) => (
                        <div
                          key={q.id}
                          className="rounded border border-slate-200 p-2 text-xs"
                        >
                          <p className="font-semibold text-slate-900">
                            Q{idx + 1}. {q.prompt}
                          </p>
                          <p className="text-slate-600">
                            Your answer: {q.studentAnswer || "(no answer)"}
                          </p>
                          <p className="text-slate-600">
                            Correct answer: {q.correctAnswer || "-"}
                          </p>
                          <p
                            className={
                              q.isCorrect ? "text-emerald-700" : "text-rose-700"
                            }
                          >
                            {q.isCorrect ? "Correct" : "Incorrect"}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

