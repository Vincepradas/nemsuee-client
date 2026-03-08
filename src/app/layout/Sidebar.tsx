import { useState } from "react";
import type { Course, TeachingBlock, User, ViewKey } from "../../shared/types/lms";
import { menu } from "./menu";

export function Sidebar({
  user,
  view,
  setView,
  courses,
  selectedCourseId,
  onOpenCourse,
  archivedCourses,
  onOpenArchivedCourse,
  teachingBlocks = [],
  onOpenTeachingBlock,
  hideLmsSisFeatures = false,
}: {
  user: User;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks?: TeachingBlock[];
  selectedCourseId: number | null;
  onOpenCourse: (id: number) => void;
  onOpenArchivedCourse: (id: number) => void;
  onOpenTeachingBlock?: (courseId: number, sectionId: number) => void;
  hideLmsSisFeatures?: boolean;
}) {
  const [coursesOpen, setCoursesOpen] = useState(true);
  const items = menu(user.role, { hideLmsSisFeatures });
  const hideIdentity = hideLmsSisFeatures && (user.role === "INSTRUCTOR" || user.role === "STUDENT");

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-md bg-gradient-to-br from-blue-700 to-blue-900 p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-slate-200">NEMSU</p>
        <h1 className="text-lg font-bold">E-Learning Platform</h1>
      </div>
      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm">
        {!hideIdentity && (
          <>
            <span className="font-semibold">{user.fullName}</span>
            <br />
          </>
        )}
        {user.role}
      </p>
      <nav className="mt-3 space-y-2">
        {items.map((m) => {
          if (m.key !== "courses" && m.key !== "archives") {
            return (
              <button
                key={m.key}
                onClick={() => setView(m.key)}
                data-keep-action-text={m.key === "course_search" ? "true" : undefined}
                className={`w-full rounded px-3 py-2 text-left text-sm ${view === m.key ? "bg-blue-700 text-white" : "bg-white hover:bg-slate-100"}`}
              >
                {m.label}
              </button>
            );
          }
          if (m.key === "archives") {
            return (
              <div key={m.key}>
                <button
                  onClick={() => setView("archives")}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${view === "archives" ? "bg-blue-700 text-white" : "bg-white hover:bg-slate-100"}`}
                >
                  <span>{m.label}</span>
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 transition-transform ${view === "archives" ? "rotate-90" : "rotate-0"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 5l5 5-5 5" />
                  </svg>
                </button>
                {view === "archives" && (
                  <div className="mt-1 space-y-1 pl-3">
                    {archivedCourses.length ? (
                      archivedCourses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => onOpenArchivedCourse(course.id)}
                          className={`w-full rounded px-3 py-2 text-left text-xs ${
                            selectedCourseId === course.id
                              ? "bg-slate-200 text-slate-900"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {course.title}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-slate-500">No archived courses</p>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={m.key}>
              <button
                onClick={() => {
                  setCoursesOpen((v) => !v);
                  setView("courses");
                }}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${view === "courses" ? "bg-blue-700 text-white" : "bg-white hover:bg-slate-100"}`}
              >
                <span>{m.label}</span>
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 transition-transform ${coursesOpen ? "rotate-90" : "rotate-0"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 5l5 5-5 5" />
                </svg>
              </button>
              {coursesOpen && (
                <div className="mt-1 space-y-1 pl-3">
                  {user.role === "INSTRUCTOR" && teachingBlocks.length ? (
                    teachingBlocks.map((block) => (
                      <button
                        key={`${block.courseId}-${block.id}`}
                        onClick={() => onOpenTeachingBlock?.(block.courseId, block.id)}
                        className={`w-full rounded px-3 py-2 text-left text-xs ${
                          selectedCourseId === block.courseId
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                        title={`${block.courseTitle} - ${block.name}`}
                      >
                        <span className="block truncate font-medium">{block.courseTitle}</span>
                        <span className="block truncate text-[11px] text-slate-500">{block.name}</span>
                      </button>
                    ))
                  ) : courses.length ? (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => onOpenCourse(course.id)}
                        className={`w-full rounded px-3 py-2 text-left text-xs ${
                          selectedCourseId === course.id
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {course.title}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-slate-500">No courses</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

