import type { Course } from "../../../shared/types/lms";
import { buildCourseCatalog } from "../services/academicWorkflowService";

export function CourseCatalogManager({ courses }: { courses: Course[] }) {
  const catalog = buildCourseCatalog(courses);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Course Code</th>
            <th className="px-3 py-2 text-left">Title</th>
            <th className="px-3 py-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          {catalog.map((course) => (
            <tr key={course.id} className="border-t border-slate-200">
              <td className="px-3 py-2">#{course.id}</td>
              <td className="px-3 py-2">{course.title}</td>
              <td className="px-3 py-2 text-slate-600">
                {course.description || "No description"}
              </td>
            </tr>
          ))}
          {!catalog.length && (
            <tr>
              <td colSpan={3} className="px-3 py-3 text-center text-slate-500">
                No course catalog entries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
