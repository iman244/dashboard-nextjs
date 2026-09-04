#!/usr/bin/env node
/**
 * check-tokens.mjs — colour token contract validator
 * =============================================================================
 *
 * WHAT THIS CHECKS
 *   The binding spec is `docs/ui-ux/03-TOKEN-CONTRACT.md`. This script parses the
 *   *real* `src/app/globals.css` (never a copied snapshot of values) and verifies:
 *
 *     1. Presence   — every token the contract names exists in BOTH `:root` and
 *                     `.dark`, and no token is defined in only one theme.
 *     2. Contrast   — every pair in the contract's contrast table meets its stated
 *                     WCAG 2.1 minimum, in both themes.
 *     3. Distinguishability
 *                   — every pair within chart-1..8 perceptibly distinct in normal
 *                     vision and under simulated deuteranopia and protanopia;
 *                   — success vs destructive distinct under deuteranopia;
 *                   — chart-seq-1..5 monotonically darkening with distinguishable
 *                     adjacent steps;
 *                   — chart-div-1..5 symmetric about its midpoint with clearly
 *                     opposed ends.
 *
 *   Colour pipeline: OKLCH -> OKLab -> linear sRGB -> (clamp to gamut) ->
 *   gamma-encoded sRGB, plus WCAG 2.1 relative luminance and the
 *   (L1 + 0.05) / (L2 + 0.05) contrast ratio. Perceptual differences use CIEDE2000
 *   over CIELab (D65). Dichromacy simulation uses the Viénot/Brettel/Mollon (1999)
 *   LMS projection, applied in LINEAR sRGB.
 *
 *   Out-of-gamut OKLCH values are clamped after the linear-RGB step and flagged in
 *   the output — a colour outside sRGB will not render as computed, so any ratio
 *   measured from it is the ratio of the clamped colour, not the declared one.
 *
 * SELF-TEST
 *   Every run first validates the colour maths against independently known
 *   references (sRGB primaries' OKLCH coordinates, white-on-black = exactly 21:1,
 *   the classic #767676 grey at 4.54:1, and CIEDE2000 pairs from Sharma et al.'s
 *   published test set). If any of those fail, the script aborts rather than
 *   printing confidently wrong numbers.
 *
 * HOW TO RUN
 *   node scripts/check-tokens.mjs            # full report
 *   node scripts/check-tokens.mjs --selftest # colour maths self-test only
 *
 *   Exit code 0 = every contract check passed. Non-zero = at least one failed,
 *   so this can gate a commit. WARN rows are advisory and never affect the exit
 *   code — only requirements written into the contract can fail the run.
 * =============================================================================
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(HERE, "..", "src", "app", "globals.css");
const CONTRACT_PATH = "docs/ui-ux/03-TOKEN-CONTRACT.md";

/* ===========================================================================
 * 1. The contract, transcribed. Change 03-TOKEN-CONTRACT.md first, then this.
 * ======================================================================== */

const CHART_CAT = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"];
const CHART_SEQ = ["chart-seq-1", "chart-seq-2", "chart-seq-3", "chart-seq-4", "chart-seq-5"];
const CHART_DIV = ["chart-div-1", "chart-div-2", "chart-div-3", "chart-div-4", "chart-div-5"];

const REQUIRED_TOKENS = [
  // Neutrals — existing
  "background", "foreground", "card", "card-foreground", "popover",
  "popover-foreground", "muted", "muted-foreground", "border", "input",
  // Brand — existing
  "primary", "primary-foreground", "secondary", "secondary-foreground",
  "accent", "accent-foreground", "ring",
  // Semantic
  "destructive", "destructive-foreground",
  "success", "success-foreground",
  "warning", "warning-foreground",
  "info", "info-foreground",
  // Sidebar — existing, all eight
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  // Charts
  ...CHART_CAT, ...CHART_SEQ, ...CHART_DIV,
];

/** [foreground token, background token, required WCAG 2.1 ratio] */
const CONTRAST_PAIRS = [
  ["foreground", "background", 7.0],
  ["foreground", "card", 7.0],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["success-foreground", "success", 4.5],
  ["warning-foreground", "warning", 4.5],
  ["info-foreground", "info", 4.5],
  ["sidebar-foreground", "sidebar", 7.0],
  ["sidebar-accent-foreground", "sidebar-accent", 4.5],
  ["border", "background", 3.0],
  ...CHART_CAT.map((c) => [c, "background", 3.0]),
  ...CHART_CAT.map((c) => [c, "card", 3.0]),
];

/* ---------------------------------------------------------------------------
 * Perceptual thresholds — the metric and why these numbers.
 *
 * METRIC: CIEDE2000 (dE00) over CIELab/D65. Chosen over a raw OKLab Euclidean
 * distance because dE00 is the standardised, published, independently testable
 * metric (CIE 142:2001) — its lightness/chroma/hue weighting and the blue-region
 * rotation term are exactly the corrections that matter for a chart palette that
 * deliberately spreads hue at roughly constant lightness. It is also verifiable:
 * the self-test below checks this implementation against Sharma, Wu & Dalal's
 * published test data, so the threshold is measured with a known-good ruler.
 *
 * SCALE: dE00 ~= 1.0 is one just-noticeable difference for two large patches
 * side by side under controlled viewing. Chart marks are neither large nor
 * adjacent — a 2px line, a 10px legend swatch, an anti-aliased pie wedge seen
 * across a room on an uncalibrated clinical monitor. The published JND is
 * therefore a floor, not a target, and each threshold below is that floor
 * multiplied by the headroom its situation demands.
 * ------------------------------------------------------------------------ */

/**
 * Categorical chart colours, normal vision. ~15x JND. Small, separated,
 * anti-aliased marks that a reader must match back to a legend from memory;
 * this is roughly the separation a well-regarded categorical palette
 * (Tableau 10, Okabe-Ito) keeps between its nearest members, and it is
 * comfortably achievable by 8 hues spread around the wheel.
 */
const DE_CATEGORICAL = 15;

/**
 * Categorical chart colours under simulated dichromacy. ~10x JND. Under
 * deuteranopia or protanopia the visible gamut collapses to essentially a
 * 2-D plane (lightness x blue-yellow), so demanding the full 15 for all 28
 * pairs of an 8-colour set is not achievable by any palette. 10 is still an
 * order of magnitude above JND — enough that two marks read as different
 * colours rather than as a rendering artefact — while leaving a designable
 * palette. Below this, separation depends on lightness alone.
 */
