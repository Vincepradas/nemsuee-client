import { useMemo, useState } from "react";
import type {
  Attempt,
  Course,
  Role,
  TeachingBlock,
  User,
  ViewKey,
} from "../../types/lms";

export function DashboardInfo({
  user,
  role,
  courses,
  archivedCourses = [],
  teachingBlocks = [],
  attempts,
  lastSync,
  onNavigate,
  onRefresh,
}: {
  user: User;
  role: Role;
  courses: Course[];
  archivedCourses?: Course[];
  teachingBlocks?: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
}) {
  const [activityQuery, setActivityQuery] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const lessonsCount = courses.reduce(
    (sum, course) =>
      sum +
      course.sections.reduce(
        (secSum, section) => secSum + section.lessons.length,
        0,
      ),
    0,
  );
  const recentCourses = courses.slice(0, 4);
  const recentAttempts = attempts.slice(0, 5);
  const avgScore = attempts.length
    ? Math.round(
        attempts.reduce(
          (a, x) => a + (x.score / Math.max(1, x.total)) * 100,
          0,
        ) / attempts.length,
      )
    : 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (role === "INSTRUCTOR") {
    const submissionsToGrade = attempts.length;
    const filteredActivity = useMemo(() => {
      const q = activityQuery.trim().toLowerCase();
      if (!q) return attempts;
      return attempts.filter((attempt) => {
        const student = String(attempt.student?.fullName || "").toLowerCase();
        const lesson = String(attempt.quiz.lesson.title || "").toLowerCase();
        return student.includes(q) || lesson.includes(q);
      });
    }, [attempts, activityQuery]);
    const activityPageSize = 10;
    const activityTotalPages = Math.max(
      1,
      Math.ceil(filteredActivity.length / activityPageSize),
    );
    const safeActivityPage = Math.min(activityPage, activityTotalPages);
    const recentStudentActivity = filteredActivity.slice(
      (safeActivityPage - 1) * activityPageSize,
      safeActivityPage * activityPageSize,
    );
    const uniqueStudents = new Set<number>();
    courses.forEach((course) => {
      course.sections.forEach((section: any) => {
        (section.enrollments || []).forEach((enrollment: any) => {
          if (enrollment?.student?.id)
            uniqueStudents.add(enrollment.student.id);
        });
      });
    });
    const groupedBlocks = teachingBlocks.reduce(
      (acc, block) => {
        if (!acc[block.courseId]) {
          acc[block.courseId] = {
            courseTitle: block.courseTitle,
            blocks: [],
            students: 0,
          };
        }
        const matchedCourse = courses.find(
          (course) => course.id === block.courseId,
        );
        const matchedSection = matchedCourse?.sections.find(
          (s) => s.id === block.id,
        );
        const blockStudents = new Set(
          ((matchedSection as any)?.enrollments || [])
            .map((enrollment: any) => enrollment?.student?.id)
            .filter(Boolean),
        ).size;
        acc[block.courseId].blocks.push({
          id: block.id,
          name: block.name,
          students: blockStudents,
        });
        acc[block.courseId].students += blockStudents;
        return acc;
      },
      {} as Record<
        number,
        {
          courseTitle: string;
          blocks: { id: number; name: string; students: number }[];
          students: number;
        }
      >,
    );

    return (
      <section className="space-y-4 text-sm">
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-slate-900">
            {greeting}, {user.fullName.split(" ")[0]}.
          </p>
          <p className="mt-1 text-slate-600">
            You have {submissionsToGrade} submission
            {submissionsToGrade === 1 ? "" : "s"} waiting for grading.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Last sync: {lastSync ? lastSync.toLocaleString() : "Not synced yet"}
          </p>
        </article>

        <article className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Submissions to Grade
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {submissionsToGrade}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Active Blocks
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {teachingBlocks.length}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Handled Students
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {uniqueStudents.size}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              New Student Activity
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {recentStudentActivity.length}
            </p>
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                Teaching Blocks Overview
              </p>
              <button
                onClick={() => onNavigate("courses")}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
              >
                Open Blocks
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(groupedBlocks).length ? (
                Object.entries(groupedBlocks).map(([courseId, group]) => (
                  <div
                    key={courseId}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {group.courseTitle}
                    </p>
                    <div className="mt-1 space-y-1 text-xs text-slate-600">
                      {group.blocks.map((block) => (
                        <p key={block.id}>
                          {block.name} - {block.students} student
                          {block.students === 1 ? "" : "s"}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No assigned teaching blocks.</p>
              )}
            </div>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                Recent Student Activity
              </p>
              <button
                onClick={() => onNavigate("scores")}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
              >
                Open Gradebook
              </button>
            </div>
            <input
              value={activityQuery}
              onChange={(e) => {
                setActivityQuery(e.target.value);
                setActivityPage(1);
              }}
              className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Search student or activity"
            />
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {recentStudentActivity.length ? (
                recentStudentActivity.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded-md border border-slate-200 p-2"
                  >
                    <p className="text-xs text-slate-800">
                      {attempt.student?.fullName || "A student"} submitted{" "}
                      {attempt.quiz.lesson.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[11px] text-slate-500">
                        Score: {attempt.score}/{attempt.total}
                      </p>
                      <button
                        onClick={() => onNavigate("scores")}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-50"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No recent student activity.</p>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <p>
                Showing{" "}
                {filteredActivity.length
                  ? (safeActivityPage - 1) * activityPageSize + 1
                  : 0}
                -
                {Math.min(
                  safeActivityPage * activityPageSize,
                  filteredActivity.length,
                )}{" "}
                of {filteredActivity.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={safeActivityPage <= 1}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  {safeActivityPage}/{activityTotalPages}
                </span>
                <button
                  onClick={() =>
                    setActivityPage((p) => Math.min(activityTotalPages, p + 1))
                  }
                  disabled={safeActivityPage >= activityTotalPages}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 font-semibold text-slate-900">Quick Actions</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              data-keep-action-text="true"
              onClick={() => onNavigate("courses")}
              className="flex h-10 w-full items-center rounded border border-slate-300 bg-white px-3 text-left hover:bg-slate-50"
            >
              Upload Material
            </button>
            <button
              data-keep-action-text="true"
              onClick={() => onNavigate("courses")}
              className="flex h-10 w-full items-center rounded border border-slate-300 bg-white px-3 text-left hover:bg-slate-50"
            >
              View Students
            </button>
            <button
              data-keep-action-text="true"
              onClick={() => onNavigate("storage")}
              className="flex h-10 w-full items-center rounded border border-slate-300 bg-white px-3 text-left hover:bg-slate-50"
            >
              Files
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4 text-sm">
      <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-lg font-semibold">Welcome back, {user.fullName}</p>
        <p className="text-slate-600">
          {role === "ADMIN" &&
            "Manage subjects, blocks, and instructor assignments."}
          {role === "STUDENT" &&
            "Track your courses, lesson content, quizzes, and scores."}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Last sync: {lastSync ? lastSync.toLocaleString() : "Not synced yet"}
        </p>
      </article>

      <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 font-semibold">Quick Actions</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {role === "ADMIN" ? (
            <button
              onClick={() => onNavigate("admin_blocks")}
              className="rounded bg-blue-700 px-3 py-2 text-white"
            >
              Open Block Admin
            </button>
          ) : (
            <button
              onClick={() => onNavigate("course_search")}
              className="rounded bg-blue-700 px-3 py-2 text-white"
            >
              Search Courses
            </button>
          )}
          {role !== "ADMIN" && (
            <button
              onClick={() => onNavigate("scores")}
              className="rounded border border-slate-300 bg-white px-3 py-2"
            >
              My Scores
            </button>
          )}
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
          <p className="mb-2 font-semibold">
            {role === "ADMIN" ? "Administration Snapshot" : "Course Snapshot"}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {role === "ADMIN" ? (
              <>
                <p className="rounded bg-slate-50 p-2">
                  Total Courses: {courses.length}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Total Blocks:{" "}
                  {courses.reduce((a, c) => a + c.sections.length, 0)}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Archived: {archivedCourses.length}
                </p>
              </>
            ) : (
              <>
                <p className="rounded bg-slate-50 p-2">
                  Courses: {courses.length}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Lessons: {lessonsCount}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Average Score: {avgScore}%
                </p>
              </>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {recentCourses.length ? (
              recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded border border-slate-200 p-2"
                >
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
            {role === "ADMIN" ? "Admin Shortcuts" : "Recent Quiz Attempts"}
          </p>
          {role === "ADMIN" ? (
            <div className="space-y-2">
              <button
                onClick={() => onNavigate("admin_blocks")}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-left"
              >
                Manage Courses and Blocks
              </button>
              <button
                onClick={() => onNavigate("storage")}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-left"
              >
                Open Files Hub
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttempts.length ? (
                recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded border border-slate-200 p-2"
                  >
                    <p className="font-medium">{attempt.quiz.lesson.title}</p>
                    <p className="text-xs text-slate-600">
                      {attempt.score}/{attempt.total}
                      {attempt.student ? ` - ${attempt.student.fullName}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No attempts yet.</p>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
