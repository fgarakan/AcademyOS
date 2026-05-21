// Sprint 550 — Knowledge Library Index
// Central re-export index for the Knowledge Engine library.
// Provides a single import point for consumers.
// Pure TypeScript — no DB calls, no AI, no side effects.

// Core types
export type {
  KnowledgeDomain,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeAccessLevel,
  KnowledgeItem,
  KnowledgeReviewDecision,
  KnowledgeLibrarySummary,
} from './knowledgeTypes'
export {
  getKnowledgeStatusLabel,
  getKnowledgeDomainLabel,
  getKnowledgeSourceTypeLabel,
} from './knowledgeTypes'

// Library view model
export type {
  KnowledgeLibraryFilters,
  KnowledgeLibraryView,
} from './knowledgeLibrary'
export {
  buildKnowledgeLibrarySummary,
  filterKnowledgeLibrary,
  buildKnowledgeLibraryView,
  getItemsForCurriculumLevel,
  getPendingReviewItems,
  getApprovedGeneralItems,
} from './knowledgeLibrary'

// Review queue
export type {
  ReviewQueueSortOrder,
  ReviewQueueItem,
  ReviewAction,
  KnowledgeReviewQueueView,
} from './knowledgeReviewQueue'
export {
  REVIEW_ACTIONS,
  buildReviewQueueItem,
  buildKnowledgeReviewQueueView,
  buildKnowledgeReviewDecision,
} from './knowledgeReviewQueue'

// Curriculum promotion
export type {
  KnowledgeCurriculumPromotionInput,
  KnowledgeCurriculumPromotionDraft,
  PromotionValidationResult,
} from './knowledgeCurriculumPromotion'
export {
  buildKnowledgeCurriculumPromotionDraft,
  validatePromotionDraft,
  getPromotionStatusLabel,
  getPromotionPathSummary,
} from './knowledgeCurriculumPromotion'

// Privacy guards
export type {
  KnowledgeConsumerRole,
  KnowledgeVisibilityCheck,
  KnowledgePrivacyAuditResult,
} from './knowledgePrivacyGuards'
export {
  checkKnowledgeVisibility,
  auditKnowledgeItemPrivacy,
  filterItemsForRole,
} from './knowledgePrivacyGuards'

// DONNA interface
export type {
  DonnaKnowledgeAction,
  DonnaKnowledgeContextView,
} from './knowledgeDonnaInterface'
export {
  DONNA_KNOWLEDGE_ACTIONS,
  buildDonnaKnowledgeContextView,
} from './knowledgeDonnaInterface'

// Similarity detector
export type {
  KnowledgeSimilarityPair,
  KnowledgeSimilarityReport,
} from './knowledgeSimilarityDetector'
export {
  detectKnowledgeSimilarity,
  getSimilarItems,
  getSuspectedDuplicates,
} from './knowledgeSimilarityDetector'

// Audit log
export type {
  KnowledgeAuditEventType,
  KnowledgeAuditEvent,
  KnowledgeAuditLog,
} from './knowledgeAuditLog'
export {
  buildKnowledgeAuditLog,
  createKnowledgeAuditEvent,
  getAuditEventLabel,
} from './knowledgeAuditLog'

// Ingestion
export type {
  IngestionMethod,
  IngestionStatus,
  IngestionPayload,
  IngestionValidationResult,
} from './knowledgeIngestionTypes'
export { getIngestionMethodLabel, getIngestionStatusLabel } from './knowledgeIngestionTypes'
export { classifyIngestionPayload, buildIngestionPayload } from './knowledgeIngestionClassifier'
export { processVoiceKnowledgeSubmission } from './knowledgeVoiceIngestion'
export { processStructuredImport, getImportSummaryLine } from './knowledgeStructuredImport'
export { validateKnowledgeSource } from './knowledgeSourceValidator'
export { buildIngestionDashboardView } from './knowledgeIngestionDashboard'
export { buildIngestionPhaseReport } from './knowledgeIngestionReport'

// Curriculum bridge
export {
  bridgeKnowledgeToCurriculumDraft,
  buildKnowledgeCurriculumLevelContext,
  getKnowledgeBridgeSummary,
} from './knowledgeCurriculumBridge'

// Retrieval
export type {
  RetrievalContext,
  KnowledgeRetrievalRequest,
  KnowledgeRetrievalResult,
} from './knowledgeRetrievalModel'
export { retrieveKnowledgeItems } from './knowledgeRetrievalModel'

// Curriculum intelligence
export type {
  KnowledgeGapMatch,
  KnowledgeCurriculumIntelligenceReport,
} from './knowledgeCurriculumIntelligence'
export {
  buildKnowledgeCurriculumIntelligenceReport,
  getGapMatchesForLevel,
  getCoverageIntelligenceSummary,
} from './knowledgeCurriculumIntelligence'

// Answerability
export type {
  AnswerabilityRole,
  AnswerabilityStatus,
  AnswerabilityCheck,
  AnswerabilityReport,
} from './knowledgeAnswerabilityModel'
export {
  checkAnswerability,
  buildAnswerabilityReport,
  getAnswerabilityStatusLabel,
} from './knowledgeAnswerabilityModel'

// QA
export type {
  KnowledgeQaCheckId,
  KnowledgeQaInput,
  KnowledgeQaReport,
} from './knowledgeMegaSprintQa'
export {
  KNOWLEDGE_QA_CHECKS,
  runKnowledgeQa,
} from './knowledgeMegaSprintQa'
