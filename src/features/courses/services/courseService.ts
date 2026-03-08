export const courseService = {
  // Placeholder service bridge for progressive migration from prop-driven api calls
  getCourse: (api: any, headers: any, courseId: number) =>
    api(`/courses/${courseId}`, { headers }),
};
