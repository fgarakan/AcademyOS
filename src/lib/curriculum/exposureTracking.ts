// Deterministic curriculum exposure candidate derivation.
// Uses existing session_attendance, session_blocks, and wrap-up draft data.
// Does NOT write exposure records — output is candidates only.

export type ExposureConfidence = 'possible' | 'likely' | 'missed'

export interface BlockExposureCandidate {
  blockId: string
  blockName: string
  blockType: string
  durationMin: number | null
  // 'completed' | 'modified' | 'skipped' | null (null = no wrap-up data)
  wrapUpStatus: 'completed' | 'modified' | 'skipped' | null
}

export interface PlayerExposureCandidate {
  playerId: string
  playerName: string
  attendanceStatus: string | null
  // blocks the player was possibly exposed to
  possibleExposure: BlockExposureCandidate[]
  // blocks the player likely missed (absent + block was completed)
  possibleMissedExposure: BlockExposureCandidate[]
  confidence: ExposureConfidence
  note: string
}

interface WrapUpBlockCompletion {
  block_id: string
  block_name: string
  status: 'completed' | 'skipped' | 'modified'
}

interface AttendingPlayer {
  playerId: string
  playerName: string
  attendanceStatus: string | null
}

interface PlannedBlock {
  id: string
  name: string
  type: string
  duration_min: number | null
}

export function deriveSessionExposureCandidates(
  players: AttendingPlayer[],
  blocks: PlannedBlock[],
  wrapUpCompletion: WrapUpBlockCompletion[] | null
): PlayerExposureCandidate[] {
  // Build lookup for wrap-up completion by block_id and name
  const completionById = new Map<string, WrapUpBlockCompletion>()
  const completionByName = new Map<string, WrapUpBlockCompletion>()
  for (const bc of wrapUpCompletion ?? []) {
    if (bc.block_id) completionById.set(bc.block_id, bc)
    if (bc.block_name) completionByName.set(bc.block_name.toLowerCase().trim(), bc)
  }

  function resolveBlock(block: PlannedBlock): BlockExposureCandidate {
    const wc = completionById.get(block.id) ?? completionByName.get(block.name.toLowerCase().trim())
    return {
      blockId: block.id,
      blockName: block.name,
      blockType: block.type,
      durationMin: block.duration_min,
      wrapUpStatus: wc?.status ?? null,
    }
  }

  const resolvedBlocks = blocks.map(resolveBlock)

  const attendedStatuses = new Set(['present', 'late'])
  const absentStatuses = new Set(['absent', 'excused'])

  return players.map(player => {
    const attended = player.attendanceStatus !== null && attendedStatuses.has(player.attendanceStatus)
    const wasAbsent = player.attendanceStatus !== null && absentStatuses.has(player.attendanceStatus)
    const statusUnknown = player.attendanceStatus === null

    let possibleExposure: BlockExposureCandidate[] = []
    let possibleMissedExposure: BlockExposureCandidate[] = []
    let confidence: ExposureConfidence = 'possible'
    let note = ''

    if (attended) {
      // Player attended — possible exposure to all non-skipped blocks
      possibleExposure = resolvedBlocks.filter(b => b.wrapUpStatus !== 'skipped')
      possibleMissedExposure = []
      confidence = wrapUpCompletion ? 'likely' : 'possible'
      note = wrapUpCompletion
        ? `Attended — ${possibleExposure.length} block(s) possibly covered per coach wrap-up.`
        : `Attended — ${blocks.length} planned block(s) assumed (no wrap-up data yet).`
    } else if (wasAbsent) {
      // Player was absent — missed all completed blocks
      const completedBlocks = resolvedBlocks.filter(b => b.wrapUpStatus === 'completed' || b.wrapUpStatus === 'modified')
      possibleExposure = []
      possibleMissedExposure = completedBlocks.length > 0 ? completedBlocks : resolvedBlocks
      confidence = 'missed'
      note = `Absent — possibly missed ${possibleMissedExposure.length} block(s).`
    } else {
      // Status unknown
      possibleExposure = resolvedBlocks
      possibleMissedExposure = []
      confidence = 'possible'
      note = 'Attendance not recorded — exposure status unknown.'
    }

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      attendanceStatus: player.attendanceStatus,
      possibleExposure,
      possibleMissedExposure,
      confidence,
      note,
    }
  })
}
