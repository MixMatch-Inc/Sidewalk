import { ReportsList } from './reports-list';

export default function ReportsPage() {
  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Reports</p>
        <h1>Browse submitted reports.</h1>
        <p className="lede">
          Review report summaries, filter by category or status, and open detail pages with
          timelines and anchor state.
        </p>
      </section>

      <section className="panel-stack">
        <ReportsList />
      </section>
    </main>
  );
}
