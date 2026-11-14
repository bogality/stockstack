import type { ChainConfig } from "../config/chains";
import { APP_FEE_RECIPIENT, QUOTRONS_DONATIONS, QUOTRONS_SHARE_PERCENT, feePercentLabel } from "../config/fees";

export function Fees({ chain }: { chain: ChainConfig }) {
  return (
    <main className="wrap prose">
      <h1 className="page-title">Fees</h1>

      <h2>What you pay</h2>
      <p>
        StockStack charges {feePercentLabel} of the amount you spend. On a $1,000 stack that is $2.50. The fee is shown in dollars on the
        receipt before you sign, and it is taken inside the same transaction as your purchase.
      </p>
      <p>
        You also pay the network fee for the transaction, which your wallet shows, and each pool's own trading fee, which is already included in
        the prices you are quoted.
      </p>

      <h2>Where the fee goes</h2>
      <p>
        Fees are sent to the StockStack wallet at{" "}
        <a href={`${chain.explorerUrl}/address/${APP_FEE_RECIPIENT}`} target="_blank" rel="noopener noreferrer" className="mono">
          {APP_FEE_RECIPIENT}
        </a>
        .
      </p>
      <p>
        Currently {QUOTRONS_SHARE_PERCENT}% of the fees StockStack collects are donated to the Quotrons Terminal Pot. Donations are made in
        batches, not with each purchase, and each one is listed below once it has been sent. This share may change; this page will always show
        the current figure.
      </p>
      <p className="muted">Disclosure: the person who runs StockStack holds Quotrons.</p>

      <h2>Donations so far</h2>
      {QUOTRONS_DONATIONS.length === 0 ? (
        <p className="muted">No donations have been sent yet.</p>
      ) : (
        <ul>
          {QUOTRONS_DONATIONS.map((d) => (
            <li key={d.txUrl}>
              {d.date}: {d.amountEth} ETH ·{" "}
              <a href={d.txUrl} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
