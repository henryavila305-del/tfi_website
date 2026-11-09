# Release review status

PR #5 remains an open, unmerged draft. Publication and deployment are blocked.

Use [REVIEW_GUIDE.md](REVIEW_GUIDE.md) as the single completed-safeguard and remaining-blocker checklist. [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md) preserves the version-specific owner approval records and exact missing inputs. [PUBLIC_PICKS.md](PUBLIC_PICKS.md) defines the current contract and retention limitations.

The implemented slice includes static cards, synthetic withdrawals/corrections, preserved original odds, corrected-result statistics, prior-snapshot retention and distinct-file comparison guards. Real production content stays empty; direct builds reject nonempty picks and output exactly five allowlisted assets. The validation workflow has no publishing step.

Current implementation evidence: head 0a094ba24dc72ce09c678ba48a8a718af53399f5 passed all four Node 22/24 Linux/Windows jobs in [run 42676409161](https://github.com/henryavila305-del/tfi_website/actions/runs/42676409161). Later heads require their own checks. Browser evidence is stage-specific; new withdrawal/correction browser checks remain unfinished.

Real-pick publication still requires trustworthy approval/publication/source evidence, a trusted retained baseline and event-based withdrawal lifecycle. Website release still requires legal/privacy approval, current accessibility/browser and destination review, hosting/DNS details and separate exact-commit release authorization. Selected plans, branding, rules, contact, primary domain, provider and project URL are already recorded.

This packet authorizes no merge, publication, deployment, domain/DNS, account, credential, private-data or billing change. Existing hosted versions are unaffected.
