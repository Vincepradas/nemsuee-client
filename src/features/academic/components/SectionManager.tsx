import { BlocksManagementSection } from "../../admin/components/management/BlocksManagementSection";
import type { Course } from "../../../shared/types/lms";
import type { SectionInstructor } from "../../admin/components/management/types";

export function SectionManager(props: {
  courses: Course[];
  selectedCourse: Course | null;
  selectedCourseId: number | null;
  sectionInstructors: Record<number, SectionInstructor[]>;
  studentCountBySection: Record<number, number>;
  onSelectCourse: (courseId: number) => void;
  onAddBlock: () => void;
  onManageBlock: (sectionId: number) => void;
  onDeleteBlock: (sectionId: number) => void;
}) {
  return <BlocksManagementSection {...props} />;
}
