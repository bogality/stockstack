import type { StackItem } from "./types";

export const WEIGHT_STEP = 5;
export const MIN_WEIGHT = 5;
export const MAX_ITEMS = 10;

/**
 * Change one item's weight by `delta` and take the difference from (or give
 * it to) another item, so the stack always totals 100%. Returns the same
 * array when the change isn't possible.
 */
export function bumpWeight(items: StackItem[], index: number, delta: number): StackItem[] {
  const next = items[index].weight + delta;
  if (items.length < 2 || next < MIN_WEIGHT) return items;
  let other = -1;
  items.forEach((item, i) => {
    if (i === index) return;
    if (delta > 0 && item.weight - delta < MIN_WEIGHT) return;
    if (other === -1) other = i;
    else if (delta > 0 ? item.weight > items[other].weight : item.weight < items[other].weight) other = i;
  });
  if (other === -1) return items;
  return items.map((item, i) =>
    i === index ? { ...item, weight: next } : i === other ? { ...item, weight: item.weight - delta } : item,
  );
}

/** Add a stock, funding its starting weight from the largest existing item. */
export function addItem(items: StackItem[], symbol: string): StackItem[] {
  if (items.some((i) => i.symbol === symbol) || items.length >= MAX_ITEMS) return items;
  if (items.length === 0) return [{ symbol, weight: 100 }];
  let largest = 0;
  items.forEach((item, i) => {
    if (item.weight > items[largest].weight) largest = i;
  });
  const start = Math.min(10, items[largest].weight - MIN_WEIGHT);
  if (start < MIN_WEIGHT) return items;
  return [...items.map((item, i) => (i === largest ? { ...item, weight: item.weight - start } : item)), { symbol, weight: start }];
}

/** Remove a stock and hand its weight to the largest remaining item. */
export function removeItem(items: StackItem[], index: number): StackItem[] {
  const removed = items[index];
  const rest = items.filter((_, i) => i !== index);
  if (rest.length === 0) return rest;
  let largest = 0;
  rest.forEach((item, i) => {
    if (item.weight > rest[largest].weight) largest = i;
  });
  return rest.map((item, i) => (i === largest ? { ...item, weight: item.weight + removed.weight } : item));
}

/** Spread 100% as evenly as whole percents allow; the first items take the extra points. */
export function equalize(items: StackItem[]): StackItem[] {
  if (items.length === 0) return items;
  const base = Math.floor(100 / items.length);
  const extra = 100 - base * items.length;
  return items.map((item, i) => ({ ...item, weight: base + (i < extra ? 1 : 0) }));
}

export function totalWeight(items: StackItem[]): number {
  return items.reduce((sum, item) => sum + item.weight, 0);
}
