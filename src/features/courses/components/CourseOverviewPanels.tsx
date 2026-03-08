import type { Course, User } from "../../../shared/types/lms";
import type { CourseAnnouncement } from "../hooks/useCourseAnnouncements";

type CourseAnnouncementsPanelProps = {
  announcements: CourseAnnouncement[];
  showAnnouncementHistory: boolean;
  setShowAnnouncementHistory: (updater: (prev: boolean) => boolean) => void;
};

export function CourseAnnouncementsPanel({
  announcements,
  showAnnouncementHistory,
  setShowAnnouncementHistory,
}: CourseAnnouncementsPanelProps) {
  return (
    <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold">Course Announcements</p>
        <button
          onClick={() => setShowAnnouncementHistory((v) => !v)}
          className="rounded border border-transparent p-1.5 hover:bg-white"
          aria-label="View recent announcements"
          title="Recent announcements"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1.8" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
      {announcements.length ? (
        <>
          <p>{announcements[0].text}</p>
          <p className="mt-1 text-xs text-slate-500">
            {announcements[0].sectionName
              ? `Block: ${announcements[0].sectionName} - `
              : "All blocks - "}
            Posted {new Date(announcements[0].createdAt).toLocaleString()}
          </p>
        </>
      ) : (
        <p>
          No announcements yet. Important instructor updates will appear here.
        </p>
      )}
      {showAnnouncementHistory && (
        <div className="mt-2 max-h-40 space-y-1 overflow-auto rounded-md border border-slate-200 bg-white p-2">
          <p className="text-xs font-semibold text-slate-600">
            Recent Announcements
          </p>
          {announcements.length > 1 ? (
            announcements.slice(1, 11).map((announcement) => (
              <div
                key={announcement.id}
                className="rounded border border-slate-200 bg-slate-50 p-2"
              >
                <p className="text-xs text-slate-800">{announcement.text}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {announcement.sectionName
                    ? `Block: ${announcement.sectionName} - `
                    : "All blocks - "}
                  {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No previous announcements.</p>
          )}
        </div>
      )}
    </div>
  );
}

type CourseHeaderPanelProps = {
  selectedCourse: Course;
  user: User;
  regenerateEnrollmentKey: (courseId: number) => Promise<void>;
  loadRoster: (courseId: number) => Promise<void>;
  setShowCourseInfo: (open: boolean) => void;
};

export function CourseHeaderPanel({
  selectedCourse,
  user,
  regenerateEnrollmentKey,
  loadRoster,
  setShowCourseInfo,
}: CourseHeaderPanelProps) {
  return (
    <>
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Course
        </p>
        <p className="text-xl font-semibold text-slate-900">
          {selectedCourse.title}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {selectedCourse.description}
        </p>
      </div>

      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          {user.role === "INSTRUCTOR" && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-blue-700">
                Enrollment Key: {selectedCourse.enrollmentKey}
              </p>
              <button
                onClick={() => regenerateEnrollmentKey(selectedCourse.id)}
                className="rounded border border-transparent bg-white px-2 py-1 text-xs hover:bg-slate-50"
              >
                New Key
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRoster(selectedCourse.id)}
            className="rounded border border-slate-300 p-2 text-xs"
            title="Refresh student list"
            aria-label="Refresh student list"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
          <button
            onClick={() => setShowCourseInfo(true)}
            className="rounded border border-slate-300 p-2 text-xs"
            aria-label="Open course info"
            title="Course info"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

type InstructorOverviewPanelsProps = {
  selectedCourse: Course;
  filteredRosterCount: number;
  setActiveCourseTab: (
    tab: "content" | "quizzes" | "assignments" | "activities",
  ) => void;
  setLessonComposerSectionId: (id: number | null) => void;
  setShowEnrollmentManager: (open: boolean) => void;
  createAnnouncement: () => Promise<void>;
};

export function InstructorOverviewPanels({
  selectedCourse,
  filteredRosterCount,
  setActiveCourseTab,
  setLessonComposerSectionId,
  setShowEnrollmentManager,
  createAnnouncement,
}: InstructorOverviewPanelsProps) {
  return (
    <section className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Course Content</p>
            <p className="text-xs text-slate-500">
              Manage blocks and resources only.
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setActiveCourseTab("content");
                setLessonComposerSectionId(
                  selectedCourse.sections[0]?.id || null,
                );
              }}
              className="rounded-md bg-blue-700 p-2 text-white hover:bg-blue-800"
              aria-label="Upload resource"
              title="Upload resource"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 16V7" />
                <path d="m8 11 4-4 4 4" />
                <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
                <path d="M9 4h6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Blocks: {selectedCourse.sections.length}
        </div>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Enrollment / Students</p>
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
            By Block
          </span>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                {filteredRosterCount}
              </span>{" "}
              students in selected block
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEnrollmentManager(true)}
                className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Manage
              </button>
              <button
                data-keep-action-text="true"
                onClick={createAnnouncement}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                New Announcement
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

type PendingRequestsPanelProps = {
  selectedCourse: Course;
  pendingRows: { id: number; student: { fullName: string; email: string } }[];
  approveSection: Record<number, number>;
  setApproveSection: (updater: any) => void;
  loadPending: (courseId: number) => Promise<void>;
  decide: (
    courseId: number,
    enrollmentId: number,
    status: "APPROVED" | "REJECTED",
  ) => Promise<void>;
};

export function PendingRequestsPanel({
  selectedCourse,
  pendingRows,
  approveSection,
  setApproveSection,
  loadPending,
  decide,
}: PendingRequestsPanelProps) {
  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Pending Requests</p>
          <p className="text-xs text-slate-500">
            Review enrollment applications by assigning a block.
          </p>
        </div>
        <button
          onClick={() => loadPending(selectedCourse.id)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
          title="Refresh pending"
        >
          Refresh
        </button>
      </div>
      <div className="hidden grid-cols-[1.2fr_1fr_auto] gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 md:grid">
        <p>Student</p>
        <p>Assign Block</p>
        <p>Actions</p>
      </div>
      <div className="mt-2 space-y-2">
        {pendingRows.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
            No pending requests.
          </p>
        )}
        {pendingRows.map((p) => (
          <article
            key={p.id}
            className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1.2fr_1fr_auto] md:items-center"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {p.student.fullName}
              </p>
              <p className="text-xs text-slate-500">{p.student.email}</p>
            </div>
            <select
              value={
                approveSection[p.id] || selectedCourse.sections[0]?.id || ""
              }
              onChange={(e) =>
                setApproveSection((x: any) => ({
                  ...x,
                  [p.id]: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {selectedCourse.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => decide(selectedCourse.id, p.id, "APPROVED")}
                className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
              >
                Approve
              </button>
              <button
                onClick={() => decide(selectedCourse.id, p.id, "REJECTED")}
                className="rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type CourseTabsProps = {
  activeCourseTab: "content" | "quizzes" | "assignments" | "activities";
  setActiveCourseTab: (
    tab: "content" | "quizzes" | "assignments" | "activities",
  ) => void;
};

export function CourseTabs({
  activeCourseTab,
  setActiveCourseTab,
}: CourseTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-1">
      <button
        onClick={() => setActiveCourseTab("content")}
        className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "content" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
      >
        Content
      </button>
      <button
        onClick={() => setActiveCourseTab("quizzes")}
        className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "quizzes" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
      >
        Quizzes
      </button>
      <button
        onClick={() => setActiveCourseTab("assignments")}
        className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "assignments" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
      >
        Assignments
      </button>
      <button
        onClick={() => setActiveCourseTab("activities")}
        className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "activities" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
      >
        Activities
      </button>
    </div>
  );
}
