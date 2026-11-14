import { STACK_PRESETS } from "../config/stacks";
import { ramp } from "../lib/gradient";
import type { Pool, StackItem } from "../lib/types";

export function Explore({ pools, loading, choose }: { pools: Pool[] | null; loading: boolean; choose: (items: StackItem[], presetId: string | null) => void }) {
  const available = (symbol: string) => !pools || pools.some((p) => p.token.symbol === symbol);

  return (
    <main className="wrap explore">
      <h1 className="page-title">Start with a stack. Make it yours.</h1>
      <p className="lede muted">Pick a starting point, then change the stocks and weights however you like. These are starting points, not recommendations.</p>
      {loading && <p className="muted small">Checking which stocks are available…</p>}

      <div className="cards">
        {STACK_PRESETS.map((preset) => {
          const missing = preset.items.filter((i) => !available(i.symbol)).map((i) => i.symbol);
          const colors = ramp(preset.items.length);
          return (
            <button key={preset.id} type="button" className="card" disabled={missing.length > 0} onClick={() => choose(preset.items, preset.id)}>
              <span className="mini" aria-hidden="true">
                {preset.items.map((item, i) => (
                  <span key={item.symbol} style={{ flexGrow: item.weight, background: colors[i] }} />
                ))}
              </span>
              <span className="card-body">
                <span className="eyebrow">
                  {preset.kind} · {preset.items.length} assets
                </span>
                <span className="card-name">{preset.name}</span>
                <span className="muted">{preset.description}</span>
                <span className="mono small">{preset.items.map((i) => `${i.symbol} ${i.weight}%`).join(" · ")}</span>
                {missing.length > 0 && <span className="small warn">Unavailable right now: {missing.join(", ")} can't be traded.</span>}
              </span>
            </button>
          );
        })}
        <button type="button" className="card blank" onClick={() => choose([], null)}>
          <span className="card-body">
            <span className="card-name">Blank stack</span>
            <span className="muted">Pick any of the available stocks and ETFs and stack them your way.</span>
            <span className="underline">Start from scratch</span>
          </span>
        </button>
      </div>
    </main>
  );
}
