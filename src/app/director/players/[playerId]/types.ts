// Sprint 40: RequirementEvidenceDetailRow
// Local interface — requirement_evidence_links not yet in database.types.ts.
// Requires type regeneration after migrations 041–044 are confirmed applied to live DB.
export interface RequirementEvidenceDetailRow {
  id: string
  requirement_id: string
  player_requirement_progress_id: string | null
  evidence_type: string
  evidence_id: string
  evidence_summary: string | null
  confidence: number | null
  weight: number | null
  created_by: string | null
  created_at: string
  is_parent_safe: boolean
  // Enrichments populated server-side in page.tsx
  observation_content: string | null
  observation_type: string | null
  observation_created_at: string | null
  creator_display_name: string | null
}
