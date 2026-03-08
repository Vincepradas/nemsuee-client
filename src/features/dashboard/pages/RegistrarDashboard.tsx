import { DashboardInfo } from "../../../app/layout/Ui";
import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "../../../shared/types/lms";

type DashboardProps = {
  user: User;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
  hideLmsSisFeatures: boolean;
};

export function RegistrarDashboard(props: DashboardProps) {
  const totalSections = props.courses.reduce(
    (sum, course) => sum + course.sections.length,
    0,
  );
  return (
    <section className="space-y-4">
      <article className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Academic Terms</p>
          <button
            onClick={() => props.onNavigate("admin_blocks")}
            className="mt-2 rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Manage Terms
          </button>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Course Offerings</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {props.courses.length}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Sections / Enrollments</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalSections}</p>
        </div>
      </article>
      <DashboardInfo {...props} role={props.user.role} hideLmsSisFeatures={props.hideLmsSisFeatures} />
    </section>
  );
}



