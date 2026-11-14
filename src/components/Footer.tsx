import type { Page } from "../App";
import { QUOTRONS_SHARE_PERCENT, feePercentLabel } from "../config/fees";
import { RESTRICTED_TEXT } from "../config/regions";

export function Footer({ go }: { go: (p: Page) => void }) {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>
          StockStack is an independent interface and never holds your assets. Tokenized equities carry risk, including loss of the amount
          invested. Not available to residents of {RESTRICTED_TEXT}. Nothing here is investment advice.
        </p>
        <p>
          {feePercentLabel} fee per buy · currently {QUOTRONS_SHARE_PERCENT}% of fees go to the Quotrons Terminal Pot ·{" "}
          <a
            href="#/fees"
            onClick={(e) => {
              e.preventDefault();
              go("fees");
            }}
          >
            How fees work
          </a>
        </p>
      </div>
    </footer>
  );
}
