import type { Course } from "../../../shared/types/lms";

type ScoreResultModalProps = {
  open: boolean;
  loading: boolean;
  data: any | null;
  selectedCourse: Course;
  onClose: () => void;
};

export function ScoreResultModal({
  open,
  loading,
  data,
  selectedCourse,
  onClose,
}: ScoreResultModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Quiz Result</p>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading result...</p>
        ) : !data ? (
          <p className="text-sm text-slate-500">No result data.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const pct =
                Number(data?.total) > 0
                  ? (Number(data?.score || 0) * 100) / Number(data?.total || 1)
                  : 0;
              const passing = Number(data?.quiz?.passingPercentage || 60);
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
                {data?.quiz?.title || "Quiz"}
              </p>
              <p className="text-slate-600">
                Course: {data?.quiz?.courseTitle || selectedCourse.title}
              </p>
              <p className="text-slate-600">
                Block: {data?.quiz?.sectionName || "N/A"}
              </p>
              <p className="text-slate-600">
                Lesson: {data?.quiz?.lessonTitle || "N/A"}
              </p>
              <p className="text-slate-600">Attempt ID: {data?.attemptId}</p>
              <p className="font-semibold text-blue-700">
                Score: {data?.score}/{data?.total}
              </p>
            </div>
            {!data?.quiz?.canViewAnswerKey ? (
              <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Answer key is hidden by instructor.
              </p>
            ) : (
              <div className="max-h-[45vh] space-y-2 overflow-auto">
                {(data?.questions || []).map((q: any, idx: number) => (
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
