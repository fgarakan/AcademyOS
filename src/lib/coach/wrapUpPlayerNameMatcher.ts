// Sprint 530 — Coach Wrap-Up Player Name Match V1
// Pure utility: matches player names from free-text wrap-up input against the session roster.
// No DB calls. No server imports. Used by DONNA to identify mentioned players.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RosterEntry {
  playerId: string
  fullName: string
}

export type NameMatchConfidence = 'full_name' | 'first_name' | 'partial'

export interface PlayerNameMatch {
  playerId: string
  fullName: string
  confidence: NameMatchConfidence
  matchedToken: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2)
}

// ── Matcher ───────────────────────────────────────────────────────────────────

/**
 * Returns roster players who are mentioned in the given wrap-up text.
 * Matches on full name > first name > partial (first 4+ chars of first name).
 * Each player appears at most once in the result.
 */
export function matchPlayerNames(
  text: string,
  roster: RosterEntry[],
): PlayerNameMatch[] {
  if (!text.trim() || roster.length === 0) return []

  const textNorm = normalize(text)
  const tokens = tokenize(text)
  const results: PlayerNameMatch[] = []

  for (const player of roster) {
    const parts = player.fullName.trim().split(/\s+/)
    const firstName = normalize(parts[0] ?? '')
    const lastName = normalize(parts[parts.length - 1] ?? '')
    const fullNameNorm = normalize(player.fullName)

    // 1 — full name match
    if (fullNameNorm.length >= 3 && textNorm.includes(fullNameNorm)) {
      results.push({
        playerId: player.playerId,
        fullName: player.fullName,
        confidence: 'full_name',
        matchedToken: player.fullName,
      })
      continue
    }

    // 2 — first name exact token match
    if (firstName.length >= 2 && tokens.includes(firstName)) {
      results.push({
        playerId: player.playerId,
        fullName: player.fullName,
        confidence: 'first_name',
        matchedToken: firstName,
      })
      continue
    }

    // 3 — last name exact token match
    if (lastName.length >= 2 && lastName !== firstName && tokens.includes(lastName)) {
      results.push({
        playerId: player.playerId,
        fullName: player.fullName,
        confidence: 'first_name',
        matchedToken: lastName,
      })
      continue
    }

    // 4 — partial first name match (prefix, min 4 chars)
    if (firstName.length >= 4) {
      const partialMatch = tokens.find(t => t.length >= 4 && firstName.startsWith(t))
      if (partialMatch) {
        results.push({
          playerId: player.playerId,
          fullName: player.fullName,
          confidence: 'partial',
          matchedToken: partialMatch,
        })
      }
    }
  }

  return results
}

/**
 * Groups a wrap-up answer text into sentences and returns a map of
 * sentence → matched players. Useful for per-sentence observation extraction.
 */
export function matchPlayerNamesPerSentence(
  text: string,
  roster: RosterEntry[],
): Array<{ sentence: string; matches: PlayerNameMatch[] }> {
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 0)
  return sentences.map(sentence => ({
    sentence,
    matches: matchPlayerNames(sentence, roster),
  }))
}
