import type { AcademicTerm } from "./types";

export function SummaryMetrics(props: {
  activeTerm: AcademicTerm | null;
  coursesOffered: number;
  instructorsAssigned: number;
  totalBlocks: number;
}) {
  const { activeTerm, coursesOffered, instructorsAssigned, totalBlocks } = props;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Academic Management Dashboard
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Overview of active term, offerings, instructor assignment, and blocks.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active Term
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {activeTerm
              ? `${activeTerm.academicYear} - ${activeTerm.name}`
              : "No active term"}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Courses Offered
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {coursesOffered}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Instructors Assigned
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {instructorsAssigned}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Blocks
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totalBlocks}
          </p>
        </div>
      </div>
    </article>
  );
}
