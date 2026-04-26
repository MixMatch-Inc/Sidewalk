'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredRole } from '../lib/auth-storage';

const citizenLinks = [
  { href: '/dashboard/reports/new', label: 'Submit a report' },
  { href: '/dashboard/reports', label: 'My reports' },
];

const agencyLinks = [
  { href: '/dashboard/reports', label: 'Reports queue' },
  { href: '/dashboard/admin', label: 'Admin panel' },
];

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  const isAgency = role === 'agency' || role === 'admin';
  const links = isAgency ? agencyLinks : citizenLinks;
  const heading = isAgency ? 'Agency workspace' : 'Citizen workspace';

  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Dashboard</p>
        <h1>{heading}</h1>
      </section>

      <section className="surface-grid">
        {links.map(({ href, label }) => (
          <article className="surface-card" key={href}>
            <Link className="button button-primary" href={href}>
              {label}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
