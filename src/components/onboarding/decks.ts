// Sprint 210 — Role-based first-run deck content
// Voice: premium, calm, human, confident, short.
//
// NOTE: SVG illustrations are inlined as string constants.
// Next.js 14 does not support the `?raw` import suffix without a
// custom webpack loader. The .svg files exist in ./illustrations/
// for reference; this file contains their content verbatim.

export type Slide = {
  illustration: string
  eyebrow: string
  title: string
  body: string
}

export type DeckData = {
  name: string
  slides: Slide[]
}

// ── Illustrations ─────────────────────────────────────────────

const directorOverview = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>An academy as a layered operating system</title>
  <g class="illo-grid"><line x1="40" y1="50" x2="360" y2="50"/><line x1="40" y1="120" x2="360" y2="120"/><line x1="40" y1="190" x2="360" y2="190"/></g>
  <text x="32" y="54" fill="var(--aos-text-dim)" font-size="9" text-anchor="end" letter-spacing="0.1em" font-family="inherit">PEOPLE</text>
  <text x="32" y="124" fill="var(--aos-text-dim)" font-size="9" text-anchor="end" letter-spacing="0.1em" font-family="inherit">CURRICULUM</text>
  <text x="32" y="194" fill="var(--aos-text-dim)" font-size="9" text-anchor="end" letter-spacing="0.1em" font-family="inherit">INTELLIGENCE</text>
  <g class="illo-stroke">
    <circle cx="100" cy="50" r="6" fill="var(--aos-bg)"/>
    <circle cx="160" cy="50" r="6" fill="var(--aos-bg)"/>
    <circle cx="220" cy="50" r="6" fill="var(--aos-bg)"/>
    <circle cx="280" cy="50" r="6" fill="var(--aos-bg)"/>
  </g>
  <g>
    <rect x="80" y="113" width="40" height="14" rx="2" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <rect x="130" y="113" width="60" height="14" rx="2" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <rect x="200" y="113" width="50" height="14" rx="2" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <rect x="260" y="113" width="60" height="14" rx="2" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
  </g>
  <g>
    <circle cx="100" cy="190" r="3" fill="var(--aos-accent)"/>
    <circle cx="160" cy="190" r="3" fill="var(--aos-accent)" class="illo-pulse"/>
    <circle cx="220" cy="190" r="3" fill="var(--aos-accent)"/>
    <circle cx="280" cy="190" r="3" fill="var(--aos-accent)" class="illo-pulse"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="0.75" stroke-dasharray="2 3" opacity="0.5" fill="none">
    <line x1="100" y1="56" x2="100" y2="187"/><line x1="160" y1="56" x2="160" y2="187"/>
    <line x1="220" y1="56" x2="220" y2="187"/><line x1="280" y1="56" x2="280" y2="187"/>
  </g>
  <g class="illo-stroke">
    <circle cx="56" cy="116" r="7" fill="var(--aos-bg)"/>
    <line x1="56" y1="123" x2="56" y2="148"/><line x1="56" y1="130" x2="46" y2="140"/>
    <line x1="56" y1="130" x2="66" y2="140"/><line x1="56" y1="148" x2="50" y2="162"/>
    <line x1="56" y1="148" x2="62" y2="162"/>
  </g>
  <circle cx="56" cy="116" r="2" class="illo-accent-fill"/>
</svg>`

const directorLoop = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>The academy operating loop</title>
  <g class="illo-stroke">
    <circle cx="200" cy="50" r="18" fill="var(--aos-surface)"/>
    <circle cx="310" cy="100" r="18" fill="var(--aos-surface)"/>
    <circle cx="310" cy="170" r="18" fill="var(--aos-surface)"/>
    <circle cx="200" cy="208" r="18" fill="var(--aos-surface)"/>
    <circle cx="90" cy="170" r="18" fill="var(--aos-surface)"/>
    <circle cx="90" cy="100" r="18" fill="var(--aos-surface)"/>
  </g>
  <g fill="var(--aos-text-muted)">
    <circle cx="200" cy="50" r="2.5"/><circle cx="310" cy="100" r="2.5"/>
    <circle cx="310" cy="170" r="2.5"/><circle cx="200" cy="208" r="2.5"/>
    <circle cx="90" cy="170" r="2.5"/><circle cx="90" cy="100" r="2.5"/>
  </g>
  <defs>
    <marker id="aLoopArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M2 1 L8 5 L2 9" fill="none" stroke="var(--aos-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <g stroke="var(--aos-accent)" stroke-width="1.25" fill="none" stroke-linecap="round" marker-end="url(#aLoopArrow)" opacity="0.85">
    <path d="M 218 56 Q 270 60 295 88"/><path d="M 314 122 Q 318 145 314 152"/>
    <path d="M 296 184 Q 270 205 222 207"/><path d="M 178 207 Q 130 205 104 184"/>
    <path d="M 86 152 Q 82 140 86 122"/><path d="M 105 88 Q 130 60 182 56"/>
  </g>
  <text x="200" y="125" fill="var(--aos-accent)" font-size="11" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">CLOSED LOOP</text>
  <text x="200" y="142" fill="var(--aos-text-dim)" font-size="9" text-anchor="middle" font-family="inherit">no information lost</text>
  <text x="200" y="34" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Plan</text>
  <text x="338" y="103" fill="var(--aos-text-muted)" font-size="10" text-anchor="start" font-family="inherit">Schedule</text>
  <text x="338" y="173" fill="var(--aos-text-muted)" font-size="10" text-anchor="start" font-family="inherit">Run</text>
  <text x="200" y="232" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Capture</text>
  <text x="62" y="173" fill="var(--aos-text-muted)" font-size="10" text-anchor="end" font-family="inherit">Learn</text>
  <text x="62" y="103" fill="var(--aos-text-muted)" font-size="10" text-anchor="end" font-family="inherit">Refine</text>
</svg>`

