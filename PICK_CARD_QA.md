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

A narrow container is not an actual 320px device viewport. Physical phones, Firefox, Safari, screen-reader output, full forced-colors traversal, and full-page integration with populated cards remain unverified. These observations use isolated fixtures rather than the complete website.

Publication stays blocked for nonempty content. Builds enforce that hold before writing output; vercel.json continues to disable Git-triggered deployment. Run all Node checks and build verification against the exact reviewed commit.
