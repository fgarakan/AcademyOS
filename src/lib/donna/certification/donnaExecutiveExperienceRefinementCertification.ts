// Mega Sprint 4171–4200 — DONNA Executive Experience Refinement V1
// Certification — DONNA sounds like an experienced COO, not an AI. Proves the
// refinement contracts that run LIVE through the deterministic executive voice
// (applyExecutiveVoice, already wired in applyExecutiveRefinement) and the DNA
// conformance gate, across the eight real Director scenarios.
//
// No new architecture, routing, context engine, memory, or OpenAI pathway — this
// suite certifies presentation-only refinements. Pure; runs without a key.
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveExperienceRefinementCertification.ts

import {
  applyExecutiveVoice,
  isExecutiveVoiceClean,
  conformsToConversationDNA,
  hasGenericIntro,
  hasSelfRepetitionLeadIn,
  hasChatbotHedging,
  hasDashboardSpeech,
  answersFirst,
  endsWithGuidance,
  stripRepeatedExplanation,
  isWorkflowGuidanceComplete,
  hasExecutiveRecommendationShape,
  detectFlowShift,
  buildConversationDNAInstruction,
} from '@/lib/donna/conversation/donnaConversationDNA'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

function extractNumbers(s: string): string {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).slice().sort().join(',')
}

// ── The eight real Director scenarios (Objective 7) ─────────────────────────────
// Each draft is deliberately written the WAY AN AI WOULD: a generic intro, an
// acknowledgement, bullet-printing, hedging, or self-repetition. After the live
// executive voice pass, each must read like a COO: answer-first, no filler, no
// bullets, decisive, and still fact-exact.
const SCENARIOS: Array<{ page: string; robotic: string; numbers: string }> = [
  {
    page: 'Today',
    robotic: "Great question! Here's what I found: you have 5 items in the review queue and 2 coaches unassigned. I'd recommend clearing the queue first. Want me to open it?",
    numbers: '2,5',
  },
  {
    page: 'Academy Setup',
    robotic: "Sure, I'd be happy to help. To answer your question, setup is 3 steps from done. I'd recommend finishing the curriculum spine next. Want me to take you there?",
    numbers: '3',
  },
  {
    page: 'Curriculum',
    robotic: "Let me walk you through this. Here's a quick breakdown:\n• Orange 2 has 4 players\n• 1 player has no level\nI'd recommend assigning that player now. Shall I start it?",
    numbers: '1,2,4',
  },
  {
    page: 'Templates',
    robotic: "Happy to help! As I mentioned earlier, the Orange 2 template is ready. I'd recommend publishing it so coaches can use it tonight. Want me to publish?",
    numbers: '2',
  },
  {
    page: 'Players',
    robotic: "Thanks for asking. I think you're asking about Jake. He's missed 3 sessions, so I'd recommend a check-in with the parent. Want me to draft it?",
    numbers: '3',
  },
  {
    page: 'Coaches',
    robotic: "Of course! Here's what I found: 2 coaches have no sessions this week. I'd recommend assigning them to the 6 unassigned slots. Shall I propose assignments?",
    numbers: '2,6',
  },
  {
    page: 'Sessions',
    robotic: "Let me help you with that. To reiterate, 4 sessions tomorrow have no coach. I'd recommend assigning them now so the morning runs clean. Want me to start?",
    numbers: '4',
  },
  {
    page: 'Approvals',
    robotic: "Good question. You have 7 approvals waiting, and 2 are parent-visible. I'd recommend clearing the parent-visible ones first. Want me to open them?",
    numbers: '2,7',
  },
]

