export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Dashboard</p>
        <h1>Authenticated workspace.</h1>
        <p className="lede">
          This protected shell confirms web sessions can be restored through the refresh
          cookie flow before additional citizen or admin dashboards land.
        </p>
      </section>

      <section className="surface-grid">
        <article className="surface-card">
          <h2>Session guard</h2>
          <p>Protected routes redirect back to OTP login when no access token or refresh path exists.</p>
        </article>
        <article className="surface-card">
          <h2>Reports</h2>
          <p>Open the reports workspace to submit new reports or inspect the authenticated list and detail flows.</p>
        </article>
        <article className="surface-card">
          <h2>Ready for expansion</h2>
          <p>This route can host report queues and detail screens without changing the auth contract.</p>
        </article>
      </section>
    </main>
  );
}
