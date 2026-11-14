import { Contract, type Provider } from "ethers";
import type { ChainConfig } from "../config/chains";
import { QUOTER_ABI } from "./abis";
import { allocate, applySlippage } from "./allocate";
import { buysZeroForOne } from "./pools";
import type { BasketQuote, Pool, StackItem } from "./types";

export type QuoteLeg = (pool: Pool, amountIn: bigint) => Promise<bigint>;

/** Ask the chain's quoter how much stock `amountIn` of the pay token buys in one pool. */
export function onchainQuoter(provider: Provider, chain: ChainConfig): QuoteLeg {
  const quoter = new Contract(chain.contracts.quoter, QUOTER_ABI, provider);
  return async (pool, amountIn) => {
    const result = await quoter.quoteExactInputSingle.staticCall({
      poolKey: pool.key,
      zeroForOne: buysZeroForOne(pool, chain),
      exactAmount: amountIn,
      hookData: "0x",
    });
    return result.amountOut as bigint;
  };
}

/** Quote every item in the stack. Fails as a whole if any stock has no pool or no quote. */
export async function quoteBasket(args: {
  items: StackItem[];
  pools: Pool[];
  totalRaw: bigint;
  feeBps: bigint;
  slippageBps: bigint;
  quoteLeg: QuoteLeg;
}): Promise<BasketQuote> {
  const { items, pools, totalRaw, feeBps, slippageBps, quoteLeg } = args;
  const { feeRaw, investRaw, amounts } = allocate(
    totalRaw,
    items.map((i) => i.weight),
    feeBps,
  );

  const legs = await Promise.all(
    items.map(async (item, i) => {
      const pool = pools.find((p) => p.token.symbol === item.symbol);
      if (!pool) throw new Error(`${item.symbol} isn't available to trade right now.`);
      const expectedOut = await quoteLeg(pool, amounts[i]);
      if (expectedOut <= 0n) throw new Error(`No price available for ${item.symbol} at this size.`);
      return { pool, weight: item.weight, amountIn: amounts[i], expectedOut, minOut: applySlippage(expectedOut, slippageBps) };
    }),
  );

  return { totalRaw, feeRaw, investRaw, legs, slippageBps, fetchedAt: Date.now() };
}
