// Development-only validation page. Do not expose in production.
// Sprint 399 — validates demo seed data applied in Sprint 398.

import { getSupabaseServer } from '@/lib/supabase/server'
import { getDemoPortalFoundation, DEMO_PLAYER_ID, DEMO_GUARDIAN_ID, DEMO_ACADEMY_ID } from '@/lib/portal/demoPortalData'

export const dynamic = 'force-dynamic'

function StatusRow({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#222222]">
      <span className={`font-mono text-sm font-bold w-12 ${pass ? 'text-[#30D158]' : 'text-[#FF3B30]'}`}>
        {pass ? 'PASS' : 'FAIL'}
      </span>
      <span className="text-[#AAAAAA] text-sm w-48 shrink-0">{label}</span>
      <span className="text-[#FFFFFF] text-sm font-mono">{detail}</span>
    </div>
  )
}

export default async function PortalFoundationCheckPage() {
  if (process.env.NODE_ENV === 'production') {
    return <div className="p-8 text-[#FF3B30]">Not available in production.</div>
  }

  const db = await getSupabaseServer()
  const { data, error } = await getDemoPortalFoundation(db)

  const playerPass = !!data?.player && data.player.fullName === 'Alex Chen'
  const levelPass = data?.level?.label === 'Orange Development'
  const prioritiesPass = (data?.priorities?.length ?? 0) === 3
  const summaryPass = !!data?.developmentSummary
  const showToStudentPass = data?.developmentSummary?.showToStudent === true
  const showToParentPass = data?.developmentSummary?.showToParent === true
  const guardianPass =
    !!data?.guardian && data.guardian.email === 'parent@angles-pilot.test'

  const allPass =
    playerPass && levelPass && prioritiesPass && summaryPass &&
    showToStudentPass && showToParentPass && guardianPass

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-widest text-[#555555] mb-1">
            Development Only · Sprint 399
          </div>
          <h1 className="text-[#FFFFFF] text-2xl font-bold">Portal Foundation Check</h1>
          <p className="text-[#AAAAAA] text-sm mt-1">
            Validates Sprint 398 demo seed data against the live Supabase schema.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 mb-6">
          <div className="text-[11px] uppercase tracking-widest text-[#555555] mb-3">Seed IDs</div>
          <div className="font-mono text-xs text-[#AAAAAA] space-y-1">
            <div>Academy: <span className="text-[#C8FF00]">{DEMO_ACADEMY_ID}</span></div>
            <div>Player:  <span className="text-[#C8FF00]">{DEMO_PLAYER_ID}</span></div>
            <div>Guardian:<span className="text-[#C8FF00] ml-1">{DEMO_GUARDIAN_ID}</span></div>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF3B30]/10 border border-[#FF3B30] rounded-lg p-4 mb-6 font-mono text-sm text-[#FF3B30]">
            Error: {error}
          </div>
        )}

        <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 mb-6">
          <div className="text-[11px] uppercase tracking-widest text-[#555555] mb-3">Results</div>
          <StatusRow
            label="Player exists"
            pass={playerPass}
            detail={data?.player?.fullName ?? 'not found'}
          />
          <StatusRow
            label="Level"
            pass={levelPass}
            detail={data?.level?.label ?? 'not found'}
          />
          <StatusRow
            label="Priorities count"
            pass={prioritiesPass}
            detail={String(data?.priorities?.length ?? 0)}
          />
          <StatusRow
            label="Development summary"
            pass={summaryPass}
            detail={summaryPass ? 'present' : 'missing'}
          />
          <StatusRow
            label="show_to_student"
            pass={showToStudentPass}
            detail={String(data?.developmentSummary?.showToStudent ?? false)}
          />
          <StatusRow
            label="show_to_parent"
            pass={showToParentPass}
            detail={String(data?.developmentSummary?.showToParent ?? false)}
          />
          <StatusRow
            label="Guardian linked"
            pass={guardianPass}
            detail={
              data?.guardian
                ? `${data.guardian.name ?? 'Demo Parent'} / ${data.guardian.email}`
                : 'not found'
            }
          />
        </div>

        <div
          className={`rounded-lg border px-4 py-3 font-mono text-sm font-bold ${
            allPass
              ? 'border-[#30D158] bg-[#30D158]/10 text-[#30D158]'
              : 'border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]'
          }`}
        >
          {allPass ? 'ALL CHECKS PASS — portal data foundation is valid.' : 'ONE OR MORE CHECKS FAILED — review seed data.'}
        </div>

        {data?.priorities && data.priorities.length > 0 && (
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 mt-6">
            <div className="text-[11px] uppercase tracking-widest text-[#555555] mb-3">Priorities Detail</div>
            {data.priorities.map((p) => (
              <div key={p.id} className="py-2 border-b border-[#222222] last:border-0">
                <div className="text-[#FFFFFF] text-sm">{p.title}</div>
                <div className="text-[#555555] text-xs font-mono mt-0.5">
                  rank:{p.rank} · {p.category} · {p.urgency} · {p.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.developmentSummary && (
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 mt-6">
            <div className="text-[11px] uppercase tracking-widest text-[#555555] mb-3">Summary Detail</div>
            <div className="text-[#AAAAAA] text-sm space-y-2">
              <div><span className="text-[#555555]">source:</span> <span className="font-mono text-xs">{data.developmentSummary.source}</span></div>
              <div><span className="text-[#555555]">student summary:</span> {data.developmentSummary.studentFriendlySummary}</div>
              <div><span className="text-[#555555]">parent summary:</span> {data.developmentSummary.parentSummary}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
