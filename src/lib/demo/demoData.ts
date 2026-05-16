// Local static demo data — used ONLY when ?demo=1 is present in the URL.
// Zero database reads. Zero database writes. Never shown in normal production mode.
// All personal names and content are fictional and tennis-academy-appropriate.

// ── Date helpers (computed once at module load time) ──────────────────────────

const _now = Date.now()
const _daysAgo = (n: number) => new Date(_now - n * 86_400_000).toISOString().split('T')[0]
const _daysFromNow = (n: number) => new Date(_now + n * 86_400_000).toISOString().split('T')[0]
const _isoAgo = (n: number) => new Date(_now - n * 86_400_000).toISOString()

export const DEMO_TODAY = _daysAgo(0)

// ── Sessions ──────────────────────────────────────────────────────────────────
// Matches SessionWithMeta shape from /director/today/page.tsx

export interface DemoSession {
  id: string
  name: string | null
  scheduled_date: string
  scheduled_time: string | null
  status: string
  coach_id: string
  template_id: string | null
  group_id: string | null
  duration_min: number | null
  coachName: string
  templateName: string
  blockCount: number
}

export const DEMO_SESSIONS: DemoSession[] = [
  {
    id: 'demo-session-1',
    name: 'Orange Ball A — Morning Skills',
    scheduled_date: DEMO_TODAY,
    scheduled_time: '09:00',
    status: 'completed',
    coach_id: 'demo-coach-1',
    template_id: 'demo-template-1',
    group_id: 'demo-group-1',
    duration_min: 90,
    coachName: 'Coach Martinez',
    templateName: 'Orange 2 — Skills + Rally',
    blockCount: 4,
  },
  {
    id: 'demo-session-2',
    name: 'Green Ball B — Technique Focus',
    scheduled_date: DEMO_TODAY,
    scheduled_time: '10:30',
    status: 'in_progress',
    coach_id: 'demo-coach-2',
    template_id: 'demo-template-2',
    group_id: 'demo-group-2',
    duration_min: 60,
    coachName: 'Coach Chen',
    templateName: 'Green 1 — Groundstroke Foundation',
    blockCount: 3,
  },
  {
    id: 'demo-session-3',
    name: 'Yellow Ball C — Match Play',
    scheduled_date: DEMO_TODAY,
    scheduled_time: '13:00',
    status: 'planned',
    coach_id: 'demo-coach-1',
    template_id: null,
    group_id: 'demo-group-3',
    duration_min: 90,
    coachName: 'Coach Martinez',
    templateName: 'No template',
    blockCount: 0,
  },
  {
    id: 'demo-session-4',
    name: 'Orange Ball B — Afternoon Drills',
    scheduled_date: DEMO_TODAY,
    scheduled_time: '14:30',
    status: 'planned',
    coach_id: 'demo-coach-3',
    template_id: 'demo-template-3',
    group_id: 'demo-group-4',
    duration_min: 60,
    coachName: 'Coach Rodriguez',
    templateName: 'Orange 1 — Serve and Return',
    blockCount: 3,
  },
  {
    id: 'demo-session-5',
    name: 'Red Ball Intro — Movement',
    scheduled_date: DEMO_TODAY,
    scheduled_time: '16:00',
    status: 'planned',
    coach_id: 'demo-coach-4',
    template_id: null,
    group_id: 'demo-group-5',
    duration_min: 45,
    coachName: 'Coach Nguyen',
    templateName: 'No template',
    blockCount: 0,
  },
]

export const DEMO_PENDING_COUNT = 3

// ── Level-up pipeline rows ────────────────────────────────────────────────────
// Matches PipelineRow shape from /director/level-up/page.tsx

export interface DemoPipelineRow {
  player_id: string | null
  full_name: string | null
  coach_name: string | null
  group_name: string | null
  current_track: string | null
  overall_score: number | null
  urgency: string | null
  days_overdue: number | null
  last_assessed_at: string | null
  next_assessment_due: string | null
  academy_id: string | null
}

