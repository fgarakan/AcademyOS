# DONNA Persistent Conversation Mode — Architecture
**Sprint:** 918 | **Date:** 2026-05-29

---

## 1. What Changed

### Prior State
- Panel open/closed only (binary)
- Closing cleared conversation thread (Sprint 711 behavior)
- Route changes updated `lastModule` in session context, but no visible signal in panel
- FAB button had open/closed visual states only

### Sprint 918 Additions

**Minimize state:**
```
open → minimize → [route changes] → expand → resumes from same point
  ↓                                              (thread preserved)
close → [thread cleared] → reopen → fresh start
```

**FAB visual states:**
- Default (closed): purple gradient
- Open: bright purple with glow
- Minimized: lime tint + green dot → signals "conversation preserved, click to resume"

**Context refresh signal:**
When the director navigates to a new page while DONNA panel is open and not minimized:
- `contextRefreshedAt` timestamp updates
- `contextPageLabel` updates to new page name
- Panel header flashes "↻ [Page Name]" for 3 seconds

---

## 2. Data Flow

```
DonnaSessionContextProvider (layout level)
  ├── panelOpen: boolean (sessionStorage backed)
  ├── panelMinimized: boolean (sessionStorage backed) ← Sprint 918
  ├── contextRefreshedAt: number | null ← Sprint 918
  ├── contextPageLabel: string | null ← Sprint 918
  ├── minimizePanel(): void ← Sprint 918
  └── expandPanel(): void ← Sprint 918

DonnaAssistantButton
  ├── Minus button → minimizePanel() (panel hidden, thread preserved)
  ├── X button → closePanel() (thread cleared — unchanged)
  ├── FAB click:
  │     if (panelMinimized) expandPanel() [Sprint 918]
  │     else openDonnaPanel() [existing flow]
  ├── contextRefreshedAt watcher → 3s flash badge
  └── FAB style: lime when minimized

useDonnaPersistentPanel hook ← Sprint 918
  └── Convenience wrapper over useDonnaSessionContext
```

---

## 3. Conversation Persistence Summary

| State | Thread cleared? | Context fresh? | Session memory? |
|---|---|---|---|
| Panel open | No | On page load | Via donnaSafeSessionMemory |
| Panel minimized | No | On expand | Via donnaSafeSessionMemory |
| Panel closed (X) | Yes | On reopen | Via donnaSafeSessionMemory |
| Route change (open) | No | Refresh signal shown | Unchanged |
| Route change (minimized) | No | On expand | Unchanged |

---

## 4. V2 Gaps

1. When minimized and panel re-expands, the context fetch useEffect fires again (re-fetches review queue count, etc.). This is desirable but means a short "thinking" flash. A smarter approach would cache the last context for 60s on minimize.
2. Mobile: FAB is hidden for directors on mobile (`hidden sm:flex`). Minimize state is tracked but has no mobile UI surface.
3. Voice conversation mode: minimize doesn't stop ongoing voice recognition. If the director minimizes while voice is active, the existing `stopVoice()` on panel hide will fire.