async function run() {
  process.stdout.write('\nDONNA Executive Experience Refinement Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Natural conversation — robotic filler removed, facts intact ───────────
  process.stdout.write('\n── A. Eight scenarios — robotic → executive, fact-exact ──\n')
  {
    let allClean = true
    let allConform = true
    let allFactSafe = true
    let allAnswerFirst = true
    let allGuide = true
    let allNoBullets = true
    let allIdempotent = true
    for (const s of SCENARIOS) {
      const voiced = applyExecutiveVoice(s.robotic)
      const conform = conformsToConversationDNA(voiced)
      if (hasGenericIntro(voiced) || hasSelfRepetitionLeadIn(voiced) || hasChatbotHedging(voiced)) {
        allClean = false; failures.push(`[A] ${s.page} still robotic: ${voiced}`)
      }
      if (!conform.conforms) { allConform = false; failures.push(`[A] ${s.page} DNA: ${conform.violations.join(',')}`) }
      if (extractNumbers(s.robotic) !== extractNumbers(voiced)) { allFactSafe = false; failures.push(`[A] ${s.page} numbers changed: ${extractNumbers(voiced)}`) }
      if (extractNumbers(voiced) !== s.numbers) { allFactSafe = false; failures.push(`[A] ${s.page} expected numbers ${s.numbers}, got ${extractNumbers(voiced)}`) }
      if (!answersFirst(voiced)) { allAnswerFirst = false; failures.push(`[A] ${s.page} not answer-first: ${voiced}`) }
      if (!endsWithGuidance(voiced)) { allGuide = false; failures.push(`[A] ${s.page} no guidance: ${voiced}`) }
      if (hasDashboardSpeech(voiced) || /[•]/.test(voiced)) { allNoBullets = false; failures.push(`[A] ${s.page} still prints bullets: ${voiced}`) }
      if (applyExecutiveVoice(voiced) !== voiced) { allIdempotent = false; failures.push(`[A] ${s.page} not idempotent`) }
      process.stdout.write(`   • ${s.page}: ${voiced}\n`)
    }
    check('A', 'every scenario sheds generic intros / acks / hedging', allClean)
    check('A', 'every refined answer conforms to Conversation DNA', allConform)
    check('A', 'every number preserved exactly (fact-safe)', allFactSafe)
    check('A', 'every answer leads with substance (answer-first)', allAnswerFirst)
    check('A', 'every answer ends by guiding the next step', allGuide)
    check('A', 'no answer prints glyph bullets (talks, does not print)', allNoBullets)
    check('A', 'normalizer is idempotent (second pass is a no-op)', allIdempotent)
  }

  // ── B. No silent over-cleaning — already-executive text is untouched ──────────
  process.stdout.write('\n── B. Clean executive text is left unchanged ──\n')
  {
    const CLEAN = [
      "I'd recommend clearing the review queue first — it has 5 items and two are parent-visible. Want me to open it?",
      "Jake has missed 3 sessions. I'd start with a parent check-in. Shall I draft it?",
      "Setup is almost done. Finish the curriculum spine next so coaches have levels to assign. Take you there?",
    ]
    let allUnchanged = true
    for (const c of CLEAN) {
      if (!isExecutiveVoiceClean(c)) { allUnchanged = false; failures.push(`[B] over-cleaned: ${applyExecutiveVoice(c)}`) }
    }
    check('B', 'clean executive answers are not altered', allUnchanged)
    check('B', 'clean answers carry no generic intro / repetition', CLEAN.every(c => !hasGenericIntro(c) && !hasSelfRepetitionLeadIn(c)))
  }

  // ── C. Executive recommendation shape — what · why · impact · next ───────────
  process.stdout.write('\n── C. Recommendations are complete (Objective 3) ──\n')
  {
    const rec = "I'd recommend publishing the Orange 2 template now, because coaches need it for tonight's sessions; the tradeoff is you lock the structure, but you'll have every coach running the same plan. Want me to publish?"
    const shape = hasExecutiveRecommendationShape(rec)
    check('C', 'a full recommendation has action + why + next', shape.complete)
    check('C', 'it surfaces the tradeoff', shape.present.tradeoff)
    check('C', 'it states the expected outcome (impact)', shape.present.outcome)
    check('C', 'a bare status line is NOT a complete recommendation', !hasExecutiveRecommendationShape('You have 5 items in the queue.').complete)
  }

  // ── D. Workflow guidance — step · why · select · outcome (Objective 5) ────────
  process.stdout.write('\n── D. Workflow guidance guides, never just describes ──\n')
  {
    const guide = "You're on the level step. It matters because every player needs a level before coaches can assign sessions. Choose Orange 2 for Jake, and you'll unlock his session plan for the week."
    const describe = "This is the curriculum page. It shows your levels and players."
    const g = isWorkflowGuidanceComplete(guide)
    check('D', 'complete guidance registers step + why + select + outcome', g.complete)
    check('D', 'it names what to select', g.present.select)
    check('D', 'it states the expected outcome', g.present.outcome)
    check('D', 'a page description is NOT complete guidance', !isWorkflowGuidanceComplete(describe).complete)
  }

  // ── E. Conversation flow — interrupt / resume / reprioritize / continue ───────
  process.stdout.write('\n── E. Flow shifts are recognized (Objective 4) ──\n')
  {
    check('E', '"hold on, actually let\'s do coaches" → interrupt', detectFlowShift("Hold on, actually let's do coaches first") === 'interrupt')
    check('E', '"back to the curriculum" → resume', detectFlowShift('Back to the curriculum we were doing') === 'resume')
    check('E', '"that\'s higher priority" → reprioritize', detectFlowShift("That's higher priority, switch to approvals") === 'reprioritize')
    check('E', '"continue" → continue', detectFlowShift('Continue') === 'continue')
    check('E', 'a normal request is not a flow shift', detectFlowShift('Show me the review queue') === 'none')
  }

  // ── F. No repeated explanations across turns (Objective 1 + 6) ───────────────
  process.stdout.write('\n── F. DONNA does not repeat what she already said ──\n')
  {
    const prior = "Jake has missed 3 sessions. I'd recommend a parent check-in."
    const draft = "Jake has missed 3 sessions. The parent check-in draft is ready — want me to send it?"
    const trimmed = stripRepeatedExplanation(draft, prior)
    check('F', 'the already-said sentence is dropped', !/missed 3 sessions/i.test(trimmed))
    check('F', 'the new sentence is kept', /check-in draft is ready/i.test(trimmed))
    check('F', 'no prior turn → draft is returned unchanged', stripRepeatedExplanation(draft, null) === draft)
    check('F', 'never returns empty (all-duplicate falls back to draft)', stripRepeatedExplanation(prior, prior) === prior)
  }

  // ── G. The live DNA directive carries the new contracts ──────────────────────
  process.stdout.write('\n── G. Live refinement directive encodes the refinements ──\n')
  {
    const instr = buildConversationDNAInstruction('director').toLowerCase()
    check('G', 'directive forbids filler intros', instr.includes('never open with filler'))
    check('G', 'directive forbids self-repetition', instr.includes('do not repeat yourself'))
    check('G', 'directive demands workflow guidance shape', instr.includes('name the step') && instr.includes('what to select'))
    check('G', "directive follows the Director's flow", instr.includes("follow the director's flow"))
  }

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE EXPERIENCE REFINEMENT: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE EXPERIENCE REFINEMENT CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})
