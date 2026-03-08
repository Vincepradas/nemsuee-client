import type { AcademicTerm } from "./types";

export function AcademicTermsSection(props: {
  terms: AcademicTerm[];
  onCreateTerm: () => void;
  onEditTerm: (term: AcademicTerm) => void;
  onActivateTerm: (termId: number) => void;
  onToggleArchiveTerm: (term: AcademicTerm) => void;
  onDeleteTerm: (term: AcademicTerm) => void;
}) {
  const {
    terms,
    onCreateTerm,
    onEditTerm,
    onActivateTerm,
    onToggleArchiveTerm,
    onDeleteTerm,
  } = props;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onCreateTerm}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
        >
          Create Term
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Academic Year</th>
              <th className="px-3 py-2 text-left">Term</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => {
              const status = Number(term.isActive)
                ? "Active"
                : Number(term.isArchived)
                  ? "Archived"
                  : "Inactive";
              return (
                <tr key={term.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{term.academicYear}</td>
                  <td className="px-3 py-2">{term.name}</td>
                  <td className="px-3 py-2">{status}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEditTerm(term)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        Edit Term
                      </button>
                      {!Number(term.isActive) && (
                        <button
                          onClick={() => onActivateTerm(term.id)}
                          className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                        >
                          Activate Term
                        </button>
                      )}
                      <button
                        onClick={() => onToggleArchiveTerm(term)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        {Number(term.isArchived) ? "Unarchive Term" : "Archive Term"}
                      </button>
                      {!Number(term.isActive) && (
                        <button
                          onClick={() => onDeleteTerm(term)}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                        >
                          Delete Term
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!terms.length && (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center text-slate-500">
                  No academic terms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
