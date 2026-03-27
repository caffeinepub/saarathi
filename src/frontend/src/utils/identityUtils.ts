/**
 * Derives a deterministic Ed25519KeyIdentity from username + password.
 * The same credentials on any device produce the same ICP principal.
 */
import { Ed25519KeyIdentity } from "@dfinity/identity";

/**
 * Hash username:password with SHA-256 → 32-byte seed → Ed25519KeyIdentity
 */
export async function deriveIdentityFromCredentials(
  username: string,
  password: string,
): Promise<Ed25519KeyIdentity> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`saarathi:${username.toLowerCase()}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const seed = new Uint8Array(hashBuffer); // 32 bytes
  return Ed25519KeyIdentity.generate(seed);
}

// ── Persistence helpers ───────────────────────────────────────────────────────

const IDENTITY_KEY = "saarathi_identity_keypair";

export function saveIdentity(identity: Ed25519KeyIdentity): void {
  const json = JSON.stringify(identity.toJSON());
  localStorage.setItem(IDENTITY_KEY, json);
}

export function loadIdentity(): Ed25519KeyIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Ed25519KeyIdentity.fromJSON(raw);
  } catch {
    return null;
  }
}

export function clearIdentity(): void {
  localStorage.removeItem(IDENTITY_KEY);
}
