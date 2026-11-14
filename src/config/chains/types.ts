/** Everything the app needs to know about one chain. Add a chain by adding a file like robinhood.ts. */
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  /** The stablecoin every stack is bought with on this chain. */
  payToken: { address: string; symbol: string; decimals: number };
  contracts: {
    /** Registry that lists the active stock pools. */
    poolRegistry: string;
    quoter: string;
    universalRouter: string;
    permit2: string;
  };
}
