// src/smart-account.ts
import { ethers } from "ethers";
import { FACTORY_ABI, ACCOUNT_ABI, ERC20_ABI } from "./abi.js";
import {
  RECEH_CONTRACTS,
  RICHE_CHAIN,
  BUNDLER_URL,
  DEFAULT_SALT,
  DEFAULT_GAS,
} from "./constants.js";
import type {
  RecehSDKConfig,
  SmartAccountStatus,
  SendUserOperationParams,
  SubmitUserOpResult,
} from "./types.js";
import { isValidAddress, logError } from "./utils.js";
import {
  buildExecuteCallData,
  encodePaymasterData,
  buildUserOperation,
  signUserOperation,
  stringifyUserOp,
} from "./userop.js";
import {
  sendUserOperationToBundler,
  waitForStatus,
} from "./bundler.js";

/**
 * RecehSmartAccount — kelas utama untuk interaksi dengan Smart Account RECEH.
 *
 * @example
 * ```ts
 * const account = new RecehSmartAccount({
 *   owner: "0x...",
 *   provider: window.ethereum,
 * });
 *
 * await account.deploy();
 * await account.depositReceh(parseUnits("100", 18));
 * await account.sendUserOperation({
 *   target: "0xToken...",
 *   data: encodeTransfer("0xRecipient", parseUnits("10", 18)),
 * });
 * ```
 */
export class RecehSmartAccount {
  public readonly owner: string;
  public readonly salt: bigint;
  public readonly config: Required<RecehSDKConfig>;
  public readonly readProvider: ethers.JsonRpcProvider;
  public provider?: ethers.BrowserProvider;
  public signer?: ethers.Signer;

  constructor(config: RecehSDKConfig) {
    if (!config.owner || !isValidAddress(config.owner)) {
      throw new Error("[RecehSDK] owner address tidak valid");
    }
    if (!config.provider) {
      throw new Error("[RecehSDK] provider wajib");
    }

    this.owner = ethers.getAddress(config.owner);
    this.salt = config.salt ?? DEFAULT_SALT;

    this.config = {
      owner: this.owner,
      provider: config.provider,
      salt: this.salt,
      bundlerUrl: config.bundlerUrl ?? BUNDLER_URL,
      entryPoint: config.entryPoint ?? RECEH_CONTRACTS.ENTRY_POINT,
      factory: config.factory ?? RECEH_CONTRACTS.ACCOUNT_FACTORY,
      paymaster: config.paymaster ?? RECEH_CONTRACTS.PAYMASTER,
      recehToken: config.recehToken ?? RECEH_CONTRACTS.RECEH_TOKEN,
    } as Required<RecehSDKConfig>;

    this.readProvider = new ethers.JsonRpcProvider(RICHE_CHAIN.rpc);
  }

  /**
   * Inisialisasi signer dari provider (lazy).
   */
  async init(): Promise<ethers.Signer> {
    if (!this.signer) {
      this.provider = new ethers.BrowserProvider(this.config.provider);
      this.signer = await this.provider.getSigner();
    }
    return this.signer;
  }

