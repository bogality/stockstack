import { AbiCoder, Interface } from "ethers";
import { describe, expect, it } from "vitest";
import { robinhood } from "../src/config/chains/robinhood";
import { ROUTER_ABI, SWAP_PARAM_TYPE } from "../src/lib/abis";
import { buildBasketTx } from "../src/lib/buildBasketTx";
import { quoteBasket } from "../src/lib/quote";
import type { Pool } from "../src/lib/types";

const coder = AbiCoder.defaultAbiCoder();
const USDG = robinhood.payToken.address;
const HOOK = "0x00000000000000000000000000000000000000aa";
const FEE_TO = "0x00000000000000000000000000000000000000fe";

// One pool where USDG is currency0 and one where it is currency1, to cover both swap directions.
const pools: Pool[] = [
  { id: "0x" + "11".repeat(32), key: { currency0: USDG, currency1: "0x" + "c1".repeat(20), fee: 3000n, tickSpacing: 60n, hooks: HOOK }, token: { address: "0x" + "c1".repeat(20), symbol: "NVDA", decimals: 18 } },
  { id: "0x" + "22".repeat(32), key: { currency0: "0x" + "01".repeat(20), currency1: USDG, fee: 500n, tickSpacing: 10n, hooks: HOOK }, token: { address: "0x" + "01".repeat(20), symbol: "SPY", decimals: 18 } },
];

async function build() {
  const quote = await quoteBasket({
    items: [
      { symbol: "NVDA", weight: 60 },
      { symbol: "SPY", weight: 40 },
    ],
    pools,
    totalRaw: 1_000_000_000n,
    feeBps: 25n,
    slippageBps: 50n,
    quoteLeg: async (_pool, amountIn) => amountIn * 2n,
  });
  return { quote, tx: buildBasketTx(quote, robinhood, FEE_TO, 1_700_000_000) };
}

describe("buildBasketTx", () => {
  it("targets the router with one swap per leg followed by the fee transfer", async () => {
    const { tx } = await build();
    expect(tx.to).toBe(robinhood.contracts.universalRouter);
    expect(tx.value).toBe(0n);
    const [commands, inputs, deadline] = new Interface(ROUTER_ABI).decodeFunctionData("execute", tx.data);
    expect(commands).toBe("0x101002");
    expect(inputs.length).toBe(3);
    expect(deadline).toBe(1_700_000_900n);
  });

  it("encodes each swap with the right direction, amount in and minimum out", async () => {
    const { quote, tx } = await build();
    const [, inputs] = new Interface(ROUTER_ABI).decodeFunctionData("execute", tx.data);

    const expectLeg = (index: number, zeroForOne: boolean, tokenOut: string) => {
      const [actions, params] = coder.decode(["bytes", "bytes[]"], inputs[index]);
      expect(actions).toBe("0x060c0f");
      const [swap] = coder.decode([SWAP_PARAM_TYPE], params[0]);
      const leg = quote.legs[index];
      expect(swap.zeroForOne).toBe(zeroForOne);
      expect(swap.amountIn).toBe(leg.amountIn);
      expect(swap.amountOutMinimum).toBe(leg.minOut);
      expect(swap.poolKey.fee).toBe(leg.pool.key.fee);
      const [settleToken, settleAmount] = coder.decode(["address", "uint256"], params[1]);
      expect(settleToken.toLowerCase()).toBe(USDG.toLowerCase());
      expect(settleAmount).toBe(leg.amountIn);
      const [takeToken, takeAmount] = coder.decode(["address", "uint256"], params[2]);
      expect(takeToken.toLowerCase()).toBe(tokenOut.toLowerCase());
      expect(takeAmount).toBe(leg.minOut);
    };
    expectLeg(0, true, pools[0].token.address);
    expectLeg(1, false, pools[1].token.address);
  });

  it("spends exactly the total: swaps plus fee", async () => {
    const { quote, tx } = await build();
    const [, inputs] = new Interface(ROUTER_ABI).decodeFunctionData("execute", tx.data);
    const [token, to, feeAmount] = coder.decode(["address", "address", "uint160"], inputs[2]);
    expect(token.toLowerCase()).toBe(USDG.toLowerCase());
    expect(to.toLowerCase()).toBe(FEE_TO.toLowerCase());
    expect(feeAmount).toBe(2_500_000n);
    expect(quote.legs.reduce((sum, l) => sum + l.amountIn, 0n) + feeAmount).toBe(1_000_000_000n);
    expect(quote.legs[0].minOut).toBe((quote.legs[0].expectedOut * 9950n) / 10000n);
  });

  it("fails clearly when a stock has no pool", async () => {
    await expect(
      quoteBasket({ items: [{ symbol: "ZZZ", weight: 100 }], pools, totalRaw: 1_000_000n, feeBps: 25n, slippageBps: 50n, quoteLeg: async () => 1n }),
    ).rejects.toThrow(/ZZZ/);
  });
});
