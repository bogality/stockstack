# StockStack

Build a stack of tokenized equities and buy it in one transaction, from your own wallet.

This is the rebuild of the original [rh-basket](https://github.com/bogality/rh-basket) prototype. Phase 1 covers Robinhood Chain (chain ID 4663), paying with USDG, buys only.

## Status

- The interface, the fee and weight math, and the transaction encoding are covered by automated tests.
- **No live trade has been made with this code yet.** The trading logic is carried over from the prototype, whose live trading was also never fully validated. Test with small amounts before relying on it.
- The region gate is self-attestation only. It is not real geo-blocking until `VITE_GEO_ENDPOINT` is set (see `src/config/regions.ts`).

## Run it

Node 20.19+.

```bash
npm install
npm run dev        # local development
npm test           # unit tests
npm run build      # type-check and production build into dist/
```

Add `?demo` to the address (for example `http://localhost:5173/?demo`) to preview the interface with sample stocks and made-up prices. Buying is turned off in demo mode.

## Settings you are likely to change

| What | Where |
| --- | --- |
| Fee (0.25%), fee wallet, Quotrons share, donation list | `src/config/fees.ts` |
| Ready-made stacks | `src/config/stacks.ts` |
| Chain addresses; add a chain by adding a file | `src/config/chains/` |
| Restricted countries, geo endpoint | `src/config/regions.ts` |
| Colors and type | `src/theme.css`, `src/lib/gradient.ts` |

Optional environment variables (in `.env.local`):

- `VITE_REOWN_PROJECT_ID`: your Reown project ID. Email and social sign-in must also be enabled for the project in the Reown dashboard, and your domain added to its allowed origins.
- `VITE_GEO_ENDPOINT`: a URL that returns `{ "country": "US" }` for the visitor.

## How a buy works

1. The app reads the active stock pools from the on-chain registry and quotes each stock in the stack.
2. The fee is taken off the top; the rest is split by weight, with the last stock taking the rounding remainder.
3. The user approves the exact USDG amount to Permit2, then gives the router a one-hour permission for the same amount.
4. One Universal Router transaction performs every swap and transfers the fee. If any swap fails its minimum, the whole transaction reverts.

## Layout

```
src/config/     chains, fees, stacks, regions
src/lib/        pool discovery, quoting, allocation, approvals, transaction building
src/wallet/     Reown AppKit setup and the wallet hook
src/hooks.ts    pools, live quote and buy flow
src/pages/      Compose, Explore, Fees
tests/          allocation, weights and transaction-encoding tests
```