const DE_DICHROMATIC = 10;

/**
 * success vs destructive under deuteranopia. Stricter than the chart bar
 * because only two colours must be separated (so the budget is not shared),
 * red/green is the single most common confusion, and the consequence of
 * confusing them on a clinical status badge is a misread result rather than
 * a misread chart. 15 forces a real lightness split, not just a hue change
 * that vanishes under simulation.
 */
const DE_SEMANTIC_DICHROMATIC = 15;

/**
 * Adjacent steps of the sequential and diverging ramps. ~8x JND — lower than
 * the categorical bar on purpose: ordered ramp steps are meant to read as
 * neighbours on one scale, and pushing them to 15 apiece would make a 5-step
 * ramp span so much lightness that the light end disappears into the page.
 * 8 keeps consecutive bins separable when stacked directly against each other,
 * which is how ramp steps are actually seen.
 */
const DE_ADJACENT_STEP = 8;

/** Diverging ends must be far apart and hue-opposed, not two shades of one idea. */
const DE_DIVERGING_ENDS = 30;
const DIVERGING_OPPOSED_HUE_DEG = 100;

/** Arm symmetry tolerance for the diverging ramp, as a fraction of the mean arm length. */
const DIVERGING_SYMMETRY_TOLERANCE = 0.25;

/* ===========================================================================
 * 2. Colour maths
 * ======================================================================== */

const DEG = Math.PI / 180;

/** OKLab -> linear sRGB (Björn Ottosson's matrices). */
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

/** linear sRGB -> OKLab (inverse of the above). */
function linearSrgbToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** Gamma-encode one linear sRGB channel (IEC 61966-2-1). */
function encodeGamma(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Linearise one gamma-encoded sRGB channel — the WCAG 2.1 inverse transfer function. */
function decodeGamma(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * WCAG 2.1 relative luminance from LINEAR sRGB.
 * WCAG defines L = 0.2126R + 0.7152G + 0.0722B over linearised channels; the
 * linear sRGB we get out of OKLab is exactly those linearised channels, so this
 * is applied directly rather than round-tripping through 8-bit.
 */
function relativeLuminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(y1, y2) {
  const hi = Math.max(y1, y2);
  const lo = Math.min(y1, y2);
  return (hi + 0.05) / (lo + 0.05);
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** linear sRGB -> CIEXYZ (D65). */
function linearSrgbToXyz([r, g, b]) {
  return [
    0.4123907993 * r + 0.3575843394 * g + 0.1804807884 * b,
    0.2126390059 * r + 0.7151686788 * g + 0.0721923154 * b,
    0.0193308187 * r + 0.1191947798 * g + 0.9505321522 * b,
  ];
}

const D65 = [0.95047, 1.0, 1.08883];

/** CIEXYZ (D65) -> CIELab. */
function xyzToLab([X, Y, Z]) {
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const fx = f(X / D65[0]);
  const fy = f(Y / D65[1]);
  const fz = f(Z / D65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const linearSrgbToLab = (lin) => xyzToLab(linearSrgbToXyz(lin));

/** CIEDE2000 (CIE 142:2001), kL = kC = kH = 1. Validated in the self-test. */
function deltaE00([L1, a1, b1], [L2, a2, b2]) {
  const P25_7 = Math.pow(25, 7);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + P25_7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const hueOf = (ap, bp) => {
    if (ap === 0 && bp === 0) return 0;
    const h = Math.atan2(bp, ap) / DEG;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hueOf(a1p, b1);
  const h2p = hueOf(a2p, b2);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * DEG) / 2);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * DEG) +
    0.24 * Math.cos(2 * hbarp * DEG) +
    0.32 * Math.cos((3 * hbarp + 6) * DEG) -
    0.20 * Math.cos((4 * hbarp - 63) * DEG);

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + P25_7));
  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(2 * dTheta * DEG) * RC;

  const tL = dLp / SL;
  const tC = dCp / SC;
  const tH = dHp / SH;
  return Math.sqrt(tL * tL + tC * tC + tH * tH + RT * tC * tH);
}

/* ---------------------------------------------------------------------------
 * Dichromacy simulation — Viénot, Brettel & Mollon (1999).
 * The Hunt-Pointer-Estevez-derived LMS transform used by that paper, applied to
 * LINEAR sRGB (applying it to gamma-encoded values is a well-known and wrong
 * shortcut that exaggerates the simulated difference).
 * ------------------------------------------------------------------------ */

const RGB_TO_LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
];
const LMS_TO_RGB = [
  [0.080944447900, -0.130504409000, 0.116721066000],
  [-0.010248533500, 0.054019326600, -0.113614708000],
  [-0.000365296938, -0.004121614690, 0.693511405000],
];

