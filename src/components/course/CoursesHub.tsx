import { useEffect, useState } from "react";
import type {
  Attempt,
  CatalogCourse,
  Course,
  Lesson,
  RosterRow,
  User,
} from "../../types/lms";
import { SelectedCoursePanel } from "./SelectedCoursePanel";
import { StudentCatalogPanel } from "./discover/StudentCatalogPanel";
import {
  fetchCatalogCourses,
  fetchCourseRoster,
  fetchPendingEnrollments,
  removeAllStudentsInSection,
  removeSelfEnrollment,
  removeStudentEnrollment,
  sendEnrollRequest,
} from "../../services/course.service";

export function CoursesHub(props: {
  user: User;
  api: any;
  headers: any;
  courses: Course[];
  attempts: Attempt[];
  selectedCourse: Course | null;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  studentViewMode?: "all" | "my" | "search";
  forcedCourseTab?:
    | "content"
    | "quizzes"
    | "assignments"
    | "activities"
    | "scores"
    | null;
}) {
  const {
    user,
    api,
    headers,
    courses,
    attempts,
    selectedCourse,
    refreshCore,
    setMessage,
    studentViewMode = "all",
    forcedCourseTab = null,
  } = props;
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState<
    number | null
  >(null);
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
  const [showEnrollRequest, setShowEnrollRequest] = useState<
    Record<number, boolean>
  >({});
  const [showAddSection, setShowAddSection] = useState<Record<number, boolean>>(
    {},
  );
  const [showManualEnroll, setShowManualEnroll] = useState<
    Record<number, boolean>
  >({});
  const [showAddLesson, setShowAddLesson] = useState<Record<number, boolean>>(
    {},
  );
  const [lessonTargetSection, setLessonTargetSection] = useState<
    Record<number, number>
  >({});
  const [activeCourseTab, setActiveCourseTab] = useState<
    "content" | "quizzes" | "assignments" | "activities" | "scores"
  >("content");

  useEffect(() => {
    if (forcedCourseTab) setActiveCourseTab(forcedCourseTab);
  }, [forcedCourseTab]);

  const [lessonInput, setLessonInput] = useState<
    Record<number, { title: string; content: string; fileUrl: string }>
  >({});

  function groupForLesson(lesson: Lesson) {
    const bag = `${lesson.title} ${lesson.content}`.toLowerCase();
    if (lesson.quiz) {
      if (
        bag.includes("exam") ||
        bag.includes("midterm") ||
        bag.includes("final")
      )
        return "Examinations";
      return "Quizzes";
    }
    if (
      bag.includes("lab") ||
      bag.includes("laboratory") ||
      bag.includes("problem set")
    )
      return "Laboratory";
    if (
      bag.includes("activity") ||
      bag.includes("assignment") ||
      bag.includes("seatwork")
    )
      return "Class Activities";
    if (
      bag.includes("exam") ||
      bag.includes("midterm") ||
      bag.includes("final")
    )
      return "Examinations";
    if (lesson.fileUrl) return "Resources";
    return "Lecture";
  }

  async function loadCatalog(query = catalogQuery) {
    try {
      setCatalog(await fetchCatalogCourses(api, headers, query));
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
      await sendEnrollRequest(api, headers, courseId, keyInput[courseId] || "");
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
      const data = await fetchPendingEnrollments(api, headers, courseId);
      setPending((p) => ({ ...p, [courseId]: data }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadRoster(courseId: number) {
    try {
      const data = await fetchCourseRoster(api, headers, courseId);
      setRoster((r) => ({ ...r, [courseId]: data }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function leaveCourse(courseId: number) {
    try {
      await removeSelfEnrollment(api, headers, courseId);
      await refreshCore();
      setMessage("You left the course.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function kickStudent(courseId: number, enrollmentId: number) {
    try {
      await removeStudentEnrollment(api, headers, courseId, enrollmentId);
      await Promise.all([refreshCore(), loadRoster(courseId)]);
      setMessage("Student removed from course.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function kickAllInSection(courseId: number, sectionId: number) {
    try {
      const data = await removeAllStudentsInSection(
        api,
        headers,
        courseId,
        sectionId,
      );
      await Promise.all([refreshCore(), loadRoster(courseId)]);
      setMessage(`Removed ${data.removed || 0} student(s) from block.`);
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
      const fallbackSectionId = courses.find((c) => c.id === courseId)
        ?.sections[0]?.id;
      const sectionIdForApproval =
        approveSection[enrollmentId] || fallbackSectionId;
      if (status === "APPROVED" && !sectionIdForApproval) {
        setMessage("No section available for approval. Create a block first.");
        return;
      }

      await api(`/courses/${courseId}/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status,
          sectionId: status === "APPROVED" ? sectionIdForApproval : undefined,
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

  async function updateSection(
    courseId: number,
    sectionId: number,
    name: string,
  ) {
    try {
      await api(`/courses/${courseId}/sections/${sectionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name }),
      });
      await refreshCore();
      setMessage("Block updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteSection(courseId: number, sectionId: number) {
    try {
      await api(`/courses/${courseId}/sections/${sectionId}`, {
        method: "DELETE",
        headers,
      });
      await refreshCore();
      setMessage("Block deleted.");
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

  async function addLesson(
    courseId: number,
    sectionId: number,
    lessonOverride?: { title: string; content: string; fileUrl: string },
  ) {
    try {
      await api(`/courses/${courseId}/sections/${sectionId}/lessons`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          lessonOverride ||
            lessonInput[courseId] || { title: "", content: "", fileUrl: "" },
        ),
      });
      await refreshCore();
      setLessonInput((x) => ({
        ...x,
        [courseId]: { title: "", content: "", fileUrl: "" },
      }));
      setShowAddLesson((p) => ({ ...p, [courseId]: false }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function updateLesson(
    courseId: number,
    sectionId: number,
    lessonId: number,
    payload: { title?: string; content?: string; fileUrl?: string },
  ) {
    try {
      await api(
        `/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        },
      );
      await refreshCore();
      setMessage("Lesson updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteLesson(
    courseId: number,
    sectionId: number,
    lessonId: number,
  ) {
    try {
      await api(
        `/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers,
        },
      );
      await refreshCore();
      setMessage("Lesson deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function updateQuiz(
    quizId: number,
    questions: any[],
    quizType?: "MULTIPLE_CHOICE" | "TRUE_FALSE",
  ) {
    try {
      await api(`/quizzes/${quizId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ questions, quizType }),
      });
      await refreshCore();
      setMessage("Quiz updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteQuiz(quizId: number) {
    try {
      await api(`/quizzes/${quizId}`, {
        method: "DELETE",
        headers,
      });
      await refreshCore();
      setMessage("Quiz deleted.");
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

  async function updateCourse(
    courseId: number,
    payload: { title: string; description: string },
  ) {
    try {
      await api(`/courses/${courseId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      await refreshCore();
      setMessage("Course updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function archiveCourse(courseId: number) {
    try {
      await api(`/courses/${courseId}/archive`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ archived: true }),
      });
      await refreshCore();
      setMessage("Course archived.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteCourse(courseId: number) {
    try {
      await api(`/courses/${courseId}`, {
        method: "DELETE",
        headers,
      });
      await refreshCore();
      setMessage("Course deleted.");
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
    const timer = window.setInterval(() => {
      refreshCore().catch(() => null);
      loadRoster(selectedCourse.id).catch(() => null);
      if (user.role === "INSTRUCTOR") {
        loadPending(selectedCourse.id).catch(() => null);
      }
    }, 10000);
    return () => window.clearInterval(timer);
  }, [selectedCourse?.id, user.role]);

  return (
    <section className="space-y-4">
      <StudentCatalogPanel
        studentViewMode={studentViewMode}
        userRole={user.role}
        catalogQuery={catalogQuery}
        setCatalogQuery={setCatalogQuery}
        loadCatalog={loadCatalog}
        catalog={catalog}
        selectedCatalogCourseId={selectedCatalogCourseId}
        setSelectedCatalogCourseId={setSelectedCatalogCourseId}
        selectedCatalogCourse={selectedCatalogCourse}
        showEnrollRequest={showEnrollRequest}
        setShowEnrollRequest={setShowEnrollRequest}
        keyInput={keyInput}
        setKeyInput={setKeyInput}
        requestEnroll={requestEnroll}
      />

      {selectedCourse ? (
        <SelectedCoursePanel
          selectedCourse={selectedCourse}
          user={user}
          studentViewMode={studentViewMode}
          roster={roster}
          loadRoster={loadRoster}
          activeCourseTab={activeCourseTab}
          setActiveCourseTab={setActiveCourseTab}
          regenerateEnrollmentKey={regenerateEnrollmentKey}
          showAddSection={showAddSection}
          setShowAddSection={setShowAddSection}
          newSection={newSection}
          setNewSection={setNewSection}
          addSection={addSection}
          updateSection={updateSection}
          deleteSection={deleteSection}
          showManualEnroll={showManualEnroll}
          setShowManualEnroll={setShowManualEnroll}
          manualEmail={manualEmail}
          setManualEmail={setManualEmail}
          manualSection={manualSection}
          setManualSection={setManualSection}
          manualAdd={manualAdd}
          showAddLesson={showAddLesson}
          setShowAddLesson={setShowAddLesson}
          lessonTargetSection={lessonTargetSection}
          setLessonTargetSection={setLessonTargetSection}
          lessonInput={lessonInput}
          setLessonInput={setLessonInput}
          addLesson={addLesson}
          updateLesson={updateLesson}
          deleteLesson={deleteLesson}
          updateQuiz={updateQuiz}
          deleteQuiz={deleteQuiz}
          loadPending={loadPending}
          pending={pending}
          approveSection={approveSection}
          setApproveSection={setApproveSection}
          decide={decide}
          attempts={attempts}
          groupForLesson={groupForLesson}
          api={api}
          headers={headers}
          refreshCore={refreshCore}
          setMessage={setMessage}
          updateCourse={updateCourse}
          archiveCourse={archiveCourse}
          deleteCourse={deleteCourse}
          leaveCourse={leaveCourse}
          kickStudent={kickStudent}
          kickAllInSection={kickAllInSection}
        />
      ) : (
        studentViewMode !== "search" && (
          <article className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Loading course view...
          </article>
        )
      )}
    </section>
  );
}
