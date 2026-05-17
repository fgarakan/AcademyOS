'use client'

import { useState } from 'react'
import { ChevronDown, Mic, CheckCircle2 } from 'lucide-react'

const PRE_DEMO = [
  'Create or reset the Demo Sandbox on this page.',
  'Use Chrome — SpeechRecognition requires Chrome or Edge.',
  'Allow microphone in browser settings before demo.',
  'Navigate to /director/demo and confirm Sandbox Status shows all green.',
  'Have the Brian Voice Demo Script tab open as backup.',
]

const SCRIPT_STEPS = [
  {
    n: 1,
    title: 'Open Demo Sandbox',
    route: '/director/demo',
    say: 'Everything here runs on real code — real database, real workflows. The sample players are just to make the demo feel real. When we onboard your academy, we replace them with your actual roster.',
    point: 'Point out the Preview Mode banner and the sandbox status cards.',
  },
  {
    n: 2,
    title: 'Navigate to Curriculum',
    route: '/director/curriculum',
    say: 'The Academy OS connects your coaching philosophy to every session and every player. If you want to emphasize something — like more return-of-serve work before players move up — you can just say it.',
    point: 'Point out the Curriculum Customization panel and the voice button.',
  },
  {
    n: 3,
    title: 'Speak curriculum prompt',
    route: '/director/curriculum',
    voice: 'For our Orange 2 players, I want more return-of-serve readiness before Orange 3.',
    say: 'The system heard every word. If it got something wrong, I can just edit it here before I do anything. Nothing has changed yet.',
    point: 'Show transcript in text box. Show the editable field before submitting.',
  },
  {
    n: 4,
    title: 'Create the override draft',
    route: '/director/curriculum',
    say: 'A draft was created. It\'s in the Review Queue. Until I go there and explicitly approve it, the curriculum stays exactly as it was.',
    point: 'Show "Draft created — check Review Queue" success message.',
  },
  {
    n: 5,
    title: 'Show the Review Queue',
    route: '/director/review',
    say: 'Here\'s the draft. I can read it, modify it, approve it, or reject it. The system never applies it automatically.',
    point: 'Show the curriculum override draft card. Show approve / reject controls.',
  },
  {
    n: 6,
    title: 'Open the demo session',
    route: 'Use "Open Demo Session" quick link above',
    say: 'Now let\'s say the coach just finished a session. Coaches often forget things between the court and the computer. With voice, they can just say it while it\'s fresh.',
    point: 'Navigate to the demo session page.',
  },
  {
    n: 7,
    title: 'Speak a session recap',
    route: 'Demo session → Coach Recap section',
    voice: 'Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing.',
    say: 'The system captured exactly what the coach said — names, observations, attendance. But nothing has been recorded yet. The coach reviews, edits if needed, then saves.',
    point: 'Show transcript in text box. Show demo prompt suggestion above the field.',
  },
  {
    n: 8,
    title: 'Save the recap',
    route: 'Click "Save Recap"',
    say: 'The recap is saved as raw text. Now the coach can optionally ask the system to structure it — pull out attendance, player observations, a parent-safe draft. But that\'s also just a draft. The director sees it before anything goes to parents.',
    point: 'Show success message and "Structure Recap" button.',
  },
  {
    n: 9,
    title: 'Explain the model',
    route: null,
    say: 'Here\'s the operating model. Voice captures your intent as text. The system structures it into a draft. You review and approve the draft. Only then does anything change. No surprises, no invisible mutations, no AI acting on its own.',
    point: null,
  },
  {
    n: 10,
    title: 'Safety closing',
    route: null,
    say: 'A new coach can use voice freely without worrying about accidentally moving a player\'s level or sending the wrong thing to a parent. The director is always in the loop.',
    point: null,
  },
]

export function DemoScriptPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-raised transition-colors text-left"
      >
        <div>
          <p className="text-[12px] font-semibold text-text-primary">Live Demo Script</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Exact steps and phrases from the Brian Voice Demo Script.
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 space-y-6">

          <div className="space-y-2">
            <p className="label-xs">Before Demo</p>
            <div className="space-y-1.5">
              {PRE_DEMO.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                  <p className="text-[12px] text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="label-xs">10-Step Script</p>
            <div className="space-y-3">
              {SCRIPT_STEPS.map(step => (
                <div key={step.n} className="rounded-xl border border-border bg-surface-raised p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-none w-6 h-6 rounded-full bg-lime/10 text-lime text-[11px] font-bold flex items-center justify-center border border-lime/20 shrink-0">
                      {step.n}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text-primary">{step.title}</p>
                      {step.route && (
                        <p className="text-[10px] text-text-muted font-mono mt-0.5">{step.route}</p>
                      )}
                    </div>
                  </div>

                  {step.voice && (
                    <div className="ml-8.5 flex items-start gap-2 px-3 py-2 rounded-lg bg-lime/5 border border-lime/20">
                      <Mic className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                      <p className="text-[12px] text-lime font-medium italic">
                        &ldquo;{step.voice}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="ml-8.5 space-y-1">
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      <span className="text-text-muted font-medium">Say: </span>
                      &ldquo;{step.say}&rdquo;
                    </p>
                    {step.point && (
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        <span className="font-medium">Point out: </span>{step.point}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
            <p className="text-[11px] text-text-muted leading-relaxed">
              <span className="text-lime font-semibold">One-liner to open with:</span>{' '}
              &ldquo;Voice creates text. The OS structures it. Humans approve before anything changes.&rdquo;
            </p>
          </div>

        </div>
      )}
    </div>
  )
}
