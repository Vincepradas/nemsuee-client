export const scoreService = {
  getMyResult: (api: any, headers: any, quizId: number) =>
    api(`/quizzes/${quizId}/results/me`, { headers }),
};
