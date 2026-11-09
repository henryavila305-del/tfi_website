# Remaining launch inputs

This is the current decision checklist for PR #5. It records what must be settled; it does not supply approvals, legal advice or authorization to publish. Keep approval references public-safe. Do not put credentials, private messages, member selections or raw workbooks in this public repository.

## Owner decisions and evidence

| Input | Current implementation/evidence | Exact remaining decision or record |
| --- | --- | --- |
| Whop membership | Two links and prices are implemented; HISTORY_REVIEW.md calls the retained links approved, while release notes still request confirmation. | Reconcile the existing approval record for All Access: https://whop.com/x-63cc/tfi-all-access/ at $35.99/month; Premium: https://whop.com/x-63cc/tfi-premium/ at $9.99/month. Confirm these are the final public plan names, destinations and displayed prices, or provide exact replacements. Do not treat the URLs as missing. |
| Brand and public content | Current identity, tagline, Premium wording, methodology, risk statement and historical disclosures are reviewable in index.html. | Record approval of the exact current copy/assets, or list exact replacements and the approving owner. Confirm permitted historical categories, coverage dates and self-reported/incomplete-pricing disclosures for launch. |
| Public-pick eligibility and approval | Contract/renderer exist; content remains empty and builds block publication. | Define which selections can be public, who approves each entry, a public-safe approval reference, pre-event release timing/timezone and the fields allowed to leave the private workflow. No automated private-source import is authorized. |
| Odds and grading | American odds and UTC timestamps are structurally validated; pending/win/loss/push/void labels exist. Future settlement rules are not defined by the historical import. | Choose odds capture source/time and price-change policy; authoritative grading source and settlement timing; push/void/postponement rules; correction/withdrawal policy and public revision evidence. Decide whether stakes/units will be shown. No ROI or profitability claim should be introduced from incomplete pricing. |
| Legal/privacy copy | General uncertainty/age/local-law language exists; no collection form, analytics, cookies or private backend is added by this PR. | Supply or approve applicable final terms, privacy and responsible-wagering copy, where each should appear, and any public contact/entity details required by the intended launch. Confirm the statement about site data practices and external Whop checkout matches the intended behavior. Do not invent contact details or jurisdiction-specific requirements. |
| Hosting and domain | Git deployment is disabled by this branch's vercel.json; a previously hosted version may still exist. | Identify the intended hosting project/environment, approved deployment method, canonical domain and DNS owner. Confirm redirects and whether thefavindex.com should connect. Credentials/DNS changes are outside this review packet. |
| Release authorization | PR #5 remains a draft; neither hold has been lifted. | Separately authorize merge and publishing scope, audience, environment/domain, exact release commit and rollback plan. Any change lifting the content or deployment hold needs its own review and validation. |

## Engineering work still outstanding

- Screen-reader pass for named landmarks, card headings, changing sports content and historical tables.
- Firefox/Safari and physical-device checks for navigation, cards, charts/table alternatives and membership links.
- Complete forced-colors traversal and another system palette. Targeted emulation is already documented.
- Final current-commit Actions success and content/link review before a separately authorized release.

## What is not needed to finish PR #5 review

No private picks, tracker credentials, database connection, raw workbook or live data feed is required. No new Whop URL is required if the implemented destinations are confirmed. The renderer, validation, preview tooling, safety checks and documented Edge 400% section review are already built.

The next owner-dependent phase is to resolve the decisions above. Until then, safe development can improve independent accessibility coverage or review tooling while preserving both holds.
