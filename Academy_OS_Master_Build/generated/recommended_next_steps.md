# RECOMMENDED NEXT STEPS
**Generated:** 2026-04-27

## Immediate actions (before any code is written)

### Step 1: Resolve blocking decisions
Open `MISSING_ITEMS_AND_DECISIONS.md` and decide:

| Decision | Recommended | Action needed |
|---|---|---|
| P1 — V1 roles | director, head_coach, coach, player | CONFIRM |
| P3 — Voice in V1 | typed input only, same pipeline | CONFIRM |
| P4 — First live feature | placement engine | CONFIRM |
| T1 — Framework | Next.js 14 + Supabase | CONFIRM |
| T3 — Auth method | Supabase Auth, email+password | CONFIRM |
| D1 — Track taxonomy | skill, competition, fitness, combined | CONFIRM |
| D3 — Assessment scale | 1–10 decimal | CONFIRM |

These can all be confirmed in 20 minutes. Block nothing else.

---

## Step 2: Set up Supabase project
1. Create project at supabase.com
2. Save URL, anon key, service role key
3. Run migrations 0001–0009 in order
4. Create first admin user
5. Generate TypeScript types

Time: ~2 hours

---

## Step 3: Initialize Next.js project
```bash
npx create-next-app@latest academy-os --typescript --tailwind --app --src-dir
cd academy-os
npm install @supabase/supabase-js @supabase/ssr
```

Copy TypeScript scaffolds from `src/lib/` into the new project.
Copy design system CSS variables from `index.html` into globals.css.

Time: ~1 hour

---

## Step 4: Build placement engine (first live feature)
Following Package 04 spec:
1. New player form (create player shell)
2. Assessment runner (4 layers, sliders)
3. Recommendation display (AI call to Claude)
4. Director approval screen
5. `finalize_player_placement()` called on approval

This is the first complete end-to-end feature. Every layer is exercised:
- Database ✅
- Auth + RLS ✅
- Server action ✅
- AI recommendation ✅
- Approval flow ✅
- Audit log ✅

When placement works, the rest is variations on this pattern.

---

## After placement engine
Build in this order (from BUILD_ORDER.md):
1. Player profile view (shows placement result)
2. Group management
3. Template builder
4. Session creation
5. Coach observations
6. Voice pipeline shell ("Tell the OS")

---

## What NOT to do yet

- Do NOT build a mobile app
- Do NOT build parent portal
- Do NOT integrate real Whisper (V2)
- Do NOT build multi-academy support
- Do NOT build billing
- Do NOT build `app.html` prototype if building the real app (they are separate)

The `app.html` prototype in this repo is a UI/UX reference tool, not a foundation for the real app.
