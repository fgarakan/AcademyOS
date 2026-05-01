# Brian Demo: Player Data Prep + Onboarding V1

**Sprint:** 110
**Date:** 2026-05-01

---

## The Idea in One Sentence

Brian gives us the player names → the OS imports them cleanly → coaches add strengths and needs → the system becomes intelligent about those specific kids.

---

## Demo Script

### Step 1: Brian gives names

Brian provides a list of players in any format — spreadsheet, notes, email. We turn it into CSV.

```
first_name,last_name,birth_year,ball_level,current_group,...
Alex,Chen,2014,orange,Wednesday Orange,...
Jordan,Williams,2015,red,Tuesday Red Ball,...
Sam,Rivera,2013,green,Friday Green,...
```

---

### Step 2: Open Player Import

Navigate to `/director/players`.

Point out the **Import Players** button in the top right.

Click it → opens `/director/players/import`.

Show:
- Clean, uncluttered page
- CSV Column Guide (click to expand)
- Textarea for paste or file upload

---

### Step 3: Paste CSV

Paste the CSV text into the textarea.

Point out:
- Only `first_name` and `last_name` are required
- Everything else is optional but valuable
- The system tells you exactly what each column means

---

### Step 4: Run Dry Run

Click **Run Dry Run**.

The system checks:
- Valid column headers
- Required fields present
- Duplicate names within the upload
- Existing players in the academy (name match)
- Group names — are they in Academy OS?
- Curriculum level names — do they match?

Show the **Dry Run Report**:
- Summary stat pills: 8 ready to create, 1 update, 2 missing groups
- Expandable row preview — click a row to see warnings
- Any issues flagged in orange before a single record is written

---

### Step 5: Review and fix if needed

If any groups or curriculum levels don't match:
- Fix the CSV (correct the name to match what's in the system)
- Re-run dry run
- Report updates immediately

---

### Step 6: Commit Import

After a clean dry run:
- Read the "Ready to Import" summary
- Tick the confirmation checkbox: *"I understand this will create/update player records for this academy."*
- Click **Commit Import — 8 players**

Show the **Import Result Report**:
- Created: 8
- Dev Profiles: 8 (if strengths/needs were in the CSV)
- Priorities: 5
- Levels Set: 6
- Groups Set: 7

---

### Step 7: Open Development Profile Intake

Click **Development Profile Intake** from the result screen.

Navigate to `/director/players/development-intake`.

Show:
- All active players listed
- Players without development data flagged "Empty" in orange
- Filter to "Missing Data" view

For each player, expand and fill in:
- 2–3 strengths
- 2–3 development areas
- Current priority
- Brief coach notes

Click **Save** — immediately stored.

---

### Step 8: Open Onboarding Review

Navigate to `/director/players/onboarding-review`.

Show:
- Total players: 8
- Readiness bar: 6 of 8 fully set up
- Checklist:
  - Curriculum Level: 2 missing → link to player profiles
  - Group Assignment: 1 missing → link to player profiles
  - Development Profile: All set ✓
  - Current Priority: All set ✓
- Individual player list with icon indicators (level / group / dev data / priority)
- Players marked "Ready" when all 4 are set

---

### Step 9: Confirm players are ready for coach intelligence

Go to a session with one of the imported groups.

Show the **Coach Briefing**:
- "6 players in class · Wednesday Orange"
- "3 players with active focus areas"
- "Academy emphasis: return of serve work"

Scroll to **Class Roster Intelligence**:
- Each player now shows their curriculum level, strengths, and development areas
- Not generic — these are the actual kids' actual needs

---

### Step 10: Generate Adaptive Suggestions

Click **Generate Suggestions for This Class**.

Because player development data now exists:
- Rule 1 fires: Recovery break (if 2+ players have stamina needs)
- Rule 3 fires: Simplify return drill (if return readiness is in 2+ players' needs)
- Rule 7 fires: Assessment moment (if any players still have no coach observations)

**Before player import:** "No suggestions generated — class data may not have enough active focus areas."

**After player import:** 4–6 specific, named suggestions tied to real players.

---

## What to Say

> "Right now, the OS has all the intelligence built — curriculum awareness, coach briefing, class roster intelligence, adaptive suggestions. But intelligence only works if it knows who the kids are.
>
> Brian gives us the names. We paste them in. The OS checks everything before saving a single record — matching group names, curriculum levels, flagging any issues. After the director confirms, the players are in. Then we add their strengths and needs — takes about 2 minutes per class group — and suddenly the system knows that Jordan is working on return of serve and Alex needs footwork work.
>
> The next time a coach opens that session, the briefing is specific. The adaptive suggestions are named. The system knows the class."

---

## Key Properties

| Property | How It Works |
|---|---|
| Dry run before commit | Nothing saved until director reviews and confirms |
| No guessing | Groups/levels must match exactly; skipped if not found |
| Conservative duplicates | Existing players get dev data update only |
| No parent data | Parent accounts not created; dev summaries private |
| Audit trail | Every commit logged with counts |
| Feeds intelligence | Strengths/needs instantly visible in Class Roster Intelligence and Adaptive Suggestions |

