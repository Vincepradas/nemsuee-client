import { SearchableDropdown } from "../../../../shared/components/SearchableDropdown";
import type { Course } from "../../../../shared/types/lms";
import type { Instructor, SectionInstructor } from "./types";

export function AddBlockModal(props: {
  open: boolean;
  selectedCourse: Course | null;
  blockName: string;
  onChangeBlockName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const {
    open,
    selectedCourse,
    blockName,
    onChangeBlockName,
    onClose,
    onSubmit,
  } = props;
  if (!open || !selectedCourse) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Block</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-500">{selectedCourse.title}</p>
        <div className="grid gap-2">
          <input
            value={blockName}
            onChange={(e) => onChangeBlockName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Block name (e.g., BLOCK-A)"
          />
          <button
            onClick={onSubmit}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            Add Block
          </button>
        </div>
      </article>
    </div>
  );
}

export function ManageBlockModal(props: {
  open: boolean;
  course: Course | null;
  sectionId: number | null;
  sectionName: string;
  editingSectionName: string;
  onChangeEditingSectionName: (value: string) => void;
  assignedInstructors: SectionInstructor[];
  instructorQuery: string;
  instructorOptions: Instructor[];
  onChangeInstructorQuery: (value: string) => void;
  onClose: () => void;
  onSaveName: () => void;
  onRemoveInstructor: (instructorId: number, fullName: string) => void;
  onAssignInstructor: () => void;
}) {
  const {
    open,
    sectionName,
    editingSectionName,
    onChangeEditingSectionName,
    assignedInstructors,
    instructorQuery,
    instructorOptions,
    onChangeInstructorQuery,
    onClose,
    onSaveName,
    onRemoveInstructor,
    onAssignInstructor,
  } = props;

  if (!open) return null;

  const optionLabels = instructorOptions.map(
    (instructor) => `${instructor.fullName} (${instructor.email})`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Manage Block: {sectionName}</h3>
            <p className="text-xs text-slate-500">
              Rename block and update instructor assignments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">Block Name</p>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              value={editingSectionName}
              onChange={(e) => onChangeEditingSectionName(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={onSaveName}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Save Block Name
            </button>
          </div>
        </div>

        <div className="mb-3 rounded-md border border-slate-200 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Assigned Instructors
          </p>
          <div className="space-y-2">
            {assignedInstructors.map((instructor) => (
              <div
                key={instructor.instructorId}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <p>{instructor.fullName}</p>
                  <p className="text-xs text-slate-500">{instructor.email}</p>
                </div>
                <button
                  onClick={() =>
                    onRemoveInstructor(instructor.instructorId, instructor.fullName)
                  }
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                >
                  Remove Instructor
                </button>
              </div>
            ))}
            {!assignedInstructors.length && (
              <p className="text-xs text-slate-500">No instructors assigned.</p>
            )}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Assign Instructor
          </p>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <SearchableDropdown
              value={instructorQuery}
              onChange={onChangeInstructorQuery}
              options={optionLabels}
              placeholder="Search instructor by name or email"
            />
            <button
              onClick={onAssignInstructor}
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
            >
              Assign Instructor
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
