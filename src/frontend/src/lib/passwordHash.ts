/**
 * Secure password hashing utility using Web Crypto API.
 * Uses SHA-256 with a fixed application salt.
 * This runs in the browser and produces a consistent hex hash.
 */

const SALT = "OMKAR_JWELLERS_SALT_2024";

/**
 * Hash a plain text password using SHA-256 + salt.
 * Returns a lowercase hex string (64 chars).
 */
export async function hashPassword(plainText: string): Promise<string> {
  const input = SALT + plainText;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Returns true if the string looks like a SHA-256 hex hash (64 hex chars).
 * Used to detect plain-text passwords that haven't been migrated yet.
 */
export function isHashed(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
