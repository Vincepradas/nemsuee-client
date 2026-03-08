import type { Course, Lesson } from "../../../types/lms";

type InstructorContentTabProps = {
  selectedCourse: Course;
  collapsedBlocks: Record<number, boolean>;
  setCollapsedBlocks: (
    updater: (prev: Record<number, boolean>) => Record<number, boolean>,
  ) => void;
  groupForLesson: (lesson: Lesson) => string;
  setEditingLesson: (
    value: { sectionId: number; lesson: Lesson } | null,
  ) => void;
  setEditLessonInput: (value: {
    title: string;
    content: string;
    fileUrl: string;
  }) => void;
  lessonMenuOpenId: number | null;
  setLessonMenuOpenId: (
    updater: (prev: number | null) => number | null,
  ) => void;
  deleteLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
  ) => Promise<void>;
};

export function InstructorContentTab(props: InstructorContentTabProps) {
  const {
    selectedCourse,
    collapsedBlocks,
    setCollapsedBlocks,
    groupForLesson,
    setEditingLesson,
    setEditLessonInput,
    lessonMenuOpenId,
    setLessonMenuOpenId,
    deleteLesson,
  } = props;

  return (
    <div className="space-y-3">
      {selectedCourse.sections.map((s) => (
        <section
          key={s.id}
          id={`section-${s.id}`}
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <button
              onClick={() =>
                setCollapsedBlocks((prev) => ({
                  ...prev,
                  [s.id]: !prev[s.id],
                }))
              }
              className="flex items-center gap-2 text-left"
            >
              <svg
                viewBox="0 0 20 20"
                className={`h-4 w-4 text-slate-500 transition-transform ${collapsedBlocks[s.id] ? "rotate-0" : "rotate-90"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 5l5 5-5 5" />
              </svg>
              <p className="font-semibold text-slate-900">{s.name}</p>
            </button>
            <div />
          </div>
          {!collapsedBlocks[s.id] && (
            <div className="space-y-3 p-3">
              {(
                [
                  "Lecture",
                  "Laboratory",
                  "Class Activities",
                  "Quizzes",
                  "Examinations",
                  "Resources",
                ] as const
              ).map((group) => {
                const items = s.lessons.filter(
                  (l) => groupForLesson(l) === group,
                );
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {group}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
                      {items.map((l) => (
                        <article
                          key={l.id}
                          className="flex items-center justify-between gap-3 overflow-visible px-3 py-2 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {l.quiz ? "?" : l.fileUrl ? "F" : "L"} {l.title}
                            </p>
                            {l.content &&
                              l.content.trim().toLowerCase() !==
                                l.title.trim().toLowerCase() && (
                                <p className="truncate text-xs text-slate-500">
                                  {l.content}
                                </p>
                              )}
                          </div>
                          <div className="relative flex shrink-0 items-center gap-1">
                            {l.fileUrl && (
                              <a
                                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-white"
                                href={l.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open
                              </a>
                            )}
                            <button
                              onClick={() =>
                                setLessonMenuOpenId((prev) =>
                                  prev === l.id ? null : l.id,
                                )
                              }
                              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-white"
                              aria-label={`More actions for ${l.title}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <circle cx="12" cy="5" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="19" r="1.8" />
                              </svg>
                            </button>
                            {lessonMenuOpenId === l.id && (
                              <div className="absolute right-0 top-9 z-40 w-14 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                                <button
                                  onClick={() => {
                                    setEditingLesson({
                                      sectionId: s.id,
                                      lesson: l,
                                    });
                                    setEditLessonInput({
                                      title: l.title || "",
                                      content: l.content || "",
                                      fileUrl: l.fileUrl || "",
                                    });
                                    setLessonMenuOpenId(() => null);
                                  }}
                                  className="mx-auto block rounded p-1.5 text-xs hover:bg-slate-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Delete lesson "${l.title}"?`))
                                      return;
                                    await deleteLesson(
                                      selectedCourse.id,
                                      s.id,
                                      l.id,
                                    );
                                    setLessonMenuOpenId(() => null);
                                  }}
                                  className="mx-auto block rounded p-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!s.lessons.length && (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No lessons yet.
                  </p>
                  <p className="text-xs text-slate-500">
                    Add your first lesson to this block.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

