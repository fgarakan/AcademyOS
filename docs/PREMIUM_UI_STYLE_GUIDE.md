# Premium UI Style Guide

**Version:** 1.0 — Manus Aesthetic  
**Sprint:** 127  
**Date:** 2026-05-01

---

## Colors

### Primary Accent — Cyan/Aqua
```
--accent-cyan: #11d9df
Tailwind: text-lime, bg-lime, border-lime (token renamed to cyan value)
Soft bg: bg-lime/10 or rgba(17,217,223,0.10)
Dim: bg-lime/20 or rgba(17,217,223,0.20)
```

### Backgrounds
```
App background:    #030506  (base)
Sidebar:           #050708  (darker than app bg)
Surface/page:      #07090c  (surface)
Card default:      #090c10  (surface)
Card elevated:     #0d1117  (surface-raised)
```

### Borders
```
Subtle:   rgba(255,255,255,0.06)  border-border-subtle / border-border/60
Default:  rgba(255,255,255,0.10)  border-border
Strong:   rgba(255,255,255,0.16)  border-border-strong
```

### Text
```
Primary:   #f4f7f8  text-text-primary
Secondary: #a3aab4  text-text-secondary
Muted:     #626b76  text-text-muted
Disabled:  #3a4050  text-text-disabled
```

### Status Colors
```
Cyan/Active:  #11d9df  text-lime
Green/Good:   #52e36f  text-status-green
Amber/Warn:   #ffb020  text-status-orange / text-status-amber
Red/Danger:   #ff4d55  text-status-red
Purple/AI:    #b56cff  text-status-purple
```

---

## Typography

### Page Hierarchy
```
Page eyebrow:  .page-eyebrow or .label-xs-cyan
               11px, uppercase, tracking-widest, cyan
               Use: "PLAYERS" / "CURRICULUM" / "SESSION DETAIL"

Page title:    .page-title
               24px, bold, text-primary
               Use: "Player Directory" / "Curriculum Overview"

Page subtitle: .page-subtitle
               14px, text-muted
               Use: "Academy-wide player tracking..."

Section label: .label-xs
               11px, uppercase, tracking-widest, text-muted
               Use inside cards for sub-section headers

Metric value:  font-mono font-bold text-lime text-4xl
               Use for KPI numbers

Body:          14px, text-secondary
               Default readable text

Body small:    12px, text-muted
               Meta info, timestamps, hints
```

---

## Spacing Rhythm

Use 4px base unit — prefer multiples: 8, 12, 16, 20, 24, 32, 40, 48px.

```
Page padding:       p-6 (24px) or p-8 (32px) for director pages
Card internal:      px-5 py-5 (20px)
Section gap:        space-y-6 or space-y-8
Card grid gap:      gap-4 or gap-6
Inline items:       gap-2 or gap-3
```

---

## Cards

```tsx
// Standard card
<Card>
  <CardHeader>
    <h2 className="font-semibold text-text-primary">Title</h2>
    <p className="text-xs text-text-muted mt-0.5">Subtitle</p>
  </CardHeader>
  <CardContent className="pt-0">
    {/* content */}
  </CardContent>
</Card>

// Hover/clickable card
<Card hover>...</Card>

// Card background: bg-surface = #07090c
// Card border: border-border = rgba(255,255,255,0.10)
// Card radius: rounded-2xl
// Hover glow: hover:shadow-cyan
```

---

## Buttons

```tsx
// Primary — cyan filled
<button className="btn-lime">Create Session</button>

// Secondary — dark ghost
<button className="btn-ghost">Cancel</button>

// Destructive
<button className="btn-danger">Delete</button>

// Link-style action
<Link className="text-lime text-xs font-medium hover:opacity-80">View all →</Link>
```

---

## Tables

```tsx
// Wrap in a card
<div className="table-card">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Player</TableHead>
        <TableHead>Level</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow onClick={...}>
        <TableCell>...</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

Column headers: `.label-xs` — 11px uppercase muted  
Row height: min 48px (py-3)  
Hover state: bg-surface-raised  
Dividers: divide-y divide-border (subtle)  

---

## Forms

```tsx
// Input
<input className="input-base" placeholder="Search…" />

// Label
<label className="label-xs mb-1.5 block">Player Name</label>

// Section card
<Card>
  <CardHeader>
    <h3 className="label-xs">Section Title</h3>
  </CardHeader>
  <CardContent className="pt-0 space-y-4">
    {/* form fields */}
  </CardContent>
</Card>
```

Focus ring: `focus:ring-lime/30 focus:border-lime/50`  
Input bg: `bg-surface-raised`  
Border: `border-border`  

---

## Status Pills / Badges

```tsx
// Use StatusBadge component
<StatusBadge status="on_track" label="Active" />
<StatusBadge status="needs_attention" label="Reassessment due" />

// Or raw pill
<span className="pill-cyan">Active</span>
<span className="pill-green">Complete</span>
<span className="pill-amber">On hold</span>
<span className="pill-red">Action needed</span>
<span className="pill-purple">AI Draft</span>
```

---

## Sidebar Rules

```
Width:        w-60 (240px), fixed left
Background:   #050708 (slightly darker than app)
Logo block:   px-4 py-5, bottom border
Role chip:    label-xs-cyan below academy name
Section labels: label-xs text-text-muted/60, px-3 py-1, mt-4
Nav active:   bg-lime/10 text-lime, left accent via border-l-2 border-lime
Nav inactive: text-text-muted, hover: text-text-secondary bg-surface-raised
User card:    bottom, circular avatar, name+email, logout icon
```

---

## Top Bar Rules

```
Height:       h-14 (56px)
Background:   bg-surface (same as page)
Bottom border: border-b border-border
Right side:   bell icon | academy name | avatar initials
Keep clean — do not duplicate page title
```

---

## Page Header Pattern

Every director page:
```tsx
<div className="flex items-start justify-between gap-4 mb-8">
  <div>
    <p className="page-eyebrow">PLAYERS</p>
    <h1 className="page-title">Player Directory</h1>
    <p className="page-subtitle">Academy-wide player tracking</p>
  </div>
  <button className="btn-lime">+ Add Player</button>
</div>
```

---

## Empty States

```tsx
<EmptyState
  icon={<Users className="w-5 h-5" />}
  title="No players yet"
  description="Import or enroll players to get started."
  action={<Link href="/director/players/import" className="btn-lime text-sm px-4 py-2 rounded-xl">Import Players</Link>}
/>
```

Background: bg-surface-raised (subtle icon container)  
Icon container: rounded-2xl, border border-border  
Title: font-semibold text-text-primary  
Description: text-sm text-text-secondary max-w-xs  

---

## Guardrail Panels

```tsx
// Keep it minimal — not scary
<div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-status-orange/8 border border-status-orange/20">
  <AlertTriangle className="w-4 h-4 text-status-orange mt-0.5 shrink-0" />
  <div>
    <p className="text-sm font-medium text-status-orange">Requires Director Approval</p>
    <p className="text-xs text-text-muted mt-0.5">This action will be saved as a draft.</p>
  </div>
</div>
```

---

## Module/Quick Action Tiles

```tsx
// Live module
<div className="bg-surface border border-lime/15 rounded-2xl p-5 hover:border-lime/30 hover:shadow-cyan">
  <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center mb-3">
    <Icon className="w-4 h-4 text-lime" />
  </div>
  <p className="font-semibold text-text-primary">Players</p>
  <p className="text-xs text-text-secondary mt-1">42 registered</p>
</div>

// Coming soon
<div className="bg-surface border border-border rounded-2xl p-5 opacity-40">
  ...
</div>
```
