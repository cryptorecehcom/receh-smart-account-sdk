// src/userop.ts
import { ethers } from "ethers";
import {
  ENTRYPOINT_ABI,
  FACTORY_ABI,
  ACCOUNT_ABI,
} from "./abi.js";
import { DEFAULT_GAS, DEFAULT_SALT } from "./constants.js";
import type { UserOperation } from "./types.js";
import { isValidAddress } from "./utils.js";

/**
 * Build initCode untuk deploy Smart Account via UserOperation.
 */
export function buildInitCode(
  factoryAddress: string,
  owner: string,
  salt: bigint = DEFAULT_SALT,
): string {
  if (!isValidAddress(factoryAddress)) {
    throw new Error("[RecehSDK] factoryAddress tidak valid");
  }
  if (!isValidAddress(owner)) {
    throw new Error("[RecehSDK] owner tidak valid");
  }
  const iface = new ethers.Interface(FACTORY_ABI);
  const data = iface.encodeFunctionData("createAccount", [owner, salt]);
  return ethers.concat([factoryAddress, data]);
}

/**
 * Build callData untuk `execute(target, value, data)`.
 */
export function buildExecuteCallData(
  target: string,
  value: bigint = 0n,
  data: string = "0x",
): string {
  if (!isValidAddress(target)) {
    throw new Error("[RecehSDK] target tidak valid");
  }
  const iface = new ethers.Interface(ACCOUNT_ABI);
  return iface.encodeFunctionData("execute", [target, value, data]);
}

/**
 * Build callData untuk `executeOwner(target, value, data)`.
 * Dipakai untuk approve RECEH dari EOA (executeOwner only).
 */
export function buildExecuteOwnerCallData(
  target: string,
  value: bigint = 0n,
  data: string = "0x",
): string {
  if (!isValidAddress(target)) {
    throw new Error("[RecehSDK] target tidak valid");
  }
  const iface = new ethers.Interface(ACCOUNT_ABI);
  return iface.encodeFunctionData("executeOwner", [target, value, data]);
}

/**
 * Encode paymasterData.
 * Struktur: (uint8 mode, uint48 validUntil, uint48 validAfter, uint256 maxReceh, bytes32 policyId)
 */
export function encodePaymasterData(
  mode: number,
  validUntil: number = 0,
  validAfter: number = 0,
  maxReceh: bigint,
  policyId: string = ethers.ZeroHash,
): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint8", "uint48", "uint48", "uint256", "bytes32"],
    [mode, validUntil, validAfter, maxReceh, policyId],
  );
}

/**
 * Convert UserOp (BigInt) ke tuple untuk ABI encoding.
 */
export function toTuple(u: UserOperation): any[] {
  return [
    u.sender,
    u.nonce,
    u.initCode,
    u.callData,
    u.callGasLimit,
    u.verificationGasLimit,
    u.preVerificationGas,
    u.maxFeePerGas,
    u.maxPriorityFeePerGas,
    u.paymaster,
    u.paymasterData,
    u.signature,
  ];
}

/**
 * Convert UserOp (BigInt) menjadi JSON-safe (string).
 */
export function stringifyUserOp(u: UserOperation): Record<string, string> {
  return {
    sender: u.sender,
    nonce: u.nonce.toString(),
    initCode: u.initCode,
    callData: u.callData,
    callGasLimit: u.callGasLimit.toString(),
    verificationGasLimit: u.verificationGasLimit.toString(),
    preVerificationGas: u.preVerificationGas.toString(),
    maxFeePerGas: u.maxFeePerGas.toString(),
    maxPriorityFeePerGas: u.maxPriorityFeePerGas.toString(),
    paymaster: u.paymaster,
    paymasterData: u.paymasterData,
    signature: u.signature,
  };
}

/**
 * Build UserOperation lengkap dari parameter minimal.
 */
export async function buildUserOperation(params: {
  provider: ethers.Provider;
  owner: string;
  salt?: bigint;
  callData: string;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  paymaster: string;
  paymasterData: string;
  factory?: string;
  entryPoint?: string;
}): Promise<UserOperation> {
  const {
    provider,
    owner,
    salt = DEFAULT_SALT,
    callData,
    callGasLimit = DEFAULT_GAS.callGasLimit,
    verificationGasLimit = DEFAULT_GAS.verificationGasLimit,
    preVerificationGas = DEFAULT_GAS.preVerificationGas,
    paymaster,
    paymasterData,
    factory,
  } = params;

  if (!isValidAddress(owner)) throw new Error("[RecehSDK] owner tidak valid");
  if (!callData || callData === "0x")
    throw new Error("[RecehSDK] callData kosong");

  // Hitung sender (Smart Account address)
  const factoryAddr = factory || (await getDefaultFactory(provider));
  const factoryContract = new ethers.Contract(
    factoryAddr,
    FACTORY_ABI,
    provider,
  );
  const sender: string = await factoryContract.getAccountAddress(owner, salt);

  // Cek deploy
  const code = await provider.getCode(sender);
  const deployed = code !== "0x";

  // Ambil nonce
  let nonce = 0n;
  if (deployed) {
    const account = new ethers.Contract(sender, ACCOUNT_ABI, provider);
    nonce = await account.nonce();
  }

  // Init code (kosong kalau sudah deploy)
  const initCode = deployed ? "0x" : buildInitCode(factoryAddr, owner, salt);

  // Gas price dari RPC
  const gpHex = await provider.send("eth_gasPrice", []);
  const gp = BigInt(gpHex);
  const maxFeePerGas = gp;
  const maxPriorityFeePerGas = gp > 0n ? gp / 2n : 0n;

  return {
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    paymaster,
    paymasterData,
    signature: "0x",
  };
}

async function getDefaultFactory(provider: ethers.Provider): Promise<string> {
  // Ambil dari constants
  const { RECEH_CONTRACTS } = await import("./constants.js");
  return RECEH_CONTRACTS.ACCOUNT_FACTORY;
}

/**
 * Sign UserOperation dengan owner signer.
 * Menggunakan EIP-191 prefix, sesuai kontrak RecehSmartAccount.
 */
export async function signUserOperation(
  entryPointAddress: string,
  userOp: UserOperation,
  signer: ethers.Signer,
  provider: ethers.Provider,
): Promise<UserOperation> {
  if (!signer) throw new Error("[RecehSDK] signer wajib");
  if (!isValidAddress(entryPointAddress)) {
    throw new Error("[RecehSDK] entryPointAddress tidak valid");
  }

  const entryPoint = new ethers.Contract(
    entryPointAddress,
    ENTRYPOINT_ABI,
    provider,
  );

  const hash: string = await entryPoint.getUserOpHash(toTuple(userOp));
  const signature = await signer.signMessage(ethers.getBytes(hash));
  return { ...userOp, signature };
}

export { DEFAULT_GAS };