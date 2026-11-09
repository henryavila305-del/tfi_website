# Full-page 400% zoom review — November 9, 2026

Baseline: PR #5 at 5490e3ca1df67f6259b2d033e27852b8028d7532.

## Setup

Microsoft Edge, 960 by 1080 browser window, developer panel closed, normal colors, actual browser zoom verified at 400%. This yields an effective content width of approximately 240 CSS pixels, narrower than the earlier 320px container check. Used the generated full-page synthetic fixture with the real renderer, stylesheet and scripts. No real selections were added or published.

## Findings and fixes

- The two-column sports grid clipped NCAAF and NCAAB at this effective width and caused page-wide horizontal scrolling. Added a single-column layout at viewport widths up to 320px. Reloaded the fixture and verified both complete college labels, the card borders and focus outline. The page-wide horizontal scrollbar was no longer present in the reviewed sections.
- The membership actions touched when their text wrapped over several lines. Added 12px separation between adjacent membership buttons. Verified the visible gap and wrapped labels at 400% without activating either checkout link.

## Section and keyboard checks

- Header brand and compact Menu fit, with Menu moving below the brand at this narrow width. Keyboard opening, Escape dismissal, reopening and section selection reached #picks. Focus remained visible.
- Hero heading, introduction and actions reflowed; illustration labels and artwork remained within the page.
- Populated board status, representative long synthetic headings, stacked market/odds/time/result metadata, reasoning, and card boundaries were inspected. Long unbroken selection strings and UTC timestamps wrapped rather than widening the page. Repeated cards share the same renderer/styles; this was not a pixel-by-pixel screenshot of every repeated card.
- Historical section heading/status and current-record disclosure reflowed. The category selector was keyboard accessible and displayed Premium / Max Bet without truncation. Tab/Space opened its table; the next Tab reached the internally scrollable table and Right scrolled it. Internal table scrolling is intentional and distinct from page-wide overflow.
- Record methodology and About headings/body/principles reflowed. All three principle headings and descriptions were inspected.
- Opened all three FAQ controls using Tab/Space. Inspected the complete displayed answers; no clipped text was observed in these answers.
- Footer links, legal-risk disclosure, copyright and history-status text reflowed. Keyboard Back to top reached #main.
- Normal 100% zoom was restored and verified at the end.

Browser page search was used to reach section checkpoints, with scrolling within sections and keyboard interaction of controls. This completes the section-by-section 400% review for this documented window, not every combination of browser, font setting, viewport and data.

## Remaining limits

Firefox/Safari, physical devices, screen-reader output, additional forced-color palettes and a full forced-colors traversal remain outside this evidence. Script-free behavior was verified in a prior pass, not repeated at 400% here. Automated regression checks do not establish owner publication approval or legal readiness.

Publication content remains []; direct builds reject nonempty content. Vercel Git deployment remains disabled. No merge, deployment, domain, database or private tracker action was included.
