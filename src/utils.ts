// src/utils.ts
import { ethers } from "ethers";

export function shortAddress(addr: string, len = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-len)}`;
}

export function isValidAddress(addr: string): boolean {
  return ethers.isAddress(addr);
}

export function formatUnits(value: bigint, decimals = 18): string {
  try {
    return ethers.formatUnits(value, decimals);
  } catch {
    return "0";
  }
}

export function parseUnits(value: string, decimals = 18): bigint {
  try {
    return ethers.parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}

export function toHex(value: bigint | number): string {
  return "0x" + BigInt(value).toString(16);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function logError(label: string, err: unknown): void {
  const e = err as any;
  const msg = e?.shortMessage || e?.reason || e?.message || String(err);
  console.error(`[RecehSDK] ${label}:`, msg);
}

export function ensureHex(value: string | undefined, fallback = "0x"): string {
  if (!value) return fallback;
  if (!value.startsWith("0x")) return "0x" + value;
  return value;
}