const directorRole = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Director's vantage point</title>
  <line x1="160" y1="120" x2="240" y2="120" stroke="var(--aos-accent)" stroke-width="2"/>
  <line x1="160" y1="120" x2="160" y2="128" class="illo-dim-stroke"/>
  <line x1="240" y1="120" x2="240" y2="128" class="illo-dim-stroke"/>
  <g class="illo-stroke">
    <circle cx="200" cy="74" r="9" fill="var(--aos-bg)"/>
    <line x1="200" y1="83" x2="200" y2="112"/><line x1="200" y1="92" x2="186" y2="102"/>
    <line x1="200" y1="92" x2="214" y2="102"/><line x1="200" y1="112" x2="192" y2="120"/>
    <line x1="200" y1="112" x2="208" y2="120"/>
  </g>
  <circle cx="200" cy="74" r="2.5" class="illo-accent-fill"/>
  <text x="200" y="56" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">YOU</text>
  <line x1="40" y1="210" x2="360" y2="210" class="illo-grid"/>
  <g class="illo-stroke-muted">
    <circle cx="90" cy="170" r="6" fill="var(--aos-bg)"/>
    <line x1="90" y1="176" x2="90" y2="196"/><line x1="90" y1="182" x2="80" y2="190"/>
    <line x1="90" y1="182" x2="100" y2="190"/><line x1="90" y1="196" x2="84" y2="208"/>
    <line x1="90" y1="196" x2="96" y2="208"/>
  </g>
  <text x="90" y="226" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Coach</text>
  <g class="illo-stroke-muted">
    <circle cx="200" cy="170" r="6" fill="var(--aos-bg)"/>
    <line x1="200" y1="176" x2="200" y2="196"/><line x1="200" y1="182" x2="190" y2="190"/>
    <line x1="200" y1="182" x2="210" y2="190"/><line x1="200" y1="196" x2="194" y2="208"/>
    <line x1="200" y1="196" x2="206" y2="208"/>
  </g>
  <text x="200" y="226" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Player</text>
  <g class="illo-stroke-muted">
    <circle cx="310" cy="170" r="6" fill="var(--aos-bg)"/>
    <line x1="310" y1="176" x2="310" y2="196"/><line x1="310" y1="182" x2="300" y2="190"/>
    <line x1="310" y1="182" x2="320" y2="190"/><line x1="310" y1="196" x2="304" y2="208"/>
    <line x1="310" y1="196" x2="316" y2="208"/>
  </g>
  <text x="310" y="226" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Parent</text>
  <g stroke="var(--aos-accent)" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.5" fill="none">
    <line x1="195" y1="82" x2="95" y2="166"/>
    <line x1="200" y1="84" x2="200" y2="164"/>
    <line x1="205" y1="82" x2="305" y2="166"/>
  </g>
</svg>`

const directorSetup = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Setup creates the academy structure</title>
  <rect x="40" y="60" width="120" height="140" rx="8" class="illo-dim-stroke" fill="var(--aos-surface-2)" stroke-dasharray="3 3"/>
  <text x="100" y="135" fill="var(--aos-text-dim)" font-size="10" text-anchor="middle" font-family="inherit" font-style="italic">empty</text>
  <g stroke="var(--aos-accent)" stroke-width="1.25" fill="none" stroke-linecap="round">
    <line x1="172" y1="130" x2="218" y2="130"/>
    <path d="M 212 124 L 218 130 L 212 136"/>
  </g>
  <rect x="230" y="60" width="130" height="140" rx="8" class="illo-stroke" fill="var(--aos-surface)"/>
  <g>
    <rect x="244" y="74" width="44" height="20" rx="3" class="illo-dim-stroke" fill="var(--aos-bg)"/>
    <circle cx="252" cy="84" r="1.5" class="illo-accent-fill"/>
    <line x1="259" y1="84" x2="282" y2="84" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="302" y="74" width="44" height="20" rx="3" class="illo-dim-stroke" fill="var(--aos-bg)"/>
    <circle cx="310" cy="84" r="1.5" class="illo-accent-fill"/>
    <line x1="317" y1="84" x2="340" y2="84" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="244" y="106" width="44" height="20" rx="3" class="illo-dim-stroke" fill="var(--aos-bg)"/>
    <circle cx="252" cy="116" r="1.5" class="illo-accent-fill"/>
    <line x1="259" y1="116" x2="282" y2="116" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="302" y="106" width="44" height="20" rx="3" class="illo-dim-stroke" fill="var(--aos-bg)"/>
    <circle cx="310" cy="116" r="1.5" class="illo-accent-fill"/>
    <line x1="317" y1="116" x2="340" y2="116" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="244" y="138" width="44" height="20" rx="3" class="illo-dim-stroke" fill="var(--aos-bg)"/>
    <circle cx="252" cy="148" r="1.5" class="illo-accent-fill"/>
    <line x1="259" y1="148" x2="282" y2="148" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="302" y="138" width="44" height="20" rx="3" class="illo-dim-stroke" fill="var(--aos-bg)"/>
    <circle cx="310" cy="148" r="1.5" class="illo-accent-fill"/>
    <line x1="317" y1="148" x2="340" y2="148" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="244" y="170" width="102" height="16" rx="3" stroke="var(--aos-accent)" stroke-width="0.5" fill="var(--aos-accent-soft)"/>
    <text x="295" y="181" fill="var(--aos-accent)" font-size="8" text-anchor="middle" letter-spacing="0.1em" font-family="inherit">FOUNDATION</text>
  </g>
  <g class="illo-stroke">
    <circle cx="180" cy="195" r="6" fill="var(--aos-bg)"/>
    <line x1="180" y1="201" x2="180" y2="218"/>
    <line x1="180" y1="206" x2="190" y2="212"/>
    <line x1="180" y1="206" x2="170" y2="212"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="1" fill="none">
    <circle cx="193" cy="212" r="3.5" fill="var(--aos-bg)"/>
    <line x1="190" y1="212" x2="196" y2="212"/>
    <line x1="193" y1="209" x2="193" y2="215"/>
  </g>
  <text x="100" y="46" fill="var(--aos-text-dim)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">BEFORE</text>
  <text x="295" y="46" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">AFTER SETUP</text>
</svg>`

