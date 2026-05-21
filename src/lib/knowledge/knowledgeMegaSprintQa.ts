// Sprint 549 — Knowledge Mega-Sprint QA
// Quality assurance harness for the Knowledge Engine built in Sprints 528-549.
// Verifies the doctrine is upheld across all modules.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type KnowledgeQaCheckId =
  | 'types_defined'
  | 'library_view_model'
  | 'review_queue_present'
  | 'promotion_path_defined'
  | 'tagging_model_present'
  | 'search_role_scoped'
  | 'privacy_guards_present'
  | 'donna_interface_defined'
  | 'similarity_detector_present'
  | 'audit_log_present'
  | 'ingestion_types_defined'
  | 'ingestion_classifier_present'
  | 'voice_ingestion_present'
  | 'structured_import_present'
  | 'source_validator_present'
  | 'ingestion_dashboard_present'
  | 'curriculum_bridge_present'
  | 'ingestion_report_present'
  | 'retrieval_model_present'
  | 'curriculum_intelligence_present'
  | 'answerability_model_present'
  | 'parent_never_answerable'
  | 'player_never_answerable'
  | 'never_auto_promotes'
  | 'director_approval_required'

export interface KnowledgeQaCheck {
  checkId: KnowledgeQaCheckId
  label: string
  category: 'modules' | 'doctrine' | 'privacy' | 'approval'
  isBlocker: boolean
}

export interface KnowledgeQaResult {
  checkId: KnowledgeQaCheckId
  passed: boolean
  note: string | null
}

export interface KnowledgeQaReport {
  checks: KnowledgeQaResult[]
  totalChecks: number
  passedChecks: number
  failedChecks: number
  blockerFailures: number
  isSystemReady: boolean
  summary: string
}

export const KNOWLEDGE_QA_CHECKS: KnowledgeQaCheck[] = [
  { checkId: 'types_defined', label: 'Knowledge types defined', category: 'modules', isBlocker: true },
  { checkId: 'library_view_model', label: 'Library view model present', category: 'modules', isBlocker: true },
  { checkId: 'review_queue_present', label: 'Review queue model present', category: 'modules', isBlocker: true },
  { checkId: 'promotion_path_defined', label: 'Promotion path defined', category: 'modules', isBlocker: true },
  { checkId: 'tagging_model_present', label: 'Tagging model present', category: 'modules', isBlocker: false },
  { checkId: 'search_role_scoped', label: 'Search is role-scoped', category: 'modules', isBlocker: true },
  { checkId: 'privacy_guards_present', label: 'Privacy guards present', category: 'privacy', isBlocker: true },
  { checkId: 'donna_interface_defined', label: 'DONNA interface defined', category: 'modules', isBlocker: false },
  { checkId: 'similarity_detector_present', label: 'Similarity detector present', category: 'modules', isBlocker: false },
  { checkId: 'audit_log_present', label: 'Audit log model present', category: 'modules', isBlocker: true },
  { checkId: 'ingestion_types_defined', label: 'Ingestion types defined', category: 'modules', isBlocker: true },
  { checkId: 'ingestion_classifier_present', label: 'Ingestion classifier present', category: 'modules', isBlocker: true },
  { checkId: 'voice_ingestion_present', label: 'Voice ingestion handler present', category: 'modules', isBlocker: false },
  { checkId: 'structured_import_present', label: 'Structured import handler present', category: 'modules', isBlocker: false },
  { checkId: 'source_validator_present', label: 'Source validator present', category: 'modules', isBlocker: true },
  { checkId: 'ingestion_dashboard_present', label: 'Ingestion dashboard view present', category: 'modules', isBlocker: false },
  { checkId: 'curriculum_bridge_present', label: 'Knowledge → curriculum bridge present', category: 'modules', isBlocker: true },
  { checkId: 'ingestion_report_present', label: 'Ingestion phase report present', category: 'modules', isBlocker: false },
  { checkId: 'retrieval_model_present', label: 'Retrieval model present', category: 'modules', isBlocker: true },
  { checkId: 'curriculum_intelligence_present', label: 'Curriculum intelligence model present', category: 'modules', isBlocker: false },
  { checkId: 'answerability_model_present', label: 'Answerability model present', category: 'privacy', isBlocker: true },
  { checkId: 'parent_never_answerable', label: 'Parent can never access knowledge directly', category: 'doctrine', isBlocker: true },
  { checkId: 'player_never_answerable', label: 'Player can never access knowledge directly', category: 'doctrine', isBlocker: true },
  { checkId: 'never_auto_promotes', label: 'No auto-promotion to curriculum', category: 'doctrine', isBlocker: true },
  { checkId: 'director_approval_required', label: 'All curriculum promotions require director approval', category: 'approval', isBlocker: true },
]

