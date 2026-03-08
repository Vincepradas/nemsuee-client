import { Fragment, useEffect, useMemo, useState } from "react";
import { SearchableDropdown } from "../../../shared/components/SearchableDropdown";
import type { Attempt, Course, User } from "../../../shared/types/lms";
import {
  computeGradeRows,
  type RowMeta,
  type TaskRow,
} from "../services/gradeEngine";

type Props = {
  user: User;
  courses: Course[];
  attempts: Attempt[];
  api: any;
  headers: any;
  setMessage: (m: string) => void;
  selectedCourseId: number | null;
  onSelectCourse: (id: number) => void;
};

export function GradeComputationHub({
  user,
  courses,
  attempts,
  api,
  headers,
  setMessage,
  selectedCourseId,
  onSelectCourse,
}: Props) {
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId],
  );

  const [roster, setRoster] = useState<any[]>([]);
  const [assignmentTasks, setAssignmentTasks] = useState<TaskRow[]>([]);
  const [activityTasks, setActivityTasks] = useState<TaskRow[]>([]);
  const [weights, setWeights] = useState({
    quiz: 30,
    assignment: 20,
    activity: 20,
    termExam: 25,
    attendance: 5,
    midtermWeight: 50,
    finalsWeight: 50,
  });
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [gradingContext, setGradingContext] = useState<{
    semester: string;
    term: string;
    gradingPeriod: string;
  }>({
    semester: "1st Semester",
    term: "2026 - 2027",
    gradingPeriod: "MIDTERM",
  });
  const [manual, setManual] = useState<
    Record<string, { midterm?: number; finals?: number; attendance?: number }>
  >({});
  const [metaByStudent, setMetaByStudent] = useState<Record<string, RowMeta>>(
    {},
  );
  const [sortMode, setSortMode] = useState<"NAME" | "GRADE_DESC" | "GRADE_ASC">(
    "NAME",
  );
  const [blockFilter, setBlockFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<
    "ALL" | RowMeta["reviewStatus"]
  >("ALL");
  const [actionMenuStudent, setActionMenuStudent] = useState<number | null>(
    null,
  );
  const [adminPending, setAdminPending] = useState<any[]>([]);
  const [adminBlockDetails, setAdminBlockDetails] = useState<any[]>([]);
  const [viewingBlock, setViewingBlock] = useState<any | null>(null);
  const [isLoadingBlockDetails, setIsLoadingBlockDetails] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(true);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [isSavingWeights, setIsSavingWeights] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user.role === "ADMIN") {
      api("/grade-computation/review/pending", { headers })
        .then((rows: any[]) => setAdminPending(rows || []))
        .catch((e: Error) => setMessage(e.message));
      return;
    }

    if (!selectedCourse || user.role !== "INSTRUCTOR") return;
    (async () => {
      try {
        const [r, a, ac, saved] = await Promise.all([
          api(`/courses/${selectedCourse.id}/students`, { headers }),
          api(`/tasks/course/${selectedCourse.id}?kind=ASSIGNMENT`, {
            headers,
          }),
          api(`/tasks/course/${selectedCourse.id}?kind=ACTIVITY`, { headers }),
          api(`/grade-computation/course/${selectedCourse.id}`, {
            headers,
          }).catch(() => []),
        ]);
        setRoster(r || []);
        setAssignmentTasks(a || []);
        setActivityTasks(ac || []);

        const nextManual: Record<
          string,
          { midterm?: number; finals?: number; attendance?: number }
        > = {};
        const nextMeta: Record<string, RowMeta> = {};
        for (const s of saved || []) {
          nextManual[String(s.studentId)] = {
            midterm: Number(s.midterm || 0),
            finals: Number(s.finals || 0),
            attendance: Number(s.attendance || 0),
          };
          nextMeta[String(s.studentId)] = {
            isLocked: Boolean(s.isLocked),
            reviewStatus: String(
              s.reviewStatus || "DRAFT",
            ) as RowMeta["reviewStatus"],
          };
        }
        setManual(nextManual);
        setMetaByStudent(nextMeta);
      } catch (e) {
        setMessage((e as Error).message);
      }
    })();
  }, [user.role, selectedCourse?.id]);

  useEffect(() => {
    if (user.role !== "INSTRUCTOR") return;
    (async () => {
      try {
        const active = await api("/terms/context", { headers });
        if (active?.semester && active?.academicYear) {
          setGradingContext({
            semester: String(active.semester),
            term: String(active.academicYear),
            gradingPeriod: String(active.gradingPeriod || "MIDTERM"),
          });
        }
      } catch {
        // Keep default fallback.
      }
    })();
  }, [user.role, api, headers]);

  useEffect(() => {
    if (user.role !== "INSTRUCTOR" || !selectedCourse) return;
    (async () => {
      try {
        const payload = await api(
          `/grade-computation/course/${selectedCourse.id}/weights`,
          { headers },
        );
        setWeights({
          quiz: Number(payload?.weights?.quiz ?? 30),
          assignment: Number(payload?.weights?.assignment ?? 20),
          activity: Number(payload?.weights?.activity ?? 20),
          termExam: Number(payload?.weights?.exam ?? 25),
          attendance: Number(payload?.weights?.attendance ?? 5),
          midtermWeight: Number(payload?.weights?.midtermWeight ?? 50),
          finalsWeight: Number(payload?.weights?.finalsWeight ?? 50),
        });
      } catch {
        // keep local defaults
      }
    })();
  }, [user.role, selectedCourse?.id, api, headers]);

  function setManualFieldInput(
    studentId: number,
    field: "midterm" | "finals" | "attendance",
    rawValue: string,
  ) {
    const meta = metaByStudent[String(studentId)];
    if (
      meta?.isLocked ||
      meta?.reviewStatus === "PENDING" ||
      meta?.reviewStatus === "APPROVED"
    )
      return;
    const key = String(studentId);
    const parsed =
      rawValue.trim() === ""
        ? undefined
        : Math.max(0, Math.min(100, Number(rawValue)));
    const next = {
      ...manual,
      [key]: {
        midterm: manual[key]?.midterm,
        finals: manual[key]?.finals,
        attendance: manual[key]?.attendance,
        [field]: Number.isNaN(parsed as number) ? undefined : parsed,
      },
    };
    setManual(next);
  }

  const rows = useMemo(() => {
    if (!selectedCourse) return [] as any[];
    const built = computeGradeRows({
      selectedCourseId: selectedCourse.id,
      roster,
      attempts,
      assignmentTasks,
      activityTasks,
      manual,
      metaByStudent,
      weights,
      gradingPeriod: gradingContext.gradingPeriod,
    });

    const q = searchQuery.trim().toLowerCase();
    const filtered = built.filter((r) => {
      const byBlock =
        blockFilter === "ALL" ? true : r.blockName === blockFilter;
      const byReview =
        reviewFilter === "ALL" ? true : r.meta.reviewStatus === reviewFilter;
      const bySearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.blockName.toLowerCase().includes(q);
      return byBlock && byReview && bySearch;
    });
    return filtered.sort((a, b) => {
      if (sortMode === "NAME")
        return a.studentName.localeCompare(b.studentName);
      if (sortMode === "GRADE_ASC") return a.finalGrade - b.finalGrade;
      return b.finalGrade - a.finalGrade;
    });
  }, [
    selectedCourse?.id,
    roster,
    attempts,
    assignmentTasks,
    activityTasks,
    manual,
    weights,
    metaByStudent,
    blockFilter,
    sortMode,
    searchQuery,
    reviewFilter,
    gradingContext.gradingPeriod,
  ]);

  const groupedRows = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const key = row.blockName || "Unassigned";
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      },
      {} as Record<string, Array<(typeof rows)[number]>>,
    );
  }, [rows]);

  const blockOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.blockName))).sort(),
    [rows],
  );
  const searchOptions = useMemo(() => {
    const options = new Set<string>();
    rows.forEach((r) => {
      if (r.studentName) options.add(r.studentName);
      if (r.blockName) options.add(r.blockName);
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const termExamField: "midterm" | "finals" =
    gradingContext.gradingPeriod === "FINALS" ? "finals" : "midterm";
  const termExamLabel =
    gradingContext.gradingPeriod === "FINALS" ? "Final Exam" : "Midterm Exam";
  const canSubmitAll = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((row) => {
      const examValue = termExamField === "midterm" ? row.midterm : row.finals;
      return (
        examValue !== undefined &&
        examValue !== null &&
        row.attendance !== undefined &&
        row.attendance !== null
      );
    });
  }, [rows, termExamField]);
  const hasSubmittableRows = useMemo(
    () =>
      rows.some(
        (row) =>
          row.meta.reviewStatus !== "PENDING" &&
          row.meta.reviewStatus !== "APPROVED",
      ),
    [rows],
  );
  const summary = useMemo(() => {
    const total = rows.length;
    const passed = rows.filter((r) => r.result === "PASSED").length;
    const failed = total - passed;
    const average = total
      ? rows.reduce((acc, r) => acc + r.finalGrade, 0) / total
      : 0;
    const highest = total ? Math.max(...rows.map((r) => r.finalGrade)) : 0;
    const lowest = total ? Math.min(...rows.map((r) => r.finalGrade)) : 0;
    return { total, passed, failed, average, highest, lowest };
  }, [rows]);

  async function saveStudent(row: any, lock: boolean, silent = false) {
    if (!selectedCourse) return;
    try {
      await api(
        `/grade-computation/course/${selectedCourse.id}/student/${row.studentId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            studentId: row.studentId,
            quizAvg: row.quizAvg,
            assignmentAvg: row.assignmentAvg,
            activityAvg: row.activityAvg,
            midterm: row.midterm ?? 0,
            finals: row.finals ?? 0,
            attendance: row.attendance ?? 0,
            finalGrade: row.finalGrade,
            equivalentGrade: row.equivalentGrade,
            result: row.result,
            weights: {
              quiz: weights.quiz,
              assignment: weights.assignment,
              activity: weights.activity,
              exam: weights.termExam,
              attendance: weights.attendance,
              midtermWeight: weights.midtermWeight,
              finalsWeight: weights.finalsWeight,
            },
            isLocked: lock,
          }),
        },
      );
      setMetaByStudent((prev) => ({
        ...prev,
        [String(row.studentId)]: {
          ...((prev[String(row.studentId)] || {
            reviewStatus: "DRAFT",
          }) as RowMeta),
          isLocked: lock,
          reviewStatus: "DRAFT",
        },
      }));
      if (!silent) {
        setMessage(
          lock
            ? `Saved and locked: ${row.studentName}`
            : `Saved: ${row.studentName}`,
        );
      }
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function submitAllCourses() {
    if (!selectedCourse || isSubmittingAll) return;
    setIsSubmittingAll(true);
    try {
      const [students, savedRows] = await Promise.all([
        api(`/courses/${selectedCourse.id}/students`, { headers }),
        api(`/grade-computation/course/${selectedCourse.id}`, {
          headers,
        }).catch(() => []),
      ]);

      const studentIds = new Set<number>(
        (students || [])
          .map((s: any) => Number(s?.student?.id || 0))
          .filter(Boolean),
      );
      const savedByStudent = new Map<number, any>(
        (savedRows || []).map((r: any) => [Number(r.studentId), r]),
      );

      for (const studentId of studentIds) {
        const row = savedByStudent.get(studentId);
        if (!row) {
          setMessage(
            `Cannot submit yet. Incomplete grades in ${selectedCourse.title}.`,
          );
          return;
        }
        const reviewStatus = String(row.reviewStatus || "DRAFT");
        const isLocked = Boolean(row.isLocked);
        if (
          !(
            reviewStatus === "PENDING" ||
            reviewStatus === "APPROVED" ||
            isLocked
          )
        ) {
          setMessage(
            `Cannot submit yet. Incomplete grades in ${selectedCourse.title}.`,
          );
          return;
        }
      }

      let submittedCount = 0;
      for (const row of savedRows || []) {
        const reviewStatus = String(row.reviewStatus || "DRAFT");
        if (reviewStatus === "PENDING" || reviewStatus === "APPROVED") continue;
        await api(
          `/grade-computation/course/${selectedCourse.id}/student/${row.studentId}/submit`,
          {
            method: "POST",
            headers,
          },
        );
        submittedCount += 1;
      }

      const refreshed = await api(
        `/grade-computation/course/${selectedCourse.id}`,
        {
          headers,
        },
      ).catch(() => []);
      const nextMeta: Record<string, RowMeta> = {};
      for (const s of refreshed || []) {
        nextMeta[String(s.studentId)] = {
          isLocked: Boolean(s.isLocked),
          reviewStatus: String(
            s.reviewStatus || "DRAFT",
          ) as RowMeta["reviewStatus"],
        };
      }
      setMetaByStudent(nextMeta);
      setMessage(
        `Submitted ${submittedCount} grade records for ${selectedCourse.title}.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsSubmittingAll(false);
    }
  }

  async function saveCourseWeights() {
    if (!selectedCourse || isSavingWeights) return;
    setIsSavingWeights(true);
    try {
      await api(`/grade-computation/course/${selectedCourse.id}/weights`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          weights: {
            quiz: weights.quiz,
            assignment: weights.assignment,
            activity: weights.activity,
            exam: weights.termExam,
            attendance: weights.attendance,
            midtermWeight: weights.midtermWeight,
            finalsWeight: weights.finalsWeight,
          },
        }),
      });
      setMessage(`Saved weights for ${selectedCourse.title}.`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsSavingWeights(false);
    }
  }

  function resetStudent(row: any) {
    const key = String(row.studentId);
    setManual((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setMetaByStudent((prev) => ({
      ...prev,
      [key]: { isLocked: false, reviewStatus: "DRAFT" },
    }));
    setMessage(`Reset manual values: ${row.studentName}`);
  }

  async function reviewPendingBlock(row: any, action: "APPROVE" | "REJECT") {
    try {
      const note =
        prompt(
          action === "APPROVE" ? "Approval note (optional)" : "Rejection note",
          "",
        ) || "";
      await api(`/grade-computation/review/block`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          courseId: row.courseId,
          blockId: row.blockId ?? null,
          semester: row.semester,
          term: row.term,
          gradingPeriod: row.gradingPeriod,
          action,
          note,
        }),
      });
      const rows = await api("/grade-computation/review/pending", { headers });
      setAdminPending(rows || []);
      setMessage(
        action === "APPROVE"
          ? `Block approved: ${row.courseTitle} - ${row.blockName}`
          : `Block rejected: ${row.courseTitle} - ${row.blockName}`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function openBlockDetails(row: any) {
    try {
      setViewingBlock(row);
      setIsLoadingBlockDetails(true);
      const params = new URLSearchParams({
        courseId: String(row.courseId),
        semester: String(row.semester || ""),
        term: String(row.term || ""),
        gradingPeriod: String(row.gradingPeriod || ""),
      });
      if (row.blockId !== null && row.blockId !== undefined) {
        params.set("blockId", String(row.blockId));
      }
      const detailRows = await api(
        `/grade-computation/review/block?${params.toString()}`,
        {
          headers,
        },
      );
      setAdminBlockDetails(detailRows || []);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsLoadingBlockDetails(false);
    }
  }

  if (user.role === "ADMIN") {
    return (
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Grade Review Queue</h3>
        <div className="overflow-auto rounded border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Block</th>
                <th className="px-3 py-2">Term</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Students</th>
                <th className="px-3 py-2">Avg %</th>
                <th className="px-3 py-2">Avg Eqv</th>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminPending.map((r) => (
                <tr
                  key={`${r.courseId}-${String(r.blockId)}-${r.semester}-${r.term}-${r.gradingPeriod}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-3 py-2">{r.courseTitle}</td>
                  <td className="px-3 py-2">{r.blockName}</td>
                  <td className="px-3 py-2">
                    {r.semester} / {r.term}
                  </td>
                  <td className="px-3 py-2">{r.gradingPeriod}</td>
                  <td className="px-3 py-2">{Number(r.studentCount || 0)}</td>
                  <td className="px-3 py-2">
                    {Number(r.avgComputedPercentage || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {Number(r.avgEquivalentGrade || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                        onClick={() => openBlockDetails(r)}
                      >
                        View
                      </button>
                      <button
                        className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                        onClick={() => reviewPendingBlock(r, "APPROVE")}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                        onClick={() => reviewPendingBlock(r, "REJECT")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!adminPending.length && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    No pending grades for review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {viewingBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-3xl rounded-md bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {viewingBlock.courseTitle} -{" "}
                    {viewingBlock.blockName || "Unassigned"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {viewingBlock.semester} / {viewingBlock.term} -{" "}
                    {viewingBlock.gradingPeriod}
                  </p>
                </div>
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() => {
                    setViewingBlock(null);
                    setAdminBlockDetails([]);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="overflow-auto rounded border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Computed %</th>
                      <th className="px-3 py-2">Equivalent</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingBlockDetails && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-slate-500"
                        >
                          Loading students...
                        </td>
                      </tr>
                    )}
                    {!isLoadingBlockDetails &&
                      adminBlockDetails.map((d) => (
                        <tr key={d.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">{d.studentName}</td>
                          <td className="px-3 py-2">
                            {Number(d.computedPercentage || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            {Number(d.equivalentGrade || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2">{d.result}</td>
                          <td className="px-3 py-2">
                            {d.submittedAt
                              ? new Date(d.submittedAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    {!isLoadingBlockDetails && !adminBlockDetails.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-slate-500"
                        >
                          No students found for this block.
                        </td>
                      </tr>
                    )}
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
      <p className="text-sm text-slate-500">
        Grade computation is for instructors only.
      </p>
    );
  }

  if (showCoursePicker) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-lg font-semibold">Subjects</h3>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
            {gradingContext.gradingPeriod}
          </span>
        </div>
        <div className="overflow-auto rounded border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Blocks</th>
                <th className="w-10 px-3 py-3" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.id}
                  onClick={() => {
                    onSelectCourse(course.id);
                    setShowCoursePicker(false);
                  }}
                  className="group cursor-pointer border-t border-slate-100 transition-colors hover:bg-blue-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {course.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {course.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {course.sections?.length || 0}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <svg
                      viewBox="0 0 24 24"
                      className="ml-auto h-4 w-4 text-slate-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </td>
                </tr>
              ))}
              {!courses.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No subjects available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCoursePicker(true)}
            className="rounded border border-slate-300 px-2.5 py-2 text-sm"
            aria-label="Back to subjects"
            title="Back to subjects"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold leading-none">Grading Area</h3>
          <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {gradingContext.gradingPeriod}
          </span>
          <span
            className="inline-flex max-w-[360px] shrink truncate rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700"
            title={selectedCourse?.title || "No subject selected"}
          >
            {selectedCourse?.title || "No subject selected"}
          </span>
          <button
            data-keep-action-text="true"
            className="ml-auto inline-flex items-center rounded px-1 py-0.5 text-sm font-semibold text-blue-700 underline-offset-4 transition hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:text-slate-400 disabled:no-underline"
            onClick={submitAllCourses}
            disabled={isSubmittingAll || !canSubmitAll || !hasSubmittableRows}
            title={
              !canSubmitAll
                ? "Complete all student grades first."
                : !hasSubmittableRows
                  ? "Grades are already approved/submitted for this course."
                  : undefined
            }
          >
            {isSubmittingAll ? "Submitting..." : "Submit Grades"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <select
            value={sortMode}
            onChange={(e) =>
              setSortMode(e.target.value as "NAME" | "GRADE_DESC" | "GRADE_ASC")
            }
            className="h-10 min-w-[220px] rounded border border-slate-300 px-2.5 text-sm"
          >
            <option value="NAME">Sort by Student Name</option>
            <option value="GRADE_DESC">Sort by Grade (Highest)</option>
            <option value="GRADE_ASC">Sort by Grade (Lowest)</option>
          </select>
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="h-10 min-w-[160px] rounded border border-slate-300 px-2.5 text-sm"
          >
            <option value="ALL">All blocks</option>
            {blockOptions.map((block) => (
              <option key={block} value={block}>
                {block}
              </option>
            ))}
          </select>
          <button
            className="h-10 rounded border border-slate-300 px-4 text-sm"
            onClick={() => setWeightsOpen(true)}
          >
            Weights
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <SearchableDropdown
            value={searchQuery}
            onChange={setSearchQuery}
            options={searchOptions}
            placeholder="Search or select student/block"
            className="min-w-[240px] flex-1"
            noResultsLabel="No matching student or block."
          />
          <select
            value={reviewFilter}
            onChange={(e) =>
              setReviewFilter(e.target.value as "ALL" | RowMeta["reviewStatus"])
            }
            className="h-10 min-w-[180px] rounded border border-slate-300 px-2.5 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded border border-slate-200 bg-white p-2.5 text-xs">
          <p className="text-slate-500">Students</p>
          <p className="text-base font-semibold text-slate-900">
            {summary.total}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-2.5 text-xs">
          <p className="text-slate-500">Passed</p>
          <p className="text-base font-semibold text-emerald-700">
            {summary.passed}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-2.5 text-xs">
          <p className="text-slate-500">Failed</p>
          <p className="text-base font-semibold text-rose-700">
            {summary.failed}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-2.5 text-xs">
          <p className="text-slate-500">Class Avg</p>
          <p className="text-base font-semibold text-slate-900">
            {summary.average.toFixed(2)}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-2.5 text-xs">
          <p className="text-slate-500">Highest</p>
          <p className="text-base font-semibold text-slate-900">
            {summary.highest.toFixed(2)}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-2.5 text-xs">
          <p className="text-slate-500">Lowest</p>
          <p className="text-base font-semibold text-slate-900">
            {summary.lowest.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-hidden overflow-y-auto rounded border border-slate-200 bg-white">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-xs uppercase tracking-normal">
              <th className="sticky left-0 z-10 w-[20%] bg-slate-50 px-2 py-2">
                Student
              </th>
              <th className="w-[10%] border-l border-slate-200 px-2 py-2">
                Block
              </th>
              <th className="w-[9%] border-l border-slate-200 px-2 py-2">
                CW Avg
              </th>
              <th className="w-[8%] border-l border-slate-200 px-2 py-2">
                Details
              </th>
              <th className="w-[10%] border-l border-slate-200 px-2 py-2 whitespace-nowrap">
                {termExamLabel}
              </th>
              <th className="w-[10%] border-l border-slate-200 px-2 py-2">
                Attndc
              </th>
              <th className="w-[9%] border-l border-slate-200 px-2 py-2">
                Computed
              </th>
              <th className="w-[9%] border-l border-slate-200 px-2 py-2">
                Eqv
              </th>
              <th className="w-[7%] border-l border-slate-200 px-2 py-2">
                Result
              </th>
              <th className="w-[8%] border-l border-slate-200 px-2 py-2">
                Status
              </th>
              <th className="w-[10%] border-l border-slate-200 px-2 py-2">
                Act
              </th>
            </tr>
          </thead>
          <tbody>
            {(
              Object.entries(groupedRows) as Array<
                [string, Array<(typeof rows)[number]>]
              >
            ).map(([block, blockRows]) => (
              <Fragment key={`group-fragment-${block}`}>
                <tr
                  key={`group-${block}`}
                  className="border-t border-slate-200 bg-slate-50"
                >
                  <td
                    colSpan={11}
                    className="px-2 py-2 font-semibold text-slate-700"
                  >
                    {block}
                  </td>
                </tr>
                {blockRows.map((row) => {
                  const readonly =
                    row.meta.isLocked ||
                    row.meta.reviewStatus === "PENDING" ||
                    row.meta.reviewStatus === "APPROVED";
                  const courseworkAvg =
                    (row.quizAvg + row.assignmentAvg + row.activityAvg) / 3;
                  const missingPieces: string[] = [];
                  if (
                    (termExamField === "midterm" ? row.midterm : row.finals) ===
                      undefined ||
                    (termExamField === "midterm" ? row.midterm : row.finals) ===
                      null
                  ) {
                    missingPieces.push(`Missing ${termExamLabel}`);
                  }
                  if (row.attendance === undefined || row.attendance === null)
                    missingPieces.push("Missing Attendance");
                  return (
                    <Fragment key={`row-fragment-${row.studentId}`}>
                      <tr
                        key={row.studentId}
                        className="border-t border-slate-100 align-top"
                      >
                        <td className="sticky left-0 bg-white px-2 py-2 font-medium text-slate-900">
                          <span
                            className="block truncate"
                            title={row.studentName}
                          >
                            {row.studentName}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-slate-700">
                          {row.blockName}
                        </td>
                        <td className="px-2 py-2 font-medium text-slate-900">
                          {courseworkAvg.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() =>
                              setExpandedRows((prev) => ({
                                ...prev,
                                [row.studentId]: !prev[row.studentId],
                              }))
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                          >
                            {expandedRows[row.studentId] ? "Hide" : "View"}
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              manual[String(row.studentId)]?.[termExamField] ??
                              ""
                            }
                            onChange={(e) =>
                              setManualFieldInput(
                                row.studentId,
                                termExamField,
                                e.target.value,
                              )
                            }
                            className="w-full max-w-[72px] rounded border border-slate-300 px-1.5 py-1"
                            disabled={readonly}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              manual[String(row.studentId)]?.attendance ?? ""
                            }
                            onChange={(e) =>
                              setManualFieldInput(
                                row.studentId,
                                "attendance",
                                e.target.value,
                              )
                            }
                            className="w-full max-w-[72px] rounded border border-slate-300 px-1.5 py-1"
                            disabled={readonly}
                          />
                        </td>
                        <td className="px-2 py-2 font-semibold text-slate-900">
                          {row.finalGrade.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 font-semibold text-slate-900">
                          {row.equivalentGrade.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${row.result === "PASSED" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                          >
                            {row.result}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {row.meta.reviewStatus}
                          </span>
                          {missingPieces.length > 0 && (
                            <p className="mt-1 text-[11px] text-amber-700">
                              {missingPieces[0]}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="relative">
                            <button
                              className="rounded p-1 text-slate-600 hover:bg-slate-200"
                              onClick={() =>
                                setActionMenuStudent((p) =>
                                  p === row.studentId ? null : row.studentId,
                                )
                              }
                            >
                              <svg
                                viewBox="0 0 20 20"
                                className="h-4 w-4"
                                fill="currentColor"
                              >
                                <circle cx="10" cy="4" r="1.5" />
                                <circle cx="10" cy="10" r="1.5" />
                                <circle cx="10" cy="16" r="1.5" />
                              </svg>
                            </button>
                            {actionMenuStudent === row.studentId && (
                              <div className="absolute right-0 bottom-full z-30 mb-1 flex items-center gap-1 rounded border border-slate-200 bg-white p-1 shadow-md">
                                <button
                                  title="Save"
                                  aria-label={`Save ${row.studentName}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100 disabled:text-slate-400"
                                  disabled={readonly}
                                  onClick={() => {
                                    saveStudent(row, true);
                                    setActionMenuStudent(null);
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                                    <path d="M17 21v-8H7v8" />
                                    <path d="M7 3v5h8" />
                                  </svg>
                                </button>
                                <button
                                  title="Edit"
                                  aria-label={`Edit ${row.studentName}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                                  onClick={() => {
                                    saveStudent(row, false);
                                    setActionMenuStudent(null);
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 20h9" />
                                    <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" />
                                  </svg>
                                </button>
                                <button
                                  title="Reset"
                                  aria-label={`Reset ${row.studentName}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-amber-700 hover:bg-amber-50 disabled:text-slate-400"
                                  disabled={readonly}
                                  onClick={() => {
                                    resetStudent(row);
                                    setActionMenuStudent(null);
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                                    <path d="M3 3v5h5" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRows[row.studentId] && (
                        <tr className="border-t border-slate-100 bg-slate-50/60">
                          <td className="sticky left-0 bg-slate-50/60 px-2 py-2 text-xs text-slate-600">
                            Details
                          </td>
                          <td
                            colSpan={10}
                            className="px-2 py-2 text-xs text-slate-600"
                          >
                            <span className="mr-4">
                              Quiz:{" "}
                              <b className="text-slate-800">
                                {((row.quizAvg * weights.quiz) / 100).toFixed(
                                  2,
                                )}
                              </b>
                              <span className="ml-1 text-slate-500">
                                ({row.quizAvg.toFixed(2)} x {weights.quiz}%)
                              </span>
                            </span>
                            <span className="mr-4">
                              Assignments:{" "}
                              <b className="text-slate-800">
                                {(
                                  (row.assignmentAvg * weights.assignment) /
                                  100
                                ).toFixed(2)}
                              </b>
                              <span className="ml-1 text-slate-500">
                                ({row.assignmentAvg.toFixed(2)} x{" "}
                                {weights.assignment}%)
                              </span>
                            </span>
                            <span>
                              Activities:{" "}
                              <b className="text-slate-800">
                                {(
                                  (row.activityAvg * weights.activity) /
                                  100
                                ).toFixed(2)}
                              </b>
                              <span className="ml-1 text-slate-500">
                                ({row.activityAvg.toFixed(2)} x{" "}
                                {weights.activity}%)
                              </span>
                            </span>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 py-4 text-center text-slate-500"
                >
                  No students in selected course.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {weightsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl rounded-md bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Grade Weights
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded bg-blue-700 px-2 py-1 text-xs text-white disabled:opacity-60"
                  onClick={saveCourseWeights}
                  disabled={isSavingWeights}
                >
                  {isSavingWeights ? "Saving..." : "Save Weights"}
                </button>
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() => setWeightsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {(
                [
                  ["Quiz", "quiz"],
                  ["Assignments", "assignment"],
                  ["Activities", "activity"],
                  [termExamLabel, "termExam"],
                  ["Attendance", "attendance"],
                ] as Array<[string, keyof typeof weights]>
              ).map(([label, key]) => (
                <label
                  key={key}
                  className="rounded border border-slate-200 p-2 text-xs"
                >
                  <span className="text-slate-600">{label} Weight (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights((w) => ({
                        ...w,
                        [key]: Number(e.target.value || 0),
                      }))
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <label className="rounded border border-slate-200 p-2 text-xs">
                <span className="text-slate-600">
                  Midterm Term Grade Weight (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.midtermWeight}
                  onChange={(e) =>
                    setWeights((w) => ({
                      ...w,
                      midtermWeight: Number(e.target.value || 0),
                    }))
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="rounded border border-slate-200 p-2 text-xs">
                <span className="text-slate-600">
                  Final Term Grade Weight (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.finalsWeight}
                  onChange={(e) =>
                    setWeights((w) => ({
                      ...w,
                      finalsWeight: Number(e.target.value || 0),
                    }))
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


