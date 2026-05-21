// Sprint 416 — Internal Diagnostics Console V1
// Dev-only page. Hidden in production by NODE_ENV check.
// Shows: feature flags, kill switch states, rate limit policies, module health.

import { getAllFeatureFlags } from '@/lib/featureFlags/featureFlags'
import { getAllKillSwitchStates } from '@/lib/killSwitches/killSwitches'
import { RATE_LIMIT_POLICIES } from '@/lib/rateLimit/rateLimitPolicy'
import { Card, CardHeader, CardContent } from '@/components/ui'

export default function DiagnosticsPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-8 text-text-muted text-sm">
        Diagnostics console is not available in production.
      </div>
    )
  }

  const featureFlags = getAllFeatureFlags()
  const killSwitches = getAllKillSwitchStates()

  return (
    <div className="min-h-screen bg-base text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">AcademyOS Diagnostics</h1>
          <p className="text-text-muted text-sm label-xs">Dev environment only — not visible in production</p>
        </div>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">Feature Flags</h2>
            <p className="text-text-muted text-sm">Environment-variable driven. Missing var = OFF.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(featureFlags).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="font-mono text-sm text-text-secondary">{key}</span>
                  <span className={`label-xs font-mono px-2 py-0.5 rounded ${enabled ? 'bg-status-green/20 text-status-green' : 'bg-surface-raised text-text-muted'}`}>
                    {enabled ? 'ENABLED' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kill Switches */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">Kill Switches</h2>
            <p className="text-text-muted text-sm">Absent env var = feature blocked. Set to &apos;1&apos; to allow.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(killSwitches).map(([key, allowed]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="font-mono text-sm text-text-secondary">{key}</span>
                  <span className={`label-xs font-mono px-2 py-0.5 rounded ${allowed ? 'bg-status-green/20 text-status-green' : 'bg-status-red/20 text-status-red'}`}>
                    {allowed ? 'ALLOWED' : 'BLOCKED'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Policies */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">Rate Limit Policies</h2>
            <p className="text-text-muted text-sm">In-process only — resets on cold start. Not reliable across serverless instances.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 label-xs text-text-muted">Policy</th>
                    <th className="text-left py-2 pr-4 label-xs text-text-muted">Scope</th>
                    <th className="text-right py-2 pr-4 label-xs text-text-muted">Limit</th>
                    <th className="text-right py-2 label-xs text-text-muted">Window</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(RATE_LIMIT_POLICIES).map((policy) => (
                    <tr key={policy.name} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-4 font-mono text-text-secondary">{policy.name}</td>
                      <td className="py-1.5 pr-4 text-text-muted">{policy.scope}</td>
                      <td className="py-1.5 pr-4 text-right font-mono text-lime">{policy.limit}</td>
                      <td className="py-1.5 text-right text-text-muted">{policy.windowMs / 60000}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Module Health Summary */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">Module Health</h2>
            <p className="text-text-muted text-sm">Static status as of last build.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {[
                { mod: 'observability', status: 'live', note: 'logInfo/logWarn/logError + createActionLogger' },
                { mod: 'idempotency (in-process)', status: 'live', note: 'actionGuards, idempotencyKeys' },
                { mod: 'idempotency (persistent)', status: 'stub', note: 'awaiting Sprint 420+ migration' },
                { mod: 'rateLimit', status: 'live', note: 'in-process only — not durable' },
                { mod: 'cache/cacheKeys', status: 'live', note: 'key builders defined, not yet wired' },
                { mod: 'cache/ttlPolicy', status: 'live', note: 'TTL constants defined, not yet wired' },
                { mod: 'cache/revalidation', status: 'live', note: 'revalidatePath helpers defined, not yet wired' },
                { mod: 'usage', status: 'live', note: 'log-only; DB-backed in Sprint 419+' },
                { mod: 'jobs', status: 'stub', note: 'in-process only; DB queue in Sprint 420+' },
                { mod: 'versioning', status: 'live', note: 'optimistic lock helpers ready' },
                { mod: 'audit', status: 'live', note: 'writeAuditLog() ready; callers need wiring' },
                { mod: 'featureFlags', status: 'live', note: 'env-var flags; DB flags in Sprint 421+' },
                { mod: 'killSwitches', status: 'live', note: 'env-var gating; KILL_SWITCH_ALLOW_* pattern' },
              ].map(({ mod, status, note }) => (
                <div key={mod} className="flex items-start gap-3 py-1 border-b border-border last:border-0">
                  <span className={`mt-0.5 label-xs px-1.5 py-0.5 rounded shrink-0 ${status === 'live' ? 'bg-status-green/20 text-status-green' : 'bg-status-orange/20 text-status-orange'}`}>
                    {status}
                  </span>
                  <div>
                    <div className="text-text-primary">{mod}</div>
                    <div className="text-text-muted text-xs">{note}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
