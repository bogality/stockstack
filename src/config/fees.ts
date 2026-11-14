/**
 * Fee settings. Change the numbers here and the receipt, the transaction
 * and the fee page all follow.
 */

/** StockStack fee in basis points. 25 = 0.25%. Taken from the amount the user spends. */
export const APP_FEE_BPS = 25n;

/** Wallet that receives the fee on-chain. */
export const APP_FEE_RECIPIENT = "0xbc9ca263a8a6872ddF808478ae9e0be14832e5b7";

/**
 * Share of collected fees that StockStack currently donates to the Quotrons
 * Terminal Pot. The donation is made by hand in batches; it is not part of
 * the user's transaction. Shown on the fee page and in the footer.
 */
export const QUOTRONS_SHARE_PERCENT = 25;

/** Donation transactions to list on the fee page. Add one entry per donation. */
export const QUOTRONS_DONATIONS: { date: string; amountEth: string; txUrl: string }[] = [];

export const feePercentLabel = `${(Number(APP_FEE_BPS) / 100).toFixed(2)}%`;
