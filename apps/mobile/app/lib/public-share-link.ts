/**
 * Utilities for generating and managing shareable public report links
 */

export function generatePublicReportUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || 'https://sidewalk.app';
  return `${base}/reports/${slug}`;
}

export function generateShareText(report: { title: string; slug: string }): string {
  const url = generatePublicReportUrl(report.slug);
  return `Check out this report: "${report.title}"\n\n${url}`;
}

export function isPublicSlug(slug: string): boolean {
  return /^[a-z][a-z0-9]{7}$/.test(slug);
}

export function extractSlugFromUrl(url: string): string | null {
  const match = url.match(/\/reports\/([a-z][a-z0-9]{7})/);
  return match ? match[1] : null;
}
