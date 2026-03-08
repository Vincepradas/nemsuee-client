export const quizService = {
  listByCourse: (api: any, headers: any, courseId: number) =>
    api(`/quizzes/course/${courseId}`, { headers }),
  createForLesson: (api: any, headers: any, lessonId: number, payload: any) =>
    api(`/quizzes/lessons/${lessonId}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  updateSettings: (api: any, headers: any, quizId: number, payload: any) =>
    api(`/quizzes/${quizId}/settings`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    }),
  submit: (api: any, headers: any, quizId: number, answers: any[]) =>
    api(`/quizzes/${quizId}/submit-v2`, {
      method: "POST",
      headers,
      body: JSON.stringify({ answers }),
    }),
};
