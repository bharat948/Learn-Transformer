/**
 * Data-visualization tokens.
 *
 * The interface itself is near-monochrome, so figures are the only place saturated
 * colour appears — which is exactly where the eye should go. These hues are
 * deliberately desaturated to sit on the warm paper background rather than vibrate
 * against it, and they stay distinguishable in greyscale print.
 */

export const INK = '#1c1b19'
export const INK_MUTED = '#5c5852'
export const INK_FAINT = '#726d64'
export const RULE = '#e4e0d9'
export const RULE_STRONG = '#cec9bf'
export const PAPER = '#faf9f7'
export const SURFACE_SUNK = '#f2efe9'

/** The single UI accent, reused as the primary series colour. */
export const ACCENT = '#a8422a'

/** Categorical series — attention heads, model variants, classes. */
export const CATEGORICAL = [
  '#a8422a', // rust
  '#2f6b6e', // deep teal
  '#9a7429', // ochre
  '#55617a', // slate blue
  '#6d4c6e', // plum
  '#3f6b3f', // moss
]

export const series = (i: number) => CATEGORICAL[i % CATEGORICAL.length]

/** Comparison pairs where one series is "ours" and one is the foil. */
export const PRIMARY = ACCENT
export const SECONDARY = '#55617a'

/**
 * Sequential ramp for intensity (attention weights, encoding magnitude).
 * Interpolates paper -> hue, so 0 disappears into the page and 1 is full strength.
 */
export function ramp(value: number, hex: string = ACCENT): string {
  const t = Math.max(0, Math.min(1, value))
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [pr, pg, pb] = [250, 249, 247] // paper
  const mix = (from: number, to: number) => Math.round(from + (to - from) * t)
  return `rgb(${mix(pr, r)}, ${mix(pg, g)}, ${mix(pb, b)})`
}

/**
 * Diverging ramp for signed values (positional encodings run -1..1).
 * Negative goes slate-blue, positive goes rust, zero is paper.
 */
export function diverging(value: number): string {
  const t = Math.max(-1, Math.min(1, value))
  return t >= 0 ? ramp(t, ACCENT) : ramp(-t, SECONDARY)
}
