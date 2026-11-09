# PR #5 correctness and accessibility review — November 9, 2026

Reviewed branch: development/public-picks-contract, starting at 47c0745e1e1b6211f1acd60580b3ce4e51d4fb66.

## Findings fixed

1. Direct builds previously copied the five allowed assets without rejecting extra files already in dist. Build verification caught those files, but npm run build alone could leave an unreviewed artifact alongside the website. The build now inspects existing output before writing and rejects unexpected entries, directories, or symbolic links. It preserves unexpected files for review instead of deleting them.

2. Unique pick IDs did not prevent a generated heading ID from colliding with a retained template element. Such a collision could misdirect aria-labelledby. The renderer now checks generated heading IDs against retained page IDs and fails explicitly on conflict. IDs in the replaced content slot do not create false conflicts.

3. The negative publication test temporarily rewrote the real content/public-picks.json before restoring it. This could interfere with concurrent local work or leave synthetic content after interruption. Build failure tests now run in a separate temporary fixture, including nonempty-publication, stale-output, wrong-entry-type and clean-build cases. The real content file is checked for byte-for-byte preservation.

## Verification

All source, interaction, historical-record, public-pick, renderer, full-page preview, isolated build-safety and repeatable-output checks passed locally on Node 24. The first temporary cleanup attempt used a file-removal method on an empty directory; it was corrected to directory removal and the full suite passed.

No presentation or interaction behavior changed in this review. Existing targeted Edge evidence is recorded in PICK_CARD_QA.md; this review adds automated failure-path evidence, not a new browser/accessibility certification.

## Remaining limits

Physical devices, Firefox/Safari, screen-reader output, full forced-colors traversal and a complete full-page 400% pass remain unverified. Publication/grading approvals and other launch inputs remain outstanding. No claim is made that these automated checks establish privacy approval or legal readiness.

Production content remains empty; nonempty builds fail. The Vercel deployment hold remains unchanged. No merge, deployment, DNS, private tracker, database, or credential action is included.
