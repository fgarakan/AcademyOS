'use server'

// Form-compatible wrappers for mission actions.
// Next.js 14 form actions require (formData: FormData) signature.
// These wrappers accept the mission ID as a bound argument and ignore FormData.

import { approveMissionAction, skipMissionAction } from '@/lib/actions/playerMissionDraftAction'

export async function approveMissionFormAction(
  missionId: string,
  _formData: FormData,
): Promise<void> {
  await approveMissionAction(missionId)
}

export async function skipMissionFormAction(
  missionId: string,
  _formData: FormData,
): Promise<void> {
  await skipMissionAction(missionId)
}
