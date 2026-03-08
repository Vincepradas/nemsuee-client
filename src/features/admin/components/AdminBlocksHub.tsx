import { useEffect, useMemo, useState } from "react";
import type { Course } from "../../../shared/types/lms";
import { AdminSettingsPanel } from "./AdminSettingsPanel";
import { AddBlockModal, ManageBlockModal } from "./management/BlockModals";
import { CollapsibleSection } from "./management/CollapsibleSection";
import {
  EditCourseModal,
  CourseConfigurationSection,
} from "./management/CourseConfigurationSection";
import {
  AssignOfferingInstructorModal,
  CreateOfferingModal,
} from "./management/OfferingModals";
import { InstructorManagementSection } from "./management/InstructorManagementSection";
import { SummaryMetrics } from "./management/SummaryMetrics";
import { CreateTermModal, EditTermModal } from "./management/TermModals";
import { AcademicWorkflowTreeCard } from "../../academic/components/AcademicWorkflowTreeCard";
import { CourseCatalogManager } from "../../academic/components/CourseCatalogManager";
import { CourseOfferingManager } from "../../academic/components/CourseOfferingManager";
import { EnrollmentManager } from "../../academic/components/EnrollmentManager";
import { InstructorAssignmentManager } from "../../academic/components/InstructorAssignmentManager";
import { SectionManager } from "../../academic/components/SectionManager";
import { TermManagement } from "../../academic/components/TermManagement";
import { buildAcademicWorkflowTree } from "../../academic/services/academicWorkflowService";
import type {
  AcademicTerm,
  Instructor,
  InstructorApplication,
  SectionInstructor,
  TermOffering,
} from "./management/types";

type SectionKey =
  | "terms"
  | "offerings"
  | "instructors"
  | "catalog"
  | "courseConfig"
  | "blocks"
  | "assignments"
  | "enrollments";

