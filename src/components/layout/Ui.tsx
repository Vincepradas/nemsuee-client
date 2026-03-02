import type { Attempt, Course, Role, User, ViewKey } from "../../types/lms";

export function menu(role: Role): { key: ViewKey; label: string }[] {
  if (role === "STUDENT") {
    return [
      { key: "dashboard", label: "Dashboard" },
      { key: "courses", label: "My Courses" },
      { key: "course_search", label: "Course Search" },
      { key: "scores", label: "My Scores" },
      { key: "storage", label: "My Storage" },
      { key: "profile", label: "Profile" },
    ];
  }
  return [
    { key: "dashboard", label: "Dashboard" },
    { key: "courses", label: "Courses" },
    {
      key: "scores",
      label: "Student Scores",
    },
    { key: "storage", label: "My Storage" },
    { key: "profile", label: "Profile" },
  ];
}

export function Sidebar({
  user,
  view,
  setView,
  onLogout,
}: {
  user: User;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-md bg-gradient-to-br from-blue-700 to-blue-900 p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-slate-200">
          NEMSU
        </p>
        <h1 className="text-lg font-bold">E-Learning Platform</h1>
      </div>
      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm">
        <span className="font-semibold">{user.fullName}</span>
        <br />
        {user.role}
      </p>
      <nav className="mt-3 space-y-2">
        {menu(user.role).map((m) => (
          <button
            key={m.key}
            onClick={() => setView(m.key)}
            className={`w-full rounded px-3 py-2 text-left text-sm ${view === m.key ? "bg-blue-700 text-white" : "bg-white hover:bg-slate-100"}`}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <button
        className="mt-6 w-full rounded bg-slate-900 px-3 py-2 text-sm text-white"
        onClick={onLogout}
      >
        Logout
      </button>
    </aside>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md bg-gradient-to-r from-blue-700 to-blue-900 p-3 text-white">
      <p className="text-xs uppercase tracking-wide text-slate-200">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </article>
  );
}

export function DashboardInfo({
  user,
  role,
  courses,
  attempts,
  lastSync,
  onNavigate,
  onRefresh,
}: {
  user: User;
  role: Role;
  courses: Course[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
}) {
  const lessonsCount = courses.reduce(
    (sum, course) =>
      sum + course.sections.reduce((secSum, section) => secSum + section.lessons.length, 0),
    0,
  );
  const coursesWithPendingQuiz = courses.filter((course) =>
    course.sections.some((section) => section.lessons.some((lesson) => lesson.quiz)),
  ).length;
  const recentCourses = courses.slice(0, 4);
  const recentAttempts = attempts.slice(0, 5);

  return (
    <section className="space-y-4 text-sm">
      <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-lg font-semibold">Welcome back, {user.fullName}</p>
        <p className="text-slate-600">
          {role === "INSTRUCTOR"
            ? "Manage your courses, content blocks, and student progress."
            : "Track your courses, lesson content, quizzes, and scores."}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Last sync: {lastSync ? lastSync.toLocaleString() : "Not synced yet"}
        </p>
      </article>

      <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 font-semibold">Quick Actions</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <button
            onClick={() => onNavigate(role === "INSTRUCTOR" ? "courses" : "course_search")}
            className="rounded bg-blue-700 px-3 py-2 text-white"
          >
            {role === "INSTRUCTOR" ? "Open Courses" : "Search Courses"}
          </button>
          <button
            onClick={() => onNavigate("scores")}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            {role === "INSTRUCTOR" ? "Student Scores" : "My Scores"}
          </button>
          <button
            onClick={() => onNavigate("storage")}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            My Storage
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            Profile
          </button>
          <button
            onClick={onRefresh}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            Refresh Data
          </button>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <p className="mb-2 font-semibold">Course Snapshot</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <p className="rounded bg-slate-50 p-2">Courses: {courses.length}</p>
            <p className="rounded bg-slate-50 p-2">Lessons: {lessonsCount}</p>
            <p className="rounded bg-slate-50 p-2">
              With Quizzes: {coursesWithPendingQuiz}
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {recentCourses.length ? (
              recentCourses.map((course) => (
                <div key={course.id} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{course.title}</p>
                  <p className="text-xs text-slate-500">
                    {course.sections.length} block(s)
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No courses yet.</p>
            )}
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <p className="mb-2 font-semibold">
            {role === "INSTRUCTOR" ? "Recent Student Attempts" : "Recent Quiz Attempts"}
          </p>
          <div className="space-y-2">
            {recentAttempts.length ? (
              recentAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded border border-slate-200 p-2">
                  <p className="font-medium">{attempt.quiz.lesson.title}</p>
                  <p className="text-xs text-slate-600">
                    {attempt.score}/{attempt.total}
                    {attempt.student ? ` • ${attempt.student.fullName}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No attempts yet.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export function Profile({ user }: { user: User }) {
  return (
    <article className="rounded-md border border-slate-200 p-4 text-sm">
      <p>Name: {user.fullName}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </article>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      {text}
    </p>
  );
}
