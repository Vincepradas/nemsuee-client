export type Role =
  | "STUDENT"
  | "INSTRUCTOR"
  | "ADMIN"
  | "REGISTRAR"
  | "DEAN";
export type ViewKey =
  | "dashboard"
  | "courses"
  | "admin_blocks"
  | "archives"
  | "course_search"
  | "scores"
  | "grade_computation"
  | "storage"
  | "profile"
  | "settings";
export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  studentId?: string | null;
};
export type Quiz = {
  id: number;
  quizType?: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  questions: {
    id: number;
    prompt: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
  }[];
};
export type Lesson = {
  id: number;
  title: string;
  content: string;
  fileUrl?: string | null;
  quiz?: Quiz | null;
};

export type Section = { id: number; name: string; lessons: Lesson[] };

export type Course = {
  id: number;
  title: string;
  description: string;
  isArchived?: boolean;
  enrollmentKey?: string;
  sections: Section[];
  instructor?: { fullName: string };
  instructors?: { id: number; fullName: string; email?: string }[];
  term?: {
    id: number;
    name: string;
    academicYear: string;
    isActive?: number;
    isArchived?: number;
  } | null;
};

export type Attempt = {
  id: number;
  score: number;
  total: number;
  quiz: { lesson: { title: string; course: { id: number; title: string } } };
  student?: { fullName: string };
};

export type CourseTask = {
  id: number;
  courseId: number;
  sectionId: number;
  sectionName: string;
  kind: "ASSIGNMENT" | "ACTIVITY";
  mode: "MANUAL" | "FILE";
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  allowStudentResubmit?: number | boolean;
  dueAt?: string | null;
  createdAt: string;
  mySubmission?: TaskSubmission | null;
  submissions?: TaskSubmission[];
};

export type TaskSubmission = {
  id: number;
  taskId: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  answerText?: string | null;
  fileUrl?: string | null;
  grade?: number | null;
  feedback?: string | null;
  gradedBy?: number | null;
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogCourse = {
  id: number;
  title: string;
  description: string;
  instructor: { fullName: string };
  instructors?: { id: number; fullName: string; email?: string }[];
  sections: { id: number; name: string }[];
  enrollmentStatus: EnrollmentStatus | null;
};

export type RosterRow = {
  id: number;
  student: { fullName: string; email: string };
  section?: { id: number; name: string } | null;
};

export type DriveFile = {
  id?: string | null;
  name?: string | null;
  webViewLink?: string | null;
  webContentLink?: string | null;
  mimeType?: string | null;
  modifiedTime?: string | null;
  size?: string | null;
};

export type TeachingBlock = {
  id: number;
  name: string;
  courseId: number;
  courseTitle: string;
  courseDescription: string;
};
