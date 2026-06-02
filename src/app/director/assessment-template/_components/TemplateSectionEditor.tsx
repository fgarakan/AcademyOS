'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Check, X, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import {
  renameSectionAction,
  toggleSectionVisibilityAction,
  reorderSectionsAction,
  renameSkillAction,
  toggleSkillVisibilityAction,
  reorderSkillsAction,
} from '../_actions/templateActions'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkillEditorRow {
  id:           string
  skill_key:    string
  display_name: string
  sort_order:   number
  is_visible:   boolean
  is_custom:    boolean
  is_required:  boolean
}

export interface SectionEditorRow {
  id:           string
  section_key:  string
  display_name: string
  sort_order:   number
  is_visible:   boolean
  is_custom:    boolean
  skills:       SkillEditorRow[]
}

interface Props {
  templateId:  string
  sections:    SectionEditorRow[]
}

// ─── Inline rename input ──────────────────────────────────────────────────────

function RenameInput({
  initial,
  onSave,
  onCancel,
}: {
  initial: string
  onSave: (v: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(value)
          if (e.key === 'Escape') onCancel()
        }}
        maxLength={80}
        className="flex-1 bg-surface-raised border border-lime/40 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none min-w-0"
      />
      <button type="button" onClick={() => onSave(value)} className="p-1 text-lime hover:text-lime/80">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-text-muted hover:text-text-secondary">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Skill row ────────────────────────────────────────────────────────────────

function SkillRow({
  skill,
  sectionId,
  templateId,
  index,
  total,
  allSkillIds,
}: {
  skill:       SkillEditorRow
  sectionId:   string
  templateId:  string
  index:       number
  total:       number
  allSkillIds: string[]
}) {
  const [renaming, setRenaming] = useState(false)
  const [displayName, setDisplayName] = useState(skill.display_name)
  const [visible, setVisible] = useState(skill.is_visible)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRename(v: string) {
    setRenaming(false)
    if (v.trim() === displayName) return
    startTransition(async () => {
      const res = await renameSkillAction(skill.id, v)
      if (res.ok) setDisplayName(v.trim())
      else setError(res.error)
    })
  }

  function handleToggleVisible() {
    startTransition(async () => {
      const next = !visible
      const res = await toggleSkillVisibilityAction(skill.id, next)
      if (res.ok) setVisible(next)
      else setError(res.error)
    })
  }

  function handleMoveUp() {
    if (index === 0) return
    const newOrder = [...allSkillIds]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    startTransition(async () => {
      await reorderSkillsAction(sectionId, templateId, newOrder)
    })
  }

  function handleMoveDown() {
    if (index === total - 1) return
    const newOrder = [...allSkillIds]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    startTransition(async () => {
      await reorderSkillsAction(sectionId, templateId, newOrder)
    })
  }

  return (
    <div className={`flex items-center gap-2 py-2 border-b border-border/40 last:border-0 ${!visible ? 'opacity-40' : ''}`}>
      {renaming ? (
        <div className="flex-1 min-w-0">
          <RenameInput initial={displayName} onSave={handleRename} onCancel={() => setRenaming(false)} />
        </div>
      ) : (
        <p className="flex-1 text-xs text-text-secondary min-w-0 truncate">
          {displayName}
          {skill.is_required && <span className="ml-1 text-[9px] text-status-orange">req</span>}
          {skill.is_custom && <span className="ml-1 text-[9px] text-lime">custom</span>}
        </p>
      )}

      {!renaming && (
        <div className="flex items-center gap-1 shrink-0">
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin text-text-muted" />
          ) : (
            <>
              <button type="button" onClick={() => setRenaming(true)} className="p-1 text-text-muted hover:text-lime transition-colors" title="Rename">
                <Pencil className="w-3 h-3" />
              </button>
              <button type="button" onClick={handleToggleVisible} className="p-1 text-text-muted hover:text-text-secondary transition-colors" title={visible ? 'Hide' : 'Show'}>
                {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
              <button type="button" onClick={handleMoveUp} disabled={index === 0} className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button type="button" onClick={handleMoveDown} disabled={index === total - 1} className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors">
                <ArrowDown className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}
      {error && <p className="text-[9px] text-status-red">{error}</p>}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionEditorCard({
  section,
  templateId,
  index,
  total,
  allSectionIds,
}: {
  section:       SectionEditorRow
  templateId:    string
  index:         number
  total:         number
  allSectionIds: string[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [displayName, setDisplayName] = useState(section.display_name)
  const [visible, setVisible] = useState(section.is_visible)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const visibleSkillCount = section.skills.filter(s => s.is_visible).length

  function handleRename(v: string) {
    setRenaming(false)
    if (v.trim() === displayName) return
    startTransition(async () => {
      const res = await renameSectionAction(section.id, v)
      if (res.ok) setDisplayName(v.trim())
      else setError(res.error)
    })
  }

  function handleToggleVisible() {
    startTransition(async () => {
      const next = !visible
      const res = await toggleSectionVisibilityAction(section.id, next)
      if (res.ok) setVisible(next)
      else setError(res.error)
    })
  }

  function handleMoveUp() {
    if (index === 0) return
    const newOrder = [...allSectionIds]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    startTransition(async () => {
      await reorderSectionsAction(templateId, newOrder)
    })
  }

  function handleMoveDown() {
    if (index === total - 1) return
    const newOrder = [...allSectionIds]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    startTransition(async () => {
      await reorderSectionsAction(templateId, newOrder)
    })
  }

  return (
    <Card>
      <div
        className={`px-4 py-3 flex items-center gap-3 ${!visible ? 'opacity-50' : ''}`}
      >
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-text-muted hover:text-text-secondary shrink-0"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          {renaming ? (
            <RenameInput initial={displayName} onSave={handleRename} onCancel={() => setRenaming(false)} />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
              {section.is_custom && <span className="text-[9px] text-lime bg-lime/10 border border-lime/20 rounded px-1">custom</span>}
            </div>
          )}
          {!renaming && (
            <p className="text-[10px] text-text-muted mt-0.5">
              {visibleSkillCount} of {section.skills.length} skills visible
            </p>
          )}
        </div>

        {!renaming && (
          <div className="flex items-center gap-1 shrink-0">
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
            ) : (
              <>
                <button type="button" onClick={() => setRenaming(true)} className="p-1 text-text-muted hover:text-lime transition-colors" title="Rename">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={handleToggleVisible} className="p-1 text-text-muted hover:text-text-secondary transition-colors" title={visible ? 'Hide section' : 'Show section'}>
                  {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button type="button" onClick={handleMoveUp} disabled={index === 0} className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={handleMoveDown} disabled={index === total - 1} className="p-1 text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-[10px] text-status-red">{error}</p>}

      {expanded && section.skills.length > 0 && (
        <CardContent className="pt-0 border-t border-border">
          <div className="py-2">
            {section.skills.map((skill, i) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                sectionId={section.id}
                templateId={templateId}
                index={i}
                total={section.skills.length}
                allSkillIds={section.skills.map(s => s.id)}
              />
            ))}
          </div>
        </CardContent>
      )}

      {expanded && section.skills.length === 0 && (
        <CardContent className="pt-0 border-t border-border">
          <p className="text-xs text-text-muted py-3">No skills in this section.</p>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function TemplateSectionEditor({ templateId, sections }: Props) {
  if (sections.length === 0) {
    return (
      <p className="text-xs text-text-muted px-1">No sections found. Run migration 082 to seed the default template.</p>
    )
  }

  const sectionIds = sections.map(s => s.id)

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <SectionEditorCard
          key={section.id}
          section={section}
          templateId={templateId}
          index={i}
          total={sections.length}
          allSectionIds={sectionIds}
        />
      ))}
    </div>
  )
}