export interface KnowledgeQaInput {
  hasTypesModule: boolean
  hasLibraryViewModel: boolean
  hasReviewQueue: boolean
  hasPromotionPath: boolean
  hasTaggingModel: boolean
  hasRoleScopedSearch: boolean
  hasPrivacyGuards: boolean
  hasDonnaInterface: boolean
  hasSimilarityDetector: boolean
  hasAuditLog: boolean
  hasIngestionTypes: boolean
  hasIngestionClassifier: boolean
  hasVoiceIngestion: boolean
  hasStructuredImport: boolean
  hasSourceValidator: boolean
  hasIngestionDashboard: boolean
  hasCurriculumBridge: boolean
  hasIngestionReport: boolean
  hasRetrievalModel: boolean
  hasCurriculumIntelligence: boolean
  hasAnswerabilityModel: boolean
  parentAlwaysBlocked: boolean
  playerAlwaysBlocked: boolean
  noAutoPromotion: boolean
  directorApprovalEnforced: boolean
}

export function runKnowledgeQa(input: KnowledgeQaInput): KnowledgeQaReport {
  const inputMap: Record<KnowledgeQaCheckId, boolean> = {
    types_defined: input.hasTypesModule,
    library_view_model: input.hasLibraryViewModel,
    review_queue_present: input.hasReviewQueue,
    promotion_path_defined: input.hasPromotionPath,
    tagging_model_present: input.hasTaggingModel,
    search_role_scoped: input.hasRoleScopedSearch,
    privacy_guards_present: input.hasPrivacyGuards,
    donna_interface_defined: input.hasDonnaInterface,
    similarity_detector_present: input.hasSimilarityDetector,
    audit_log_present: input.hasAuditLog,
    ingestion_types_defined: input.hasIngestionTypes,
    ingestion_classifier_present: input.hasIngestionClassifier,
    voice_ingestion_present: input.hasVoiceIngestion,
    structured_import_present: input.hasStructuredImport,
    source_validator_present: input.hasSourceValidator,
    ingestion_dashboard_present: input.hasIngestionDashboard,
    curriculum_bridge_present: input.hasCurriculumBridge,
    ingestion_report_present: input.hasIngestionReport,
    retrieval_model_present: input.hasRetrievalModel,
    curriculum_intelligence_present: input.hasCurriculumIntelligence,
    answerability_model_present: input.hasAnswerabilityModel,
    parent_never_answerable: input.parentAlwaysBlocked,
    player_never_answerable: input.playerAlwaysBlocked,
    never_auto_promotes: input.noAutoPromotion,
    director_approval_required: input.directorApprovalEnforced,
  }

  const checks: KnowledgeQaResult[] = KNOWLEDGE_QA_CHECKS.map(check => ({
    checkId: check.checkId,
    passed: inputMap[check.checkId] ?? false,
    note: inputMap[check.checkId] ? null : `Check "${check.label}" not passing.`,
  }))

  const passed = checks.filter(c => c.passed).length
  const failed = checks.filter(c => !c.passed).length
  const blockerChecks = KNOWLEDGE_QA_CHECKS.filter(c => c.isBlocker).map(c => c.checkId)
  const blockerFailures = checks.filter(c => !c.passed && blockerChecks.includes(c.checkId)).length
  const isSystemReady = blockerFailures === 0

  const summary = isSystemReady
    ? `Knowledge Engine QA: ${passed}/${checks.length} checks passed. System ready.`
    : `Knowledge Engine QA: ${passed}/${checks.length} checks passed. ${blockerFailures} blocker${blockerFailures > 1 ? 's' : ''} must be resolved.`

  return { checks, totalChecks: checks.length, passedChecks: passed, failedChecks: failed, blockerFailures, isSystemReady, summary }
}
