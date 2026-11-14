/** Aurora ramp: violet for the largest block, pale sky for the smallest. */
const STOPS = ["#8E72FF", "#7A86FF", "#6B9CFF", "#6BB4FF", "#86CCFF", "#B5E2FF"];

const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** `count` colors spread evenly along the ramp. */
export function ramp(count: number): string[] {
  if (count <= 1) return [STOPS[0]];
  return Array.from({ length: count }, (_, i) => {
    const position = (i / (count - 1)) * (STOPS.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(STOPS.length - 1, lower + 1);
    const t = position - lower;
    const a = parse(STOPS[lower]);
    const b = parse(STOPS[upper]);
    return toHex(a.map((v, k) => v + (b[k] - v) * t));
  });
}
