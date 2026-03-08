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

export function DeanDashboard(props: DashboardProps) {
  return (
    <section className="space-y-4">
      <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Faculty Oversight</p>
        <p className="mt-1 text-sm text-slate-700">
          Review pending grade submissions and monitor course delivery performance.
        </p>
        {!props.hideLmsSisFeatures && (
          <button
            onClick={() => props.onNavigate("grade_computation")}
            className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Open Grade Review Queue
          </button>
        )}
      </article>
      <DashboardInfo {...props} role={props.user.role} hideLmsSisFeatures={props.hideLmsSisFeatures} />
    </section>
  );
}



