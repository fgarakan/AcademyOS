// Mega Sprint 874–903 — DONNA Brain Governance V1
//
// Defines the 5-layer governance contract for the DONNA brain.
// Pure types only — no DB, no runtime logic, no side effects.
//
// Governance layers (outermost to innermost authority):
//   1. Global Brain        — platform owner only; read-only to all academy roles
//   2. Academy Knowledge   — academy-scoped customization; cannot override global logic
//   3. Academy Aliases     — director-controlled display remapping; no new concepts
//   4. Knowledge Inbox     — DONNA suggestion queue; write-only for DONNA
//   5. Promotion Queue     — owner-only gate before anything enters the Global Brain

// ── Layer 1: Global Brain ─────────────────────────────────────────────────────

export type GlobalBrainEntryType =
  | 'vocabulary'       // canonical terms: "group", "session", "wrap-up", "level"
  | 'intent'           // recognised question/command patterns
  | 'decision_rule'    // deterministic logic rules (e.g. "stall = 90+ days")
  | 'philosophy'       // product principles (e.g. "AI proposes, director approves")

export type GlobalBrainEntryStatus =
  | 'active'           // live in DONNA reasoning
  | 'deprecated'       // retained for alias resolution; not used in new reasoning
  | 'retired'          // removed; kept for audit trail only

export interface GlobalBrainEntry {
  id: string                         // stable UUID — never changes after promotion
  type: GlobalBrainEntryType
  key: string                        // machine key, e.g. "intent.coach_needs_support"
  label: string                      // human-readable label
  definition: string                 // canonical definition used in DONNA reasoning
  examples: string[]                 // illustrative examples (not exhaustive)
  status: GlobalBrainEntryStatus
  version: number                    // increments on each owner edit
  promotedAt: string                 // ISO timestamp of first promotion
  promotedBy: string                 // owner user ID
  lastModifiedAt: string
  lastModifiedBy: string
  tags: string[]                     // for search/grouping (e.g. ["coach", "session"])
  relatedKeys: string[]              // cross-references to related global entries
}

// ── Layer 2: Academy Knowledge ────────────────────────────────────────────────

export type AcademyKnowledgeEntryType =
  | 'local_rule'           // academy-specific coaching rule (e.g. "max 6 per group")
  | 'local_preference'     // display or UX preference (e.g. "call groups 'squads'")
  | 'curriculum_mapping'   // local curriculum to global concept mapping

export interface AcademyKnowledgeEntry {
  id: string
  academyId: string
  type: AcademyKnowledgeEntryType
  key: string                        // scoped to academy: "academy.<id>.rule.<name>"
  label: string
  value: string                      // free-text value or JSON-serialised rule
  globalKeyRef: string | null        // if this overrides a global entry, its key
  overridesGlobal: boolean           // true = display override only; global logic still wins
  createdAt: string
  createdBy: string                  // director user ID
  updatedAt: string
  updatedBy: string
  isActive: boolean
}

// ── Layer 3: Academy Aliases ──────────────────────────────────────────────────
//
// Aliases remap display labels only. They resolve to a globalKey.
// A director can say "call sessions 'classes'" — but DONNA's reasoning
// still operates on the global 'session' concept internally.
// Aliases cannot introduce new vocabulary that has no global equivalent.

export interface AcademyAlias {
  id: string
  academyId: string
  globalKey: string                  // the Global Brain entry this alias remaps
  displayLabel: string               // what the director wants DONNA to say
  createdAt: string
  createdBy: string                  // director user ID
  isActive: boolean
}

// Alias resolution result — used by the rendering layer
export interface AliasResolutionResult {
  globalKey: string
  displayLabel: string               // alias if one exists, else global entry label
  isAliased: boolean
}

// ── Layer 4: Knowledge Inbox ──────────────────────────────────────────────────
//
// DONNA's write path for suggesting new knowledge.
// DONNA observes patterns and proposes candidates — it cannot promote itself.
// Inbox items wait for owner review before entering the Promotion Queue.

export type KnowledgeInboxItemType =
  | 'vocabulary_candidate'
  | 'intent_candidate'
  | 'decision_rule_candidate'
  | 'philosophy_candidate'

export type KnowledgeInboxItemStatus =
  | 'pending'            // awaiting owner review
  | 'queued'             // moved to Promotion Queue by owner
  | 'dismissed'          // owner rejected — will not be promoted
  | 'duplicate'          // owner flagged as duplicate of existing global entry

export interface KnowledgeInboxItem {
  id: string
  type: KnowledgeInboxItemType
  suggestedKey: string               // proposed machine key
  suggestedLabel: string
  suggestedDefinition: string
  evidence: string[]                 // observations that prompted the suggestion
  confidence: 'high' | 'medium' | 'low'
  sourceAcademyId: string | null     // which academy context triggered this; null = cross-academy
  suggestedAt: string                // ISO timestamp
  status: KnowledgeInboxItemStatus
  reviewedAt: string | null
  reviewedBy: string | null          // owner user ID
  reviewNote: string | null
  relatedGlobalKeys: string[]        // existing global entries this might relate to
}

