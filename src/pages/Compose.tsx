import { useMemo, useState } from "react";
import type { Page } from "../App";
import type { ChainConfig } from "../config/chains";
import { APP_FEE_BPS, feePercentLabel } from "../config/fees";
import { STACK_PRESETS } from "../config/stacks";
import { StockPicker } from "../components/StockPicker";
import { parseAmount, useBuy, useQuote, type BuyPhase, type PoolsState } from "../hooks";
import { allocate } from "../lib/allocate";
import { isDemo } from "../lib/demo";
import { qty, usd } from "../lib/format";
import { ramp } from "../lib/gradient";
import type { StackItem } from "../lib/types";
import { MAX_ITEMS, WEIGHT_STEP, addItem, bumpWeight, equalize, removeItem, totalWeight } from "../lib/weights";
import type { Wallet } from "../wallet/useWallet";

const AMOUNT_CHIPS = ["100", "250", "500", "1000"];
const SLIPPAGE_OPTIONS: { bps: bigint; label: string }[] = [
  { bps: 25n, label: "0.25%" },
  { bps: 50n, label: "0.5%" },
  { bps: 100n, label: "1%" },
];

interface Props {
  chain: ChainConfig;
  wallet: Wallet;
  poolsState: PoolsState;
  reloadPools: () => void;
  items: StackItem[];
  presetId: string | null;
  amount: string;
  setItems: (items: StackItem[]) => void;
  setAmount: (amount: string) => void;
  go: (page: Page) => void;
}

