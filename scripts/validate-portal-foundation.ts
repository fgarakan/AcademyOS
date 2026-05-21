// DEMO_ONLY: Sprint 399 portal foundation validation script.
// Run with: npx tsx scripts/validate-portal-foundation.ts
// Uses service role key — bypasses RLS for dev validation only.
// Do not import or call from application code.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.error('Could not read .env.local')
    process.exit(1)
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const rawDb = db as any

const DEMO_ACADEMY_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_PLAYER_ID  = '00000000-0000-0003-0000-000000000001'

function pass(label: string, detail: string) {
  console.log(`  \x1b[32mPASS\x1b[0m  ${label.padEnd(32)} ${detail}`)
}
function fail(label: string, detail: string) {
  console.log(`  \x1b[31mFAIL\x1b[0m  ${label.padEnd(32)} ${detail}`)
}

async function run() {
  console.log('\n── Sprint 399 Portal Foundation Check ──────────────────')
  console.log(`  Academy: ${DEMO_ACADEMY_ID}`)
  console.log(`  Player:  ${DEMO_PLAYER_ID}`)
  console.log('─────────────────────────────────────────────────────────\n')

  let allPass = true

  // 1. Player
  const { data: player, error: playerErr } = await db
    .from('players')
    .select('id, full_name, is_active, current_level_id')
    .eq('id', DEMO_PLAYER_ID)
    .eq('academy_id', DEMO_ACADEMY_ID)
    .single()

  if (playerErr || !player) {
    fail('Player exists', playerErr?.message ?? 'not found')
    console.log('\n  Cannot continue — player missing.\n')
    process.exit(1)
  }

  const playerNameOk = player.full_name === 'Alex Chen'
  if (playerNameOk) pass('Player name', player.full_name ?? '')
  else { fail('Player name', `expected "Alex Chen", got "${player.full_name}"`) ; allPass = false }

  // 2. Level
  let levelLabel = '(none)'
  if (player.current_level_id) {
    const { data: level } = await db
      .from('academy_levels')
      .select('id, label')
      .eq('id', player.current_level_id)
      .eq('academy_id', DEMO_ACADEMY_ID)
      .single()
    levelLabel = level?.label ?? '(not found)'
  }

  const levelOk = levelLabel === 'Orange Development'
  if (levelOk) pass('Level label', levelLabel)
  else { fail('Level label', `expected "Orange Development", got "${levelLabel}"`) ; allPass = false }

  // 3. Priorities — priority_rank column (rank is a reserved PostgreSQL keyword)
  const { data: priorities, error: prioritiesErr } = await db
    .from('player_priorities')
    .select('id, title, category, priority_rank, urgency, status')
    .eq('player_id', DEMO_PLAYER_ID)
    .eq('academy_id', DEMO_ACADEMY_ID)
    .order('priority_rank', { ascending: true })

  if (prioritiesErr) {
    fail('Priorities query', prioritiesErr.message)
    allPass = false
  } else {
    const count = priorities?.length ?? 0
    const countOk = count === 3
    if (countOk) pass('Priorities count', `${count}`)
    else { fail('Priorities count', `${count} (expected 3)`) ; allPass = false }

    if (priorities && priorities.length > 0) {
      console.log('         Priorities:')
      for (const p of priorities as any[]) {
        console.log(`           #${p.priority_rank} · ${p.title} · ${p.category} · ${p.urgency} · ${p.status}`)
      }
    }
  }

  // 4. Development summary
  const { data: summary } = await rawDb
    .from('player_development_summary')
    .select('id, show_to_student, show_to_parent, source, student_friendly_summary, parent_summary')
    .eq('player_id', DEMO_PLAYER_ID)
    .eq('academy_id', DEMO_ACADEMY_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (summary) {
    pass('Development summary', 'present')
    const ssOk = summary.show_to_student === true
    const spOk = summary.show_to_parent === true
    if (ssOk) pass('show_to_student', 'true')
    else { fail('show_to_student', String(summary.show_to_student)) ; allPass = false }
    if (spOk) pass('show_to_parent', 'true')
    else { fail('show_to_parent', String(summary.show_to_parent)) ; allPass = false }
    console.log(`         source: ${summary.source}`)
    if (summary.student_friendly_summary) {
      console.log(`         student summary: ${summary.student_friendly_summary.slice(0, 80)}…`)
    }
    if (summary.parent_summary) {
      console.log(`         parent summary:  ${summary.parent_summary.slice(0, 80)}…`)
    }
  } else {
    fail('Development summary', 'missing') ; allPass = false
    fail('show_to_student', 'n/a') ; allPass = false
    fail('show_to_parent', 'n/a') ; allPass = false
  }

  // 5. Guardian — any guardian linked to the demo player
  // guardians table uses first_name/last_name columns, not name
  const { data: pgRow } = await rawDb
    .from('player_guardians')
    .select('guardian_id')
    .eq('player_id', DEMO_PLAYER_ID)
    .limit(1)
    .single()

  if (pgRow?.guardian_id) {
    const { data: guardian } = await rawDb
      .from('guardians')
      .select('id, email, first_name, last_name, profile_id')
      .eq('id', pgRow.guardian_id)
      .single()

    if (guardian) {
      const name = [guardian.first_name, guardian.last_name].filter(Boolean).join(' ')
      const emailOk = guardian.email === 'parent@angles-pilot.test'
      if (emailOk) pass('Guardian email', `${name} / ${guardian.email}`)
      else { fail('Guardian email', `expected parent@angles-pilot.test, got "${guardian.email}"`) ; allPass = false }

      if (guardian.profile_id) {
        const { data: profile } = await rawDb
          .from('profiles')
          .select('display_name')
          .eq('id', guardian.profile_id)
          .single()
        if (profile) console.log(`         profile display_name: ${profile.display_name}`)
      }
    } else {
      fail('Guardian row', 'found link but guardian row missing') ; allPass = false
    }
  } else {
    fail('Guardian linked', 'no player_guardians link for demo player') ; allPass = false
  }

  // Summary
  console.log('\n─────────────────────────────────────────────────────────')
  if (allPass) {
    console.log('  \x1b[32mALL CHECKS PASS — portal data foundation is valid.\x1b[0m\n')
  } else {
    console.log('  \x1b[31mONE OR MORE CHECKS FAILED — review seed data.\x1b[0m\n')
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
