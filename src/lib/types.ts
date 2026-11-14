export interface PoolKey {
  currency0: string;
  currency1: string;
  fee: bigint;
  tickSpacing: bigint;
  hooks: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

/** One tradable stock: the pool that pairs it with the chain's pay token. */
export interface Pool {
  id: string;
  key: PoolKey;
  token: TokenInfo;
}

/** One line of the stack the user is composing. Weight is a whole-number percent. */
export interface StackItem {
  symbol: string;
  weight: number;
}

/** One swap inside the basket transaction. */
export interface Leg {
  pool: Pool;
  weight: number;
  amountIn: bigint;
  expectedOut: bigint;
  minOut: bigint;
}

export interface BasketQuote {
  totalRaw: bigint;
  feeRaw: bigint;
  investRaw: bigint;
  legs: Leg[];
  slippageBps: bigint;
  fetchedAt: number;
}
