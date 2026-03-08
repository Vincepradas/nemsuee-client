import type { Course } from "../../../shared/types/lms";
import type {
  AcademicWorkflowTree,
  CourseCatalogNode,
} from "../types/academicTypes";

export function buildCourseCatalog(courses: Course[]): CourseCatalogNode[] {
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description || "",
  }));
}

export function buildAcademicWorkflowTree(
  courses: Course[],
  studentCountBySection: Record<number, number>,
  sectionInstructorLabels: Record<number, string[]>,
  termLabel: string,
): AcademicWorkflowTree {
  return {
    termLabel,
    offerings: courses.map((course) => ({
      courseId: course.id,
      courseTitle: course.title,
      sections: course.sections.map((section) => ({
        id: section.id,
        name: section.name,
        studentCount: studentCountBySection[section.id] ?? 0,
        instructors: sectionInstructorLabels[section.id] || [],
      })),
    })),
  };
}
