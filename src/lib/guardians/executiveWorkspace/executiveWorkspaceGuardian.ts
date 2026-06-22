// Guardian #1 — ExecutiveWorkspaceGuardian.
//
// Enforces the sidebar-containment hard rules of the Executive Workspace Standard
// (docs/EXECUTIVE_WORKSPACE_STANDARD.md §2, §7, §8): the DONNA sidebar render tree
// owns conversation, brief, recommendation, status, preview and navigation only —
// never mutation, editor, multi-step state, or completion.
//
// READ-ONLY. This guardian observes and classifies; it never edits source.
//
// v1 surface heuristic: the "sidebar render tree" is approximated as the `.tsx`
// components under src/components/assistant/**. Colocated `.ts` infrastructure is
// excluded (it is allowed to reference actions). This heuristic can later be
// replaced with true import-graph reachability WITHOUT changing the contract.
//
// The cross-file §12 checks (exactly one owning page per workflow; every mutation
// originates from a page) are intentionally deferred to PageOwnershipGuardian.

import type { CodeFile, Finding, Guardian, RepoSnapshot, Severity } from '../framework/types'
import { fingerprint } from '../framework/runtime'

const GUARDIAN_ID = 'executive-workspace'
const SURFACE = ['src/components/assistant/**'] as const

function lineOf(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line++
  return line
}

function make(
  ruleId: string,
  severity: Severity,
  file: string,
  key: string,
  line: number,
  message: string,
  evidence: string,
): Finding {
  return {
    guardianId: GUARDIAN_ID,
    ruleId,
    severity,
    file,
    line,
    message,
    evidence: evidence.trim().slice(0, 140),
    fingerprint: fingerprint(GUARDIAN_ID, ruleId, file, key),
  }
}

// Rule 1 (§2, §7) — committing server actions reachable from the render tree.
const COMMITTING_ACTION =
  /\b((?:save|create|apply|update|route|queue|finalize|execute|approve|reject|mark)[A-Za-z0-9]*Action)\b/g

// Rule 2 (§2) — content-editing inputs. type="hidden|checkbox|..." are not editors.
const EXEMPT_INPUT_TYPES = new Set([
  'hidden', 'checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color',
])
const INPUT_TAG = /<input\b([^>]*)>/g

// Rule 3 (§2, §8) — multi-step / progress-tracker state.
const WORKFLOW_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'step-of', re: /\bStep\s+[\w{}.]+\s+of\b/i },
  { id: 'step-counter', re: /\b(currentStep|stepIndex|totalSteps|stepCount)\b/ },
  { id: 'progress-meter', re: /\b(progressPercent|coveragePercent|completionPercent)\b/ },
]

// Rule 4 (§7) — completion terminal controls rendered as buttons.
const COMPLETION_LABEL = />\s*(Save|Submit|Apply|Approve|Reject|Queue|Finalize|Execute)\b/g

function inspectFile(file: CodeFile): Finding[] {
  const out: Finding[] = []
  const src = file.source
  let m: RegExpExecArray | null

  // Rule 1 — no sidebar mutations (one finding per distinct action per file).
  const seenAction = new Set<string>()
  COMMITTING_ACTION.lastIndex = 0
  while ((m = COMMITTING_ACTION.exec(src))) {
    const name = m[1]
    if (seenAction.has(name)) continue
    seenAction.add(name)
    out.push(
      make('no-sidebar-mutations', 'critical', file.path, name, lineOf(src, m.index),
        `Committing server action \`${name}\` is reachable from the sidebar render tree; mutations must originate from the owning page (§2, §7).`,
        name),
    )
  }

  // Rule 2 — no sidebar editors (textarea / select).
  for (const tag of ['<textarea', '<select'] as const) {
    const idx = src.indexOf(tag)
    if (idx >= 0)
      out.push(
        make('no-sidebar-editors', 'high', file.path, tag.slice(1), lineOf(src, idx),
          `Editor element \`${tag}>\` in the sidebar; editing belongs on the owning page (§2). Voice + a single answer-confirm field are the only exceptions.`,
          tag),
      )
  }
  // Rule 2 — content-editing <input> (first non-exempt occurrence per file).
  INPUT_TAG.lastIndex = 0
  while ((m = INPUT_TAG.exec(src))) {
    const typeMatch = /type\s*=\s*["']([^"']+)["']/.exec(m[1])
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'text'
    if (!EXEMPT_INPUT_TYPES.has(type)) {
      out.push(
        make('no-sidebar-editors', 'high', file.path, 'input', lineOf(src, m.index),
          'Content-editing `<input>` in the sidebar; editing belongs on the owning page (§2).',
          m[0]),
      )
      break
    }
  }

  // Rule 3 — no multi-step / progress state.
  for (const p of WORKFLOW_PATTERNS) {
    const mm = p.re.exec(src)
    if (mm)
      out.push(
        make('no-sidebar-workflow-state', 'high', file.path, p.id, lineOf(src, mm.index),
          `Multi-step / progress state (\`${p.id}\`) in the sidebar; depth belongs on the owning page (§2, §8).`,
          mm[0]),
      )
  }

  // Rule 4 — no completion controls (one finding per distinct label per file).
  const seenLabel = new Set<string>()
  COMPLETION_LABEL.lastIndex = 0
  while ((m = COMPLETION_LABEL.exec(src))) {
    const label = m[1].toLowerCase()
    if (seenLabel.has(label)) continue
    seenLabel.add(label)
    out.push(
      make('no-sidebar-completion', 'critical', file.path, label, lineOf(src, m.index),
        `Completion control "${m[1]}" in the sidebar; save/submit/apply/approve happen only on the owning page (§7).`,
        m[0]),
    )
  }

  return out
}

export const executiveWorkspaceGuardian: Guardian = {
  id: GUARDIAN_ID,
  name: 'ExecutiveWorkspaceGuardian',
  standard: 'docs/EXECUTIVE_WORKSPACE_STANDARD.md',
  description:
    'Guardian #1 — sidebar containment: no mutation, no editor, no multi-step state, no completion control in the DONNA sidebar render tree.',
  surface: SURFACE,
  baselinePath: 'src/lib/guardians/executiveWorkspace/executiveWorkspace.baseline.json',
  inspect(snapshot: RepoSnapshot): Finding[] {
    return snapshot
      .surface(SURFACE)
      .filter((f) => f.ext === '.tsx') // v1 heuristic: render tree = .tsx components in the assistant surface
      .flatMap(inspectFile)
  },
}
