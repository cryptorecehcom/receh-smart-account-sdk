// src/index.ts
// ═══════════════════════════════════════════════════════════
// @receh/smart-account-sdk
// SDK untuk integrasi RECEH Smart Account di Riche Chain
// ═══════════════════════════════════════════════════════════

// ── Main Class ────────────────────────────────────────────
export { RecehSmartAccount } from "./smart-account.js";

// ── Constants ─────────────────────────────────────────────
export {
  RICHE_CHAIN,
  RECEH_CONTRACTS,
  BUNDLER_URL,
  DEFAULT_SALT,
  DEFAULT_GAS,
  PAYMASTER_MODE,
} from "./constants.js";

export type { PaymasterMode } from "./constants.js";

// ── ABI ───────────────────────────────────────────────────
export {
  ENTRYPOINT_ABI,
  FACTORY_ABI,
  ACCOUNT_ABI,
  ERC20_ABI,
} from "./abi.js";

// ── Types ─────────────────────────────────────────────────
export type {
  RecehSDKConfig,
  UserOperation,
  SendUserOperationParams,
  SubmitUserOpResult,
  SmartAccountStatus,
  TokenMetadata,
  SDKError,
} from "./types.js";

// ── UserOperation Helpers ─────────────────────────────────
export {
  buildInitCode,
  buildExecuteCallData,
  buildExecuteOwnerCallData,
  encodePaymasterData,
  toTuple,
  stringifyUserOp,
  buildUserOperation,
  signUserOperation,
} from "./userop.js";

// ── Bundler Helpers ───────────────────────────────────────
export {
  sendUserOperationToBundler,
  getStatus,
  waitForStatus,
} from "./bundler.js";

// ── Paymaster Helpers ─────────────────────────────────────
export {
  getRecehBalance,
  getRecehAllowance,
  isRecehApproved,
  hasEnoughReceh,
} from "./paymaster.js";

// ── ERC20 Helpers ─────────────────────────────────────────
export {
  getTokenMetadata,
  getTokenBalance,
  getTokenAllowance,
  encodeTransfer,
  encodeApprove,
  parseTokenAmount,
  formatTokenAmount,
} from "./erc20.js";

// ── Utils ─────────────────────────────────────────────────
export {
  shortAddress,
  isValidAddress,
  formatUnits,
  parseUnits,
  toHex,
  sleep,
} from "./utils.js";