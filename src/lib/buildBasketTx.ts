import { AbiCoder, Interface, hexlify } from "ethers";
import type { ChainConfig } from "../config/chains";
import { ROUTER_ABI, SWAP_PARAM_TYPE } from "./abis";
import { buysZeroForOne } from "./pools";
import type { BasketQuote } from "./types";

// Universal Router commands
const V4_SWAP = 0x10;
const PERMIT2_TRANSFER_FROM = 0x02;
// Uniswap V4 actions inside a V4_SWAP
const SWAP_EXACT_IN_SINGLE = 0x06;
const SETTLE_ALL = 0x0c;
const TAKE_ALL = 0x0f;

const coder = AbiCoder.defaultAbiCoder();
const routerInterface = new Interface(ROUTER_ABI);
const hexByte = (n: number) => n.toString(16).padStart(2, "0");

export interface BasketTx {
  to: string;
  data: string;
  value: bigint;
  deadline: number;
}

/**
 * Build the single Universal Router transaction that buys every leg of the
 * stack and then transfers the app fee. Either everything succeeds or the
 * whole transaction reverts.
 */
export function buildBasketTx(quote: BasketQuote, chain: ChainConfig, feeRecipient: string, nowSeconds: number): BasketTx {
  let commands = "0x";
  const inputs: string[] = [];
  const actions = hexlify(Uint8Array.from([SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL]));

  for (const leg of quote.legs) {
    const zeroForOne = buysZeroForOne(leg.pool, chain);
    const { key } = leg.pool;
    const tokenIn = zeroForOne ? key.currency0 : key.currency1;
    const tokenOut = zeroForOne ? key.currency1 : key.currency0;

    const swap = coder.encode(
      [SWAP_PARAM_TYPE],
      [{ poolKey: key, zeroForOne, amountIn: leg.amountIn, amountOutMinimum: leg.minOut, minHopPriceX36: 0, hookData: "0x" }],
    );
    const settle = coder.encode(["address", "uint256"], [tokenIn, leg.amountIn]);
    const take = coder.encode(["address", "uint256"], [tokenOut, leg.minOut]);

    commands += hexByte(V4_SWAP);
    inputs.push(coder.encode(["bytes", "bytes[]"], [actions, [swap, settle, take]]));
  }

  if (quote.feeRaw > 0n) {
    commands += hexByte(PERMIT2_TRANSFER_FROM);
    inputs.push(coder.encode(["address", "address", "uint160"], [chain.payToken.address, feeRecipient, quote.feeRaw]));
  }

  const deadline = nowSeconds + 900;
  return {
    to: chain.contracts.universalRouter,
    data: routerInterface.encodeFunctionData("execute", [commands, inputs, deadline]),
    value: 0n,
    deadline,
  };
}
