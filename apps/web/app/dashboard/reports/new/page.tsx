import { ReportSubmissionForm } from './report-submission-form';

export default function NewReportPage() {
  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Submit Report</p>
        <h1>Create a new report.</h1>
        <p className="lede">
          Capture location, category, description, and optional media URLs in a single web
          flow that works against the existing report creation endpoint.
        </p>
      </section>

      <section className="panel-stack">
        <ReportSubmissionForm />
      </section>
    </main>
  );
}
