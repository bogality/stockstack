export interface StackPreset {
  id: string;
  name: string;
  kind: "Broad" | "Focused";
  description: string;
  /** Symbols must match the token symbols of the pools on the chain. Weights add up to 100. */
  items: { symbol: string; weight: number }[];
}

/**
 * Ready-made stacks. A preset is only offered when every symbol in it has a
 * live pool on the current chain, so this list can safely name tokens that
 * are not available everywhere.
 */
export const STACK_PRESETS: StackPreset[] = [
  {
    id: "ai-builders",
    name: "AI Builders",
    kind: "Focused",
    description: "Companies building the chips and platforms behind artificial intelligence.",
    items: [
      { symbol: "NVDA", weight: 40 },
      { symbol: "META", weight: 30 },
      { symbol: "AAPL", weight: 30 },
    ],
  },
  {
    id: "the-core",
    name: "The Core",
    kind: "Broad",
    description: "An S&P 500 ETF with a slice of gold alongside it.",
    items: [
      { symbol: "SPY", weight: 70 },
      { symbol: "GLD", weight: 30 },
    ],
  },
  {
    id: "fast-movers",
    name: "Fast Movers",
    kind: "Focused",
    description: "Volatile names, for people who accept bigger swings.",
    items: [
      { symbol: "TSLA", weight: 40 },
      { symbol: "NVDA", weight: 35 },
      { symbol: "AMC", weight: 25 },
    ],
  },
];

export const DEFAULT_PRESET_ID = "ai-builders";
