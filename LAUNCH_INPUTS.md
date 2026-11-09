# Remaining launch inputs

This is the current decision checklist for PR #5. It records what must be settled; it does not supply approvals, legal advice or authorization to publish. Keep approval references public-safe. Do not put credentials, private messages, member selections or raw workbooks in this public repository.

## Confirmed owner decisions

Approval reference: WHOP-PLAN-PRICE-01. The owner answered yes to confirming the existing Whop plans and prices: All Access at $35.99/month and Premium at $9.99/month. The owner explicitly directed that publication and deployment remain blocked. Scope is plan names and displayed prices; additional decisions are recorded separately below.

Approval reference: BRAND-CONTENT-01. The owner answered yes to approving the current branding, public website copy and historical-result disclosures in PR #5 at commit b5f03924d0fc8a96a84512d04033f1ca3344823b (index.html blob b26dd901178915756217bb1573e17330a386078c). No copy changes were requested. This applies to the current presentation and disclosures; it does not verify historical outcomes independently, approve future picks, or lift either hold. Legal/privacy review remains a separate pending input.

Approval reference: PUBLIC-PICK-APPROVAL-01. The owner confirmed that every individual public pick requires the owner's individual approval before appearing and that private/member picks are excluded. Both publication and deployment remain explicitly blocked. This establishes the approving person and per-pick eligibility rule, not permission to publish any actual entry. Previously approved public historical aggregates are unchanged; individual private selections remain excluded.

Approval reference: PUBLIC-PICK-TIMING-01. The owner confirmed that approved public picks must be posted only before the event starts, with UTC publication times and no backdated entries. Both holds remain explicitly blocked. A pick's publishedAt must represent its actual first public release, not an earlier analysis, private message, approval or event time. This rule is for future individual public picks; it does not relabel imported historical aggregates as pre-event publications.

Approval reference: PUBLIC-PICK-SOURCES-01. The owner selected DraftKings for recorded odds (the submitted draftkigs was interpreted as DraftKings) and ESPN as the reference for final results. This is a source-selection decision, not permission to connect accounts, scrape services, use an undocumented feed or publish. Source-specific capture details remain pending; the grading policy is recorded separately below. Both holds stay enforced.

Approval reference: PUBLIC-PICK-PRICE-01. The owner confirmed that DraftKings odds must be recorded when each approved public pick is first posted, that the original price must be preserved, and that later corrections must be recorded separately. Subsequent market movement must not replace the original recorded price. Source capture remains gated; synthetic correction history and comparison safeguards are now built but do not enable real entries; no real prices or picks are added by this approval. Both holds remain enforced.

Approval reference: PUBLIC-PICK-GRADING-01. The owner approved individual approval before posting each grade; win percentage calculated as wins / (wins + losses), excluding pushes and voids; postponed games remaining pending until the owner approves a final outcome; and visible grading corrections (PUBLIC-PICK-GRADING-01). ESPN remains the selected final-result reference. This approves the policy only, not any individual grade or changes to imported historical aggregates. Visible correction history is implemented synthetically; genuine grade-approval evidence and durable retention remain required before real entries can be enabled. Publication and deployment remain blocked.

Approval reference: PUBLIC-PICK-JURISDICTION-01. DraftKings New York is the selected odds-source jurisdiction (PUBLIC-PICK-JURISDICTION-01); the owner's answer was NYC, recorded as New York (NY), United States. This identifies the source jurisdiction only, not the owner's residence or permission to access an account, connect a feed, publish picks or deploy. Exact wager-market details and timestamped public-safe source evidence still need implementation. Both holds remain enforced.

Approval reference: PUBLIC-PICK-METRICS-01. The owner answered yes to showing win/loss records only for now and withholding stake amounts, net units, profit and ROI. Public performance reporting is limited to win/loss records for now; stake amounts, net units, profit and ROI remain withheld (PUBLIC-PICK-METRICS-01). This retains the approved win-percentage calculation and transparent push/void/pending statuses; recorded pick odds and membership prices are not profit claims. No actual pick, grade or change to historical aggregates is approved by this decision. Publication and deployment remain blocked.

Approval reference: PUBLIC-PICK-WITHDRAWAL-01. Withdrawing a public pick requires individual owner approval; the entry must remain visible with a reason and UTC withdrawal time, and be excluded from win percentage (PUBLIC-PICK-WITHDRAWAL-01). Synthetic withdrawal schema, visible reasons/UTC times and percentage exclusion are now implemented. Structural approval fields do not prove authorization or enforce append-only retention; trusted approval evidence and history controls remain gates before real entries. This approves the policy only, not any individual withdrawal or revision to imported historical aggregates. Publication and deployment remain blocked.

