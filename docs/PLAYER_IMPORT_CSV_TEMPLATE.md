# Player Import CSV Template

**Sprint:** 102
**File:** `data/player-import/player_import_template.csv`

---

## How to Use

1. Copy `player_import_template.csv` and fill in your players — one row per player.
2. Save as a `.csv` file (UTF-8 encoding recommended).
3. Open `/director/players/import` in Academy OS.
4. Paste the CSV text or upload the file.
5. Click **Run Dry Run** — review the report before anything is saved.
6. Fix any errors, re-run as needed.
7. Check the confirmation box and click **Commit Import**.
8. Review the result report.

---

## Column Reference

### Required Columns

| Column | Description | Example |
|---|---|---|
| `first_name` | Player's first name | `Alex` |
| `last_name` | Player's last name | `Chen` |

---

### Recommended Columns

| Column | Description | Example | Notes |
|---|---|---|---|
| `birth_year` | 4-digit birth year | `2014` | Used to estimate age and date of birth. If blank, recorded as unknown. |
| `ball_level` | Ball colour the player currently plays | `orange` | Options: `red`, `orange`, `green`, `yellow`. Used as a hint for curriculum level lookup only — not stored as a separate field. |
| `current_group` | Exact name of their training group | `Wednesday Orange` | Must match an existing group name in Academy OS exactly. |
| `primary_coach` | Coach's display name | `Coach Mike` | Must match an existing coach profile. If not found, skipped with a warning. |
| `curriculum_level` | Exact name of their curriculum level | `Orange Ball — Building Stage` | Must match an existing curriculum level display name. If not found, skipped. |
| `strength_1` | A strength this player shows | `Consistent groundstrokes` | Plain English. Max 3 strengths across strength_1, strength_2, strength_3. |
| `strength_2` | Second strength (optional) | `Good footwork` | Leave blank if not applicable. |
| `strength_3` | Third strength (optional) | ` ` | Leave blank if not applicable. |
| `need_1` | Primary development area | `Return of serve` | Plain English. Max 3 needs. The first need is also used as the development focus. |
| `need_2` | Second development area (optional) | `Directional control` | Leave blank if not applicable. |
| `need_3` | Third development area (optional) | ` ` | Leave blank if not applicable. |
| `current_priority` | The one thing the coach wants to focus on right now | `Improve cross-court consistency` | Single sentence. Max 200 characters. |
| `coach_notes` | Brief notes about this player | `Making good progress with footwork.` | Plain English. Keep to 1–2 sentences. Not shown to players or parents. |
| `status` | Player status | `active` | Defaults to `active` if blank. Options: `active`, `on_hold`. |

---

## Example Rows

```
first_name,last_name,birth_year,ball_level,current_group,...
Alex,Chen,2014,orange,Wednesday Orange,Coach Mike,Orange Ball — Building Stage,Consistent groundstrokes,Good footwork,,Return of serve,Directional control,,Improve cross-court consistency,Making good progress.,active
Jordan,Williams,2015,red,Tuesday Red Ball,Coach Sarah,Red Ball — Learning Stage,,,,Racket preparation,Contact point,,,New to the academy.,active
Sam,Rivera,2013,green,Friday Green,Coach Mike,Green Ball — Advanced Stage,Strong first serve,Good court coverage,Competitive mindset,Second serve,Return positioning,,Build consistency on second serve,Great intensity and awareness.,active
```

---

## What NOT to Include

Do not include any of the following in this import:
- **Parent email or phone numbers** — Parent accounts are managed separately.
- **Billing or subscription information** — Use the billing module when available.
- **Medical or injury details** — These belong in a medical records system, not in player import.
- **Sensitive personal notes** — Coach notes should be brief, professional, and appropriate for a director to read.
- **Passwords or login credentials** — Player logins are created separately.

---

## Import Flow

```
1. Prepare CSV
       ↓
2. Paste or upload in Academy OS
       ↓
3. Run Dry Run — review report
       ↓
4. Fix errors → re-run as needed
       ↓
5. Confirm and Commit Import
       ↓
6. Review result report
       ↓
7. Open Development Profile Intake to add or edit strengths/needs
       ↓
8. Open Onboarding Review to confirm players are set up correctly
```

---

## Known Limitations (V1)

- `display_name` is not a separate column in the database — players use their computed `first_name + last_name`.
- `ball_level` is a hint only — it helps you find the right curriculum level but is not stored as a separate field.
- If a group or curriculum level name doesn't exactly match, it will be skipped. Fix the name and re-run.
- `date_of_birth` is required by the database. If `birth_year` is blank, a placeholder date is used and flagged as a warning.
- `status` = `active` bypasses the standard new-player placement flow. This is intentional for importing existing academy players. New students going through the academy for the first time should use the Placement Engine instead.