// ── Layer 5: Promotion Queue ──────────────────────────────────────────────────
//
// Owner-only gate. Items in this queue have passed initial owner review
// (moved from Inbox) but are not yet live in the Global Brain.
// The owner must explicitly approve before a PromotionQueueItem becomes
// a GlobalBrainEntry. No other role can trigger promotion.

export type PromotionQueueItemStatus =
  | 'under_review'       // owner is evaluating
  | 'approved'           // owner approved — ready to mint as GlobalBrainEntry
  | 'rejected'           // owner rejected at queue stage
  | 'needs_revision'     // returned to inbox for refinement before re-queuing

export interface PromotionQueueItem {
  id: string
  inboxItemId: string                // the KnowledgeInboxItem this came from
  proposedEntry: Omit<GlobalBrainEntry,
    'id' | 'status' | 'version' | 'promotedAt' | 'promotedBy' | 'lastModifiedAt' | 'lastModifiedBy'>
  status: PromotionQueueItemStatus
  queuedAt: string
  queuedBy: string                   // owner user ID who moved it from inbox
  decidedAt: string | null
  decidedBy: string | null           // owner user ID who approved/rejected
  decisionNote: string | null
  conflictsWith: string[]            // global keys of existing entries this might conflict with
}

// ── Permission matrix ─────────────────────────────────────────────────────────

export type BrainGovernanceRole =
  | 'platform_owner'      // Anthropic/AcademyOS operator — full control
  | 'academy_director'    // per-academy director
  | 'head_coach'          // head coach — read only
  | 'coach'               // coach — read only
  | 'donna'               // DONNA herself — can only write to inbox

export type BrainLayerOperation =
  | 'read'
  | 'write'
  | 'promote'
  | 'dismiss'
  | 'alias'

export interface LayerPermission {
  layer: 'global_brain' | 'academy_knowledge' | 'academy_aliases' | 'knowledge_inbox' | 'promotion_queue'
  operation: BrainLayerOperation
  allowedRoles: BrainGovernanceRole[]
  notes: string
}

export const BRAIN_GOVERNANCE_PERMISSIONS: LayerPermission[] = [
  // Global Brain
  { layer: 'global_brain',      operation: 'read',    allowedRoles: ['platform_owner', 'academy_director', 'head_coach', 'coach', 'donna'], notes: 'All roles can read; drives DONNA reasoning for everyone' },
  { layer: 'global_brain',      operation: 'write',   allowedRoles: ['platform_owner'],                                                      notes: 'Only the platform owner can edit global entries' },
  { layer: 'global_brain',      operation: 'promote', allowedRoles: ['platform_owner'],                                                      notes: 'Promotion from queue to live global brain is owner-only' },

  // Academy Knowledge
  { layer: 'academy_knowledge', operation: 'read',    allowedRoles: ['platform_owner', 'academy_director', 'head_coach', 'donna'],           notes: 'Coaches and parents cannot read academy knowledge config' },
  { layer: 'academy_knowledge', operation: 'write',   allowedRoles: ['platform_owner', 'academy_director'],                                  notes: 'Directors customise their academy knowledge; owner can edit any' },

  // Academy Aliases
  { layer: 'academy_aliases',   operation: 'read',    allowedRoles: ['platform_owner', 'academy_director', 'head_coach', 'coach', 'donna'], notes: 'All roles benefit from alias resolution' },
  { layer: 'academy_aliases',   operation: 'alias',   allowedRoles: ['academy_director'],                                                    notes: 'Directors create/edit aliases; must reference an existing global key' },

  // Knowledge Inbox
  { layer: 'knowledge_inbox',   operation: 'read',    allowedRoles: ['platform_owner'],                                                      notes: 'Only owner reviews the inbox' },
  { layer: 'knowledge_inbox',   operation: 'write',   allowedRoles: ['donna'],                                                               notes: 'Only DONNA can add items to the inbox' },
  { layer: 'knowledge_inbox',   operation: 'dismiss', allowedRoles: ['platform_owner'],                                                      notes: 'Owner dismisses or queues inbox items' },

  // Promotion Queue
  { layer: 'promotion_queue',   operation: 'read',    allowedRoles: ['platform_owner'],                                                      notes: 'Queue is owner-only visibility' },
  { layer: 'promotion_queue',   operation: 'promote', allowedRoles: ['platform_owner'],                                                      notes: 'Only owner can approve and mint a new GlobalBrainEntry' },
]

// ── Conflict handling ─────────────────────────────────────────────────────────

export type ConflictSeverity = 'blocking' | 'warning' | 'informational'

