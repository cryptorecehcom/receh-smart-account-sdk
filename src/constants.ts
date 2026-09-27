// src/constants.ts

// ═══════════════════════════════════════════════════════════
// CHAIN CONFIG — Riche Chain
// ═══════════════════════════════════════════════════════════
export const RICHE_CHAIN = {
  id: 132026,
  hex: "0x203BA",
  name: "Riche Chain",
  shortName: "RICHE",
  rpc: "https://seed-richechain.com/",
  explorer: "https://richescan.com/",
  nativeCurrency: {
    name: "RIC",
    symbol: "RIC",
    decimals: 18,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// CONTRACT ADDRESSES — RECEH Smart Account System
// ═══════════════════════════════════════════════════════════
export const RECEH_CONTRACTS = {
  ENTRY_POINT: "0xf3E22FB1cd8cB9a40bFC8B20fDD85d74514E48c0",
  ACCOUNT_FACTORY: "0xDB0bfD7221bf3F6036C7ec9e9277B75E40D46BC9",
  PAYMASTER: "0x444C0c970E1bDB13549C944663A4e11ad38D4E5C",
  RECEH_TOKEN: "0x4c9C431Fa7fD104c0E7230d20E1623E62019A1C5",
} as const;

// ═══════════════════════════════════════════════════════════
// BUNDLER
// ═══════════════════════════════════════════════════════════
export const BUNDLER_URL = "https://receh.web.id/gas";

// ═══════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════
export const DEFAULT_SALT = 1n;

export const DEFAULT_GAS = {
  callGasLimit: 300000n,
  verificationGasLimit: 250000n,
  preVerificationGas: 60000n,
} as const;

// ═══════════════════════════════════════════════════════════
// PAYMASTER MODE
// ═══════════════════════════════════════════════════════════
export const PAYMASTER_MODE = {
  USER_PAYS: 0,
  SPONSORED: 1,
} as const;

export type PaymasterMode = (typeof PAYMASTER_MODE)[keyof typeof PAYMASTER_MODE];