import { CourseOfferingsSection } from "../../admin/components/management/CourseOfferingsSection";
import type { Course } from "../../../shared/types/lms";
import type {
  AcademicTerm,
  Instructor,
  TermOffering,
} from "../../admin/components/management/types";

export function CourseOfferingManager(props: {
  offerings: TermOffering[];
  courses: Course[];
  terms: AcademicTerm[];
  instructors: Instructor[];
  selectedTermId: number | null;
  offeringQuery: string;
  instructorFilter: string;
  onChangeOfferingQuery: (value: string) => void;
  onChangeInstructorFilter: (value: string) => void;
  onChangeTermId: (termId: number) => void;
  onCreateOffering: () => void;
  onManageOffering: (offering: TermOffering) => void;
  onAssignInstructor: (offering: TermOffering) => void;
}) {
  return <CourseOfferingsSection {...props} />;
}
