import { useEffect, useState } from "react";
import type { Attempt, Course, Lesson, User } from "../../types/lms";
import { useCourseAnnouncements } from "../../hooks/useCourseAnnouncements";
import { useRosterPagination } from "../../hooks/useRosterPagination";
import {
  ConfirmRemoveAllModal,
  CourseInfoModal,
  EditCourseModal,
  EditLessonModal,
  EnrollmentManagerModal,
  LessonComposerModal,
} from "../../features/courses/components/CourseModals";
import {
  CourseAnnouncementsPanel,
  CourseHeaderPanel,
  CourseTabs,
  InstructorOverviewPanels,
  PendingRequestsPanel,
} from "../../features/courses/components/CourseOverviewPanels";
import {
  InstructorContentTab,
  QuizzesTab,
  ScoresTab,
  StudentContentTab,
  TasksTab,
} from "./selected-course/TabPanels";

type Props = {
  selectedCourse: Course | null;
  user: User;
  studentViewMode: "all" | "my" | "search";
  roster: Record<number, any[]>;
  loadRoster: (courseId: number) => Promise<void>;
  activeCourseTab: "content" | "quizzes" | "assignments" | "activities" | "scores";
  setActiveCourseTab: (
    tab: "content" | "quizzes" | "assignments" | "activities" | "scores",
  ) => void;
  regenerateEnrollmentKey: (courseId: number) => Promise<void>;
  showAddSection: Record<number, boolean>;
  setShowAddSection: (v: any) => void;
  newSection: Record<number, string>;
  setNewSection: (v: any) => void;
  addSection: (courseId: number) => Promise<void>;
  updateSection: (
    courseId: number,
    sectionId: number,
    name: string,
  ) => Promise<void>;
  deleteSection: (courseId: number, sectionId: number) => Promise<void>;
  showManualEnroll: Record<number, boolean>;
  setShowManualEnroll: (v: any) => void;
  manualEmail: Record<number, string>;
  setManualEmail: (v: any) => void;
  manualSection: Record<number, number>;
  setManualSection: (v: any) => void;
  manualAdd: (course: Course) => Promise<void>;
  showAddLesson: Record<number, boolean>;
  setShowAddLesson: (v: any) => void;
  lessonTargetSection: Record<number, number>;
  setLessonTargetSection: (v: any) => void;
  lessonInput: Record<
    number,
    { title: string; content: string; fileUrl: string }
  >;
  setLessonInput: (v: any) => void;
  addLesson: (
    courseId: number,
    sectionId: number,
    lessonOverride?: { title: string; content: string; fileUrl: string },
  ) => Promise<void>;
  updateLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
    payload: { title?: string; content?: string; fileUrl?: string },
  ) => Promise<void>;
  deleteLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
  ) => Promise<void>;
  updateQuiz: (
    quizId: number,
    questions: any[],
    quizType?: "MULTIPLE_CHOICE" | "TRUE_FALSE",
  ) => Promise<void>;
  deleteQuiz: (quizId: number) => Promise<void>;
  loadPending: (courseId: number) => Promise<void>;
  pending: Record<
    number,
    { id: number; student: { fullName: string; email: string } }[]
  >;
  approveSection: Record<number, number>;
  setApproveSection: (v: any) => void;
  decide: (
    courseId: number,
    enrollmentId: number,
    status: "APPROVED" | "REJECTED",
  ) => Promise<void>;
  attempts: Attempt[];
  groupForLesson: (lesson: Lesson) => string;
  api: any;
  headers: any;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  updateCourse: (
    courseId: number,
    payload: { title: string; description: string },
  ) => Promise<void>;
  archiveCourse: (courseId: number) => Promise<void>;
  deleteCourse: (courseId: number) => Promise<void>;
  leaveCourse: (courseId: number) => Promise<void>;
  kickStudent: (courseId: number, enrollmentId: number) => Promise<void>;
  kickAllInSection: (courseId: number, sectionId: number) => Promise<void>;
};

