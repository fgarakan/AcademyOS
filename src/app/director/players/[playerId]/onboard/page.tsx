import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { OnboardingStepperClient, type OnboardingData } from './OnboardingStepperClient'

function computeInitialStep(
  hasAssessment: boolean,
  hasApprovedRec: boolean,
  isActive: boolean,
): number {
  if (isActive) return 6
  if (hasApprovedRec) return 6
  if (hasAssessment) return 4
  return 1
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  if (
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
  ) age--
  return age
}

export default async function PlayerOnboardPage({
  params,
}: {
  params: { playerId: string }
}) {
  const { playerId } = params
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) notFound()
  const academyId = profile.academy_id

  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name, date_of_birth, gender, status, notes')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) notFound()

  const rawDb = supabase as any

  // Guardian count
  const { count: guardianCountRaw } = await supabase
    .from('player_guardians')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', playerId)
  const guardianCount = (guardianCountRaw as number | null) ?? 0

  // Latest assessment
  const { data: assessmentRow } = await supabase
    .from('assessments')
    .select('id, technical_score, tactical_score, movement_score, competition_score, behavioral_score, assessed_date')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('assessed_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestAssessment = assessmentRow
    ? {
        id: assessmentRow.id,
        technical_score: assessmentRow.technical_score,
        tactical_score: assessmentRow.tactical_score,
        movement_score: assessmentRow.movement_score,
        competition_score: assessmentRow.competition_score,
        behavioral_score: assessmentRow.behavioral_score,
        assessed_date: assessmentRow.assessed_date,
      }
    : null

  // Approved placement rec
  const { data: recRow } = await rawDb
    .from('placement_recommendations')
    .select('id, recommended_group_id, groups:recommended_group_id(name)')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const approvedRec = recRow
    ? {
        id: recRow.id as string,
        recommended_group_id: recRow.recommended_group_id as string | null,
        group_name: (recRow.groups as { name?: string } | null)?.name ?? null,
      }
    : null

  // Available groups for picker
  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, track')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const groups = (groupRows ?? []).map(g => ({
    id: g.id,
    name: g.name,
    track: g.track as string | null,
  }))

  const isActive = player.status === 'active'
  const hasAssessment = latestAssessment !== null
  const hasApprovedRec = approvedRec !== null
  const playerAgeYears = calcAge(player.date_of_birth)
  const initialStep = computeInitialStep(hasAssessment, hasApprovedRec, isActive)

  const data: OnboardingData = {
    playerId,
    academyId,
    player: {
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: player.full_name,
      date_of_birth: player.date_of_birth,
      gender: player.gender as string | null,
      status: player.status as string | null,
      notes: player.notes,
    },
    guardianCount,
    latestAssessment,
    approvedRec,
    groups,
    playerAgeYears,
    initialStep,
    isActive,
  }

  return <OnboardingStepperClient data={data} />
}
