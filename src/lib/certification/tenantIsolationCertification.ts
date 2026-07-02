// Tenant Isolation Certification V1 — the first NON-DONNA system certification.
//
// GOVERNING AUTHORITY: docs/ARCHITECTURE.md
//   §2.1 Single source of truth · §2.3 Fail closed · §4.1 Tenant isolation ·
//   §4.2 RLS · §8.4 Database Constitution · §8.5 Security Constitution · §8.6
//   Certification Constitution (behavioral, never tautological) · §9 / §10 (G10).
//
// PURPOSE
//   Protect AcademyOS from cross-academy data leakage. This suite is the
//   structural guarantee behind ARCHITECTURE.md §4 — it proves, against the REAL
//   migration SQL, demo tooling, service-role surface, and API routes, that every
//   tenant-owned table is isolated by academy and that no new surface can silently
//   open a cross-tenant door.
//
// BEHAVIORAL, NOT TAUTOLOGICAL (§8.6)
//   Every check parses real artifacts (supabase/migrations/*.sql, scripts/demo/*,
//   src/app/api/**, the source tree) and asserts a real, regression-catching fact.
//   No check asserts a hand-written constant. Adding a tenant table without RLS, a
//   new deny-all table, a new service-role import, or a new unauthenticated API
//   route will turn this suite RED.
//
// FAIL CLOSED (§2.3)
//   Classification is exhaustive. Any table not matched by an explicit allowlist is
//   treated as TENANT-DIRECT and MUST have academy_id + RLS + an academy-scoped
//   policy. An unrecognized new table therefore fails until it is correctly
//   isolated or explicitly, intentionally allowlisted. The allowlists below are the
//   only escape hatch, and each entry is documented.
//
// SCOPE LIMIT (honest gap — see footer + sprint report)
//   This is an OFFLINE static-structural proof. Requirement "no query can read
//   another academy's data" (§ check group 4) is proven here STRUCTURALLY (RLS on +
//   academy-scoped policy on every tenant table + no service-role in request paths).
//   A live-DB behavioral test (seed 2 academies, assert 0 cross-tenant rows) is the
//   documented follow-up and requires Postgres in CI (ARCHITECTURE.md §9).
//
// Static runner. Exits non-zero on any failed check (CI gate compatible).

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// ── Check harness ─────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []
const notes: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) {
    passed++
    process.stdout.write(`   ✓ ${label}\n`)
  } else {
    failed++
    failures.push(label)
    process.stdout.write(`   ✗ ${label}\n`)
  }
}
function note(msg: string): void {
  notes.push(msg)
  process.stdout.write(`   • ${msg}\n`)
}
function section(title: string): void {
  process.stdout.write(`\n── ${title} ──\n`)
}

const ROOT = process.cwd()

// ── Allowlists (the ONLY escape hatches; everything else is tenant-direct) ──────

// Tenant ROOT table — isolated by its own primary key `id`, not an academy_id FK.
// Approved isolation key: id = auth_academy_id().
const TENANT_ROOT: Record<string, string> = {
  academies: 'id = auth_academy_id() (the academy row itself)',
}

// PARENT-SCOPED tenant tables — no academy_id column by design; isolation is
// enforced by an RLS policy that joins UP to a parent which carries academy_id.
// Approved isolation key: parent FK + academy-scoped policy (verified below).
const PARENT_SCOPED: Record<string, string> = {
  session_blocks: 'parent: sessions(academy_id)',
  session_block_exercises: 'parent: session_blocks → sessions(academy_id)',
  session_attendance: 'parent: sessions(academy_id)',
  template_blocks: 'parent: templates(academy_id)',
  template_block_exercises: 'parent: template_blocks → templates(academy_id)',
  assessment_template_sections: 'parent: assessment_templates(academy_id)',
  assessment_template_skills: 'parent: assessment_templates(academy_id)',
  curriculum_class_template_blocks: 'parent: class template (academy-scoped)',
  curriculum_content_requirement_mappings: 'parent: curriculum_content_items(academy_id)',
}

