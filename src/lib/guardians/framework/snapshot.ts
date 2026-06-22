// The single impure boundary of the Guardian Framework.
//
// buildRepoSnapshot() walks the source tree once and returns an immutable,
// deterministically-ordered snapshot. Every guardian is a pure function over
// this snapshot, so guardians themselves never touch the filesystem.

import { readdirSync, readFileSync, statSync } from 'fs'
import { extname, join, relative } from 'path'
import type { CodeFile, RepoSnapshot } from './types'

const DEFAULT_EXTS = ['.ts', '.tsx']
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build'])

function toPosix(p: string): string {
  return p.split('\\').join('/')
}

function walk(dir: string, exts: string[], visit: (abs: string) => void): void {
  let entries: string[]
  try {
    entries = readdirSync(dir).slice().sort()
  } catch {
    return
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue
    const abs = join(dir, entry)
    let isDir = false
    try {
      isDir = statSync(abs).isDirectory()
    } catch {
      continue
    }
    if (isDir) walk(abs, exts, visit)
    else if (exts.includes(extname(abs))) visit(abs)
  }
}

// Minimal, deterministic glob → RegExp. Supports `*` (within a path segment)
// and `**` (across segments). Sufficient for surface selectors like
// `src/components/assistant/**`.
function globToRegExp(glob: string): RegExp {
  const g = toPosix(glob)
  let re = ''
  for (let i = 0; i < g.length; i++) {
    const c = g[i]
    if (c === '*') {
      if (g[i + 1] === '*') {
        re += '.*'
        i++
        if (g[i + 1] === '/') i++
      } else {
        re += '[^/]*'
      }
    } else if ('.+?^${}()|[]\\'.includes(c)) {
      re += '\\' + c
    } else {
      re += c
    }
  }
  return new RegExp('^' + re + '$')
}

export function buildRepoSnapshot(
  root: string,
  opts?: { exts?: string[]; dir?: string },
): RepoSnapshot {
  const exts = opts?.exts ?? DEFAULT_EXTS
  const scanDir = join(root, opts?.dir ?? 'src')
  const files: CodeFile[] = []
  walk(scanDir, exts, (abs) => {
    files.push({ path: toPosix(relative(root, abs)), ext: extname(abs), source: readFileSync(abs, 'utf8') })
  })
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  const frozen: readonly CodeFile[] = Object.freeze(files)

  return {
    root,
    files: frozen,
    surface(globs: readonly string[]): readonly CodeFile[] {
      const matchers = globs.map(globToRegExp)
      return frozen.filter((f) => matchers.some((re) => re.test(f.path)))
    },
  }
}
