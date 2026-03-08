import type { ScoreRow } from "../types/scoreTypes";

type StudentScoresListProps = {
  rows: ScoreRow[];
  onViewResult: (row: ScoreRow) => Promise<void>;
};

export function StudentScoresList({
  rows,
  onViewResult,
}: StudentScoresListProps) {
  return (
    <>
      {rows.map((row) => {
        const { attempt: a, canShowInScores, pct, passed } = row;
        return (
          <article
            key={a.id}
            className={`rounded border p-2 text-sm ${canShowInScores ? (passed ? "border-emerald-400 bg-emerald-50" : "border-rose-400 bg-rose-50") : "border-slate-200 bg-slate-50"}`}
          >
            <p className="font-medium">{a.quiz.lesson.title}</p>
            <p className="text-xs text-slate-500">
              {(a as any)?.quiz?.lesson?.sectionName
                ? `${(a as any).quiz.lesson.sectionName}`
                : ""}
            </p>
            {!canShowInScores && (
              <p className="text-xs text-slate-500">
                Result hidden by instructor.
              </p>
            )}
            {a.student && <p>{a.student.fullName}</p>}
            {canShowInScores && (
              <button
                className="mt-2 rounded border border-slate-300 p-1.5 hover:bg-white"
                title="View quiz result"
                aria-label="View quiz result"
                onClick={() => onViewResult(row)}
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
            {canShowInScores && (
              <p className="mt-1 text-xs text-slate-600">
                {a.score}/{a.total} ({Math.round(pct)}%)
              </p>
            )}
          </article>
        );
      })}
    </>
  );
}
