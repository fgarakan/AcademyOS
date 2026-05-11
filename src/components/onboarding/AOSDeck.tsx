'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DeckData } from './decks'
import './aos-deck.css'

type Props = {
  deck: DeckData
  onComplete: () => void
  onSkip: () => void
}

export function AOSDeck({ deck, onComplete, onSkip }: Props) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const slides = deck.slides
  const isLast = index === slides.length - 1

  const next = useCallback(() => {
    if (index === slides.length - 1) {
      onComplete()
    } else {
      setIndex(i => i + 1)
    }
  }, [index, slides.length, onComplete])

  const prev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1)
  }, [index])

  const goTo = (i: number) => setIndex(i)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onSkip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, onSkip])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev()
    }
  }

  const slide = slides[index]

  return (
    <div className="aos-deck" role="region" aria-label={deck.name}>
      <div
        className="aos-deck-progress"
        style={{ width: `${((index + 1) / slides.length) * 100}%` }}
      />
      <button className="aos-deck-skip" onClick={onSkip} aria-label="Skip introduction">
        Skip
      </button>
      <div
        className="aos-deck-viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="aos-deck-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="aos-deck-slide"
              role="group"
              aria-roledescription="slide"
            >
              <div
                className="aos-deck-illustration"
                dangerouslySetInnerHTML={{ __html: s.illustration }}
              />
              <div className="aos-deck-eyebrow">{s.eyebrow}</div>
              <h2 className="aos-deck-title">{s.title}</h2>
              <p className="aos-deck-body">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="aos-deck-footer">
        <div className="aos-deck-dots" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`aos-deck-dot${i === index ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
        <div className="aos-deck-actions">
          <button className="aos-deck-btn back" onClick={prev} disabled={index === 0}>
            Back
          </button>
          <button className="aos-deck-btn primary next" onClick={next}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
