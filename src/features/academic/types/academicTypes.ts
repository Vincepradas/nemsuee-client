export type AcademicRole =
  | "SUPER_ADMIN"
  | "REGISTRAR"
  | "DEAN"
  | "DEPARTMENT_CHAIR"
  | "INSTRUCTOR"
  | "STUDENT";

export type AcademicTermNode = {
  id: number;
  academicYear: string;
  name: string;
  isActive: boolean;
};

export type CourseCatalogNode = {
  id: number;
  title: string;
  description: string;
};

export type SectionNode = {
  id: number;
  name: string;
  studentCount: number;
  instructors: string[];
};

export type CourseOfferingNode = {
  courseId: number;
  courseTitle: string;
  sections: SectionNode[];
};

export type AcademicWorkflowTree = {
  termLabel: string;
  offerings: CourseOfferingNode[];
};
