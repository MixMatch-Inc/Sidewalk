'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchPublicReports, fetchPublicReportDetail, PublicReport, MapBounds } from '@/lib/api/map';

// Default bounds — replace with your pilot city's bounding box
const DEFAULT_BOUNDS: MapBounds = {
  north: 51.55, south: 51.45,
  east: -0.08,  west: -0.18,
};

const STATUS_COLORS: Record<string, string> = {
  open:     '#E24B4A',
  pending:  '#BA7517',
  resolved: '#639922',
};

export default function MapPage() {
  const [reports, setReports]           = useState<PublicReport[]>([]);
  const [selected, setSelected]         = useState<PublicReport | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter]       = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPublicReports(DEFAULT_BOUNDS, {
        status: statusFilter,
        category: catFilter,
        district: districtFilter,
      });
      setReports(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, catFilter, districtFilter]);

  useEffect(() => { load(); }, [load]);

  const categories = ['all', 'pothole', 'lighting', 'graffiti', 'drainage', 'other'];
  const districts  = ['all', 'north', 'south', 'east', 'west'];

  return (
    <main className="flex flex-col gap-4 max-w-4xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-medium">Public map</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse reported issues in your area. Only public information is shown.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
        <select className="select" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
          {districts.map(d => (
            <option key={d} value={d}>{d === 'all' ? 'All districts' : d + ' ward'}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {Object.entries(STATUS_COLORS).map(([s, color]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Map area */}
      {/* TODO: replace this placeholder with your MapLibre / Leaflet / Google Maps component.
          Pass reports, onMarkerClick, and bounds as props.
          The MapCanvas below is a lightweight substitute for development. */}
      <div className="card p-0 overflow-hidden">
        <MapCanvas
          reports={reports}
          loading={loading}
          onSelect={setSelected}
          selected={selected}
        />
      </div>

      {/* Selected report detail */}
      {selected && (
        <div className="card flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{selected.id}</span>
              <StatusBadge status={selected.status} />
            </div>
            <p className="text-sm">{selected.shortDescription}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selected.category} · {selected.district} · {selected.createdAt}
            </p>
          </div>
          <a href={`/reports/${selected.id}`} className="text-sm text-primary underline-offset-4 hover:underline whitespace-nowrap">
            Full report →
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-destructive text-sm text-destructive">{error}</div>
      )}

      {/* List view */}
      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_100px_90px] text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2 bg-muted">
          <span>ID</span><span>Description</span><span>Category</span><span>Status</span>
        </div>
        {loading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
        {!loading && reports.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">No reports match the current filters.</p>
        )}
        {reports.map(r => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="grid grid-cols-[80px_1fr_100px_90px] px-3 py-2.5 text-left text-sm border-t w-full hover:bg-muted/50 transition-colors"
          >
            <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
            <span className="truncate">{r.shortDescription}</span>
            <span className="text-muted-foreground">{r.category}</span>
            <span><StatusBadge status={r.status} /></span>
          </button>
        ))}
      </div>
    </main>
  );
}

/* ---- Lightweight dev-mode map canvas (replace with real map library) ---- */
function MapCanvas({
  reports, loading, onSelect, selected,
}: {
  reports: PublicReport[];
  loading: boolean;
  onSelect: (r: PublicReport) => void;
  selected: PublicReport | null;
}) {
  return (
    <div className="relative bg-muted h-80 w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
      {/* Each report rendered as a proportional dot over a placeholder bg.
          Replace this div with <MapLibreMap /> or <LeafletMap /> bound to reports. */}
      {reports.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          title={r.shortDescription}
          style={{
            position: 'absolute',
            left: `${normalizeLng(r.lng)}%`,
            top:  `${normalizeLat(r.lat)}%`,
            width:  selected?.id === r.id ? 14 : 10,
            height: selected?.id === r.id ? 14 : 10,
            borderRadius: '50%',
            background: STATUS_COLORS[r.status] ?? '#888',
            border: selected?.id === r.id ? '2px solid white' : 'none',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        />
      ))}
    </div>
  );
}

function normalizeLng(lng: number) {
  return ((lng - DEFAULT_BOUNDS.west) / (DEFAULT_BOUNDS.east - DEFAULT_BOUNDS.west)) * 100;
}
function normalizeLat(lat: number) {
  return ((DEFAULT_BOUNDS.north - lat) / (DEFAULT_BOUNDS.north - DEFAULT_BOUNDS.south)) * 100;
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    open:     'badge-destructive',
    pending:  'badge-warning',
    resolved: 'badge-success',
  }[status] ?? 'badge-secondary';
  return <span className={`badge ${cls}`}>{status}</span>;
}