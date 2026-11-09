# Synthetic withdrawal accessibility source review — November 9, 2026

Scope: source review and automated checks for the withdrawal slice starting at bb714c543282e29bb374fbf7df59aff6adf8864c. No browser rendering, keyboard input or forced-colors emulation was completed for this slice. The browser tool refused the local-file URL; no alternate browser route or policy bypass was attempted.

## Completed

- Withdrawal cards retain the original selection and explicit withdrawn status. Each article has a unique visible h3 accessible name. Native description-list terms associate the reason and UTC withdrawal time with their values, in source reading order.
- Withdrawal text is escaped; approval references are validated but never rendered. Details are present in full-page scripted and script-free fixtures. Cards add no controls, tab stops, hidden content or focus traps in their markup.
- Existing card CSS permits long text to wrap anywhere, uses zero-minimum grid tracks and values, and stacks metadata below a 540px viewport or 400px card container. No fixed card height or clipping rule was found. This supports reflow but does not prove browser layout.
- Existing forced-colors rules use Canvas backgrounds and CanvasText for card borders, headings, labels, values and paragraphs. Focus outlines use Highlight. No forced-color-adjust opt-out was found for cards.
- Source-color contrast calculations for normal card colors: text #f1f3eb against #191d18 is approximately 15.2:1; labels #a8afa1 against #191d18 approximately 7.6:1. System palette contrast requires actual browser review.
- Full-page fixture checks now assert the withdrawal's visible article/heading, native reason/time markup, source reading order, no hidden or interactive card content, and retained content without JavaScript. These checks inspect HTML, not the browser accessibility tree.
- No markup or styling defect requiring a production change was found in this bounded review.

## Still requires browser verification

- Actual viewport widths of 320px and 240px, plus 200%/400% zoom: complete long reason, timestamp and heading wrapping, no clipping or page overflow.
- Tab/Shift+Tab around the cards and page controls: visible focus, logical order and no keyboard trap; Enter on surrounding fixture anchors.
- Forced-colors rendering: card text/borders/time remain visible in at least two palettes; surrounding controls retain visible focus.
- Screen-reader article naming, term/value reading order and time pronunciation; Firefox/Safari and physical devices.

Earlier PICK_CARD_QA.md and KEYBOARD_CONTRAST_QA.md describe pre-withdrawal card browser observations. They do not verify these new withdrawal fixtures.

Real publication content remains []; direct-build checks reject nonempty lists; vercel.json retains deploymentEnabled=false. No deployment, public picks, private content or hosting settings were changed.
