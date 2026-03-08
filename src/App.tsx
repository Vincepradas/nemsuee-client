import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "./hooks/useApi";
import { useActionIconizer } from "./hooks/useActionIconizer";
import { useNotifications } from "./hooks/useNotifications";
import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "./types/lms";
import logo from "./assets/logo.png";
import { AdminBlocksHub } from "./components/admin/AdminBlocksHub";
import { AuthScreen } from "./components/auth/AuthScreen";
import { CoursesHub } from "./components/course/CoursesHub";
import {
  DashboardInfo,
  Metric,
  Profile,
  Sidebar,
} from "./components/layout/Ui";
import { Scores } from "./components/Scores";
import { Storage } from "./components/Storage";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light",
  );
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [view, setView] = useState<ViewKey>("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachingBlocks, setTeachingBlocks] = useState<TeachingBlock[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [forcedCourseTab, setForcedCourseTab] = useState<
    "content" | "quizzes" | "assignments" | "activities" | "scores" | null
  >(null);
  const { api, headers } = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedCourseIdRef = useRef<number | null>(selectedCourseId);
  const {
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    loadNotifications,
    markAsRead,
  } = useNotifications({ api, headers, enabled: Boolean(user) });

  useActionIconizer();

  useEffect(() => {
    const appTheme = user ? "light" : theme;
    document.documentElement.setAttribute("data-theme", appTheme);
    localStorage.setItem("theme", theme);
  }, [theme, user]);

  useEffect(() => {
    selectedCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId]);

  function navigateToView(nextView: ViewKey) {
    setView(nextView);
    if (nextView === "dashboard") navigate("/dashboard");
    if (nextView === "courses") navigate("/courses");
    if (nextView === "admin_blocks") navigate("/admin/blocks");
    if (nextView === "archives") navigate("/archives");
    if (nextView === "storage") navigate("/files");
  }

  function openCourse(courseId: number) {
    setView("courses");
    setSelectedCourseId(courseId);
    setForcedCourseTab(null);
    navigate(`/courses/${courseId}`);
  }

  async function refreshCore() {
    if (!user) return;
    setIsSyncing(true);
    try {
      const [c, a, archived] = await Promise.all([
        api("/courses", { headers }),
        user.role === "INSTRUCTOR"
          ? api("/quizzes/scores/instructor", { headers })
          : user.role === "STUDENT"
            ? api("/quizzes/scores/me", { headers })
            : Promise.resolve([]),
        user.role === "INSTRUCTOR"
          ? api("/courses/archived", { headers })
          : Promise.resolve([]),
      ]);
      const blocks =
        user.role === "INSTRUCTOR"
          ? await api("/courses/teaching-blocks", { headers })
          : [];
      const activeCourseIds = new Set(
        (c as Course[]).map((course) => course.id),
      );
      const visibleBlocks = (blocks as TeachingBlock[]).filter((block) =>
        activeCourseIds.has(block.courseId),
      );
      setCourses(c);
      setAttempts(a);
      setArchivedCourses(archived);
      setTeachingBlocks(visibleBlocks);
      const currentSelected = selectedCourseIdRef.current;
      if (!currentSelected && c[0]) {
        setSelectedCourseId(c[0].id);
      } else if (
        currentSelected &&
        !c.some((course: Course) => course.id === currentSelected)
      ) {
        setSelectedCourseId(c[0]?.id ?? null);
        if (location.pathname.startsWith("/courses/")) {
          navigate(c[0] ? `/courses/${c[0].id}` : "/courses");
        }
      }
      setLastSync(new Date());
      await loadNotifications();
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/auth/me", { headers });
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } catch (e) {
        const status = (e as { status?: number })?.status;
        if (status === 401) {
          localStorage.removeItem("user");
          setUser(null);
          return;
        }
        setMessage((e as Error).message);
        if (!user) return;
      }
      await refreshCore().catch((e) => setMessage((e as Error).message));
    })();
  }, [user?.role]);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/") {
      setView("dashboard");
      return;
    }
    if (path === "/files") {
      setView("storage");
      return;
    }
    if (path === "/admin/blocks") {
      setView("admin_blocks");
      return;
    }
    if (path === "/archives") {
      setView("archives");
      return;
    }
    if (path === "/courses") {
      setView("courses");
      return;
    }
    const courseMatch = path.match(/^\/courses\/(\d+)$/);
    if (courseMatch) {
      setView("courses");
      setSelectedCourseId(Number(courseMatch[1]));
    }
  }, [location.pathname]);

  if (!user) {
    return (
      <AuthScreen
        api={api}
        message={message}
        setMessage={setMessage}
        theme={theme}
        onToggleTheme={() =>
          setTheme((t) => (t === "light" ? "dark" : "light"))
        }
        onAuth={(u) => {
          localStorage.setItem("user", JSON.stringify(u));
          setUser(u);
        }}
      />
    );
  }

  const selectedCourse = courses.find((x) => x.id === selectedCourseId) || null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded p-2 text-sm text-slate-700 hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="University logo"
                className="h-9 w-9 rounded-full"
              />
              <p className="text-sm font-semibold md:text-base">
                North Eastern Mindanao State University
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              className="relative rounded p-2 text-slate-700 hover:bg-slate-100"
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((v) => !v);
                loadNotifications();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M10 17a2 2 0 0 0 4 0" />
              </svg>
              {!!notifications.filter((n) => !Boolean(n.isRead)).length && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-12 top-12 z-50 w-80 rounded-md border border-slate-200 bg-white p-2 shadow-md">
                <p className="px-2 pb-1 text-xs font-semibold text-slate-600">
                  Notifications
                </p>
                <div className="max-h-80 space-y-1 overflow-auto">
                  {notifications.length ? (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        data-keep-action-text="true"
                        onClick={async () => {
                          if (!Boolean(notification.isRead)) {
                            await markAsRead(notification.id);
                          }
                          if (notification.courseId) {
                            setView("courses");
                            setSelectedCourseId(Number(notification.courseId));
                            setForcedCourseTab("content");
                            navigate(`/courses/${notification.courseId}`);
                          }
                          setNotificationsOpen(false);
                        }}
                        className={`w-full rounded px-2 py-2 text-left hover:bg-slate-50 ${
                          Boolean(notification.isRead)
                            ? "bg-white"
                            : "bg-blue-50/40"
                        }`}
                      >
                        <p className="line-clamp-2 text-xs text-slate-800">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="px-2 py-3 text-xs text-slate-500">
                      No notifications yet.
                    </p>
                  )}
                </div>
              </div>
            )}
            <button
              className="rounded p-2 text-slate-700 hover:bg-slate-100"
              aria-label="Open profile menu"
              onClick={() => setProfileMenuOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-md">
                <button
                  onClick={() => {
                    setMessage("Settings panel is not available yet.");
                    setProfileMenuOpen(false);
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    setView("profile");
                    setProfileMenuOpen(false);
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setView("scores");
                    setProfileMenuOpen(false);
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  Grades
                </button>
                <button
                  onClick={() => {
                    api("/auth/logout", { method: "POST", headers }).catch(
                      () => null,
                    );
                    localStorage.removeItem("user");
                    setUser(null);
                  }}
                  data-keep-action-text="true"
                  className="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden">
          <div className="h-full w-[280px] p-3">
            <Sidebar
              user={user}
              view={view}
              courses={courses}
              archivedCourses={archivedCourses}
              selectedCourseId={selectedCourseId}
              onOpenCourse={(id) => {
                openCourse(id);
                setSidebarOpen(false);
              }}
              teachingBlocks={teachingBlocks}
              onOpenTeachingBlock={(courseId, sectionId) => {
                setView("courses");
                setSelectedCourseId(courseId);
                navigate(`/courses/${courseId}#section-${sectionId}`);
                setSidebarOpen(false);
              }}
              onOpenArchivedCourse={(id) => {
                setView("archives");
                setSelectedCourseId(id);
                setSidebarOpen(false);
              }}
              setView={(v) => {
                navigateToView(v);
                setSidebarOpen(false);
              }}
            />
          </div>
          <button
            className="absolute inset-0 -z-10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
        </div>
      )}

      <div
        className={`mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-4 py-4 ${
          sidebarOpen ? "lg:grid-cols-[250px_1fr]" : "lg:grid-cols-1"
        }`}
      >
        {sidebarOpen && (
          <div className="hidden lg:block">
            <Sidebar
              user={user}
              view={view}
              courses={courses}
              archivedCourses={archivedCourses}
              selectedCourseId={selectedCourseId}
              onOpenCourse={openCourse}
              teachingBlocks={teachingBlocks}
              onOpenTeachingBlock={(courseId, sectionId) => {
                setView("courses");
                setSelectedCourseId(courseId);
                navigate(`/courses/${courseId}#section-${sectionId}`);
              }}
              onOpenArchivedCourse={(id) => {
                setView("archives");
                setSelectedCourseId(id);
              }}
              setView={(v) => {
                navigateToView(v);
              }}
            />
          </div>
        )}

        <main className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {view === "dashboard" && (
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <p>
                {isSyncing
                  ? "Syncing data..."
                  : `Last sync: ${lastSync ? lastSync.toLocaleTimeString() : "not yet"}`}
              </p>
              <button
                onClick={() =>
                  refreshCore().catch((e) => setMessage((e as Error).message))
                }
                className="rounded border border-slate-300 px-2 py-1"
              >
                Refresh Now
              </button>
            </div>
          )}
          {message && (
            <p className="mb-3 rounded border border-slate-300 bg-slate-100 p-2 text-sm">
              {message}
            </p>
          )}

          {view === "dashboard" && user.role !== "INSTRUCTOR" && (
            <section className="mb-4 grid gap-3 md:grid-cols-4">
              <Metric label="Courses" value={String(courses.length)} />
              <Metric
                label="Sections"
                value={String(
                  courses.reduce((a, c) => a + c.sections.length, 0),
                )}
              />
              <Metric
                label="Lessons"
                value={String(
                  courses.reduce(
                    (a, c) =>
                      a + c.sections.reduce((b, s) => b + s.lessons.length, 0),
                    0,
                  ),
                )}
              />
              <Metric
                label="Average"
                value={`${attempts.length ? Math.round(attempts.reduce((a, x) => a + (x.score / Math.max(1, x.total)) * 100, 0) / attempts.length) : 0}%`}
              />
            </section>
          )}

          {view === "dashboard" && (
            <DashboardInfo
              user={user}
              role={user.role}
              courses={courses}
              archivedCourses={archivedCourses}
              teachingBlocks={teachingBlocks}
              attempts={attempts}
              lastSync={lastSync}
              onNavigate={navigateToView}
              onRefresh={() =>
                refreshCore().catch((e) => setMessage((e as Error).message))
              }
            />
          )}
          {view === "courses" && (
            <CoursesHub
              user={user}
              api={api}
              headers={headers}
              courses={courses}
              attempts={attempts}
              selectedCourse={selectedCourse}
              refreshCore={refreshCore}
              setMessage={setMessage}
              studentViewMode={user.role === "STUDENT" ? "my" : "all"}
              forcedCourseTab={forcedCourseTab}
            />
          )}
          {view === "course_search" && user.role === "STUDENT" && (
            <CoursesHub
              user={user}
              api={api}
              headers={headers}
              courses={courses}
              attempts={attempts}
              selectedCourse={selectedCourse}
              refreshCore={refreshCore}
              setMessage={setMessage}
              studentViewMode="search"
              forcedCourseTab={forcedCourseTab}
            />
          )}
          {view === "scores" && <Scores attempts={attempts} />}
          {view === "storage" && (
            <Storage api={api} headers={headers} setMessage={setMessage} />
          )}
          {view === "profile" && <Profile user={user} />}
          {view === "admin_blocks" && user.role === "ADMIN" && (
            <AdminBlocksHub
              api={api}
              headers={headers}
              courses={courses}
              refreshCore={refreshCore}
              setMessage={setMessage}
            />
          )}
          {view === "archives" && user.role === "INSTRUCTOR" && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Archived Courses</h3>
              {archivedCourses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm text-slate-600">{course.description}</p>
                  <div className="mt-2">
                    <button
                      onClick={async () => {
                        try {
                          await api(`/courses/${course.id}/archive`, {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ archived: false }),
                          });
                          await refreshCore();
                          setMessage("Course unarchived.");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                      className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
                    >
                      Unarchive
                    </button>
                  </div>
                </article>
              ))}
              {!archivedCourses.length && (
                <p className="text-sm text-slate-500">No archived courses.</p>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
