import type { User } from "../../shared/types/lms";

export function Profile({ user }: { user: User }) {
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="space-y-4">
      <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{user.fullName}</h3>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>
        </div>
      </article>

      <article className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{user.role}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Account ID</p>
          <p className="mt-1 text-base font-semibold text-slate-900">#{user.id}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Student ID</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {user.studentId || "N/A"}
          </p>
        </div>
      </article>
    </section>
  );
}

