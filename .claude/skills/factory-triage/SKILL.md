---
name: factory-triage
description: Triage a feature request or issue before writing code - decide answer-only, straight-to-build, or spec-first, and grill the requester on open product decisions. Use at the start of any non-trivial change request.
---
# Factory triage and spec

Agents are eager to write code no matter how ambiguous the request. This skill is the gate that stops that.

## 1. Research first
Read the request, its links and attachments, and the code it touches. Also read the project's existing intent docs if present (README, SPEC.md, STRATEGY.md, docs/blueprint.md, IMPLEMENTATION_STATUS.md, .bolt/prompt) and the protected-code list (docs/WORKING_SURFACES.md). Do not ask the requester anything you could answer from these.

## 2. Pick exactly one route

| Route | When |
|---|---|
| **answer** | It's a question, or the right outcome is "don't build this". Reply with the answer and stop. |
| **implement** | A well-defined change: one obvious place to put it, no behaviour choices left open, touches no certified surface. |
| **spec** | Any open product decision (where does it live, what is in scope, what happens in the edge case), or it touches a file listed in docs/WORKING_SURFACES.md, or the requester asked for a spec. |

Record: `goal` (answer / change / unclear), `complexity` (size + open choices), `route`, and why.

## 3. Spec route: grill, then write
Ask only the questions that change what gets built, at most 5, each with your recommended default so the requester can just say "defaults". Always cover:
- **Surface** - where the affordance lives.
- **Scope** - what it applies to and what it doesn't.
- **Edge cases** - the state the requester probably hasn't thought about (open file, empty list, logged-out user, failed payment, offline).

After answers, write the spec. If the repo already has a living spec (SPEC.md, docs/blueprint.md), amend that file instead of creating a new one. Otherwise write `docs/specs/<issue-number>-<slug>.md` with:
1. Product behaviour (what the user sees).
2. Technical approach (files, data flow).
3. Decisions made and assumptions recorded.
4. **Validation checklist** - the exact user flows verification must prove. This becomes the verify-with-proof checklist later.
5. If a certified surface is touched: the breaking-change checklist from docs/WORKING_SURFACES.md, filled in.

Do not start implementation until the requester approves the spec.