const directorReady = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Ready to begin</title>
  <line x1="40" y1="200" x2="360" y2="200" stroke="var(--aos-border-strong)" stroke-width="1"/>
  <g fill="var(--aos-accent)">
    <circle cx="100" cy="195" r="2" opacity="0.4"/>
    <circle cx="130" cy="180" r="2.2" opacity="0.55"/>
    <circle cx="160" cy="160" r="2.4" opacity="0.7"/>
    <circle cx="195" cy="135" r="2.6" opacity="0.85"/>
    <circle cx="235" cy="105" r="2.8" opacity="0.95"/>
    <circle cx="280" cy="72" r="3.2"/>
    <circle cx="330" cy="40" r="3.6" class="illo-pulse"/>
  </g>
  <path d="M 100 195 Q 180 180 235 105 T 330 40" stroke="var(--aos-accent)" stroke-width="0.5" stroke-dasharray="1 3" fill="none" opacity="0.4"/>
  <g class="illo-stroke">
    <circle cx="80" cy="172" r="7" fill="var(--aos-bg)"/>
    <line x1="80" y1="179" x2="80" y2="200"/>
    <line x1="80" y1="186" x2="70" y2="194"/>
    <line x1="80" y1="186" x2="90" y2="194"/>
  </g>
  <circle cx="80" cy="172" r="2" class="illo-accent-fill"/>
  <g class="illo-grid" stroke-dasharray="2 6">
    <line x1="40" y1="215" x2="360" y2="215"/>
  </g>
</svg>`

const coachReceive = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Session plans flow to coach</title>
  <g class="illo-stroke-muted">
    <circle cx="60" cy="120" r="14" fill="var(--aos-surface)"/>
    <circle cx="60" cy="120" r="3" fill="var(--aos-text-dim)"/>
  </g>
  <text x="60" y="156" fill="var(--aos-text-dim)" font-size="9" text-anchor="middle" letter-spacing="0.1em" font-family="inherit">DIRECTOR</text>
  <path d="M 80 120 Q 200 80 320 120" stroke="var(--aos-border-strong)" stroke-width="1" fill="none" stroke-dasharray="2 4"/>
  <g transform="translate(190, 88)">
    <rect x="-14" y="-16" width="28" height="32" rx="2" fill="var(--aos-surface)" stroke="var(--aos-accent)" stroke-width="1"/>
    <line x1="-9" y1="-9" x2="9" y2="-9" stroke="var(--aos-accent)" stroke-width="0.75"/>
    <line x1="-9" y1="-4" x2="6" y2="-4" stroke="var(--aos-accent)" stroke-width="0.5" opacity="0.7"/>
    <line x1="-9" y1="1" x2="6" y2="1" stroke="var(--aos-accent)" stroke-width="0.5" opacity="0.7"/>
    <line x1="-9" y1="6" x2="3" y2="6" stroke="var(--aos-accent)" stroke-width="0.5" opacity="0.7"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="0.75" fill="none" opacity="0.5">
    <path d="M 150 95 Q 165 90 175 90"/>
    <path d="M 145 102 Q 160 97 170 97"/>
  </g>
  <g class="illo-stroke">
    <circle cx="320" cy="120" r="9" fill="var(--aos-bg)"/>
    <line x1="320" y1="129" x2="320" y2="160"/><line x1="320" y1="138" x2="306" y2="148"/>
    <line x1="320" y1="138" x2="334" y2="148"/><line x1="320" y1="160" x2="312" y2="178"/>
    <line x1="320" y1="160" x2="328" y2="178"/>
  </g>
  <circle cx="320" cy="120" r="2.5" class="illo-accent-fill"/>
  <text x="320" y="200" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">YOU</text>
</svg>`

const coachSession = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Running a session in blocks</title>
  <rect x="100" y="40" width="200" height="170" rx="8" class="illo-stroke" fill="var(--aos-surface)"/>
  <line x1="100" y1="64" x2="300" y2="64" stroke="var(--aos-border)" stroke-width="0.5"/>
  <circle cx="116" cy="52" r="3" class="illo-accent-fill"/>
  <line x1="126" y1="52" x2="180" y2="52" stroke="var(--aos-text)" stroke-width="0.75"/>
  <text x="284" y="55" fill="var(--aos-text-dim)" font-size="9" text-anchor="end" font-family="inherit">75 min</text>
  <g>
    <rect x="112" y="76" width="176" height="20" rx="3" fill="var(--aos-accent-soft)" stroke="var(--aos-accent)" stroke-width="0.75"/>
    <circle cx="122" cy="86" r="3" class="illo-accent-fill"/>
    <path d="M 120 86 L 122 88 L 125 84" stroke="var(--aos-bg)" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="134" y1="86" x2="200" y2="86" stroke="var(--aos-accent)" stroke-width="0.5"/>
    <rect x="112" y="102" width="176" height="20" rx="3" fill="var(--aos-accent-soft)" stroke="var(--aos-accent)" stroke-width="0.75"/>
    <circle cx="122" cy="112" r="3" class="illo-accent-fill"/>
    <path d="M 120 112 L 122 114 L 125 110" stroke="var(--aos-bg)" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="134" y1="112" x2="210" y2="112" stroke="var(--aos-accent)" stroke-width="0.5"/>
    <rect x="112" y="128" width="176" height="20" rx="3" fill="var(--aos-surface-2)" stroke="var(--aos-accent)" stroke-width="1.25"/>
    <circle cx="122" cy="138" r="3.5" stroke="var(--aos-accent)" stroke-width="1" fill="var(--aos-bg)"/>
    <circle cx="122" cy="138" r="1.5" class="illo-accent-fill illo-pulse"/>
    <line x1="134" y1="138" x2="220" y2="138" stroke="var(--aos-text)" stroke-width="0.75"/>
    <rect x="262" y="133" width="22" height="10" rx="2" fill="var(--aos-accent)"/>
    <text x="273" y="141" fill="var(--aos-bg)" font-size="7" text-anchor="middle" letter-spacing="0.05em" font-family="inherit" font-weight="500">NOW</text>
    <rect x="112" y="154" width="176" height="20" rx="3" fill="var(--aos-bg)" stroke="var(--aos-border)" stroke-width="0.75"/>
    <circle cx="122" cy="164" r="3" fill="none" stroke="var(--aos-text-dim)" stroke-width="0.75"/>
    <line x1="134" y1="164" x2="190" y2="164" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="112" y="180" width="176" height="20" rx="3" fill="var(--aos-bg)" stroke="var(--aos-border)" stroke-width="0.75"/>
    <circle cx="122" cy="190" r="3" fill="none" stroke="var(--aos-text-dim)" stroke-width="0.75"/>
    <line x1="134" y1="190" x2="180" y2="190" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
  </g>
