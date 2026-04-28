'use client';
import { useState, useEffect } from 'react';
import { fetchAnalytics, AnalyticsData } from '@/lib/api/analytics';

const RANGE_OPTIONS = [
  { label: 'Last 7 days',  value: 7  },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  open:     '#E24B4A',
  pending:  '#BA7517',
  resolved: '#639922',
  rejected: '#888780',
};

export default function AnalyticsPage() {
  const [range, setRange]       = useState(30);
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchAnalytics(range)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System health, throughput, and SLA metrics.
          </p>
        </div>
        <select
          className="select"
          value={range}
          onChange={e => setRange(Number(e.target.value))}
        >
          {RANGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="card border-destructive text-sm text-destructive">{error}</div>
      )}

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {data && (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Total reports"
              value={data.summary.totalReports.toLocaleString()}
              sub={`${data.summary.periodChange >= 0 ? '+' : ''}${data.summary.periodChange}% vs prior period`}
            />
            <MetricCard
              label="Open backlog"
              value={data.summary.openBacklog.toLocaleString()}
              sub={`${((data.summary.openBacklog / data.summary.totalReports) * 100).toFixed(1)}% of total`}
            />
            <MetricCard
              label="SLA breaches"
              value={data.summary.slaBreaches.toLocaleString()}
              sub={`${((data.summary.slaBreaches / data.summary.totalReports) * 100).toFixed(1)}% breach rate`}
            />
            <MetricCard
              label="Avg resolution"
              value={`${data.summary.avgResolutionDays}d`}
              sub="Median time to resolve"
            />
          </div>

          {/* Status + Category breakdowns */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By status</p>
              {data.byStatus.map(s => (
                <BarRow
                  key={s.status}
                  label={s.status}
                  count={s.count}
                  pct={s.pct}
                  color={STATUS_COLORS[s.status]}
                />
              ))}
            </div>
            <div className="card space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By category</p>
              {data.byCategory.map(c => (
                <BarRow
                  key={c.category}
                  label={c.category}
                  count={c.count}
                  pct={c.pct}
                />
              ))}
            </div>
          </div>

          {/* District table */}
          <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_60px_70px_80px_100px] text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2 bg-muted">
              <span>District</span>
              <span>Open</span>
              <span>Pending</span>
              <span>Resolved</span>
              <span>SLA breach</span>
            </div>
            {data.byDistrict.map(d => {
              const total = d.open + d.pending + d.resolved;
              return (
                <div
                  key={d.district}
                  className="grid grid-cols-[1fr_60px_70px_80px_100px] px-3 py-2.5 text-sm border-t"
                >
                  <span>{d.district}</span>
                  <span className="text-destructive">{d.open}</span>
                  <span className="text-warning-foreground">{d.pending}</span>
                  <span className="text-success-foreground">{d.resolved}</span>
                  <span className="text-destructive">
                    {d.slaBreaches}{' '}
                    <span className="text-muted-foreground text-xs">
                      ({((d.slaBreaches / total) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Daily volume trend */}
          <div className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Daily volume
            </p>
            <TrendChart data={data.dailyVolume} />
          </div>
        </>
      )}
    </main>
  );
}

/* ---- Sub-components ---- */

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted rounded-md p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({
  label, count, pct, color,
}: {
  label: string; count: number; pct: number; color?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count.toLocaleString()} ({pct}%)
        </span>
      </div>
      <div className="bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color ?? 'currentColor', opacity: color ? 1 : 0.4 }}
        />
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.date}: ${d.count} reports`}
            className="flex-1 bg-muted-foreground/20 rounded-sm hover:bg-primary/30 transition-colors cursor-default"
            style={{ height: `${Math.round((d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
            {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1)
              ? new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : ''}
          </div>
        ))}
      </div>
    </div>
  );
}