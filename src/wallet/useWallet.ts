import { useCallback } from "react";
import { BrowserProvider, type Eip1193Provider, type Signer } from "ethers";
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from "@reown/appkit/react";
import { isDemo } from "../lib/demo";
import { appKitNetworks } from "./appkit";

export interface Wallet {
  address?: string;
  isConnected: boolean;
  chainId?: number;
  /** Open the sign-in / account modal. */
  open: () => void;
  getSigner: () => Promise<Signer>;
  switchTo: (chainId: number) => Promise<void>;
}

function useRealWallet(): Wallet {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");

  const getSigner = useCallback(async () => {
    if (!walletProvider) throw new Error("Sign in first.");
    return new BrowserProvider(walletProvider).getSigner();
  }, [walletProvider]);

  const switchTo = useCallback(
    async (id: number) => {
      const network = appKitNetworks.find((n) => n.id === id);
      if (!network) throw new Error("That network isn't supported.");
      await switchNetwork(network);
    },
    [switchNetwork],
  );

  return {
    address,
    isConnected,
    chainId: chainId === undefined ? undefined : Number(chainId),
    open: () => void open(),
    getSigner,
    switchTo,
  };
}

function useDemoWallet(): Wallet {
  return {
    isConnected: false,
    open: () => {},
    getSigner: async () => {
      throw new Error("Buying is turned off in demo mode.");
    },
    switchTo: async () => {},
  };
}

/** Demo mode is fixed for the life of the page, so the choice of hook never changes between renders. */
export const useWallet: () => Wallet = isDemo ? useDemoWallet : useRealWallet;