</svg>`

const coachWrapup = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Wrap-up captures the session</title>
  <g transform="translate(120, 120)">
    <rect x="-12" y="-22" width="24" height="34" rx="12" class="illo-stroke" fill="var(--aos-surface)"/>
    <path d="M -16 4 Q -16 18 0 18 Q 16 18 16 4" class="illo-stroke"/>
    <line x1="0" y1="18" x2="0" y2="28" class="illo-stroke"/>
    <line x1="-7" y1="28" x2="7" y2="28" class="illo-stroke"/>
    <circle cx="0" cy="-22" r="3" class="illo-accent-fill illo-pulse"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="1.25" fill="none" stroke-linecap="round">
    <path d="M 144 100 Q 156 110 156 120 Q 156 130 144 140" opacity="0.7"/>
    <path d="M 156 88 Q 174 104 174 120 Q 174 136 156 152" opacity="0.5"/>
    <path d="M 168 76 Q 192 98 192 120 Q 192 142 168 164" opacity="0.3"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="0.75" stroke-dasharray="2 3" fill="none" opacity="0.55">
    <path d="M 204 110 L 248 70"/>
    <path d="M 204 120 L 248 120"/>
    <path d="M 204 130 L 248 170"/>
  </g>
  <g>
    <rect x="252" y="58" width="98" height="26" rx="3" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <circle cx="262" cy="71" r="2" class="illo-accent-fill"/>
    <text x="272" y="74" fill="var(--aos-text)" font-size="9" font-family="inherit">Player profile</text>
    <rect x="252" y="108" width="98" height="26" rx="3" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <circle cx="262" cy="121" r="2" class="illo-accent-fill"/>
    <text x="272" y="124" fill="var(--aos-text)" font-size="9" font-family="inherit">Director feed</text>
    <rect x="252" y="158" width="98" height="26" rx="3" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <circle cx="262" cy="171" r="2" class="illo-accent-fill"/>
    <text x="272" y="174" fill="var(--aos-text)" font-size="9" font-family="inherit">Parent draft</text>
  </g>
  <text x="120" y="180" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">SPEAK</text>
</svg>`

const coachVisibility = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Director sees your work</title>
  <g class="illo-stroke">
    <circle cx="80" cy="160" r="8" fill="var(--aos-bg)"/>
    <line x1="80" y1="168" x2="80" y2="195"/><line x1="80" y1="176" x2="68" y2="186"/>
    <line x1="80" y1="176" x2="92" y2="186"/><line x1="80" y1="195" x2="74" y2="210"/>
    <line x1="80" y1="195" x2="86" y2="210"/>
  </g>
  <g>
    <rect x="110" y="155" width="80" height="42" rx="3" class="illo-dim-stroke" fill="var(--aos-surface)"/>
    <circle cx="120" cy="167" r="2" class="illo-accent-fill"/>
    <line x1="128" y1="167" x2="180" y2="167" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <line x1="118" y1="178" x2="180" y2="178" stroke="var(--aos-text-dim)" stroke-width="0.5" opacity="0.6"/>
    <line x1="118" y1="188" x2="170" y2="188" stroke="var(--aos-text-dim)" stroke-width="0.5" opacity="0.6"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="0.75" stroke-dasharray="2 3" fill="none" opacity="0.55">
    <path d="M 150 150 Q 180 110 220 70"/>
    <path d="M 250 200 Q 240 140 230 80"/>
    <path d="M 320 170 Q 280 130 240 80"/>
  </g>
  <g class="illo-stroke-muted" opacity="0.5">
    <circle cx="250" cy="200" r="5" fill="var(--aos-bg)"/>
    <line x1="250" y1="205" x2="250" y2="222"/>
  </g>
  <g class="illo-stroke-muted" opacity="0.5">
    <circle cx="320" cy="170" r="5" fill="var(--aos-bg)"/>
    <line x1="320" y1="175" x2="320" y2="192"/>
  </g>
  <g>
    <rect x="190" y="40" width="90" height="40" rx="6" class="illo-stroke" fill="var(--aos-surface)"/>
    <circle cx="202" cy="60" r="2.5" class="illo-accent-fill"/>
    <line x1="212" y1="55" x2="268" y2="55" stroke="var(--aos-text)" stroke-width="0.5"/>
    <line x1="212" y1="63" x2="260" y2="63" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <line x1="212" y1="71" x2="252" y2="71" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
  </g>
  <text x="235" y="32" fill="var(--aos-text-dim)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">DIRECTOR VIEW</text>
