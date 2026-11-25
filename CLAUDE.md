# swagwalletj

Guide for Claude (interactive sessions and the factory workflow).

## Stack
Browser-extension wallet (Rabby fork), React + webpack, yarn. Default branch is `develop`.

## Before you change things, read
- README.md
- changeLogs/

## Sensitive areas
Key management, signing (EIP-712 etc.), approvals, RPC handling - always Impact high.

## Notes
This repo already runs build, CodeQL, Semgrep and Defender CI on every PR - let those run; don't duplicate them. Open PRs against `develop`.

## Commands
```sh
# install
yarn install --immutable
# checks (run all before every PR)
yarn test
npx eslint --ext .js,.jsx,.ts,.tsx ./src
yarn build:dev
# run
yarn build:dev, then load `dist/` as an unpacked extension in Chromium (Playwright `launchPersistentContext` with `--load-extension`)
```

## Factory
Issues labelled `factory` run through `.claude/factory/BLUEPRINT.md` (triage -> spec -> implement -> verify -> merge risk -> PR).
Skills: `.claude/skills/factory-triage`, `verify-with-proof`, `merge-risk`. Use them in interactive sessions too.

## Verification gotchas
<!-- Append one line per lesson learned while verifying (ports, env vars, logins, flaky selectors). -->
