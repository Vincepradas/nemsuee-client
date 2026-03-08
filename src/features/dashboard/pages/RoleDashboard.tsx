import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "../../../shared/types/lms";
import { AdminRegistrarDashboard } from "./AdminRegistrarDashboard";
import { InstructorDashboard } from "./InstructorDashboard";
import { StudentDashboard } from "./StudentDashboard";

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

export function RoleDashboard(props: DashboardProps) {
  if (props.user.role === "ADMIN") {
    return <AdminRegistrarDashboard {...props} />;
  }
  if (props.user.role === "INSTRUCTOR") {
    return <InstructorDashboard {...props} />;
  }
  return <StudentDashboard {...props} />;
}
