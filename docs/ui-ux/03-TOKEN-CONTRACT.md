# Token Contract

The agreed shape of the colour system. Implementation (`globals.css`) and validation
(`scripts/check-tokens.mjs`) are both written against **this file** — it is what makes them
agree. Change this first, then both sides.

Part of [02-VISUAL-ROADMAP.md](02-VISUAL-ROADMAP.md) Phase A (VIS-01…04).

---

## Rules

1. **All values are `oklch()`.** Not HSL. Tailwind v4 tokens are complete colour functions,
   and code must reference them bare — `var(--chart-1)`, never `hsl(var(--chart-1))`.
   That mistake silently painted nothing in Wave 1.
2. **Every token below must exist in both `:root` and `.dark`.** No token may be defined in
   only one theme.
3. **Light and dark share the same hue family.** Dark is re-tuned lightness and chroma, not
   a different palette and not a mechanical inversion.
4. **Existing token names are load-bearing** — they are referenced across the codebase and
   by shadcn primitives. Names may be *added*; the ones listed as "existing" may not be
   renamed or removed in this phase.

## Hue budget

| Role | Hue | Chroma |
|---|---|---|
| Neutrals (surfaces, text, borders) | one cool hue, held constant | ≤ 0.02 — near-grey, never obviously blue |
| Brand / primary | one hue, distinct from neutral | high, used on ~5% of a screen |
| Semantics | conventional: green success, amber warning, red danger, blue info | high enough to read as a signal |
| Categorical chart scale | 8 hues spread around the wheel | as even as perception allows |

**The point of the neutral spine:** when chrome is near-grey, data colour carries meaning.
Today everything is sky blue, so colour carries none.

---

## Required tokens

### Neutrals — existing, must keep working

`--background` · `--foreground` · `--card` · `--card-foreground` · `--popover` ·
`--popover-foreground` · `--muted` · `--muted-foreground` · `--border` · `--input`

### Brand — existing

`--primary` · `--primary-foreground` · `--secondary` · `--secondary-foreground` ·
`--accent` · `--accent-foreground` · `--ring`

### Semantic — `--destructive` exists; the rest are NEW

`--destructive` · `--destructive-foreground`
`--success` · `--success-foreground`
`--warning` · `--warning-foreground`
`--info` · `--info-foreground`

Wave 1 had to render clinically opposite findings (a *low* lab value and a *high* one) in
the same red, because `destructive` was the only signal colour available. This set fixes
that at the token level.

### Sidebar — existing, all eight

`--sidebar` · `--sidebar-foreground` · `--sidebar-primary` · `--sidebar-primary-foreground`
· `--sidebar-accent` · `--sidebar-accent-foreground` · `--sidebar-border` · `--sidebar-ring`

### Charts — three scales, chosen by data shape

**Categorical** — unordered categories (gender, insurance, service type).
`--chart-1` … `--chart-8`. **1–5 already exist and are referenced in code; keep the names.**
Must be distinguishable from each other *and* under deuteranopia.

**Sequential** — ordered magnitude (age bands, record counts). One hue, light→dark.
`--chart-seq-1` … `--chart-seq-5`.

**Diverging** — a signed distance from a neutral midpoint. `--chart-div-1` … `--chart-div-5`,
running cool → neutral → warm.

> Lab results are diverging data: `low ← normal → high`. This scale encodes direction and
> magnitude at once, which is the proper fix for the problem Wave 1 patched with an arrow
> icon. Do not use the categorical scale for them.

### Tailwind mapping

Every new token needs its `@theme inline` counterpart (`--color-success: var(--success)`,
etc.) so it is usable as a utility class, matching how the existing tokens are wired.

---

## Contrast requirements

Checked programmatically, not by eye. WCAG 2.1, both themes.

| Pair | Minimum |
|---|---|
| `foreground` on `background` | 7.0 : 1 (AAA body text) |
| `foreground` on `card` | 7.0 : 1 |
| `muted-foreground` on `background` | 4.5 : 1 |
| `muted-foreground` on `card` | 4.5 : 1 |
| `primary-foreground` on `primary` | 4.5 : 1 |
| `destructive-foreground` on `destructive` | 4.5 : 1 |
| `success-foreground` on `success` | 4.5 : 1 |
| `warning-foreground` on `warning` | 4.5 : 1 |
| `info-foreground` on `info` | 4.5 : 1 |
| `sidebar-foreground` on `sidebar` | 7.0 : 1 |
| `sidebar-accent-foreground` on `sidebar-accent` | 4.5 : 1 |
| `border` on `background` | 3.0 : 1 (non-text UI component) |
| each `chart-1..8` on `background` | 3.0 : 1 |
| each `chart-1..8` on `card` | 3.0 : 1 |

## Distinguishability requirements

| Check | Requirement |
|---|---|
| Every pair within `chart-1..8` | perceptibly distinct in normal vision |
| Every pair within `chart-1..8` | still distinct simulated under **deuteranopia** and **protanopia** |
| `success` vs `destructive` | distinct under deuteranopia — the most common confusion, and the one that matters most on a clinical status badge |
| `chart-seq-1..5` | monotonically increasing in darkness; adjacent steps distinguishable |
| `chart-div-1..5` | symmetric about the midpoint; the two ends clearly opposed |

---

## Validation output

`node scripts/check-tokens.mjs` must:

- parse the real `globals.css` — never a copy of the values
- check both `:root` and `.dark`
- report every pair with its measured ratio and pass/fail
- exit non-zero on any failure, so it can gate a commit
- print a readable table, not raw JSON
