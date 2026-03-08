import type { Role, ViewKey } from "../../types/lms";

export function menu(role: Role): { key: ViewKey; label: string }[] {
  if (role === "STUDENT") {
    return [
      { key: "dashboard", label: "Dashboard" },
      { key: "courses", label: "Courses" },
      { key: "course_search", label: "Search Course" },
      { key: "storage", label: "Files" },
    ];
  }

  if (role === "ADMIN") {
    return [
      { key: "dashboard", label: "Dashboard" },
      { key: "admin_blocks", label: "Block Admin" },
      { key: "storage", label: "Files" },
    ];
  }

  return [
    { key: "dashboard", label: "Dashboard" },
    { key: "courses", label: "My Blocks" },
    { key: "scores", label: "Gradebook" },
    { key: "storage", label: "Files" },
    { key: "archives", label: "Archives" },
  ];
}
