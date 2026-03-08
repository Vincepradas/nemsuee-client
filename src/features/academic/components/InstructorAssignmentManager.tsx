import type { Course } from "../../../shared/types/lms";
import type { SectionInstructor } from "../../admin/components/management/types";

export function InstructorAssignmentManager({
  selectedCourse,
  sectionInstructors,
}: {
  selectedCourse: Course | null;
  sectionInstructors: Record<number, SectionInstructor[]>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Section</th>
            <th className="px-3 py-2 text-left">Assigned Instructors</th>
          </tr>
        </thead>
        <tbody>
          {(selectedCourse?.sections || []).map((section) => {
            const labels = (sectionInstructors[section.id] || []).map(
              (assignment) => assignment.fullName,
            );
            return (
              <tr key={section.id} className="border-t border-slate-200">
                <td className="px-3 py-2">{section.name}</td>
                <td className="px-3 py-2">
                  {labels.length ? labels.join(", ") : "Unassigned"}
                </td>
              </tr>
            );
          })}
          {!selectedCourse?.sections.length && (
            <tr>
              <td colSpan={2} className="px-3 py-3 text-center text-slate-500">
                No section assignments yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
