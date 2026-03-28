import type { Ed25519KeyIdentity } from "@dfinity/identity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type UserProfile, UserRole } from "../backend";
import { createActorWithConfig } from "../config";
import { deriveIdentityFromCredentials } from "../utils/identityUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCanisterStopped(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("IC0508") ||
    msg.includes("is stopped") ||
    msg.includes("CallContextManager")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 3000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isCanisterStopped(err) && attempt < retries) {
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: { username: string; password: string }): Promise<{
      profile: UserProfile;
      identity: Ed25519KeyIdentity;
    }> => {
      // 1. Derive deterministic identity from credentials
      const identity = await deriveIdentityFromCredentials(username, password);

      // 2. Create actor with that identity
      const actor = await createActorWithConfig({ agentOptions: { identity } });

      // 3. Validate credentials on the canister — auto-retry up to 3x if stopped
      await withRetry(() => actor.login(username, password), 3, 3000).catch(
        (err) => {
          if (isCanisterStopped(err)) {
            throw new Error(
              "Server is starting up. Please wait a moment and try again.",
            );
          }
          throw err;
        },
      );

      // 4. Retrieve full profile from canister
      const profile = await actor.getCallerUserProfile();

      return { profile, identity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      password: string;
      displayName: string;
      businessName: string;
    }): Promise<{ profile: UserProfile; identity: Ed25519KeyIdentity }> => {
      // 1. Derive deterministic identity
      const identity = await deriveIdentityFromCredentials(
        data.username,
        data.password,
      );

      // 2. Create actor with that identity
      const actor = await createActorWithConfig({ agentOptions: { identity } });

      // 3. Register on canister — auto-retry up to 3x if stopped
      await withRetry(
        () =>
          actor.registerUser(
            data.username,
            data.displayName,
            data.businessName,
            data.password,
          ),
        3,
        3000,
      ).catch((err) => {
        if (isCanisterStopped(err)) {
          throw new Error(
            "Server is starting up. Please wait a moment and try again.",
          );
        }
        throw err;
      });

      // 4. Read back the saved profile
      const profile = await actor.getCallerUserProfile();

      return { profile, identity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      localStorage.setItem("saarathi_profile", JSON.stringify(profile));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
