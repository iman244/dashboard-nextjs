# Saderat Bank Health Monitoring

Uploaded Excel workbooks of occupational health screening, one row per person.

## Routes

```
saderat-bank-health-monitoring/
  page.tsx                       list of uploaded monitorings
  step-1/[id]/                   step_1 report
  step-1/[id]/[national_id]/     one person's step_1 detail
  step-2/[id]/                   step_2 report
```

The two steps have **unrelated record shapes** — different fields, different
spellings, almost no overlap. That is why there is no `[step]` segment
branching at runtime: each step gets its own route with its own components.

Never hardcode a detail URL. Use the helper, which maps step to segment:

```ts
import { SBHM_DETAIL_PATH } from "@/data/saderat-bank-health-monitoring/types";
href={SBHM_DETAIL_PATH(row.original.type, row.original.id)}
```

`SBHM_TYPE_SEGMENTS` is declared `satisfies Record<SBHM_Type, string>`, so
adding a step to the Django model fails to compile here until its route exists.

## Types

`data/saderat-bank-health-monitoring/types.ts`. Most of the file is generated
from the OpenAPI schema. The record shapes are not: Django's `JSONField` types
as `unknown`, so `SBHM_Step1Record` (96 fields) and `SBHM_Step2Record` (155)
are hand-maintained.

There is **no runtime validation, deliberately.** The upload is loose
third-party data; the types describe what we have seen, not a contract. A
column rename upstream compiles fine and renders blank. That is accepted.

### A known unsoundness

`SBHM_RetrieveSerializer.json` is typed as `SBHM_Step1Record[]` for *both*
steps. The correct model is `SBHM_Retrieve_ByType`, a union discriminated on
`type`, which is exported and ready. It is not yet the default because
`keyof` over a union collapses to the shared keys, and step-1's page uses
`keyof SBHM_RetrieveSerializer["json"][number]` throughout — switching breaks
it in **99 places**.

So `step-2/[id]/page.tsx` reinterprets `json` through `unknown`, guarded by a
`data.type === "step_2"` check. When step-1 is refactored, switch
`SBHM_RetrieveSerializer` to `SBHM_Retrieve_ByType` and that cast deletes
itself.

## Field names must match the payload byte for byte

Record keys are transcribed from the Excel import and are **not** normalised:

- step_1 uses Persian ی/ک (`نورولوژی`, `اندوکرینولوژی`)
- step_2 uses Arabic ي/ك (`هماتولوژي`, `اندوكرينولوژي`)

These are different Unicode characters. **Do not "fix" the spelling** — the
lookup silently misses and the chart renders empty. The same applies to double
spaces (`"پوست و  مو"`, `"عوامل  رواني"`) and to pandas' de-duplication
suffixes on repeated Excel headers (`"نورولوژی.1"`, `"عوامل فیزیکی.1"`).

Keys containing a `.` — `"personel.کد ملی"`, anything `.1` — need a TanStack
Table accessor **function**, not an accessor string, because accessor strings
are parsed as deep paths:

```ts
// wrong: looks for a nested `personel` object, silently undefined
columnHelper.accessor("personel.کد ملی", { ... })
// right
columnHelper.accessor((row) => row["personel.کد ملی"], { id: "personel.کد ملی", ... })
```

## step-2 is config-driven. step-1 is not. Follow step-2.

`step-2/[id]/` declares its charts as data and derives everything from that:

```
_charts/config.ts               22 charts as an array
_charts/distribution-chart.tsx  the chart, written once
_charts/locale-tooltip.tsx      module scope on purpose
_data/use-step2-report.ts       computes from the same array
page.tsx                        composition only
```

Adding a metric is one entry:

```ts
{ field: "Spo2", titleKey: "charts.spo2", color: 3 },
```

Three properties this buys, which are structural rather than conventions
someone has to remember:

1. `field` is `keyof SBHM_Step2Record`, so a mistyped key is a **compile
   error**, not an empty chart.
2. `useStep2Report` iterates the same array the JSX maps over, so computed and
   rendered are the same set. Dead computation cannot occur.
3. The config carries `titleKey`, never text. There is nowhere to put a
   hardcoded string.

### Why: measured on step-1, 2026-09-04

| | step-1 | step-2 |
|---|---|---|
| lines | 1,539 in one component | 332 across five files |
| chart markup | repeated 22× | once |
| `react-hooks` lint errors | 25 | 0 |
| distributions computed | 66 | 22 |
| …rendered | 21 | 22 |
| dead computation | 45 | 0 |
| hardcoded Persian in JSX | 64 | 0 |
| `t()` calls | 6 | all titles |

Details of what step-1 does and why it hurts:

- **One 1,539-line component.** `[national_id]/page.tsx` is another 1,274.
- **The same chart block, 22 times, 45 lines apart**, differing only in title,
  data key, `var(--chart-N)`, and click field. The colour cycles 1-5 mechanically,
  which is the tell that a human was repeating a block and bumping a number.
- **All 25 `react-hooks/static-components` errors have one cause:**
  `LocaleChartTooltip` is declared *inside* the page component. React then sees
  a new component *type* every render and unmounts/remounts the entire chart
  subtree instead of updating it — losing animation state and re-running
  recharts' layout each time. step-2 declares it at module scope.
- **45 of 66 distributions are computed and never rendered.** `countValues`
  runs 68 times, each a full pass over the records. The sample file is 969
  records × 96 fields, so roughly 66,000 record visits per recompute, two
  thirds of it feeding variables no JSX reads.
- **It is effectively Persian-only.** 6 `t()` calls against 64 literal Persian
  strings; all 25 `<CardTitle>` values are hardcoded. An English user sees a
  Persian page. Retrofitting is drudgery nobody will do — which is why step-2
  uses translation keys from the first line. step_2 has 155 fields, so the
  same mistake there would be three times worse.

None of this is a reason to rewrite step-1 today. It is a reason not to copy it.
