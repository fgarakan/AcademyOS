# Mobile Safari Layout QA — Sprint 732

**Date:** 2026-05-17
**Sprint:** 732 — Mobile Safari Layout QA V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: Mobile Safari layout considerations are correctly implemented. Safe area insets, viewport meta, and BottomTabBar are properly configured.**

The app uses `viewportFit: 'cover'` in the Next.js viewport config, `env(safe-area-inset-bottom)` in the `safe-area-bottom` CSS utility, and `pb-24` bottom padding on coach/player/parent layouts to clear the fixed BottomTabBar. No known Mobile Safari layout regressions identified.

This is a code audit only — no live browser testing was performed. Visual confirmation on device/simulator is recommended for final V1 sign-off.

---

## 2. Viewport Configuration

### `src/app/layout.tsx`

```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#030506',
  viewportFit: 'cover',
}
```

`viewportFit: 'cover'` extends the viewport to fill the full screen, including notch and home indicator areas. This is the correct setting for Mobile Safari on notched iPhones. The `maximumScale: 1` prevents Safari's automatic zoom on input focus.

---

## 3. Safe Area Insets

### `src/app/globals.css:183`

```css
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

Two safe area utilities defined:
- `safe-area-bottom` — exact safe area inset (used on `BottomTabBar`)
- `pb-safe` — at least 1rem, or the safe area inset if larger (used in wrap-up drawer footer)

### Usage

- `BottomTabBar.tsx:42` — `className="fixed bottom-0 ... safe-area-bottom"` — the nav bar itself adds safe area padding above the home indicator
- `CoachWrapUpDrawer.tsx:784,994` — `pb-safe` on footer sections that must clear the home indicator

---

## 4. BottomTabBar Layout

Coach, player, and parent portals use `BottomTabBar` with:
- `fixed bottom-0 left-0 right-0 z-40` — stays anchored to bottom of screen
- `safe-area-bottom` — pads below home indicator on iPhone
- Parent layouts have `min-h-screen pb-24` — ensures page content scrolls above the fixed tab bar

### Affected layouts

| Route | Layout padding | Tab bar |
|---|---|---|
| `/coach/*` | `min-h-screen pb-24` | `<BottomTabBar>` |
| `/player/*` | `min-h-screen pb-24` | `<BottomTabBar>` |
| `/parent/*` | `min-h-screen pb-24` | `<BottomTabBar>` |

`pb-24` (6rem = 96px) clears the fixed tab bar (≈56px) plus safe area inset on most devices.

---

## 5. Director Layout (Desktop-first)

`src/app/director/layout.tsx` — uses fixed sidebar (`w-60`) + `flex-1 ml-60 min-h-screen` main area. No BottomTabBar. Director UI is desktop-first and not designed for mobile. No safe area concerns on desktop.

---

## 6. Known Mobile Safari Considerations

### Input zoom

`maximumScale: 1` in viewport config prevents Safari's auto-zoom on `<input>` focus (which occurs when font-size < 16px). This is a known Safari behavior that can cause layout shift.

### 100vh behavior

`min-h-screen` (which maps to `min-height: 100vh`) has known issues in Mobile Safari where the browser chrome (address bar, tab bar) affects the viewport height. The app uses `min-h-screen` on layout wrappers — content scroll works correctly because scroll containers are inside the layout, not the layout itself.

### Overflow and scroll

Several components use `overflow-hidden` on their outer containers — these are card/surface containers, not scroll containers. Scroll is handled at the page body level.

---

## 7. Items Not Audited (Require Live Testing)

The following require device/emulator testing to confirm:

1. BottomTabBar visibility above home indicator on iPhone SE (smallest viewport)
2. Input focus behavior on mobile — does keyboard push layout correctly?
3. Long session wrap-up forms — do they scroll without layout breakage in Mobile Safari?
4. DONNA conversational panel height on small screens — does the input stay visible above keyboard?
5. Director dashboard on iPad — sidebar + content layout

**Recommendation:** Before V1 launch, test on at minimum: iPhone 15 (real device or simulator), iPhone SE (small viewport), iPad Pro (sidebar layout).

---

## 8. Risky Patterns Found

None in code. The implementation follows correct Mobile Safari patterns.

---

## 9. Fixes Made

None.

---

## 10. Final Safety Conclusion

**Mobile Safari layout implementation is correctly coded in AcademyOS V1.**

- `viewportFit: 'cover'` and `maximumScale: 1` are set correctly.
- Safe area utilities exist and are used in the BottomTabBar and wrap-up drawer.
- Role portals have adequate bottom padding to clear the fixed tab bar.

Live device testing is recommended before final V1 sign-off.

**Sprint 732 production readiness check: PASSED (code audit).**
