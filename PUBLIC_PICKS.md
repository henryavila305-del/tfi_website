# Public picks preparation

The public board remains empty. content/public-picks.json must contain [] until the owner approves public publication and grading rules. The current validator deliberately blocks nonempty lists. Static rendering is implemented, but production builds deliberately reject nonempty lists. No feed is connected.

Each future public entry requires exactly: id (unique lowercase slug), sport (NFL/NBA/MLB/NHL/NCAAF/NCAAB), selection, market, odds (integer American odds), publishedAt and eventAt (canonical UTC ISO timestamps ending .000Z), reasoning, result (pending/win/loss/push/void), publicApproved (true), and approvalReference (a public-safe approval identifier). Publication must precede the event.

All repository content is public, including test fixtures and commit history. Never put drafts, member picks, private approval conversations, credentials, workbook rows or source identifiers here. Only already-cleared public entries may ever be committed. Unknown fields fail validation; this is structural validation, not an automated privacy guarantee.

Before enabling entries, obtain: the public selection policy and release timing; the approving person/process; odds capture policy; grading source and settlement timing; push/void, correction and withdrawal rules; and approved public explanations. Approval references must not contain private URLs or messages.

The build renders validated public entries into a dedicated HTML slot, escaping text and retaining native headings, descriptions and UTC time elements without JavaScript. The empty array preserves the reviewed empty state byte for byte. Approval metadata is never rendered. Synthetic tests cover populated output in memory only and prove that a direct build rejects nonempty content. Next phase: define settlement/correction evidence once grading rules are approved. Do not connect a tracker or database.

Run npm run check and npm run build:check. The static output remains the existing five assets; content files and validation fixtures are not shipped. vercel.json disables Git-triggered deployments on this branch. No deployment, DNS, account, or billing action is included.
