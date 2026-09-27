// src/bundler.ts
import { BUNDLER_URL } from "./constants.js";
import type { SubmitUserOpResult } from "./types.js";

/**
 * Kirim UserOperation ke bundler RECEH.
 */
export async function sendUserOperationToBundler(params: {
  bundlerUrl?: string;
  owner: string;
  salt: string;
  userOperation: Record<string, string>;
}): Promise<SubmitUserOpResult> {
  const url = `${params.bundlerUrl || BUNDLER_URL}/v1/user-operation`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: params.owner,
        salt: params.salt,
        userOperation: params.userOperation,
      }),
    });
  } catch (e) {
    throw new Error(
      "[RecehSDK] Bundler tidak dapat dijangkau: " + (e as Error).message,
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    throw new Error(
      "[RecehSDK] Bundler error: " + (data.error || `HTTP ${res.status}`),
    );
  }

  return data as SubmitUserOpResult;
}

/**
 * Cek status UserOperation di bundler.
 */
export async function getStatus(
  userOpHash: string,
  bundlerUrl?: string,
): Promise<SubmitUserOpResult> {
  const url = `${bundlerUrl || BUNDLER_URL}/v1/status/${userOpHash}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(
      "[RecehSDK] Status tidak dapat dijangkau: " + (e as Error).message,
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(
      "[RecehSDK] Status error: " + (data.error || `HTTP ${res.status}`),
    );
  }

  return data as SubmitUserOpResult;
}

/**
 * Polling sampai UserOperation confirmed / reverted / failed.
 */
export async function waitForStatus(
  userOpHash: string,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    bundlerUrl?: string;
  } = {},
): Promise<SubmitUserOpResult> {
  const { timeoutMs = 120000, intervalMs = 3000, bundlerUrl } = options;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const s = await getStatus(userOpHash, bundlerUrl);
      if (
        s.status === "confirmed" ||
        s.status === "reverted" ||
        s.status === "failed"
      ) {
        return s;
      }
    } catch {
      // ignore, retry
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("[RecehSDK] Timeout menunggu konfirmasi UserOp");
}