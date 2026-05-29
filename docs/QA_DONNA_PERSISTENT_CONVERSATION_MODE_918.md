# DONNA Persistent Conversation Mode QA
**Sprint:** 918 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Minimize Behavior

| Check | Result |
|---|---|
| Minimize hides panel without clearing thread? | Yes — `minimizePanel()` calls `setPanelOpen(false)` + `setPanelMinimized(true)`, does NOT call `closePanel()` |
| `closePanel()` still clears thread state? | Yes — X button behavior unchanged |
| Minimize state persists across route changes? | Yes — `sessionStorage('donnaPanelMinimized')` |
| FAB shows "resume" visual when minimized? | Yes — lime tint + green dot indicator |
| Clicking FAB when minimized calls expandPanel? | Yes — `if (panelMinimized) { expandPanel(); return }` |
| expandPanel() correctly restores open state? | Yes — `setPanelOpen(true) + setPanelMinimized(false)` |

---

## 2. Context Refresh on Route Change

| Check | Result |
|---|---|
| Route change while panel open sets contextRefreshedAt? | Yes — `useEffect` in `DonnaSessionContextProvider` |
| Context refresh only fires when panel is open and not minimized? | Yes — guard: `if (!pathname \|\| !panelOpen \|\| panelMinimized) return` |
| 3-second flash indicator shows on context refresh? | Yes — `showContextRefresh` state auto-clears via `setTimeout(3000)` |
| Context refresh never blocks navigation? | Yes — side effect only, no await |

---

## 3. Voice Follow-Up Safety

| Check | Result |
|---|---|
| Voice always-listening introduced? | No — voice behavior unchanged |
| MAX_NO_SPEECH_RETRIES still enforced? | Yes — unchanged in DonnaVoiceReadyShell |
| Wake phrase listener still panel-scoped only? | Yes — no changes to voice activation logic |

---

## 4. Protected Systems

| Check | Result |
|---|---|
| Sprint 904 approve/reject paths modified? | No |
| proposed_actions state machine modified? | No |
| DonnaVoiceReadyShell God Mode behavior changed? | No |
| donnaChatSessionMemory fallback changed? | No |
| Thread clearing on X close changed? | No |

---

## 5. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 6. Files Changed

**Created:**
- `src/lib/donna/useDonnaPersistentPanel.ts`

**Modified:**
- `src/lib/donna/donnaSessionContext.ts` — added panelMinimized, minimizePanel, expandPanel, contextRefreshedAt, contextPageLabel
- `src/components/donna/DonnaSessionContextProvider.tsx` — implemented new state + sessionStorage + route-refresh signal
- `src/components/assistant/DonnaAssistantButton.tsx` — minimize button, context refresh flash, FAB indicator, expand-from-minimize FAB
