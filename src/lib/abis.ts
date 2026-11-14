const POOL_KEY = "tuple(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)";

export const REGISTRY_ABI = [
  `function activePools() view returns (tuple(${POOL_KEY} key, bytes32 id, bool active)[])`,
];

export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

export const PERMIT2_ABI = [
  "function allowance(address owner,address token,address spender) view returns (uint160 amount,uint48 expiration,uint48 nonce)",
  "function approve(address token,address spender,uint160 amount,uint48 expiration)",
];

export const QUOTER_ABI = [
  `function quoteExactInputSingle(tuple(${POOL_KEY} poolKey, bool zeroForOne, uint128 exactAmount, bytes hookData) params) returns (uint256 amountOut, uint256 gasEstimate)`,
];

export const ROUTER_ABI = ["function execute(bytes commands,bytes[] inputs,uint256 deadline) payable"];

/** Swap parameters as this chain's Universal Router expects them (carried over from the prototype). */
export const SWAP_PARAM_TYPE = `tuple(${POOL_KEY} poolKey, bool zeroForOne, uint128 amountIn, uint128 amountOutMinimum, uint256 minHopPriceX36, bytes hookData)`;
