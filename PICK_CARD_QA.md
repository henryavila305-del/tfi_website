> Evidence record from a specific development stage. For current scope, completed checks and remaining launch decisions, start with [REVIEW_GUIDE.md](REVIEW_GUIDE.md). Later evidence may supersede a limitation recorded below.

# Synthetic public-pick card review — November 9, 2026

## Scope

This is a targeted Microsoft Edge review of isolated local-file synthetic fixtures, using the production renderer and stylesheet. No real picks, content list edits, live feed or deployments were used for browser review. It does not certify the full website or WCAG compliance.

Reproduce with node scripts/preview-public-picks.mjs and open work/pick-preview/desktop.html and narrow.html locally. The files contain no scripts, so the observed content and anchor navigation do not depend on JavaScript. Fixtures and their copied stylesheet are ignored and excluded from the five-asset production build.

## Observed

- In the 960 by 1080 browser window, the desktop fixture showed readable card headings, two-column metadata, UTC times, explicit text results and full reasoning. Edge accessibility state exposed five named articles and their headings, terms, time elements and pending/win/loss/push/void values.
- A 320px-wide container exposed awkward metadata-label wrapping. Added a card container query to stack labels/values based on the card width, alongside the viewport fallback. Rechecked: labels remained intact, timestamps fit and the long unbroken selection wrapped inside the card.
- Keyboard Tab/Enter on the narrow fixture reached the #after destination. The destination had a visible focus outline. The return anchor also reached #top during subsequent keyboard review.
- At 400% browser zoom, targeted screenshots of the first card heading and metadata showed stacked labels/values and wrapped unbroken selection/timestamps within the card. This was targeted reflow inspection, not traversal of every card at every zoom. Normal 100% zoom was restored and verified.
- Cards contain no interactive controls and add no tab stops. Each article is named by its own unique heading ID.
- System-color rules are included for forced colors. Forced-colors browser behavior was not tested in this slice.

## Limits and next checks

A narrow container is not an actual 320px device viewport. Physical phones, Firefox, Safari, screen-reader output, full forced-colors traversal remain unverified. The earlier observations above use isolated fixtures; see the full-page review below for later evidence.

Publication stays blocked for nonempty content. Builds enforce that hold before writing output; vercel.json continues to disable Git-triggered deployment. Run all Node checks and build verification against the exact reviewed commit.

## Full-page integration review — November 9, 2026

The preview generator now also creates full.html and full-no-script.html from the actual website template, with the real local assets and a synthetic-review banner. Production content remains [].

Integration fixes:
- The public-board status has a separate validated marker slot. Populated rendering shows its entry count; empty rendering retains AWAITING PUBLICATION. Missing, duplicate, reversed or overlapping slots fail rather than corrupting the page.
- The initial sports panel and sport activation copy describe the disconnected feed and point readers to the board/history instead of incorrectly asserting that no picks exist.
- FAQ publication wording describes approved entries without assuming the board is empty.

Observed in the existing 960 by 1080 Edge window:
- Full-page cards showed the five-entry status and readable long selection/metadata/reasoning at 100% zoom. The accessibility tree exposed five named synthetic articles alongside the historical section.
- Navigating to Results reached the historical section. Selecting Premium / Max Bet using the category control and arrow/Enter keys updated the visible chart and 60–29 / 67.42% record.
- After reloading the regenerated fixture, the initial sports message matched the corrected source. Activating NBA showed the updated NBA-specific message.
- The full script-omitted fixture showed all five cards and the correct board status. At 200% zoom, targeted inspection of the board heading, count and first card showed stacked metadata and wrapped long selection text. Normal 100% zoom was restored.
- The first native FAQ in the script-omitted full page expanded and displayed its answer. FAQ publication copy was subsequently simplified; structure and behavior are unchanged.

Browser control initially stopped on URL-confidence verification in the preceding turn. This turn reconnected through normal app discovery to the already-open local fixture with a verified URL. No workaround or policy bypass was used.

Limits: this is targeted full-page integration evidence, not complete end-to-end accessibility certification or a full viewport matrix. Physical phones, Firefox/Safari, screen-reader output, full forced-colors traversal and the complete full-page 400% pass remain unverified.

Automated preview checks now verify full-page IDs/ARIA/anchors/local assets, five synthetic cards, unchanged historical markup, absence of scripts in the fallback and unchanged empty production content.

## Later forced-colors and keyboard evidence

See KEYBOARD_CONTRAST_QA.md for the targeted full-fixture forced-colors pass, system-color SVG fix, keyboard menu/history/table checks and exact remaining limits. Earlier statements above describe the evidence available at those stages.

## Later 400% section review

See ZOOM_QA.md for the completed section-by-section 400% review in the documented Edge window, the narrow sports-grid fix, membership action spacing, and remaining limits. Earlier 400% limitations above describe the evidence available at those stages.
