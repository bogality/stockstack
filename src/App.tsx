import { useEffect, useState } from "react";
import { DEFAULT_CHAIN } from "./config/chains";
import { DEFAULT_PRESET_ID, STACK_PRESETS } from "./config/stacks";
import { usePools } from "./hooks";
import { isDemo } from "./lib/demo";
import type { StackItem } from "./lib/types";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { RegionGate } from "./components/RegionGate";
import { Compose } from "./pages/Compose";
import { Explore } from "./pages/Explore";
import { Fees } from "./pages/Fees";
import { useWallet } from "./wallet/useWallet";

export type Page = "compose" | "explore" | "fees";

const pageFromHash = (): Page => {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash === "explore" || hash === "fees" ? hash : "compose";
};

const STORAGE_KEY = "stockstack.draft.v1";

interface Draft {
  items: StackItem[];
  presetId: string | null;
  amount: string;
}

function loadDraft(): Draft {
  const preset = STACK_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;
  const fallback: Draft = { items: preset.items, presetId: preset.id, amount: "500" };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Draft | null;
    if (saved && Array.isArray(saved.items) && typeof saved.amount === "string") return saved;
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return fallback;
}

export function App() {
  const chain = DEFAULT_CHAIN;
  const wallet = useWallet();
  const [page, setPage] = useState<Page>(pageFromHash);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [poolsState, reloadPools] = usePools(chain);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore: the draft just won't be remembered */
    }
  }, [draft]);

  const go = (next: Page) => {
    window.location.hash = next === "compose" ? "/" : `/${next}`;
    window.scrollTo({ top: 0 });
  };

  const pools = poolsState.status === "ready" ? poolsState.pools : null;

  return (
    <RegionGate>
      <div className="app">
        {isDemo && <div className="demo-banner">Demo mode: sample stocks and made-up prices. Buying is turned off.</div>}
        <Header page={page} go={go} wallet={wallet} />
        {page === "compose" && (
          <Compose
            chain={chain}
            wallet={wallet}
            poolsState={poolsState}
            reloadPools={reloadPools}
            items={draft.items}
            presetId={draft.presetId}
            amount={draft.amount}
            setItems={(items) => setDraft((d) => (items === d.items ? d : { ...d, items, presetId: null }))}
            setAmount={(amount) => setDraft((d) => ({ ...d, amount }))}
            go={go}
          />
        )}
        {page === "explore" && (
          <Explore
            pools={pools}
            loading={poolsState.status === "loading"}
            choose={(items, presetId) => {
              setDraft((d) => ({ ...d, items, presetId }));
              go("compose");
            }}
          />
        )}
        {page === "fees" && <Fees chain={chain} />}
        <Footer go={go} />
      </div>
    </RegionGate>
  );
}
