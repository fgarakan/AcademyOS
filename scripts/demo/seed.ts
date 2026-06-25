// Mega Sprint 4291–4320 — Demo seed (npm run demo:seed).
//
// Materializes the demoAcademyGodModeV1 dataset into the real schema so DONNA operates
// on true records (no fake runtime signals). Idempotent: it safely resets the demo
// batch first, then inserts. Every record is isolated under ONE demo academy
// (academy_id cascade) and the academy is tagged is_demo_data + seed_batch_id.
//
// NOTE: needs DB access + migrations 084/085 applied. profiles.id === auth.users.id, so
// director/coach profile ids come from auth.admin.createUser. Levels reference the GLOBAL
// curriculum_levels spine (already seeded). Run against staging first to validate.
//
// Run: node --env-file=.env.local --import tsx scripts/demo/seed.ts [--confirm]

import { getDemoServiceClient, STAGE_ENUM } from './demoClient'
import { demoAcademyGodModeV1 as DS, DEMO_ACADEMY_ID, SEED_BATCH_ID, isDemoResettable } from './demoAcademyGodModeV1'

const DAY = 86400000
function isoDate(offsetDays: number): string { return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10) }
function dobForAge(years: number): string { return new Date(Date.now() - years * 365 * DAY).toISOString().slice(0, 10) }