</svg>`

const coachAmplified = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Coach amplified, not replaced</title>
  <g fill="none">
    <circle cx="200" cy="120" r="40" stroke="var(--aos-accent)" stroke-width="1" opacity="0.9"/>
    <circle cx="200" cy="120" r="65" stroke="var(--aos-accent)" stroke-width="0.75" opacity="0.55"/>
    <circle cx="200" cy="120" r="90" stroke="var(--aos-accent)" stroke-width="0.5" opacity="0.3"/>
  </g>
  <g class="illo-stroke">
    <circle cx="200" cy="105" r="9" fill="var(--aos-bg)"/>
    <line x1="200" y1="114" x2="200" y2="140"/><line x1="200" y1="122" x2="186" y2="132"/>
    <line x1="200" y1="122" x2="214" y2="132"/><line x1="200" y1="140" x2="192" y2="152"/>
    <line x1="200" y1="140" x2="208" y2="152"/>
  </g>
  <circle cx="200" cy="105" r="2.5" class="illo-accent-fill"/>
  <g class="illo-stroke-muted" opacity="0.6">
    <circle cx="290" cy="120" r="4" fill="var(--aos-bg)"/>
    <line x1="290" y1="124" x2="290" y2="138"/>
    <circle cx="110" cy="120" r="4" fill="var(--aos-bg)"/>
    <line x1="110" y1="124" x2="110" y2="138"/>
    <circle cx="200" cy="30" r="4" fill="var(--aos-bg)"/>
    <line x1="200" y1="34" x2="200" y2="48"/>
    <circle cx="200" cy="210" r="4" fill="var(--aos-bg)"/>
    <line x1="200" y1="214" x2="200" y2="228"/>
  </g>
</svg>`

const playerPath = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Your development path</title>
  <line x1="50" y1="160" x2="350" y2="160" stroke="var(--aos-border)" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="200" y2="160" stroke="var(--aos-accent)" stroke-width="1.5"/>
  <g>
    <circle cx="50" cy="160" r="8" fill="var(--aos-bg)" stroke="var(--aos-red)" stroke-width="1.5"/>
    <circle cx="50" cy="160" r="3" fill="var(--aos-red)"/>
    <text x="50" y="184" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Stage 1</text>
    <circle cx="125" cy="160" r="8" fill="var(--aos-bg)" stroke="var(--aos-orange)" stroke-width="1.5"/>
    <circle cx="125" cy="160" r="3" fill="var(--aos-orange)"/>
    <text x="125" y="184" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" font-family="inherit">Stage 2</text>
    <circle cx="200" cy="160" r="12" fill="var(--aos-bg)" stroke="var(--aos-accent)" stroke-width="2"/>
    <circle cx="200" cy="160" r="5" fill="var(--aos-accent)"/>
    <text x="200" y="190" fill="var(--aos-accent)" font-size="10" text-anchor="middle" font-family="inherit" font-weight="500" letter-spacing="0.05em">YOU · STAGE 3</text>
    <circle cx="275" cy="160" r="8" fill="var(--aos-bg)" stroke="var(--aos-border-strong)" stroke-width="1.5"/>
    <circle cx="275" cy="160" r="3" fill="var(--aos-border-strong)"/>
    <text x="275" y="184" fill="var(--aos-text-dim)" font-size="10" text-anchor="middle" font-family="inherit">Stage 4</text>
    <circle cx="350" cy="160" r="8" fill="var(--aos-bg)" stroke="var(--aos-border-strong)" stroke-width="1.5"/>
    <circle cx="350" cy="160" r="3" fill="var(--aos-border-strong)"/>
    <text x="350" y="184" fill="var(--aos-text-dim)" font-size="10" text-anchor="middle" font-family="inherit">Stage 5</text>
  </g>
  <g class="illo-stroke">
    <circle cx="200" cy="108" r="8" fill="var(--aos-bg)"/>
    <line x1="200" y1="116" x2="200" y2="142"/>
    <line x1="200" y1="124" x2="188" y2="134"/>
    <line x1="200" y1="124" x2="212" y2="134"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7">
    <line x1="200" y1="78" x2="200" y2="62"/>
    <path d="M 195 68 L 200 62 L 205 68"/>
  </g>
</svg>`

const playerGates = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Gates earned with evidence</title>
  <circle cx="200" cy="50" r="14" fill="var(--aos-bg)" stroke="var(--aos-accent)" stroke-width="1.5"/>
  <circle cx="200" cy="50" r="5" class="illo-accent-fill"/>
  <text x="200" y="28" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">NEXT STAGE</text>
  <line x1="200" y1="64" x2="200" y2="90" stroke="var(--aos-accent)" stroke-width="1.25"/>
  <rect x="100" y="92" width="200" height="116" rx="8" class="illo-stroke" fill="var(--aos-surface)"/>
  <text x="200" y="112" fill="var(--aos-text-muted)" font-size="10" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">YOUR NEXT MISSION</text>
  <g>
    <circle cx="120" cy="138" r="6" fill="var(--aos-accent)" stroke="var(--aos-accent)"/>
    <path d="M 117 138 L 119 140 L 123 136" stroke="var(--aos-bg)" stroke-width="1.25" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="134" y1="138" x2="270" y2="138" stroke="var(--aos-text)" stroke-width="0.75"/>
    <circle cx="120" cy="162" r="6" fill="var(--aos-accent)" stroke="var(--aos-accent)"/>
    <path d="M 117 162 L 119 164 L 123 160" stroke="var(--aos-bg)" stroke-width="1.25" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="134" y1="162" x2="262" y2="162" stroke="var(--aos-text)" stroke-width="0.75"/>
    <circle cx="120" cy="186" r="6" fill="var(--aos-bg)" stroke="var(--aos-accent)" stroke-width="1"/>
    <circle cx="120" cy="186" r="2" class="illo-accent-fill illo-pulse"/>
    <line x1="134" y1="186" x2="240" y2="186" stroke="var(--aos-text-muted)" stroke-width="0.75"/>
  </g>
</svg>`

