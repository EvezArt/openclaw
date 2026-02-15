/**
 * Timeout utilities for promise-based operations.
 */

/**
 * Wraps a promise with a timeout that rejects if the promise doesn't resolve in time.
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @returns The original promise result, or rejects with timeout error
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }
  let timer: NodeJS.Timeout | null = null;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

/**
 * Wraps a promise with a timeout that returns a fallback value if the promise doesn't resolve in time.
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param fallback Fallback value to return on timeout
 * @returns The original promise result, or the fallback value on timeout
 */
export async function withTimeoutFallback<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

/**
 * Wraps a fetch call with a timeout using AbortController.
 * @param url URL to fetch
 * @param timeoutMs Timeout in milliseconds
 * @param init Optional fetch init options
 * @returns Fetch response
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(250, timeoutMs));
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
