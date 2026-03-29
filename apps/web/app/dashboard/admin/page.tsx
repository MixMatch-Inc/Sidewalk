import { AdminQueue } from './queue';

export default function AdminDashboardPage() {
  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Admin Queue</p>
        <h1>Triage incoming reports.</h1>
        <p className="lede">
          Filter recent reports, review integrity state, and anchor a status update from a
          single moderation screen.
        </p>
      </section>

      <section className="panel-stack">
        <AdminQueue />
      </section>
    </main>
  );
}