  /**
   * Dapatkan provider yang sudah siap.
   */
  async getProvider(): Promise<ethers.BrowserProvider> {
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(this.config.provider);
    }
    return this.provider;
  }

  /**
   * Hitung alamat Smart Account (deterministik).
   */
  async getAddress(): Promise<string> {
    const factory = new ethers.Contract(
      this.config.factory,
      FACTORY_ABI,
      this.readProvider,
    );
    try {
      return await factory.getAccountAddress(this.owner, this.salt);
    } catch (e) {
      logError("getAddress", e);
      throw new Error(
        "[RecehSDK] Gagal hitung Smart Account address: " +
          (e as Error).message,
      );
    }
  }

  /**
   * Cek apakah Smart Account sudah di-deploy.
   */
  async isDeployed(): Promise<boolean> {
    const addr = await this.getAddress();
    const code = await this.readProvider.getCode(addr);
    return code !== "0x";
  }

  /**
   * Dapatkan nonce Smart Account saat ini.
   */
  async getNonce(): Promise<bigint> {
    const addr = await this.getAddress();
    if (!(await this.isDeployed())) return 0n;
    const account = new ethers.Contract(addr, ACCOUNT_ABI, this.readProvider);
    return await account.nonce();
  }

  /**
   * Dapatkan status lengkap Smart Account.
   */
  async getStatus(): Promise<SmartAccountStatus> {
    const addr = await this.getAddress();
    const deployed = await this.isDeployed();
    const nonce = deployed ? await this.getNonce() : 0n;
    return {
      address: addr,
      isDeployed: deployed,
      nonce,
      owner: this.owner,
    };
  }

  /**
   * Deploy Smart Account (tx biasa, gas RIC dari EOA owner).
   * Kalau sudah deploy, langsung return alamat.
   */
  async deploy(): Promise<string> {
    const addr = await this.getAddress();

    if (await this.isDeployed()) {
      return addr;
    }

    const signer = await this.init();
    const factory = new ethers.Contract(
      this.config.factory,
      FACTORY_ABI,
      signer,
    );

    const tx = await factory.createAccount(this.owner, this.salt);
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("[RecehSDK] Deploy Smart Account gagal");
    }

    return addr;
  }

  /**
   * Kirim UserOperation dari Smart Account.
   * Gas dibayar RECEH (via Paymaster).
   */
  async sendUserOperation(
    params: SendUserOperationParams,
  ): Promise<SubmitUserOpResult> {
    const signer = await this.init();
    const provider = await this.getProvider();

    const {
      target,
      value = 0n,
      data = "0x",
      maxReceh = ethers.parseUnits("1", 18),
      mode = 0,
      validUntil = 0,
      validAfter = 0,
      policyId = ethers.ZeroHash,
      callGasLimit = DEFAULT_GAS.callGasLimit,
      verificationGasLimit = DEFAULT_GAS.verificationGasLimit,
      preVerificationGas = DEFAULT_GAS.preVerificationGas,
      wait = true,
      timeoutMs = 120000,
    } = params;

    // Build callData
    const callData = buildExecuteCallData(target, value, data);

    // Encode paymasterData
    const paymasterData = encodePaymasterData(
      mode,
      validUntil,
      validAfter,
      maxReceh,
      policyId,
    );

    // Build UserOperation
    const userOp = await buildUserOperation({
      provider: this.readProvider,
      owner: this.owner,
      salt: this.salt,
      callData,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      paymaster: this.config.paymaster,
      paymasterData,
    });

    // Sign
    const signedOp = await signUserOperation(
      this.config.entryPoint,
      userOp,
      signer,
      this.readProvider,
    );

    // Submit ke bundler
    const submitted = await sendUserOperationToBundler({
      bundlerUrl: this.config.bundlerUrl,
      owner: this.owner,
      salt: this.salt.toString(),
      userOperation: stringifyUserOp(signedOp),
    });

    if (!wait) {
      return submitted;
    }

    // Polling status
    return await waitForStatus(submitted.userOpHash, {
      timeoutMs,
      bundlerUrl: this.config.bundlerUrl,
    });
  }

  /**
   * Deposit RECEH dari EOA ke Smart Account.
   */
  async depositReceh(amount: bigint): Promise<ethers.TransactionResponse> {
    if (amount <= 0n) throw new Error("[RecehSDK] amount harus > 0");
    const signer = await this.init();
    const smartAccount = await this.getAddress();
    const token = new ethers.Contract(this.config.recehToken, ERC20_ABI, signer);
    return await token.transfer(smartAccount, amount);
  }

  /**
   * Deposit token ERC-20 ke Smart Account.
   */
  async depositToken(
    tokenAddress: string,
    amount: bigint,
  ): Promise<ethers.TransactionResponse> {
    if (!isValidAddress(tokenAddress)) {
      throw new Error("[RecehSDK] tokenAddress tidak valid");
    }
    if (amount <= 0n) throw new Error("[RecehSDK] amount harus > 0");
    const signer = await this.init();
    const smartAccount = await this.getAddress();
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    return await token.transfer(smartAccount, amount);
  }

  /**
   * Deposit RIC (native) ke Smart Account.
   */
  async depositNative(amount: bigint): Promise<ethers.TransactionResponse> {
    if (amount <= 0n) throw new Error("[RecehSDK] amount harus > 0");
    const signer = await this.init();
    const smartAccount = await this.getAddress();
    return await signer.sendTransaction({
      to: smartAccount,
      value: amount,
    });
  }

  /**
   * Withdraw token dari Smart Account ke owner (EOA).
   */
  async withdraw(
    tokenAddress: string | null,
    amount: bigint,
  ): Promise<SubmitUserOpResult> {
    if (amount <= 0n) throw new Error("[RecehSDK] amount harus > 0");

    if (tokenAddress === null || tokenAddress === "NATIVE") {
      // Native: execute(owner, amount, "0x")
      return await this.sendUserOperation({
        target: this.owner,
        value: amount,
        data: "0x",
      });
    }

    // ERC-20: transfer(owner, amount)
    if (!isValidAddress(tokenAddress)) {
      throw new Error("[RecehSDK] tokenAddress tidak valid");
    }
    const iface = new ethers.Interface(ERC20_ABI);
    const transferData = iface.encodeFunctionData("transfer", [
      this.owner,
      amount,
    ]);
    return await this.sendUserOperation({
      target: tokenAddress,
      value: 0n,
      data: transferData,
    });
  }

  /**
   * Kirim token dari Smart Account ke address lain.
   */
  async sendToken(
    tokenAddress: string | null,
    to: string,
    amount: bigint,
  ): Promise<SubmitUserOpResult> {
    if (!isValidAddress(to)) {
      throw new Error("[RecehSDK] to address tidak valid");
    }
    if (amount <= 0n) throw new Error("[RecehSDK] amount harus > 0");

    if (tokenAddress === null || tokenAddress === "NATIVE") {
      return await this.sendUserOperation({
        target: to,
        value: amount,
        data: "0x",
      });
    }

    const iface = new ethers.Interface(ERC20_ABI);
    const transferData = iface.encodeFunctionData("transfer", [to, amount]);
    return await this.sendUserOperation({
      target: tokenAddress,
      value: 0n,
      data: transferData,
    });
  }
}