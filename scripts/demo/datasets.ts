// Sprint 4373 — Dataset registry for the shared demo seed/reset runners.
//
// Lets ONE seed.ts / reset.ts materialize either the God-Mode demo academy OR the Dabul
// pilot academy, selected by the DEMO_DATASET env var. This is the re-skin seam: no new
// seed system, just a parameter. Default stays God-Mode for backward compatibility.
//
// assertSafeTarget is the production guard: it refuses the live backend always, and — for
// datasets that pin a project ref (Dabul) — refuses any target that is not that pilot ref.

import {
  demoAcademyGodModeV1,
  DEMO_ACADEMY_ID,
  SEED_BATCH_ID as GODMODE_SEED_BATCH_ID,
  isDemoResettable,
  type DemoAcademyDataset,
} from './demoAcademyGodModeV1'
import {
  dabulPilotV1,
  DABUL_PILOT_ACADEMY_ID,
  DABUL_SEED_BATCH_ID,
  DABUL_PILOT_PROJECT_REF,
  DABUL_EMAIL_DOMAIN,
  isDabulResettable,
} from './dabulPilotV1'

/** The live app backend — NEVER a valid seed/reset target for any dataset. */
export const FORBIDDEN_PROD_REF = 'dbjjhhxdkpdreytsozlq' as const

export interface DatasetBundle {
  key: string
  dataset: DemoAcademyDataset
  academyId: string
  seedBatchId: string
  isResettable: (row: { is_demo_data?: boolean | null; seed_batch_id?: string | null }) => boolean
  /** Fake, non-routable domain for auth users. */
  emailDomain: string
  /** If set, the target URL MUST contain this project ref (explicit pilot target). */
  requiredProjectRef?: string
}

const REGISTRY: Record<string, DatasetBundle> = {
  demo_academy_godmode_v1: {
    key: 'demo_academy_godmode_v1',
    dataset: demoAcademyGodModeV1,
    academyId: DEMO_ACADEMY_ID,
    seedBatchId: GODMODE_SEED_BATCH_ID,
    isResettable: isDemoResettable,
    emailDomain: 'godmode.test',
    // No pinned ref (legacy behavior); the prod guard below still applies.
  },
  dabul_pilot_v1: {
    key: 'dabul_pilot_v1',
    dataset: dabulPilotV1,
    academyId: DABUL_PILOT_ACADEMY_ID,
    seedBatchId: DABUL_SEED_BATCH_ID,
    isResettable: isDabulResettable,
    emailDomain: DABUL_EMAIL_DOMAIN,
    requiredProjectRef: DABUL_PILOT_PROJECT_REF,
  },
}

export const DATASET_KEYS = Object.keys(REGISTRY)

/** Resolve the dataset bundle selected by DEMO_DATASET (default: God-Mode). */
export function resolveDataset(env: Record<string, string | undefined> = process.env): DatasetBundle {
  const key = env.DEMO_DATASET || 'demo_academy_godmode_v1'
  const bundle = REGISTRY[key]
  if (!bundle) {
    throw new Error(`Unknown DEMO_DATASET="${key}". Known datasets: ${DATASET_KEYS.join(', ')}`)
  }
  return bundle
}

/**
 * Refuse to run a seed/reset against an unsafe target. Never contacts the network — it
 * only inspects the configured Supabase URL string.
 *   • No URL             → refuse (explicit target required).
 *   • URL is production   → refuse always.
 *   • dataset pins a ref  → URL must contain that ref, else refuse.
 */
export function assertSafeTarget(bundle: DatasetBundle, url: string | undefined): void {
  if (!url || url.trim() === '') {
    throw new Error('REFUSING: no Supabase URL in env — an explicit pilot target is required (never .env.local).')
  }
  if (url.includes(FORBIDDEN_PROD_REF)) {
    throw new Error(`REFUSING: target URL points at PRODUCTION (${FORBIDDEN_PROD_REF}). Aborting.`)
  }
  if (bundle.requiredProjectRef && !url.includes(bundle.requiredProjectRef)) {
    throw new Error(
      `REFUSING: dataset "${bundle.key}" may only target project ref ${bundle.requiredProjectRef}; ` +
        'the configured Supabase URL does not match. Aborting.',
    )
  }
}
