import type { Ed25519KeyIdentity } from "@dfinity/identity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type UserProfile, UserRole } from "../backend";
import { createActorWithConfig } from "../config";
import { deriveIdentityFromCredentials } from "../utils/identityUtils";

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

      // 3. Validate credentials on the canister (throws on failure)
      await actor.login(username, password);

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

      // 3. Register on canister (throws if username taken)
      await actor.registerUser(
        data.username,
        data.displayName,
        data.businessName,
        data.password,
      );

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
