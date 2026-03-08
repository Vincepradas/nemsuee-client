import { DashboardInfo } from "../../../app/layout/Ui";
import type { Attempt, Course, TeachingBlock, User, ViewKey } from "../../../shared/types/lms";

type DashboardProps = {
  user: User;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
};

export function StudentDashboard(props: DashboardProps) {
  const completion = props.attempts.length
    ? Math.round(
        props.attempts.reduce(
          (sum, attempt) =>
            sum + (attempt.score / Math.max(1, attempt.total)) * 100,
          0,
        ) / props.attempts.length,
      )
    : 0;
  return (
    <section className="space-y-4">
      <article className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">My Courses</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {props.courses.length}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average Progress</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{completion}%</p>
        </div>
      </article>
      <DashboardInfo {...props} role={props.user.role} />
    </section>
  );
}
