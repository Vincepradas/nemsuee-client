import { useEffect, useState } from "react";

export function AdminSettingsPanel(props: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
}) {
  const { api, headers, setMessage } = props;
  const [jsonValue, setJsonValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePeriod, setActivePeriod] = useState<"1" | "2">("1");

  function extractSettings(payload: any) {
    if (payload && typeof payload === "object" && payload.settings && typeof payload.settings === "object") {
      return payload.settings as Record<string, any>;
    }
    if (payload && typeof payload === "object") {
      return payload as Record<string, any>;
    }
    return {};
  }

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await api("/admin/settings", { headers });
      setJsonValue(JSON.stringify(data || { settings: {} }, null, 2));
      const settings = extractSettings(data);
      setActivePeriod(String(settings.active_period || "1") === "2" ? "2" : "1");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Admin Settings</h3>
          <p className="text-xs text-slate-500">
            System-wide configuration payload.
          </p>
        </div>
        <button
          onClick={() => loadSettings()}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
        >
          Refresh
        </button>
      </div>
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">Grading Mode</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activePeriod}
            onChange={(e) => setActivePeriod(e.target.value === "2" ? "2" : "1")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="1">MIDTERM</option>
            <option value="2">FINALS</option>
          </select>
          <button
            onClick={async () => {
              try {
                const parsed = JSON.parse(jsonValue || "{}");
                const baseSettings = extractSettings(parsed);
                const nextSettings = { ...baseSettings, active_period: activePeriod };
                await api("/admin/settings", {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({ settings: nextSettings }),
                });
                setJsonValue(JSON.stringify({ settings: nextSettings }, null, 2));
                setMessage(`Active grading mode set to ${activePeriod === "2" ? "FINALS" : "MIDTERM"}.`);
              } catch (e) {
                setMessage(`Failed to update grading mode: ${(e as Error).message}`);
              }
            }}
            disabled={loading}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Apply Mode
          </button>
          <span className="text-xs text-slate-500">
            Controls grade computation context for instructors and students.
          </span>
        </div>
      </div>
      <textarea
        value={jsonValue}
        onChange={(e) => setJsonValue(e.target.value)}
        className="min-h-[340px] w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs"
        spellCheck={false}
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            try {
              const parsed = JSON.parse(jsonValue || "{}");
              if (!parsed || typeof parsed !== "object") {
                setMessage("Invalid JSON object.");
                return;
              }
              await api("/admin/settings", {
                method: "PATCH",
                headers,
                body: JSON.stringify(parsed),
              });
              setMessage("Admin settings saved.");
              await loadSettings();
            } catch (e) {
              setMessage(`Invalid JSON or request failed: ${(e as Error).message}`);
            }
          }}
          disabled={loading}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Save Settings
        </button>
      </div>
    </article>
  );
}