async function safeResetExisting(db: ReturnType<typeof getDemoServiceClient>) {
  const { data: academy } = await db.from('academies').select('id, is_demo_data, seed_batch_id').eq('id', DEMO_ACADEMY_ID).maybeSingle()
  if (!academy) return
  if (!isDemoResettable(academy as { is_demo_data?: boolean | null; seed_batch_id?: string | null })) {
    throw new Error(`REFUSING: academy ${DEMO_ACADEMY_ID} exists but is not tagged demo data. Aborting to protect real data.`)
  }
  const { data: profiles } = await db.from('profiles').select('id').eq('academy_id', DEMO_ACADEMY_ID)
  await db.from('academies').delete().eq('id', DEMO_ACADEMY_ID)
  for (const p of profiles ?? []) await db.auth.admin.deleteUser((p as { id: string }).id)
}

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.log('DRY RUN — pass --confirm to write the demo academy to the database.')
    console.log(`Would seed: 1 academy, 1 director, ${DS.coaches.length} coaches, ${DS.players.length} players, ${DS.parents.length} parents, ${DS.approvals.length} approvals, ${DS.sessions.length} sessions.`)
    return
  }
  const db = getDemoServiceClient()
  await safeResetExisting(db)

  // 1. Academy (tagged demo data).
  const { error: aErr } = await db.from('academies').insert({
    id: DEMO_ACADEMY_ID, name: DS.academy.name, slug: DS.academy.slug, timezone: 'UTC',
    is_active: true, is_demo_data: true, seed_batch_id: SEED_BATCH_ID,
  })
  if (aErr) throw new Error(`academy: ${aErr.message}`)

  // 2. Auth users + profiles for director and coaches (profiles.id === auth.users.id).
  async function makeUser(email: string, displayName: string): Promise<string> {
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true, password: `Demo!${Math.abs(hash(email))}aA1`, user_metadata: { demo: true } })
    if (error || !data.user) throw new Error(`auth ${email}: ${error?.message}`)
    const id = data.user.id
    const { error: pErr } = await db.from('profiles').insert({ id, academy_id: DEMO_ACADEMY_ID, display_name: displayName, email, is_active: true })
    if (pErr) throw new Error(`profile ${email}: ${pErr.message}`)
    return id
  }
  function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h }

  const directorId = await makeUser(DS.director.email, `${DS.director.firstName} ${DS.director.lastName}`)
  await db.from('academy_memberships').insert({ academy_id: DEMO_ACADEMY_ID, profile_id: directorId, role: 'academy_director', is_active: true })

  const coachIdByKey: Record<string, string> = {}
  for (const c of DS.coaches) {
    const id = await makeUser(`${c.firstName.toLowerCase()}.${c.key}@godmode.test`, `${c.firstName} ${c.lastName}`)
    coachIdByKey[c.key] = id
    await db.from('academy_memberships').insert({ academy_id: DEMO_ACADEMY_ID, profile_id: id, role: c.key === 'c3' ? 'head_coach' : 'coach', is_active: true })
  }

  // 3. Players + guardians.
  const ages = [11, 12, 13, 13, 9, 12, 14, 10, 12, 8]
  for (let i = 0; i < DS.players.length; i++) {
    const p = DS.players[i]
    const { error } = await db.from('players').insert({
      id: p.id, academy_id: DEMO_ACADEMY_ID, first_name: p.firstName, last_name: p.lastName,
      date_of_birth: dobForAge(ages[i]), status: p.status, is_active: p.status === 'active',
      primary_coach_id: coachIdByKey[p.coachKey],
      last_assessed_at: p.lastAssessedDaysAgo === null ? null : isoDate(-p.lastAssessedDaysAgo),
    })
    if (error) throw new Error(`player ${p.firstName}: ${error.message}`)
    const par = DS.parents.find((x) => x.childPlayerId === p.id)!
    await db.from('guardians').insert({ academy_id: DEMO_ACADEMY_ID, first_name: par.firstName, last_name: par.lastName, relationship: 'parent', is_primary: true })
  }

  // 4. Curriculum states (global curriculum_levels spine) + development signals.
  for (const p of DS.players) {
    if (p.hasCurriculumState && p.levelStage) {
      const { data: lvl } = await db.from('curriculum_levels').select('id').eq('stage', STAGE_ENUM[p.levelStage]).eq('level_number', 1).maybeSingle()
      if (lvl) {
        await db.from('player_curriculum_states').insert({ player_id: p.id, academy_id: DEMO_ACADEMY_ID, current_level_id: (lvl as { id: string }).id, advancement_eligible: p.advancementEligible })
      }
    }
    for (const sig of p.activeSignals) {
      await db.from('player_development_signals').insert({
        academy_id: DEMO_ACADEMY_ID, player_id: p.id, signal_type: 'score_stagnation', source: sig.type === 'parent_concern' ? 'coach_note' : 'session_outcome',
        severity: sig.severity, title: sig.title, is_active: true,
      })
    }
  }

  // 5. Approvals (need a voice_command FK) — drives pending parent/coach approval signals.
  const { data: vc } = await db.from('voice_commands').insert({ academy_id: DEMO_ACADEMY_ID, issuer_id: directorId, issuer_role: 'academy_director', input_method: 'typed', raw_input: '[demo seed]', processing_status: 'pending' }).select('id').single()
  for (const a of DS.approvals) {
    await db.from('proposed_actions').insert({
      academy_id: DEMO_ACADEMY_ID, voice_command_id: (vc as { id: string }).id, proposed_by_id: directorId,
      action_type: a.targetModule === 'parent_communication' ? 'generate_parent_update' : 'other',
      action_label: a.label, target_module: a.targetModule, target_object_id: a.playerId, target_object_type: 'player',
      proposed_payload: { demo: true }, risk_level: a.riskLevel, status: 'pending_review',
    })
  }

  // 6. Sessions.
  for (const sess of DS.sessions) {
    await db.from('sessions').insert({
      id: sess.id, academy_id: DEMO_ACADEMY_ID, coach_id: coachIdByKey[sess.coachKey], name: sess.name,
      scheduled_date: isoDate(sess.scheduledInDays), status: sess.status,
    })
  }

  console.log(`✓ Seeded "${DS.academy.name}" (${DEMO_ACADEMY_ID}): 1 director, ${DS.coaches.length} coaches, ${DS.players.length} players, ${DS.parents.length} parents, ${DS.approvals.length} approvals, ${DS.sessions.length} sessions.`)
  console.log(`  Director login: ${DS.director.email}`)
}

main().catch((e) => {
  console.error(`Demo seed error: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
