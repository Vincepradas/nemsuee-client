import type { User } from "../../shared/types/lms";

export type UserPreferences = {
  notificationsEnabled: boolean;
  emailDigestEnabled: boolean;
  compactTables: boolean;
  showQuickTips: boolean;
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsPanel({
  user,
  preferences,
  onChange,
}: {
  user: User;
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
}) {
  return (
    <section className="space-y-4">
      <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
        <p className="text-sm text-slate-600">
          Personalize your LMS experience, {user.fullName.split(" ")[0]}.
        </p>
      </article>

      <article className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <Toggle
          label="Enable Notifications"
          description="Show in-app notifications and updates in the header."
          checked={preferences.notificationsEnabled}
          onChange={(value) =>
            onChange({ ...preferences, notificationsEnabled: value })
          }
        />
        <Toggle
          label="Email Digest"
          description="Receive summary emails for major academic activity."
          checked={preferences.emailDigestEnabled}
          onChange={(value) =>
            onChange({ ...preferences, emailDigestEnabled: value })
          }
        />
        <Toggle
          label="Compact Tables"
          description="Reduce table row spacing in data-heavy pages."
          checked={preferences.compactTables}
          onChange={(value) => onChange({ ...preferences, compactTables: value })}
        />
        <Toggle
          label="Show Quick Tips"
          description="Display onboarding helper tips in dashboard modules."
          checked={preferences.showQuickTips}
          onChange={(value) => onChange({ ...preferences, showQuickTips: value })}
        />
      </article>
    </section>
  );
}
