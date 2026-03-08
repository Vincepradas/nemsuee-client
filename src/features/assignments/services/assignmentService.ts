export const assignmentService = {
  listByCourseAndKind: (api: any, headers: any, courseId: number, kind: string) =>
    api(`/tasks/course/${courseId}?kind=${encodeURIComponent(kind)}`, { headers }),
  create: (api: any, headers: any, payload: any) =>
    api(`/tasks`, { method: "POST", headers, body: JSON.stringify(payload) }),
  submit: (api: any, headers: any, taskId: number, payload: any) =>
    api(`/tasks/${taskId}/submissions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
};