function mul3(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

/** kind: "normal" | "deuteranopia" | "protanopia" | "tritanopia". Linear sRGB in and out. */
function simulateDichromacy(lin, kind) {
  if (kind === "normal") return lin;
  const [L, M, S] = mul3(RGB_TO_LMS, lin.map(clamp01));
  let lms;
  if (kind === "protanopia") lms = [2.02344 * M - 2.52581 * S, M, S];
  else if (kind === "deuteranopia") lms = [L, 0.494207 * L + 1.24827 * S, S];
  else lms = [L, M, -0.395913 * L + 0.801109 * M];
  return mul3(LMS_TO_RGB, lms).map(clamp01);
}

/* ===========================================================================
 * 3. Colour value objects
 * ======================================================================== */

/** Build a colour record from LINEAR sRGB, recording whether it had to be clamped. */
function fromLinear(lin, alpha = 1, raw = null) {
  const clipped = lin.some((c) => c < -1e-6 || c > 1 + 1e-6);
  const linC = lin.map(clamp01);
  const srgb = linC.map(encodeGamma).map(clamp01);
  return {
    raw,
    alpha,
    lin: linC,
    clipped,
    srgb,
    hex: "#" + srgb.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join(""),
    Y: relativeLuminance(linC),
    lab: linearSrgbToLab(linC),
    oklab: linearSrgbToOklab(linC),
  };
}

/** Build a colour record from gamma-encoded sRGB (0..1). */
const fromSrgb = (srgb, alpha = 1, raw = null) => fromLinear(srgb.map(decodeGamma), alpha, raw);

const fromHex = (hex) => {
  const h = hex.replace("#", "");
  return fromSrgb([0, 1, 2].map((i) => parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255), 1, hex);
};

/** Source-over compositing, done in gamma-encoded sRGB — the CSS default space. */
function composite(fg, bg) {
  if (fg.alpha >= 1) return fg;
  const a = fg.alpha;
  const out = [0, 1, 2].map((i) => fg.srgb[i] * a + bg.srgb[i] * (1 - a));
  const c = fromSrgb(out, 1, fg.raw);
  c.composited = true;
  c.clipped = fg.clipped;
  return c;
}

/* ===========================================================================
 * 4. CSS parsing — structural, never value-dependent
 * ======================================================================== */

/**
 * Replace every CSS comment with a single space. Done before any structural
 * scanning so that a brace inside a comment cannot desynchronise the parser,
 * and so a comment between two tokens still separates them.
 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, " ");
}

/**
 * Collect every brace block in the stylesheet, recursing into at-rules so a
 * `:root` nested inside `@layer`/`@media` is still found.
 */
function collectBlocks(css, out = []) {
  let depth = 0;
  let selStart = 0;
  let bodyStart = 0;
  let selector = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) {
        selector = css.slice(selStart, i).trim();
        bodyStart = i + 1;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const body = css.slice(bodyStart, i);
        out.push({ selector, body });
        if (selector.startsWith("@")) collectBlocks(body, out);
        selStart = i + 1;
      }
    }
  }
  return out;
}

/** Does a (possibly comma-separated) selector list contain `target`? */
const selectorMatches = (selector, target) =>
  selector.split(",").some((s) => s.trim() === target);

/** Extract `--name: value` declarations from a block body, ignoring nested blocks. */
function parseDeclarations(body) {
  const flat = body.replace(/\{[^{}]*\}/g, " ");
  const decls = new Map();
  const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+)/g;
  let m;
  while ((m = re.exec(flat)) !== null) {
    decls.set(m[1].slice(2), m[2].trim());
  }
  return decls;
}

/** Parse a CSS number that may carry `%`, an angle unit, or the keyword `none`. */
function cssNumber(token, { percentBase = 1, angle = false } = {}) {
  const t = token.trim().toLowerCase();
  if (t === "none") return 0;
  if (t.endsWith("%")) return (parseFloat(t) / 100) * percentBase;
  if (angle) {
    if (t.endsWith("turn")) return parseFloat(t) * 360;
    if (t.endsWith("rad")) return (parseFloat(t) * 180) / Math.PI;
    if (t.endsWith("grad")) return parseFloat(t) * 0.9;
    return parseFloat(t); // bare number or `deg`
  }
  return parseFloat(t);
}

const OKLCH_RE = /^oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/]+)\s*(?:\/\s*([^\s)]+)\s*)?\)$/i;

/**
 * Parse an `oklch(...)` declaration value into a colour record.
 * Returns null (with a reason) for anything that is not a literal oklch colour.
 */
function parseOklchValue(value) {
  const v = value.trim().replace(/\s+/g, " ");
  const m = OKLCH_RE.exec(v);
  if (!m) return { ok: false, reason: v.startsWith("oklch(") ? "unparseable oklch()" : "not an oklch() literal" };
  const L = cssNumber(m[1], { percentBase: 1 });
  const C = cssNumber(m[2], { percentBase: 0.4 }); // CSS: 100% chroma == 0.4
  const H = cssNumber(m[3], { angle: true });
  const alpha = m[4] === undefined ? 1 : clamp01(cssNumber(m[4], { percentBase: 1 }));
  if (![L, C, H, alpha].every(Number.isFinite)) return { ok: false, reason: "non-numeric component" };
  const a = C * Math.cos(H * DEG);
  const b = C * Math.sin(H * DEG);
  const colour = fromLinear(oklabToLinearSrgb(L, a, b), alpha, v);
  colour.declared = { L, C, H };
  return { ok: true, colour };
}

