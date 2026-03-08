import type { Course } from "../../../../shared/types/lms";
import type { Instructor, TermOffering } from "./types";

export function CourseOfferingsSection(props: {
  offerings: TermOffering[];
  courses: Course[];
  terms: { id: number; academicYear: string; name: string }[];
  instructors: Instructor[];
  selectedTermId: number | null;
  offeringQuery: string;
  instructorFilter: string;
  onChangeOfferingQuery: (value: string) => void;
  onChangeInstructorFilter: (value: string) => void;
  onChangeTermId: (termId: number) => void;
  onCreateOffering: () => void;
  onManageOffering: (offering: TermOffering) => void;
  onAssignInstructor: (offering: TermOffering) => void;
}) {
  const {
    offerings,
    courses,
    terms,
    instructors,
    selectedTermId,
    offeringQuery,
    instructorFilter,
    onChangeOfferingQuery,
    onChangeInstructorFilter,
    onChangeTermId,
    onCreateOffering,
    onManageOffering,
    onAssignInstructor,
  } = props;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 lg:grid-cols-[1fr_220px_220px_auto]">
        <input
          value={offeringQuery}
          onChange={(e) => onChangeOfferingQuery(e.target.value)}
          placeholder="Search course"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={instructorFilter}
          onChange={(e) => onChangeInstructorFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All instructors</option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={String(instructor.id)}>
              {instructor.fullName}
            </option>
          ))}
        </select>
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
        <button
          onClick={onCreateOffering}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
        >
          Create Course
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Course</th>
              <th className="px-3 py-2 text-left">Instructor</th>
              <th className="px-3 py-2 text-left">Blocks</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offerings.map((offering) => {
              const course = courses.find(
                (c) => c.id === Number(offering.courseId || 0),
              );
              return (
                <tr key={offering.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900">{offering.title}</p>
                    <p className="text-xs text-slate-500">
                      {offering.description || "No description"}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    {offering.instructorName || "Unassigned"}
                  </td>
                  <td className="px-3 py-2">
                    {course ? `${course.sections.length} block(s)` : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onManageOffering(offering)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => onAssignInstructor(offering)}
                        className="rounded-md border border-blue-300 px-2 py-1 text-xs text-blue-700"
                      >
                        Assign Instructor
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!offerings.length && (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center text-slate-500">
                  No offerings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
