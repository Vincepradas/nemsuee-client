import type { ScoreRow } from "../types/scoreTypes";

type ScoreAttemptDetailsModalProps = {
  selectedCellAttempt: ScoreRow | null;
  onClose: () => void;
};

export function ScoreAttemptDetailsModal({
  selectedCellAttempt,
  onClose,
}: ScoreAttemptDetailsModalProps) {
  if (!selectedCellAttempt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Attempt Details</p>
          <button
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="space-y-1 text-xs text-slate-700">
          <p>Block: {selectedCellAttempt.blockName || "-"}</p>
          <p>Lesson: {selectedCellAttempt.lessonTitle || "-"}</p>
          <p>Student: {selectedCellAttempt.studentName || "-"}</p>
          <p>
            Attempt: Latest
            {selectedCellAttempt.attemptCount > 1
              ? ` of ${selectedCellAttempt.attemptCount}`
              : ""}
          </p>
          <p>
            Score: {selectedCellAttempt.attempt.score}/
            {selectedCellAttempt.attempt.total} (
            {Math.round(selectedCellAttempt.pct)}%)
          </p>
          <p>
            Submitted:{" "}
            {new Date(
              (selectedCellAttempt.attempt as any)?.createdAt || Date.now(),
            ).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