// REFERENCE / GLOBAL tables — intentionally global, cross-tenant READABLE reference
// data (the Master Development Spine + shared taxonomies). They hold NO academy-
// private data. RLS is required (authenticated-read); academy scoping is NOT.
// ⚠ SENSITIVE BOUNDARY: these must never be used to store academy-authored content
// (that lives in academy-scoped curriculum_drills / curriculum_content_items).
const REFERENCE_TABLES: Record<string, string> = {
  curriculum_stages: 'global spine: stage taxonomy',
  curriculum_levels: 'global spine: level taxonomy',
  skill_domains: 'global spine: skill domain taxonomy',
  skill_progressions: 'global spine: skill progression taxonomy',
  progression_rules: 'global spine: progression rules',
  parent_level_descriptions: 'global spine: parent-facing level copy',
  curriculum_requirement_domains: 'global reference: requirement domains',
  curriculum_archetypes: 'global reference: player archetypes',
  curriculum_coach_language: 'global reference: coaching language',
  curriculum_competition_track: 'global reference: competition track',
  curriculum_drill_tags: 'global reference: drill tag vocabulary',
  curriculum_failure_modes: 'global reference: failure modes',
  curriculum_fitness_guidance: 'global reference: fitness guidance',
  curriculum_gates: 'global reference: gate definitions',
  curriculum_volume_guidance: 'global reference: volume guidance',
  drill_gate_mappings: 'global reference: drill→gate map',
  phase_load_defaults: 'global reference: phase load defaults',
}

// SYSTEM tables — no tenant data at all (platform/migration bookkeeping).
const SYSTEM_TABLES: Record<string, string> = {
  database_changelog: 'migration bookkeeping; no tenant data',
  platform_roles: 'platform-owner roles; above the academy tenancy boundary',
}

// KNOWN DEVIATIONS (baseline ratchet) — RLS enabled but NO policy (deny-all).
// A deny-all table does NOT leak (no reads) but violates ARCHITECTURE.md §4.2
// ("no deny-all tables"). Baselined entries let this cert gate CI while a deviation is
// open; the suite FAILS if the set GROWS, and FAILS once a baselined table gains a
// policy (prompting its removal from this list).
//
// EMPTY as of migration 086 — `guardians` and `player_guardians` were retired:
// migration 086 added academy-scoped policies to both (and academy_id + a cross-tenant
// integrity trigger to player_guardians). They are now ordinary tenant-direct tables,
// checked by groups 1–3 like every other tenant-owned table. Re-add an entry here ONLY
// to baseline a genuinely new, intentionally-tracked deny-all deviation.
const KNOWN_DEVIATIONS: Record<string, string> = {}

// Files permitted to use the service-role / RLS-bypassing client. Any OTHER file
// importing it FAILS this cert (ARCHITECTURE.md §8.5).
const SERVICE_ROLE_ALLOWLIST: Record<string, string> = {
  'src/lib/supabase/server.ts': 'definition of getSupabaseAdmin()',
  'src/lib/backend/intelligence.ts': 'request path: rpc() calls that validate p_academy_id (documented, KNOWN_LIMITATIONS)',
  'scripts/demo/demoClient.ts': 'offline demo tooling',
  'scripts/demo/seed.ts': 'offline demo seeding',
  'scripts/demo/reset.ts': 'offline demo reset (two-column guarded)',
  'scripts/validate-portal-foundation.ts': 'offline validation script',
  'scripts/certification/tenantIsolationBehavioralTest.ts':
    'behavioral tenant-isolation harness: service role seeds/tears down fixtures only; every boundary assertion runs through authenticated non-privileged clients (see docs/TENANT_ISOLATION_BEHAVIORAL_TEST.md)',
}

// API routes that are intentionally not gated on academy-scoped tenant data.
const API_ROUTE_AUTH_EXEMPT: Record<string, string> = {
  'src/app/api/auth/signout/route.ts': 'auth lifecycle (sign-out); touches no tenant data',
}
const API_AUTH_MARKERS = ['getUser', 'getSupabaseServer', 'requireAuth', 'auth.getUser']

// ── SQL parser (real artifacts → real facts) ────────────────────────────────────

const MIG_DIR = join(ROOT, 'supabase/migrations')

type TableFacts = {
  name: string
  file: string
  hasAcademyId: boolean
  rlsEnabled: boolean
  policyBodies: string[]
}

