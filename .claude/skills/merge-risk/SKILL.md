---
name: merge-risk
description: Score a change's merge risk (low/medium/high) across alignment, impact, verification, rollback cost and error detection, mitigate what you can, and report it in the PR. Use before opening a PR and when triaging a pile of PRs.
---
# Merge risk

Goal: a reviewer can tell at a glance which PRs need close review and which can merge after reading the description.

## Assess five categories

| Category | Question | Low | High |
|---|---|---|---|
| **Alignment** | Does the diff match the issue/spec and PR description? Any undocumented drive-by changes? | Exactly what was asked | Unexplained extra changes |
| **Impact** | Blast radius. Isolated view, or shared component/kernel? Touches auth, payments, wallets/keys, signing, schema, data pipelines? | One isolated screen | Shared or sensitive code |
| **Verification** | Was behaviour proven by verify-with-proof, e2e or unit tests? | Walked end to end + tests | Static checks only |
| **Rollback cost** | Two-way door (plain revert, feature flag) or one-way (migration, destructive data change, contract deploy, sent emails/payments)? | Clean revert | Irreversible |
| **Error detection** | If it breaks in production, will logs/monitoring show it, or are errors swallowed? | Errors surface | Silent failure |

**Certified surfaces:** if the repo has docs/WORKING_SURFACES.md, don't write a separate impact analysis. Check the diff against that list. If any certified file is touched, Impact is automatically **high**, and the PR must include that file's breaking-change checklist, filled in. Never use `CERTIFIED_OVERRIDE` yourself.

## Mitigate before reporting
Where cheap, reduce risk first: remove drive-by changes, add missing error logging, add a test, collect missing verification evidence. Then score.

## Overall score
- **High** if any category is high, or Impact is a certified surface.
- **Medium** if two or more are medium.
- **Low** otherwise.

## Report in the PR

```
## Merge risk: <LOW|MEDIUM|HIGH>
| Category | Verdict | Note |
|---|---|---|
| Alignment | low | ... |
| Impact | ... | ... |
| Verification | ... | ... |
| Rollback cost | ... | ... |
| Error detection | ... | ... |
Gaps that raise risk: ...
```
Also add a GitHub label `risk:low`, `risk:medium` or `risk:high` when you can.
