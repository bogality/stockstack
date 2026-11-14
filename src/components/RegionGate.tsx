import { useEffect, useState, type ReactNode } from "react";
import { BLOCKED_COUNTRIES, GEO_ENDPOINT, RESTRICTED_TEXT } from "../config/regions";
import { Logo } from "./Header";

const KEY = "stockstack.region.ok.v1";

type Gate = "checking" | "ask" | "blocked" | "ok";

function remembered(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Stops the app from loading until the visitor confirms they are not in a
 * restricted region. If a geo endpoint is configured, visitors from blocked
 * countries are turned away regardless of what they confirm.
 */
export function RegionGate({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<Gate>(GEO_ENDPOINT ? "checking" : remembered() ? "ok" : "ask");

  useEffect(() => {
    if (!GEO_ENDPOINT) return;
    let cancelled = false;
    fetch(GEO_ENDPOINT)
      .then((r) => r.json())
      .then((body: { country?: string }) => {
        if (cancelled) return;
        const blocked = BLOCKED_COUNTRIES.includes(String(body.country ?? "").toUpperCase());
        setGate(blocked ? "blocked" : remembered() ? "ok" : "ask");
      })
      // If the lookup fails, fall back to asking rather than letting everyone through unasked.
      .catch(() => !cancelled && setGate(remembered() ? "ok" : "ask"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate === "ok") return <>{children}</>;

  return (
    <main className="gate">
      <div className="gate-card" role="dialog" aria-labelledby="gate-title">
        <div className="brand">
          <Logo />
          <span>StockStack</span>
        </div>
        {gate === "checking" && <p className="muted">Checking availability in your region…</p>}
        {gate === "blocked" && (
          <>
            <h1 id="gate-title">Not available in your region</h1>
            <p className="muted">StockStack can't be used from {RESTRICTED_TEXT}.</p>
          </>
        )}
        {gate === "ask" && (
          <>
            <h1 id="gate-title">Before you continue</h1>
            <p className="muted">
              Tokenized equities are not available everywhere. StockStack can't be used by residents of {RESTRICTED_TEXT}.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                try {
                  localStorage.setItem(KEY, "1");
                } catch {
                  /* not remembered; they'll be asked again next visit */
                }
                setGate("ok");
              }}
            >
              I confirm I'm not in a restricted region
            </button>
            <p className="muted small">If you are, please close this page.</p>
          </>
        )}
      </div>
    </main>
  );
}
