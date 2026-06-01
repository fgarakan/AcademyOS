// Sprint 1090 — DONNA Brian Alpha God Mode Sandbox V1
//
// Controlled alpha testing sandbox for the Dabul Academy pilot.
// Allows authorized academy directors to experience deeper DONNA intelligence
// without triggering automatic multi-tool God Mode reasoning and without
// any risk of mutating official records, sending parent communications,
// publishing curriculum changes, or changing player levels.
//
// ALL sandbox outputs are draft/report/recommendation only — clearly labelled.
//
// Access control — two env vars (both must be configured to enable):
//   NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS
//     Comma-separated list of academyId UUIDs whose directors may access the sandbox.
//     To grant Brian Dabul / Dabul Tennis Academy access: add their live academyId here.
//     Default: empty string = sandbox disabled for all academies.
//     Example: NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS=abc-123,xyz-456
//
//   DONNA_ALPHA_SANDBOX_ENABLED
//     Server-side master switch. Client-side check uses NEXT_PUBLIC_ variant below.
//     NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ENABLED must be 'true' to enable (default: off).
//
// Security notes:
//   - Academy IDs are not personal data — safe to expose via NEXT_PUBLIC_.
//   - For tighter email-based control, use DONNA_ALPHA_SANDBOX_EMAILS (server-side
//     in runDonnaOrchestratorAction) as a secondary guard. Not wired in Sprint 1090.
//   - Disabling: remove or empty NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS.
//   - The sandbox NEVER executes mutations. All outputs are drafts/reports.
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Access control helpers ─────────────────────────────────────────────────────

export interface AlphaSandboxContext {
  academyId: string
}

/**
 * Returns true when the given context is allowed to use the Alpha Sandbox.
 *
 * Checks:
 *   1. NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ENABLED must be 'true' (client-readable master switch).
 *      When absent, defaults to checking the academy ID list alone (if list is non-empty,
 *      sandbox is implicitly enabled for those academies).
 *   2. academyId must appear in NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS.
 *
 * Returns false in all error/missing cases — safe default is always OFF.
 */
export function isBrianAlphaSandboxAllowed(context: AlphaSandboxContext): boolean {
  // Read the master switch (client-accessible NEXT_PUBLIC_ variant)
  const masterSwitch = process.env.NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ENABLED ?? ''
  // If the master switch is explicitly set to 'false', deny regardless
  if (masterSwitch === 'false' || masterSwitch === '0' || masterSwitch === 'no') {
    return false
  }

  // Read the academy ID allowlist
  const rawAllowList = process.env.NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS ?? ''
  if (!rawAllowList.trim()) return false // empty list = disabled

  const allowedIds = rawAllowList
    .split(',')
    .map(id => id.trim().toLowerCase())
    .filter(id => id.length > 0)

  if (allowedIds.length === 0) return false

  return allowedIds.includes(context.academyId.toLowerCase())
}

// ── Sandbox trigger phrase detection ──────────────────────────────────────────

const SANDBOX_TRIGGER_PATTERNS: RegExp[] = [
  /run (brian )?alpha sandbox/i,
  /test donna (god mode|god.?mode)/i,
  /run sandbox (academy )?audit/i,
  /run alpha deep (analysis|mode)/i,
  /test alpha (deep )?mode/i,
  /run dabul alpha (analysis|audit)/i,
  /alpha (sandbox|mode|test|audit|analysis)/i,
  /sandbox (mode|audit|analysis|test)/i,
  /donna (alpha|sandbox) (test|mode|audit|analysis)/i,
]

/**
 * Returns true when the input text matches a known Alpha Sandbox trigger phrase.
 * Used client-side to detect when a director is requesting sandbox access.
 */
export function isBrianAlphaSandboxRequest(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return SANDBOX_TRIGGER_PATTERNS.some(p => p.test(lower))
}

// ── Response builders ──────────────────────────────────────────────────────────

/**
 * Builds the sandbox disclosure response shown to an authorized director.
 *
 * The disclosure:
 *   1. Confirms sandbox / alpha mode is active
 *   2. Clearly states what DONNA can and cannot do in sandbox mode
 *   3. Asks for director confirmation before deeper analysis begins
 */
export function buildBrianAlphaSandboxDisclosure(): string {
  return (
    '**Sandbox / Alpha Analysis — authorized access confirmed.**\n\n' +

    'In alpha sandbox mode, DONNA can run deeper academy analysis using live data — ' +
    'including player development signals, session history, curriculum coverage, coach recap quality, ' +
    'and parent communication coverage.\n\n' +

    '**What sandbox mode will NOT do:**\n' +
    '- Change any official player records or levels\n' +
    '- Send parent or player communications\n' +
    '- Publish curriculum changes\n' +
    '- Modify rosters, billing, or enrollment\n' +
    '- Expose raw coach notes or private data\n\n' +

    '**What sandbox mode produces:**\n' +
    'Draft reports, signal summaries, recommendations, and analysis — all labelled ' +
    '"Sandbox / Alpha Analysis." Nothing becomes official without your explicit approval ' +
    'through the standard review queue.\n\n' +

    'To proceed with a deeper analysis, tell me what you want to investigate:\n' +
    '"audit academy health", "review player bottlenecks", "check curriculum gaps", ' +
    '"analyse coach recap quality", or "show me parent communication coverage."\n\n' +
    '_This is alpha sandbox mode. All outputs are for testing only._'
  )
}

/**
 * Builds the blocked message shown to directors who request sandbox access
 * but whose academyId is not in the allowlist.
 */
export function buildBrianAlphaSandboxBlockedMessage(): string {
  return (
    'Alpha Sandbox mode is not enabled for your academy.\n\n' +
    'Deep analysis testing requires explicit access authorization. ' +
    'Contact your platform administrator to request alpha access.\n\n' +
    'I can still help with page-specific questions, approvals, navigation, ' +
    'and normal DONNA commands.'
  )
}
