import type { GradebookStudentRow, ScoreRow } from "../types/scoreTypes";

type InstructorGradebookTableProps = {
  rows: GradebookStudentRow[];
  lessonColumns: string[];
  onSelectCell: (row: ScoreRow) => void;
};

export function InstructorGradebookTable({
  rows,
  lessonColumns,
  onSelectCell,
}: InstructorGradebookTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left">Block</th>
            <th className="px-3 py-2 text-left">Student</th>
            {lessonColumns.map((lesson) => (
              <th key={`head-${lesson}`} className="px-3 py-2 text-left">
                {lesson}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((studentRow) => (
            <tr key={studentRow.key} className="border-t border-slate-100">
              <td className="px-3 py-2">{studentRow.blockName}</td>
              <td className="px-3 py-2 font-medium">
                {studentRow.studentName}
              </td>
              {lessonColumns.map((lesson) => {
                const cell = studentRow.cells[lesson];
                if (!cell) {
                  return (
                    <td
                      key={`${studentRow.key}-${lesson}`}
                      className="px-3 py-2 text-slate-400"
                    >
                      -
                    </td>
                  );
                }
                return (
                  <td key={`${studentRow.key}-${lesson}`} className="px-3 py-2">
                    <button
                      className={`rounded px-2 py-1 text-left ${cell.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                      onClick={() => onSelectCell(cell)}
                      title="View attempt details"
                    >
                      {cell.attempt.score}/{cell.attempt.total} (
                      {Math.round(cell.pct)}%)
                    </button>
                    <div className="mt-1 h-1.5 w-20 rounded bg-slate-200">
                      <div
                        className={`h-full rounded ${cell.passed ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${Math.max(0, Math.min(100, Math.round(cell.pct)))}%` }}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
