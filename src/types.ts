// src/types.ts
import type { Eip1193Provider, Signer } from "ethers";

export interface RecehSDKConfig {
  /** Alamat EOA user (owner Smart Account) */
  owner: string;

  /** EIP-1193 provider (window.ethereum, Reown, dll) */
  provider: Eip1193Provider | any;

  /** Salt untuk derive Smart Account (default: 1n) */
  salt?: bigint;

  /** Custom bundler URL */
  bundlerUrl?: string;

  /** Custom EntryPoint address */
  entryPoint?: string;

  /** Custom Factory address */
  factory?: string;

  /** Custom Paymaster address */
  paymaster?: string;

  /** Custom RECEH token address */
  recehToken?: string;
}

export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymaster: string;
  paymasterData: string;
  signature: string;
}

export interface SendUserOperationParams {
  /** Alamat kontrak yang dipanggil */
  target: string;

  /** Value dalam wei (untuk native token) */
  value?: bigint;

  /** Calldata (encoded function call) */
  data?: string;

  /** Max RECEH yang boleh dipotong untuk gas (default: 1 RECEH) */
  maxReceh?: bigint;

  /** Paymaster mode: 0 = USER_PAYS, 1 = SPONSORED */
  mode?: number;

  /** Valid until timestamp (0 = tidak ada limit) */
  validUntil?: number;

  /** Valid after timestamp (0 = langsung aktif) */
  validAfter?: number;

  /** Policy ID (bytes32) */
  policyId?: string;

  /** Custom gas limit */
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;

  /** Wait for confirmation? (default: true) */
  wait?: boolean;

  /** Timeout (ms) */
  timeoutMs?: number;
}

export interface SubmitUserOpResult {
  ok: boolean;
  userOpHash: string;
  txHash?: string;
  status: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

export interface SmartAccountStatus {
  address: string;
  isDeployed: boolean;
  nonce: bigint;
  owner: string;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface SDKError extends Error {
  code?: string;
  details?: unknown;
}

export type { Signer };