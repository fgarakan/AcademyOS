# DEFINITIONS AND TERMINOLOGY

Shared vocabulary for the entire Academy OS project. When in doubt, use these terms.

---

| Term | Definition |
|---|---|
| **Academy** | A tennis academy operating on the platform. The root tenant. |
| **Player** | A student enrolled at the academy. Has a developmental record. |
| **Guardian / Parent** | An adult connected to a player. Receives updates (V2). |
| **Coach** | A staff member who delivers sessions and logs observations. |
| **Head Coach** | A senior staff member who approves placements and manages curriculum. |
| **Academy Director** | The operational lead. Sees all data. Manages academy configuration. |
| **Track** | A developmental pathway: Skill, Competition, Fitness, or Combined. |
| **Level** | A numbered developmental stage (1–10). Labels are academy-configurable. |
| **Group** | A named training group within the academy (e.g., "Elite-A"). |
| **Placement** | The process of determining a new player's group, level, and track. |
| **Baseline** | A player's scored assessment at the time of initial placement. Permanent. |
| **Assessment** | A structured scoring of a player across Technical, Tactical, Movement, Competition, Behavioral. |
| **Reassessment** | A follow-up assessment after a training period, compared to baseline. |
| **Template** | A reusable session blueprint with a default block structure. |
| **Session** | A live training instance created from a template (or from scratch). |
| **Block** | A segment within a session (warm-up, technical, tactical, fitness, cool-down, etc.). |
| **Exercise** | A specific drill or activity used within a block. |
| **Observation** | A coach's note about a player (written or voice-originated). |
| **Voice Note** | An audio recording of a coach observation. Transcribed and AI-parsed (V2). |
| **Proposed Action** | A voice-generated action awaiting human review and approval. |
| **Voice Command** | The raw input that starts the voice pipeline. |
| **Normalized Intent** | The AI-classified intent extracted from a voice command. |
| **Execution Log** | The immutable record of what happened after an approved action ran. |
| **Audit Log** | A system-wide log of all major state changes. Immutable. |
| **Parent Update** | An AI-drafted progress communication reviewed and approved by a coach before sending. |
| **Promotion** | Moving a player to a higher level group based on assessed readiness. |
| **Overload Flag** | A system warning when skill + competition + fitness intensity are all high in the same week. |
| **Confidence Score** | AI's self-assessed certainty (0.0–1.0) for a placement recommendation or voice intent. |
| **RLS** | Row Level Security — Supabase/PostgreSQL feature controlling who can read/write each row. |
