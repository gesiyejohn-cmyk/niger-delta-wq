# Niger Delta WQ — Project Milestone Register

**Repository:** https://github.com/gesiyejohn-cmyk/niger-delta-wq  
**Working branch:** `feature/ert-geological-interpretation`  
**Related pull request:** [PR #5](https://github.com/gesiyejohn-cmyk/niger-delta-wq/pull/5)  
**Purpose:** Maintain a traceable engineering, testing, release and product-development history.

> **Historical completeness notice (18 November 2026):** This register was created retrospectively from the Git history and development evidence available at that time; it was not maintained continuously from the project's first conception. It therefore captures the verified milestones currently known, not necessarily every early design discussion, prototype, manual change, test, or decision. The branch history and earlier release/acceptance records should be reconciled to extend the timeline. Where primary evidence is missing, entries must be labelled as recollections or user-confirmed history, not verified commits. Future entries must be tied to actual commits, pull requests, workflow runs, test evidence or approved decisions. Do not mark work complete without evidence.

## Milestone history

| Date / sequence | Milestone | Evidence | Status / notes |
|---|---|---|---|
| Earlier development | ERT editor loading recovery | Commit `1a663b41d6369a2a5ac563df092cd75373568276` — “Show recoverable ERT geological editor loading failures” | Implemented loading state, visible load error and retry behaviour in `upgrade/src/pages/GeologicalInterpretationEditor.jsx`. |
| Earlier development | Explicit ERT workspace presence | Commit `e50f236facfdd09ee80e6dc2455c7ebb1ae6300c` — “Make ERT geological workspace presence explicit” | Added explicit workspace container and fallback messaging in `upgrade/src/pages/GeophysicsPage.jsx`. |
| Preview 3 preparation | Side-by-side Android package identity | Commit `c1304dc51745eed42e0e3281e88451e03f28c2b6` | Preview 3 workflow configured with application ID `com.nigerdeltawq.mobile.preview3` to preserve the Preview 2 installation. |
| Preview 3 build | Android build and smoke checks | [GitHub Actions run #203](https://github.com/gesiyejohn-cmyk/niger-delta-wq/actions/runs/44202571924) | First attempt encountered Maven Central HTTP 429 dependency rate limiting; a subsequent attempt succeeded. Recorded checks included web tests, Windows desktop build, Android build and emulator build/launch smoke checks. The emulator smoke check did **not** directly verify the ERT editor screen. |
| Preview 3 field/device check | ERT workspace opened on user's Android device | User-confirmed test session | User installed the Preview 3 APK alongside Preview 2, re-imported a 54-point CSV and confirmed the ERT geological workspace and its controls were visible. |
| Current ERT validation investigation | Geological boundary-count save validation | Source review of `upgrade/src/engine/geologicalInterpretation.js` and `upgrade/src/pages/GeologicalInterpretationEditor.jsx` | For one geological unit, the model requires exactly two boundaries (unit count + 1). The current reported station state has three boundaries and one unit, so saving is rejected. The middle boundary was changed from 5.5 to 0 after an incorrect assistant instruction; the user should not be blamed. This issue remains pending a safe editor correction and verified retest. |

## Current known ERT test state

- Station 1: distance 0.00 m; boundaries displayed as 1, 0, 10.
- Station 2: distance 40.00 m; boundaries displayed as 1, 0, 10.
- One geological unit: “Synthetic test unit A”.
- Reported validation: `Station 1 must contain one more depth boundary than the number of geological units.`
- Required invariant: `boundaries.length === units.length + 1`.
- Do not treat the synthetic test unit or any generated borehole data as real field observations.

## Required format for every future milestone

Each new entry should record:

1. Milestone ID and date (UTC or clearly labelled local time).
2. Objective and user-approved scope.
3. Repository, branch and exact commit SHA.
4. Pull request link and review/merge status, where applicable.
5. Files/modules changed and concise description of the change.
6. Tests executed, environment/device, exact result and evidence links.
7. Known limitations, defects and risks.
8. Data migration, compatibility, backup or rollback implications.
9. Release identifier and artifact checksum, when a release artifact is produced.
10. Approval/acceptance status. Distinguish developer-complete from user-verified.

## Source-code traceability rules

- Keep all project source in the Git repository; Git commit history is the authoritative change history.
- Use focused commits with descriptive messages. Never rewrite published history without a documented reason and approval.
- Link each material feature or defect to an issue or pull request.
- Record source files changed and tests added or updated in each pull request.
- Protect release points with version tags and release notes.
- Retain build logs, test reports and release artifact checksums.
- Keep secrets, signing keys, passwords, private user data and real field records out of source control.
- Maintain a dependency and third-party licence inventory before commercial distribution.
- Back up the repository and release records independently of a single developer account.

## Planned milestones (not yet completed)

- Correct ERT geological boundary editing and validation; add regression tests.
- Verify ERT save, reload, export and import behaviour on device.
- Build a dedicated borehole logging module with clear provenance and synthetic-data labelling.
- Link borehole records to ERT stations/profiles without inventing geological correlations.
- Complete scientific validation of calculations, classifications and report outputs.
- Complete offline, persistence, security, accessibility and device-compatibility testing.
- Prepare release documentation, user guide and support process.
- Complete intellectual-property, dependency and licensing review before commercial release.
