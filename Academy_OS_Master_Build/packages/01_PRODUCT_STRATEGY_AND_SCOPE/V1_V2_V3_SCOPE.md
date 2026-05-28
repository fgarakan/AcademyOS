# V1 / V2 / V3 SCOPE

## The rule

**V1 must be buildable, shippable, and valuable without voice AI.**

The architecture must be voice-ready from day one. But V1 ships working staff tools first. Voice is a V2 unlock.

---

## V1 — Foundation (Build now)

**Core question:** Can a director manage an academy's player development with clean data?

### What ships in V1
- [ ] New student placement flow (assessment → recommendation → approval → activation)
- [ ] Player profiles with baseline scores
- [ ] Group management (create groups, assign players)
- [ ] Template builder (create training templates with blocks and exercises)
- [ ] Session creation (from template + overrides)
- [ ] Coach observations (written notes, tagged)
- [ ] Assessment scoring tool (structured 1–10 scale)
- [ ] Reassessment scheduling and tracking
- [ ] Parent update generator (AI-drafted from notes, coach-approved)
- [ ] Director dashboard (program overview, placement queue, pattern surface)
- [ ] Voice command UI shell (typed input, pipeline architecture, no live audio)
- [ ] Role-based access (director, head coach, coach)
- [ ] Audit log on all major changes

### What does NOT ship in V1
- Real voice audio input (V2)
- Parent-facing portal (V2)
- Competition match results tracking (V2)
- Cross-academy intelligence (V3)
- SwingCheck / video analysis integration (V3)
- Mobile app (V2 — V1 is responsive web)
- Billing / subscription management (V2)

---

## V2 — Intelligence

**Core question:** Can the system give coaches and directors insights they couldn't get without AI?

### What ships in V2
- Real voice recording → Whisper transcription → AI parsing
- Voice note distributed to 8 systems automatically (player profile, assessments, parent comms, director dashboard, AI store, session system, exercise library, onboarding engine)
- Parent-facing portal (updates inbox, progress timeline, child profile)
- Reassessment cycles with delta detection
- AI exercise recommendations (based on player weaknesses)
- Director dashboards with cross-player pattern detection
- Competition track (match results, pressure handling, tactical readiness)
- Vector store + semantic search of all coach observations
- Promotion readiness flagging
- Retention signals (families at churn risk)
- Real mobile experience (coach-first)
- Multi-coach coordination tools

---

## V3 — Expansion

**Core question:** Can the system operate across multiple academies and create a network effect?

### What ships in V3
- Multi-academy support
- Cross-academy anonymized benchmarking
- SwingCheck / vision data integration
- Advanced competition analytics
- Court management / scheduling
- Third-party integrations (tournament systems, payment platforms)
- Multi-language support
- Academy director business intelligence (retention predictions, enrollment forecasts)
- Network-level AI patterns

---

## The non-negotiable

Every line of code written in V1 must be **voice-ready**:
- Database schema includes `voice_command_id` where needed
- Proposed action pipeline tables exist from Phase 6
- Every major create/update operation can be triggered by the voice pipeline, not just the UI
- No dead ends in the data model that would require migration to add voice later

**The architecture contract:**
> V1 uses typed input. V2 uses spoken input. The pipeline is the same.
