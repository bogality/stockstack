import { Contract, type Provider, type Signer } from "ethers";
import type { ChainConfig } from "../config/chains";
import { ERC20_ABI, PERMIT2_ABI } from "./abis";

export interface WalletStatus {
  balance: bigint;
  balanceOK: boolean;
  /** Pay token → Permit2 allowance covers the amount. */
  tokenApproved: boolean;
  /** Permit2 → router allowance covers the amount and hasn't expired. */
  routerApproved: boolean;
}

/** How long the router permission lasts once granted. */
const ROUTER_PERMISSION_SECONDS = 60 * 60;

export async function readWalletStatus(provider: Provider, chain: ChainConfig, owner: string, required: bigint): Promise<WalletStatus> {
  const token = new Contract(chain.payToken.address, ERC20_ABI, provider);
  const permit2 = new Contract(chain.contracts.permit2, PERMIT2_ABI, provider);
  const [balance, tokenAllowance, permit] = await Promise.all([
    token.balanceOf(owner) as Promise<bigint>,
    token.allowance(owner, chain.contracts.permit2) as Promise<bigint>,
    permit2.allowance(owner, chain.payToken.address, chain.contracts.universalRouter),
  ]);
  const now = Math.floor(Date.now() / 1000);
  return {
    balance,
    balanceOK: balance >= required,
    tokenApproved: tokenAllowance >= required,
    routerApproved: (permit.amount as bigint) >= required && Number(permit.expiration) > now,
  };
}

/** Step 1: let Permit2 move exactly `amount` of the pay token. */
export async function approveToken(signer: Signer, chain: ChainConfig, amount: bigint): Promise<void> {
  const token = new Contract(chain.payToken.address, ERC20_ABI, signer);
  const tx = await token.approve(chain.contracts.permit2, amount);
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error("The approval transaction failed.");
}

/** Step 2: let the router spend exactly `amount` through Permit2, for one hour. */
export async function approveRouter(signer: Signer, chain: ChainConfig, amount: bigint): Promise<void> {
  const permit2 = new Contract(chain.contracts.permit2, PERMIT2_ABI, signer);
  const expiration = Math.floor(Date.now() / 1000) + ROUTER_PERMISSION_SECONDS;
  const tx = await permit2.approve(chain.payToken.address, chain.contracts.universalRouter, amount, expiration);
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error("The permission transaction failed.");
}
