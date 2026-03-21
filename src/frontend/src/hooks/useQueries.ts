import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useGetProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLoginMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.login(username, password);
      const profile = await actor.getCallerUserProfile();
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRegisterMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      username: string;
      password: string;
      displayName: string;
      businessName: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.registerUser(
        data.username,
        data.displayName,
        data.businessName,
        data.password,
      );
      await actor.login(data.username, data.password);
      const profile = await actor.getCallerUserProfile();
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateProfileMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
