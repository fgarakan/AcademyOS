// Donna Attendance Exception Types — Sprint 274
// Pure types. No DB, no API, no async.

export interface DonnaAttendanceParsed {
  assumedEveryonePresent: boolean
  absentNameQueries: string[]
  unrosteredNameQueries: string[]
  confidence: 'low' | 'medium' | 'high'
  safetyNotes: string[]
}

export interface DonnaAttendanceDraftFields {
  session_or_group: string
  attendance_statement: string
  _resolved_session_id?: string
}
