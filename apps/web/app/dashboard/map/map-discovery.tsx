'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { authenticatedJsonFetch } from '../lib/auth-fetch';

type MapReport = { _id: string; title: string; category: string; status: string; lat: number; lng: number };
type MapQueryResponse = { data: MapReport[] };

type QueryMode = 'radius' | 'bounds';

export function MapDiscovery() {
  const [mode, setMode] = useState<QueryMode>('radius');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('1000');
  const [minLat, setMinLat] = useState('');
  const [maxLat, setMaxLat] = useState('');
  const [minLng, setMinLng] = useState('');
  const [maxLng, setMaxLng] = useState('');
  const [results, setResults] = useState<MapReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const q = new URLSearchParams();
      if (mode === 'radius') {
        q.set('lat', lat); q.set('lng', lng); q.set('radius', radius);
      } else {
        q.set('minLat', minLat); q.set('maxLat', maxLat);
        q.set('minLng', minLng); q.set('maxLng', maxLng);
      }
      const payload = await authenticatedJsonFetch<MapQueryResponse>(`/api/reports/map?${q.toString()}`);
      setResults(payload.data);
      if (payload.data.length === 0) setError('No reports found in this area.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Map query failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="auth-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field"><span>Query mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as QueryMode)}>
              <option value="radius">Radius</option>
              <option value="bounds">Bounds</option>
            </select>
          </label>

          {mode === 'radius' ? (
            <>
              <label className="field"><span>Latitude</span><input required value={lat} onChange={(e) => setLat(e.target.value)} placeholder="6.5244" /></label>
              <label className="field"><span>Longitude</span><input required value={lng} onChange={(e) => setLng(e.target.value)} placeholder="3.3792" /></label>
              <label className="field"><span>Radius (m)</span><input required value={radius} onChange={(e) => setRadius(e.target.value)} /></label>
            </>
          ) : (
            <>
              <label className="field"><span>Min lat</span><input required value={minLat} onChange={(e) => setMinLat(e.target.value)} /></label>
              <label className="field"><span>Max lat</span><input required value={maxLat} onChange={(e) => setMaxLat(e.target.value)} /></label>
              <label className="field"><span>Min lng</span><input required value={minLng} onChange={(e) => setMinLng(e.target.value)} /></label>
              <label className="field"><span>Max lng</span><input required value={maxLng} onChange={(e) => setMaxLng(e.target.value)} /></label>
            </>
          )}

          <button className="button button-primary" disabled={isLoading} type="submit">
            {isLoading ? 'Searching…' : 'Search area'}
          </button>
        </form>
      </section>

      {error && <p className="status-note error">{error}</p>}

      <section className="surface-grid report-grid">
        {results.map((r) => (
          <article className="surface-card" key={r._id}>
            <p className="eyebrow">{r.category}</p>
            <h2>{r.title}</h2>
            <p className="helper-copy">{r.status} · {r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
            <Link className="button button-secondary" href={`/dashboard/reports/${r._id}`}>Open report</Link>
          </article>
        ))}
      </section>
    </>
  );
}
