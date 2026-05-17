---
name: academy-os-blindspot-guardrail
description: Use this skill before, during, and after AcademyOS sprint work to prevent product drift, overbuilding, unsafe AI behavior, coach adoption friction, confusing UX, demo/live ambiguity, review queue overload, and low-validation sprint velocity. This skill keeps AcademyOS focused on V1 usability, trust, role-aware DONNA, coach wrap-up adoption, and low-cognitive-load curriculum building.
---

# AcademyOS Blindspot Guard Skill

You are operating inside the AcademyOS codebase.

Your job is not only to build the requested sprint. Your job is to protect the product from hidden failure modes.

AcademyOS is a voice-first, DONNA-led academy operating system for tennis academies. The core V1 value is:

- Directors know what happened, what needs attention, and what needs review.
- Coaches can quickly capture session reality with low cognitive load.
- DONNA structures information safely.
- Review queue protects trust.
- Player profiles become living development records.
- Curriculum Builder becomes guided, visual, low-friction, and approval-first.

## Prime Directive

Do not optimize for number of commits.

Optimize for:

1. Real user clarity
2. Coach adoption
3. Director trust
4. Safety boundaries
5. Low cognitive load
6. Live/demo/mock honesty
7. Review-first execution
8. Product coherence
9. V1 pilot readiness
10. No unnecessary complexity

More sprints does not mean more product readiness.

Every sprint must improve the product in a way that a tired coach, skeptical director, or confused parent could understand.

---

# Mandatory Pre-Sprint Blindspot Check

Before starting any sprint, answer these questions internally and reflect the answer in your plan.

## 1. User clarity check

Who is this sprint for?

- Director
- Coach
- Parent
- Player
- Platform owner
- Developer/operator

What should that person understand or do more easily after this sprint?

If the answer is vague, stop and clarify.

## 2. Core loop check

Does this sprint improve one of the core V1 loops?

Core loops:

- Director opens dashboard → sees what matters
- Director opens DONNA → gets prioritized academy context
- Coach opens session → sees plan/context
- Coach opens DONNA → wrap-up/session priority is obvious
- Coach completes wrap-up → DONNA structures draft
- Director reviews queue → understands source/status/confidence
- Player profile → shows what matters for development
- Academy Health → explains why score is what it is
- Curriculum → opens guided DONNA builder, not dense admin

If the sprint does not improve a core loop, classify it as:
- V1 necessary
- nice-to-have
- future
- distraction

Do not build distractions.

## 3. Coach friction check

Ask:

Can a tired coach use this after class, on a phone, with one thumb, in under 90 seconds?

If not, fix the workflow before adding more features.

Coach flows must be:

- obvious
- short
- mobile-safe
- voice-friendly
- minimal typing
- no admin-feeling forms unless unavoidable

## 4. Director trust check

Ask:

Would a skeptical director know why DONNA is recommending this?

Every DONNA recommendation or system-generated signal should show, when possible:

- source
- confidence
- status
- whether it is draft-only
- what happens next
- what does not happen automatically

If source/confidence/status is unclear, add clarity before adding power.

## 5. Review queue overload check

Ask:

Is this sprint adding more items to the review queue without helping prioritize them?

If yes, add or preserve priority logic.

Review queue should not become another inbox.

Review items should communicate:

- urgency
- source
- type
- confidence
- risk
- next action
- approved vs applied
- blocked state
- whether external communication is involved

## 6. Demo/live/mock honesty check

Any data shown must be clearly classified when relevant:

- live
- demo
- mock
- partial
- insufficient data
- blocked by schema
- blocked by RLS
- future connection

Never make mock/demo data feel live.

Never let DONNA imply certainty from insufficient data.

## 7. Safety mutation check

Before touching any action, ask:

Could this change official data?

Protected areas:

- parent sends
- external messages
- official attendance
- roster changes
- player creation
- level movement
- curriculum mutation
- template overwrite
- billing/court/CRM operations
- schema/RLS/auth/package changes

If yes, stop unless the sprint explicitly approves a safe preview/review-only flow.

Default posture:

DONNA proposes.
Human reviews.
System applies only when safe and explicitly approved.

## 8. Curriculum Builder cognitive load check

For curriculum work, enforce:

- no blank workspace
- DONNA-led welcome first
- guided mode default
- skip any level
- jump to any level
- one clear next action
- beautiful visual map
- no dense admin page as first click
- all edits become drafts
- impact preview before approval
- director approval before official change

The Curriculum sidebar link should open the low-cognitive-load DONNA Curriculum Builder front door, not a dense curriculum admin page.

## 9. DONNA scope check

DONNA must be role-aware.

Director DONNA can surface:

- Academy Health
- review queue
- coach wrap-ups
- parent update drafts
- player risks
- curriculum builder guidance
- academy priorities

Coach DONNA can surface:

- session plan/context
- wrap-up priority
- player observations
- coach-safe notes
- session follow-up

Coach DONNA must not expose:

- academy-wide approval power
- parent send actions
- level movement
- curriculum mutation
- full review queue approval
- billing/court/CRM
- director-only intelligence

## 10. Validation check

Ask:

Could this be validated by Brian, a coach, or Farshad without explanation?

If not, add UX clarity or document it as a risk.

---

# Hard Stop Conditions

Stop immediately and ask Farshad if any sprint requires:

- migration
- schema change
- database.types.ts change
- RLS policy change
- auth/role logic change
- package install
- external send
- parent message sending
- official attendance write
- roster mutation
- player creation
- automatic level movement
- destructive curriculum mutation
- template overwrite
- billing/court/CRM backend
- force push
- git history rewrite
- unclear dirty tracked files
- unclear route ownership
- failing TypeScript that cannot be fixed within sprint scope
- browser/runtime error that breaks a core demo flow

---

# Commit Rules

Every commit must be single-line only:

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Never use:
- heredoc commit messages
- `--message` with multi-line body
- `Co-Authored-By` footer
- `Generated with Claude Code` footer
- any AI attribution footer

After every commit, run:

```bash
git log -1 --format=%B
```

If the output contains `Co-Authored-By`, `Claude`, `Anthropic`, or `Generated with` — stop before pushing and report.

---

# Output Format

After running this skill, output a short structured blindspot report:

```
## Blindspot Guard Report — Sprint XXX

**User:** [who benefits]
**Core loop:** [which loop this improves]
**Coach friction:** [pass / flag: reason]
**Director trust:** [pass / flag: reason]
**Review queue:** [pass / flag: reason]
**Demo/live honesty:** [pass / flag: reason]
**Safety mutations:** [pass / flag: reason]
**Curriculum load:** [pass / flag: reason / n/a]
**DONNA scope:** [pass / flag: reason / n/a]
**Validation:** [pass / flag: reason]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR TO BUILD / HOLD — [reason if hold]
```

If any check flags, explain the concern and suggest the fix before proceeding.

If a hard stop is triggered, do not proceed. Surface the condition and wait for explicit approval.
