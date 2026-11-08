# Phase 1 review — November 8, 2026

Branch: `design/tfi-website-phase1`. Draft PR only; production remains on hold.

## Fixes

- Replaced orphan result status terms with descriptions belonging to each metric. Added a named results landmark and named sports detail region.
- Made the main skip destination and mobile navigation destinations focusable. Mobile section selection moves focus before collapsing the menu.
- Scaled the mobile headline to fit 320px, kept the narrow header on one row, allowed action wrapping, and used a single-column hero at tablet widths.

## Verified

- Node source checks and static build pass. Anchor targets and local assets resolve; 20 unique IDs; three paired result terms/descriptions; JavaScript parses.
- Edge local-file review: full desktop window (1339px window), 400px mobile before fixes, 320px mobile after fixes, and 768px tablet after fixes.
- Desktop header/hero and public-board spacing; mobile header/hero, results, sports detail, Premium entry, FAQ and footer were visually inspected. Tablet header/hero were inspected.
- Mobile Menu opens; choosing Results collapses it and reaches Results. Escape collapses it and visibly returns focus to Menu.
- Shift-Tab reaches the visible skip link; Enter then Tab reaches the main content's free-picks link, skipping navigation.
- Keyboard Tab/Enter from Results activates NFL, updates the public-status panel, and shows its focus outline.
- FAQ expands its actual answer. Accessibility tree exposes named navigation/sections, only three result terms, and disabled Whop control.
- Browser Network panel showed only index.html, styles.css, app.js, and favicon.svg, all loaded successfully from local files. No remote site integration was added.

## Limits

This is targeted manual Edge review, not a full WCAG certification or screen-reader audit. Safari, Firefox, physical phones, JavaScript-disabled browsing, high-contrast mode, and a complete zoom matrix were not tested. Responsive device emulation is not physical-device testing. HTTP preview routing remained unavailable; browser review used the same standalone source via a local file.

The official Whop destination is unverified, so its button stays disabled. Picks and results remain empty. Brand/content approval, official Whop URL, and public grading/publication rules remain prerequisites for any separately authorized launch.

No merge, deployment, domain connection, TFI Live Tracker, Supabase, live/private picks, or credential changes.
