import type { ReactElement } from "react";
import SignOutControl from "./signout-control";

const workspaces = [
  {
    name: "API",
    path: "apps/api",
    description: "Express authentication-first backend for the MVP."
  },
  {
    name: "Web",
    path: "apps/web",
    description: "Next.js contributor surface for citizen and admin journeys."
  },
  {
    name: "Mobile",
    path: "apps/mobile",
    description: "Expo workspace for mobile-first reporting and account flows."
  },
  {
    name: "Stellar Service",
    path: "apps/stellar-service",
    description: "Stellar network-facing service for receipts and wallet work."
  }
];

const milestones = [
  "Authentication",
  "Identity",
  "Reporting",
  "Case tracking",
  "Stellar verification"
];

export default function HomePage(): ReactElement {
  return (
    <main className="page-shell">
      <SignOutControl />
      <section className="hero">
        <p className="eyebrow">Open Source Hackathon Starter</p>
        <h1>Sidewalk is being rebuilt from a clean foundation.</h1>
        <p className="lede">
          This starter keeps the monorepo baseline and removes the legacy implementation so contributors can ship the MVP in clear milestones.
        </p>
      </section>

      <section className="panel-grid">
        {workspaces.map((workspace) => (
          <article className="panel" key={workspace.path}>
            <span className="panel-tag">{workspace.path}</span>
            <h2>{workspace.name}</h2>
            <p>{workspace.description}</p>
          </article>
        ))}
      </section>

      <section className="roadmap">
        <div>
          <p className="eyebrow">Build Order</p>
          <h2>Authentication ships first.</h2>
        </div>
        <ol>
          {milestones.map((milestone) => (
            <li key={milestone}>{milestone}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
