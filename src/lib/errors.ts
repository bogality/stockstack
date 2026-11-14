/** Turn wallet and RPC errors into one plain sentence. */
export function friendlyError(error: unknown): string {
  const e = error as { code?: string | number; shortMessage?: string; message?: string; info?: { error?: { code?: number } } };
  const code = e?.code ?? e?.info?.error?.code;
  const text = `${e?.shortMessage ?? ""} ${e?.message ?? ""}`.toLowerCase();

  if (code === "ACTION_REJECTED" || code === 4001 || text.includes("user rejected") || text.includes("user denied")) {
    return "You cancelled the request in your wallet. Nothing was sent.";
  }
  if (code === "INSUFFICIENT_FUNDS" || text.includes("insufficient funds")) {
    return "Your wallet doesn't have enough ETH to pay the network fee.";
  }
  if (code === "NETWORK_ERROR" || code === "TIMEOUT" || text.includes("failed to fetch") || text.includes("timeout")) {
    return "The network isn't responding right now. Please try again.";
  }
  if (code === "CALL_EXCEPTION" || text.includes("revert")) {
    return "The trade would not go through at the current price. Refresh the quote and try again.";
  }
  if (e?.message && e.message.length < 160 && !e.message.includes("0x")) return e.message;
  return "Something went wrong. Please try again.";
}
