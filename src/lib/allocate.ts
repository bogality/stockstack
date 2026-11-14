const BPS = 10_000n;

export interface Allocation {
  feeRaw: bigint;
  investRaw: bigint;
  /** Amount of pay token for each item, in the same order as the weights. */
  amounts: bigint[];
}

/**
 * Split a total spend into the app fee and one amount per stack item.
 *
 * The fee comes off the top. Each item gets its weight's share of what is
 * left, and the last item gets the exact remainder so nothing is stranded
 * by rounding.
 */
export function allocate(totalRaw: bigint, weights: number[], feeBps: bigint): Allocation {
  if (totalRaw <= 0n) throw new Error("Enter an amount greater than zero.");
  if (weights.length === 0) throw new Error("Add at least one stock to your stack.");
  if (weights.some((w) => !Number.isInteger(w) || w <= 0)) throw new Error("Every weight must be a whole number above zero.");
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum !== 100) throw new Error(`Weights must add up to 100% (currently ${sum}%).`);

  const feeRaw = (totalRaw * feeBps) / BPS;
  const investRaw = totalRaw - feeRaw;

  const amounts: bigint[] = [];
  let used = 0n;
  weights.forEach((w, i) => {
    const amount = i === weights.length - 1 ? investRaw - used : (investRaw * BigInt(w * 100)) / BPS;
    if (amount <= 0n) throw new Error("One of the amounts is too small. Increase the total or the weight.");
    used += amount;
    amounts.push(amount);
  });
  return { feeRaw, investRaw, amounts };
}

/** Lowest amount out we accept for a quoted amount, given a slippage limit in basis points. */
export function applySlippage(amountOut: bigint, slippageBps: bigint): bigint {
  return (amountOut * (BPS - slippageBps)) / BPS;
}
