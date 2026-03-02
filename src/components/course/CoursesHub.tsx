import { useEffect, useState } from "react";
import type {
  Attempt,
  CatalogCourse,
  Course,
  Lesson,
  RosterRow,
  User,
} from "../../types/lms";

export function CoursesHub(props: {
  user: User;
  api: any;
  headers: any;
  courses: Course[];
  attempts: Attempt[];
  selectedCourse: Course | null;
  setSelectedCourseId: (id: number) => void;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  studentViewMode?: "all" | "my" | "search";
}) {
  const {
    user,
    api,
    headers,
    courses,
    attempts,
    selectedCourse,
    setSelectedCourseId,
    refreshCore,
    setMessage,
    studentViewMode = "all",
  } = props;
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState<number | null>(null);
  const [keyInput, setKeyInput] = useState<Record<number, string>>({});
  const [roster, setRoster] = useState<Record<number, RosterRow[]>>({});
  const [pending, setPending] = useState<
    Record<
      number,
      { id: number; student: { fullName: string; email: string } }[]
    >
  >({});
  
  const [approveSection, setApproveSection] = useState<Record<number, number>>(
    {},
  );
  
  const [newSection, setNewSection] = useState<Record<number, string>>({});
  const [manualEmail, setManualEmail] = useState<Record<number, string>>({});
  const [manualSection, setManualSection] = useState<Record<number, number>>(
    {},
  );
  const [showEnrollRequest, setShowEnrollRequest] = useState<Record<number, boolean>>({});
  const [showAddSection, setShowAddSection] = useState<Record<number, boolean>>({});
  const [showManualEnroll, setShowManualEnroll] = useState<Record<number, boolean>>({});
  const [showAddLesson, setShowAddLesson] = useState<Record<number, boolean>>({});
  const [lessonTargetSection, setLessonTargetSection] = useState<Record<number, number>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [activeCourseTab, setActiveCourseTab] = useState<
    "content" | "quizzes" | "scores"
  >("content");

  const [lessonInput, setLessonInput] = useState<
    Record<number, { title: string; content: string; fileUrl: string }>
  >({});

  function groupForLesson(lesson: Lesson) {
    const bag = `${lesson.title} ${lesson.content}`.toLowerCase();
    if (lesson.quiz) {
      if (bag.includes("exam") || bag.includes("midterm") || bag.includes("final")) return "Examinations";
      return "Quizzes";
    }
    if (bag.includes("lab") || bag.includes("laboratory") || bag.includes("problem set")) return "Laboratory";
    if (bag.includes("activity") || bag.includes("assignment") || bag.includes("seatwork")) return "Class Activities";
    if (bag.includes("exam") || bag.includes("midterm") || bag.includes("final")) return "Examinations";
    if (lesson.fileUrl) return "Resources";
    return "Lecture";
  }

  async function loadCatalog(query = catalogQuery) {
    try {
      setCatalog(
        await api(`/courses/catalog?query=${encodeURIComponent(query)}`, {
          headers,
        }),
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    if (user.role === "STUDENT") loadCatalog("");
  }, [user.role]);

  const selectedCatalogCourse =
    catalog.find((c) => c.id === selectedCatalogCourseId) || null;

  async function requestEnroll(courseId: number) {
    try {
      await api(`/courses/${courseId}/enroll-request`, {
        method: "POST",
        headers,
        body: JSON.stringify({ key: keyInput[courseId] || "" }),
      });
      setCatalog((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, enrollmentStatus: "PENDING" } : c,
        ),
      );
      await refreshCore();
      setMessage("Enrollment request submitted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadPending(courseId: number) {
    try {
      const data = await api(`/courses/${courseId}/enrollments/pending`, {
        headers,
      });
      setPending((p) => ({ ...p, [courseId]: data }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadRoster(courseId: number) {
    try {
      const data = await api(`/courses/${courseId}/students`, { headers });
      setRoster((r) => ({ ...r, [courseId]: data }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function decide(
    courseId: number,
    enrollmentId: number,
    status: "APPROVED" | "REJECTED",
  ) {
    try {
      await api(`/courses/${courseId}/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status,
          sectionId:
            status === "APPROVED" ? approveSection[enrollmentId] : undefined,
        }),
      });
      await Promise.all([
        loadPending(courseId),
        loadRoster(courseId),
        refreshCore(),
      ]);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function addSection(courseId: number) {
    try {
      await api(`/courses/${courseId}/sections`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newSection[courseId] || "" }),
      });
      await refreshCore();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function manualAdd(course: Course) {
    try {
      await api(`/courses/${course.id}/enrollments/manual`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: manualEmail[course.id] || "",
          sectionId: manualSection[course.id] || course.sections[0]?.id,
        }),
      });
      await Promise.all([refreshCore(), loadRoster(course.id)]);
      setMessage("Student enrolled.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function addLesson(courseId: number, sectionId: number) {
    try {
      await api(`/courses/${courseId}/sections/${sectionId}/lessons`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          lessonInput[courseId] || { title: "", content: "", fileUrl: "" },
        ),
      });
      await refreshCore();
      setLessonInput((x) => ({ ...x, [courseId]: { title: "", content: "", fileUrl: "" } }));
      setShowAddLesson((p) => ({ ...p, [courseId]: false }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function createCourse() {
    try {
      await api("/courses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: newCourseTitle,
          description: newCourseDescription,
        }),
      });
      setNewCourseTitle("");
      setNewCourseDescription("");
      setShowCreateCourse(false);
      await refreshCore();
      setMessage("Course created.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function regenerateEnrollmentKey(courseId: number) {
    try {
      const data = await api(`/courses/${courseId}/enrollment-key/regenerate`, {
        method: "PATCH",
        headers,
      });
      await refreshCore();
      setMessage(`New enrollment key generated: ${data.enrollmentKey}`);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    if (!selectedCourse) return;
    loadRoster(selectedCourse.id);
    if (user.role === "INSTRUCTOR") loadPending(selectedCourse.id);
  }, [selectedCourse?.id, user.role]);

  useEffect(() => {
    if (!selectedCourse) return;
    setCollapsedSections(
      selectedCourse.sections.reduce(
        (acc, section) => ({ ...acc, [section.id]: true }),
        {} as Record<number, boolean>,
      ),
    );
  }, [selectedCourse?.id]);

  return (
    <section className="space-y-4">
      {user.role === "INSTRUCTOR" && (
        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Course Management</h3>
            <button
              onClick={() => setShowCreateCourse((v) => !v)}
              className="rounded bg-blue-700 px-3 py-2 text-sm text-white"
            >
              {showCreateCourse ? "Close" : "Create Course"}
            </button>
          </div>

          {showCreateCourse && (
            <div className="mt-3">
              <input
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Course title"
              />
              <textarea
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Course description"
              />
              <button
                onClick={createCourse}
                className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
              >
                Save Course
              </button>
            </div>
          )}
        </div>
      )}

      {user.role === "STUDENT" && studentViewMode !== "search" ? (
        <div className="rounded-md border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">My Courses</h3>
          </div>
          <div className="relative">
            <select
              value={selectedCourse?.id || ""}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full appearance-none rounded border border-slate-300 p-2 pr-9 text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.sections.length} block{c.sections.length !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
              ▾
            </span>
          </div>
        </div>
      ) : user.role === "INSTRUCTOR" ? (
        <div className="rounded-md border border-slate-200 p-3">
          <h3 className="mb-3 font-semibold">Courses</h3>
          <div className="relative">
            <select
              value={selectedCourse?.id || ""}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full appearance-none rounded border border-slate-300 p-2 pr-9 text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.sections.length} block{c.sections.length !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
              ▾
            </span>
          </div>
        </div>
      ) : null}

      {user.role === "STUDENT" && studentViewMode !== "my" && (
        <div className="space-y-3">
          <div className="rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 font-semibold">Discover Courses</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadCatalog(catalogQuery);
              }}
              className="mb-2 flex gap-2"
            >
              <input
                value={catalogQuery}
                onFocus={() => {
                  if (!catalog.length) loadCatalog("");
                }}
                onChange={(e) => setCatalogQuery(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Search course or instructor"
              />
              <button className="rounded bg-blue-700 px-3 py-2 text-sm text-white">
                Search
              </button>
            </form>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 font-semibold">Available Courses</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(catalogQuery.trim() ? catalog : catalog.slice(0, 5)).slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatalogCourseId(c.id)}
                  className={`min-w-[240px] rounded border p-2 text-left text-sm ${selectedCatalogCourseId === c.id ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white"}`}
                >
                  <p className="font-semibold truncate">{c.title}</p>
                  <p className="text-slate-500 truncate">Instructor: {c.instructor.fullName}</p>
                  <p className="text-slate-500">Status: {c.enrollmentStatus || "NOT_REQUESTED"}</p>
                </button>
              ))}
              {!catalog.length && <p className="text-sm text-slate-500">No courses found.</p>}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 font-semibold">Enrollment Process</h3>
            {!selectedCatalogCourse && (
              <p className="text-sm text-slate-500">
                Select a course from Discover Courses first.
              </p>
            )}
            {selectedCatalogCourse && (
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{selectedCatalogCourse.title}</p>
                <p>{selectedCatalogCourse.description}</p>
                <p className="text-slate-500">Instructor: {selectedCatalogCourse.instructor.fullName}</p>
                <p className="text-slate-500">Current Status: {selectedCatalogCourse.enrollmentStatus || "NOT_REQUESTED"}</p>
                <div>
                  <button
                    disabled={
                      selectedCatalogCourse.enrollmentStatus === "APPROVED" ||
                      selectedCatalogCourse.enrollmentStatus === "PENDING"
                    }
                    onClick={() =>
                      setShowEnrollRequest((p) => ({
                        ...p,
                        [selectedCatalogCourse.id]: !p[selectedCatalogCourse.id],
                      }))
                    }
                    className="rounded bg-slate-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {selectedCatalogCourse.enrollmentStatus === "APPROVED"
                      ? "Enrolled"
                      : selectedCatalogCourse.enrollmentStatus === "PENDING"
                        ? "Pending Approval"
                        : showEnrollRequest[selectedCatalogCourse.id]
                          ? "Close Enrollment Form"
                          : "Proceed to Enrollment"}
                  </button>
                </div>
                {showEnrollRequest[selectedCatalogCourse.id] &&
                  selectedCatalogCourse.enrollmentStatus !== "APPROVED" &&
                  selectedCatalogCourse.enrollmentStatus !== "PENDING" && (
                    <div className="flex gap-2">
                      <input
                        value={keyInput[selectedCatalogCourse.id] || ""}
                        onChange={(e) =>
                          setKeyInput((p) => ({
                            ...p,
                            [selectedCatalogCourse.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-slate-300 p-2"
                        placeholder="Enrollment key"
                      />
                      <button
                        onClick={() => requestEnroll(selectedCatalogCourse.id)}
                        className="rounded bg-blue-700 px-3 py-2 text-white"
                      >
                        Submit Request
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCourse && (user.role === "INSTRUCTOR" || studentViewMode !== "search") && (
        <article className="rounded-md border border-slate-200 p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{selectedCourse.title}</p>
              <p className="text-sm text-slate-600">
                {selectedCourse.description}
              </p>
              {user.role === "INSTRUCTOR" && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-blue-700">
                    Enrollment Key: {selectedCourse.enrollmentKey}
                  </p>
                  <button
                    onClick={() => regenerateEnrollmentKey(selectedCourse.id)}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    Generate New Key
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => loadRoster(selectedCourse.id)}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              title="Refresh student list"
            >
              Refresh
            </button>
          </div>

          <div className="mb-3 flex gap-2">
            <button onClick={() => setActiveCourseTab("content")} className={`rounded px-3 py-1 text-sm ${activeCourseTab === "content" ? "bg-blue-700 text-white" : "bg-slate-100"}`}>Content</button>
            <button onClick={() => setActiveCourseTab("quizzes")} className={`rounded px-3 py-1 text-sm ${activeCourseTab === "quizzes" ? "bg-blue-700 text-white" : "bg-slate-100"}`}>Quizzes</button>
            <button onClick={() => setActiveCourseTab("scores")} className={`rounded px-3 py-1 text-sm ${activeCourseTab === "scores" ? "bg-blue-700 text-white" : "bg-slate-100"}`}>Scores</button>
          </div>

          {activeCourseTab === "content" && (
            <>
              <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                {(roster[selectedCourse.id] || []).length === 0 && (
                  <p className="text-slate-500">No student list loaded.</p>
                )}
                {(roster[selectedCourse.id] || []).map((r) => (
                  <p key={r.id}>
                    {r.student.fullName} ({r.student.email}){" "}
                    {r.section?.name ? `- ${r.section.name}` : ""}
                  </p>
                ))}
              </div>

              <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                <p className="mb-1 font-semibold">Course Announcements</p>
                <p>
                  Welcome to {selectedCourse.title}. Check your section content and
                  complete quizzes before deadlines.
                </p>
              </div>
            </>
          )}

          {user.role === "INSTRUCTOR" && (
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="mb-2 text-sm font-semibold">Section / Block</p>
                <button
                  onClick={() => setShowAddSection((p) => ({ ...p, [selectedCourse.id]: !p[selectedCourse.id] }))}
                  className="rounded bg-blue-700 px-3 py-2 text-white"
                >
                  {showAddSection[selectedCourse.id] ? "Close" : "Add Block"}
                </button>
                {showAddSection[selectedCourse.id] && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newSection[selectedCourse.id] || ""}
                      onChange={(e) =>
                        setNewSection((p) => ({
                          ...p,
                          [selectedCourse.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-slate-300 p-2 text-sm"
                      placeholder="BLOCK-B"
                    />
                    <button
                      onClick={() => addSection(selectedCourse.id)}
                      className="rounded bg-slate-900 px-3 py-2 text-white"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="mb-2 text-sm font-semibold">
                  Manual Student Enroll
                </p>
                <button
                  onClick={() => setShowManualEnroll((p) => ({ ...p, [selectedCourse.id]: !p[selectedCourse.id] }))}
                  className="rounded bg-blue-700 px-3 py-2 text-white"
                >
                  {showManualEnroll[selectedCourse.id] ? "Close" : "Enroll Student"}
                </button>
                {showManualEnroll[selectedCourse.id] && (
                  <div className="mt-2">
                    <input
                      value={manualEmail[selectedCourse.id] || ""}
                      onChange={(e) =>
                        setManualEmail((p) => ({
                          ...p,
                          [selectedCourse.id]: e.target.value,
                        }))
                      }
                      className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
                      placeholder="student@email.com"
                    />
                    <div className="flex gap-2">
                      <select
                        value={
                          manualSection[selectedCourse.id] ||
                          selectedCourse.sections[0]?.id ||
                          ""
                        }
                        onChange={(e) =>
                          setManualSection((p) => ({
                            ...p,
                            [selectedCourse.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded border border-slate-300 p-2 text-sm"
                      >
                        {selectedCourse.sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => manualAdd(selectedCourse)}
                        className="rounded bg-slate-900 px-3 py-2 text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-2 md:col-span-2">
                <p className="mb-2 text-sm font-semibold">Add Lesson</p>
                <button
                  onClick={() =>
                    setShowAddLesson((p) => ({ ...p, [selectedCourse.id]: !p[selectedCourse.id] }))
                  }
                  className="rounded bg-blue-700 px-3 py-2 text-white"
                >
                  {showAddLesson[selectedCourse.id] ? "Close" : "Add Lesson to Block"}
                </button>
                {showAddLesson[selectedCourse.id] && (
                  <div className="mt-2">
                    <select
                      value={
                        lessonTargetSection[selectedCourse.id] ||
                        selectedCourse.sections[0]?.id ||
                        ""
                      }
                      onChange={(e) =>
                        setLessonTargetSection((p) => ({
                          ...p,
                          [selectedCourse.id]: Number(e.target.value),
                        }))
                      }
                      className="mb-2 w-full rounded border border-slate-300 p-2 text-sm"
                    >
                      {selectedCourse.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={lessonInput[selectedCourse.id]?.title || ""}
                      onChange={(e) =>
                        setLessonInput((x) => ({
                          ...x,
                          [selectedCourse.id]: {
                            ...(x[selectedCourse.id] || { title: "", content: "", fileUrl: "" }),
                            title: e.target.value,
                          },
                        }))
                      }
                      className="mb-1 w-full rounded border border-slate-300 p-2 text-sm"
                      placeholder="Lesson title"
                    />
                    <textarea
                      value={lessonInput[selectedCourse.id]?.content || ""}
                      onChange={(e) =>
                        setLessonInput((x) => ({
                          ...x,
                          [selectedCourse.id]: {
                            ...(x[selectedCourse.id] || { title: "", content: "", fileUrl: "" }),
                            content: e.target.value,
                          },
                        }))
                      }
                      className="mb-1 w-full rounded border border-slate-300 p-2 text-sm"
                      placeholder="Lesson content"
                    />
                    <input
                      value={lessonInput[selectedCourse.id]?.fileUrl || ""}
                      onChange={(e) =>
                        setLessonInput((x) => ({
                          ...x,
                          [selectedCourse.id]: {
                            ...(x[selectedCourse.id] || { title: "", content: "", fileUrl: "" }),
                            fileUrl: e.target.value,
                          },
                        }))
                      }
                      className="mb-1 w-full rounded border border-slate-300 p-2 text-sm"
                      placeholder="File URL"
                    />
                    <button
                      onClick={() =>
                        addLesson(
                          selectedCourse.id,
                          lessonTargetSection[selectedCourse.id] || selectedCourse.sections[0]?.id,
                        )
                      }
                      className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                    >
                      Save Lesson
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {user.role === "INSTRUCTOR" && (
            <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Pending Requests</p>
                <button
                  onClick={() => loadPending(selectedCourse.id)}
                  className="border border-slate-300 px-2 py-1 text-xs"
                  title="Refresh pending"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {(pending[selectedCourse.id] || []).map((p) => (
                  <article
                    key={p.id}
                    className="rounded border border-slate-200 bg-white p-2 text-sm"
                  >
                    <p>
                      {p.student.fullName} ({p.student.email})
                    </p>
                    <select
                      value={
                        approveSection[p.id] ||
                        selectedCourse.sections[0]?.id ||
                        ""
                      }
                      onChange={(e) =>
                        setApproveSection((x) => ({
                          ...x,
                          [p.id]: Number(e.target.value),
                        }))
                      }
                      className="my-1 w-full rounded border border-slate-300 p-2"
                    >
                      {selectedCourse.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          decide(selectedCourse.id, p.id, "APPROVED")
                        }
                        className="rounded bg-blue-700 px-2 py-1 text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          decide(selectedCourse.id, p.id, "REJECTED")
                        }
                        className="rounded bg-slate-700 px-2 py-1 text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeCourseTab === "content" && <div className="space-y-3">
            {selectedCourse.sections.map((s) => (
              <section
                key={s.id}
                id={`section-${s.id}`}
                className="rounded border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSections((prev) => ({
                      ...prev,
                      [s.id]: !prev[s.id],
                    }))
                  }
                  className="flex w-full items-center justify-between border-b border-slate-200 px-3 py-2 text-left"
                >
                  <p className="font-semibold">{s.name}</p>
                  <span className="text-sm text-slate-500" aria-hidden="true">
                    {collapsedSections[s.id] ? "▸" : "▾"}
                  </span>
                </button>

                {!collapsedSections[s.id] && <div className="space-y-4 p-3">
                  {(["Lecture", "Laboratory", "Class Activities", "Quizzes", "Examinations", "Resources"] as const).map((group) => {
                    const items = s.lessons.filter((l) => groupForLesson(l) === group);
                    if (!items.length) return null;
                    return (
                      <div key={group}>
                        <p className="mb-2 text-sm font-semibold text-slate-700">{group}</p>
                        <div className="space-y-2">
                          {items.map((l) => (
                            <article
                              key={l.id}
                              className="border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-medium">{l.title}</p>
                                {l.content &&
                                  l.content.trim().toLowerCase() !== l.title.trim().toLowerCase() && (
                                    <p className="text-sm text-slate-600">{l.content}</p>
                                  )}
                                {l.fileUrl && (
                                  <a
                                    className="text-sm text-blue-700 underline"
                                    href={l.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open file
                                  </a>
                                )}
                                {user.role === "INSTRUCTOR" && !l.quiz && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api("/quizzes", {
                                          method: "POST",
                                          headers,
                                          body: JSON.stringify({
                                            lessonId: l.id,
                                            questions: [
                                              {
                                                prompt: "Sample?",
                                                optionA: "A",
                                                optionB: "B",
                                                optionC: "C",
                                                optionD: "D",
                                                correctOption: "A",
                                              },
                                            ],
                                          }),
                                        });
                                        await refreshCore();
                                      } catch (e) {
                                        setMessage((e as Error).message);
                                      }
                                    }}
                                    className="rounded bg-blue-700 px-3 py-1 text-xs text-white"
                                  >
                                    Create Quiz
                                  </button>
                                )}
                                {user.role === "STUDENT" && l.quiz && (
                                  <button
                                    onClick={async () => {
                                      const quiz = l.quiz;
                                      if (!quiz) return;
                                      try {
                                        await api(`/quizzes/${quiz.id}/submit`, {
                                          method: "POST",
                                          headers,
                                          body: JSON.stringify({
                                            answers: quiz.questions.map((q) => ({
                                              questionId: q.id,
                                              selectedOption: "A",
                                            })),
                                          }),
                                        });
                                        await refreshCore();
                                      } catch (e) {
                                        setMessage((e as Error).message);
                                      }
                                    }}
                                    className="rounded bg-slate-900 px-3 py-1 text-xs text-white"
                                  >
                                    Take Quiz
                                  </button>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!s.lessons.length && <p className="text-sm text-slate-500">No lessons yet.</p>}
                </div>}
              </section>
            ))}
          </div>}

          {activeCourseTab === "quizzes" && (
            <div className="space-y-2">
              {selectedCourse.sections.flatMap((s) => s.lessons).map((l) => (
                <article key={l.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                  <p className="font-medium">{l.title}</p>
                  <p>{l.quiz ? `Quiz ready (${l.quiz.questions.length})` : "No quiz yet"}</p>
                  {user.role === "INSTRUCTOR" && !l.quiz && <button onClick={async () => { try { await api("/quizzes", { method: "POST", headers, body: JSON.stringify({ lessonId: l.id, questions: [{ prompt: "Sample?", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctOption: "A" }] }) }); await refreshCore(); } catch (e) { setMessage((e as Error).message); } }} className="mt-2 rounded bg-blue-700 px-3 py-1 text-xs text-white">Create Quiz</button>}
                  {user.role === "STUDENT" && l.quiz && <button onClick={async () => { const quiz = l.quiz; if (!quiz) return; try { await api(`/quizzes/${quiz.id}/submit`, { method: "POST", headers, body: JSON.stringify({ answers: quiz.questions.map((q) => ({ questionId: q.id, selectedOption: "A" })) }) }); await refreshCore(); } catch (e) { setMessage((e as Error).message); } }} className="mt-2 rounded bg-slate-900 px-3 py-1 text-xs text-white">Take Quiz</button>}
                </article>
              ))}
            </div>
          )}

          {activeCourseTab === "scores" && (
            <div className="space-y-2">
              {attempts
                .filter((a) => a.quiz.lesson.course.id === selectedCourse.id)
                .map((a) => (
                  <article key={a.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                    <p className="font-medium">{a.quiz.lesson.title}</p>
                    <p className="text-blue-700">Score: {a.score}/{a.total}</p>
                    {a.student && <p>{a.student.fullName}</p>}
                  </article>
                ))}
              {!attempts.some((a) => a.quiz.lesson.course.id === selectedCourse.id) && (
                <p className="text-sm text-slate-500">No scores for this course yet.</p>
              )}
            </div>
          )}
        </article>
      )}
    </section>
  );
}





