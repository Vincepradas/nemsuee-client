export type Instructor = { id: number; fullName: string; email: string };

export type SectionInstructor = {
  id: number;
  role?: string | null;
  instructorId: number;
  fullName: string;
  email: string;
};

export type InstructorApplication = {
  id: number;
  userId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  note?: string | null;
  fullName: string;
  email: string;
  createdAt: string;
};

export type AcademicTerm = {
  id: number;
  name: string;
  academicYear: string;
  isActive: number;
  isArchived: number;
  createdAt: string;
};

export type TermOffering = {
  id: number;
  termId: number;
  templateId: number;
  code?: string | null;
  title: string;
  description: string;
  createdAt: string;
  courseId?: number | null;
  instructorId?: number | null;
  instructorName?: string | null;
};
