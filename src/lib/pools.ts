import { Contract, type Provider } from "ethers";
import type { ChainConfig } from "../config/chains";
import { ERC20_ABI, REGISTRY_ABI } from "./abis";
import type { Pool } from "./types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Read the registry's active pools and keep the ones that pair a stock token
 * with the chain's pay token. Tokens whose metadata can't be read are skipped.
 */
export async function discoverPools(provider: Provider, chain: ChainConfig): Promise<Pool[]> {
  const registry = new Contract(chain.contracts.poolRegistry, REGISTRY_ABI, provider);

  let raw: any[] | undefined;
  for (let attempt = 1; attempt <= 3 && !raw; attempt++) {
    try {
      raw = await registry.activePools();
    } catch {
      if (attempt === 3) throw new Error("Could not load the list of stocks. Please try again.");
      await sleep(750);
    }
  }

  const pay = chain.payToken.address.toLowerCase();
  const candidates = (raw ?? []).filter((p) => {
    const c0 = String(p.key.currency0).toLowerCase();
    const c1 = String(p.key.currency1).toLowerCase();
    return c0 === pay || c1 === pay;
  });

  const pools = await Promise.all(
    candidates.map(async (p): Promise<Pool | null> => {
      const stock = String(p.key.currency0).toLowerCase() === pay ? p.key.currency1 : p.key.currency0;
      try {
        const token = new Contract(stock, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([token.symbol(), token.decimals()]);
        if (symbol === chain.payToken.symbol) return null;
        return {
          id: p.id,
          key: {
            currency0: p.key.currency0,
            currency1: p.key.currency1,
            fee: BigInt(p.key.fee),
            tickSpacing: BigInt(p.key.tickSpacing),
            hooks: p.key.hooks,
          },
          token: { address: stock, symbol, decimals: Number(decimals) },
        };
      } catch {
        return null;
      }
    }),
  );

  // If a symbol has more than one pool, keep the first; routing across pools comes later.
  const bySymbol = new Map<string, Pool>();
  for (const pool of pools) {
    if (pool && !bySymbol.has(pool.token.symbol)) bySymbol.set(pool.token.symbol, pool);
  }
  return [...bySymbol.values()].sort((a, b) => a.token.symbol.localeCompare(b.token.symbol));
}

/** True when the pay token is currency0, i.e. buying the stock swaps zero-for-one. */
export function buysZeroForOne(pool: Pool, chain: ChainConfig): boolean {
  return pool.key.currency0.toLowerCase() === chain.payToken.address.toLowerCase();
}
