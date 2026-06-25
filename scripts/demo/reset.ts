// Mega Sprint 4291–4320 — Demo reset (npm run demo:reset).
//
// Deletes ONLY the God Mode demo academy and everything under it. Safety is layered:
//   1. It targets exactly one academy id (DEMO_ACADEMY_ID).
//   2. It refuses unless that row satisfies isDemoResettable (is_demo_data=true AND the
//      exact seed_batch_id) — a real academy can never match.
//   3. Deleting the academy cascades to every child (academy_id ON DELETE CASCADE).
//   4. Demo auth users (the director + coaches) are removed too, so nothing is orphaned.
//   5. Dry-run by default — pass --confirm to actually delete.
//
// Run: node --env-file=.env.local --import tsx scripts/demo/reset.ts [--confirm]

import { getDemoServiceClient } from './demoClient'
import { DEMO_ACADEMY_ID, SEED_BATCH_ID, isDemoResettable } from './demoAcademyGodModeV1'

async function main() {
  const confirm = process.argv.includes('--confirm')
  const db = getDemoServiceClient()

  const { data: academy, error } = await db
    .from('academies')
    .select('id, name, is_demo_data, seed_batch_id')
    .eq('id', DEMO_ACADEMY_ID)
    .maybeSingle()

  if (error) throw new Error(`Lookup failed: ${error.message}`)
  if (!academy) {
    console.log(`No demo academy found (id ${DEMO_ACADEMY_ID}). Nothing to reset.`)
    return
  }

  // The hard safety gate: refuse to delete anything that is not tagged demo data.
  if (!isDemoResettable(academy as { is_demo_data?: boolean | null; seed_batch_id?: string | null })) {
    throw new Error(
      `REFUSING TO DELETE: academy ${DEMO_ACADEMY_ID} ("${(academy as { name: string }).name}") is not tagged ` +
        `is_demo_data=true + seed_batch_id=${SEED_BATCH_ID}. This is not demo data.`,
    )
  }

  // Collect demo auth users (profiles.id === auth.users.id) before the cascade removes profiles.
  const { data: profiles } = await db.from('profiles').select('id').eq('academy_id', DEMO_ACADEMY_ID)
  const authIds = (profiles ?? []).map((p) => (p as { id: string }).id)

  if (!confirm) {
    console.log('DRY RUN — nothing deleted. Would delete:')
    console.log(`  • academy "${(academy as { name: string }).name}" (${DEMO_ACADEMY_ID}) and ALL cascaded child records`)
    console.log(`  • ${authIds.length} demo auth user(s)`)
    console.log('Re-run with --confirm to delete.')
    return
  }

  // Cascade delete: removing the academy removes every academy_id-scoped child.
  const { error: delErr } = await db.from('academies').delete().eq('id', DEMO_ACADEMY_ID)
  if (delErr) throw new Error(`Delete failed: ${delErr.message}`)

  // Remove the now-orphaned demo auth users.
  let removedAuth = 0
  for (const id of authIds) {
    const { error: aErr } = await db.auth.admin.deleteUser(id)
    if (!aErr) removedAuth += 1
  }

  console.log(`✓ Reset complete. Deleted demo academy + cascaded children; removed ${removedAuth}/${authIds.length} auth users.`)
}

main().catch((e) => {
  console.error(`Demo reset error: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
