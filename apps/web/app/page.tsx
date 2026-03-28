import Link from "next/link";

const surfaces = [
  {
    title: "API",
    description: "Express backend with auth, reports, media, and worker-backed anchoring.",
  },
  {
    title: "Web",
    description: "New Next.js surface for diagnostics and future citizen and admin flows.",
  },
  {
    title: "Mobile",
    description: "Expo app for field reporting and citizen status tracking.",
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Sidewalk Monorepo</p>
        <h1>Build civic reporting across API, web, mobile, and Stellar services.</h1>
        <p className="lede">
          This workspace now includes a standalone Next.js application so frontend,
          backend, and mobile contributors can work in parallel without inventing local setup.
        </p>
        <div className="actions">
          <Link className="button button-primary" href="/auth/request-otp">
            Open auth flow
          </Link>
          <Link className="button button-primary" href="/health">
            Open health page
          </Link>
          <a
            className="button button-secondary"
            href="https://github.com/MixMatch-Inc/Sidewalk"
            target="_blank"
            rel="noreferrer"
          >
            View repository
          </a>
        </div>
      </section>

      <section className="surface-grid" aria-label="Workspace surfaces">
        {surfaces.map((surface) => (
          <article className="surface-card" key={surface.title}>
            <h2>{surface.title}</h2>
            <p>{surface.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
