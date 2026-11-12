# Phase 2 — Premium record segregation (isolated)

- Every Premium category has an independent internal W/L/P/pending record.
- Only **Main Premium** contributes to the public Premium record.
- One existing Premium category slot can be featured as **Play of the Day**; its result is reflected in both the originating category and Play of the Day, without creating a second wager row.
- The public record payload contains Top 3, Main Premium, Dog of the Day and Play of the Day **aggregates only**. No Premium pick, opponent, odds or internal category breakdown is returned.
- Distinct-wager reporting deduplicates by date, sport, matchup, market, selection and odds; inconsistent grades for an identical wager fail closed.
- Synthetic example: NCAAB Premium Michigan -3.5 featured as Play of the Day. No claim that the real wager was placed or won.

Run: `node daily-card/model.test.mjs && node daily-card/records-phase2.test.mjs`.

**Not yet implemented or verified:** real admin UI, durable database schema/migrations, authenticated server-side publication, membership entitlement checks, Vercel preview, grading pipeline integration, production record migration, and CI execution. This module is an isolated domain prototype, not a production access-control mechanism.

Production Supabase, Vercel, existing records, and PRs remain untouched.
