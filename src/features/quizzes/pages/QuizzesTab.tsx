import { useEffect, useState } from "react";
import type { Attempt, Course, User } from "../../../types/lms";

type QuizzesTabProps = {
  selectedCourse: Course;
  attempts: Attempt[];
  user: User;
  api: any;
  headers: any;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  updateQuiz: (
    quizId: number,
    questions: any[],
    quizType?: "MULTIPLE_CHOICE" | "TRUE_FALSE",
  ) => Promise<void>;
  deleteQuiz: (quizId: number) => Promise<void>;
  setActiveCourseTab: (
    tab: "content" | "quizzes" | "assignments" | "activities" | "scores",
  ) => void;
};

type QuizType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "IDENTIFICATION";
type DraftQuestion = {
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
};

export function QuizzesTab({
  selectedCourse,
  attempts,
  user,
  api,
  headers,
  refreshCore,
  setMessage,
  setActiveCourseTab,
}: QuizzesTabProps) {
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [createLessonId, setCreateLessonId] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState<"MANUAL" | "URL">("MANUAL");
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [quizTitle, setQuizTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      prompt: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
    },
  ]);
  const isTrueFalse = quizType === "TRUE_FALSE";
  const [takeQuiz, setTakeQuiz] = useState<any | null>(null);
  const [takeAnswers, setTakeAnswers] = useState<Record<number, string>>({});
  const [takeRemainingSeconds, setTakeRemainingSeconds] = useState<
    number | null
  >(null);
  const [takeExpiresAt, setTakeExpiresAt] = useState<number | null>(null);
  const [submittingTakeQuiz, setSubmittingTakeQuiz] = useState(false);
  const [settingsQuiz, setSettingsQuiz] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await api(`/quizzes/course/${selectedCourse.id}`, {
          headers,
        });
        setCourseQuizzes(rows || []);
      } catch {}
    })();
  }, [selectedCourse.id]);

  function resetComposer() {
    setCreateLessonId(null);
    setQuizMode("MANUAL");
    setQuizType("MULTIPLE_CHOICE");
    setQuizTitle("");
    setExternalUrl("");
    setDraftQuestions([
      {
        prompt: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
      },
    ]);
  }

  function getTakeQuizStorageKey(quizId: number) {
    return `quiz-progress:${user.id}:${quizId}`;
  }

  function formatSeconds(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function getStudentQuizAttemptsCount(quizId: number) {
    return attempts.filter((a: any) => {
      const directId = Number(a?.quiz?.id || 0);
      const nestedId = Number((a as any)?.quizId || 0);
      return directId === Number(quizId) || nestedId === Number(quizId);
    }).length;
  }

  function getQuizAccessBlockReason(quiz: any): string | null {
    if (user.role !== "STUDENT") return null;
    if (!quiz?.isOpen) return "Quiz is closed";
    if (
      quiz.mode === "MANUAL" &&
      (!Array.isArray(quiz.questions) || quiz.questions.length === 0)
    ) {
      return "Quiz has no questions yet";
    }
    if (quiz.mode === "URL" && !quiz.externalUrl) {
      return "Quiz link is unavailable";
    }
    const attemptsCount = getStudentQuizAttemptsCount(quiz.id);
    if (quiz.maxAttempts && attemptsCount >= Number(quiz.maxAttempts)) {
      return "Max attempts reached";
    }
    if (quiz.timeLimitMinutes) {
      try {
        const raw = localStorage.getItem(
          getTakeQuizStorageKey(Number(quiz.id)),
        );
        if (raw) {
          const parsed = JSON.parse(raw);
          const savedExpiry = Number(parsed?.expiresAt || 0);
          if (savedExpiry && savedExpiry <= Date.now()) {
            return "Time limit exceeded";
          }
        }
      } catch {}
    }
    return null;
  }

  async function submitTakeQuiz(isAuto = false) {
    if (!takeQuiz || submittingTakeQuiz) return;
    try {
      setSubmittingTakeQuiz(true);
      const answers = (takeQuiz.questions || []).map((q: any) => ({
        questionId: q.id,
        answer: takeAnswers[q.id] || "",
      }));
      const result = await api(`/quizzes/${takeQuiz.id}/submit-v2`, {
        method: "POST",
        headers,
        body: JSON.stringify({ answers }),
      });
      localStorage.removeItem(getTakeQuizStorageKey(Number(takeQuiz.id)));
      await refreshCore();
      setTakeQuiz(null);
      setTakeAnswers({});
      setTakeRemainingSeconds(null);
      setTakeExpiresAt(null);
      setMessage(
        result?.score !== undefined
          ? `${isAuto ? "Time is up. " : ""}Submitted. Score: ${result.score}/${result.total}`
          : `${isAuto ? "Time is up. " : ""}Submitted.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSubmittingTakeQuiz(false);
    }
  }

  useEffect(() => {
    if (!takeQuiz) return;
    const quizId = Number(takeQuiz.id);
    const key = getTakeQuizStorageKey(quizId);
    let savedAnswers: Record<number, string> = {};
    let savedExpiresAt: number | null = null;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers && typeof parsed.answers === "object") {
          savedAnswers = parsed.answers;
        }
        if (typeof parsed?.expiresAt === "number") {
          savedExpiresAt = parsed.expiresAt;
        }
      }
    } catch {}

    setTakeAnswers(savedAnswers);

    if (takeQuiz.timeLimitMinutes) {
      const durationMs = Number(takeQuiz.timeLimitMinutes) * 60 * 1000;
      const expiresAt =
        savedExpiresAt && savedExpiresAt > Date.now()
          ? savedExpiresAt
          : Date.now() + durationMs;
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTakeExpiresAt(expiresAt);
      setTakeRemainingSeconds(remaining);
    } else {
      setTakeExpiresAt(null);
      setTakeRemainingSeconds(null);
    }
  }, [takeQuiz]);

  useEffect(() => {
    if (!takeQuiz || takeRemainingSeconds === null || takeRemainingSeconds <= 0)
      return;
    const timer = window.setInterval(() => {
      setTakeRemainingSeconds((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [takeQuiz, takeRemainingSeconds]);

  useEffect(() => {
    if (!takeQuiz) return;
    const key = getTakeQuizStorageKey(Number(takeQuiz.id));
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          answers: takeAnswers,
          expiresAt: takeExpiresAt,
          updatedAt: Date.now(),
        }),
      );
    } catch {}
  }, [takeQuiz, takeAnswers, takeExpiresAt]);

  useEffect(() => {
    if (!takeQuiz || takeRemainingSeconds !== 0) return;
    submitTakeQuiz(true);
  }, [takeQuiz, takeRemainingSeconds]);

  async function submitManualQuiz(lessonId: number) {
    if (quizMode === "URL" && !externalUrl.trim()) {
      setMessage("Please provide the Google Form URL.");
      return;
    }
    const normalized = draftQuestions.map((q) => ({
      prompt: q.prompt.trim(),
      optionA:
        quizType === "IDENTIFICATION"
          ? q.optionA.trim()
          : isTrueFalse
            ? "True"
            : q.optionA.trim(),
      optionB: isTrueFalse ? "False" : q.optionB.trim(),
      optionC:
        isTrueFalse || quizType === "IDENTIFICATION" ? "" : q.optionC.trim(),
      optionD:
        isTrueFalse || quizType === "IDENTIFICATION" ? "" : q.optionD.trim(),
      correctAnswer:
        quizType === "IDENTIFICATION"
          ? q.optionA.trim()
          : isTrueFalse
            ? q.correctOption === "B"
              ? "B"
              : "A"
            : q.correctOption,
    }));

    if (
      quizMode === "MANUAL" &&
      !normalized.every((q) => q.prompt.length >= 2)
    ) {
      setMessage("Every question must include a prompt.");
      return;
    }
    if (
      quizMode === "MANUAL" &&
      !isTrueFalse &&
      quizType !== "IDENTIFICATION" &&
      !normalized.every(
        (q) =>
          q.optionA.length > 0 &&
          q.optionB.length > 0 &&
          q.optionC.length > 0 &&
          q.optionD.length > 0,
      )
    ) {
      setMessage("Please fill all options for multiple-choice questions.");
      return;
    }

    try {
      await api(`/quizzes/lessons/${lessonId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: quizTitle || "Quiz",
          mode: quizMode,
          quizType: quizMode === "MANUAL" ? quizType : undefined,
          externalUrl: quizMode === "URL" ? externalUrl : undefined,
          questions: quizMode === "MANUAL" ? normalized : [],
        }),
      });
      await refreshCore();
      setMessage("Quiz created.");
      resetComposer();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      {selectedCourse.sections.map((section) => (
        <section
          key={section.id}
          className="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">
              {section.name}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {section.lessons.map((lesson) => {
              const lessonQuizzes = courseQuizzes.filter(
                (q: any) => Number(q.lessonId) === lesson.id,
              );
              const attemptsForLesson = attempts.filter(
                (a) => a.quiz.lesson.title === lesson.title,
              );
              const hasQuiz = lessonQuizzes.length > 0;
              const hasFileQuiz = Boolean(lesson.fileUrl);
              const studentFileLockedByOpenQuiz =
                user.role === "STUDENT" &&
                lessonQuizzes.some((q: any) => Boolean(q.isOpen));
              const statusLabel = hasQuiz
                ? "Quiz Ready"
                : hasFileQuiz
                  ? "File Quiz Available"
                  : user.role === "STUDENT"
                    ? "Quiz Not Available"
                    : "No Quiz Yet";

              return (
                <article
                  key={lesson.id}
                  className="flex items-start justify-between gap-3 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      Q {lesson.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded px-2 py-0.5 ${statusLabel === "Quiz Ready" ? "bg-emerald-100 text-emerald-700" : statusLabel === "File Quiz Available" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {statusLabel}
                      </span>
                      {hasQuiz && (
                        <span className="text-slate-500">
                          {lessonQuizzes.reduce(
                            (n: number, q: any) =>
                              n + (q.questions?.length || 0),
                            0,
                          )}{" "}
                          questions
                        </span>
                      )}
                      {user.role === "INSTRUCTOR" && hasQuiz && (
                        <span className="text-slate-500">
                          {attemptsForLesson.length} submissions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {user.role === "INSTRUCTOR" && !hasQuiz && (
                      <>
                        <button
                          onClick={() => {
                            setCreateLessonId(lesson.id);
                            setQuizMode("MANUAL");
                            setQuizType("MULTIPLE_CHOICE");
                            setDraftQuestions([
                              {
                                prompt: "",
                                optionA: "",
                                optionB: "",
                                optionC: "",
                                optionD: "",
                                correctOption: "A",
                              },
                            ]);
                          }}
                          className="rounded bg-blue-700 p-1.5 text-white"
                          title="Create quiz"
                          aria-label="Create quiz"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            setMessage(
                              "Upload Quiz File: use Add Lesson and provide a file URL.",
                            )
                          }
                          className="rounded border border-slate-300 p-1.5 hover:bg-slate-50"
                          title="Upload quiz file"
                          aria-label="Upload quiz file"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 16V4" />
                            <path d="M7 9l5-5 5 5" />
                            <path d="M4 20h16" />
                          </svg>
                        </button>
                      </>
                    )}
                    {hasFileQuiz &&
                      (studentFileLockedByOpenQuiz ? (
                        <button
                          className="cursor-not-allowed rounded border border-slate-200 bg-slate-100 p-1.5 text-slate-400"
                          title="Resource file is locked while quiz is open"
                          aria-label="Resource file locked while quiz is open"
                          disabled
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 3h7v7" />
                            <path d="M10 14L21 3" />
                            <path d="M21 14v7h-7" />
                            <path d="M3 10V3h7" />
                            <path d="M3 21l7-7" />
                          </svg>
                        </button>
                      ) : (
                        <a
                          className="rounded border border-slate-300 p-1.5 hover:bg-slate-50"
                          href={lesson.fileUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          title="Open quiz file"
                          aria-label="Open quiz file"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 3h7v7" />
                            <path d="M10 14L21 3" />
                            <path d="M21 14v7h-7" />
                            <path d="M3 10V3h7" />
                            <path d="M3 21l7-7" />
                          </svg>
                        </a>
                      ))}
                  </div>
                  {hasQuiz && (
                    <div className="mt-3 w-full space-y-2">
                      {lessonQuizzes.map((quiz: any) => {
                        const myAttempt = attempts.find(
                          (a: any) => Number(a.quiz?.id) === Number(quiz.id),
                        );
                        const latestAttempt = [...attempts]
                          .filter(
                            (a: any) =>
                              Number(
                                (a as any)?.quiz?.id || (a as any)?.quizId || 0,
                              ) === Number(quiz.id),
                          )
                          .sort(
                            (a: any, b: any) =>
                              new Date((b as any)?.createdAt || 0).getTime() -
                              new Date((a as any)?.createdAt || 0).getTime(),
                          )[0];
                        const latestPct =
                          latestAttempt && Number(latestAttempt.total) > 0
                            ? (Number(latestAttempt.score) * 100) /
                              Number(latestAttempt.total)
                            : null;
                        const passThreshold = Number(
                          quiz.passingPercentage || 60,
                        );
                        const attemptToneClass =
                          user.role === "STUDENT" && latestPct !== null
                            ? latestPct >= passThreshold
                              ? "border-emerald-400 bg-emerald-50"
                              : "border-rose-400 bg-rose-50"
                            : "border-slate-200 bg-slate-50";
                        const blockReason = getQuizAccessBlockReason(quiz);
                        const maxAttemptsReached = Boolean(
                          quiz.maxAttempts &&
                          getStudentQuizAttemptsCount(quiz.id) >=
                            Number(quiz.maxAttempts),
                        );
                        const isClosedByInstructor = !Boolean(quiz.isOpen);
                        const isBlocked =
                          user.role === "STUDENT" &&
                          (isClosedByInstructor ||
                            maxAttemptsReached ||
                            Boolean(blockReason));
                        return (
                          <div
                            key={quiz.id}
                            className={`flex items-center justify-between gap-2 rounded-md border px-2 py-2 ${attemptToneClass}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-900">
                                {quiz.title || "Quiz"}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {(quiz.questions || []).length} questions
                                {quiz.timeLimitMinutes
                                  ? ` · ${quiz.timeLimitMinutes} min`
                                  : ""}
                                {quiz.maxAttempts
                                  ? ` · max ${quiz.maxAttempts} attempts`
                                  : ""}
                                {user.role === "STUDENT" && blockReason
                                  ? ` · ${blockReason}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {user.role === "INSTRUCTOR" ? (
                                <>
                                  <button
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          `Delete quiz "${quiz.title || "Quiz"}"?`,
                                        )
                                      )
                                        return;
                                      await api(`/quizzes/${quiz.id}`, {
                                        method: "DELETE",
                                        headers,
                                      });
                                      const rows = await api(
                                        `/quizzes/course/${selectedCourse.id}`,
                                        { headers },
                                      );
                                      setCourseQuizzes(rows || []);
                                    }}
                                    className="rounded border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50"
                                    title="Delete quiz"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M19 6l-1 14H6L5 6" />
                                      <path d="M10 11v6M14 11v6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setActiveCourseTab("scores")}
                                    className="rounded border border-slate-300 p-1.5 hover:bg-white"
                                    title="View results"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M4 19h16" />
                                      <path d="M7 16V9" />
                                      <path d="M12 16V5" />
                                      <path d="M17 16v-3" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await api(
                                        `/quizzes/${quiz.id}/settings`,
                                        {
                                          method: "PATCH",
                                          headers,
                                          body: JSON.stringify({
                                            isOpen: !Boolean(quiz.isOpen),
                                          }),
                                        },
                                      );
                                      const rows = await api(
                                        `/quizzes/course/${selectedCourse.id}`,
                                        { headers },
                                      );
                                      setCourseQuizzes(rows || []);
                                    }}
                                    className="rounded border border-slate-300 p-1.5 hover:bg-white"
                                    title={
                                      quiz.isOpen ? "Close quiz" : "Open quiz"
                                    }
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      {quiz.isOpen ? (
                                        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
                                      ) : (
                                        <path d="M3 3l18 18M10.7 5.1A10.5 10.5 0 0 1 12 5c5.5 0 9 6 9 6a16.8 16.8 0 0 1-3 3.8M6.6 6.6A16.9 16.9 0 0 0 3 12s3.5 6 9 6a10.6 10.6 0 0 0 4.2-.8M9.9 9.9a3 3 0 1 0 4.2 4.2" />
                                      )}
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setSettingsQuiz(quiz)}
                                    className="rounded border border-slate-300 p-1.5 hover:bg-white"
                                    title="Quiz settings"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <circle cx="12" cy="12" r="3" />
                                      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={async () => {
                                    if (isClosedByInstructor) {
                                      setMessage(
                                        "Quiz is closed by instructor.",
                                      );
                                      return;
                                    }
                                    if (maxAttemptsReached) {
                                      setMessage("Max attempts reached.");
                                      return;
                                    }
                                    if (isBlocked) {
                                      setMessage(
                                        blockReason || "Quiz is not available.",
                                      );
                                      return;
                                    }
                                    try {
                                      if (
                                        quiz.mode === "URL" &&
                                        quiz.externalUrl
                                      ) {
                                        window.open(
                                          quiz.externalUrl,
                                          "_blank",
                                          "noopener,noreferrer",
                                        );
                                        return;
                                      }
                                      setTakeQuiz(quiz);
                                      await refreshCore();
                                    } catch (e) {
                                      setMessage((e as Error).message);
                                    }
                                  }}
                                  className={`rounded p-1.5 ${isBlocked ? "cursor-not-allowed bg-slate-300 text-slate-500" : "bg-slate-900 text-white"}`}
                                  title={
                                    isBlocked
                                      ? blockReason || "Unavailable"
                                      : myAttempt
                                        ? "Retake quiz"
                                        : "Start quiz"
                                  }
                                  disabled={isBlocked}
                                  aria-disabled={isBlocked}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
            {!section.lessons.length && (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                No lessons in this block yet.
              </p>
            )}
          </div>
        </section>
      ))}
      {!selectedCourse.sections.some((s) => s.lessons.length) && (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
          No quizzes available yet.
        </p>
      )}
      {createLessonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Manual Quiz Creation
              </p>
              <button
                className="rounded border border-slate-300 px-2 py-1 text-xs"
                onClick={resetComposer}
              >
                Close
              </button>
            </div>
            <div className="mb-3 grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
              <label className="text-xs font-medium text-slate-600">
                Quiz Setup
              </label>
              <div className="grid gap-2">
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Quiz title"
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={quizMode}
                  onChange={(e) =>
                    setQuizMode(e.target.value as "MANUAL" | "URL")
                  }
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="URL">Google Form URL</option>
                </select>
                {quizMode === "URL" ? (
                  <input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://forms.google.com/..."
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                ) : (
                  <select
                    value={quizType}
                    onChange={(e) => {
                      const nextType = e.target.value as QuizType;
                      setQuizType(nextType);
                      setDraftQuestions((prev) =>
                        prev.map((q) => ({
                          ...q,
                          correctOption:
                            nextType === "TRUE_FALSE" &&
                            (q.correctOption === "C" || q.correctOption === "D")
                              ? "A"
                              : q.correctOption,
                        })),
                      );
                    }}
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="IDENTIFICATION">Identification</option>
                  </select>
                )}
              </div>
            </div>
            {quizMode === "MANUAL" && (
              <div className="max-h-[50vh] space-y-3 overflow-auto pr-1">
                {draftQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded border border-slate-200 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">
                        Question {idx + 1}
                      </p>
                      <button
                        onClick={() =>
                          setDraftQuestions((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="rounded border border-rose-300 px-2 py-0.5 text-[11px] text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={q.prompt}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, prompt: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Question prompt"
                      className="mb-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    {quizType === "IDENTIFICATION" ? (
                      <input
                        value={q.optionA}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, optionA: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Correct answer"
                        className="rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    ) : isTrueFalse ? (
                      <p className="mb-2 text-xs text-slate-600">
                        Options are fixed: A=True, B=False
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <input
                            key={opt}
                            value={
                              q[
                                `option${opt}` as
                                  | "optionA"
                                  | "optionB"
                                  | "optionC"
                                  | "optionD"
                              ]
                            }
                            onChange={(e) =>
                              setDraftQuestions((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        [`option${opt}`]: e.target.value,
                                      }
                                    : x,
                                ),
                              )
                            }
                            placeholder={`Option ${opt}`}
                            className="rounded border border-slate-300 px-3 py-2 text-sm"
                          />
                        ))}
                      </div>
                    )}
                    <select
                      value={q.correctOption}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  correctOption: e.target.value as
                                    | "A"
                                    | "B"
                                    | "C"
                                    | "D",
                                }
                              : x,
                          ),
                        )
                      }
                      className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="A">Correct: A</option>
                      <option value="B">Correct: B</option>
                      {quizType === "MULTIPLE_CHOICE" && (
                        <option value="C">Correct: C</option>
                      )}
                      {quizType === "MULTIPLE_CHOICE" && (
                        <option value="D">Correct: D</option>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                className="rounded border border-slate-300 p-2"
                onClick={() =>
                  setDraftQuestions((prev) => [
                    ...prev,
                    {
                      prompt: "",
                      optionA: "",
                      optionB: "",
                      optionC: "",
                      optionD: "",
                      correctOption: "A",
                    },
                  ])
                }
                title="Add question"
                aria-label="Add question"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                className="rounded bg-blue-700 p-2 text-white"
                onClick={() => submitManualQuiz(createLessonId)}
                title="Save quiz"
                aria-label="Save quiz"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 4h12l2 2v14H5z" />
                  <path d="M8 4v6h8V4" />
                  <path d="M9 19h6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {takeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{takeQuiz.title}</p>
                {takeQuiz.timeLimitMinutes ? (
                  <p className="text-xs text-slate-500">
                    Time limit: {takeQuiz.timeLimitMinutes} minutes
                  </p>
                ) : null}
                {takeQuiz.timeLimitMinutes ? (
                  <p
                    className={`text-xs font-semibold ${takeRemainingSeconds !== null && takeRemainingSeconds <= 60 ? "text-rose-600" : "text-slate-700"}`}
                  >
                    Time left:{" "}
                    {takeRemainingSeconds !== null
                      ? formatSeconds(takeRemainingSeconds)
                      : "00:00"}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-700">
                    No time limit
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Progress is saved locally on this device.
                </p>
              </div>
              <button
                className="rounded border border-slate-300 px-2 py-1 text-xs"
                onClick={() => {
                  setTakeQuiz(null);
                  setTakeRemainingSeconds(null);
                  setTakeExpiresAt(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-auto">
              {(takeQuiz.questions || []).map((q: any, idx: number) => (
                <div key={q.id} className="rounded border border-slate-200 p-2">
                  <p className="mb-2 text-xs font-semibold">
                    Q{idx + 1}. {q.prompt}
                  </p>
                  {takeQuiz.quizType === "IDENTIFICATION" ? (
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      value={takeAnswers[q.id] || ""}
                      onChange={(e) =>
                        setTakeAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-1 text-xs">
                      {[q.optionA, q.optionB, q.optionC, q.optionD]
                        .filter(Boolean)
                        .map((opt: string, i: number) => {
                          const key = ["A", "B", "C", "D"][i];
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={key}
                                checked={(takeAnswers[q.id] || "") === key}
                                onChange={(e) =>
                                  setTakeAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button
                className="rounded bg-slate-900 p-2 text-white"
                onClick={() => submitTakeQuiz(false)}
                disabled={submittingTakeQuiz}
                title={submittingTakeQuiz ? "Submitting..." : "Submit quiz"}
                aria-label={
                  submittingTakeQuiz ? "Submitting..." : "Submit quiz"
                }
              >
                {submittingTakeQuiz ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {settingsQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Quiz Settings</p>
              <button
                className="rounded border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setSettingsQuiz(null)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-2 text-sm">
              <input
                id="quiz-title"
                className="rounded border border-slate-300 px-2 py-2"
                defaultValue={settingsQuiz.title || ""}
                placeholder="Quiz title"
              />
              <input
                id="quiz-time-limit"
                type="number"
                min={1}
                className="rounded border border-slate-300 px-2 py-2"
                defaultValue={settingsQuiz.timeLimitMinutes || ""}
                placeholder="Time limit (minutes)"
              />
              <input
                id="quiz-max-attempts"
                type="number"
                min={1}
                className="rounded border border-slate-300 px-2 py-2"
                defaultValue={settingsQuiz.maxAttempts || ""}
                placeholder="Max attempts"
              />
              <input
                id="quiz-passing-percentage"
                type="number"
                min={1}
                max={100}
                className="rounded border border-slate-300 px-2 py-2"
                defaultValue={settingsQuiz.passingPercentage || 60}
                placeholder="Passing score (%)"
              />
              <input
                id="quiz-access-code"
                className="rounded border border-slate-300 px-2 py-2"
                defaultValue={settingsQuiz.accessCode || ""}
                placeholder="Access code (optional)"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-is-open"
                  type="checkbox"
                  defaultChecked={Boolean(settingsQuiz.isOpen)}
                />
                Quiz is open
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-shuffle"
                  type="checkbox"
                  defaultChecked={Boolean(settingsQuiz.shuffleQuestions)}
                />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-show-results"
                  type="checkbox"
                  defaultChecked={Boolean(settingsQuiz.showResultsImmediately)}
                />
                Show results immediately
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-show-score-tab"
                  type="checkbox"
                  defaultChecked={Boolean(
                    settingsQuiz.showScoreInStudentScores ?? true,
                  )}
                />
                Show quiz results in student Scores tab
              </label>
            </div>
            <div className="mt-3">
              <button
                className="rounded bg-blue-700 px-3 py-2 text-xs text-white"
                onClick={async () => {
                  const title =
                    (
                      document.getElementById(
                        "quiz-title",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const timeLimit =
                    (
                      document.getElementById(
                        "quiz-time-limit",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const maxAttempts =
                    (
                      document.getElementById(
                        "quiz-max-attempts",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const passingPercentage =
                    (
                      document.getElementById(
                        "quiz-passing-percentage",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const accessCode =
                    (
                      document.getElementById(
                        "quiz-access-code",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const isOpen = Boolean(
                    (
                      document.getElementById(
                        "quiz-is-open",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  const shuffleQuestions = Boolean(
                    (
                      document.getElementById(
                        "quiz-shuffle",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  const showResultsImmediately = Boolean(
                    (
                      document.getElementById(
                        "quiz-show-results",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  const showScoreInStudentScores = Boolean(
                    (
                      document.getElementById(
                        "quiz-show-score-tab",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  await api(`/quizzes/${settingsQuiz.id}/settings`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                      title: title.trim() || undefined,
                      isOpen,
                      timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
                      maxAttempts: maxAttempts ? Number(maxAttempts) : null,
                      passingPercentage: passingPercentage
                        ? Number(passingPercentage)
                        : null,
                      accessCode: accessCode || null,
                      shuffleQuestions,
                      showResultsImmediately,
                      showScoreInStudentScores,
                    }),
                  });
                  const rows = await api(
                    `/quizzes/course/${selectedCourse.id}`,
                    { headers },
                  );
                  setCourseQuizzes(rows || []);
                  setSettingsQuiz(null);
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

