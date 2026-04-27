/**
 * contributorTemplates.ts
 * Generates GitHub contributor template content for issues, PRs, and bug reports.
 * Closes #201
 */

export type TemplateKind = "feature" | "bug" | "pull_request";

interface TemplateSection {
  heading: string;
  placeholder: string;
}

const SECTIONS: Record<TemplateKind, TemplateSection[]> = {
  feature: [
    { heading: "## Summary", placeholder: "Brief description of the feature." },
    { heading: "## Motivation", placeholder: "Why is this needed?" },
    { heading: "## Acceptance Criteria", placeholder: "- [ ] Criterion one\n- [ ] Criterion two" },
    { heading: "## Testing", placeholder: "Describe how this can be verified." },
    { heading: "## Environment", placeholder: "Node version, OS, relevant config." },
  ],
  bug: [
    { heading: "## Description", placeholder: "What went wrong?" },
    { heading: "## Steps to Reproduce", placeholder: "1. Step one\n2. Step two" },
    { heading: "## Expected Behaviour", placeholder: "What should have happened?" },
    { heading: "## Actual Behaviour", placeholder: "What actually happened?" },
    { heading: "## Environment", placeholder: "Node version, OS, relevant config." },
  ],
  pull_request: [
    { heading: "## Changes", placeholder: "What does this PR do?" },
    { heading: "## Related Issues", placeholder: "Closes #" },
    { heading: "## Testing", placeholder: "How was this tested?" },
    { heading: "## Checklist", placeholder: "- [ ] Lint passes\n- [ ] Types pass\n- [ ] Tests pass" },
  ],
};

export function renderTemplate(kind: TemplateKind): string {
  return SECTIONS[kind]
    .map(({ heading, placeholder }) => `${heading}\n\n${placeholder}`)
    .join("\n\n---\n\n");
}

export function allTemplates(): Record<TemplateKind, string> {
  return {
    feature: renderTemplate("feature"),
    bug: renderTemplate("bug"),
    pull_request: renderTemplate("pull_request"),
  };
}