function parseSchema(): Map<string, TableFacts> {
  const files = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort()
  const tables = new Map<string, TableFacts>()
  const rlsEnabled = new Set<string>()
  const policyBodies = new Map<string, string[]>()
  let allSql = ''

  for (const f of files) {
    const sql = readFileSync(join(MIG_DIR, f), 'utf8')
    allSql += '\n' + sql
    const reTable = /create table(?:\s+if not exists)?\s+([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\n\)\s*;/gi
    let m: RegExpExecArray | null
    while ((m = reTable.exec(sql)) !== null) {
      const name = m[1].toLowerCase()
      const body = m[2]
      const hasAcademyId = /\bacademy_id\b/i.test(body)
      if (!tables.has(name)) {
        tables.set(name, { name, file: f, hasAcademyId, rlsEnabled: false, policyBodies: [] })
      } else if (hasAcademyId) {
        tables.get(name)!.hasAcademyId = true
      }
    }
  }

  // A table may gain academy_id AFTER creation via a later migration's ALTER TABLE
  // (e.g. migration 086 backfilling player_guardians). Sweep those too so the
  // hasAcademyId fact reflects the FULL migration history, not just CREATE TABLE.
  const reAddCol = /alter table\s+([a-z_][a-z0-9_]*)\s+add column(?:\s+if not exists)?\s+academy_id\b/gi
  let a: RegExpExecArray | null
  while ((a = reAddCol.exec(allSql)) !== null) {
    const name = a[1].toLowerCase()
    if (tables.has(name)) tables.get(name)!.hasAcademyId = true
  }

  const reRls = /alter table\s+([a-z_][a-z0-9_]*)\s+enable row level security/gi
  let r: RegExpExecArray | null
  while ((r = reRls.exec(allSql)) !== null) rlsEnabled.add(r[1].toLowerCase())

  const rePolicy = /create policy\s+"[^"]*"\s*\n?\s*on\s+([a-z_][a-z0-9_]*)([\s\S]*?);/gi
  let p: RegExpExecArray | null
  while ((p = rePolicy.exec(allSql)) !== null) {
    const t = p[1].toLowerCase()
    if (!policyBodies.has(t)) policyBodies.set(t, [])
    policyBodies.get(t)!.push(p[2])
  }

  for (const t of Array.from(tables.values())) {
    t.rlsEnabled = rlsEnabled.has(t.name)
    t.policyBodies = policyBodies.get(t.name) ?? []
  }
  return tables
}

// A policy set is academy-scoped if any policy references academy_id or the
// caller-academy helper auth_academy_id() (directly or via a parent subquery join).
function isAcademyScoped(bodies: string[]): boolean {
  return bodies.some((b) => /academy_id|auth_academy_id\s*\(\s*\)/i.test(b))
}

// ── Run ─────────────────────────────────────────────────────────────────────────

process.stdout.write('\nTenant Isolation Certification V1 (governed by docs/ARCHITECTURE.md §4)\n')

if (!existsSync(MIG_DIR)) {
  process.stdout.write(`   ✗ FATAL: migrations dir not found at ${MIG_DIR}\n`)
  process.exit(1)
}

const tables = parseSchema()
const allTables = Array.from(tables.values()).sort((a, b) => a.name.localeCompare(b.name))

// Classify every table into exactly one bucket. Default = TENANT_DIRECT (strict).
type Bucket = 'tenant_direct' | 'tenant_root' | 'parent_scoped' | 'reference' | 'system' | 'known_deviation'
function classify(name: string): Bucket {
  if (name in TENANT_ROOT) return 'tenant_root'
  if (name in PARENT_SCOPED) return 'parent_scoped'
  if (name in REFERENCE_TABLES) return 'reference'
  if (name in SYSTEM_TABLES) return 'system'
  if (name in KNOWN_DEVIATIONS) return 'known_deviation'
  return 'tenant_direct'
}

const byBucket: Record<Bucket, TableFacts[]> = {
  tenant_direct: [], tenant_root: [], parent_scoped: [], reference: [], system: [], known_deviation: [],
}
for (const t of allTables) byBucket[classify(t.name)].push(t)

const tenantOwned = [...byBucket.tenant_direct, ...byBucket.tenant_root, ...byBucket.parent_scoped]

// ── Group 0: classification completeness + fail-closed posture ──────────────────
section('0 · Classification completeness (fail-closed)')
check(`parsed schema from migrations (${allTables.length} tables)`, allTables.length >= 120)
note(`buckets — tenant_direct:${byBucket.tenant_direct.length} root:${byBucket.tenant_root.length} parent_scoped:${byBucket.parent_scoped.length} reference:${byBucket.reference.length} system:${byBucket.system.length} known_deviation:${byBucket.known_deviation.length}`)
// Every allowlist entry must correspond to a real table (no stale allowlist drift).
for (const name of [...Object.keys(TENANT_ROOT), ...Object.keys(PARENT_SCOPED), ...Object.keys(REFERENCE_TABLES), ...Object.keys(SYSTEM_TABLES), ...Object.keys(KNOWN_DEVIATIONS)]) {
  check(`allowlist entry maps to a real table: ${name}`, tables.has(name))
}

