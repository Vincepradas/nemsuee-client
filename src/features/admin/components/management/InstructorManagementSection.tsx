import type { InstructorApplication } from "./types";

export function InstructorManagementSection(props: {
  applications: InstructorApplication[];
  onRefresh: () => void;
  onApprove: (userId: number) => void;
  onReject: (userId: number) => void;
}) {
  const { applications, onRefresh, onApprove, onReject } = props;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          Refresh Applications
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id} className="border-t border-slate-200">
                <td className="px-3 py-2">{application.fullName}</td>
                <td className="px-3 py-2">{application.email}</td>
                <td className="px-3 py-2">{application.status}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onApprove(application.userId)}
                      className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                    >
                      Approve Instructor
                    </button>
                    <button
                      onClick={() => onReject(application.userId)}
                      className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                    >
                      Reject Instructor
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!applications.length && (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center text-slate-500">
                  No instructor applications.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
