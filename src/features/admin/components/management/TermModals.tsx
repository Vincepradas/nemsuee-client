export function CreateTermModal(props: {
  open: boolean;
  academicYear: string;
  termName: string;
  onChangeAcademicYear: (value: string) => void;
  onChangeTermName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const {
    open,
    academicYear,
    termName,
    onChangeAcademicYear,
    onChangeTermName,
    onClose,
    onSubmit,
  } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Academic Term</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <div className="grid gap-2">
          <input
            value={academicYear}
            onChange={(e) => onChangeAcademicYear(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Academic year (e.g., 2026 - 2027)"
          />
          <input
            value={termName}
            onChange={(e) => onChangeTermName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Term (e.g., 1st Semester)"
          />
          <button
            onClick={onSubmit}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            Create Term
          </button>
        </div>
      </article>
    </div>
  );
}

export function EditTermModal(props: {
  open: boolean;
  academicYear: string;
  termName: string;
  onChangeAcademicYear: (value: string) => void;
  onChangeTermName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const {
    open,
    academicYear,
    termName,
    onChangeAcademicYear,
    onChangeTermName,
    onClose,
    onSubmit,
  } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Academic Term</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <div className="grid gap-2">
          <input
            value={academicYear}
            onChange={(e) => onChangeAcademicYear(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Academic year"
          />
          <input
            value={termName}
            onChange={(e) => onChangeTermName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Term"
          />
          <button
            onClick={onSubmit}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            Save Term
          </button>
        </div>
      </article>
    </div>
  );
}
