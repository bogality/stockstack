import { describe, expect, it } from "vitest";
import { allocate, applySlippage } from "../src/lib/allocate";

describe("allocate", () => {
  it("takes the fee off the top and splits the rest by weight", () => {
    // $500.00 with 6 decimals, 0.25% fee
    const result = allocate(500_000_000n, [40, 30, 30], 25n);
    expect(result.feeRaw).toBe(1_250_000n);
    expect(result.investRaw).toBe(498_750_000n);
    expect(result.amounts).toEqual([199_500_000n, 149_625_000n, 149_625_000n]);
  });

  it("never strands or overspends a unit, whatever the rounding", () => {
    for (const total of [1_000_000n, 333_333_333n, 999_999_999n, 10_000_001n]) {
      for (const weights of [[100], [50, 50], [33, 33, 34], [25, 20, 15, 15, 15, 10], [5, 5, 90]]) {
        const { feeRaw, amounts } = allocate(total, weights, 25n);
        expect(feeRaw + amounts.reduce((a, b) => a + b, 0n)).toBe(total);
      }
    }
  });

  it("rejects weights that don't total 100", () => {
    expect(() => allocate(1_000_000n, [50, 40], 25n)).toThrow(/100%/);
  });

  it("rejects an empty stack and a zero amount", () => {
    expect(() => allocate(1_000_000n, [], 25n)).toThrow();
    expect(() => allocate(0n, [100], 25n)).toThrow();
  });

  it("rejects amounts too small to give every item something", () => {
    expect(() => allocate(10n, [5, 95], 25n)).toThrow(/too small/);
  });
});

describe("applySlippage", () => {
  it("lowers the minimum by the slippage limit", () => {
    expect(applySlippage(1_000_000n, 50n)).toBe(995_000n);
    expect(applySlippage(1_000_000n, 0n)).toBe(1_000_000n);
  });
});
