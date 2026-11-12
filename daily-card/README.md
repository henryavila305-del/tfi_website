# Daily Card Integration — Phase 1 (isolated prototype)

Run `node daily-card/model.test.mjs` on Node 22+. No dependencies, network calls, credentials, or database writes.

The November 10 fixture tests three Top 3 selections and three Premium category selections; Minnesota Wild ML is intentionally shared. Reporting distinguishes 3–3 category slots from 2–3 unique wagers.

Domain transitions: draft → approved → published. Approval requires an admin identifier; production integration MUST verify identity against `tfi_admins` server-side (the domain model alone is not authentication). Premiums must be approved/published at least two hours before game time; historical fixtures cannot publish. Published timestamps are generated from the current clock, never user input. Public projection includes Top 3 only.

**Not implemented:** live admin UI, Supabase persistence, authenticated API, scheduling, ESPN game matching, automated grading service, member-only Premium access, Vercel preview, and CI verification. These require reviewing the currently deployed website/tracker integration and existing security policies. Never treat the standalone domain model as a production-ready authorization boundary.

No production data, Supabase schema, Vercel deployment, or existing PRs were changed.
