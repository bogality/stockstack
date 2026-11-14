import type { ChainConfig } from "./types";

/** Robinhood Chain mainnet. Addresses carried over from the original rh-basket prototype. */
export const robinhood: ChainConfig = {
  id: 4663,
  name: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorerUrl: "https://explorer.mainnet.chain.robinhood.com",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  payToken: {
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    symbol: "USDG",
    decimals: 6,
  },
  contracts: {
    poolRegistry: "0x159a113e012593d9b3cc63ad45e30f0467e13ef3",
    quoter: "0x8dc178efb8111bb0973dd9d722ebeff267c98f94",
    universalRouter: "0x8876789976decbfcbbbe364623c63652db8c0904",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  },
};
