// Sprint 633 — Approval Preview V1
// Pure TypeScript — no DB calls, no mutations, no AI calls, no UI imports.
// Builds a structured preview of exactly what will happen when a director
// approves a proposed_action. Director sees this BEFORE clicking approve.
// No hidden mutations.

// ── Preview shape ─────────────────────────────────────────────────────────────

export interface ApprovalPreview {
  /** Human label for the module being approved */
  moduleLabel: string
  /** Which database table or object will change */
  databaseObjectAffected: string
  /** What happens to parent/player visibility after approval */
  parentPlayerVisibility: string
  /** Whether an audit_log entry is created */
  auditLogRequired: boolean
  auditLogNote: string
  /** Whether approval applies immediately or creates a next-step draft */
  appliesImmediately: boolean
  immediateOrNextStep: string
  /** Whether any notification is sent on approval */
  notificationSent: boolean
  notificationNote: string
  /** Things that will NOT happen automatically after approval */
  willNotHappenAutomatically: string[]
  /** Rollback note — how to undo if needed */
  rollbackNote: string
  /** Safety class for coloring */
  safetyClass: 'standard' | 'high_visibility_risk' | 'irreversible'
}

// ── Preview builder ───────────────────────────────────────────────────────────

export function buildApprovalPreview(targetModule: string | null): ApprovalPreview {
  const module = targetModule ?? 'unknown'

  switch (module) {
    case 'session_wrap_up_v1':
      return {
        moduleLabel: 'Session Wrap-Up',
        databaseObjectAffected: 'sessions (status), proposed_actions (status → executed)',
        parentPlayerVisibility: 'No parent or player visibility change — internal record only',
        auditLogRequired: true,
        auditLogNote: 'Execution event recorded in audit_logs',
        appliesImmediately: true,
        immediateOrNextStep: 'Approval applies immediately — session notes written on confirm',
        notificationSent: false,
        notificationNote: 'No notification sent to parents, players, or coaches automatically',
        willNotHappenAutomatically: [
          'Player curriculum level will not change',
          'Parent or player will not be notified',
          'Session template will not be modified',
        ],
        rollbackNote: 'Approval cannot be undone — contact platform support if incorrect',
        safetyClass: 'standard',
      }

    case 'attendance_exception':
      return {
        moduleLabel: 'Attendance Exception',
        databaseObjectAffected: 'session_attendance (records per player), proposed_actions (status → executed)',
        parentPlayerVisibility: 'No parent or player visibility change — internal record only',
        auditLogRequired: true,
        auditLogNote: 'Each attendance record change is logged in audit_logs',
        appliesImmediately: true,
        immediateOrNextStep: 'Approval applies immediately — attendance records written on confirm',
        notificationSent: false,
        notificationNote: 'No notification sent automatically; unrostered attendees trigger a separate placement review item',
        willNotHappenAutomatically: [
          'Player curriculum levels will not change',
          'Parent or player will not be notified',
          'New players will not be created automatically',
        ],
        rollbackNote: 'Attendance records can be corrected by creating a new attendance exception draft',
        safetyClass: 'standard',
      }

    case 'coach_observation_draft_v1':
      return {
        moduleLabel: 'Player Observation',
        databaseObjectAffected: 'player_observations (one new record), proposed_actions (status → executed)',
        parentPlayerVisibility: 'Internal only — parents and players cannot see coach observations',
        auditLogRequired: true,
        auditLogNote: 'Observation creation recorded in audit_logs',
        appliesImmediately: true,
        immediateOrNextStep: 'Approval applies immediately — observation created on confirm',
        notificationSent: false,
        notificationNote: 'No notification sent — observation is director/coach visible only',
        willNotHappenAutomatically: [
          'Player curriculum level will not change',
          'Parent or player will not see this observation',
          'Session records will not be modified',
        ],
        rollbackNote: 'Observations can be deleted if created in error — contact platform support',
        safetyClass: 'standard',
      }

    case 'development_summary_draft_v1':
      return {
        moduleLabel: 'Development Summary',
        databaseObjectAffected: 'player_development_summaries (upsert), proposed_actions (status → executed)',
        parentPlayerVisibility: 'Internal by default — not visible to parents or players unless separately published',
        auditLogRequired: true,
        auditLogNote: 'Summary update recorded in audit_logs with source: ai_draft',
        appliesImmediately: true,
        immediateOrNextStep: 'Approval applies immediately — summary written on confirm',
        notificationSent: false,
        notificationNote: 'No notification sent — summary stays director-only until explicitly shared',
        willNotHappenAutomatically: [
          'Summary will not be sent to parent or player automatically',
          'Player curriculum level will not change',
          'Separate approval needed before any parent-facing communication',
        ],
        rollbackNote: 'Summary can be overwritten by submitting a new draft — previous version is not preserved',
        safetyClass: 'standard',
      }

    case 'level_review':
      return {
        moduleLabel: 'Level Movement',
        databaseObjectAffected: 'player_curriculum_states (level update), proposed_actions (status → executed)',
        parentPlayerVisibility: 'No parent/player notification automatically — notifying parent is a separate approval step',
        auditLogRequired: true,
        auditLogNote: 'Level change recorded in audit_logs with before/after level',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval sets status to approved — director must apply separately via the Apply button',
        notificationSent: false,
        notificationNote: 'No notification sent automatically — parent communication requires a separate approved draft',
        willNotHappenAutomatically: [
          'Player level does not change on approval alone — Apply step required',
          'Parent is not notified',
          'Group assignment does not change automatically',
          'Curriculum content does not update automatically',
        ],
        rollbackNote: 'Level changes can be reversed by creating a new level_review draft with the previous level',
        safetyClass: 'irreversible',
      }

    case 'parent_communication':
      return {
        moduleLabel: 'Parent Communication',
        databaseObjectAffected: 'parent_communications (record created or updated), proposed_actions (status → approved)',
        parentPlayerVisibility: 'HIGH VISIBILITY RISK — parent/player will see this content once the send step is triggered',
        auditLogRequired: true,
        auditLogNote: 'Approval and any send event recorded in audit_logs with parent/player context',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval sets status to approved — sending requires a separate explicit send trigger',
        notificationSent: false,
        notificationNote: 'Approval does NOT send the message — a second director action triggers send',
        willNotHappenAutomatically: [
          'Message is not sent on approval alone',
          'Raw coach notes will not be included',
          'Other children/siblings will not receive this communication',
          'Player curriculum level will not change',
        ],
        rollbackNote: 'Approved but unsent drafts can be rejected before send is triggered. Once sent, cannot be recalled.',
        safetyClass: 'high_visibility_risk',
      }

    case 'curriculum_override':
      return {
        moduleLabel: 'Curriculum Override',
        databaseObjectAffected: 'session_blocks (override instruction applied), proposed_actions (status → executed)',
        parentPlayerVisibility: 'No parent/player visibility change — session-level override only',
        auditLogRequired: true,
        auditLogNote: 'Override instruction recorded in audit_logs',
        appliesImmediately: true,
        immediateOrNextStep: 'Approval applies immediately — block instruction updated on confirm',
        notificationSent: false,
        notificationNote: 'No notification sent — internal session record only',
        willNotHappenAutomatically: [
          'Curriculum spine will not change',
          'Player curriculum levels will not change',
          'Parent or player will not be notified',
          'Future sessions will not be affected',
        ],
        rollbackNote: 'Override can be removed by creating a new override draft with the original instruction',
        safetyClass: 'standard',
      }

    case 'placement_recommendation_draft':
      return {
        moduleLabel: 'Placement Recommendation',
        databaseObjectAffected: 'placement_recommendations (status update), players (status pending activation), proposed_actions (status → approved)',
        parentPlayerVisibility: 'No parent/player visibility change until player is fully activated',
        auditLogRequired: true,
        auditLogNote: 'Placement decision recorded in audit_logs',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval routes to finalize_player_placement() — director must explicitly activate the player',
        notificationSent: false,
        notificationNote: 'No notification sent — player remains inactive until finalize_player_placement() is called',
        willNotHappenAutomatically: [
          'Player is not activated on approval alone',
          'Player is not added to a group automatically',
          'Parent is not notified',
          'Player portal is not enabled',
        ],
        rollbackNote: 'Placement can be reconsidered before finalize_player_placement() is called',
        safetyClass: 'standard',
      }

    case 'badge_award':
      return {
        moduleLabel: 'Badge Award',
        databaseObjectAffected: 'player badge records (apply path not yet built)',
        parentPlayerVisibility: 'Player and parent badge visibility controlled by apply step — not yet implemented',
        auditLogRequired: true,
        auditLogNote: 'Badge award decision recorded in audit_logs when apply path is built',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval captured — no badge apply path exists yet. Implement badge award apply action before awarding.',
        notificationSent: false,
        notificationNote: 'No notification sent — no badge award apply infrastructure exists',
        willNotHappenAutomatically: [
          'Badge is not awarded on approval alone',
          'Player or parent will not see any badge change',
          'No apply path exists — future sprint required',
        ],
        rollbackNote: 'No badge changes occurred — nothing to roll back',
        safetyClass: 'standard',
      }

    case 'mission_assignment':
      return {
        moduleLabel: 'Mission Assignment',
        databaseObjectAffected: 'player mission records (apply path not yet built)',
        parentPlayerVisibility: 'Mission visibility controlled by apply step — not yet implemented',
        auditLogRequired: true,
        auditLogNote: 'Mission assignment decision recorded in audit_logs when apply path is built',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval captured — no mission apply path exists yet. Implement mission apply action before assigning.',
        notificationSent: false,
        notificationNote: 'No notification sent — no mission assignment apply infrastructure exists',
        willNotHappenAutomatically: [
          'Mission is not assigned on approval alone',
          'Player or parent will not see any mission change',
          'No apply path exists — future sprint required',
        ],
        rollbackNote: 'No mission changes occurred — nothing to roll back',
        safetyClass: 'standard',
      }

    case 'video_visibility_change':
      return {
        moduleLabel: 'Video Visibility Change',
        databaseObjectAffected: 'video/media visibility records (apply path not yet built)',
        parentPlayerVisibility: 'HIGH VISIBILITY RISK — parent/player video visibility will change when apply step is triggered',
        auditLogRequired: true,
        auditLogNote: 'Visibility decision recorded in audit_logs when apply path is built',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval captured — no video visibility apply path exists yet. Implement visibility apply action before publishing.',
        notificationSent: false,
        notificationNote: 'No notification sent — apply path does not exist yet',
        willNotHappenAutomatically: [
          'Video visibility does not change on approval alone',
          'Parent or player cannot access this video until apply step is triggered',
          'No apply path exists — future sprint required',
        ],
        rollbackNote: 'No visibility changed — nothing to roll back',
        safetyClass: 'high_visibility_risk',
      }

    case 'knowledge_promotion':
      return {
        moduleLabel: 'Knowledge Promotion',
        databaseObjectAffected: 'global knowledge library (platform-owner approval required)',
        parentPlayerVisibility: 'Not visible to parents or players until explicitly promoted and published',
        auditLogRequired: true,
        auditLogNote: 'Promotion decision recorded in audit_logs',
        appliesImmediately: false,
        immediateOrNextStep: 'Academy director approval recorded — platform-owner approval required before global promotion. Apply path not yet built.',
        notificationSent: false,
        notificationNote: 'No notification sent — knowledge promotion requires platform-owner review',
        willNotHappenAutomatically: [
          'Knowledge is not promoted globally on academy director approval alone',
          'Platform-owner approval required for global promotion',
          'Parent or player will not see this content automatically',
          'No apply path exists — future sprint required',
        ],
        rollbackNote: 'No promotion occurred — nothing to roll back',
        safetyClass: 'standard',
      }

    default:
      return {
        moduleLabel: targetModule ?? 'Unknown action',
        databaseObjectAffected: 'proposed_actions (status → approved or executed)',
        parentPlayerVisibility: 'Director-only until you take further action',
        auditLogRequired: true,
        auditLogNote: 'Execution event recorded in audit_logs',
        appliesImmediately: false,
        immediateOrNextStep: 'Approval recorded — check the module-specific apply path for next steps',
        notificationSent: false,
        notificationNote: 'No notification sent automatically',
        willNotHappenAutomatically: [
          'No changes take effect until you explicitly apply',
        ],
        rollbackNote: 'Approved items can be rejected before the apply step',
        safetyClass: 'standard',
      }
  }
}