/** Parse globals.css into { light: Map, dark: Map, unparseable: [...] }. */
function parseGlobalsCss(path) {
  const css = stripComments(readFileSync(path, "utf8"));
  const blocks = collectBlocks(css);

  const gather = (target) => {
    const merged = new Map();
    for (const block of blocks) {
      if (block.selector.startsWith("@")) continue;
      if (!selectorMatches(block.selector, target)) continue;
      for (const [k, v] of parseDeclarations(block.body)) merged.set(k, v);
    }
    return merged;
  };

  const rawLight = gather(":root");
  const rawDark = gather(".dark");
  if (rawLight.size === 0) fatal(`No \`:root\` custom properties found in ${path}. Parser needs updating.`);
  if (rawDark.size === 0) fatal(`No \`.dark\` custom properties found in ${path}. Parser needs updating.`);

  const unparseable = [];
  const convert = (raw, theme) => {
    const out = new Map();
    for (const [name, value] of raw) {
      const r = parseOklchValue(value);
      if (r.ok) out.set(name, r.colour);
      else if (/^oklch\(/i.test(value.trim()) || REQUIRED_TOKENS.includes(name)) {
        unparseable.push({ theme, name, value: value.trim(), reason: r.reason });
      }
    }
    return out;
  };

  return {
    light: convert(rawLight, "light"),
    dark: convert(rawDark, "dark"),
    rawLight,
    rawDark,
    unparseable,
  };
}

/* ===========================================================================
 * 5. Self-test — verify the maths against independently known references
 * ======================================================================== */

function runSelfTest() {
  const rows = [];
  let ok = true;
  const check = (name, actual, expected, tol, fmt = (x) => x.toFixed(4)) => {
    const pass = Math.abs(actual - expected) <= tol;
    if (!pass) ok = false;
    rows.push([name, fmt(actual), fmt(expected), pass]);
  };
  const checkStr = (name, actual, expected) => {
    const pass = actual === expected;
    if (!pass) ok = false;
    rows.push([name, String(actual), String(expected), pass]);
  };

  // (a) OKLCH -> sRGB against the published OKLCH coordinates of the sRGB primaries.
  checkStr("oklch(1 0 0) -> hex", parseOklchValue("oklch(1 0 0)").colour.hex, "#ffffff");
  checkStr("oklch(0 0 0) -> hex", parseOklchValue("oklch(0 0 0)").colour.hex, "#000000");
  checkStr("oklch(0.62796 0.25768 29.234) -> hex", parseOklchValue("oklch(0.62796 0.25768 29.234)").colour.hex, "#ff0000");
  checkStr("oklch(0.86644 0.29483 142.495) -> hex", parseOklchValue("oklch(0.86644 0.29483 142.495)").colour.hex, "#00ff00");
  checkStr("oklch(0.45201 0.31321 264.052) -> hex", parseOklchValue("oklch(0.45201 0.31321 264.052)").colour.hex, "#0000ff");
  checkStr("percent + alpha syntax parses", parseOklchValue("oklch(100% 0 0 / 50%)").colour.alpha.toFixed(2), "0.50");

  // (b) WCAG contrast against exactly-known references.
  const white = parseOklchValue("oklch(1 0 0)").colour;
  const black = parseOklchValue("oklch(0 0 0)").colour;
  check("white on black (must be exactly 21:1)", contrastRatio(white.Y, black.Y), 21.0, 1e-9, (x) => x.toFixed(6));
  // #767676 on white is the canonical "4.54:1" grey from the WCAG techniques.
  check("#767676 on #ffffff", contrastRatio(fromHex("#767676").Y, white.Y), 4.5422, 0.001);
  // #595959 on white is the canonical 7.0:1 AAA example.
  check("#595959 on #ffffff", contrastRatio(fromHex("#595959").Y, white.Y), 7.0047, 0.001);
  // Mid-grey sanity. NOTE: OKLab L is not CIE L*. oklch(0.5 0 0) is a *neutral*
  // with linear Y = 0.5^3 = 0.125 exactly, so it lands on 1.05/0.175 = 6.00:1
  // against white, not the ~4.5:1 that CIE-Lab intuition suggests. The grey that
  // does give ~4.54:1 is oklch(0.5658 0 0), i.e. #767676 — checked on the next
  // line, and it round-trips to the same hex as the reference above.
  const midGrey = parseOklchValue("oklch(0.5 0 0)").colour;
  checkStr("oklch(0.5 0 0) -> hex", midGrey.hex, "#636363");
  check("oklch(0.5 0 0) on white (exactly 6:1)", contrastRatio(midGrey.Y, white.Y), 6.0, 1e-9, (x) => x.toFixed(6));
  const grey45 = parseOklchValue("oklch(0.565836 0 0)").colour;
  checkStr("oklch(0.565836 0 0) -> hex", grey45.hex, "#767676");
  check("oklch(0.565836 0 0) on white (~4.54)", contrastRatio(grey45.Y, white.Y), 4.5422, 0.002);

  // (c) CIEDE2000 against Sharma, Wu & Dalal (2005) published test data.
  const SHARMA = [
    [[50.0000, 2.6772, -79.7751], [50.0000, 0.0000, -82.7485], 2.0425],
    [[50.0000, 3.1571, -77.2803], [50.0000, 0.0000, -82.7485], 2.8615],
    [[50.0000, -1.3802, -84.2814], [50.0000, 0.0000, -82.7485], 1.0000],
    [[50.0000, 0.0000, 0.0000], [50.0000, -1.0000, 2.0000], 2.3669],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.2630],
    [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
    [[22.7233, 20.0904, -46.6940], [23.0331, 14.9730, -42.5619], 2.0373],
    [[36.4612, 47.8580, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
    [[90.8027, -2.0831, 1.4410], [91.1528, -1.6435, 0.0447], 1.4441],
    [[2.0776, 0.0795, -1.1350], [0.9033, -0.0636, -0.5514], 0.9082],
  ];
  let worst = 0;
  for (const [a, b, expected] of SHARMA) worst = Math.max(worst, Math.abs(deltaE00(a, b) - expected));
  check(`CIEDE2000 vs Sharma et al. (${SHARMA.length} pairs, max error)`, worst, 0, 1e-4);

  // (d) Dichromacy simulation must be identity-preserving on greys and must
  //     collapse red and green toward each other under deuteranopia.
  const grey = fromHex("#808080");
  const greySim = fromLinear(simulateDichromacy(grey.lin, "deuteranopia"));
  check("deuteranopia leaves grey unchanged (dE00)", deltaE00(grey.lab, greySim.lab), 0, 1.0);
  const red = fromHex("#e00000");
  const green = fromHex("#00a000");
  const dNormal = deltaE00(red.lab, green.lab);
  const dDeut = deltaE00(
    fromLinear(simulateDichromacy(red.lin, "deuteranopia")).lab,
    fromLinear(simulateDichromacy(green.lin, "deuteranopia")).lab,
  );
  const collapses = dDeut < dNormal * 0.5;
  if (!collapses) ok = false;
  rows.push(["deuteranopia collapses red/green", `${dNormal.toFixed(1)} -> ${dDeut.toFixed(1)}`, "< 50% of normal", collapses]);

  return { ok, rows };
}

/* ===========================================================================
 * 6. Reporting helpers
 * ======================================================================== */

const USE_COLOUR = process.stdout.isTTY && !process.env.NO_COLOR;
const ESC = String.fromCharCode(27);
const paint = (code, s) => (USE_COLOUR ? `${ESC}[${code}m${s}${ESC}[0m` : s);

/** Visible length of a string, ignoring ANSI SGR sequences (no control chars in regex). */
function visibleLength(s) {
  let n = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === ESC) {
      while (i < s.length && s[i] !== "m") i++;
      i++;
    } else {
      n++;
      i++;
    }
  }
  return n;
}
const bold = (s) => paint("1", s);
const dim = (s) => paint("2", s);
const red = (s) => paint("31", s);
const green = (s) => paint("32", s);
const yellow = (s) => paint("33", s);

const OK = () => green("PASS");
const BAD = () => red("FAIL");
const WARN = () => yellow("WARN");

const failures = [];
const warnings = [];

function fatal(msg) {
  console.error(`\n${red("check-tokens: ")}${msg}\n`);
  process.exit(2);
}

function heading(text) {
  console.log(`\n${bold(text)}`);
  console.log(dim("=".repeat(Math.max(text.length, 78))));
}

function subheading(text) {
  console.log(`\n${bold(text)}`);
  console.log(dim("-".repeat(Math.max(text.length, 78))));
}

/** Render a table. `cols` = [{ label, width, align }]. Status strings are pre-painted. */
function table(cols, rows) {
  const line = cols
    .map((c) => (c.align === "right" ? c.label.padStart(c.width) : c.label.padEnd(c.width)))
    .join("  ");
  console.log(dim(line));
  for (const row of rows) {
    console.log(
      row
        .map((cell, i) => {
          const c = cols[i];
          const pad = Math.max(0, c.width - visibleLength(String(cell)));
          return c.align === "right" ? " ".repeat(pad) + cell : cell + " ".repeat(pad);
        })
        .join("  ")
        .trimEnd(),
    );
  }
}

/* ===========================================================================
 * 7. The checks
 * ======================================================================== */

function checkPresence(tokens) {
  heading("1. TOKEN PRESENCE");
  console.log(dim(`Contract: ${CONTRACT_PATH} — every listed token must exist in both :root and .dark.`));

  const rows = [];
  // A token declared as something other than an oklch() literal (e.g. `var(--x)`)
  // gets its own row further down; it is present, so don't also call it "missing".
  const declaredNotLiteral = (name, theme) =>
    tokens.unparseable.some((u) => u.name === name && u.theme === theme);

  for (const name of REQUIRED_TOKENS) {
    const inLight = tokens.light.has(name) || declaredNotLiteral(name, "light");
    const inDark = tokens.dark.has(name) || declaredNotLiteral(name, "dark");
    if (inLight && inDark) continue;
    let note;
    if (!inLight && !inDark) note = "missing from BOTH :root and .dark";
    else if (!inLight) note = "missing from :root (defined only in .dark)";
    else note = "missing from .dark (defined only in :root)";
    rows.push([`--${name}`, BAD(), note]);
    failures.push(`presence: --${name} ${note}`);
  }

  // Tokens present in one theme but not the other, even if not in the contract.
  const allNames = new Set([...tokens.light.keys(), ...tokens.dark.keys()]);
  for (const name of [...allNames].sort()) {
    if (REQUIRED_TOKENS.includes(name)) continue;
    const inLight = tokens.light.has(name) || declaredNotLiteral(name, "light");
    const inDark = tokens.dark.has(name) || declaredNotLiteral(name, "dark");
    if (inLight === inDark) continue;
    const note = inLight ? "defined in :root only" : "defined in .dark only";
    rows.push([`--${name}`, BAD(), `${note} (not in contract, but themes must agree)`]);
    failures.push(`presence: --${name} ${note}`);
  }

  for (const u of tokens.unparseable) {
    rows.push([`--${u.name}`, BAD(), `${u.theme}: ${u.reason} — \`${u.value}\``]);
    failures.push(`parse: --${u.name} in ${u.theme}: ${u.reason}`);
  }

  if (rows.length === 0) {
    console.log(`\n  ${OK()}  all ${REQUIRED_TOKENS.length} contract tokens present in both themes, all oklch().`);
    return;
  }
  console.log("");
  table(
    [
      { label: "TOKEN", width: 30 },
      { label: "STATUS", width: 6 },
      { label: "DETAIL", width: 60 },
    ],
    rows,
  );
  console.log(
    `\n  ${rows.length} presence problem${rows.length === 1 ? "" : "s"} ` +
      dim(`(${REQUIRED_TOKENS.length} tokens required by the contract)`),
  );
}

function checkGamut(tokens) {
  const rows = [];
  for (const [theme, map] of [["light (:root)", tokens.light], ["dark  (.dark)", tokens.dark]]) {
    for (const [name, c] of map) {
      if (!c.clipped) continue;
      rows.push([
        theme,
        `--${name}`,
        c.raw,
        c.hex,
        `L=${c.declared.L.toFixed(3)} C=${c.declared.C.toFixed(3)}`,
      ]);
    }
  }
  if (rows.length === 0) return;
  subheading("OUT-OF-GAMUT VALUES (clamped)");
  console.log(
    dim(
      "These OKLCH values fall outside sRGB. They were clamped to [0,1] after the linear-RGB\n" +
        "step, so every ratio below is measured on the CLAMPED colour — which is what a browser\n" +
        "will actually paint. The declared colour will not render as computed.",
    ),
  );
  console.log("");
  table(
    [
      { label: "THEME", width: 14 },
      { label: "TOKEN", width: 26 },
      { label: "DECLARED", width: 30 },
      { label: "CLAMPED", width: 9 },
      { label: "", width: 24 },
    ],
    rows,
  );
  warnings.push(`${rows.length} token(s) out of sRGB gamut and clamped`);
}

function checkContrast(theme, label, map, missingNote) {
  subheading(`${label} — contrast (WCAG 2.1)`);
  const rows = [];
  let failed = 0;
  let skipped = 0;

  const bg0 = map.get("background");

  for (const [fgName, bgName, min] of CONTRAST_PAIRS) {
    const fgRaw = map.get(fgName);
    const bgRaw = map.get(bgName);
    if (!fgRaw || !bgRaw) {
      skipped++;
      rows.push([`${fgName} on ${bgName}`, "—", min.toFixed(1), dim("SKIP"), dim(missingNote(fgRaw, bgRaw, fgName, bgName))]);
      continue;
    }
    // A translucent backdrop is itself composited over the theme background first.
    const bg = bgRaw.alpha < 1 && bg0 ? composite(bgRaw, bg0) : bgRaw;
    const fg = fgRaw.alpha < 1 ? composite(fgRaw, bg) : fgRaw;
    const ratio = contrastRatio(fg.Y, bg.Y);
    const pass = ratio + 1e-9 >= min;
    if (!pass) {
      failed++;
      failures.push(`contrast [${theme}]: ${fgName} on ${bgName} = ${ratio.toFixed(2)}:1 (needs ${min.toFixed(1)}:1)`);
    }
    const notes = [];
    if (fgRaw.alpha < 1) notes.push(`fg α=${fgRaw.alpha.toFixed(2)} composited`);
    if (bgRaw.alpha < 1) notes.push(`bg α=${bgRaw.alpha.toFixed(2)} composited`);
    if (fgRaw.clipped) notes.push("fg clamped to gamut");
    if (bgRaw.clipped) notes.push("bg clamped to gamut");
    rows.push([
      `${fgName} on ${bgName}`,
      `${ratio.toFixed(2)}:1`,
      min.toFixed(1),
      pass ? OK() : BAD(),
      dim(`${fg.hex} on ${bg.hex}${notes.length ? "  — " + notes.join(", ") : ""}`),
    ]);
  }

  console.log("");
  table(
    [
      { label: "PAIR", width: 46 },
      { label: "MEASURED", width: 9, align: "right" },
      { label: "MIN", width: 5, align: "right" },
      { label: "STATUS", width: 6 },
      { label: "NOTES", width: 52 },
    ],
    rows,
  );
  console.log(
    `\n  ${CONTRAST_PAIRS.length - skipped - failed} passed, ${failed} failed` +
      (skipped ? `, ${skipped} skipped (token missing)` : ""),
  );
}

/** Perceptual distance between two colour records under a given vision model. */
function perceptualDistance(c1, c2, vision) {
  if (vision === "normal") return deltaE00(c1.lab, c2.lab);
  const a = fromLinear(simulateDichromacy(c1.lin, vision));
  const b = fromLinear(simulateDichromacy(c2.lin, vision));
  return deltaE00(a.lab, b.lab);
}

function checkCategoricalDistinct(theme, label, map) {
  subheading(`${label} — categorical chart distinguishability (chart-1..8)`);

  const present = CHART_CAT.filter((n) => map.has(n));
  const missing = CHART_CAT.filter((n) => !map.has(n));
  if (present.length < 2) {
    console.log(`\n  ${dim("SKIP")}  fewer than two of chart-1..8 defined; nothing to compare.`);
    return;
  }
  if (missing.length) {
    console.log(dim(`\n  Not defined, excluded from the comparison: ${missing.join(", ")}`));
  }

  const modes = [
    ["normal vision", "normal", DE_CATEGORICAL],
    ["deuteranopia", "deuteranopia", DE_DICHROMATIC],
    ["protanopia", "protanopia", DE_DICHROMATIC],
  ];

  const rows = [];
  for (const [modeLabel, vision, threshold] of modes) {
    let min = Infinity;
    let minPair = "";
    const bad = [];
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const d = perceptualDistance(map.get(present[i]), map.get(present[j]), vision);
        if (d < min) {
          min = d;
          minPair = `${present[i]} / ${present[j]}`;
        }
        if (d < threshold) bad.push([`${present[i]} / ${present[j]}`, d]);
      }
    }
    const pass = bad.length === 0;
    // Colour-vision deficiency is measured and reported, but does not gate.
    // Descoped by the product owner on 2026-09-05; see the contract.
    const contractual = vision === "normal";
    if (!pass && contractual) {
      failures.push(
        `distinct [${theme}] chart-1..8 under ${modeLabel}: ${bad.length} pair(s) below ΔE00 ${threshold} ` +
          `(worst ${minPair} = ${min.toFixed(1)})`,
      );
    } else if (!pass) {
      warnings.push(
        `[${theme}] chart-1..8 under ${modeLabel}: ${bad.length} pair(s) below ΔE00 ${threshold} ` +
          `(worst ${minPair} = ${min.toFixed(1)})`,
      );
    }
    rows.push([
      modeLabel,
      `${((present.length * (present.length - 1)) / 2)}`,
      min.toFixed(1),
      threshold.toFixed(0),
      pass ? OK() : BAD(),
      pass ? dim("all pairs clear") : red(`${bad.length} pair(s) too close, worst: ${minPair}`),
    ]);
    for (const [pairName, d] of bad.slice(0, 12)) {
      rows.push([dim(`    ${pairName}`), "", dim(d.toFixed(1)), dim(threshold.toFixed(0)), BAD(), ""]);
    }
    if (bad.length > 12) rows.push([dim(`    … and ${bad.length - 12} more`), "", "", "", "", ""]);
  }

  console.log("");
  table(
    [
      { label: "VISION MODEL", width: 34 },
      { label: "PAIRS", width: 5, align: "right" },
      { label: "MIN ΔE", width: 7, align: "right" },
      { label: "REQ", width: 4, align: "right" },
      { label: "STATUS", width: 6 },
      { label: "NOTES", width: 48 },
    ],
    rows,
  );
}

