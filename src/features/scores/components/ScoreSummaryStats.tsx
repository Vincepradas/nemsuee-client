type ScoreSummaryStatsProps = {
  totalSubmissions: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
};

export function ScoreSummaryStats({
  totalSubmissions,
  passedCount,
  failedCount,
  averageScore,
}: ScoreSummaryStatsProps) {
  return (
    <div className="grid gap-2 md:grid-cols-4">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          Total Submissions
        </p>
        <p className="text-base font-semibold text-slate-900">{totalSubmissions}</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Passed</p>
        <p className="text-base font-semibold text-emerald-700">{passedCount}</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Failed</p>
        <p className="text-base font-semibold text-rose-700">{failedCount}</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Average Score</p>
        <p className="text-base font-semibold text-slate-900">{averageScore}%</p>
      </div>
    </div>
  );
}
