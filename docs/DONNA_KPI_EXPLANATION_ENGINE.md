# DONNA KPI Explanation Engine

> Sprint 466 — KPI Explanation Engine V1
> See also: `src/lib/donna/kpiExplanations/kpiExplainer.ts`, `src/lib/kpis/academyKpiModel.ts`

---

## Purpose

Every KPI value DONNA surfaces must come with an explanation: what changed, why it matters, evidence, recommended next action, and confidence level.

---

## Explanation fields

| Field | Description |
|---|---|
| headline | Short one-line status assessment |
| whatChanged | Value + trend in plain language |
| whyItMatters | Why this KPI matters for the academy |
| evidence | Formatted current value |
| recommendedNextAction | What the director should do next |
| nextActionHref | Link to the relevant page |
| confidence | high/partial/low based on data availability |
| dataLimitation | Why confidence is not high (if applicable) |

---

## Explanation templates

Each KPI has three templates: healthy, warning, critical.

For `no_data` status, DONNA explains that data is not yet available.

---

## Confidence rules

| KPI availability | Confidence |
|---|---|
| live | high |
| partial | partial |
| unavailable | low |

---

## Main functions

- `explainKpi(kpiValue)` — returns `KpiExplanation` for one KPI
- `explainAllKpis(values)` — returns explanations for all KPIs

---

## Usage pattern

```typescript
const value = buildKpiValue('attendance_rate', 82, { delta: -3, direction: 'down' })
const explanation = explainKpi(value)
// explanation.headline → 'Attendance is below target'
// explanation.whatChanged → 'Attendance Rate is 82% (down 3.0 from last week).'
// explanation.recommendedNextAction → 'Review attendance by group and identify patterns'
```
