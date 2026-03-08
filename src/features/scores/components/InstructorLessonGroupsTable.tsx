import type { Dispatch, SetStateAction } from "react";
import type { GroupedRowsByBlockLesson } from "../types/scoreTypes";

type InstructorLessonGroupsTableProps = {
  groupedRows: GroupedRowsByBlockLesson;
  collapsedLessons: Record<string, boolean>;
  collapsedLessonGroups: Record<string, boolean>;
  setCollapsedLessons: Dispatch<SetStateAction<Record<string, boolean>>>;
  setCollapsedLessonGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
  onViewAttempt: () => void;
};

export function InstructorLessonGroupsTable({
  groupedRows,
  collapsedLessons,
  collapsedLessonGroups,
  setCollapsedLessons,
  setCollapsedLessonGroups,
  onViewAttempt,
}: InstructorLessonGroupsTableProps) {
  return (
    <div className="space-y-2">
      {Object.entries(groupedRows).map(([block, rows]) => (
        <section
          key={block}
          className="rounded-md border border-slate-200 bg-white shadow-sm"
        >
          <button
            className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-left"
            onClick={() =>
              setCollapsedLessons((prev) => ({
                ...prev,
                [block]: !prev[block],
              }))
            }
          >
            <span className="text-sm font-semibold tracking-wide text-slate-900">
              {block}
            </span>
            <span className="text-xs text-slate-500">
              {Object.values(rows).reduce((n, list) => n + list.length, 0)}
            </span>
          </button>
          {!collapsedLessons[block] && (
            <div className="space-y-2 p-2">
              {Object.entries(rows).map(([lesson, lessonRows]) => (
                <article
                  key={`${block}-${lesson}`}
                  className="overflow-x-auto rounded-md border border-slate-200"
                >
                  <button
                    className="flex w-full items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-left"
                    onClick={() =>
                      setCollapsedLessonGroups((prev) => ({
                        ...prev,
                        [`${block}::${lesson}`]: !prev[`${block}::${lesson}`],
                      }))
                    }
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {lesson}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {lessonRows.length} submission
                      {lessonRows.length > 1 ? "s" : ""} | Quiz |{" "}
                      {Math.max(
                        ...lessonRows.map((x) => Number(x.attempt.total || 0)),
                        0,
                      )}{" "}
                      questions
                    </span>
                  </button>
                  {!collapsedLessonGroups[`${block}::${lesson}`] && (
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Student</th>
                          <th className="px-3 py-2 text-left">Attempt</th>
                          <th className="px-3 py-2 text-left">Score</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Submitted</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessonRows.map((row) => {
                          const a = row.attempt;
                          return (
                            <tr key={a.id} className="border-t border-slate-100">
                              <td className="px-3 py-2">{row.studentName || "-"}</td>
                              <td className="px-3 py-2 text-[11px] text-slate-500">
                                Latest
                                {row.attemptCount > 1 ? ` of ${row.attemptCount}` : ""}
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-semibold text-slate-800">
                                  {a.score}/{a.total} ({Math.round(row.pct)}%)
                                </p>
                                <div className="mt-1 h-1.5 w-24 rounded bg-slate-200">
                                  <div
                                    className={`h-full rounded ${row.passed ? "bg-emerald-500" : "bg-rose-500"}`}
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(100, Math.round(row.pct)),
                                      )}%`,
                                    }}
                                  />
                                </div>
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
                                  onClick={onViewAttempt}
                                >
                                  View Attempt
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