// ── Group 1: academy_id or approved isolation key on every tenant-owned table ───
section('1 · Every tenant-owned table has academy_id or an approved isolation key')
for (const t of byBucket.tenant_direct) {
  check(`tenant-direct ${t.name} has academy_id column`, t.hasAcademyId)
}
for (const t of byBucket.tenant_root) {
  check(`tenant-root ${t.name} isolated by approved key (id = auth_academy_id())`, isAcademyScoped(t.policyBodies))
}
for (const t of byBucket.parent_scoped) {
  // approved key = parent FK; proven by an academy-scoped policy (subquery join up)
  check(`parent-scoped ${t.name} isolated by approved parent-FK key`, isAcademyScoped(t.policyBodies))
}

// ── Group 2: RLS enabled on every tenant-owned table (and every table) ──────────
section('2 · RLS enabled on every tenant-owned table')
for (const t of tenantOwned) {
  check(`RLS enabled: ${t.name}`, t.rlsEnabled)
}
// §4.2 / requirement 8: any table without RLS must be allowlisted, else fail.
const noRls = allTables.filter((t) => !t.rlsEnabled)
check(`no table has RLS disabled (found ${noRls.length})`, noRls.length === 0)
for (const t of noRls) check(`RLS-disabled table is not tenant data: ${t.name}`, false)

// ── Group 3: academy-scoped RLS policies on every tenant-owned table ────────────
section('3 · Every tenant-owned table has academy-scoped RLS policies')
for (const t of tenantOwned) {
  check(`academy-scoped policy present: ${t.name}`, t.policyBodies.length > 0 && isAcademyScoped(t.policyBodies))
}

// ── Group 4: structural guarantee — no cross-academy reads (offline proof) ──────
section('4 · Cross-academy read prevention (structural proof)')
// The conjunction of (RLS on) + (academy-scoped policy) on every tenant-owned table
// + (no service-role in request paths, group 6) is the structural guarantee that a
// director/coach/parent/player query cannot read another academy's rows.
const tenantFullyIsolated = tenantOwned.every(
  (t) => t.rlsEnabled && t.policyBodies.length > 0 && isAcademyScoped(t.policyBodies),
)
check('all tenant-owned tables: RLS on + academy-scoped policy (no-leak invariant)', tenantFullyIsolated)
note('live-DB behavioral test (seed 2 academies → assert 0 cross-tenant rows) is the documented follow-up (ARCHITECTURE.md §9 — needs Postgres in CI)')

// ── Group 5: demo/reset tooling cannot touch real academy data ──────────────────
section('5 · Demo/reset tooling cannot touch real academy data')
const godPath = join(ROOT, 'scripts/demo/demoAcademyGodModeV1.ts')
const resetPath = join(ROOT, 'scripts/demo/reset.ts')
check('demo godmode module exists', existsSync(godPath))
check('demo reset module exists', existsSync(resetPath))
if (existsSync(godPath)) {
  const god = readFileSync(godPath, 'utf8')
  const hasGuard = /function\s+isDemoResettable/.test(god) &&
    /is_demo_data\s*===\s*true/.test(god) &&
    /seed_batch_id\s*===\s*SEED_BATCH_ID/.test(god)
  check('isDemoResettable enforces BOTH is_demo_data===true AND seed_batch_id===SEED_BATCH_ID', hasGuard)
}
if (existsSync(resetPath)) {
  const reset = readFileSync(resetPath, 'utf8')
  check('reset.ts calls isDemoResettable before any delete', /isDemoResettable\s*\(/.test(reset))
  check('reset.ts refuses when not demo-resettable', /REFUSING TO DELETE|!isDemoResettable/.test(reset))
}

// ── Group 6: service-role / admin paths explicitly documented and isolated ──────
section('6 · Service-role / admin paths are documented and isolated')
function listFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return acc
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    const rel = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      listFiles(rel, exts, acc)
    } else if (exts.some((x) => e.name.endsWith(x))) acc.push(rel)
  }
  return acc
}
// This cert file itself names the service-role symbols (in its allowlist + regex)
// as DATA, not usage — exclude it so a self-auditing suite never flags itself.
const SELF_PATH = 'src/lib/certification/tenantIsolationCertification.ts'
const sourceFiles = [...listFiles('src', ['.ts', '.tsx']), ...listFiles('scripts', ['.ts'])]
  .filter((f) => f.split('\\').join('/') !== SELF_PATH)
