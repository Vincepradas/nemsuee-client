import { useEffect, useMemo, useState } from "react";
import type { Attempt, Course, User } from "../../../shared/types/lms";
import { ScoresTab } from "./ScoresTab";

type ScoresHubProps = {
  user: User;
  courses: Course[];
  attempts: Attempt[];
  api: any;
  headers: any;
  setMessage: (m: string) => void;
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
};

export function ScoresHub({
  user,
  courses,
  attempts,
  api,
  headers,
  setMessage,
  selectedCourseId,
  onSelectCourse,
}: ScoresHubProps) {
  const [courseFilter, setCourseFilter] = useState("");
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId],
  );
  const [publishedGrades, setPublishedGrades] = useState<any[]>([]);
  const [semester, setSemester] = useState("1st Semester");
  const [term, setTerm] = useState("");
  const [termOptions, setTermOptions] = useState<string[]>([]);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownRow, setBreakdownRow] = useState<any | null>(null);

  useEffect(() => {
    if (user.role !== "STUDENT") return;
    api("/terms/context", { headers })
      .then((ctx: any) => {
        const sem = String(ctx?.semester || "1st Semester");
        const year = String(ctx?.academicYear || "").trim();
        setSemester(sem);
        if (year) {
          setTerm(year);
          setTermOptions([year]);
        } else {
          setTerm("All");
          setTermOptions(["All"]);
        }
      })
      .catch(() => {
        setTerm("All");
        setTermOptions(["All"]);
      });
  }, [user.role, api, headers]);

  useEffect(() => {
    if (user.role !== "STUDENT") return;
    const params = new URLSearchParams();
    if (semester) params.set("semester", semester);
    if (term && term !== "All") params.set("term", term);
    api(`/grade-computation/me/final-course?${params.toString()}`, { headers })
      .then((rows: any[]) => setPublishedGrades(rows || []))
      .catch(() => setPublishedGrades([]));
  }, [user.role, semester, term, api, headers]);

  if (user.role === "STUDENT") {
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const visible = publishedGrades.map((g) => {
      const course = courseById.get(Number(g.courseId));
      const instructor =
        course?.instructor?.fullName ||
        course?.instructors?.[0]?.fullName ||
        "TBA";
      return {
        ...g,
        courseTitle: g.courseTitle || course?.title || "Course",
        instructor,
        units: "-",
      };
    });
    return (
      <section className="space-y-4">
        <header className="overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-800 via-blue-900 to-blue-900 shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),transparent_45%)] p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xl font-semibold tracking-tight">Grades</p>
              <p className="text-xs text-blue-100">Published records only</p>
            </div>
            <p className="mt-1 text-sm text-blue-100">
              {semester} / {term}
            </p>
          </div>
        </header>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Semester
              </span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="h-10 w-full rounded border border-slate-300 px-3 text-sm"
              >
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>Summer</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                School Year
              </span>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="h-10 w-full rounded border border-slate-300 px-3 text-sm"
              >
                {termOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                data-keep-action-text="true"
                className="h-10 rounded bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => {
                  api(
                    `/grade-computation/me/final-course?semester=${encodeURIComponent(semester)}&term=${encodeURIComponent(term)}`,
                    { headers },
                  )
                    .then((rows: any[]) => setPublishedGrades(rows || []))
                    .catch(() => setPublishedGrades([]));
                }}
              >
                Refresh Grades
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-blue-50 text-blue-900">
                <tr>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Instructor</th>
                  <th className="px-3 py-2">Units</th>
                  <th className="px-3 py-2">Midterm</th>
                  <th className="px-3 py-2">Final</th>
                  <th className="px-3 py-2">Completion</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => (
                  <tr key={g.courseId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{g.courseTitle}</td>
                    <td className="px-3 py-2">{g.instructor}</td>
                    <td className="px-3 py-2">{g.units}</td>
                    <td className="px-3 py-2">{g.midtermGrade === null || g.midtermGrade === undefined ? "-" : Number(g.midtermGrade).toFixed(2)}</td>
                    <td className="px-3 py-2">{g.finalsGrade === null || g.finalsGrade === undefined ? "-" : Number(g.finalsGrade).toFixed(2)}</td>
                    <td className="px-3 py-2 font-semibold">
                      {g.equivalentGrade === null || g.equivalentGrade === undefined ? "-" : Number(g.equivalentGrade).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold">
                        {Number(g.equivalentGrade ?? 5) <= 3 ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setBreakdownRow(g);
                          setBreakdownOpen(true);
                        }}
                      >
                        View breakdown
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-slate-500">No published grades yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm italic text-slate-600">
            Pending means your grade is encoded but not yet approved, and is excluded from completion computation.
          </p>
        </article>
        {breakdownOpen && breakdownRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-6xl rounded-md bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Grade Breakdown - {breakdownRow.courseTitle}
                </p>
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() => {
                    setBreakdownOpen(false);
                    setBreakdownRow(null);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="overflow-auto rounded border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="px-3 py-2">Grade item</th>
                      <th className="px-3 py-2">Calculated weight</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Range</th>
                      <th className="px-3 py-2">Scale</th>
                      <th className="px-3 py-2">Feedback</th>
                      <th className="px-3 py-2">Contribution to course total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        item: "Midterm Term Grade",
                        weight: Number(breakdownRow.midtermCourseWeight ?? 50),
                        grade: Number(breakdownRow.midtermGrade ?? 0),
                        feedback: "-",
                      },
                      {
                        item: "Final Term Grade",
                        weight: Number(breakdownRow.finalsCourseWeight ?? 50),
                        grade: Number(breakdownRow.finalsGrade ?? 0),
                        feedback: "-",
                      },
                    ].map((r) => (
                      <tr key={r.item} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-900">{r.item}</td>
                        <td className="px-3 py-2">{r.weight}%</td>
                        <td className="px-3 py-2">{r.grade.toFixed(2)}</td>
                        <td className="px-3 py-2">1.00 - 5.00</td>
                        <td className="px-3 py-2">{r.grade.toFixed(2)}</td>
                        <td className="px-3 py-2">{r.feedback}</td>
                        <td className="px-3 py-2">
                          {((r.grade * r.weight) / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        Course total
                      </td>
                      <td className="px-3 py-2">100%</td>
                      <td className="px-3 py-2">
                        {Number(breakdownRow.finalCourseGrade || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">1.00 - 5.00</td>
                      <td className="px-3 py-2">
                        {Number(breakdownRow.finalCourseGrade || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {String(breakdownRow.result || "FAILED")}
                      </td>
                      <td className="px-3 py-2">
                        Eq. {Number(breakdownRow.equivalentGrade || 5).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (user.role !== "INSTRUCTOR") {
    return (
      <article className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        Scores page is available for instructors.
      </article>
    );
  }

  return (
    <section className="space-y-3">
      <header className="rounded-md border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-lg font-semibold text-slate-900">Quiz Scores</p>
          <p className="text-xs text-slate-500">
            Select a course to view student performance.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_280px]">
          <input
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Filter courses"
          />
          <select
            data-keep-action-text="true"
            value={selectedCourse?.id ?? ""}
            onChange={(e) => onSelectCourse(Number(e.target.value))}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {courses
              .filter((c) =>
                c.title.toLowerCase().includes(courseFilter.trim().toLowerCase()),
              )
              .map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
          </select>
        </div>
      </header>

      {selectedCourse ? (
        <ScoresTab
          selectedCourse={selectedCourse}
          attempts={attempts}
          user={user}
          api={api}
          headers={headers}
          setMessage={setMessage}
        />
      ) : (
        <article className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          No course available for scores yet.
        </article>
      )}
    </section>
  );
}
