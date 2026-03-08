import type { Course } from "../../../../shared/types/lms";
import type { SectionInstructor } from "./types";

export function BlocksManagementSection(props: {
  courses: Course[];
  selectedCourse: Course | null;
  selectedCourseId: number | null;
  sectionInstructors: Record<number, SectionInstructor[]>;
  studentCountBySection: Record<number, number>;
  onSelectCourse: (courseId: number) => void;
  onAddBlock: () => void;
  onManageBlock: (sectionId: number) => void;
  onDeleteBlock: (sectionId: number) => void;
}) {
  const {
    courses,
    selectedCourse,
    selectedCourseId,
    sectionInstructors,
    studentCountBySection,
    onSelectCourse,
    onAddBlock,
    onManageBlock,
    onDeleteBlock,
  } = props;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <select
          value={selectedCourseId || ""}
          onChange={(e) => onSelectCourse(Number(e.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <button
          onClick={onAddBlock}
          disabled={!selectedCourse}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Add Block
        </button>
      </div>
      {!selectedCourse && <p className="text-sm text-slate-500">No course selected.</p>}
      {selectedCourse && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Block Name</th>
                <th className="px-3 py-2 text-left">Assigned Instructor</th>
                <th className="px-3 py-2 text-left">Student Count</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedCourse.sections.map((section) => {
                const assigned = sectionInstructors[section.id] || [];
                const label = assigned.length
                  ? assigned.map((i) => i.fullName).join(", ")
                  : "Unassigned";
                return (
                  <tr key={section.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{section.name}</td>
                    <td className="px-3 py-2">{label}</td>
                    <td className="px-3 py-2">
                      {studentCountBySection[section.id] ?? 0}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onManageBlock(section.id)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        >
                          Manage Block
                        </button>
                        <button
                          onClick={() => onDeleteBlock(section.id)}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                        >
                          Delete Block
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!selectedCourse.sections.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-center text-slate-500">
                    No blocks yet for this course.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
