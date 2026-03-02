export type Role = "STUDENT" | "INSTRUCTOR";
export type ViewKey =
  | "dashboard"
  | "courses"
  | "course_search"
  | "scores"
  | "storage"
  | "profile";
export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type User = { id: number; fullName: string; email: string; role: Role };
export type Quiz = { id: number; questions: { id: number; prompt: string }[] };
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
  enrollmentKey?: string;
  sections: Section[];
  instructor?: { fullName: string };
};

export type Attempt = {
  id: number;
  score: number;
  total: number;
  quiz: { lesson: { title: string; course: { id: number; title: string } } };
  student?: { fullName: string };
};

export type CatalogCourse = {
  id: number;
  title: string;
  description: string;
  instructor: { fullName: string };
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
  mimeType?: string | null;
};
