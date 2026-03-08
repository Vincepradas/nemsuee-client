import { AcademicTermsSection } from "../../admin/components/management/AcademicTermsSection";
import type { AcademicTerm } from "../../admin/components/management/types";

export function TermManagement(props: {
  terms: AcademicTerm[];
  onCreateTerm: () => void;
  onEditTerm: (term: AcademicTerm) => void;
  onActivateTerm: (termId: number) => void;
  onToggleArchiveTerm: (term: AcademicTerm) => void;
  onDeleteTerm: (term: AcademicTerm) => void;
}) {
  return <AcademicTermsSection {...props} />;
}