export interface BrainConflict {
  type:
    | 'alias_has_no_global_key'         // alias references a key not in the Global Brain
    | 'academy_rule_contradicts_global'  // local rule logic conflicts with a global decision rule
    | 'duplicate_vocabulary'             // proposed inbox item is near-identical to an existing entry
    | 'deprecated_key_in_use'            // alias or knowledge entry references a deprecated global key
  severity: ConflictSeverity
  description: string
  resolution: string                     // prescribed resolution path
}

export const BRAIN_CONFLICT_RULES: BrainConflict[] = [
  {
    type: 'alias_has_no_global_key',
    severity: 'blocking',
    description: 'An alias must resolve to an existing active global key.',
    resolution: 'Reject the alias at creation. Prompt director to choose an existing global key or submit a vocabulary candidate to the inbox.',
  },
  {
    type: 'academy_rule_contradicts_global',
    severity: 'warning',
    description: 'Academy local rule attempts to change the logic of a global decision rule.',
    resolution: 'Allow the display customisation (label, preference) but preserve global decision logic. Log the conflict. Notify the director that the global rule governs DONNA\'s reasoning.',
  },
  {
    type: 'duplicate_vocabulary',
    severity: 'warning',
    description: 'An inbox candidate is semantically near-identical to an existing global entry.',
    resolution: 'Owner marks the inbox item as duplicate and links it to the existing global key. No new entry is created.',
  },
  {
    type: 'deprecated_key_in_use',
    severity: 'informational',
    description: 'An alias or academy knowledge entry references a deprecated global key.',
    resolution: 'Warn the director. Suggest updating to the successor global key. Deprecated key continues to resolve during the migration window.',
  },
]

// ── Knowledge lifecycle ───────────────────────────────────────────────────────

export type KnowledgeLifecycleState =
  | 'suggested'        // DONNA observes a pattern → writes to Inbox
  | 'inbox_pending'    // waiting for owner to review
  | 'inbox_queued'     // owner approved for promotion queue
  | 'inbox_dismissed'  // owner rejected — dead end
  | 'queue_under_review' // owner is evaluating for Global Brain
  | 'queue_approved'   // owner approved — awaiting mint
  | 'queue_rejected'   // owner rejected at queue stage
  | 'queue_needs_revision' // returned to inbox for refinement
  | 'global_active'    // live in the Global Brain
  | 'global_deprecated'// superseded; still resolves but not used in new reasoning
  | 'global_retired'   // fully removed; audit trail only

export interface KnowledgeLifecycleTransition {
  from: KnowledgeLifecycleState
  to: KnowledgeLifecycleState
  triggeredBy: BrainGovernanceRole
  requiresApproval: boolean
  description: string
}

export const KNOWLEDGE_LIFECYCLE_TRANSITIONS: KnowledgeLifecycleTransition[] = [
  { from: 'suggested',           to: 'inbox_pending',        triggeredBy: 'donna',           requiresApproval: false, description: 'DONNA writes observation to inbox' },
  { from: 'inbox_pending',       to: 'inbox_queued',         triggeredBy: 'platform_owner',  requiresApproval: true,  description: 'Owner approves inbox item for promotion queue' },
  { from: 'inbox_pending',       to: 'inbox_dismissed',      triggeredBy: 'platform_owner',  requiresApproval: false, description: 'Owner dismisses inbox item' },
  { from: 'inbox_pending',       to: 'inbox_dismissed',      triggeredBy: 'platform_owner',  requiresApproval: false, description: 'Owner marks as duplicate' },
  { from: 'inbox_queued',        to: 'queue_under_review',   triggeredBy: 'platform_owner',  requiresApproval: false, description: 'Owner opens item in promotion queue' },
  { from: 'queue_under_review',  to: 'queue_approved',       triggeredBy: 'platform_owner',  requiresApproval: true,  description: 'Owner approves entry for minting' },
  { from: 'queue_under_review',  to: 'queue_rejected',       triggeredBy: 'platform_owner',  requiresApproval: false, description: 'Owner rejects at queue stage' },
  { from: 'queue_under_review',  to: 'queue_needs_revision', triggeredBy: 'platform_owner',  requiresApproval: false, description: 'Owner returns to inbox for refinement' },
  { from: 'queue_needs_revision',to: 'inbox_pending',        triggeredBy: 'platform_owner',  requiresApproval: false, description: 'Revised item re-enters inbox' },
  { from: 'queue_approved',      to: 'global_active',        triggeredBy: 'platform_owner',  requiresApproval: true,  description: 'Owner mints new GlobalBrainEntry — irreversible without deprecation' },
  { from: 'global_active',       to: 'global_deprecated',    triggeredBy: 'platform_owner',  requiresApproval: true,  description: 'Owner deprecates a global entry; aliases resolve during migration window' },
  { from: 'global_deprecated',   to: 'global_retired',       triggeredBy: 'platform_owner',  requiresApproval: true,  description: 'Owner retires entry after all references are migrated' },
]
