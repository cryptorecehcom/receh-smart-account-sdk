// src/paymaster.ts
import { ethers } from "ethers";
import { ERC20_ABI } from "./abi.js";
import { RECEH_CONTRACTS, PAYMASTER_MODE } from "./constants.js";

/**
 * Cek saldo RECEH di Smart Account.
 */
export async function getRecehBalance(
  provider: ethers.Provider,
  smartAccount: string,
  recehToken: string = RECEH_CONTRACTS.RECEH_TOKEN,
): Promise<bigint> {
  const token = new ethers.Contract(recehToken, ERC20_ABI, provider);
  return await token.balanceOf(smartAccount);
}

/**
 * Cek allowance RECEH ke Paymaster.
 */
export async function getRecehAllowance(
  provider: ethers.Provider,
  smartAccount: string,
  paymaster: string = RECEH_CONTRACTS.PAYMASTER,
  recehToken: string = RECEH_CONTRACTS.RECEH_TOKEN,
): Promise<bigint> {
  const token = new ethers.Contract(recehToken, ERC20_ABI, provider);
  return await token.allowance(smartAccount, paymaster);
}

/**
 * Cek apakah RECEH sudah di-approve ke Paymaster.
 */
export async function isRecehApproved(
  provider: ethers.Provider,
  smartAccount: string,
  paymaster: string = RECEH_CONTRACTS.PAYMASTER,
  recehToken: string = RECEH_CONTRACTS.RECEH_TOKEN,
): Promise<boolean> {
  const allowance = await getRecehAllowance(
    provider,
    smartAccount,
    paymaster,
    recehToken,
  );
  return allowance > 0n;
}

/**
 * Cek apakah Smart Account punya saldo RECEH cukup.
 */
export async function hasEnoughReceh(
  provider: ethers.Provider,
  smartAccount: string,
  minAmount: bigint,
  recehToken: string = RECEH_CONTRACTS.RECEH_TOKEN,
): Promise<boolean> {
  const balance = await getRecehBalance(provider, smartAccount, recehToken);
  return balance >= minAmount;
}

export { PAYMASTER_MODE };