import { useCallback, useEffect, useRef, useState } from "react";
import { Contract, parseUnits } from "ethers";
import type { ChainConfig } from "./config/chains";
import { APP_FEE_BPS, APP_FEE_RECIPIENT } from "./config/fees";
import { ERC20_ABI } from "./lib/abis";
import { approveRouter, approveToken, readWalletStatus } from "./lib/approvals";
import { buildBasketTx } from "./lib/buildBasketTx";
import { demoPools, demoQuoter, isDemo } from "./lib/demo";
import { friendlyError } from "./lib/errors";
import { usd } from "./lib/format";
import { discoverPools } from "./lib/pools";
import { readProvider } from "./lib/provider";
import { onchainQuoter, quoteBasket } from "./lib/quote";
import type { BasketQuote, Pool, StackItem } from "./lib/types";
import { totalWeight } from "./lib/weights";
import type { Wallet } from "./wallet/useWallet";

const QUOTE_REFRESH_MS = 30_000;
const MIN_AMOUNT = 1;

/* ---------- pools ---------- */

export type PoolsState = { status: "loading" } | { status: "ready"; pools: Pool[] } | { status: "error"; message: string };

export function usePools(chain: ChainConfig): [PoolsState, () => void] {
  const [state, setState] = useState<PoolsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    const load = isDemo ? Promise.resolve(demoPools) : discoverPools(readProvider(chain), chain);
    load.then(
      (pools) => !cancelled && setState({ status: "ready", pools }),
      (error) => !cancelled && setState({ status: "error", message: friendlyError(error) }),
    );
    return () => {
      cancelled = true;
    };
  }, [chain, attempt]);

  return [state, () => setAttempt((n) => n + 1)];
}

/* ---------- quote ---------- */

export type QuoteState =
  | { status: "idle"; hint: string }
  | { status: "loading"; previous?: BasketQuote }
  | { status: "ready"; quote: BasketQuote }
  | { status: "error"; message: string };

export function parseAmount(text: string, decimals: number): bigint | null {
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) return null;
  return parseUnits(n.toFixed(decimals), decimals);
}

function getQuoter(chain: ChainConfig) {
  return isDemo ? demoQuoter : onchainQuoter(readProvider(chain), chain);
}

export function useQuote(args: { chain: ChainConfig; pools: Pool[] | null; items: StackItem[]; amount: string; slippageBps: bigint; paused: boolean }): QuoteState {
  const { chain, pools, items, amount, slippageBps, paused } = args;
  const [state, setState] = useState<QuoteState>({ status: "idle", hint: "" });
  const last = useRef<BasketQuote | undefined>(undefined);
  const key = JSON.stringify(items);

  useEffect(() => {
    if (paused) return;
    const totalRaw = parseAmount(amount, chain.payToken.decimals);
    if (!pools) return setState({ status: "idle", hint: "Loading stocks…" });
    if (items.length === 0) return setState({ status: "idle", hint: "Add a stock to see a price." });
    if (totalWeight(items) !== 100) return setState({ status: "idle", hint: "Weights must add up to 100%." });
    if (!totalRaw || Number(amount) < MIN_AMOUNT) return setState({ status: "idle", hint: `Enter at least $${MIN_AMOUNT}.` });

    let cancelled = false;
    const run = () => {
      setState({ status: "loading", previous: last.current });
      quoteBasket({ items, pools, totalRaw, feeBps: APP_FEE_BPS, slippageBps, quoteLeg: getQuoter(chain) }).then(
        (quote) => {
          if (cancelled) return;
          last.current = quote;
          setState({ status: "ready", quote });
        },
        (error) => !cancelled && setState({ status: "error", message: friendlyError(error) }),
      );
    };
    const debounce = setTimeout(run, 400);
    const refresh = setInterval(run, QUOTE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
      clearInterval(refresh);
    };
    // `key` stands in for `items`, which is a new array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, pools, key, amount, slippageBps, paused]);

  return state;
}

/* ---------- buy ---------- */

export type BuyPhase =
  | { step: "idle" }
  | { step: "checking" }
  | { step: "approve-token" }
  | { step: "approve-router" }
  | { step: "confirm" }
  | { step: "pending"; hash: string }
  | { step: "done"; hash: string; received: { symbol: string; amount: bigint; decimals: number }[] }
  | { step: "error"; message: string };

export function useBuy(args: { chain: ChainConfig; wallet: Wallet; pools: Pool[] | null; items: StackItem[]; amount: string; slippageBps: bigint }) {
  const { chain, wallet, pools, items, amount, slippageBps } = args;
  const [phase, setPhase] = useState<BuyPhase>({ step: "idle" });

  const reset = useCallback(() => setPhase({ step: "idle" }), []);

  const buy = useCallback(async () => {
    if (isDemo) return setPhase({ step: "error", message: "Buying is turned off in demo mode." });
    if (!wallet.isConnected || !wallet.address) return wallet.open();
    const totalRaw = parseAmount(amount, chain.payToken.decimals);
    if (!pools || !totalRaw) return;

    try {
      setPhase({ step: "checking" });
      if (wallet.chainId !== chain.id) await wallet.switchTo(chain.id);
      const signer = await wallet.getSigner();
      const owner = await signer.getAddress();
      const provider = readProvider(chain);

      let status = await readWalletStatus(provider, chain, owner, totalRaw);
      if (!status.balanceOK) {
        throw new Error(`Not enough ${chain.payToken.symbol}. You have ${usd(status.balance, chain.payToken.decimals)}.`);
      }
      if (!status.tokenApproved) {
        setPhase({ step: "approve-token" });
        await approveToken(signer, chain, totalRaw);
      }
      if (!status.routerApproved) {
        setPhase({ step: "approve-router" });
        await approveRouter(signer, chain, totalRaw);
      }
      status = await readWalletStatus(provider, chain, owner, totalRaw);
      if (!status.tokenApproved || !status.routerApproved) throw new Error("Approval is needed before buying. Please try again.");

      // Price the stack again right before signing, then dry-run the exact transaction.
      setPhase({ step: "confirm" });
      const quote = await quoteBasket({ items, pools, totalRaw, feeBps: APP_FEE_BPS, slippageBps, quoteLeg: onchainQuoter(provider, chain) });
      const tx = buildBasketTx(quote, chain, APP_FEE_RECIPIENT, Math.floor(Date.now() / 1000));
      await provider.call({ from: owner, to: tx.to, data: tx.data });

      const balances = () =>
        Promise.all(quote.legs.map((leg) => new Contract(leg.pool.token.address, ERC20_ABI, provider).balanceOf(owner) as Promise<bigint>));
      const before = await balances();

      const sent = await signer.sendTransaction({ to: tx.to, data: tx.data, value: 0n });
      setPhase({ step: "pending", hash: sent.hash });
      const receipt = await sent.wait();
      if (receipt?.status !== 1) throw new Error("The transaction failed on-chain. Nothing was bought.");

      const after = await balances();
      setPhase({
        step: "done",
        hash: sent.hash,
        received: quote.legs.map((leg, i) => ({ symbol: leg.pool.token.symbol, amount: after[i] - before[i], decimals: leg.pool.token.decimals })),
      });
    } catch (error) {
      setPhase({ step: "error", message: friendlyError(error) });
    }
  }, [amount, chain, items, pools, slippageBps, wallet]);

  return { phase, buy, reset };
}
