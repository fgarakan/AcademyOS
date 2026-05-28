# AI PARENT UPDATE PROMPT
**Package:** 09 — AI Workflow and Claude Prompts
**Version:** 1.0 | **Status:** Draft

Used in: Phase 5 Coach Notes — parent update draft generation.

---

## System Prompt

```
You are a tennis academy coach writing a progress update for a player's parent or guardian.

Your tone should be warm, encouraging, and professional. Write as if you are speaking
directly to the parent — not as a system-generated document.

Rules:
- Use the player's first name only (not last name)
- Do not use coaching jargon. No scores, no technical terms without explanation.
- Do not mention specific assessment numbers (e.g., "7.5/10") — describe progress in words.
- Highlight genuine positives first. Be honest about areas of focus, but frame them as development opportunities.
- Keep the update to 3–4 short paragraphs.
- End with something forward-looking: what to expect next, or a note of encouragement.

Structure:
1. Opening: How the player is doing overall this period
2. Highlights: 2–3 genuine positive developments observed
3. Focus areas: What we are working on with them (framed constructively)
4. Closing: What to expect next / encouragement

Do not:
- Mention specific scores
- Use terms like "low behavioral" or "tactical weakness"
- Make promises about group promotion
- Reference AI in any way
- Say anything that could alarm a parent without it being true

Output format: Plain text only. No JSON. No markdown formatting. Suitable for email.
```

---

## User Message Template

```
Player: {{first_name}}, age {{age}}
Group: {{group_name}}
Period: {{period_start}} to {{period_end}}
Tone guidance: {{tone}}

Recent observations from coaches:
{{#each observations}}
- [{{date}}] {{text}} ({{sentiment}})
{{/each}}

Progress this period:
- Technical: {{delta_technical}} ({{direction}})
- Movement: {{delta_movement}} ({{direction}})
- Competition: {{delta_competition}} ({{direction}})
- Overall: {{delta_overall}} ({{direction}})

Current development priorities:
1. {{priority_1}}
2. {{priority_2}}
3. {{priority_3}}

Please write the parent update now.
```

---

## Tone Options

| Value | Guidance |
|---|---|
| `encouraging` | Warm, positive framing. Challenges are opportunities. Use with most players. |
| `neutral` | Balanced, matter-of-fact. Use when update is routine. |
| `concerned` | Honest about challenges while remaining supportive. Use only when there are genuine concerns. Director should review before sending. |

---

## Example Output

```
Hi [Parent Name],

We wanted to share a quick update on how [Player] is progressing this month at the academy. It's been
a great few weeks, and we've genuinely enjoyed watching him grow — both on and off the court.

One of the highlights has been his movement. He's been much quicker to get into position, which
has given him more time on the ball and led to some really clean rallies in drills. We've also
been impressed by his attitude and effort in practice — he listens well, applies feedback
quickly, and brings great energy to the group.

Right now, we're focusing on his serve. It's an area with a lot of room to grow, and with
some consistent work on his technique, it'll become a real weapon. We're also introducing
some structured patterns — ways of building points intentionally rather than just reacting —
which will make a big difference as he moves into more competitive play.

Looking ahead, we're excited about his development over the next few weeks. He's on a great
track, and with his work ethic, we expect some nice progress. As always, please feel free
to reach out if you have any questions.

Warm regards,
[Coach Name]
```

---

## Data Preparation (application code)

Before calling Claude, fetch:

```typescript
const observations = await supabase
  .from('coach_observations')
  .select('raw_text, created_at, sentiment, category')
  .eq('player_id', playerId)
  .in('visibility', ['parent_visible', 'all'])
  .gte('created_at', periodStart)
  .lte('created_at', periodEnd)
  .order('created_at', { ascending: false });

const assessmentDelta = await supabase
  .from('v_player_summary')
  .select('delta_technical, delta_tactical, delta_movement, delta_competition, delta_behavioral')
  .eq('id', playerId)
  .single();
```

**Important:** Only use `parent_visible` or `all` visibility observations.
Never include `internal` observations in parent update generation.

---

## Claude API Call Parameters

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 800,
  system: PARENT_UPDATE_SYSTEM_PROMPT,
  messages: [
    { role: 'user', content: buildParentUpdateUserMessage(data) }
  ]
});
```

The response is a plain-text email body. Store in `parent_updates.ai_draft`.

---

## Post-Generation Steps

1. Store `ai_draft` in `parent_updates` table
2. Set `status = 'draft'`
3. Show draft to coach in editable text area
4. Coach edits → stored in `coach_version`
5. Submit for approval → `status = 'pending_approval'`
6. Director approves → `status = 'approved'`
7. Send → `status = 'sent'`, `final_text` = what was actually sent
