import { useMemo, useState } from "react";
import type { CatalogCourse } from "../../../../shared/types/lms";

export function StudentCatalogPanel(props: {
  studentViewMode: "all" | "my" | "search";
  userRole: string;
  catalogQuery: string;
  setCatalogQuery: (v: string) => void;
  loadCatalog: (query?: string) => void;
  catalog: CatalogCourse[];
  selectedCatalogCourseId: number | null;
  setSelectedCatalogCourseId: (id: number | null) => void;
  selectedCatalogCourse: CatalogCourse | null;
  showEnrollRequest: Record<number, boolean>;
  setShowEnrollRequest: (v: any) => void;
  keyInput: Record<number, string>;
  setKeyInput: (v: any) => void;
  requestEnroll: (courseId: number) => Promise<void>;
}) {
  const {
    studentViewMode,
    userRole,
    catalogQuery,
    setCatalogQuery,
    loadCatalog,
    catalog,
    selectedCatalogCourseId,
    setSelectedCatalogCourseId,
    selectedCatalogCourse,
    showEnrollRequest,
    setShowEnrollRequest,
    keyInput,
    setKeyInput,
    requestEnroll,
  } = props;
  const [showSearchOptions, setShowSearchOptions] = useState(false);

  const getInstructorLabel = (course: CatalogCourse) => {
    const names = (course.instructors || []).map((i) => i.fullName).filter(Boolean);
    if (names.length) return names.join(", ");
    return course.instructor?.fullName || "TBA";
  };

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    if (!query) return catalog.slice(0, 12);
    return catalog
      .filter((course) => {
        const title = course.title.toLowerCase();
        const instructors = getInstructorLabel(course).toLowerCase();
        return title.includes(query) || instructors.includes(query);
      })
      .slice(0, 12);
  }, [catalog, catalogQuery]);

  if (userRole !== "STUDENT" || studentViewMode === "my") return null;

  return (
    <div className="space-y-3" data-students-hub="true">
      <div className="rounded-md border border-slate-200 p-3">
        <h3 className="mb-2 font-semibold">Discover Courses</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadCatalog(catalogQuery);
            setShowSearchOptions(true);
          }}
          className="mb-2 flex gap-2"
        >
          <div className="relative w-full">
            <input
              value={catalogQuery}
              onFocus={() => {
                if (!catalog.length) loadCatalog("");
                setShowSearchOptions(true);
              }}
              onChange={(e) => {
                setCatalogQuery(e.target.value);
                setShowSearchOptions(true);
              }}
              className="w-full rounded border border-slate-300 p-2 text-sm"
              placeholder="Search course or instructor"
            />
            {showSearchOptions && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded border border-slate-200 bg-white p-1 shadow-lg">
                {filteredCatalog.length ? (
                  filteredCatalog.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setCatalogQuery(course.title);
                        setSelectedCatalogCourseId(course.id);
                        setShowSearchOptions(false);
                      }}
                      className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      <p className="truncate font-medium text-slate-800">
                        {course.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {getInstructorLabel(course)}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-2 text-sm text-slate-500">
                    No matching courses.
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            data-keep-action-text="true"
            className="rounded bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Search
          </button>
        </form>
      </div>

      <div className="rounded-md border border-slate-200 p-3">
        <h3 className="mb-2 font-semibold">Available Courses</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(catalogQuery.trim() ? catalog : catalog.slice(0, 5))
            .slice(0, 5)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatalogCourseId(c.id)}
                className={`w-full rounded border p-2 text-left text-sm ${selectedCatalogCourseId === c.id ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white"}`}
              >
                <p className="font-semibold truncate">{c.title}</p>
                <p className="text-slate-500 truncate">
                  Instructor: {getInstructorLabel(c)}
                </p>
                <p className="text-slate-500">
                  Status: {c.enrollmentStatus || "NOT_REQUESTED"}
                </p>
              </button>
            ))}
          {!catalog.length && (
            <p className="text-sm text-slate-500">No courses found.</p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 p-3">
        <h3 className="mb-2 font-semibold">Enrollment Process</h3>
        {!selectedCatalogCourse && (
          <p className="text-sm text-slate-500">
            Select a course from Discover Courses first.
          </p>
        )}
        {selectedCatalogCourse && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{selectedCatalogCourse.title}</p>
            <p>{selectedCatalogCourse.description}</p>
            <p className="text-slate-500">
              Instructor: {getInstructorLabel(selectedCatalogCourse)}
            </p>
            <p className="text-slate-500">
              Current Status:{" "}
              {selectedCatalogCourse.enrollmentStatus || "NOT_REQUESTED"}
            </p>
            <div>
              <button
                disabled={
                  selectedCatalogCourse.enrollmentStatus === "APPROVED" ||
                  selectedCatalogCourse.enrollmentStatus === "PENDING"
                }
                onClick={() =>
                  setShowEnrollRequest((p: any) => ({
                    ...p,
                    [selectedCatalogCourse.id]: !p[selectedCatalogCourse.id],
                  }))
                }
                className="rounded bg-slate-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {selectedCatalogCourse.enrollmentStatus === "APPROVED"
                  ? "Enrolled"
                  : selectedCatalogCourse.enrollmentStatus === "PENDING"
                    ? "Pending Approval"
                    : showEnrollRequest[selectedCatalogCourse.id]
                      ? "Close Enrollment Form"
                      : "Proceed to Enrollment"}
              </button>
            </div>
            {showEnrollRequest[selectedCatalogCourse.id] &&
              selectedCatalogCourse.enrollmentStatus !== "APPROVED" &&
              selectedCatalogCourse.enrollmentStatus !== "PENDING" && (
                <div className="flex gap-2">
                  <input
                    value={keyInput[selectedCatalogCourse.id] || ""}
                    onChange={(e) =>
                      setKeyInput((p: any) => ({
                        ...p,
                        [selectedCatalogCourse.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 p-2"
                    placeholder="Enrollment key"
                  />
                  <button
                    onClick={() => requestEnroll(selectedCatalogCourse.id)}
                    className="rounded bg-blue-700 px-3 py-2 text-white"
                  >
                    Submit Request
                  </button>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
