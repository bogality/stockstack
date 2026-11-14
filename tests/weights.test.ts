import { describe, expect, it } from "vitest";
import { addItem, bumpWeight, equalize, removeItem, totalWeight } from "../src/lib/weights";

const stack = [
  { symbol: "NVDA", weight: 40 },
  { symbol: "META", weight: 30 },
  { symbol: "AAPL", weight: 30 },
];

describe("weights", () => {
  it("raising one item takes from the largest other item", () => {
    const next = bumpWeight(stack, 1, 5);
    expect(next.map((i) => i.weight)).toEqual([35, 35, 30]);
    expect(totalWeight(next)).toBe(100);
  });

  it("lowering one item gives to the smallest other item", () => {
    const next = bumpWeight(stack, 0, -5);
    expect(next.map((i) => i.weight)).toEqual([35, 35, 30]);
  });

  it("refuses changes that would push any item below the minimum", () => {
    const tight = [
      { symbol: "A", weight: 90 },
      { symbol: "B", weight: 5 },
      { symbol: "C", weight: 5 },
    ];
    expect(bumpWeight(tight, 1, -5)).toBe(tight);
    expect(bumpWeight(tight, 0, 5)).toBe(tight);
    expect(bumpWeight([{ symbol: "A", weight: 100 }], 0, 5)).toEqual([{ symbol: "A", weight: 100 }]);
  });

  it("always totals 100 after any sequence of changes", () => {
    let items = stack;
    const moves: [number, number][] = [[0, 5], [0, 5], [2, -5], [1, 5], [0, -5], [2, 5], [1, -5], [1, -5], [0, 5]];
    for (const [index, delta] of moves) {
      items = bumpWeight(items, index, delta);
      expect(totalWeight(items)).toBe(100);
      expect(items.every((i) => i.weight >= 5)).toBe(true);
    }
  });

  it("adds a stock by taking its starting weight from the largest", () => {
    const next = addItem(stack, "TSLA");
    expect(next.map((i) => i.weight)).toEqual([30, 30, 30, 10]);
    expect(addItem(stack, "NVDA")).toBe(stack);
    expect(addItem([], "SPY")).toEqual([{ symbol: "SPY", weight: 100 }]);
  });

  it("removes a stock and returns its weight to the largest remaining", () => {
    expect(removeItem(stack, 2).map((i) => i.weight)).toEqual([70, 30]);
    expect(removeItem([{ symbol: "A", weight: 100 }], 0)).toEqual([]);
  });

  it("equalizes to whole percents that total 100", () => {
    expect(equalize(stack).map((i) => i.weight)).toEqual([34, 33, 33]);
    const seven = equalize(Array.from({ length: 7 }, (_, i) => ({ symbol: `S${i}`, weight: 1 })));
    expect(totalWeight(seven)).toBe(100);
  });
});
