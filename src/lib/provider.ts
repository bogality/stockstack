import { JsonRpcProvider } from "ethers";
import type { ChainConfig } from "../config/chains";

const cache = new Map<number, JsonRpcProvider>();

/** Read-only connection to a chain. Lets people browse and get quotes without a wallet. */
export function readProvider(chain: ChainConfig): JsonRpcProvider {
  let provider = cache.get(chain.id);
  if (!provider) {
    provider = new JsonRpcProvider(chain.rpcUrl, chain.id, { staticNetwork: true });
    cache.set(chain.id, provider);
  }
  return provider;
}
