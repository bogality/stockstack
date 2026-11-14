import { robinhood } from "./robinhood";
import type { ChainConfig } from "./types";

export type { ChainConfig };

/** Chains the app can trade on. Phase 1 ships Robinhood Chain only. */
export const CHAINS: ChainConfig[] = [robinhood];
export const DEFAULT_CHAIN: ChainConfig = robinhood;
