> Evidence record from a specific development stage. For current scope, completed checks and remaining launch decisions, start with [REVIEW_GUIDE.md](REVIEW_GUIDE.md). Later evidence may supersede a limitation recorded below.

# Forced-colors and keyboard review — November 9, 2026

Starting PR #5 commit: ec77fb7dc42ef997bb486f82ca9d7bbf10aef6a5.

## Setup and scope

Microsoft Edge, existing 960 by 1080 browser window, local full-page synthetic fixture generated from current source. DevTools was docked on the right, leaving a compact page area approximately 380px wide. Device emulation was turned off. Emulate CSS forced-colors: active was selected through the DevTools command menu; screenshots visibly showed the system palette.

No real picks, private content, deployment or public publication was used. This is targeted browser emulation, not a physical Windows high-contrast-device or screen-reader audit.

## Verified

- Synthetic cards retained visible borders, complete long headings, readable UTC times, reasoning and explicit pending/win labels in forced colors.
- Keyboard entry into #main followed by Tab reached the main free-picks CTA with a visible cyan system focus outline. Enter reached #picks.
- Tab moved past the static cards to the historical category selector; Down changed the visible record to Premium / Max Bet.
- Tab and Space opened its native table disclosure with visible focus. The next Tab reached the scrollable table region; arrow keys scrolled it with visible focus around the region.
- At the top of the page, Tab exposed the skip link with a visible system focus outline.
- Tab navigation reached the compact Menu; Space opened navigation. Escape closed it and visibly retained focus on Menu. Space, Tab and Enter then selected Free picks and reached the populated board.
- Native card/article content added no tab stops or focus trap.
- After review, forced-colors: none restored normal card backgrounds and muted labels. The prior printer preview was canceled without printing. Developer tools remained available; no security permissions or settings were changed.

## Fix

Historical SVG chart text, grid paths and result polylines retained fixed source paints while the page followed the user's palette. Added forced-colors rules using CanvasText, GrayText and LinkText. Reloaded the real stylesheet in the full fixture: chart labels and grid followed system colors and the result line changed from the source green to system yellow in the tested palette. The underlying history, arithmetic and table alternatives are unchanged.

## Limits

This pass did not traverse every page element in every palette. Full forced-colors traversal, a second palette, physical phones, Firefox/Safari, screen-reader output and a complete full-page 400% pass remain unverified. The browser opened a print preview when a command-menu shortcut missed DevTools; it was canceled normally, and review resumed with confirmed command-menu focus. No print job was submitted.

The empty publication content and Vercel deployment hold remain unchanged. Run all Node checks and build verification on the exact commit; this document is bounded observation, not launch approval.