function checkSemanticDistinct(theme, label, map) {
  subheading(`${label} — success vs destructive under deuteranopia`);
  const s = map.get("success");
  const d = map.get("destructive");
  if (!s || !d) {
    console.log(`\n  ${dim("SKIP")}  ${!s ? "--success" : ""}${!s && !d ? " and " : ""}${!d ? "--destructive" : ""} not defined.`);
    return;
  }
  const rows = [];
  for (const [modeLabel, vision, threshold] of [
    ["normal vision", "normal", DE_CATEGORICAL],
    ["deuteranopia", "deuteranopia", DE_SEMANTIC_DICHROMATIC],
    ["protanopia", "protanopia", DE_SEMANTIC_DICHROMATIC],
  ]) {
    const dist = perceptualDistance(s, d, vision);
    const pass = dist >= threshold;
    // Colour-vision deficiency is measured and reported, but does not gate.
    // Descoped by the product owner on 2026-09-05; see the contract.
    const contractual = vision === "normal";
    if (!pass && contractual) {
      failures.push(`distinct [${theme}]: success vs destructive under ${modeLabel} = ΔE00 ${dist.toFixed(1)} (needs ${threshold})`);
    } else if (!pass) {
      warnings.push(`[${theme}] success vs destructive under ${modeLabel} = ΔE00 ${dist.toFixed(1)}`);
    }
    rows.push([
      modeLabel + (contractual ? "" : dim("  (advisory)")),
      dist.toFixed(1),
      threshold.toFixed(0),
      pass ? OK() : contractual ? BAD() : WARN(),
    ]);
  }
  console.log("");
  table(
    [
      { label: "VISION MODEL", width: 34 },
      { label: "ΔE00", width: 7, align: "right" },
      { label: "REQ", width: 4, align: "right" },
      { label: "STATUS", width: 6 },
    ],
    rows,
  );
}

