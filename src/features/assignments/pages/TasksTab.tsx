import { useEffect, useState } from "react";
import type { Course, CourseTask, User } from "../../../types/lms";

type TasksTabProps = {
  kind: "ASSIGNMENT" | "ACTIVITY";
  selectedCourse: Course;
  user: User;
  api: any;
  headers: any;
  setMessage: (m: string) => void;
};

export function TasksTab({
  kind,
  selectedCourse,
  user,
  api,
  headers,
  setMessage,
}: TasksTabProps) {
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSectionId, setComposeSectionId] = useState<number>(
    selectedCourse.sections[0]?.id || 0,
  );
  const [composeMode, setComposeMode] = useState<"MANUAL" | "FILE">("MANUAL");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDescription, setComposeDescription] = useState("");
  const [composeDueAt, setComposeDueAt] = useState("");
  const [composeFile, setComposeFile] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<
    Record<number, { text: string; file: File | null; feedback: string }>
  >({});

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

  useEffect(() => {
    loadTasks();
    const timer = window.setInterval(loadTasks, 8000);
    return () => window.clearInterval(timer);
  }, [selectedCourse.id, kind]);

  async function createTask() {
    try {
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
          }),
        },
      );
      setComposeOpen(false);
      setComposeTitle("");
      setComposeDescription("");
      setComposeDueAt("");
      setComposeFile(null);
      await loadTasks();
      setMessage(
        `${kind === "ASSIGNMENT" ? "Assignment" : "Activity"} posted.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function submitTask(taskId: number) {
    const state = submitState[taskId] || { text: "", file: null, feedback: "" };
    try {
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
        body: JSON.stringify({
          answerText: state.text || undefined,
          fileUrl: fileUrl || undefined,
        }),
      });
      await loadTasks();
      setMessage("Submission saved.");
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

  return (
    <section className="space-y-3">
      {user.role === "INSTRUCTOR" && (
        <div className="flex justify-end">
          <button
            className="rounded bg-blue-700 px-3 py-2 text-xs text-white"
            onClick={() => setComposeOpen(true)}
          >
            New {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
          </button>
        </div>
      )}
      {tasks.map((task) => (
        <article
          key={task.id}
          className="rounded-md border border-slate-200 p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {task.title}
              </p>
              <p className="text-xs text-slate-500">
                {task.sectionName} ·{" "}
                {task.mode === "MANUAL" ? "Manual" : "File Upload"}
                {task.dueAt
                  ? ` · Due ${new Date(task.dueAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
          </div>
          {task.description && (
            <p className="mb-2 text-sm text-slate-700">{task.description}</p>
          )}
          {task.fileUrl && (
            <a
              className="mb-2 inline-block rounded border border-slate-300 px-2 py-1 text-xs"
              href={task.fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Attached File
            </a>
          )}
          {user.role === "STUDENT" && (
            <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
              <textarea
                value={
                  submitState[task.id]?.text ||
                  task.mySubmission?.answerText ||
                  ""
                }
                onChange={(e) =>
                  setSubmitState((prev) => ({
                    ...prev,
                    [task.id]: {
                      text: e.target.value,
                      file: prev[task.id]?.file || null,
                      feedback: prev[task.id]?.feedback || "",
                    },
                  }))
                }
                className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                rows={3}
                placeholder="Your answer"
              />
              <input
                type="file"
                className="mt-2 block text-xs"
                onChange={(e) =>
                  setSubmitState((prev) => ({
                    ...prev,
                    [task.id]: {
                      text: prev[task.id]?.text || "",
                      file: e.target.files?.[0] || null,
                      feedback: prev[task.id]?.feedback || "",
                    },
                  }))
                }
              />
              <button
                className="mt-2 rounded bg-slate-900 px-2 py-1 text-xs text-white"
                onClick={() => submitTask(task.id)}
              >
                Submit
              </button>
              {task.mySubmission?.grade !== undefined &&
                task.mySubmission?.grade !== null && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    Grade: {task.mySubmission.grade}
                  </p>
                )}
            </div>
          )}
          {user.role === "INSTRUCTOR" && (
            <div className="mt-2 space-y-2">
              {(task.submissions || []).map((submission) => (
                <div
                  key={submission.id}
                  className="rounded border border-slate-200 bg-slate-50 p-2"
                >
                  <p className="text-xs font-medium text-slate-800">
                    {submission.studentName || "Student"}
                  </p>
                  {submission.answerText && (
                    <p className="text-xs text-slate-700">
                      {submission.answerText}
                    </p>
                  )}
                  {submission.fileUrl && (
                    <a
                      className="text-xs text-blue-700 underline"
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Submission file
                    </a>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={submission.grade ?? ""}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                      id={`grade-${submission.id}`}
                    />
                    <input
                      type="text"
                      placeholder="Feedback"
                      defaultValue={submission.feedback || ""}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      id={`feedback-${submission.id}`}
                    />
                    <button
                      className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                      onClick={() => {
                        const gradeInput = document.getElementById(
                          `grade-${submission.id}`,
                        ) as HTMLInputElement | null;
                        const feedbackInput = document.getElementById(
                          `feedback-${submission.id}`,
                        ) as HTMLInputElement | null;
                        const grade = Number(gradeInput?.value || 0);
                        const feedback = feedbackInput?.value || "";
                        gradeSubmission(submission.id, grade, feedback);
                      }}
                    >
                      Grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
      {!tasks.length && (
        <p className="rounded border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
          No {kind === "ASSIGNMENT" ? "assignments" : "activities"} yet.
        </p>
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
    </section>
  );
}
