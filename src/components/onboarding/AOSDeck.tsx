'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DeckData } from './decks'
import {
  isSoundEnabled,
  setSoundEnabled,
  soundSlide,
  soundHover,
  soundPress,
  soundComplete,
} from './aosDeckSound'
import './aos-deck.css'

type Props = {
  deck: DeckData
  onComplete: () => void
  onSkip: () => void
}

export function AOSDeck({ deck, onComplete, onSkip }: Props) {
  const [index, setIndex] = useState(0)
  // Initialized false; corrected after hydration to avoid SSR mismatch
  const [soundOn, setSoundOn] = useState(false)
  // Incrementing this key remounts the active slide's illustration + text,
  // re-triggering CSS entrance animations on every slide change.
  const [animKey, setAnimKey] = useState(0)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const slides = deck.slides
  const isLast = index === slides.length - 1

  // Read stored sound preference client-side only
  useEffect(() => {
    setSoundOn(isSoundEnabled())
  }, [])

  const toggleSound = useCallback(() => {
    soundPress()
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }, [soundOn])

  const next = useCallback(() => {
    soundPress()
    if (index === slides.length - 1) {
      soundComplete()
      onComplete()
    } else {
      setIndex(i => i + 1)
      setAnimKey(k => k + 1)
      setTimeout(soundSlide, 20)
    }
  }, [index, slides.length, onComplete])

  const prev = useCallback(() => {
    if (index > 0) {
      soundPress()
      setIndex(i => i - 1)
      setAnimKey(k => k + 1)
      setTimeout(soundSlide, 20)
    }
  }, [index])

  const skip = useCallback(() => {
    soundPress()
    onSkip()
  }, [onSkip])

  const goTo = useCallback((i: number) => {
    if (i !== index) {
      soundPress()
      setIndex(i)
      setAnimKey(k => k + 1)
      setTimeout(soundSlide, 20)
    }
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') skip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, skip])

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

  return (
    <div className="aos-deck" role="region" aria-label={deck.name}>
      {/* Progress bar */}
      <div
        className="aos-deck-progress"
        style={{ width: `${((index + 1) / slides.length) * 100}%` }}
        aria-hidden="true"
      />

      {/* Top chrome: sound toggle + skip */}
      <div className="aos-deck-chrome">
        <button
          className="aos-deck-sound-btn"
          onClick={toggleSound}
          aria-label={soundOn ? 'Mute sounds' : 'Enable sounds'}
          aria-pressed={soundOn}
          title={soundOn ? 'Mute' : 'Sound on'}
        >
          {soundOn ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M7.5 2.5L4 5.5H1.5v5H4l3.5 3V2.5z"
                stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"
              />
              <path
                d="M10.5 5.5q1.2 1.1 1.2 2.5t-1.2 2.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              />
              <path
                d="M12.5 3.5q2 1.9 2 4.5t-2 4.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M7.5 2.5L4 5.5H1.5v5H4l3.5 3V2.5z"
                stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"
              />
              <line x1="10.5" y1="5.5" x2="14.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="14.5" y1="5.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        <button
          className="aos-deck-skip"
          onClick={skip}
          aria-label="Skip introduction"
        >
          Skip
        </button>
      </div>

      {/* Slide viewport */}
      <div
        className="aos-deck-viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="aos-deck-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => {
            const isActive = i === index
            // Stable key for inactive slides; incrementing key for active slide
            // forces remount on each navigation, re-triggering CSS animations.
            const illoKey = isActive ? `illo-a-${animKey}` : `illo-s-${i}`
            const textKey = isActive ? `text-a-${animKey}` : `text-s-${i}`
            return (
              <div
                key={i}
                className={`aos-deck-slide${isActive ? ' active' : ''}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${slides.length}`}
                aria-hidden={!isActive}
              >
                <div
                  key={illoKey}
                  className={`aos-deck-illustration${isActive ? ' animate-in' : ''}`}
                  dangerouslySetInnerHTML={{ __html: s.illustration }}
                />
                <div
                  key={textKey}
                  className={`aos-deck-text${isActive ? ' animate-in' : ''}`}
                >
                  <div className="aos-deck-eyebrow">{s.eyebrow}</div>
                  <h2 className="aos-deck-title">{s.title}</h2>
                  <p className="aos-deck-body">{s.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer: dots + nav buttons */}
      <div className="aos-deck-footer">
        <div className="aos-deck-dots" role="tablist" aria-label="Slide navigation">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              className={`aos-deck-dot${i === index ? ' active' : ''}`}
              onClick={() => goTo(i)}
              onMouseEnter={soundHover}
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === index}
            />
          ))}
        </div>
        <div className="aos-deck-actions">
          <button
            className="aos-deck-btn back"
            onClick={prev}
            onMouseEnter={soundHover}
            disabled={index === 0}
          >
            Back
          </button>
          <button
            className="aos-deck-btn primary next"
            onClick={next}
            onMouseEnter={soundHover}
          >
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
