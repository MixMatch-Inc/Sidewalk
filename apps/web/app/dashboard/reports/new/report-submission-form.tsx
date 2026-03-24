'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { authenticatedJsonFetch } from '../../../lib/auth-fetch';

const categoryOptions = [
  'INFRASTRUCTURE',
  'SANITATION',
  'SAFETY',
  'LIGHTING',
  'TRANSPORT',
  'DRAINAGE',
  'UTILITIES',
  'TRAFFIC',
  'OTHER',
] as const;

type CreateReportResponse = {
  report_id: string;
};

export function ReportSubmissionForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>('INFRASTRUCTURE');
  const [latitude, setLatitude] = useState('6.6018');
  const [longitude, setLongitude] = useState('3.3515');
  const [mediaUrls, setMediaUrls] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useBrowserLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Browser geolocation is not available.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
      },
      () => {
        setError('Unable to read current location. You can enter coordinates manually.');
      },
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await authenticatedJsonFetch<CreateReportResponse>('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          media_urls: mediaUrls
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
          location: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          },
        }),
      });

      router.replace(`/dashboard/reports/${payload.report_id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            className="input-area"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof categoryOptions)[number])
            }
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="two-column-grid">
          <label className="field">
            <span>Latitude</span>
            <input value={latitude} onChange={(event) => setLatitude(event.target.value)} required />
          </label>

          <label className="field">
            <span>Longitude</span>
            <input value={longitude} onChange={(event) => setLongitude(event.target.value)} required />
          </label>
        </div>

        <button className="button button-secondary" type="button" onClick={useBrowserLocation}>
          Use current browser location
        </button>

        <label className="field">
          <span>Media URLs</span>
          <textarea
            className="input-area"
            rows={4}
            value={mediaUrls}
            onChange={(event) => setMediaUrls(event.target.value)}
            placeholder="One URL per line"
          />
        </label>

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Submitting…' : 'Submit report'}
        </button>
      </form>

      {error ? <p className="status-note error">{error}</p> : null}
    </section>
  );
}
