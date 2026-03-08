import { SearchableDropdown } from "../../../../shared/components/SearchableDropdown";
import type { Instructor, TermOffering } from "./types";

export function CreateOfferingModal(props: {
  open: boolean;
  terms: { id: number; academicYear: string; name: string }[];
  selectedTermId: number | null;
  title: string;
  description: string;
  instructorId: number | null;
  instructors: Instructor[];
  onClose: () => void;
  onChangeTermId: (termId: number) => void;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeInstructorId: (value: number | null) => void;
  onSubmit: () => void;
}) {
  const {
    open,
    terms,
    selectedTermId,
    title,
    description,
    instructorId,
    instructors,
    onClose,
    onChangeTermId,
    onChangeTitle,
    onChangeDescription,
    onChangeInstructorId,
    onSubmit,
  } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Course Offering</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <div className="grid gap-2">
          <select
            value={selectedTermId || ""}
            onChange={(e) => onChangeTermId(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.academicYear} - {term.name}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Course title"
          />
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Course description"
          />
          <select
            value={instructorId || ""}
            onChange={(e) =>
              onChangeInstructorId(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Instructor (optional)</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.fullName}
              </option>
            ))}
          </select>
          <button
            onClick={onSubmit}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            Create Offering
          </button>
        </div>
      </article>
    </div>
  );
}

export function AssignOfferingInstructorModal(props: {
  open: boolean;
  offering: TermOffering | null;
  query: string;
  instructors: Instructor[];
  onClose: () => void;
  onChangeQuery: (value: string) => void;
  onSubmit: () => void;
}) {
  const { open, offering, query, instructors, onClose, onChangeQuery, onSubmit } =
    props;
  if (!open || !offering) return null;
  const options = instructors.map((i) => `${i.fullName} (${i.email})`);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Assign Instructor</h3>
            <p className="text-xs text-slate-500">{offering.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <div className="space-y-3">
          <SearchableDropdown
            value={query}
            onChange={onChangeQuery}
            options={options}
            placeholder="Search instructor by name or email"
          />
          <button
            onClick={onSubmit}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            Confirm Assignment
          </button>
        </div>
      </article>
    </div>
  );
}
