import { ReportDetail } from './report-detail';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Report Detail</p>
        <h1>Track report progress.</h1>
        <p className="lede">
          Review the report body, media references, anchor state, and the recorded status
          timeline in one place.
        </p>
      </section>

      <section className="panel-stack">
        <ReportDetail reportId={reportId} />
      </section>
    </main>
  );
}