export const DEMO_PIPELINE_ROWS: DemoPipelineRow[] = [
  {
    player_id: 'demo-player-1',
    full_name: 'Lena K.',
    coach_name: 'Coach Martinez',
    group_name: 'Orange Ball A',
    current_track: 'orange',
    overall_score: 82,
    urgency: 'overdue',
    days_overdue: 12,
    last_assessed_at: _daysAgo(90),
    next_assessment_due: _daysAgo(12),
    academy_id: 'demo-academy',
  },
  {
    player_id: 'demo-player-2',
    full_name: 'Marcus T.',
    coach_name: 'Coach Chen',
    group_name: 'Green Ball B',
    current_track: 'green',
    overall_score: 71,
    urgency: 'due_soon',
    days_overdue: null,
    last_assessed_at: _daysAgo(42),
    next_assessment_due: _daysFromNow(3),
    academy_id: 'demo-academy',
  },
  {
    player_id: 'demo-player-3',
    full_name: 'Sofia R.',
    coach_name: 'Coach Rodriguez',
    group_name: 'Orange Ball B',
    current_track: 'orange',
    overall_score: 68,
    urgency: 'due_soon',
    days_overdue: null,
    last_assessed_at: _daysAgo(30),
    next_assessment_due: _daysFromNow(5),
    academy_id: 'demo-academy',
  },
  {
    player_id: 'demo-player-4',
    full_name: 'Dylan H.',
    coach_name: 'Coach Nguyen',
    group_name: 'Yellow Ball C',
    current_track: 'yellow',
    overall_score: 54,
    urgency: 'upcoming',
    days_overdue: null,
    last_assessed_at: _daysAgo(14),
    next_assessment_due: _daysFromNow(14),
    academy_id: 'demo-academy',
  },
]

// ── Parent updates ────────────────────────────────────────────────────────────
// Matches ParentUpdateRow shape from /director/parents/page.tsx

export type DemoParentUpdateStatus = 'draft' | 'reviewed' | 'approved' | 'sent' | 'cancelled'

export interface DemoParentUpdate {
  id: string
  player_id: string
  status: DemoParentUpdateStatus
  subject: string | null
  content: string
  content_draft: string | null
  created_at: string
  approved_at: string | null
  sent_at: string | null
  player_full_name: string | null
}

export const DEMO_PARENT_UPDATES: DemoParentUpdate[] = [
  {
    id: 'demo-update-1',
    player_id: 'demo-player-2',
    status: 'reviewed',
    subject: 'Term progress — Marcus T.',
    content:
      'Marcus has shown strong improvement in net approach and is working on consistent groundstroke depth. His next focus area is serve reliability. We are targeting a level assessment in the coming weeks.',
    content_draft:
      'Marcus has shown strong improvement in net approach and is working on consistent groundstroke depth. His next focus area is serve reliability. We are targeting a level assessment in the coming weeks.',
    created_at: _isoAgo(7),
    approved_at: null,
    sent_at: null,
    player_full_name: 'Marcus T.',
  },
  {
    id: 'demo-update-2',
    player_id: 'demo-player-1',
    status: 'approved',
    subject: 'Level advancement update — Lena K.',
    content:
      'Lena has met all the gate requirements for Orange 2. She demonstrates excellent rally consistency and is ready to begin the Orange 3 curriculum. We are very proud of her progress this term.',
    content_draft: null,
    created_at: _isoAgo(5),
    approved_at: _isoAgo(1),
    sent_at: null,
    player_full_name: 'Lena K.',
  },
  {
    id: 'demo-update-3',
    player_id: 'demo-player-3',
    status: 'draft',
    subject: 'Skills review — Sofia R.',
    content:
      'Sofia is progressing well in footwork and split-step timing. Her serve is developing nicely and we are continuing to work on court positioning during rallies.',
    content_draft:
      'Sofia is progressing well in footwork and split-step timing. Her serve is developing nicely and we are continuing to work on court positioning during rallies.',
    created_at: _isoAgo(1),
    approved_at: null,
    sent_at: null,
    player_full_name: 'Sofia R.',
  },
  {
    id: 'demo-update-4',
    player_id: 'demo-player-4',
    status: 'approved',
    subject: 'Term summary — Dylan H.',
    content:
      'Dylan has had a productive term. He is building confidence in match situations and his movement has improved significantly. We look forward to his continued development in Yellow Ball.',
    content_draft: null,
    created_at: _isoAgo(5),
    approved_at: _isoAgo(0),
    sent_at: null,
    player_full_name: 'Dylan H.',
  },
]
