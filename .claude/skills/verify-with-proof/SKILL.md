---
name: verify-with-proof
description: Prove a change works by running the app and walking the user flow end to end, then add a Visual proof section to the PR. Use before opening or updating any PR that changes something a user can see or do.
---
# Verify with proof

Would you pull down a PR its author never ran? Neither should the reviewer of an agent's PR.

## 1. Static checks first
Run the project's checks listed in CLAUDE.md (lint, typecheck, tests, build, `check:certified`). Fix failures caused by your change. Report pre-existing failures as pre-existing; don't hide them.

## 2. Start the app
Use the dev/start command from CLAUDE.md. Wait for the server to answer before continuing. If it needs secrets you don't have, use the project's .env.example values or mocks, and say so in the proof.

## 3. Walk the path
Walk the exact flow from the issue, or the spec's validation checklist when there is one.
- Bug: show the symptom is gone.
- Feature: show the new behaviour and its key interactions, plus one edge case.
- Use whatever drives a real browser in this environment: Playwright (`npx playwright` with chromium) in CI, or the browser / computer-use tools in an interactive session.

## 4. Record the proof
Save screenshots (before/after where it makes sense) and, when possible, a short video/trace to `factory-proof/`. Add to the PR description:

```
## Visual proof
Path walked: 1) ... 2) ... 3) ...
- before.png - ...
- after.png - ...
Artifacts: <link to CI run artifacts or attached images>
```

If the app could not launch or the path could not be reached, say so plainly. That is a finding, not a failure to hide.

## 5. Gotchas (append as you learn)
Keep project-specific lessons in the `## Verification gotchas` section of CLAUDE.md, e.g. ports, required env vars, seeded logins, flaky selectors. Add a line whenever verification cost you a retry.
