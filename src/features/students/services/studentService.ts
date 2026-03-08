export const studentService = {
  listRoster: (api: any, headers: any, courseId: number) =>
    api(`/courses/${courseId}/roster`, { headers }),
};