const playerAssessment = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Assessed across multiple dimensions</title>
  <g class="illo-grid" fill="none">
    <polygon points="200,60 274,108 246,194 154,194 126,108"/>
    <polygon points="200,84 251,118 232,178 168,178 149,118"/>
    <polygon points="200,108 228,128 218,160 182,160 172,128"/>
  </g>
  <g class="illo-grid">
    <line x1="200" y1="120" x2="200" y2="60"/>
    <line x1="200" y1="120" x2="274" y2="108"/>
    <line x1="200" y1="120" x2="246" y2="194"/>
    <line x1="200" y1="120" x2="154" y2="194"/>
    <line x1="200" y1="120" x2="126" y2="108"/>
  </g>
  <polygon points="200,72 258,114 232,178 168,170 146,114" fill="var(--aos-accent-soft)" stroke="var(--aos-accent)" stroke-width="1.25"/>
  <g fill="var(--aos-accent)">
    <circle cx="200" cy="72" r="3"/><circle cx="258" cy="114" r="3"/>
    <circle cx="232" cy="178" r="3"/><circle cx="168" cy="170" r="3"/>
    <circle cx="146" cy="114" r="3"/>
  </g>
  <g fill="var(--aos-text-muted)" font-size="10" font-family="inherit">
    <text x="200" y="50" text-anchor="middle">Technical</text>
    <text x="296" y="110" text-anchor="middle">Tactical</text>
    <text x="262" y="212" text-anchor="middle">Physical</text>
    <text x="138" y="212" text-anchor="middle">Mental</text>
    <text x="104" y="110" text-anchor="middle">Movement</text>
  </g>
</svg>`

const playerTrust = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Coach and system reading you accurately</title>
  <g class="illo-stroke">
    <circle cx="250" cy="110" r="10" fill="var(--aos-bg)"/>
    <line x1="250" y1="120" x2="250" y2="160"/><line x1="250" y1="130" x2="234" y2="142"/>
    <line x1="250" y1="130" x2="266" y2="142"/><line x1="250" y1="160" x2="240" y2="180"/>
    <line x1="250" y1="160" x2="260" y2="180"/>
  </g>
  <g fill="none" stroke="var(--aos-accent)" stroke-linecap="round">
    <path d="M 220 130 Q 250 80 280 130" stroke-width="1" opacity="0.8"/>
    <path d="M 208 138 Q 250 70 292 138" stroke-width="0.75" opacity="0.5"/>
    <path d="M 196 146 Q 250 60 304 146" stroke-width="0.5" opacity="0.3"/>
  </g>
  <g class="illo-accent-fill" opacity="0.7">
    <circle cx="220" cy="100" r="1.5"/><circle cx="285" cy="105" r="1.5"/>
    <circle cx="240" cy="80" r="1.5"/><circle cx="265" cy="90" r="1.5"/>
  </g>
  <g class="illo-stroke-muted">
    <circle cx="110" cy="130" r="8" fill="var(--aos-bg)"/>
    <line x1="110" y1="138" x2="110" y2="170"/><line x1="110" y1="146" x2="98" y2="156"/>
    <line x1="110" y1="146" x2="122" y2="156"/><line x1="110" y1="170" x2="104" y2="186"/>
    <line x1="110" y1="170" x2="116" y2="186"/>
  </g>
  <text x="110" y="206" fill="var(--aos-text-muted)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">COACH</text>
  <text x="250" y="206" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">YOU</text>
  <line x1="120" y1="128" x2="238" y2="116" stroke="var(--aos-accent)" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.5"/>
</svg>`

const parentReceive = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Updates arrive on a regular cadence</title>
  <g class="illo-stroke">
    <circle cx="90" cy="105" r="9" fill="var(--aos-bg)"/>
    <line x1="90" y1="114" x2="90" y2="148"/><line x1="90" y1="124" x2="76" y2="136"/>
    <line x1="90" y1="124" x2="104" y2="136"/><line x1="90" y1="148" x2="82" y2="170"/>
    <line x1="90" y1="148" x2="98" y2="170"/>
  </g>
  <circle cx="90" cy="105" r="2.5" class="illo-accent-fill"/>
  <text x="90" y="196" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">YOU</text>
  <g>
    <rect x="180" y="40" width="180" height="50" rx="5" class="illo-stroke" fill="var(--aos-surface)"/>
    <circle cx="194" cy="56" r="3" class="illo-accent-fill"/>
    <line x1="204" y1="56" x2="280" y2="56" stroke="var(--aos-text)" stroke-width="0.5"/>
    <line x1="192" y1="68" x2="340" y2="68" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <line x1="192" y1="78" x2="320" y2="78" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="180" y="98" width="180" height="50" rx="5" class="illo-stroke" fill="var(--aos-surface)"/>
    <circle cx="194" cy="114" r="3" class="illo-accent-fill"/>
    <line x1="204" y1="114" x2="280" y2="114" stroke="var(--aos-text)" stroke-width="0.5"/>
    <line x1="192" y1="126" x2="340" y2="126" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <line x1="192" y1="136" x2="310" y2="136" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <rect x="180" y="156" width="180" height="50" rx="5" class="illo-stroke" fill="var(--aos-surface)"/>
    <circle cx="194" cy="172" r="3" class="illo-accent-fill"/>
    <line x1="204" y1="172" x2="280" y2="172" stroke="var(--aos-text)" stroke-width="0.5"/>
    <line x1="192" y1="184" x2="340" y2="184" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
    <line x1="192" y1="194" x2="320" y2="194" stroke="var(--aos-text-dim)" stroke-width="0.5"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="0.75" stroke-dasharray="2 3" fill="none" opacity="0.5">
    <line x1="170" y1="120" x2="116" y2="120"/>
    <path d="M 122 115 L 116 120 L 122 125"/>
  </g>
