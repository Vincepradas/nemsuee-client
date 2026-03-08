import type { AcademicWorkflowTree } from "../types/academicTypes";

export function AcademicWorkflowTreeCard({ tree }: { tree: AcademicWorkflowTree }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Academic Workflow</h3>
      <p className="text-xs text-slate-500">{tree.termLabel}</p>
      <div className="mt-3 space-y-2">
        {tree.offerings.length ? (
          tree.offerings.map((offering) => (
            <div
              key={offering.courseId}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <p className="font-medium text-slate-900">{offering.courseTitle}</p>
              <div className="mt-1 space-y-1 text-xs text-slate-600">
                {offering.sections.length ? (
                  offering.sections.map((section) => (
                    <p key={section.id}>
                      {section.name}: {section.studentCount} student
                      {section.studentCount === 1 ? "" : "s"} |{" "}
                      {section.instructors.length
                        ? section.instructors.join(", ")
                        : "No instructor"}
                    </p>
                  ))
                ) : (
                  <p>No sections configured.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No course offerings found.</p>
        )}
      </div>
    </article>
  );
}
