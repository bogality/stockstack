import { formatUnits } from "ethers";

/** "$1,234.50" from a raw stablecoin amount. */
export function usd(raw: bigint, decimals: number): string {
  const n = Number(formatUnits(raw, decimals));
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A token quantity with a sensible number of digits, e.g. "0.4123". */
export function qty(raw: bigint, decimals: number): string {
  const n = Number(formatUnits(raw, decimals));
  if (n === 0) return "0";
  const digits = n >= 100 ? 2 : n >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
