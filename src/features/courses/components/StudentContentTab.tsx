import type { Course, Lesson } from "../../../types/lms";

type StudentContentTabProps = {
  selectedCourse: Course;
  groupForLesson: (lesson: Lesson) => string;
  api: any;
  headers: any;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
};

export function StudentContentTab({
  selectedCourse,
  groupForLesson,
  api,
  headers,
  refreshCore,
  setMessage,
}: StudentContentTabProps) {
  return (
    <div className="space-y-4">
      {selectedCourse.sections.map((s) => (
        <section
          key={s.id}
          id={`section-${s.id}`}
          className="rounded-md border border-slate-200 bg-white"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                RESOURCES
              </p>
              <p className="text-sm font-semibold text-slate-900">{s.name}</p>
            </div>
            <span className="text-xs text-slate-500">
              {s.lessons.length} activities
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {s.lessons.map((l) => {
              const group = groupForLesson(l);
              return (
                <article
                  key={l.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {l.title}
                    </p>
                    {l.content &&
                      l.content.trim().toLowerCase() !==
                        l.title.trim().toLowerCase() && (
                        <p className="truncate text-xs text-slate-500">
                          {l.content}
                        </p>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                      {group}
                    </span>
                    {l.fileUrl && (
                      <a
                        className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        href={l.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    )}
                    {l.quiz && (
                      <button
                        onClick={async () => {
                          const quiz = l.quiz;
                          if (!quiz) return;
                          try {
                            await api(`/quizzes/${quiz.id}/submit`, {
                              method: "POST",
                              headers,
                              body: JSON.stringify({
                                answers: quiz.questions.map((q: any) => ({
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
                        className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        Attempt Quiz
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {!s.lessons.length && (
              <p className="px-4 py-3 text-sm text-slate-500">
                No activities yet.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