Approval reference: PUBLIC-CONTACT-01. The owner selected Twitter/X @thefavindex as the website's public contact (PUBLIC-CONTACT-01), using https://x.com/thefavindex. No public email address was supplied. A plain footer link is included in this draft; it loads no social widget or tracking script. This records the supplied destination, not independent account-ownership verification. This does not settle entity details or legal/privacy copy, authorize messages, or lift publication/deployment holds.

Approval reference: PRIMARY-DOMAIN-01. The owner confirmed thefavindex.com as the website's primary domain (PRIMARY-DOMAIN-01). This records the intended domain only; domain connection, DNS changes, redirects and deployment are not authorized. Domain/DNS ownership and access are not independently verified by this decision. Hosting project/environment, deployment method and redirect behavior remain separate inputs. Publication and deployment remain blocked.

Approval reference: HOSTING-PROVIDER-01. Vercel is the owner-approved planned hosting provider (HOSTING-PROVIDER-01). This selects the provider only; no project creation/linking, account changes, deployment or domain connection is authorized. The intended Vercel target environment and deployment method still need to be identified. This decision does not verify any external account or existing hosting configuration. Publication and deployment remain blocked; vercel.json stays unchanged.

Owner input reference: HOSTING-PROJECT-NAME-01. The owner initially supplied "the favorite index" as a hosting-name hint (HOSTING-PROJECT-NAME-01); the later screenshot resolves the project URL and scope under HOSTING-PROJECT-URL-01. The later screenshot supplies the slug and URL scope; this earlier name alone did not establish project identity. No project was created, linked or modified; publication and deployment remain blocked.

Evidence reference: HOSTING-PROJECT-URL-01. Owner-supplied screenshot evidence (HOSTING-PROJECT-URL-01) identifies the dashboard URL as https://vercel.com/henryavila305-8922/the-favorite-index, project slug the-favorite-index, and URL account/team scope henryavila305-8922. The screenshot shows an existing Ready production deployment from main at fae4e41, with www.thefavindex.com and the-favorite-index.vercel.app listed. This is screenshot evidence, not a live hosting audit or verification of account permissions, DNS ownership, apex redirects or current external settings. PR #5 has not been deployed by this work. Its empty-content hold and disabled Git deployment configuration remain unchanged. No hosting, DNS or account settings were modified.

## Exact inputs still needed

The consolidated completed/blocked checklist is [REVIEW_GUIDE.md](REVIEW_GUIDE.md). The approval records above remain authoritative for their stated scope.

| Remaining input | Exact record or decision needed |
| --- | --- |
| Genuine approval evidence | Public-safe records tying each pick, grade, correction and withdrawal to individual owner approval. Policy-level yes answers and boolean fields are insufficient. |
| Publication/source evidence | Actual first-publication evidence in UTC; DraftKings NY event/market/source capture details; ESPN outcome evidence and approved settlement/postponement handling. No source account or feed is connected. |
| Trusted baseline and retention | Trusted complete baseline selection/storage, mandatory comparison in the future publication path, durable version retention and an append-only withdrawal-event model. The synthetic comparison guard and visible history are already built. |
| Legal/privacy/entity facts | Final terms, privacy and responsible-wagering copy, placement and applicable entity details. Verify data-practice and external-checkout descriptions. Twitter/X contact is already approved; do not invent an email or legal identity. |
| Final destination check | Recheck existing Whop plan links and contact destination against the intended release. Plan names/prices are confirmed; no new Whop URL is missing. |
| Hosting/DNS | Future Vercel environment/deployment method, verified account authority and DNS owner, apex/www redirects and canonical behavior. Provider, primary domain and screenshot-supplied project URL are already recorded. |
| Release authorization | Separate authorization for merge/publication/deployment: exact commit, audience, scope, environment/domain and rollback plan. An empty-board release and enabling real picks are different scopes; neither is authorized. |

## Engineering and evidence still outstanding

- Implement the trustworthy approval/source/baseline controls above before real entries can be enabled. Existing schema, visible corrections, retained withdrawal cards and prior-snapshot checks are completed synthetic preparation.
- Resolve the event-based withdrawal lifecycle: changing an existing base result to withdrawn is deliberately blocked by retention comparison.
- Complete new withdrawal/correction browser checks and current-page screen-reader, Firefox/Safari, physical-device and additional forced-colors coverage. Prior Edge evidence is bounded to its documented stage.
- Require successful exact-head Actions and final content/link review for any separately authorized release. Current verified evidence is indexed in REVIEW_GUIDE.md.

No private/member picks, tracker credentials, raw workbooks, database or live feed is needed to review this PR. Real content remains []; deployment remains disabled. No merge, publish, DNS or hosting action follows from this document.
