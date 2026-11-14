import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";
import { CHAINS } from "../config/chains";
import { isDemo } from "../lib/demo";

/** Reown project ID. Set VITE_REOWN_PROJECT_ID for your own deployment. */
const PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID ?? "09ba118428aa82add3613eb650642d37";

export const appKitNetworks = CHAINS.map((chain) =>
  defineChain({
    id: chain.id,
    caipNetworkId: `eip155:${chain.id}`,
    chainNamespace: "eip155",
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: { default: { http: [chain.rpcUrl] } },
    blockExplorers: { default: { name: `${chain.name} Explorer`, url: chain.explorerUrl } },
  }),
);

/** Start the wallet modal once, at load. Skipped in demo mode, which never touches a wallet. */
export function initWallet(): void {
  if (isDemo) return;
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [appKitNetworks[0], ...appKitNetworks.slice(1)],
    defaultNetwork: appKitNetworks[0],
    projectId: PROJECT_ID,
    metadata: {
      name: "StockStack",
      description: "Build a stack of tokenized equities and buy it in one transaction.",
      url: window.location.origin,
      icons: [],
    },
    themeMode: "dark",
    themeVariables: { "--w3m-accent": "#8E72FF" },
    features: { analytics: true, email: true, socials: ["google", "apple"], swaps: false, onramp: false },
  });
}
