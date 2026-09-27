// src/erc20.ts
import { ethers } from "ethers";
import { ERC20_ABI } from "./abi.js";
import { isValidAddress } from "./utils.js";
import type { TokenMetadata } from "./types.js";

/**
 * Dapatkan metadata token ERC-20.
 */
export async function getTokenMetadata(
  provider: ethers.Provider,
  tokenAddress: string,
): Promise<TokenMetadata> {
  if (!isValidAddress(tokenAddress)) {
    throw new Error("[RecehSDK] tokenAddress tidak valid");
  }
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [name, symbol, decimals] = await Promise.all([
    token.name().catch(() => "Unknown"),
    token.symbol().catch(() => "???"),
    token.decimals().catch(() => 18),
  ]);
  return {
    address: tokenAddress,
    name,
    symbol,
    decimals: Number(decimals),
  };
}

/**
 * Dapatkan saldo token ERC-20 di alamat tertentu.
 */
export async function getTokenBalance(
  provider: ethers.Provider,
  tokenAddress: string,
  holder: string,
): Promise<bigint> {
  if (!isValidAddress(tokenAddress))
    throw new Error("[RecehSDK] tokenAddress tidak valid");
  if (!isValidAddress(holder))
    throw new Error("[RecehSDK] holder tidak valid");
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await token.balanceOf(holder);
}

/**
 * Dapatkan allowance token ERC-20.
 */
export async function getTokenAllowance(
  provider: ethers.Provider,
  tokenAddress: string,
  owner: string,
  spender: string,
): Promise<bigint> {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await token.allowance(owner, spender);
}

/**
 * Encode calldata untuk `transfer(to, amount)`.
 */
export function encodeTransfer(to: string, amount: bigint): string {
  if (!isValidAddress(to)) throw new Error("[RecehSDK] to address tidak valid");
  const iface = new ethers.Interface(ERC20_ABI);
  return iface.encodeFunctionData("transfer", [to, amount]);
}

/**
 * Encode calldata untuk `approve(spender, amount)`.
 */
export function encodeApprove(spender: string, amount: bigint): string {
  if (!isValidAddress(spender))
    throw new Error("[RecehSDK] spender address tidak valid");
  const iface = new ethers.Interface(ERC20_ABI);
  return iface.encodeFunctionData("approve", [spender, amount]);
}

/**
 * Parse amount ke BigInt dengan decimals token.
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Format BigInt amount ke string dengan decimals token.
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return ethers.formatUnits(amount, decimals);
}