function checkSequential(theme, label, map) {
  subheading(`${label} — sequential ramp (chart-seq-1..5)`);
  const present = CHART_SEQ.filter((n) => map.has(n));
  if (present.length !== CHART_SEQ.length) {
    console.log(
      `\n  ${dim("SKIP")}  ramp incomplete — missing ${CHART_SEQ.filter((n) => !map.has(n)).join(", ")}` +
        dim("  (already reported as a presence failure)"),
    );
    return;
  }
  const cols = CHART_SEQ.map((n) => map.get(n));

  const rows = cols.map((c, i) => {
    const prev = i > 0 ? cols[i - 1] : null;
    const darker = prev ? c.Y < prev.Y : true;
    const step = prev ? deltaE00(prev.lab, c.lab) : null;
    const stepOk = step === null || step >= DE_ADJACENT_STEP;
    return [
      `--${CHART_SEQ[i]}`,
      c.hex,
      c.Y.toFixed(4),
      step === null ? dim("—") : step.toFixed(1),
      prev === null ? dim("—") : darker ? OK() : BAD(),
      step === null ? dim("—") : stepOk ? OK() : BAD(),
    ];
  });

  let monotone = true;
  let stepsOk = true;
  for (let i = 1; i < cols.length; i++) {
    if (!(cols[i].Y < cols[i - 1].Y)) monotone = false;
    if (deltaE00(cols[i - 1].lab, cols[i].lab) < DE_ADJACENT_STEP) stepsOk = false;
  }
  const reversed = cols.every((c, i) => i === 0 || c.Y > cols[i - 1].Y);

  console.log("");
  table(
    [
      { label: "TOKEN", width: 16 },
      { label: "HEX", width: 9 },
      { label: "LUMINANCE", width: 9, align: "right" },
      { label: "ΔE00 PREV", width: 9, align: "right" },
      { label: "DARKER", width: 6 },
      { label: "STEP", width: 6 },
    ],
    rows,
  );
  if (!monotone) {
    failures.push(
      `sequential [${theme}]: chart-seq-1..5 is not monotonically darkening` +
        (reversed ? " (it runs dark -> light; the contract specifies light -> dark)" : ""),
    );
    console.log(
      `\n  ${BAD()}  not monotonically darkening` +
        (reversed ? red(" — the ramp runs dark → light; the contract specifies light → dark") : ""),
    );
  } else {
    console.log(`\n  ${OK()}  monotonically darkening, luminance ${cols[0].Y.toFixed(4)} → ${cols[4].Y.toFixed(4)}`);
  }
  if (!stepsOk) {
    failures.push(`sequential [${theme}]: adjacent steps below ΔE00 ${DE_ADJACENT_STEP}`);
    console.log(`  ${BAD()}  at least one adjacent step is below ΔE00 ${DE_ADJACENT_STEP}`);
  } else {
    console.log(`  ${OK()}  every adjacent step ≥ ΔE00 ${DE_ADJACENT_STEP}`);
  }
}

