import type { Pool } from "./types";
import type { QuoteLeg } from "./quote";

/**
 * Demo mode (add ?demo to the address). Uses made-up pools and made-up
 * prices so the interface can be previewed without a network connection.
 * Buying is disabled in demo mode.
 */
export const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

const DEMO_PRICES: Record<string, number> = { AAPL: 250, AMC: 4, GLD: 300, META: 600, NVDA: 150, SPY: 700, TSLA: 400 };

const fakeAddress = (n: number) => "0x" + n.toString(16).padStart(40, "0");

export const demoPools: Pool[] = Object.keys(DEMO_PRICES).map((symbol, i) => ({
  id: "0x" + (i + 1).toString(16).padStart(64, "0"),
  key: { currency0: fakeAddress(1), currency1: fakeAddress(100 + i), fee: 3000n, tickSpacing: 60n, hooks: fakeAddress(0) },
  token: { address: fakeAddress(100 + i), symbol, decimals: 18 },
}));

/** Pay token has 6 decimals, demo stocks have 18. */
export const demoQuoter: QuoteLeg = async (pool, amountIn) => {
  const price = BigInt(DEMO_PRICES[pool.token.symbol] ?? 100);
  return (amountIn * 10n ** 12n) / price;
};
