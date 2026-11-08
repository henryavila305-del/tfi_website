# Phase 1 review — November 8, 2026

Branch: `design/tfi-website-phase1`. Draft PR only; production remains on hold.

## Fixes

- Content review made preview/no-live-data status explicit in the hero, described the results record as planned, and labeled the rising-line artwork as illustration rather than performance data. See RELEASE_REVIEW.md for the complete launch-readiness assessment.

- Replaced orphan result status terms with descriptions belonging to each metric. Added a named results landmark and named sports detail region.
- Made the main skip destination and mobile navigation destinations focusable. Mobile section selection moves focus before collapsing the menu.
- Scaled the mobile headline to fit 320px, kept the narrow header on one row, allowed action wrapping, and used a single-column hero at tablet widths.
- Preserved keyboard focus when crossing the mobile breakpoint: hidden desktop navigation hands focus to Menu; a hidden Menu hands focus to the first desktop navigation link.
- Increased small text-link/footer targets to at least 24px and FAQ summary targets to 44px. Added explicit system-color focus/borders for forced-colors mode and minimum-width safeguards for grid children.

## Verified

- Node source checks and static build pass. Anchor targets and local assets resolve; 20 unique IDs; three paired result terms/descriptions; JavaScript parses.
- Edge local-file review: full desktop window (1339px window), 400px mobile before fixes, 320px mobile after fixes, and 768px tablet after fixes.
- Desktop header/hero and public-board spacing; mobile header/hero, results, sports detail, Premium entry, FAQ and footer were visually inspected. Tablet header/hero were inspected.
- Mobile Menu opens; choosing Results collapses it and reaches Results. Escape collapses it and visibly returns focus to Menu.
- Shift-Tab reaches the visible skip link; Enter then Tab reaches the main content's free-picks link, skipping navigation.
- Keyboard Tab/Enter from Results activates NFL, updates the public-status panel, and shows its focus outline.
- FAQ expands its actual answer. Accessibility tree exposes named navigation/sections, only three result terms, and disabled Whop control.
- Browser Network panel showed only index.html, styles.css, app.js, and favicon.svg, all loaded successfully from local files. No remote site integration was added.
- Additional Edge review observed the header at 250% and 400% zoom. Resetting from 400% to desktop visibly moved keyboard focus to Free picks. This was targeted header/focus review, not a full-page zoom matrix.
- `node scripts/check-interactions.mjs` passes simulated menu opening, Escape, both breakpoint focus transitions, mobile section selection, and NBA status activation. These are state/focus regression checks using a lightweight DOM substitute, not browser or screen-reader tests. `npm run check` includes them.
- Six representative text/background color pairs were calculated at >=4.5:1: body, muted panel copy, muted sport-hover copy, Premium copy, primary button, and panel status. This is a source-color calculation, not a complete rendered contrast audit.
- Browser control subsequently recovered. The updated original hero's preview/no-live-data wording was visually verified in Edge.
- A local copy of the reviewed HTML with its script tag omitted (and only local asset paths adjusted) was opened in Edge. About navigation, native FAQ expansion, and Results navigation at 300% zoom worked. Navigation remained visible without a nonfunctional Menu toggle. This verifies the script-omitted fallback copy, not browser-wide JavaScript disabling on the original page or cross-engine behavior.
- Edge DevTools forced-colors emulation was applied to the original page. Hero/Premium text and controls remained visible, keyboard focus showed a distinct system-color outline on Membership questions, and Whop remained disabled in the accessibility tree and visually distinct. Emulation was removed and normal rendering verified afterward. This is targeted emulation coverage, not physical high-contrast-device or full-page certification.

## Limits

This is targeted manual Edge review, not a full WCAG certification or screen-reader audit. Chrome is installed, but launching it timed out at the app approval step. Firefox was absent from the checked standard installation paths. Safari, physical phones, original-page browser-wide JavaScript disabling, a full forced-colors pass, and a complete zoom matrix remain unverified. Responsive device and contrast emulation are not physical-device testing. HTTP preview routing remained unavailable; browser review used the same standalone source via a local file.

An earlier browser action stopped because Computer Use could not determine the browser URL confidently enough to enforce policy. No safety bypass was attempted. In a later session, normal control recovered by selecting the existing preview tab with a confirmed local URL; the script-omitted copy and forced-colors observations above were then completed. Static source review also confirms that navigation is present and the Menu button hidden before JavaScript runs, and FAQ uses native details/summary.

## Remaining browser checks

In an available approved browser, open the standalone site and verify: 320px reflow and 200%/400% full-page zoom; keyboard skip/Menu/Escape/sport/FAQ flow; navigation and FAQ with JavaScript disabled; forced-colors focus and disabled Whop distinction; a screen-reader pass of landmarks, headings, result descriptions and sport-panel focus. Repeat in Firefox and Safari on supported devices before claiming cross-engine coverage. Keep Whop disabled throughout these checks.

## Repeatable validation

- Expanded source checks validate every ARIA target, native FAQ controls, six sport links, navigation availability before JavaScript, and the hidden unenhanced Menu button. CSS remote imports/assets, JavaScript network clients, embedded services, and collection forms fail the current disconnected-preview checks.
- Simulated interaction checks now cover all six sports, ordinary Tab behavior, unrelated focus preservation across resize, and non-link clicks in addition to Menu/Escape/section and breakpoint transitions.
- `node scripts/check-build.mjs` passes: two builds, exactly four public output files, and byte-for-byte source matching. No test installs or external services are needed.
- PR-only `.github/workflows/validate.yml` is configured for Node 22/24 on Linux and Windows. It requests read-only contents, disables persisted checkout credentials, and has no deployment steps. A committed workflow is not evidence that CI ran; check the current commit's Actions results separately.

The official Whop destination is unverified, so its button stays disabled. Picks and results remain empty. Brand/content approval, official Whop URL, and public grading/publication rules remain prerequisites for any separately authorized launch.

No merge, deployment, domain connection, TFI Live Tracker, Supabase, live/private picks, or credential changes.
