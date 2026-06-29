import { redirect } from 'next/navigation'

// Phase 0 (Executive Interaction Constitution): the impact-preview experience
// rendered hardcoded, level-agnostic sample data and a "Save as Draft" control
// that persisted nothing while claiming it reached the Review Queue. It was a
// trust leak on a real route, so the surface is removed until impact analysis is
// backed by real data (deferred to the curriculum redesign phase). Until then this
// route redirects to the real level builder; no fabricated impact is shown.
interface Props {
  params: { levelId: string }
}

export default function CurriculumLevelImpactPage({ params }: Props) {
  redirect(`/director/curriculum/level/${params.levelId}`)
}
