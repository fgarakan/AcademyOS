// Certification suite manifest — the ONLY place certification suites are registered for CI.
//
// This mirrors the Guardian registry philosophy: CI iterates this list, so adding
// or removing a suite is a one-line change here and the CI workflow never changes.
//
// Scope: the green-certified suites that gate the build. The repo contains many
// more `*Certification.ts` files at varying maturity (e.g. the known-red
// philosophyCertification); CI intentionally gates on this curated, passing set
// rather than blanket-globbing, so the quality gate stays meaningful. Promote a
// suite into this list once it is certified green and you want it to block merges.

export const CERTIFICATION_SUITES: readonly string[] = [
  'src/lib/donna/certification/directorOperatingSessionCertification.ts',
  'src/lib/donna/certification/oneDonnaExecutiveConversationCertification.ts',
  'src/lib/donna/certification/oneDonnaOperatingSystemCertification.ts',
  'src/lib/donna/certification/oneDonnaConversationConvergenceCertification.ts',
  'src/lib/donna/certification/donnaAdaptiveCOOOperatingDayCertification.ts',
  'src/lib/donna/certification/donnaCOOPresenceCertification.ts',
  'src/lib/donna/certification/atomicLoopUsabilityCertification.ts',
  'src/lib/donna/certification/executiveConversationalReadinessCertification.ts',
  'src/lib/donna/certification/executiveLiveWiringCertification.ts',
  'src/lib/donna/certification/executiveExperienceConvergenceCertification.ts',
  'src/lib/donna/certification/pilotModeExecutiveRefinementCertification.ts',
  'src/lib/donna/experience/donnaExecutiveExperienceCertification.ts',
  'src/lib/donna/certification/donnaRoutingConstitutionCertification.ts',
  'src/lib/donna/certification/donnaUnifiedReasoningCertification.ts',
  'src/lib/donna/certification/donnaUnifiedExecutiveContextCertification.ts',
  'src/lib/donna/certification/donnaExecutiveConversationQualityCertification.ts',
  'src/lib/donna/certification/donnaExecutiveDialogueCertification.ts',
  'src/lib/donna/certification/donnaExecutiveSessionCertification.ts',
  'src/lib/donna/certification/donnaExecutiveActionLoopCertification.ts',
  'src/lib/donna/certification/donnaLiveExecutiveActivationCertification.ts',
  'src/lib/donna/certification/donnaExecutiveExperienceRefinementCertification.ts',
  'src/lib/donna/certification/donnaExecutiveLearningCertification.ts',
  'src/lib/donna/certification/donnaExecutiveLearningWiringCertification.ts',
  'src/lib/donna/certification/donnaExecutiveIntelligenceEngineCertification.ts',
  'src/lib/donna/certification/donnaDemoAcademyGodModeCertification.ts',
  'src/lib/donna/certification/donnaDemoAcademyOperatingCertification.ts',
  'src/lib/donna/certification/donnaConversationOwnershipCertification.ts',
]