export function AdminBlocksHub(props: {
  api: any;
  headers: any;
  courses: Course[];
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
}) {
  const { api, headers, courses, refreshCore, setMessage } = props;

  const [activeTab, setActiveTab] = useState<"management" | "admin_settings">(
    "management",
  );
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    terms: true,
    offerings: true,
    instructors: true,
    catalog: true,
    courseConfig: true,
    blocks: true,
    assignments: true,
    enrollments: true,
  });

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termOfferings, setTermOfferings] = useState<TermOffering[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    courses[0]?.id || null,
  );
  const [sectionInstructors, setSectionInstructors] = useState<
    Record<number, SectionInstructor[]>
  >({});
  const [studentCountBySection, setStudentCountBySection] = useState<
    Record<number, number>
  >({});

  const [offeringQuery, setOfferingQuery] = useState("");
  const [offeringInstructorFilter, setOfferingInstructorFilter] =
    useState("ALL");
  const [courseConfigQuery, setCourseConfigQuery] = useState("");

  const [showCreateTermModal, setShowCreateTermModal] = useState(false);
  const [newTermName, setNewTermName] = useState("1st Semester");
  const [newTermAcademicYear, setNewTermAcademicYear] = useState("2026 - 2027");
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [editingTermName, setEditingTermName] = useState("");
  const [editingTermYear, setEditingTermYear] = useState("");

  const [showCreateOfferingModal, setShowCreateOfferingModal] = useState(false);
  const [newOfferingTitle, setNewOfferingTitle] = useState("");
  const [newOfferingDescription, setNewOfferingDescription] = useState("");
  const [newOfferingInstructorId, setNewOfferingInstructorId] = useState<
    number | null
  >(null);
  const [assignOfferingTarget, setAssignOfferingTarget] =
    useState<TermOffering | null>(null);
  const [assignOfferingInstructorQuery, setAssignOfferingInstructorQuery] =
    useState("");

  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDescription, setEditCourseDescription] = useState("");

  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [managingSectionId, setManagingSectionId] = useState<number | null>(
    null,
  );
  const [editingSectionName, setEditingSectionName] = useState("");
  const [manageBlockInstructorQuery, setManageBlockInstructorQuery] =
    useState("");

  const activeTerm = useMemo(
    () => terms.find((term) => Number(term.isActive) === 1) || null,
    [terms],
  );

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  );

  const managingSection = useMemo(
    () =>
      selectedCourse?.sections.find((section) => section.id === managingSectionId) ||
      null,
    [selectedCourse, managingSectionId],
  );

  const filteredConfigCourses = useMemo(() => {
    const q = courseConfigQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) => {
      const bag = `${course.title} ${course.description || ""}`.toLowerCase();
      return bag.includes(q);
    });
  }, [courseConfigQuery, courses]);

  const filteredOfferings = useMemo(() => {
    const q = offeringQuery.trim().toLowerCase();
    return termOfferings.filter((offering) => {
      if (offeringInstructorFilter !== "ALL") {
        if (String(offering.instructorId || "") !== offeringInstructorFilter) {
          return false;
        }
      }
      if (!q) return true;
      const bag =
        `${offering.title} ${offering.description || ""} ${offering.instructorName || ""}`.toLowerCase();
      return bag.includes(q);
    });
  }, [offeringInstructorFilter, offeringQuery, termOfferings]);

  const instructorLabelMap = useMemo(() => {
    const map = new Map<string, Instructor>();
    instructors.forEach((instructor) => {
      map.set(`${instructor.fullName} (${instructor.email})`, instructor);
    });
    return map;
  }, [instructors]);

  const summary = useMemo(() => {
    const coursesOffered = termOfferings.length;
    const instructorsAssigned = new Set(
      termOfferings
        .map((offering) => Number(offering.instructorId || 0))
        .filter((id) => id > 0),
    ).size;
    const totalBlocks = courses.reduce(
      (sum, course) => sum + course.sections.length,
      0,
    );
    return { coursesOffered, instructorsAssigned, totalBlocks };
  }, [courses, termOfferings]);

  const sectionInstructorLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(sectionInstructors).map(([sectionId, assignments]) => [
          Number(sectionId),
          assignments.map((assignment) => assignment.fullName),
        ]),
      ) as Record<number, string[]>,
    [sectionInstructors],
  );

  const workflowTree = useMemo(() => {
    const activeTermLabel = activeTerm
      ? `${activeTerm.academicYear} - ${activeTerm.name}`
      : "No active term";
    return buildAcademicWorkflowTree(
      courses,
      studentCountBySection,
      sectionInstructorLabels,
      activeTermLabel,
    );
  }, [activeTerm, courses, sectionInstructorLabels, studentCountBySection]);

  function toggleSection(section: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  async function loadInstructors() {
    try {
      const rows = await api("/courses/instructors", { headers });
      setInstructors(rows || []);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadApplications() {
    try {
      const rows = await api("/auth/instructor-applications", { headers });
      setApplications(rows || []);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadTerms() {
    try {
      const rows = await api("/terms", { headers });
      setTerms(rows || []);
      const active = (rows || []).find(
        (term: AcademicTerm) => Number(term.isActive) === 1,
      );
      const fallbackId = Number(active?.id || rows?.[0]?.id || 0);
      if (fallbackId) setSelectedTermId((prev) => prev || fallbackId);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadOfferings(termId: number) {
    try {
      const rows = await api(`/terms/${termId}/offerings`, { headers });
      setTermOfferings(rows || []);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadSectionInstructors(sectionId: number, courseId: number) {
    try {
      const rows = await api(
        `/courses/${courseId}/sections/${sectionId}/instructors`,
        { headers },
      );
      const normalized = (rows || []).map((row: any) => ({
        id: row.id,
        role: row.role,
        instructorId: row.instructorId || row.instructor?.id,
        fullName: row.fullName || row.instructor?.fullName,
        email: row.email || row.instructor?.email,
      }));
      setSectionInstructors((prev) => ({ ...prev, [sectionId]: normalized }));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadStudentCounts(courseId: number, sectionIds: number[]) {
    try {
      const rows = await api(`/courses/${courseId}/students`, { headers });
      const counts: Record<number, number> = {};
      sectionIds.forEach((id) => {
        counts[id] = 0;
      });
      (rows || []).forEach((row: any) => {
        const sectionId = Number(row?.section?.id || row?.sectionId || 0);
        if (sectionId in counts) counts[sectionId] += 1;
      });
      setStudentCountBySection((prev) => ({ ...prev, ...counts }));
    } catch {
      const counts: Record<number, number> = {};
      sectionIds.forEach((id) => {
        counts[id] = 0;
      });
      setStudentCountBySection((prev) => ({ ...prev, ...counts }));
    }
  }

  useEffect(() => {
    loadInstructors();
    loadApplications();
    loadTerms();
  }, []);

  useEffect(() => {
    if (!selectedTermId) return;
    loadOfferings(selectedTermId);
  }, [selectedTermId]);

  useEffect(() => {
    if (!selectedCourseId && courses[0]) {
      setSelectedCourseId(courses[0].id);
      return;
    }
    if (
      selectedCourseId &&
      !courses.some((course) => course.id === selectedCourseId)
    ) {
      setSelectedCourseId(courses[0]?.id || null);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourse) return;
    setEditCourseTitle(selectedCourse.title || "");
    setEditCourseDescription(selectedCourse.description || "");
    selectedCourse.sections.forEach((section) => {
      loadSectionInstructors(section.id, selectedCourse.id);
    });
    loadStudentCounts(
      selectedCourse.id,
      selectedCourse.sections.map((section) => section.id),
    );
  }, [selectedCourse?.id, courses.length]);

  useEffect(() => {
    if (!managingSection) return;
    setEditingSectionName(managingSection.name);
    setManageBlockInstructorQuery("");
  }, [managingSection?.id, managingSection?.name]);

  async function handleCreateTerm() {
    try {
      await api("/terms", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newTermName,
          academicYear: newTermAcademicYear,
        }),
      });
      await loadTerms();
      setShowCreateTermModal(false);
      setMessage("Academic term created.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleActivateTerm(termId: number) {
    try {
      await api(`/terms/${termId}/activate`, { method: "PATCH", headers });
      await loadTerms();
      await refreshCore();
      setMessage("Active term updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleToggleArchiveTerm(term: AcademicTerm) {
    try {
      await api(`/terms/${term.id}/archive`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ archived: Number(term.isArchived) ? false : true }),
      });
      await loadTerms();
      setMessage(Number(term.isArchived) ? "Term unarchived." : "Term archived.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleDeleteTerm(term: AcademicTerm) {
    const ok = confirm(`Delete term "${term.academicYear} - ${term.name}"?`);
    if (!ok) return;
    try {
      await api(`/terms/${term.id}`, { method: "DELETE", headers });
      await loadTerms();
      setMessage("Term deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleSaveEditedTerm() {
    if (!editingTermId) return;
    try {
      await api(`/terms/${editingTermId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: editingTermName,
          academicYear: editingTermYear,
        }),
      });
      await loadTerms();
      setEditingTermId(null);
      setMessage("Term updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleCreateOffering() {
    if (!selectedTermId) return;
    try {
      await api(`/terms/${selectedTermId}/offerings`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: newOfferingTitle,
          description: newOfferingDescription,
          instructorId: newOfferingInstructorId,
        }),
      });
      setNewOfferingTitle("");
      setNewOfferingDescription("");
      setNewOfferingInstructorId(null);
      await loadOfferings(selectedTermId);
      await refreshCore();
      setShowCreateOfferingModal(false);
      setMessage("Course offering created.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleAssignOfferingInstructor() {
    if (!assignOfferingTarget?.courseId) {
      setMessage("Offering has no linked course.");
      return;
    }
    const exact = instructorLabelMap.get(assignOfferingInstructorQuery);
    const fallback = instructors.find((instructor) => {
      const bag = `${instructor.fullName} ${instructor.email}`.toLowerCase();
      return bag.includes(assignOfferingInstructorQuery.trim().toLowerCase());
    });
    const picked = exact || fallback;
    if (!picked) {
      setMessage("Select a valid instructor.");
      return;
    }
    try {
      await api(`/courses/${assignOfferingTarget.courseId}/instructors`, {
        method: "POST",
        headers,
        body: JSON.stringify({ instructorId: picked.id }),
      });
      if (selectedTermId) await loadOfferings(selectedTermId);
      await refreshCore();
      setAssignOfferingTarget(null);
      setAssignOfferingInstructorQuery("");
      setMessage("Offering instructor updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleApplicationDecision(
    userId: number,
    status: "APPROVED" | "REJECTED",
  ) {
    try {
      await api(`/auth/instructor-applications/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      await loadApplications();
      setMessage(status === "APPROVED" ? "Instructor approved." : "Instructor rejected.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleDeleteSelectedCourse() {
    if (!selectedCourse) return;
    const ok = confirm(
      `Delete ${selectedCourse.title}? This removes blocks, lessons, and enrollments.`,
    );
    if (!ok) return;
    try {
      await api(`/courses/${selectedCourse.id}`, { method: "DELETE", headers });
      await refreshCore();
      setMessage("Course deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleSaveCourseChanges() {
    if (!selectedCourse) return;
    try {
      await api(`/courses/${selectedCourse.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: editCourseTitle,
          description: editCourseDescription,
        }),
      });
      await refreshCore();
      setShowEditCourseModal(false);
      setMessage("Course updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleAddBlock() {
    if (!selectedCourse) return;
    try {
      await api(`/courses/${selectedCourse.id}/sections`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newBlockName }),
      });
      setNewBlockName("");
      await refreshCore();
      setShowAddBlockModal(false);
      setMessage("Block created.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleDeleteBlock(sectionId: number) {
    if (!selectedCourse) return;
    const section = selectedCourse.sections.find((s) => s.id === sectionId);
    const ok = confirm(
      `Delete ${section?.name || "block"}? This removes lessons and resources tied to the block.`,
    );
    if (!ok) return;
    try {
      await api(`/courses/${selectedCourse.id}/sections/${sectionId}`, {
        method: "DELETE",
        headers,
      });
      await refreshCore();
      setMessage("Block deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleSaveBlockName() {
    if (!selectedCourse || !managingSection) return;
    try {
      await api(`/courses/${selectedCourse.id}/sections/${managingSection.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: editingSectionName }),
      });
      await refreshCore();
      setMessage("Block updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleRemoveBlockInstructor(
    instructorId: number,
    fullName: string,
  ) {
    if (!selectedCourse || !managingSection) return;
    const ok = confirm(`Remove ${fullName} from ${managingSection.name}?`);
    if (!ok) return;
    try {
      await api(
        `/courses/${selectedCourse.id}/sections/${managingSection.id}/instructors/${instructorId}`,
        { method: "DELETE", headers },
      );
      await loadSectionInstructors(managingSection.id, selectedCourse.id);
      setMessage("Instructor removed from block.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleAssignInstructorToBlock() {
    if (!selectedCourse || !managingSection) return;
    const exact = instructorLabelMap.get(manageBlockInstructorQuery);
    const fallback = instructors.find((instructor) => {
      const bag = `${instructor.fullName} ${instructor.email}`.toLowerCase();
      return bag.includes(manageBlockInstructorQuery.trim().toLowerCase());
    });
    const picked = exact || fallback;
    if (!picked) {
      setMessage("Please select an instructor.");
      return;
    }
    try {
      await api(
        `/courses/${selectedCourse.id}/sections/${managingSection.id}/instructors`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ instructorId: picked.id }),
        },
      );
      await loadSectionInstructors(managingSection.id, selectedCourse.id);
      setManageBlockInstructorQuery("");
      setMessage("Instructor assigned to block.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("management")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            activeTab === "management"
              ? "bg-blue-700 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Academic Management
        </button>
        <button
          onClick={() => setActiveTab("admin_settings")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            activeTab === "admin_settings"
              ? "bg-blue-700 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Admin Settings
        </button>
      </div>

      {activeTab === "admin_settings" && (
        <AdminSettingsPanel api={api} headers={headers} setMessage={setMessage} />
      )}

      {activeTab === "management" && (
        <div className="space-y-4">
          <SummaryMetrics
            activeTerm={activeTerm}
            coursesOffered={summary.coursesOffered}
            instructorsAssigned={summary.instructorsAssigned}
            totalBlocks={summary.totalBlocks}
          />
          <AcademicWorkflowTreeCard tree={workflowTree} />

          <CollapsibleSection
            title="Academic Terms"
            description="Manage term lifecycle and activation."
            isOpen={openSections.terms}
            onToggle={() => toggleSection("terms")}
          >
            <TermManagement
              terms={terms}
              onCreateTerm={() => setShowCreateTermModal(true)}
              onEditTerm={(term) => {
                setEditingTermId(term.id);
                setEditingTermName(term.name);
                setEditingTermYear(term.academicYear);
              }}
              onActivateTerm={handleActivateTerm}
              onToggleArchiveTerm={handleToggleArchiveTerm}
              onDeleteTerm={handleDeleteTerm}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Course Offerings"
            description="Table-based offerings with search and filters."
            isOpen={openSections.offerings}
            onToggle={() => toggleSection("offerings")}
          >
            <CourseOfferingManager
              offerings={filteredOfferings}
              courses={courses}
              terms={terms}
              instructors={instructors}
              selectedTermId={selectedTermId}
              offeringQuery={offeringQuery}
              instructorFilter={offeringInstructorFilter}
              onChangeOfferingQuery={setOfferingQuery}
              onChangeInstructorFilter={setOfferingInstructorFilter}
              onChangeTermId={setSelectedTermId}
              onCreateOffering={() => setShowCreateOfferingModal(true)}
              onManageOffering={(offering) => {
                if (offering.courseId) setSelectedCourseId(Number(offering.courseId));
                setOpenSections((prev) => ({
                  ...prev,
                  courseConfig: true,
                  blocks: true,
                }));
              }}
              onAssignInstructor={(offering) => {
                setAssignOfferingTarget(offering);
                const current = instructors.find(
                  (i) => i.id === Number(offering.instructorId || 0),
                );
                setAssignOfferingInstructorQuery(
                  current ? `${current.fullName} (${current.email})` : "",
                );
              }}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Instructor Management"
            description="Approve or reject instructor registration requests."
            isOpen={openSections.instructors}
            onToggle={() => toggleSection("instructors")}
          >
            <InstructorManagementSection
              applications={applications}
              onRefresh={loadApplications}
              onApprove={(userId) => handleApplicationDecision(userId, "APPROVED")}
              onReject={(userId) => handleApplicationDecision(userId, "REJECTED")}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Course Catalog"
            description="Centralized list of catalog courses."
            isOpen={openSections.catalog}
            onToggle={() => toggleSection("catalog")}
          >
            <CourseCatalogManager courses={courses} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Course Configuration"
            description="Manage metadata and deletion for courses."
            isOpen={openSections.courseConfig}
            onToggle={() => toggleSection("courseConfig")}
          >
            <CourseConfigurationSection
              courses={filteredConfigCourses}
              selectedCourse={selectedCourse}
              selectedCourseId={selectedCourseId}
              courseFilter={courseConfigQuery}
              onChangeCourseFilter={setCourseConfigQuery}
              onSelectCourse={setSelectedCourseId}
              onEditCourse={() => setShowEditCourseModal(true)}
              onDeleteCourse={handleDeleteSelectedCourse}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Blocks Management"
            description="Manage blocks in a selected course context."
            isOpen={openSections.blocks}
            onToggle={() => toggleSection("blocks")}
          >
            <SectionManager
              courses={courses}
              selectedCourse={selectedCourse}
              selectedCourseId={selectedCourseId}
              sectionInstructors={sectionInstructors}
              studentCountBySection={studentCountBySection}
              onSelectCourse={setSelectedCourseId}
              onAddBlock={() => setShowAddBlockModal(true)}
              onManageBlock={setManagingSectionId}
              onDeleteBlock={handleDeleteBlock}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Instructor Assignment Matrix"
            description="View instructor assignment by section."
            isOpen={openSections.assignments}
            onToggle={() => toggleSection("assignments")}
          >
            <InstructorAssignmentManager
              selectedCourse={selectedCourse}
              sectionInstructors={sectionInstructors}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Enrollment Snapshot"
            description="Section-level student enrollment counts."
            isOpen={openSections.enrollments}
            onToggle={() => toggleSection("enrollments")}
          >
            <EnrollmentManager
              selectedCourse={selectedCourse}
              studentCountBySection={studentCountBySection}
            />
          </CollapsibleSection>
        </div>
      )}

      <CreateTermModal
        open={showCreateTermModal}
        academicYear={newTermAcademicYear}
        termName={newTermName}
        onChangeAcademicYear={setNewTermAcademicYear}
        onChangeTermName={setNewTermName}
        onClose={() => setShowCreateTermModal(false)}
        onSubmit={handleCreateTerm}
      />

      <EditTermModal
        open={Boolean(editingTermId)}
        academicYear={editingTermYear}
        termName={editingTermName}
        onChangeAcademicYear={setEditingTermYear}
        onChangeTermName={setEditingTermName}
        onClose={() => setEditingTermId(null)}
        onSubmit={handleSaveEditedTerm}
      />

      <CreateOfferingModal
        open={showCreateOfferingModal}
        terms={terms}
        selectedTermId={selectedTermId}
        title={newOfferingTitle}
        description={newOfferingDescription}
        instructorId={newOfferingInstructorId}
        instructors={instructors}
        onClose={() => setShowCreateOfferingModal(false)}
        onChangeTermId={setSelectedTermId}
        onChangeTitle={setNewOfferingTitle}
        onChangeDescription={setNewOfferingDescription}
        onChangeInstructorId={setNewOfferingInstructorId}
        onSubmit={handleCreateOffering}
      />

      <AssignOfferingInstructorModal
        open={Boolean(assignOfferingTarget)}
        offering={assignOfferingTarget}
        query={assignOfferingInstructorQuery}
        instructors={instructors}
        onClose={() => {
          setAssignOfferingTarget(null);
          setAssignOfferingInstructorQuery("");
        }}
        onChangeQuery={setAssignOfferingInstructorQuery}
        onSubmit={handleAssignOfferingInstructor}
      />

      <EditCourseModal
        open={showEditCourseModal}
        title={editCourseTitle}
        description={editCourseDescription}
        onChangeTitle={setEditCourseTitle}
        onChangeDescription={setEditCourseDescription}
        onClose={() => setShowEditCourseModal(false)}
        onSubmit={handleSaveCourseChanges}
      />

      <AddBlockModal
        open={showAddBlockModal}
        selectedCourse={selectedCourse}
        blockName={newBlockName}
        onChangeBlockName={setNewBlockName}
        onClose={() => setShowAddBlockModal(false)}
        onSubmit={handleAddBlock}
      />

      <ManageBlockModal
        open={Boolean(selectedCourse && managingSection)}
        course={selectedCourse}
        sectionId={managingSection?.id || null}
        sectionName={managingSection?.name || ""}
        editingSectionName={editingSectionName}
        onChangeEditingSectionName={setEditingSectionName}
        assignedInstructors={
          managingSection ? sectionInstructors[managingSection.id] || [] : []
        }
        instructorQuery={manageBlockInstructorQuery}
        instructorOptions={instructors}
        onChangeInstructorQuery={setManageBlockInstructorQuery}
        onClose={() => setManagingSectionId(null)}
        onSaveName={handleSaveBlockName}
        onRemoveInstructor={handleRemoveBlockInstructor}
        onAssignInstructor={handleAssignInstructorToBlock}
      />
    </section>
  );
}
