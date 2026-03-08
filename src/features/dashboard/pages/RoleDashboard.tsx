import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "../../../shared/types/lms";
import { AdminRegistrarDashboard } from "./AdminRegistrarDashboard";
import { DeanDashboard } from "./DeanDashboard";
import { InstructorDashboard } from "./InstructorDashboard";
import { RegistrarDashboard } from "./RegistrarDashboard";
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
  hideLmsSisFeatures: boolean;
};

export function RoleDashboard(props: DashboardProps) {
  type DashboardTab = "admin" | "registrar" | "dean" | "instructor" | "student";
  const allowedTabs = useMemo(() => {
    if (props.user.role === "ADMIN") {
      return ["admin", "registrar", "dean", "instructor", "student"] as DashboardTab[];
    }
    if (props.user.role === "REGISTRAR") return ["registrar"] as DashboardTab[];
    if (props.user.role === "DEAN") return ["dean"] as DashboardTab[];
    if (props.user.role === "INSTRUCTOR") return ["instructor"] as DashboardTab[];
    return ["student"] as DashboardTab[];
  }, [props.user.role]);
  const [activeTab, setActiveTab] = useState<DashboardTab>(allowedTabs[0]);
  const safeTab = allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

  const tabLabels: Record<DashboardTab, string> = {
    admin: "Admin",
    registrar: "Registrar",
    dean: "Dean",
    instructor: "Instructor",
    student: "Student",
  };

  let dashboardContent: ReactElement;
  if (safeTab === "admin") {
    dashboardContent = <AdminRegistrarDashboard {...props} />;
  } else if (safeTab === "registrar") {
    dashboardContent = <RegistrarDashboard {...props} />;
  } else if (safeTab === "dean") {
    dashboardContent = <DeanDashboard {...props} />;
  } else if (safeTab === "instructor") {
    dashboardContent = <InstructorDashboard {...props} />;
  } else {
    dashboardContent = <StudentDashboard {...props} />;
  }

  return (
    <section className="space-y-4">
      <div className="inline-flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        {allowedTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              safeTab === tab
                ? "bg-blue-700 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>
      {dashboardContent}
    </section>
  );
}



