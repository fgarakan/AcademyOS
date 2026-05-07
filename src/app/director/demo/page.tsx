import Link from 'next/link'
import {
  Users, Sparkles, BookOpen, Calendar, Lightbulb, CheckCircle2,
  GraduationCap, ArrowRight, FlaskConical, MessageSquare, ClipboardList,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { getDemoSandboxStatusAction } from './demoSandboxActions'
import { DemoSandboxControls } from './DemoSandboxControls'

function SandboxBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime/5 border border-lime/20">
      <FlaskConical className="w-4 h-4 text-lime shrink-0" />
      <p className="text-xs text-text-secondary">
        <span className="text-lime font-semibold">Preview Mode</span> — This demo uses sample academy data. Nothing here changes real player records.
      </p>
    </div>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
      active
        ? 'bg-status-green/10 text-status-green border-status-green/30'
        : 'bg-surface-raised text-text-muted border-border'
    }`}>
      {active ? 'Ready' : 'Not created'}
    </span>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-none w-6 h-6 rounded-full bg-lime/10 text-lime text-[11px] font-bold flex items-center justify-center border border-lime/20">
      {n}
    </span>
  )
}

export default async function DemoTourPage() {
  const { ok, status } = await getDemoSandboxStatusAction()
  const sandbox = ok ? (status ?? null) : null
  const sandboxActive = sandbox !== null && (sandbox.playerCount > 0 || sandbox.groupExists || sandbox.sessionExists)

  return (
    <div className="animate-fade-in p-6 space-y-8 max-w-3xl">

      {/* Header */}
      <div>
        <p className="page-eyebrow">Demo Tour</p>
        <h1 className="page-title">Academy OS Demo Tour</h1>
        <p className="page-subtitle">Preview how Academy OS works once your player data is uploaded.</p>
      </div>

      <SandboxBanner />

      {/* ============================================================
          Section 1 — Sandbox Status
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">Demo Sandbox Status</p>
        <Card>
          <CardContent className="py-5 space-y-4">
            {sandboxActive ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatusRow label="Sample players" value={`${sandbox!.playerCount} created`} ok={sandbox!.playerCount > 0} />
                <StatusRow label="Sample group" value={sandbox!.groupName ?? '—'} ok={sandbox!.groupExists} />
                <StatusRow label="Demo template" value={sandbox!.templateExists ? 'Created' : 'Missing'} ok={sandbox!.templateExists} />
                <StatusRow label="Demo session" value={sandbox!.sessionExists ? 'Created' : 'Missing'} ok={sandbox!.sessionExists} />
                <StatusRow label="Curriculum version" value={sandbox!.curriculumVersionExists ? 'Created' : 'Skipped'} ok={sandbox!.curriculumVersionExists} />
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm text-text-primary font-medium">Demo sandbox not yet created</p>
                <p className="text-xs text-text-muted">Click the button below to seed 6 sample players and a complete demo session.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <DemoSandboxControls status={sandbox} />
      </div>

      {/* ============================================================
          Section 2 — What This Shows
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">What This Shows</p>
        <Card>
          <CardContent className="py-5">
            <div className="space-y-3">
              {[
                {
                  icon: <Users className="w-4 h-4 text-lime" />,
                  title: 'Player Import + Onboarding',
                  desc: 'Upload a player list via CSV. Dry-run validates before a single record is written.',
                },
                {
                  icon: <Sparkles className="w-4 h-4 text-lime" />,
                  title: 'Development Profiles',
                  desc: 'Strengths, needs, and current priorities for each player — set once, used by coach intelligence automatically.',
                },
                {
                  icon: <BookOpen className="w-4 h-4 text-lime" />,
                  title: 'Curriculum Connection',
                  desc: 'Each player is linked to a curriculum level. The session engine knows what they need to learn next.',
                },
                {
                  icon: <Calendar className="w-4 h-4 text-lime" />,
                  title: 'Coach Class Intelligence',
                  desc: 'Before a session, the coach sees a class briefing: who has what needs, what the curriculum says, what to watch for.',
                },
                {
                  icon: <Lightbulb className="w-4 h-4 text-lime" />,
                  title: 'Adaptive Session Suggestions',
                  desc: 'A deterministic rule engine reads the class and suggests specific modifications — named, with reasons.',
                },
                {
                  icon: <CheckCircle2 className="w-4 h-4 text-lime" />,
                  title: 'Human Approval Guardrails',
                  desc: 'No suggestion is ever applied automatically. Coach approves → applies → session-only change. Template never touched.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="mt-0.5 shrink-0">{icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Section 3 — Demo Flow
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">Demo Flow</p>
        <Card>
          <CardContent className="py-5">
            <div className="space-y-3">
              {[
                { n: 1, title: 'Sample players', desc: 'Six [DEMO] players with names, birth years, and group assignment.' },
                { n: 2, title: 'Development profiles', desc: 'Each player has 2–3 strengths, 2–3 needs, and a current priority.' },
                { n: 3, title: 'Curriculum version', desc: 'A demo academy curriculum version shows how customizations work.' },
                { n: 4, title: 'Demo session', desc: 'A planned session for the [DEMO] Orange 2 group with 5 session blocks.' },
                { n: 5, title: 'Coach briefing', desc: 'The session shows a Class Roster Intelligence panel with real demo player data.' },
                { n: 6, title: 'Adaptive suggestions', desc: 'Generate class-specific suggestions using the demo players\' needs.' },
                { n: 7, title: 'Approve + apply', desc: 'Approve a suggestion, apply it — it appears in the session block only. Template untouched.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3 items-start">
                  <StepBadge n={n} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Section 4 — Deep Links
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">Quick Links</p>
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              <DemoLink href="/director/players" label="Demo Players" icon={<Users className="w-3.5 h-3.5" />} active={sandboxActive} />
              <DemoLink href="/director/players/onboarding-review" label="Onboarding Review" icon={<CheckCircle2 className="w-3.5 h-3.5" />} active={sandboxActive} />
              <DemoLink href="/director/players/development-intake" label="Development Intake" icon={<Sparkles className="w-3.5 h-3.5" />} active={sandboxActive} />
              <DemoLink href="/director/curriculum" label="Curriculum" icon={<BookOpen className="w-3.5 h-3.5" />} active />
              <DemoLink href="/director/review" label="Review Queue" icon={<ClipboardList className="w-3.5 h-3.5" />} active />
              {sandbox?.sessionId ? (
                <Link
                  href={`/director/sessions/${sandbox.sessionId}`}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-lime/40 text-lime hover:bg-lime/10 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Open Demo Session
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted opacity-50">
                  <Calendar className="w-3.5 h-3.5" />
                  Demo Session (create sandbox first)
                </span>
              )}
              <DemoLink href="/director/sessions" label="All Sessions" icon={<Calendar className="w-3.5 h-3.5" />} active />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Section 5 — Sample Player Data
          ============================================================ */}
      <div className="space-y-3">
        <div>
          <p className="label-xs">Sample Player Data</p>
          <p className="text-xs text-text-muted mt-1">
            Once Brian&apos;s real roster is uploaded, this section is replaced by actual academy players.
          </p>
        </div>

        {sandboxActive && sandbox!.demoPlayers.length > 0 ? (
          <div className="space-y-2">
            {sandbox!.demoPlayers.map(p => (
              <Link key={p.id} href={`/director/players/${p.id}`} className="block group">
                <Card hover>
                  <CardContent className="py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-text-primary group-hover:text-lime transition-colors">
                            {p.fullName.replace('[DEMO] ', '')}
                          </p>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 font-semibold shrink-0">
                            DEMO
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {p.strengths.length > 0 && (
                            <div>
                              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Strengths</p>
                              <div className="flex flex-wrap gap-1">
                                {p.strengths.map(s => (
                                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {p.needs.length > 0 && (
                            <div>
                              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Working on</p>
                              <div className="flex flex-wrap gap-1">
                                {p.needs.map(n => (
                                  <span key={n} className="text-[10px] px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/20">
                                    {n}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {p.priority && (
                          <p className="mt-1.5 text-[11px] text-text-muted">
                            <span className="text-text-secondary">Priority:</span> {p.priority}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-text-muted">Create the demo sandbox to see sample players here.</p>
            </CardContent>
          </Card>
        )}

        {sandboxActive && (
          <div className="flex flex-wrap gap-2">
            <Link href="/director/players/import" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              Player Import
            </Link>
            <Link href="/director/players/development-intake" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              Development Intake
            </Link>
            <Link href="/director/players/onboarding-review" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              Onboarding Review
            </Link>
          </div>
        )}
      </div>

      {/* ============================================================
          Section 6 — Curriculum Customization
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">Curriculum Customization Preview</p>
        <Card>
          <CardContent className="py-5 space-y-4">
            <div className="px-4 py-3 rounded-lg border border-lime/20 bg-lime/5">
              <p className="text-[10px] text-lime uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Sample Director Prompt
              </p>
              <p className="text-sm text-text-primary italic leading-relaxed">
                &ldquo;For our Orange 2 players, I want more return-of-serve readiness before Orange 3.&rdquo;
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { step: '1', label: 'OS creates a draft', desc: 'The change is recorded as a structured override — not applied yet.' },
                { step: '2', label: 'Director reviews', desc: 'The Review Queue shows the proposed change in plain English.' },
                { step: '3', label: 'Approved change applies to academy curriculum only', desc: 'The global master curriculum is never touched.' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-3 items-start">
                  <span className="flex-none w-5 h-5 rounded-full bg-surface-raised text-text-muted text-[10px] font-bold flex items-center justify-center border border-border shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm text-text-primary font-medium">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/director/curriculum" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
                Curriculum
              </Link>
              <Link href="/director/review" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
                Review Queue
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Section 7 — Session + Coach Intelligence
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">Coach Session Preview</p>
        <Card>
          <CardContent className="py-5 space-y-4">
            {sandboxActive && sandbox!.sessionExists ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {sandbox!.sessionName?.replace('[DEMO] ', '') ?? 'Orange 2 Adaptive Session'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {sandbox!.playerCount} sample players · [DEMO] Orange 2 Sample Group
                    </p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 font-semibold shrink-0">
                    DEMO
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-text-muted">The session page shows:</p>
                  <ul className="space-y-1">
                    {[
                      'Class Roster Intelligence with real demo player data',
                      'Coach Briefing: needs, curriculum context, focus areas',
                      'Session blocks mirroring the demo template',
                      '"Generate Suggestions" button to create adaptive suggestions',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-text-secondary">
                        <CheckCircle2 className="w-3 h-3 text-status-green shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/director/sessions/${sandbox!.sessionId}`}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Open Demo Session
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-text-muted">Create the demo sandbox first.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Section 8 — Adaptive Suggestions
          ============================================================ */}
      <div className="space-y-3">
        <p className="label-xs">Adaptive Suggestions Preview</p>
        <Card>
          <CardContent className="py-5 space-y-4">
            <p className="text-xs text-text-secondary">
              The OS reads the sample class and suggests modifications for that exact group.
              Rules fire based on real demo player needs — not generic text.
            </p>

            <div className="space-y-2">
              {[
                {
                  type: 'Recovery Constraint',
                  detail: 'Add recover-to-middle rule after each crosscourt ball.',
                  players: '[DEMO] Mia Alvarez, [DEMO] Ava Thompson',
                  reason: '2 players with recovery needs active',
                },
                {
                  type: 'Return Readiness',
                  detail: 'Simplify return-start game for first 5 minutes.',
                  players: '[DEMO] Sophie Chen',
                  reason: 'Return readiness flagged as current priority',
                },
                {
                  type: 'Assessment Moment',
                  detail: 'Add observation cue: watch contact spacing on short ball.',
                  players: '[DEMO] Leo Martin',
                  reason: 'Contact spacing listed as development need',
                },
              ].map(({ type, detail, players, reason }) => (
                <div key={type} className="px-3.5 py-3 rounded-lg border border-border bg-surface-raised space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 font-semibold uppercase tracking-wider">
                      {type}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary">{detail}</p>
                  <p className="text-[11px] text-text-muted">{players}</p>
                  <p className="text-[11px] text-status-orange">{reason}</p>
                </div>
              ))}
            </div>

            <div className="px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
              <p className="text-xs text-text-muted">
                <span className="text-text-secondary font-medium">Approved suggestions apply to the demo session only</span> — never the master template.
                Go to the demo session to generate real suggestions from the sample class data.
              </p>
            </div>

            {sandboxActive && sandbox?.sessionId && (
              <Link
                href={`/director/sessions/${sandbox.sessionId}`}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Generate real suggestions in demo session
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Footer
          ============================================================ */}
      <div className="pb-6">
        <p className="text-[10px] text-text-muted leading-relaxed">
          <span className="text-lime font-semibold">This is sample data.</span>{' '}
          Once we upload your actual roster and coaches add strengths and needs, this is exactly how the system works.
          Demo records are labeled <code className="font-mono text-lime/80">[DEMO]</code> everywhere they appear.
          Use the controls above to reset or delete the sandbox at any time.
        </p>
      </div>

    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-status-green' : 'bg-text-muted'}`} />
        <p className="text-xs text-text-primary truncate">{value}</p>
      </div>
    </div>
  )
}

function DemoLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
}) {
  if (!active) {
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted opacity-40">
        {icon}
        {label}
      </span>
    )
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
