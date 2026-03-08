import type { Role, ViewKey } from "../../shared/types/lms";

export function menu(
  role: Role,
  options?: { hideLmsSisFeatures?: boolean },
): { key: ViewKey; label: string }[] {
  const hideLmsSisFeatures = Boolean(options?.hideLmsSisFeatures);
  if (role === "STUDENT") {
    const items: { key: ViewKey; label: string }[] = [
      { key: "dashboard", label: "Dashboard" },
      { key: "courses", label: "Courses" },
      { key: "course_search", label: "Search Course" },
      { key: "storage", label: "Files" },
    ];
    if (!hideLmsSisFeatures) {
      items.splice(3, 0, { key: "scores", label: "Grades" });
    }
    return items;
  }

  if (role === "ADMIN" || role === "REGISTRAR") {
    const items: { key: ViewKey; label: string }[] = [
      { key: "dashboard", label: "Dashboard" },
      { key: "admin_blocks", label: "Academic Management" },
      { key: "storage", label: "Files" },
    ];
    if (!hideLmsSisFeatures) {
      items.splice(2, 0, { key: "grade_computation", label: "Grade Review" });
    }
    return items;
  }

  if (role === "DEAN") {
    const items: { key: ViewKey; label: string }[] = [
      { key: "dashboard", label: "Dashboard" },
      { key: "storage", label: "Files" },
    ];
    if (!hideLmsSisFeatures) {
      items.splice(1, 0, { key: "grade_computation", label: "Grade Review" });
    }
    return items;
  }

  const items: { key: ViewKey; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "courses", label: "My Blocks" },
    { key: "storage", label: "Files" },
    { key: "archives", label: "Archives" },
  ];
  if (!hideLmsSisFeatures) {
    items.splice(2, 0, { key: "scores", label: "Quiz Scores" });
    items.splice(3, 0, { key: "grade_computation", label: "Grades Section" });
  }
  return items;
}
