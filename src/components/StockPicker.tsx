import { useState } from "react";
import type { Pool } from "../lib/types";

/** Search box plus a list of the stocks that aren't in the stack yet. */
export function StockPicker({ pools, exclude, onPick, onClose }: { pools: Pool[]; exclude: string[]; onPick: (symbol: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const options = pools
    .map((p) => p.token.symbol)
    .filter((s) => !exclude.includes(s) && s.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="picker">
      <div className="picker-head">
        <label htmlFor="stock-search" className="sr-only">
          Search stocks
        </label>
        <input id="stock-search" autoFocus placeholder="Search by ticker" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
      {options.length === 0 ? (
        <p className="muted small">No matching stocks.</p>
      ) : (
        <div className="picker-list">
          {options.map((symbol) => (
            <button key={symbol} type="button" className="chip mono" onClick={() => onPick(symbol)}>
              {symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
