import type { Page } from "../App";
import { shortAddress } from "../lib/format";
import type { Wallet } from "../wallet/useWallet";

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="2" y="2" width="24" height="10" rx="2" fill="#8E72FF" />
      <rect x="2" y="14" width="24" height="6" rx="2" fill="#6B9CFF" />
      <rect x="2" y="22" width="24" height="4" rx="2" fill="#86CCFF" />
    </svg>
  );
}

export function Header({ page, go, wallet }: { page: Page; go: (p: Page) => void; wallet: Wallet }) {
  const link = (target: Page, label: string) => (
    <a
      href={target === "compose" ? "#/" : `#/${target}`}
      className={page === target ? "nav-link active" : "nav-link"}
      aria-current={page === target ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        go(target);
      }}
    >
      {label}
    </a>
  );
  return (
    <header className="header wrap">
      <a
        href="#/"
        className="brand"
        onClick={(e) => {
          e.preventDefault();
          go("compose");
        }}
      >
        <Logo />
        <span>StockStack</span>
      </a>
      <nav aria-label="Main" className="nav">
        {link("compose", "Compose")}
        {link("explore", "Explore")}
        {link("fees", "Fees")}
      </nav>
      {wallet.isConnected && wallet.address ? (
        <button type="button" className="btn ghost" onClick={wallet.open}>
          {shortAddress(wallet.address)}
        </button>
      ) : (
        <span className="muted small">No sign-in needed to build</span>
      )}
    </header>
  );
}
