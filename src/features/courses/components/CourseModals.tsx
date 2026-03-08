import { useMemo, useState } from "react";
import type { Course, Lesson, User } from "../../../types/lms";

type StudentLite = { id: number; fullName: string };

type CourseInfoModalProps = {
  open: boolean;
  selectedCourse: Course;
  uniqueStudents: StudentLite[];
  user: User;
  showDangerTools: boolean;
  setShowDangerTools: (v: boolean | ((x: boolean) => boolean)) => void;
  kickSectionId: number | null;
  setKickSectionId: (id: number | null) => void;
  setConfirmRemoveAllOpen: (v: boolean) => void;
  setShowCourseInfo: (v: boolean) => void;
  setEditCourseOpen: (v: boolean) => void;
  archiveCourse: (courseId: number) => Promise<void>;
  deleteCourse: (courseId: number) => Promise<void>;
  leaveCourse: (courseId: number) => Promise<void>;
};

export function CourseInfoModal(props: CourseInfoModalProps) {
  const {
    open,
    selectedCourse,
    uniqueStudents,
    user,
    showDangerTools,
    setShowDangerTools,
    kickSectionId,
    setKickSectionId,
    setConfirmRemoveAllOpen,
    setShowCourseInfo,
    setEditCourseOpen,
    archiveCourse,
    deleteCourse,
    leaveCourse,
  } = props;
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 10;
  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return uniqueStudents;
    return uniqueStudents.filter((student) =>
      student.fullName.toLowerCase().includes(q),
    );
  }, [uniqueStudents, studentQuery]);
  const studentTotalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentPageSize),
  );
  const safeStudentPage = Math.min(studentPage, studentTotalPages);
  const pagedStudents = filteredStudents.slice(
    (safeStudentPage - 1) * studentPageSize,
    safeStudentPage * studentPageSize,
  );
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">Course Info</h3>
          <button
            onClick={() => setShowCourseInfo(false)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Name:</span> {selectedCourse.title}
          </p>
          <p>
            <span className="font-semibold">Description:</span>{" "}
            {selectedCourse.description || "No description"}
          </p>
          <p>
            <span className="font-semibold">Students Enrolled:</span>{" "}
            {uniqueStudents.length}
          </p>
          <div>
            <p className="font-semibold">Enrolled Students:</p>
            {uniqueStudents.length ? (
              <>
                <input
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
                    setStudentPage(1);
                  }}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Search enrolled students"
                />
                <ul className="mt-2 max-h-44 list-disc overflow-auto pl-5 text-sm">
                  {pagedStudents.map((student) => (
                    <li key={student.id}>{student.fullName}</li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <p>
                    Showing{" "}
                    {filteredStudents.length
                      ? (safeStudentPage - 1) * studentPageSize + 1
                      : 0}
                    -{Math.min(safeStudentPage * studentPageSize, filteredStudents.length)} of{" "}
                    {filteredStudents.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setStudentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={safeStudentPage <= 1}
                      className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span>
                      {safeStudentPage}/{studentTotalPages}
                    </span>
                    <button
                      onClick={() =>
                        setStudentPage((p) => Math.min(studentTotalPages, p + 1))
                      }
                      disabled={safeStudentPage >= studentTotalPages}
                      className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-500">No enrolled students to show.</p>
            )}
          </div>
          {user.role === "STUDENT" && (
            <div className="pt-2">
              <button
                onClick={async () => {
                  if (!confirm(`Leave course "${selectedCourse.title}"?`))
                    return;
                  await leaveCourse(selectedCourse.id);
                  setShowCourseInfo(false);
                }}
                className="rounded-md border border-rose-300 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50"
              >
                Leave Course
              </button>
            </div>
          )}
          {user.role === "INSTRUCTOR" && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setEditCourseOpen(true)}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50"
              >
                Edit Course
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Archive course "${selectedCourse.title}"?`))
                    return;
                  await archiveCourse(selectedCourse.id);
                  setShowCourseInfo(false);
                }}
                className="rounded-md border border-amber-300 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50"
              >
                Archive Course
              </button>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      `Delete course "${selectedCourse.title}" permanently?`,
                    )
                  )
                    return;
                  await deleteCourse(selectedCourse.id);
                  setShowCourseInfo(false);
                }}
                className="rounded-md border border-rose-300 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50"
              >
                Delete Course
              </button>
              <button
                onClick={() => setShowDangerTools((v) => !v)}
                className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100"
              >
                {showDangerTools ? "Close" : "Remove all Students"}
              </button>
            </div>
          )}
          {user.role === "INSTRUCTOR" && showDangerTools && (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">
                Danger Zone
              </p>
              <p className="mb-2 text-xs text-rose-700">
                Removes student enrollments only. Lessons/resources are not
                deleted.
              </p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={kickSectionId || selectedCourse.sections[0]?.id || ""}
                  onChange={(e) => setKickSectionId(Number(e.target.value))}
                  className="w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
                >
                  {selectedCourse.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setConfirmRemoveAllOpen(true)}
                  className="rounded-md border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Remove All Students
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setShowCourseInfo(false)}
        aria-label="Close course info"
      />
    </div>
  );
}

type EditCourseModalProps = {
  open: boolean;
  editCourseInput: { title: string; description: string };
  setEditCourseInput: (v: any) => void;
  setEditCourseOpen: (v: boolean) => void;
  setShowCourseInfo: (v: boolean) => void;
  selectedCourse: Course;
  updateCourse: (
    courseId: number,
    payload: { title: string; description: string },
  ) => Promise<void>;
};

export function EditCourseModal(props: EditCourseModalProps) {
  const {
    open,
    editCourseInput,
    setEditCourseInput,
    setEditCourseOpen,
    setShowCourseInfo,
    selectedCourse,
    updateCourse,
  } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">Edit Course</h3>
          <button
            onClick={() => setEditCourseOpen(false)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <input
          value={editCourseInput.title}
          onChange={(e) =>
            setEditCourseInput((x: any) => ({ ...x, title: e.target.value }))
          }
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Course title"
        />
        <textarea
          value={editCourseInput.description}
          onChange={(e) =>
            setEditCourseInput((x: any) => ({
              ...x,
              description: e.target.value,
            }))
          }
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Course description"
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await updateCourse(selectedCourse.id, editCourseInput);
              setEditCourseOpen(false);
              setShowCourseInfo(false);
            }}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Save Changes
          </button>
          <button
            onClick={() => setEditCourseOpen(false)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setEditCourseOpen(false)}
        aria-label="Close edit course modal"
      />
    </div>
  );
}

type EditSectionModalProps = {
  open: boolean;
  editingSection: { id: number; name: string } | null;
  setEditingSection: (
    v:
      | { id: number; name: string }
      | null
      | ((
          x: { id: number; name: string } | null,
        ) => { id: number; name: string } | null),
  ) => void;
  selectedCourse: Course;
  updateSection: (
    courseId: number,
    sectionId: number,
    name: string,
  ) => Promise<void>;
};

export function EditSectionModal(props: EditSectionModalProps) {
  const {
    open,
    editingSection,
    setEditingSection,
    selectedCourse,
    updateSection,
  } = props;
  if (!open || !editingSection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">Edit Block</h3>
          <button
            onClick={() => setEditingSection(null)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <input
          value={editingSection.name}
          onChange={(e) =>
            setEditingSection((x) => (x ? { ...x, name: e.target.value } : x))
          }
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Block name"
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await updateSection(
                selectedCourse.id,
                editingSection.id,
                editingSection.name,
              );
              setEditingSection(null);
            }}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Save
          </button>
          <button
            onClick={() => setEditingSection(null)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setEditingSection(null)}
        aria-label="Close edit block modal"
      />
    </div>
  );
}

type ConfirmRemoveAllModalProps = {
  open: boolean;
  selectedCourse: Course;
  kickSectionId: number | null;
  kickAllInSection: (courseId: number, sectionId: number) => Promise<void>;
  setConfirmRemoveAllOpen: (v: boolean) => void;
};

export function ConfirmRemoveAllModal(props: ConfirmRemoveAllModalProps) {
  const {
    open,
    selectedCourse,
    kickSectionId,
    kickAllInSection,
    setConfirmRemoveAllOpen,
  } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-md border border-rose-200 bg-white p-4 shadow-lg">
        <h3 className="text-base font-semibold text-rose-800">
          Remove All Students
        </h3>
        <p className="mt-2 text-sm text-slate-700">
          This will remove all student enrollments from the selected block only.
          Course resources, lessons, and block content will remain unchanged.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={async () => {
              const target = kickSectionId || selectedCourse.sections[0]?.id;
              if (!target) return;
              await kickAllInSection(selectedCourse.id, target);
              setConfirmRemoveAllOpen(false);
            }}
            className="rounded-md bg-rose-600 px-3 py-2 text-sm text-white"
          >
            Confirm Remove
          </button>
          <button
            onClick={() => setConfirmRemoveAllOpen(false)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setConfirmRemoveAllOpen(false)}
        aria-label="Close remove all students modal"
      />
    </div>
  );
}

type EnrollmentManagerModalProps = {
  open: boolean;
  selectedCourse: Course;
  enrollSectionId: number | null;
  setEnrollSectionId: (id: number | null) => void;
  setManualSection: (v: any) => void;
  setRosterPage: (v: number | ((x: number) => number)) => void;
  showEnrollForm: boolean;
  setShowEnrollForm: (v: boolean | ((x: boolean) => boolean)) => void;
  manualEmail: Record<number, string>;
  setManualEmail: (v: any) => void;
  manualAdd: (course: Course) => Promise<void>;
  rosterQuery: string;
  setRosterQuery: (v: string) => void;
  filteredRosterRows: any[];
  pagedRosterRows: any[];
  safeRosterPage: number;
  rosterPageSize: number;
  rosterTotalPages: number;
  kickStudent: (courseId: number, enrollmentId: number) => Promise<void>;
  setShowEnrollmentManager: (v: boolean) => void;
};

export function EnrollmentManagerModal(props: EnrollmentManagerModalProps) {
  const {
    open,
    selectedCourse,
    enrollSectionId,
    setEnrollSectionId,
    setManualSection,
    setRosterPage,
    showEnrollForm,
    setShowEnrollForm,
    manualEmail,
    setManualEmail,
    manualAdd,
    rosterQuery,
    setRosterQuery,
    filteredRosterRows,
    pagedRosterRows,
    safeRosterPage,
    rosterPageSize,
    rosterTotalPages,
    kickStudent,
    setShowEnrollmentManager,
  } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Enrollment Manager</h3>
            <p className="text-xs text-slate-500">
              Manage enrollments by block without affecting lessons/resources.
            </p>
          </div>
          <button
            onClick={() => setShowEnrollmentManager(false)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            value={enrollSectionId || selectedCourse.sections[0]?.id || ""}
            onChange={(e) => {
              const next = Number(e.target.value);
              setEnrollSectionId(next);
              setManualSection((p: any) => ({
                ...p,
                [selectedCourse.id]: next,
              }));
              setRosterPage(1);
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {selectedCourse.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowEnrollForm((v) => !v)}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
          >
            Enroll Student
          </button>
        </div>

        {showEnrollForm && (
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
            <div className="flex gap-2">
              <input
                value={manualEmail[selectedCourse.id] || ""}
                onChange={(e) =>
                  setManualEmail((p: any) => ({
                    ...p,
                    [selectedCourse.id]: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="student@email.com"
              />
              <button
                onClick={() => manualAdd(selectedCourse)}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <input
          value={rosterQuery}
          onChange={(e) => {
            setRosterQuery(e.target.value);
            setRosterPage(1);
          }}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          placeholder="Search student name or email"
        />

        <div className="mt-2 max-h-64 space-y-1 overflow-auto rounded-md border border-slate-200 bg-white p-2">
          {!filteredRosterRows.length && (
            <p className="text-xs text-slate-500">
              No enrolled students in this block.
            </p>
          )}
          {pagedRosterRows.map((row: any) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {row.student?.fullName}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {row.student?.email || ""}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  Block: {row.section?.name || "-"}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      `Remove ${row.student?.fullName || "student"} from this course enrollment?`,
                    )
                  )
                    return;
                  await kickStudent(selectedCourse.id, row.id);
                }}
                className="rounded-md border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <p>
            Showing{" "}
            {filteredRosterRows.length
              ? (safeRosterPage - 1) * rosterPageSize + 1
              : 0}
            -
            {Math.min(
              safeRosterPage * rosterPageSize,
              filteredRosterRows.length,
            )}{" "}
            of {filteredRosterRows.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRosterPage((p: number) => Math.max(1, p - 1))}
              disabled={safeRosterPage <= 1}
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              {safeRosterPage}/{rosterTotalPages}
            </span>
            <button
              onClick={() =>
                setRosterPage((p: number) => Math.min(rosterTotalPages, p + 1))
              }
              disabled={safeRosterPage >= rosterTotalPages}
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setShowEnrollmentManager(false)}
        aria-label="Close enrollment manager modal"
      />
    </div>
  );
}

type EditLessonModalProps = {
  open: boolean;
  editingLesson: { sectionId: number; lesson: Lesson } | null;
  setEditingLesson: (v: { sectionId: number; lesson: Lesson } | null) => void;
  editLessonInput: { title: string; content: string; fileUrl: string };
  setEditLessonInput: (v: any) => void;
  selectedCourse: Course;
  updateLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
    payload: { title?: string; content?: string; fileUrl?: string },
  ) => Promise<void>;
};

export function EditLessonModal(props: EditLessonModalProps) {
  const {
    open,
    editingLesson,
    setEditingLesson,
    editLessonInput,
    setEditLessonInput,
    selectedCourse,
    updateLesson,
  } = props;
  if (!open || !editingLesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Edit Resource</h3>
            <p className="text-xs text-slate-500">
              Update lesson details and file link.
            </p>
          </div>
          <button
            onClick={() => setEditingLesson(null)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        <input
          value={editLessonInput.title}
          onChange={(e) =>
            setEditLessonInput((x: any) => ({ ...x, title: e.target.value }))
          }
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Resource title"
        />
        <textarea
          value={editLessonInput.content}
          onChange={(e) =>
            setEditLessonInput((x: any) => ({ ...x, content: e.target.value }))
          }
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Resource description"
        />
        <input
          value={editLessonInput.fileUrl}
          onChange={(e) =>
            setEditLessonInput((x: any) => ({ ...x, fileUrl: e.target.value }))
          }
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="https://drive.google.com/..."
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await updateLesson(
                selectedCourse.id,
                editingLesson.sectionId,
                editingLesson.lesson.id,
                editLessonInput,
              );
              setEditingLesson(null);
            }}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Save Changes
          </button>
          <button
            onClick={() => setEditingLesson(null)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setEditingLesson(null)}
        aria-label="Close edit resource modal"
      />
    </div>
  );
}

type LessonComposerModalProps = {
  open: boolean;
  composerSection: { id: number; name: string } | null;
  selectedCourse: Course;
  lessonInput: Record<
    number,
    { title: string; content: string; fileUrl: string }
  >;
  setLessonInput: (v: any) => void;
  resourceFile: File | null;
  setResourceFile: (f: File | null) => void;
  saveResourceToLesson: () => Promise<void> | void;
  isUploadingResource: boolean;
  setLessonComposerSectionId: (id: number | null) => void;
};

export function LessonComposerModal(props: LessonComposerModalProps) {
  const {
    open,
    composerSection,
    selectedCourse,
    lessonInput,
    setLessonInput,
    resourceFile,
    setResourceFile,
    saveResourceToLesson,
    isUploadingResource,
    setLessonComposerSectionId,
  } = props;
  if (!open || !composerSection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Add Resource</h3>
            <p className="text-xs text-slate-500">
              Block: {composerSection.name}
            </p>
          </div>
          <button
            onClick={() => setLessonComposerSectionId(null)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            Close
          </button>
        </div>
        {selectedCourse.sections.length >= 2 && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Select Block
            </label>
            <select
              value={composerSection.id}
              onChange={(e) => setLessonComposerSectionId(Number(e.target.value))}
              className="mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {selectedCourse.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </>
        )}
        <input
          value={lessonInput[selectedCourse.id]?.title || ""}
          onChange={(e) =>
            setLessonInput((x: any) => ({
              ...x,
              [selectedCourse.id]: {
                ...(x[selectedCourse.id] || {
                  title: "",
                  content: "",
                  fileUrl: "",
                }),
                title: e.target.value,
              },
            }))
          }
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Resource title"
        />
        <textarea
          value={lessonInput[selectedCourse.id]?.content || ""}
          onChange={(e) =>
            setLessonInput((x: any) => ({
              ...x,
              [selectedCourse.id]: {
                ...(x[selectedCourse.id] || {
                  title: "",
                  content: "",
                  fileUrl: "",
                }),
                content: e.target.value,
              },
            }))
          }
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Resource description"
        />
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Upload file to your Google Drive
        </label>
        <input
          type="file"
          onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {resourceFile && (
          <p className="mb-2 text-xs text-slate-500">
            Selected: {resourceFile.name} ({Math.ceil(resourceFile.size / 1024)}{" "}
            KB)
          </p>
        )}
        <div className="mb-3 text-xs text-slate-500">
          Optional: existing file URL if no upload is selected.
        </div>
        <input
          value={lessonInput[selectedCourse.id]?.fileUrl || ""}
          onChange={(e) =>
            setLessonInput((x: any) => ({
              ...x,
              [selectedCourse.id]: {
                ...(x[selectedCourse.id] || {
                  title: "",
                  content: "",
                  fileUrl: "",
                }),
                fileUrl: e.target.value,
              },
            }))
          }
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="https://drive.google.com/..."
        />
        <div className="flex gap-2">
          <button
            onClick={saveResourceToLesson}
            disabled={isUploadingResource}
            data-keep-action-text="true"
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploadingResource ? "Uploading..." : "Save Resource"}
          </button>
          <button
            onClick={() => {
              setLessonComposerSectionId(null);
              setResourceFile(null);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        className="absolute inset-0 -z-10"
        onClick={() => setLessonComposerSectionId(null)}
        aria-label="Close add resource modal"
      />
    </div>
  );
}