</svg>`

const parentValve = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>A filtering valve between coach and parent</title>
  <g>
    <rect x="40" y="80" width="100" height="80" rx="6" class="illo-dim-stroke" fill="var(--aos-surface-2)" stroke-dasharray="2 3"/>
    <text x="90" y="65" fill="var(--aos-text-dim)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">COACH NOTES</text>
    <g stroke="var(--aos-text-dim)" stroke-width="0.5" fill="none" stroke-linecap="round">
      <path d="M 52 96 Q 60 92 70 96 T 90 96 T 110 96 T 128 96"/>
      <path d="M 52 108 Q 60 104 70 108 T 90 108 T 110 108 T 128 108"/>
      <path d="M 52 120 Q 60 116 70 120 T 90 120 T 110 120"/>
      <path d="M 52 132 Q 60 128 70 132 T 90 132 T 110 132 T 128 132"/>
      <path d="M 52 144 Q 60 140 70 144 T 90 144 T 105 144"/>
    </g>
  </g>
  <g>
    <path d="M 152 90 L 200 120 L 152 150 Z" class="illo-stroke" fill="var(--aos-surface)"/>
    <path d="M 248 90 L 200 120 L 248 150 Z" class="illo-stroke" fill="var(--aos-surface)"/>
    <circle cx="200" cy="120" r="14" fill="var(--aos-bg)" stroke="var(--aos-accent)" stroke-width="1.5"/>
    <line x1="190" y1="120" x2="210" y2="120" stroke="var(--aos-accent)" stroke-width="1.25"/>
  </g>
  <text x="200" y="180" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">DIRECTOR APPROVES</text>
  <g>
    <rect x="260" y="80" width="100" height="80" rx="6" class="illo-stroke" fill="var(--aos-surface)"/>
    <text x="310" y="65" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">TO YOU</text>
    <g stroke="var(--aos-text)" stroke-width="0.5">
      <line x1="272" y1="96" x2="348" y2="96"/>
      <line x1="272" y1="108" x2="338" y2="108" opacity="0.7"/>
      <line x1="272" y1="120" x2="344" y2="120" opacity="0.7"/>
      <line x1="272" y1="132" x2="330" y2="132" opacity="0.7"/>
      <line x1="272" y1="144" x2="340" y2="144" opacity="0.7"/>
    </g>
  </g>
</svg>`

const parentPrivate = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>What parents see and what stays internal</title>
  <g>
    <rect x="50" y="50" width="140" height="160" rx="8" class="illo-stroke" fill="var(--aos-surface)"/>
    <circle cx="65" cy="68" r="3" class="illo-accent-fill"/>
    <text x="80" y="72" fill="var(--aos-accent)" font-size="10" letter-spacing="0.1em" font-family="inherit" font-weight="500">SHARED</text>
    <g stroke="var(--aos-text)" stroke-width="0.5">
      <line x1="62" y1="92" x2="178" y2="92"/>
      <line x1="62" y1="104" x2="170" y2="104" opacity="0.7"/>
      <line x1="62" y1="116" x2="178" y2="116" opacity="0.7"/>
      <line x1="62" y1="140" x2="178" y2="140"/>
      <line x1="62" y1="152" x2="160" y2="152" opacity="0.7"/>
      <line x1="62" y1="164" x2="174" y2="164" opacity="0.7"/>
    </g>
    <text x="120" y="194" fill="var(--aos-text-muted)" font-size="9" text-anchor="middle" font-family="inherit">progress · highlights · milestones</text>
  </g>
  <g>
    <rect x="210" y="50" width="140" height="160" rx="8" class="illo-dim-stroke" fill="var(--aos-surface-2)"/>
    <g transform="translate(225, 64)">
      <rect x="-3" y="-1" width="6" height="6" rx="1" stroke="var(--aos-text-dim)" stroke-width="1" fill="none"/>
      <path d="M -2 -1 L -2 -4 Q -2 -7 0 -7 Q 2 -7 2 -4 L 2 -1" stroke="var(--aos-text-dim)" stroke-width="1" fill="none"/>
    </g>
    <text x="240" y="72" fill="var(--aos-text-dim)" font-size="10" letter-spacing="0.1em" font-family="inherit">COACHING TEAM</text>
    <g>
      <rect x="222" y="86" width="116" height="6" fill="var(--aos-text-dim)" opacity="0.25"/>
      <rect x="222" y="98" width="106" height="6" fill="var(--aos-text-dim)" opacity="0.25"/>
      <rect x="222" y="110" width="116" height="6" fill="var(--aos-text-dim)" opacity="0.25"/>
      <rect x="222" y="134" width="116" height="6" fill="var(--aos-text-dim)" opacity="0.25"/>
      <rect x="222" y="146" width="96" height="6" fill="var(--aos-text-dim)" opacity="0.25"/>
      <rect x="222" y="158" width="116" height="6" fill="var(--aos-text-dim)" opacity="0.25"/>
    </g>
    <text x="280" y="194" fill="var(--aos-text-dim)" font-size="9" text-anchor="middle" font-family="inherit">coach notes · diagnoses</text>
  </g>
