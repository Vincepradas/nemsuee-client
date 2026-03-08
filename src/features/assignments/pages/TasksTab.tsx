import { useEffect, useMemo, useState } from "react";
import type { Course, CourseTask, User } from "../../../shared/types/lms";

type TasksTabProps = {
  kind: "ASSIGNMENT" | "ACTIVITY";
  selectedCourse: Course;
  user: User;
  api: any;
  headers: any;
  setMessage: (m: string) => void;
};

type SubmissionFilter =
  | "ALL"
  | "SUBMITTED"
  | "MISSING"
  | "LATE"
  | "UNGRADED"
  | "GRADED";

export function TasksTab({
  kind,
  selectedCourse,
  user,
  api,
  headers,
  setMessage,
}: TasksTabProps) {
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [courseRoster, setCourseRoster] = useState<any[]>([]);
  const [submitState, setSubmitState] = useState<
    Record<number, { file: File | null }>
  >({});

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSectionId, setComposeSectionId] = useState<number>(
    selectedCourse.sections[0]?.id || 0,
  );
  const [composeMode, setComposeMode] = useState<"MANUAL" | "FILE">("MANUAL");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDescription, setComposeDescription] = useState("");
  const [composeDueAt, setComposeDueAt] = useState("");
  const [composeFile, setComposeFile] = useState<File | null>(null);
  const [composeAllowResubmit, setComposeAllowResubmit] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<"MANUAL" | "FILE">("MANUAL");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editAllowResubmit, setEditAllowResubmit] = useState(true);

  const [viewTaskId, setViewTaskId] = useState<number | null>(null);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionFilter>("ALL");
  const [submissionSort, setSubmissionSort] = useState<"NEWEST" | "OLDEST">(
    "NEWEST",
  );
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [studentTaskTab, setStudentTaskTab] = useState<
    "OPEN" | "DONE" | "MISSING"
  >("OPEN");

  const isInstructor = user.role === "INSTRUCTOR";
  const rosterStudentId = (row: any) =>
    Number(row?.student?.id ?? row?.id ?? 0);
  const rosterStudentName = (row: any) =>
    String(
      row?.student?.fullName ||
        row?.fullName ||
        `${row?.student?.firstName || ""} ${row?.student?.lastName || ""}`,
    ).trim() || "Student";

  async function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
      };
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(file);
    });
  }

  async function loadTasks() {
    try {
      const rows = await api(
        `/tasks/course/${selectedCourse.id}?kind=${encodeURIComponent(kind)}`,
        { headers },
      );
      setTasks(rows || []);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadRoster() {
    try {
      const rows = await api(`/courses/${selectedCourse.id}/students`, {
        headers,
      });
      setCourseRoster(rows || []);
    } catch {
      setCourseRoster([]);
    }
  }

  useEffect(() => {
    loadTasks();
    loadRoster();
  }, [selectedCourse.id, kind]);

  useEffect(() => {
    setComposeSectionId(selectedCourse.sections[0]?.id || 0);
  }, [selectedCourse.id]);

  async function createTask() {
    try {
      if (!selectedCourse.sections.length)
        return setMessage("No block available. Please create a block first.");
      if (!composeSectionId) return setMessage("Please select a block.");
      if (!composeTitle.trim()) return setMessage("Title is required.");
      if (composeMode === "FILE" && !composeFile)
        return setMessage("Please choose a file to upload.");

      let fileUrl = "";
      if (composeFile) {
        const base64 = await toBase64(composeFile);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: composeFile.name,
            contentBase64: base64,
            mimeType: composeFile.type || "application/octet-stream",
          }),
        });
        fileUrl = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await api(
        `/tasks/course/${selectedCourse.id}/sections/${composeSectionId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            kind,
            mode: composeMode,
            title: composeTitle,
            description: composeDescription,
            fileUrl: fileUrl || undefined,
            dueAt: composeDueAt || undefined,
            allowStudentResubmit: composeAllowResubmit,
          }),
        },
      );

      setComposeOpen(false);
      setComposeTitle("");
      setComposeDescription("");
      setComposeDueAt("");
      setComposeFile(null);
      setComposeMode("MANUAL");
      setComposeAllowResubmit(true);
      await loadTasks();
      setMessage(
        `${kind === "ASSIGNMENT" ? "Assignment" : "Activity"} posted.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  function openEditTask(task: CourseTask) {
    setEditTaskId(task.id);
    setEditMode(task.mode);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditDueAt(
      task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
    );
    setEditFile(null);
    setEditFileUrl(task.fileUrl || "");
    setEditAllowResubmit(Number(task.allowStudentResubmit ?? 1) === 1);
    setEditOpen(true);
  }

  async function updateTask() {
    if (!editTaskId) return;
    if (!editTitle.trim()) return setMessage("Title is required.");
    if (editMode === "FILE" && !editFile && !editFileUrl)
      return setMessage("Please upload a file or keep the existing file.");

    try {
      let nextFileUrl = editFileUrl || "";
      if (editFile) {
        const base64 = await toBase64(editFile);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: editFile.name,
            contentBase64: base64,
            mimeType: editFile.type || "application/octet-stream",
          }),
        });
        nextFileUrl = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await api(`/tasks/${editTaskId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription,
          dueAt: editDueAt || null,
          mode: editMode,
          fileUrl: editMode === "FILE" ? nextFileUrl || null : null,
          allowStudentResubmit: editAllowResubmit,
        }),
      });

      setEditOpen(false);
      setEditTaskId(null);
      await loadTasks();
      setMessage("Task updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteTask(taskId: number, title: string) {
    if (!confirm(`Delete "${title}"? This will remove submissions.`)) return;
    try {
      await api(`/tasks/${taskId}`, { method: "DELETE", headers });
      await loadTasks();
      setMessage("Task deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function submitTask(taskId: number) {
    const state = submitState[taskId] || { file: null };
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task?.dueAt && new Date(task.dueAt).getTime() < Date.now())
        return setMessage("Submission closed. Deadline has passed.");

      let fileUrl = "";
      if (state.file) {
        const base64 = await toBase64(state.file);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: state.file.name,
            contentBase64: base64,
            mimeType: state.file.type || "application/octet-stream",
          }),
        });
        fileUrl = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await api(`/tasks/${taskId}/submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fileUrl: fileUrl || undefined }),
      });
      await loadTasks();
      setMessage("Submission saved.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteMySubmission(taskId: number) {
    try {
      await api(`/tasks/${taskId}/submissions/me`, {
        method: "DELETE",
        headers,
      });
      await loadTasks();
      setMessage("Submission deleted. You can submit again.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function gradeSubmission(
    submissionId: number,
    grade: number,
    feedback: string,
  ) {
    try {
      await api(`/tasks/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ grade, feedback }),
      });
      await loadTasks();
      setMessage("Grade saved.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  const groupedTasks = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          const key = task.sectionName || "Unassigned block";
          if (!acc[key]) acc[key] = [];
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, CourseTask[]>,
      ),
    [tasks],
  );

  const summary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        const closed = Boolean(
          task.dueAt && new Date(task.dueAt).getTime() < Date.now(),
        );
        const subs = task.submissions || [];
        const blockStudents = courseRoster.filter((student) => {
          const studentBlock = String(
            student.section?.name || student.sectionName || "",
          ).toUpperCase();
          return studentBlock === String(task.sectionName || "").toUpperCase();
        });
        const latestByStudent = new Map<number, any>();
        for (const s of subs) {
          const sid = Number(s.studentId);
          const prev = latestByStudent.get(sid);
          if (
            !prev ||
            new Date(s.createdAt).getTime() > new Date(prev.createdAt).getTime()
          )
            latestByStudent.set(sid, s);
        }
        const ungraded = Array.from(latestByStudent.values()).filter(
          (s) => s.grade === null || s.grade === undefined,
        ).length;
        acc.total += 1;
        if (!closed) acc.active += 1;
        acc.pending += closed
          ? Math.max(0, blockStudents.length - latestByStudent.size)
          : 0;
        acc.ungraded += ungraded;
        return acc;
      },
      { total: 0, active: 0, pending: 0, ungraded: 0 },
    );
  }, [tasks, courseRoster]);

  const viewedTask = tasks.find((t) => t.id === viewTaskId) || null;
  const studentFilteredTasks = useMemo(() => {
    if (isInstructor) return tasks;
    return tasks.filter((task) => {
      const hasSubmission = Boolean(task.mySubmission);
      const isMissing = Boolean(
        !hasSubmission &&
        task.dueAt &&
        new Date(task.dueAt).getTime() < Date.now(),
      );
      if (studentTaskTab === "OPEN") return !hasSubmission && !isMissing;
      if (studentTaskTab === "DONE") return hasSubmission;
      return isMissing;
    });
  }, [tasks, isInstructor, studentTaskTab]);
  const studentGroupedTasks = useMemo(
    () =>
      studentFilteredTasks.reduce(
        (acc, task) => {
          const key = task.sectionName || "Unassigned block";
          if (!acc[key]) acc[key] = [];
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, CourseTask[]>,
      ),
    [studentFilteredTasks],
  );
  const viewedRows = useMemo(() => {
    if (!viewedTask) return [] as any[];
    const blockStudents = courseRoster.filter((student) => {
      const studentBlock = String(
        student.section?.name || student.sectionName || "",
      ).toUpperCase();
      return (
        studentBlock === String(viewedTask.sectionName || "").toUpperCase()
      );
    });

    return blockStudents
      .map((student) => {
        const latest = (viewedTask.submissions || [])
          .filter((s) => Number(s.studentId) === rosterStudentId(student))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0];
        const isLate = Boolean(
          latest &&
          viewedTask.dueAt &&
          new Date(latest.createdAt).getTime() >
            new Date(viewedTask.dueAt).getTime(),
        );
        const isClosed = Boolean(
          viewedTask.dueAt && new Date(viewedTask.dueAt).getTime() < Date.now(),
        );
        const status = latest
          ? latest.grade !== null && latest.grade !== undefined
            ? "GRADED"
            : "SUBMITTED"
          : isClosed
            ? "MISSING"
            : "NOT_SUBMITTED";
        return { student, latest, status, isLate };
      })
      .filter((row) => {
        const q = submissionSearch.trim().toLowerCase();
        const name = rosterStudentName(row.student).toLowerCase();
        const searchMatch = !q || name.includes(q);
        if (!searchMatch) return false;
        if (submissionStatus === "ALL") return true;
        if (submissionStatus === "SUBMITTED") return row.status === "SUBMITTED";
        if (submissionStatus === "MISSING") return row.status === "MISSING";
        if (submissionStatus === "LATE") return row.isLate;
        if (submissionStatus === "UNGRADED") return row.status === "SUBMITTED";
        if (submissionStatus === "GRADED") return row.status === "GRADED";
        return true;
      })
      .sort((a, b) => {
        const at = a.latest ? new Date(a.latest.createdAt).getTime() : 0;
        const bt = b.latest ? new Date(b.latest.createdAt).getTime() : 0;
        return submissionSort === "NEWEST" ? bt - at : at - bt;
      });
  }, [
    viewedTask,
    courseRoster,
    submissionSearch,
    submissionStatus,
    submissionSort,
  ]);

  function exportCsv() {
    if (!viewedTask) return;
    const rows = [
      "Student,Status,Submitted,Grade,Late",
      ...viewedRows.map((row) =>
        [
          `"${String(rosterStudentName(row.student))}"`,
          row.status,
          row.latest ? new Date(row.latest.createdAt).toLocaleString() : "",
          row.latest?.grade ?? "",
          row.isLate ? "Yes" : "No",
        ].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${viewedTask.title.replace(/\s+/g, "_")}_submissions.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-3">
      {isInstructor && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">
            <p className="text-xs text-slate-500">Total Assignments</p>
            <p className="font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">
            <p className="text-xs text-slate-500">Active Assignments</p>
            <p className="font-semibold text-slate-900">{summary.active}</p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">
            <p className="text-xs text-slate-500">Pending Submissions</p>
            <p className="font-semibold text-slate-900">{summary.pending}</p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">
            <p className="text-xs text-slate-500">Ungraded Submissions</p>
            <p className="font-semibold text-slate-900">{summary.ungraded}</p>
          </div>
        </div>
      )}

      {isInstructor && (
        <div className="flex justify-end">
          <button
            disabled={!selectedCourse.sections.length}
            className="rounded bg-blue-700 px-3 py-2 text-xs text-white"
            onClick={() => setComposeOpen(true)}
          >
            New {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
          </button>
        </div>
      )}

      {isInstructor &&
        Object.entries(groupedTasks).map(([blockName, blockTasks]) => {
          const blockOpen = openBlocks[blockName] ?? true;
          return (
            <section key={blockName} className="space-y-2">
              <button
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700"
                onClick={() =>
                  setOpenBlocks((prev) => ({
                    ...prev,
                    [blockName]: !blockOpen,
                  }))
                }
              >
                <span>{blockName}</span>
                <span>{blockTasks.length}</span>
              </button>
              {blockOpen && (
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Assignment</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Due Date</th>
                        <th className="px-3 py-2 font-medium">Submissions</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockTasks.map((task) => {
                        const blockStudents = courseRoster.filter((student) => {
                          const studentBlock = String(
                            student.section?.name || student.sectionName || "",
                          ).toUpperCase();
                          return (
                            studentBlock ===
                            String(task.sectionName || "").toUpperCase()
                          );
                        });
                        const latestByStudent = new Map<number, any>();
                        for (const s of task.submissions || []) {
                          const sid = Number(s.studentId);
                          const prev = latestByStudent.get(sid);
                          if (
                            !prev ||
                            new Date(s.createdAt).getTime() >
                              new Date(prev.createdAt).getTime()
                          )
                            latestByStudent.set(sid, s);
                        }
                        const submitted = latestByStudent.size;
                        const isClosed = Boolean(
                          task.dueAt &&
                          new Date(task.dueAt).getTime() < Date.now(),
                        );
                        return (
                          <tr
                            key={task.id}
                            className="border-t border-slate-100"
                          >
                            <td className="px-3 py-2 text-sm font-medium text-slate-900">
                              {task.title}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {task.mode === "MANUAL"
                                ? "Manual"
                                : "File Upload"}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {task.dueAt
                                ? new Date(task.dueAt).toLocaleString()
                                : "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {submitted} / {blockStudents.length}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  isClosed
                                    ? "rounded bg-slate-200 px-2 py-1 text-[11px] text-slate-700"
                                    : "rounded bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700"
                                }
                              >
                                {isClosed ? "Closed" : "Active"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                <button
                                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                                  onClick={() => setViewTaskId(task.id)}
                                >
                                  View Submissions
                                </button>
                                <button
                                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                                  onClick={() => openEditTask(task)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                                  onClick={() =>
                                    deleteTask(task.id, task.title)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}

      {!isInstructor && (
        <div className="flex gap-2">
          <button
            className={`rounded px-3 py-1.5 text-xs ${studentTaskTab === "OPEN" ? "bg-blue-700 text-white" : "border border-slate-300 text-slate-700"}`}
            onClick={() => setStudentTaskTab("OPEN")}
          >
            Open
          </button>
          <button
            className={`rounded px-3 py-1.5 text-xs ${studentTaskTab === "DONE" ? "bg-blue-700 text-white" : "border border-slate-300 text-slate-700"}`}
            onClick={() => setStudentTaskTab("DONE")}
          >
            Done
          </button>
          <button
            className={`rounded px-3 py-1.5 text-xs ${studentTaskTab === "MISSING" ? "bg-blue-700 text-white" : "border border-slate-300 text-slate-700"}`}
            onClick={() => setStudentTaskTab("MISSING")}
          >
            Missing
          </button>
        </div>
      )}

      {!isInstructor &&
        Object.entries(studentGroupedTasks).map(([blockName, blockTasks]) => (
          <section key={blockName} className="space-y-2">
            <h4 className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {blockName}
            </h4>
            {blockTasks.map((task) => {
              const isClosedByDeadline = Boolean(
                task.dueAt && new Date(task.dueAt).getTime() < Date.now(),
              );
              const allowResubmit =
                Number(task.allowStudentResubmit ?? 1) === 1;
              const isGraded = Boolean(
                task.mySubmission &&
                  task.mySubmission.grade !== null &&
                  task.mySubmission.grade !== undefined,
              );
              const canSubmit =
                !isClosedByDeadline &&
                !isGraded &&
                (!task.mySubmission || allowResubmit);
              return (
                <article
                  key={task.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {task.mode === "MANUAL" ? "Manual" : "File Upload"}
                    {task.dueAt
                      ? ` · Due ${new Date(task.dueAt).toLocaleString()}`
                      : ""}
                    {isClosedByDeadline ? " · Closed" : ""}
                  </p>
                  {!allowResubmit && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Resubmission disabled by instructor.
                    </p>
                  )}
                  {isGraded && (
                    <p className="mt-1 text-[11px] font-medium text-emerald-700">
                      Graded: {Number(task.mySubmission?.grade || 0).toFixed(2)}
                    </p>
                  )}
                  {task.description && (
                    <p className="mt-2 text-sm text-slate-700">
                      {task.description}
                    </p>
                  )}
                  {task.fileUrl && (
                    <a
                      className="mt-2 inline-block rounded border border-slate-300 px-2 py-1 text-xs"
                      href={task.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Attached File
                    </a>
                  )}
                  <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
                    {isClosedByDeadline && !task.mySubmission && (
                      <p className="mb-2 text-xs font-medium text-rose-700">
                        Submission closed due to deadline. Marked as missing.
                      </p>
                    )}
                    <p className="mt-2 text-[11px] font-medium text-slate-600">
                      Upload file
                    </p>
                    <input
                      type="file"
                      disabled={!canSubmit}
                      className="mt-2 block text-xs disabled:opacity-60"
                      onChange={(e) =>
                        setSubmitState((prev) => ({
                          ...prev,
                          [task.id]: { file: e.target.files?.[0] || null },
                        }))
                      }
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        data-keep-action-text="true"
                        disabled={!canSubmit}
                        className="rounded bg-slate-900 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                        onClick={() => submitTask(task.id)}
                      >
                        Submit
                      </button>
                      {task.mySubmission &&
                        allowResubmit &&
                        !isGraded &&
                        !isClosedByDeadline && (
                          <button
                            data-keep-action-text="true"
                            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                            onClick={() => deleteMySubmission(task.id)}
                          >
                            Delete submission
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

      {((isInstructor && !tasks.length) ||
        (!isInstructor && !studentFilteredTasks.length)) && (
        <p className="rounded border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
          {isInstructor
            ? `No ${kind === "ASSIGNMENT" ? "assignments" : "activities"} yet.`
            : studentTaskTab === "OPEN"
              ? "No open tasks."
              : studentTaskTab === "DONE"
                ? "No completed tasks."
                : "No missing tasks."}
        </p>
      )}

      {isInstructor && viewedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-5xl rounded-md bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {viewedTask.title}
                </p>
                <p className="text-xs text-slate-500">
                  {viewedTask.sectionName} ·{" "}
                  {viewedTask.dueAt
                    ? `Due ${new Date(viewedTask.dueAt).toLocaleString()}`
                    : "No due date"}
                </p>
              </div>
              <button
                className="rounded border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setViewTaskId(null)}
              >
                Close
              </button>
            </div>
            <div className="mb-3 grid gap-2 md:grid-cols-4">
              <input
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-xs"
                placeholder="Search student"
              />
              <select
                value={submissionStatus}
                onChange={(e) =>
                  setSubmissionStatus(e.target.value as SubmissionFilter)
                }
                className="rounded border border-slate-300 px-2 py-2 text-xs"
              >
                <option value="ALL">All statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="MISSING">Missing</option>
                <option value="LATE">Late</option>
                <option value="UNGRADED">Ungraded</option>
                <option value="GRADED">Graded</option>
              </select>
              <select
                value={submissionSort}
                onChange={(e) =>
                  setSubmissionSort(e.target.value as "NEWEST" | "OLDEST")
                }
                className="rounded border border-slate-300 px-2 py-2 text-xs"
              >
                <option value="NEWEST">Newest</option>
                <option value="OLDEST">Oldest</option>
              </select>
              <button
                className="rounded border border-slate-300 px-2 py-2 text-xs"
                onClick={exportCsv}
              >
                Export Grades (CSV)
              </button>
            </div>
            <div className="max-h-[55vh] overflow-auto rounded border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 font-medium">Student</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Submitted</th>
                    <th className="px-2 py-2 font-medium">Grade</th>
                    <th className="px-2 py-2 font-medium">File</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {viewedRows.map((row) => (
                    <tr
                      key={row.student.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-2 py-2 text-slate-900">
                        {rosterStudentName(row.student)}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {row.status === "NOT_SUBMITTED"
                          ? "Not submitted"
                          : row.status}
                        {row.isLate ? " · Late" : ""}
                      </td>
                      <td className="px-2 py-2 text-slate-600">
                        {row.latest
                          ? new Date(row.latest.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {row.latest?.grade ?? "-"}
                      </td>
                      <td className="px-2 py-2">
                        {row.latest?.fileUrl ? (
                          <a
                            className="text-blue-700 underline"
                            href={row.latest.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {row.latest ? (
                          <button
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            onClick={() => {
                              const gradeText = prompt(
                                "Enter grade",
                                String(row.latest?.grade ?? ""),
                              );
                              if (gradeText === null) return;
                              const feedback =
                                prompt(
                                  "Feedback (optional)",
                                  String(row.latest?.feedback ?? ""),
                                ) || "";
                              const parsed = Number(gradeText);
                              if (Number.isNaN(parsed))
                                return setMessage("Invalid grade");
                              gradeSubmission(row.latest.id, parsed, feedback);
                            }}
                          >
                            Grade
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-md bg-white p-4 shadow-lg">
            <p className="mb-2 text-sm font-semibold">
              New {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
            </p>
            <div className="grid gap-2">
              <select
                value={composeSectionId}
                onChange={(e) => setComposeSectionId(Number(e.target.value))}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              >
                {selectedCourse.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={composeMode}
                onChange={(e) =>
                  setComposeMode(e.target.value as "MANUAL" | "FILE")
                }
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="MANUAL">Manual</option>
                <option value="FILE">File Upload</option>
              </select>
              <input
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
                placeholder="Title"
              />
              <textarea
                value={composeDescription}
                onChange={(e) => setComposeDescription(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
                rows={3}
                placeholder="Instructions"
              />
              <input
                type="datetime-local"
                value={composeDueAt}
                onChange={(e) => setComposeDueAt(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={composeAllowResubmit}
                  onChange={(e) => setComposeAllowResubmit(e.target.checked)}
                />
                Allow students to edit/resubmit
              </label>
              {composeMode === "FILE" && (
                <input
                  type="file"
                  onChange={(e) => setComposeFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded bg-blue-700 px-3 py-2 text-xs text-white"
                onClick={createTask}
              >
                Create
              </button>
              <button
                className="rounded border border-slate-300 px-3 py-2 text-xs"
                onClick={() => setComposeOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-md bg-white p-4 shadow-lg">
            <p className="mb-2 text-sm font-semibold">
              Edit {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
            </p>
            <div className="grid gap-2">
              <select
                value={editMode}
                onChange={(e) =>
                  setEditMode(e.target.value as "MANUAL" | "FILE")
                }
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="MANUAL">Manual</option>
                <option value="FILE">File Upload</option>
              </select>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
                placeholder="Title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
                rows={3}
                placeholder="Instructions"
              />
              <input
                type="datetime-local"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={editAllowResubmit}
                  onChange={(e) => setEditAllowResubmit(e.target.checked)}
                />
                Allow students to edit/resubmit
              </label>
              {editMode === "FILE" && (
                <div className="space-y-1">
                  {editFileUrl && (
                    <p className="text-xs text-slate-500">
                      Current file attached
                    </p>
                  )}
                  <input
                    type="file"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  {editFileUrl && (
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      onClick={() => setEditFileUrl("")}
                    >
                      Remove current file
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded bg-blue-700 px-3 py-2 text-xs text-white"
                onClick={updateTask}
              >
                Save
              </button>
              <button
                className="rounded border border-slate-300 px-3 py-2 text-xs"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