function checkDiverging(theme, label, map) {
  subheading(`${label} — diverging ramp (chart-div-1..5)`);
  const present = CHART_DIV.filter((n) => map.has(n));
  if (present.length !== CHART_DIV.length) {
    console.log(
      `\n  ${dim("SKIP")}  ramp incomplete — missing ${CHART_DIV.filter((n) => !map.has(n)).join(", ")}` +
        dim("  (already reported as a presence failure)"),
    );
    return;
  }
  const c = CHART_DIV.map((n) => map.get(n));
  const mid = c[2];

  // Hue/chroma read back from the rendered (clamped) colour, not the declared value.
  const okHue = (col) => {
    const [, a, b] = col.oklab;
    return ((Math.atan2(b, a) / DEG) + 360) % 360;
  };
  const okChroma = (col) => Math.hypot(col.oklab[1], col.oklab[2]);

  console.log("");
  table(
    [
      { label: "TOKEN", width: 16 },
      { label: "HEX", width: 9 },
      { label: "LUMINANCE", width: 9, align: "right" },
      { label: "OKLCH C", width: 8, align: "right" },
      { label: "OKLCH H", width: 8, align: "right" },
      { label: "ΔE00 TO MID", width: 11, align: "right" },
    ],
    c.map((col, i) => [
      `--${CHART_DIV[i]}`,
      col.hex,
      col.Y.toFixed(4),
      okChroma(col).toFixed(3),
      okHue(col).toFixed(1),
      i === 2 ? dim("—") : deltaE00(col.lab, mid.lab).toFixed(1),
    ]),
  );
  console.log("");

  const results = [];

  // (a) Arm symmetry: the two halves must reach comparably far from the midpoint.
  const armOuter = [deltaE00(c[0].lab, mid.lab), deltaE00(c[4].lab, mid.lab)];
  const armInner = [deltaE00(c[1].lab, mid.lab), deltaE00(c[3].lab, mid.lab)];
  const symmetric = (pair, name) => {
    const mean = (pair[0] + pair[1]) / 2;
    const skew = mean === 0 ? 1 : Math.abs(pair[0] - pair[1]) / mean;
    const pass = skew <= DIVERGING_SYMMETRY_TOLERANCE;
    if (!pass) {
      failures.push(
        `diverging [${theme}]: ${name} arms asymmetric — ΔE00 ${pair[0].toFixed(1)} vs ${pair[1].toFixed(1)} ` +
          `(${(skew * 100).toFixed(0)}% skew, tolerance ${(DIVERGING_SYMMETRY_TOLERANCE * 100).toFixed(0)}%)`,
      );
    }
    results.push([
      `${name} arms symmetric about --chart-div-3`,
      `${pair[0].toFixed(1)} vs ${pair[1].toFixed(1)}`,
      `≤ ${(DIVERGING_SYMMETRY_TOLERANCE * 100).toFixed(0)}% skew (${(skew * 100).toFixed(0)}%)`,
      pass ? OK() : BAD(),
    ]);
  };
  symmetric(armOuter, "outer (1 / 5)");
  symmetric(armInner, "inner (2 / 4)");

  // (b) The midpoint must be the least saturated step — that is what makes it read as neutral.
  const midIsNeutral = c.every((col, i) => i === 2 || okChroma(col) > okChroma(mid) + 1e-6);
  if (!midIsNeutral) {
    failures.push(`diverging [${theme}]: --chart-div-3 is not the least saturated step; it cannot read as the neutral midpoint`);
  }
  results.push([
    "--chart-div-3 is the neutral midpoint",
    `C = ${okChroma(mid).toFixed(3)}`,
    "lowest chroma of the five",
    midIsNeutral ? OK() : BAD(),
  ]);

  // (c) Ends clearly opposed: far apart AND on opposite sides of the hue circle.
  const endDelta = deltaE00(c[0].lab, c[4].lab);
  let hueGap = Math.abs(okHue(c[0]) - okHue(c[4])) % 360;
  if (hueGap > 180) hueGap = 360 - hueGap;
  const opposed = endDelta >= DE_DIVERGING_ENDS && hueGap >= DIVERGING_OPPOSED_HUE_DEG;
  if (!opposed) {
    failures.push(
      `diverging [${theme}]: ends not clearly opposed — ΔE00 ${endDelta.toFixed(1)} (needs ${DE_DIVERGING_ENDS}), ` +
        `hue gap ${hueGap.toFixed(0)}° (needs ${DIVERGING_OPPOSED_HUE_DEG}°)`,
    );
  }
  results.push([
    "--chart-div-1 vs --chart-div-5 clearly opposed",
    `ΔE00 ${endDelta.toFixed(1)}, Δhue ${hueGap.toFixed(0)}°`,
    `≥ ${DE_DIVERGING_ENDS} and ≥ ${DIVERGING_OPPOSED_HUE_DEG}°`,
    opposed ? OK() : BAD(),
  ]);

  // (d) Advisory: adjacent steps separable. Not written into the contract, so WARN only.
  let worstStep = Infinity;
  for (let i = 1; i < c.length; i++) worstStep = Math.min(worstStep, deltaE00(c[i - 1].lab, c[i].lab));
  const stepsOk = worstStep >= DE_ADJACENT_STEP;
  if (!stepsOk) warnings.push(`[${theme}] chart-div adjacent step ΔE00 ${worstStep.toFixed(1)} < ${DE_ADJACENT_STEP}`);
  results.push([
    "adjacent steps separable" + dim("  (advisory)"),
    `min ΔE00 ${worstStep.toFixed(1)}`,
    `≥ ${DE_ADJACENT_STEP}`,
    stepsOk ? OK() : WARN(),
  ]);

  table(
    [
      { label: "CHECK", width: 50 },
      { label: "MEASURED", width: 24 },
      { label: "REQUIRED", width: 32 },
      { label: "STATUS", width: 6 },
    ],
    results,
  );
}