</svg>`

const parentAsk = `<svg viewBox="0 0 400 240" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Asking questions through the right channel</title>
  <g class="illo-stroke">
    <circle cx="70" cy="110" r="9" fill="var(--aos-bg)"/>
    <line x1="70" y1="119" x2="70" y2="150"/><line x1="70" y1="128" x2="58" y2="138"/>
    <line x1="70" y1="128" x2="82" y2="138"/><line x1="70" y1="150" x2="64" y2="170"/>
    <line x1="70" y1="150" x2="76" y2="170"/>
  </g>
  <circle cx="70" cy="110" r="2.5" class="illo-accent-fill"/>
  <g class="illo-stroke">
    <rect x="100" y="70" width="80" height="36" rx="6" fill="var(--aos-surface)"/>
    <path d="M 112 106 L 108 116 L 122 106 Z" fill="var(--aos-surface)" stroke="var(--aos-text)"/>
  </g>
  <g stroke="var(--aos-text)" stroke-width="0.5">
    <line x1="112" y1="84" x2="168" y2="84"/>
    <line x1="112" y1="94" x2="158" y2="94" opacity="0.7"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="1" fill="none" stroke-linecap="round">
    <line x1="190" y1="120" x2="218" y2="120"/>
    <path d="M 212 114 L 218 120 L 212 126"/>
  </g>
  <g>
    <circle cx="238" cy="120" r="14" fill="var(--aos-surface)" stroke="var(--aos-accent)" stroke-width="1.25"/>
    <circle cx="238" cy="120" r="3" class="illo-accent-fill"/>
  </g>
  <g stroke="var(--aos-accent)" stroke-width="1" fill="none" stroke-linecap="round">
    <line x1="258" y1="120" x2="286" y2="120"/>
    <path d="M 280 114 L 286 120 L 280 126"/>
  </g>
  <g class="illo-stroke-muted">
    <circle cx="320" cy="110" r="8" fill="var(--aos-bg)"/>
    <line x1="320" y1="118" x2="320" y2="148"/><line x1="320" y1="126" x2="310" y2="136"/>
    <line x1="320" y1="126" x2="330" y2="136"/><line x1="320" y1="148" x2="314" y2="166"/>
    <line x1="320" y1="148" x2="326" y2="166"/>
  </g>
  <text x="70" y="196" fill="var(--aos-accent)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit" font-weight="500">YOU</text>
  <text x="238" y="196" fill="var(--aos-text-muted)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">ROUTED</text>
  <text x="320" y="196" fill="var(--aos-text-muted)" font-size="9" text-anchor="middle" letter-spacing="0.15em" font-family="inherit">DIRECTOR</text>
</svg>`

// ── Deck definitions ──────────────────────────────────────────

export const DECKS: Record<'director' | 'coach' | 'player' | 'parent', DeckData> = {
  director: {
    name: 'Director · first run',
    slides: [
      {
        illustration: directorOverview,
        eyebrow: 'Welcome, Director',
        title: 'See your academy clearly.',
        body: 'Players, coaches, curriculum, sessions, and priorities — all in one view. You always know what needs your attention.',
      },
      {
        illustration: directorLoop,
        eyebrow: 'One standard',
        title: 'Build it once. Use it everywhere.',
        body: 'Define how your academy teaches, then run it across classes, coaches, and levels. Less explaining. More consistency.',
      },
      {
        illustration: directorRole,
        eyebrow: 'Coach alignment',
        title: 'Everyone walks onto court with the plan.',
        body: "Coaches know the focus, the blocks, and what to watch for before class starts. You don't have to chase clarity.",
      },
      {
        illustration: directorSetup,
        eyebrow: 'What needs attention',
        title: 'The important things rise to the top.',
        body: 'Placements, progress, coach notes, and review items surface where you can act on them — not buried in a feed.',
      },
      {
        illustration: directorReady,
        eyebrow: 'Start simple',
        title: 'Begin with one class.',
        body: 'One group. One template. One session. The system gets stronger every time your academy uses it.',
      },
    ],
  },
  coach: {
    name: 'Coach · first run',
    slides: [
      {
        illustration: coachReceive,
        eyebrow: 'Welcome, Coach',
        title: 'Your session is ready before you step on court.',
        body: 'The plan, the focus, and the flow of class — already in one place. Less organizing. More coaching.',
      },
      {
        illustration: coachSession,
        eyebrow: 'On court',
        title: 'Follow the blocks. Coach the players.',
        body: 'Warm-up, skill work, games, points, and review stay organized for you. Eyes on the players, not on paperwork.',
      },
      {
        illustration: coachWrapup,
        eyebrow: 'After class',
        title: 'Speak the recap. Keep moving.',
        body: 'Just say what happened — who stood out, who needs help, what changed. No forms, no typing.',
      },
      {
        illustration: coachVisibility,
        eyebrow: 'Your observations matter',
        title: 'Your notes help the whole academy improve.',
        body: 'A quick recap updates player profiles, informs the director, and shapes better sessions next time.',
      },
      {
        illustration: coachAmplified,
        eyebrow: 'Coaching amplified',
        title: "This protects your coaching — it doesn't replace it.",
        body: 'You observe, adjust, communicate, develop. Academy OS keeps everything you notice from getting lost.',
      },
    ],
  },
  player: {
    name: 'Player · first run',
    slides: [
      {
        illustration: playerPath,
        eyebrow: 'Welcome',
        title: 'You have a player path.',
        body: "You'll always know your level, your focus, and what you're working toward next.",
      },
      {
        illustration: playerGates,
        eyebrow: 'Your mission',
        title: 'Every stage has a target.',
        body: 'Your coach gives you clear goals — strokes, movement, decisions, effort, and competition habits.',
      },
      {
        illustration: playerAssessment,
        eyebrow: 'Level up',
        title: 'Progress unlocks the next step.',
        body: 'When the right skills and habits show up, you move forward. No guessing. No confusion.',
      },
      {
        illustration: playerTrust,
        eyebrow: 'Your full game',
        title: 'Your coach sees more than one shot.',
        body: 'Technique, tactics, movement, mindset, effort. The full picture of your game — remembered, session to session.',
      },
    ],
  },
  parent: {
    name: 'Parent · first run',
    slides: [
      {
        illustration: parentReceive,
        eyebrow: 'Welcome',
        title: 'Know what your child is working on.',
        body: "See your child's current focus, progress, and next steps — without needing to ask after every session.",
      },
      {
        illustration: parentValve,
        eyebrow: 'Clear updates',
        title: 'Useful information, not constant noise.',
        body: "Progress, milestones, priorities, and coach-approved guidance — only when there's something real to share.",
      },
      {
        illustration: parentPrivate,
        eyebrow: 'Parent support',
        title: 'Support your child with confidence.',
        body: 'Know what to encourage, what not to over-coach, and how to help at the right time. Coach notes stay inside the coaching team.',
      },
      {
        illustration: parentAsk,
        eyebrow: 'Questions',
        title: 'Ask in the right place.',
        body: 'When you have a question, Academy OS routes it to the right person. Communication stays simple and clear.',
      },
    ],
  },
}