export function SelectedCoursePanel(props: Props) {
  const [showCourseInfo, setShowCourseInfo] = useState(false);
  const [lessonComposerSectionId, setLessonComposerSectionId] = useState<
    number | null
  >(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<
    Record<number, boolean>
  >({});
  const [lessonMenuOpenId, setLessonMenuOpenId] = useState<number | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{
    sectionId: number;
    lesson: Lesson;
  } | null>(null);
  const [editLessonInput, setEditLessonInput] = useState({
    title: "",
    content: "",
    fileUrl: "",
  });
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editCourseInput, setEditCourseInput] = useState({
    title: "",
    description: "",
  });
  const [kickSectionId, setKickSectionId] = useState<number | null>(null);
  const [enrollSectionId, setEnrollSectionId] = useState<number | null>(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [confirmRemoveAllOpen, setConfirmRemoveAllOpen] = useState(false);
  const [showDangerTools, setShowDangerTools] = useState(false);
  const [showEnrollmentManager, setShowEnrollmentManager] = useState(false);
  const {
    selectedCourse,
    user,
    studentViewMode,
    roster,
    loadRoster,
    activeCourseTab,
    setActiveCourseTab,
    regenerateEnrollmentKey,
    manualEmail,
    setManualEmail,
    setManualSection,
    manualAdd,
    lessonInput,
    setLessonInput,
    addLesson,
    updateLesson,
    deleteLesson,
    updateQuiz,
    deleteQuiz,
    loadPending,
    pending,
    approveSection,
    setApproveSection,
    decide,
    attempts,
    groupForLesson,
    api,
    headers,
    refreshCore,
    setMessage,
    updateCourse,
    archiveCourse,
    deleteCourse,
    leaveCourse,
    kickStudent,
    kickAllInSection,
  } = props;

  const isCourseVisible = Boolean(
    selectedCourse &&
    !(user.role !== "INSTRUCTOR" && studentViewMode === "search"),
  );
  const {
    announcements,
    showAnnouncementHistory,
    setShowAnnouncementHistory,
    createAnnouncement,
  } = useCourseAnnouncements({
    api,
    headers,
    setMessage,
    selectedCourseId: selectedCourse?.id ?? 0,
    selectedCourseTitle: selectedCourse?.title || "",
    sections: selectedCourse?.sections || [],
    enabled: isCourseVisible,
  });
  if (!selectedCourse || !isCourseVisible) {
    return null;
  }

  const enrolledStudents = (roster[selectedCourse.id] || []).map(
    (r: any) => r.student,
  );
  const rosterRows = roster[selectedCourse.id] || [];
  const {
    rosterQuery,
    setRosterQuery,
    setRosterPage,
    filteredRosterRows,
    pagedRosterRows,
    rosterPageSize,
    rosterTotalPages,
    safeRosterPage,
  } = useRosterPagination(rosterRows, enrollSectionId, 10);
  const uniqueStudents: { id: number; fullName: string }[] = [];
  const seen = new Set<number>();
  for (const student of enrolledStudents) {
    if (!student?.id || !student?.fullName || seen.has(student.id)) continue;
    seen.add(student.id);
    uniqueStudents.push({ id: student.id, fullName: student.fullName });
  }
  const composerSection =
    selectedCourse.sections.find(
      (section) => section.id === lessonComposerSectionId,
    ) || null;

  function toUserMessage(error: unknown) {
    const msg = (error as Error)?.message || "Request failed";
    if (msg.includes("Google Drive not linked")) {
      return "Google Drive is not linked. Please link your account in the Files tab first.";
    }
    if (msg.includes("Service account uploads require")) {
      return "Drive upload is disabled in service-account mode. Use OAuth-linked account.";
    }
    if (msg.includes("Uploaded file is too large")) {
      return "Selected file is too large. Please choose a smaller file.";
    }
    return msg;
  }

  async function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(file);
    });
  }

  async function saveResourceToLesson() {
    if (!composerSection) return;
    const current = lessonInput[selectedCourse!.id] || {
      title: "",
      content: "",
      fileUrl: "",
    };
    if (!current.title.trim() || !current.content.trim()) {
      setMessage("Please provide both resource title and description.");
      return;
    }

    try {
      setIsUploadingResource(true);
      let driveLink = current.fileUrl || "";

      if (resourceFile) {
        const base64 = await toBase64(resourceFile);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: resourceFile.name,
            contentBase64: base64,
            mimeType: resourceFile.type || "application/octet-stream",
          }),
        });
        driveLink = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await addLesson(selectedCourse!.id, composerSection.id, {
        title: current.title,
        content: current.content,
        fileUrl: driveLink,
      });
      setResourceFile(null);
      setLessonComposerSectionId(null);
      setMessage("Resource saved. Students can open the uploaded file.");
    } catch (e) {
      setMessage(toUserMessage(e));
    } finally {
      setIsUploadingResource(false);
    }
  }

  useEffect(() => {
    setCollapsedBlocks(
      selectedCourse.sections.reduce(
        (acc, section) => ({ ...acc, [section.id]: false }),
        {} as Record<number, boolean>,
      ),
    );
  }, [selectedCourse.id]);

  useEffect(() => {
    setEditCourseInput({
      title: selectedCourse.title || "",
      description: selectedCourse.description || "",
    });
    setKickSectionId(selectedCourse.sections[0]?.id || null);
    setEnrollSectionId(selectedCourse.sections[0]?.id || null);
    setRosterQuery("");
    setRosterPage(1);
  }, [selectedCourse.id, selectedCourse.title, selectedCourse.description]);

  return (
    <article className="rounded-md border border-slate-200 p-3">
      <CourseAnnouncementsPanel
        announcements={announcements}
        showAnnouncementHistory={showAnnouncementHistory}
        setShowAnnouncementHistory={setShowAnnouncementHistory}
      />
      <CourseHeaderPanel
        selectedCourse={selectedCourse}
        user={user}
        regenerateEnrollmentKey={regenerateEnrollmentKey}
        loadRoster={loadRoster}
        setShowCourseInfo={setShowCourseInfo}
      />
      {user.role === "INSTRUCTOR" && (
        <InstructorOverviewPanels
          selectedCourse={selectedCourse}
          filteredRosterCount={filteredRosterRows.length}
          setActiveCourseTab={setActiveCourseTab}
          setLessonComposerSectionId={setLessonComposerSectionId}
          setShowEnrollmentManager={setShowEnrollmentManager}
          createAnnouncement={createAnnouncement}
        />
      )}
      {user.role === "INSTRUCTOR" && (
        <PendingRequestsPanel
          selectedCourse={selectedCourse}
          pendingRows={pending[selectedCourse.id] || []}
          approveSection={approveSection}
          setApproveSection={setApproveSection}
          loadPending={loadPending}
          decide={decide}
        />
      )}
      <CourseTabs
        activeCourseTab={activeCourseTab}
        setActiveCourseTab={setActiveCourseTab}
      />

      {activeCourseTab === "content" && user.role === "INSTRUCTOR" && (
        <InstructorContentTab
          selectedCourse={selectedCourse}
          collapsedBlocks={collapsedBlocks}
          setCollapsedBlocks={setCollapsedBlocks}
          groupForLesson={groupForLesson}
          setEditingLesson={setEditingLesson}
          setEditLessonInput={setEditLessonInput}
          lessonMenuOpenId={lessonMenuOpenId}
          setLessonMenuOpenId={setLessonMenuOpenId}
          deleteLesson={deleteLesson}
        />
      )}

      {activeCourseTab === "content" && user.role === "STUDENT" && (
        <StudentContentTab
          selectedCourse={selectedCourse}
          groupForLesson={groupForLesson}
          api={api}
          headers={headers}
          refreshCore={refreshCore}
          setMessage={setMessage}
        />
      )}

      {activeCourseTab === "quizzes" && (
        <QuizzesTab
          selectedCourse={selectedCourse}
          attempts={attempts}
          user={user}
          api={api}
          headers={headers}
          refreshCore={refreshCore}
          setMessage={setMessage}
          updateQuiz={updateQuiz}
          deleteQuiz={deleteQuiz}
          setActiveCourseTab={setActiveCourseTab}
        />
      )}

      {activeCourseTab === "scores" && (
        <ScoresTab
          selectedCourse={selectedCourse}
          attempts={attempts}
          user={user}
          api={api}
          headers={headers}
          setMessage={setMessage}
        />
      )}
      {activeCourseTab === "assignments" && (
        <TasksTab
          kind="ASSIGNMENT"
          selectedCourse={selectedCourse}
          user={user}
          api={api}
          headers={headers}
          setMessage={setMessage}
        />
      )}
      {activeCourseTab === "activities" && (
        <TasksTab
          kind="ACTIVITY"
          selectedCourse={selectedCourse}
          user={user}
          api={api}
          headers={headers}
          setMessage={setMessage}
        />
      )}

      <CourseInfoModal
        open={showCourseInfo}
        selectedCourse={selectedCourse}
        uniqueStudents={uniqueStudents}
        user={user}
        showDangerTools={showDangerTools}
        setShowDangerTools={setShowDangerTools}
        kickSectionId={kickSectionId}
        setKickSectionId={setKickSectionId}
        setConfirmRemoveAllOpen={setConfirmRemoveAllOpen}
        setShowCourseInfo={setShowCourseInfo}
        setEditCourseOpen={setEditCourseOpen}
        archiveCourse={archiveCourse}
        deleteCourse={deleteCourse}
        leaveCourse={leaveCourse}
      />

      <EditCourseModal
        open={user.role === "INSTRUCTOR" && editCourseOpen}
        editCourseInput={editCourseInput}
        setEditCourseInput={setEditCourseInput}
        setEditCourseOpen={setEditCourseOpen}
        setShowCourseInfo={setShowCourseInfo}
        selectedCourse={selectedCourse}
        updateCourse={updateCourse}
      />

      <ConfirmRemoveAllModal
        open={user.role === "INSTRUCTOR" && confirmRemoveAllOpen}
        selectedCourse={selectedCourse}
        kickSectionId={kickSectionId}
        kickAllInSection={kickAllInSection}
        setConfirmRemoveAllOpen={setConfirmRemoveAllOpen}
      />

      <EnrollmentManagerModal
        open={user.role === "INSTRUCTOR" && showEnrollmentManager}
        selectedCourse={selectedCourse}
        enrollSectionId={enrollSectionId}
        setEnrollSectionId={setEnrollSectionId}
        setManualSection={setManualSection}
        setRosterPage={setRosterPage}
        showEnrollForm={showEnrollForm}
        setShowEnrollForm={setShowEnrollForm}
        manualEmail={manualEmail}
        setManualEmail={setManualEmail}
        manualAdd={manualAdd}
        rosterQuery={rosterQuery}
        setRosterQuery={setRosterQuery}
        filteredRosterRows={filteredRosterRows}
        pagedRosterRows={pagedRosterRows}
        safeRosterPage={safeRosterPage}
        rosterPageSize={rosterPageSize}
        rosterTotalPages={rosterTotalPages}
        kickStudent={kickStudent}
        setShowEnrollmentManager={setShowEnrollmentManager}
      />

      <EditLessonModal
        open={user.role === "INSTRUCTOR" && Boolean(editingLesson)}
        editingLesson={editingLesson}
        setEditingLesson={setEditingLesson}
        editLessonInput={editLessonInput}
        setEditLessonInput={setEditLessonInput}
        selectedCourse={selectedCourse}
        updateLesson={updateLesson}
      />

      <LessonComposerModal
        open={user.role === "INSTRUCTOR" && Boolean(composerSection)}
        composerSection={composerSection}
        selectedCourse={selectedCourse}
        lessonInput={lessonInput}
        setLessonInput={setLessonInput}
        resourceFile={resourceFile}
        setResourceFile={setResourceFile}
        saveResourceToLesson={saveResourceToLesson}
        isUploadingResource={isUploadingResource}
        setLessonComposerSectionId={setLessonComposerSectionId}
      />
    </article>
  );
}
