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
  hideLmsSisFeatures: boolean;
};

export function InstructorDashboard(props: DashboardProps) {
  return <DashboardInfo {...props} role={props.user.role} hideLmsSisFeatures={props.hideLmsSisFeatures} />;
}



