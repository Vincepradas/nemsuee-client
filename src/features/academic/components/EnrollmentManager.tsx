import type { Course } from "../../../shared/types/lms";

export function EnrollmentManager({
  selectedCourse,
  studentCountBySection,
}: {
  selectedCourse: Course | null;
  studentCountBySection: Record<number, number>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Section</th>
            <th className="px-3 py-2 text-left">Enrolled Students</th>
          </tr>
        </thead>
        <tbody>
          {(selectedCourse?.sections || []).map((section) => (
            <tr key={section.id} className="border-t border-slate-200">
              <td className="px-3 py-2">{section.name}</td>
              <td className="px-3 py-2">{studentCountBySection[section.id] ?? 0}</td>
            </tr>
          ))}
          {!selectedCourse?.sections.length && (
            <tr>
              <td colSpan={2} className="px-3 py-3 text-center text-slate-500">
                No sections available for enrollment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