export function Compose({ chain, wallet, poolsState, reloadPools, items, presetId, amount, setItems, setAmount, go }: Props) {
  const pools = poolsState.status === "ready" ? poolsState.pools : null;
  const [slippageBps, setSlippageBps] = useState(50n);
  const [picking, setPicking] = useState(false);
  const { phase, buy, reset } = useBuy({ chain, wallet, pools, items, amount, slippageBps });
  const busy = !["idle", "error", "done"].includes(phase.step);
  const quoteState = useQuote({ chain, pools, items, amount, slippageBps, paused: busy || phase.step === "done" });

  const pay = chain.payToken;
  const colors = useMemo(() => ramp(items.length), [items.length]);
  const presetName = STACK_PRESETS.find((p) => p.id === presetId)?.name;
  const missing = pools ? items.filter((i) => !pools.some((p) => p.token.symbol === i.symbol)).map((i) => i.symbol) : [];

  // Dollar split for display. Works without a quote, so the blocks always show amounts.
  const split = useMemo(() => {
    const totalRaw = parseAmount(amount, pay.decimals);
    if (!totalRaw || items.length === 0 || totalWeight(items) !== 100) return null;
    try {
      return { totalRaw, ...allocate(totalRaw, items.map((i) => i.weight), APP_FEE_BPS) };
    } catch {
      return null;
    }
  }, [amount, items, pay.decimals]);

  const quote = quoteState.status === "ready" ? quoteState.quote : quoteState.status === "loading" ? quoteState.previous : undefined;
  const expected = (symbol: string) => quote?.legs.find((l) => l.pool.token.symbol === symbol);

  const canBuy = !isDemo && !busy && quoteState.status === "ready" && missing.length === 0;
  const buttonLabel = isDemo
    ? "Buying is off in demo mode"
    : busy
      ? phaseLabel(phase, pay.symbol)
      : wallet.isConnected
        ? "Buy this stack"
        : "Sign in and buy";

  return (
    <main className="wrap compose">
      <section aria-label="Compose" className="compose-main">
        <h1 className="sentence">
          Put{" "}
          <span className="amount-chip">
            $
            <label htmlFor="amount" className="sr-only">
              Amount in dollars
            </label>
            <input
              id="amount"
              inputMode="decimal"
              value={amount}
              style={{ width: `${Math.max(2, amount.length)}ch` }}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").slice(0, 9))}
            />
          </span>{" "}
          into{" "}
          <a
            href="#/explore"
            className="dotted"
            onClick={(e) => {
              e.preventDefault();
              go("explore");
            }}
          >
            {presetName ?? "your own stack"}
          </a>
          , paying with {pay.symbol}.
        </h1>

        <div className="chip-row">
          {AMOUNT_CHIPS.map((value) => (
            <button key={value} type="button" className={amount === value ? "chip mono selected" : "chip mono"} onClick={() => setAmount(value)}>
              ${Number(value).toLocaleString("en-US")}
            </button>
          ))}
          <span className="muted small">Type any amount, or tap the stack name to pick another.</span>
        </div>

        <div>
          <div className="blocks-head">
            <span className="eyebrow">Your stack · block height is weight</span>
            <span className="mono small muted">{totalWeight(items)}% allocated</span>
          </div>

          {poolsState.status === "error" && (
            <div className="notice" role="alert">
              {poolsState.message}{" "}
              <button type="button" className="link" onClick={reloadPools}>
                Try again
              </button>
            </div>
          )}
          {missing.length > 0 && (
            <div className="notice" role="alert">
              {missing.join(", ")} {missing.length === 1 ? "isn't" : "aren't"} available to trade right now. Remove {missing.length === 1 ? "it" : "them"} to continue.
            </div>
          )}

          {items.length === 0 ? (
            <div className="empty">Your stack is empty. Add a stock to begin.</div>
          ) : (
            <div className="blocks" style={{ minHeight: Math.max(420, items.length * 60) }}>
              {items.map((item, i) => {
                const dollars = split ? usd(split.amounts[i], pay.decimals) : "";
                const leg = expected(item.symbol);
                return (
                  <div key={item.symbol} className="block" style={{ flexGrow: item.weight, background: colors[i] }}>
                    <span className="block-symbol mono">{item.symbol}</span>
                    <span className="block-qty mono">{leg ? `≈ ${qty(leg.expectedOut, leg.pool.token.decimals)}` : ""}</span>
                    <span className="block-amount mono">{dollars}</span>
                    <span className="block-weight mono">{item.weight}%</span>
                    <button type="button" className="step" aria-label={`Decrease ${item.symbol} weight`} disabled={busy} onClick={() => setItems(bumpWeight(items, i, -WEIGHT_STEP))}>
                      −
                    </button>
                    <button type="button" className="step" aria-label={`Increase ${item.symbol} weight`} disabled={busy} onClick={() => setItems(bumpWeight(items, i, WEIGHT_STEP))}>
                      +
                    </button>
                    <button type="button" className="step quiet" aria-label={`Remove ${item.symbol}`} disabled={busy} onClick={() => setItems(removeItem(items, i))}>
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {picking && pools ? (
            <StockPicker
              pools={pools}
              exclude={items.map((i) => i.symbol)}
              onClose={() => setPicking(false)}
              onPick={(symbol) => {
                setItems(addItem(items, symbol));
                setPicking(false);
              }}
            />
          ) : (
            <div className="chip-row actions">
              <button type="button" className="btn dashed" disabled={!pools || items.length >= MAX_ITEMS || busy} onClick={() => setPicking(true)}>
                + Add a stock or ETF
              </button>
              <button type="button" className="link" disabled={items.length < 2 || busy} onClick={() => setItems(equalize(items))}>
                Reset to equal weights
              </button>
              {poolsState.status === "loading" && <span className="muted small">Loading stocks…</span>}
            </div>
          )}
        </div>
      </section>

      <aside aria-label="Receipt" className="receipt mono">
        <div className="receipt-head">
          <span className="receipt-title">Receipt</span>
          <span className="small muted">before you sign</span>
        </div>
        <hr />
        <div className="lines">
          {items.map((item, i) => {
            const leg = expected(item.symbol);
            return (
              <div key={item.symbol} className="line">
                <span className="dot" style={{ background: colors[i] }} />
                <span className="grow">
                  {item.symbol} <span className="muted">{item.weight}%</span>
                  {leg && <span className="muted small"> · ≈ {qty(leg.expectedOut, leg.pool.token.decimals)}</span>}
                </span>
                <span>{split ? usd(split.amounts[i], pay.decimals) : "–"}</span>
              </div>
            );
          })}
        </div>
        <hr />
        <div className="lines">
          <div className="line">
            <span className="grow muted">StockStack fee {feePercentLabel}</span>
            <span>{split ? usd(split.feeRaw, pay.decimals) : "–"}</span>
          </div>
          <div className="line">
            <span className="grow muted">Network fee</span>
            <span>shown in your wallet</span>
          </div>
          <div className="line">
            <span className="grow muted">Price protection</span>
            <span className="seg" role="group" aria-label="Price protection">
              {SLIPPAGE_OPTIONS.map((o) => (
                <button key={o.label} type="button" className={o.bps === slippageBps ? "on" : ""} aria-pressed={o.bps === slippageBps} disabled={busy} onClick={() => setSlippageBps(o.bps)}>
                  {o.label}
                </button>
              ))}
            </span>
          </div>
        </div>
        <hr />
        <div className="total">
          <span>You pay</span>
          <strong>{split ? usd(split.totalRaw, pay.decimals) : "–"}</strong>
        </div>
        <p className="small muted quote-note" aria-live="polite">
          {quoteState.status === "idle" && quoteState.hint}
          {quoteState.status === "loading" && "Getting prices…"}
          {quoteState.status === "ready" && `Paid in ${pay.symbol} on ${chain.name}. Prices refresh every 30 seconds.`}
          {quoteState.status === "error" && quoteState.message}
        </p>

        <button type="button" className="btn primary big" disabled={!canBuy} onClick={buy}>
          {buttonLabel}
        </button>

        <BuyStatus phase={phase} chain={chain} reset={reset} />

        <div className="fineprint">
          <span>Email, Google, Apple or your own wallet. You only sign in at this step.</span>
          <span>
            Each buy asks you to approve the exact {pay.symbol} amount (two quick approvals), then sign the purchase. All stocks are bought together, or none are.
          </span>
        </div>
      </aside>
    </main>
  );
}

function phaseLabel(phase: BuyPhase, symbol: string): string {
  switch (phase.step) {
    case "checking":
      return "Checking your wallet…";
    case "approve-token":
      return `Approve ${symbol} in your wallet…`;
    case "approve-router":
      return "Approve the router in your wallet…";
    case "confirm":
      return "Confirm the purchase in your wallet…";
    case "pending":
      return "Buying…";
    default:
      return "Buy this stack";
  }
}

function BuyStatus({ phase, chain, reset }: { phase: BuyPhase; chain: ChainConfig; reset: () => void }) {
  if (phase.step === "idle") return null;
  if (phase.step === "error") {
    return (
      <div className="status error" role="alert">
        {phase.message}
      </div>
    );
  }
  const txLink = (hash: string) => (
    <a href={`${chain.explorerUrl}/tx/${hash}`} target="_blank" rel="noopener noreferrer">
      View transaction
    </a>
  );
  if (phase.step === "done") {
    return (
      <div className="status done" role="status">
        <strong>Done. These are in your wallet:</strong>
        {phase.received.map((r) => (
          <span key={r.symbol}>
            {qty(r.amount, r.decimals)} {r.symbol}
          </span>
        ))}
        <span>
          {txLink(phase.hash)} ·{" "}
          <button type="button" className="link" onClick={reset}>
            Buy another
          </button>
        </span>
      </div>
    );
  }
  const steps: [BuyPhase["step"], string][] = [
    ["approve-token", `Approve ${chain.payToken.symbol}`],
    ["approve-router", "Approve the router"],
    ["confirm", "Sign the purchase"],
    ["pending", "Waiting for confirmation"],
  ];
  const current = steps.findIndex(([step]) => step === phase.step);
  return (
    <div className="status" role="status">
      <ol>
        {steps.map(([step, label], i) => (
          <li key={step} className={i === current ? "now" : i < current ? "past" : ""}>
            {label}
          </li>
        ))}
      </ol>
      {phase.step === "pending" && txLink(phase.hash)}
    </div>
  );
}
