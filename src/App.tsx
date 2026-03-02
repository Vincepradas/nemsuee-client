import { useEffect, useState } from "react";
import { useApi } from "./hooks/useApi";
import type { Attempt, Course, User, ViewKey } from "./types/lms";
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
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [view, setView] = useState<ViewKey>("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { api, headers } = useApi(token);

  async function refreshCore() {
    if (!token || !user) return;
    setIsSyncing(true);
    try {
      const [c, a] = await Promise.all([
        api("/courses", { headers }),
        api(
          user.role === "INSTRUCTOR"
            ? "/quizzes/scores/instructor"
            : "/quizzes/scores/me",
          { headers },
        ),
      ]);
      setCourses(c);
      setAttempts(a);
      if (!selectedCourseId && c[0]) setSelectedCourseId(c[0].id);
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    refreshCore().catch((e) => setMessage((e as Error).message));
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || !user) return;

    const intervalId = window.setInterval(() => {
      refreshCore().catch(() => {});
    }, 15000);

    const onFocus = () => {
      refreshCore().catch(() => {});
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshCore().catch(() => {});
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, user?.id, user?.role]);

  if (!token || !user) {
    return (
      <AuthScreen
        api={api}
        setMessage={setMessage}
        onAuth={(t, u) => {
          localStorage.setItem("token", t);
          localStorage.setItem("user", JSON.stringify(u));
          setToken(t);
          setUser(u);
        }}
      />
    );
  }

  const selectedCourse =
    courses.find((x) => x.id === selectedCourseId) || courses[0] || null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:hidden">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            aria-label="Toggle menu"
          >
            Menu
          </button>
          <p className="text-sm font-semibold">NEMSU E-Learning</p>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden">
          <div className="h-full w-[280px] p-3">
            <Sidebar
              user={user}
              view={view}
              setView={(v) => {
                setView(v);
                setMobileMenuOpen(false);
              }}
              onLogout={() => {
                localStorage.clear();
                setToken(null);
                setUser(null);
              }}
            />
          </div>
          <button
            className="absolute inset-0 -z-10"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />
        </div>
      )}

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[250px_1fr]">
        <div className="hidden lg:block">
          <Sidebar
            user={user}
            view={view}
            setView={setView}
            onLogout={() => {
              localStorage.clear();
              setToken(null);
              setUser(null);
            }}
          />
        </div>

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

          {view === "dashboard" && (
            <section className="mb-4 grid gap-3 md:grid-cols-4">
              <Metric label="Courses" value={String(courses.length)} />
              <Metric
                label="Sections"
                value={String(courses.reduce((a, c) => a + c.sections.length, 0))}
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
              attempts={attempts}
              lastSync={lastSync}
              onNavigate={setView}
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
              setSelectedCourseId={setSelectedCourseId}
              refreshCore={refreshCore}
              setMessage={setMessage}
              studentViewMode={user.role === "STUDENT" ? "my" : "all"}
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
              setSelectedCourseId={setSelectedCourseId}
              refreshCore={refreshCore}
              setMessage={setMessage}
              studentViewMode="search"
            />
          )}
          {view === "scores" && <Scores attempts={attempts} />}
          {view === "storage" && (
            <Storage api={api} headers={headers} setMessage={setMessage} />
          )}
          {view === "profile" && <Profile user={user} />}
        </main>
      </div>
    </div>
  );
}