/* ===========================================================================
 * 8. Main
 * ======================================================================== */

function printSelfTest(result) {
  heading("0. COLOUR MATHS SELF-TEST");
  console.log(
    dim(
      "Verified against independently known references before any token is measured, so a\n" +
        "subtly wrong transform fails loudly instead of producing confident wrong numbers.",
    ),
  );
  console.log("");
  table(
    [
      { label: "REFERENCE", width: 46 },
      { label: "COMPUTED", width: 20, align: "right" },
      { label: "EXPECTED", width: 20, align: "right" },
      { label: "STATUS", width: 6 },
    ],
    result.rows.map(([n, a, e, pass]) => [n, a, e, pass ? OK() : BAD()]),
  );
}

function main() {
  const selfTestOnly = process.argv.includes("--selftest");

  const selfTest = runSelfTest();
  printSelfTest(selfTest);
  if (!selfTest.ok) {
    fatal("colour maths self-test FAILED. The conversions are wrong — do not trust any measurement below.");
  }
  console.log(`\n  ${OK()}  colour maths verified (${selfTest.rows.length} references).`);
  if (selfTestOnly) process.exit(0);

  let tokens;
  try {
    tokens = parseGlobalsCss(CSS_PATH);
  } catch (err) {
    fatal(`could not read ${CSS_PATH}\n  ${err.message}`);
  }

  console.log(
    `\n${dim(`Parsed ${CSS_PATH}`)}\n` +
      dim(`  :root  — ${tokens.rawLight.size} custom properties, ${tokens.light.size} oklch() colours`) +
      `\n${dim(`  .dark  — ${tokens.rawDark.size} custom properties, ${tokens.dark.size} oklch() colours`)}`,
  );

  checkPresence(tokens);
  checkGamut(tokens);

  const missingNote = (fg, bg, fgName, bgName) => {
    const gone = [!fg && `--${fgName}`, !bg && `--${bgName}`].filter(Boolean);
    return `${gone.join(" and ")} not defined`;
  };

  const themes = [
    ["light", "LIGHT THEME (:root)", tokens.light],
    ["dark", "DARK THEME (.dark)", tokens.dark],
  ];

  heading("2. CONTRAST");
  console.log(dim("WCAG 2.1 (L1 + 0.05) / (L2 + 0.05); translucent tokens composited over their backdrop."));
  for (const [theme, label, map] of themes) checkContrast(theme, label, map, missingNote);

  heading("3. DISTINGUISHABILITY");
  console.log(
    dim(
      `Metric: CIEDE2000 over CIELab/D65. Thresholds — categorical ${DE_CATEGORICAL}, ` +
        `dichromatic ${DE_DICHROMATIC}, semantic/dichromatic ${DE_SEMANTIC_DICHROMATIC},\n` +
        `adjacent ramp step ${DE_ADJACENT_STEP}. Dichromacy simulated with the Viénot/Brettel/Mollon LMS ` +
        `projection in linear sRGB.`,
    ),
  );
  for (const [theme, label, map] of themes) {
    checkCategoricalDistinct(theme, label, map);
    checkSemanticDistinct(theme, label, map);
    checkSequential(theme, label, map);
    checkDiverging(theme, label, map);
  }

  heading("SUMMARY");
  if (warnings.length) {
    console.log(`\n${yellow(`${warnings.length} warning${warnings.length === 1 ? "" : "s"}`)} ${dim("(advisory, do not affect the exit code)")}`);
    for (const w of warnings) console.log(`  ${yellow("•")} ${w}`);
  }
  if (failures.length === 0) {
    console.log(`\n  ${green("✔")} ${bold("All contract checks passed.")}  ${dim(CONTRACT_PATH)}\n`);
    process.exit(0);
  }
  console.log(`\n${red(`${failures.length} failure${failures.length === 1 ? "" : "s"}`)} ${dim(`against ${CONTRACT_PATH}`)}\n`);
  for (const f of failures) console.log(`  ${red("✘")} ${f}`);
  console.log("");
  process.exit(1);
}

main();
