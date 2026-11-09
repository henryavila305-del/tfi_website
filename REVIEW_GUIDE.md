# PR #5 review checklist

Status: open draft. Merge, publication and deployment are not authorized. This is the current review entry point; owner approval records remain in [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md).

## Holds — must remain in place

- [x] Real public content is exactly an empty array in content/public-picks.json.
- [x] Direct production builds reject nonempty pick lists before writing output.
- [x] vercel.json retains git.deploymentEnabled=false. GitHub Actions validates only.
- [x] No private/member selections, tracker, database, credentials, live feed, DNS or hosting changes are included.
- [x] PR remains an unmerged draft. Existing hosting is unaffected; the branch configuration does not prove every external hosting setting.

## Completed safeguards

- [x] Strict public-entry fields, individual public-approval flag/reference, safe text, canonical UTC timestamps and publication before event.
- [x] Escaped static cards with named article headings, native metadata/time elements, unique IDs and separate validated content/status slots. Empty rendering preserves the reviewed page byte for byte.
- [x] Synthetic withdrawn entries require approval/reference, reason and UTC time; cards retain the entry and exclude it from win percentage. Approval identifiers are not rendered.
- [x] Synthetic correction records require approval/reference, reason, ordered UTC times and continuous old/new odds or result values. Original odds/result remain recorded; history is visible and the latest grade drives the separate public-board statistics.
- [x] Positive American odds retain the + sign in original values and correction history.
- [x] Prior-snapshot comparison rejects deleted/renamed picks, changed original fields and edited/reordered/truncated prior corrections; valid new corrections may be appended.
- [x] Read-only history CLI requires explicit distinct regular snapshot files and rejects same-file/path/hard-link self-comparison.
- [x] Tests cover inconsistent and self-consistent rewrites, frozen sources, interleaved corrections, malformed inputs, missing approval, unsafe text, corrected statistics and unchanged real content.
- [x] Isolated and full-page synthetic fixtures include script-free output, withdrawals, corrections and long wrapping text. They remain ignored and excluded from production output.
- [x] Build checks enforce exactly five static assets, reject unexpected/nonregular output without deleting it, and verify repeatable byte-for-byte output.
- [x] Earlier layout fixes cover card stacking, forced-color chart paints, narrow college labels and membership-action spacing. Public contact is a plain Twitter/X link.

These are code/format safeguards. Approval fields do not prove actual approval. A supplied baseline is not authenticated storage. See the blockers below.

## Decisions already recorded — do not request them again

| Decision | Approved scope / reference |
| --- | --- |
| Whop plans | All Access $35.99/month; Premium $9.99/month. WHOP-PLAN-PRICE-01. |
| Branding/copy/history disclosures | Version-specific approval at b5f03924d0fc8a96a84512d04033f1ca3344823b. BRAND-CONTENT-01; substantive later changes need fresh review. |
| Pick eligibility and timing | Individual owner approval, exclude private/member picks, actual pre-event UTC publication, no backdating. PUBLIC-PICK-APPROVAL-01 / TIMING-01. |
| Sources and original odds | DraftKings New York; ESPN final-result reference. Capture odds at first posting, preserve originals and show separate corrections. PUBLIC-PICK-SOURCES-01 / JURISDICTION-01 / PRICE-01. |
| Grading and reporting | Individual grade approval; pushes/voids excluded from win percentage; postponements pending until approved; visible corrections. Withhold stakes, units, profit and ROI. PUBLIC-PICK-GRADING-01 / METRICS-01. |
| Withdrawals | Individual approval, retained entry with reason/UTC time, exclude from win percentage. PUBLIC-PICK-WITHDRAWAL-01. |
| Contact | Twitter/X @thefavindex; no email supplied. PUBLIC-CONTACT-01. |
| Domain/provider/project | thefavindex.com; Vercel; screenshot-supplied project the-favorite-index under henryavila305-8922. PRIMARY-DOMAIN-01 / HOSTING-PROVIDER-01 / HOSTING-PROJECT-URL-01. |

Project dashboard: https://vercel.com/henryavila305-8922/the-favorite-index. Owner screenshot showed an existing main deployment at fae4e41 and www.thefavindex.com. This is supplied evidence, not a live account/DNS audit or permission to change hosting.

## Remaining gates before real picks