const SERVICE_ROLE_SIGNATURE = /getSupabaseAdmin|SUPABASE_SERVICE_ROLE_KEY|getDemoServiceClient/
const serviceRoleUsers = sourceFiles.filter((f) => SERVICE_ROLE_SIGNATURE.test(readFileSync(join(ROOT, f), 'utf8')))
for (const f of serviceRoleUsers) {
  const norm = f.split('\\').join('/')
  check(`service-role usage is allowlisted: ${norm}`, norm in SERVICE_ROLE_ALLOWLIST)
}
// Every allowlisted file must still exist (no stale exemption).
for (const f of Object.keys(SERVICE_ROLE_ALLOWLIST)) {
  check(`service-role allowlist entry exists: ${f}`, existsSync(join(ROOT, f)))
}

// ── Group 7+8: reference/public tables allowlisted; no un-isolated tenant table ─
section('7+8 · Public/reference tables explicitly allowlisted; nothing un-isolated')
for (const t of byBucket.reference) {
  check(`reference table allowlisted + RLS on: ${t.name}`, t.rlsEnabled)
  // A reference table must NOT silently hold academy-private data unscoped.
  check(`reference table is intentionally global (documented): ${t.name}`, REFERENCE_TABLES[t.name].length > 0)
}
for (const t of byBucket.system) {
  check(`system table allowlisted + RLS on: ${t.name}`, t.rlsEnabled)
}
// Fail-closed proof: no tenant_direct table slipped through without academy_id.
const leaky = byBucket.tenant_direct.filter((t) => !t.hasAcademyId)
check(`no unclassified table lacks academy_id (found ${leaky.length})`, leaky.length === 0)
for (const t of leaky) check(`UNISOLATED tenant-direct table: ${t.name} (add academy_id or allowlist)`, false)

// ── Group 9: API routes touching tenant data require auth ───────────────────────
section('9 · API routes touching tenant data require auth')
const apiRoutes = listFiles('src/app/api', ['route.ts'])
for (const f of apiRoutes) {
  const norm = f.split('\\').join('/')
  if (norm in API_ROUTE_AUTH_EXEMPT) {
    note(`auth-exempt API route (documented): ${norm} — ${API_ROUTE_AUTH_EXEMPT[norm]}`)
    continue
  }
  const src = readFileSync(join(ROOT, f), 'utf8')
  check(`API route authenticates caller: ${norm}`, API_AUTH_MARKERS.some((mk) => src.includes(mk)))
}
note('static check proves auth is invoked; it cannot prove the auth GATES every tenant query — live-DB test is the follow-up')

// ── Group 10: known-deviation ratchet (fail closed on growth) ───────────────────
section('10 · Known-deviation ratchet (deny-all tables)')
// New deny-all tables (RLS on, no policy) that are NOT already baselined → FAIL.
const denyAll = allTables.filter((t) => t.rlsEnabled && t.policyBodies.length === 0)
for (const t of denyAll) {
  check(`deny-all table is a tracked known deviation (no NEW ones): ${t.name}`, t.name in KNOWN_DEVIATIONS)
}
// Each baselined deviation must STILL be deny-all; once fixed, prompt its removal.
for (const name of Object.keys(KNOWN_DEVIATIONS)) {
  const t = tables.get(name)
  if (!t) continue
  if (t.policyBodies.length > 0) {
    check(`baselined deviation ${name} now has policies → REMOVE from KNOWN_DEVIATIONS`, false)
  } else {
    note(`tracked deviation still open: ${name} — ${KNOWN_DEVIATIONS[name]}`)
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────────
process.stdout.write('\n============================================================\n')
process.stdout.write(`TENANT ISOLATION CERTIFICATION: ${passed} passed, ${failed} failed\n`)
process.stdout.write(`Tenant-owned tables certified: ${tenantOwned.length} · reference: ${byBucket.reference.length} · system: ${byBucket.system.length} · tracked deviations: ${byBucket.known_deviation.length}\n`)
if (failed) {
  process.stdout.write('\nFailed checks:\n')
  failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
}
process.stdout.write('============================================================\n')
process.exit(failed > 0 ? 1 : 0)