- [ ] Define and implement trustworthy per-pick, per-grade, withdrawal and correction approval evidence; public-safe identifiers must correspond to genuine owner approvals.
- [ ] Capture verifiable actual-first-publication time and DraftKings NY source evidence, including exact event/wager-market context. Typed dates alone cannot prove a public release or prevent backdating.
- [ ] Capture ESPN final-result evidence and approved settlement/postponement handling; selected sources are not connected.
- [ ] Select/store a trusted complete prior baseline and require retention comparison in every future publication/update path. A copied/replaced baseline or disabled checker defeats caller-supplied comparison.
- [ ] Implement a retained event-based withdrawal lifecycle for previously recorded picks. The current comparator deliberately rejects changing the original result into withdrawn; it must not be bypassed by deleting history.
- [ ] Resolve durable retention across versions. Single-snapshot validation and read-only comparison do not provide immutable storage or detect concurrent file-content edits.
- [ ] Review and separately authorize any future change enabling nonempty production content. No actual pick/grade/withdrawal is approved by general policy decisions.

These gates apply to real-pick publication. They are not permission to launch an empty-board site; that requires the separate website/release gates below.

## Remaining website and release gates

- [ ] Supply/approve final legal, privacy and responsible-wagering copy, placement and applicable entity details. Confirm intended site data practices and external Whop checkout behavior; no legal requirements or entity facts are invented here.
- [ ] Complete current-page browser/accessibility review: withdrawal/correction narrow-width reflow and zoom, actual keyboard focus, forced-colors rendering, screen-reader output, Firefox/Safari and physical devices.
- [ ] Recheck the two existing Whop destinations and public contact link before any release. Displayed plan/price approval does not independently verify checkout ownership or current destination behavior.
- [ ] Confirm future Vercel target environment and deployment method, account authority/DNS owner, apex/www redirects and canonical-domain behavior. Primary domain and provider are already selected.
- [ ] Choose release scope (empty board or separately enabled approved picks), audience, exact commit, environment, rollback plan and independent merge/publication/deployment authorization. Neither hold changes through this checklist.

## Validation evidence and its limits

Latest verified implementation head: 0a094ba24dc72ce09c678ba48a8a718af53399f5. [GitHub run 42676409161](https://github.com/henryavila305-del/tfi_website/actions/runs/42676409161) passed all four Node 22/24 Linux/Windows jobs, including mandatory hard-link alias tests. Earlier workflow-level internal server failures were superseded by this successful run. Recheck CI for every later head, including documentation changes.

Run npm run check and npm run build:check (Node 22+; no dependencies). Local hard-link creation is permission-restricted; the test reports that limitation locally and must run in CI. Tests use isolated temporary synthetic files, not production picks.

| Evidence | Scope |
| --- | --- |
| [CORRECTION_QA.md](CORRECTION_QA.md) | Correction/retention source checks and automated tests, including distinct-file safeguards. No correction-history browser pass. |
| [WITHDRAWAL_QA.md](WITHDRAWAL_QA.md) | Withdrawal markup/style review and automated assertions only. Actual new-card keyboard/forced-colors/reflow checks remain unfinished after local-file browser access was refused. |
| [PICK_CARD_QA.md](PICK_CARD_QA.md), [KEYBOARD_CONTRAST_QA.md](KEYBOARD_CONTRAST_QA.md), [ZOOM_QA.md](ZOOM_QA.md) | Earlier bounded Edge card/integration/keyboard/contrast and 400% section observations. They do not verify later withdrawal/correction fixtures or certify universal accessibility. |
| [HISTORY_REVIEW.md](HISTORY_REVIEW.md), [QA.md](QA.md) | Imported-history scope and historical Phase 1 evidence; not proof for the current page or real-pick approval. |

## Review order

1. scripts/public-picks.mjs: contract, statistics, immutable-field and correction-prefix comparison.
2. scripts/check-public-pick-history.mjs: distinct-file/read-only baseline comparison and fail-closed errors.
3. scripts/render-public-picks.mjs: escaping, retained originals/history, hidden approval identifiers and slot/ID guards.
4. scripts/check-public-picks.mjs and rendering/preview checks: negative cases, retained records and synthetic-only boundaries.
5. scripts/build.mjs, scripts/check-build-safety.mjs and scripts/check-build.mjs: publication hold and output allowlist.
6. [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md): full approval records and exact remaining inputs.

Safe next work: design/test trustworthy baseline selection with synthetic snapshots, or prepare a reviewable legal/privacy draft from verified owner facts. Neither requires private picks, live feeds, hosting changes or lifting a hold.
