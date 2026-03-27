import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useAuth } from "../context/AuthContext";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  const { identity: iiIdentity } = useInternetIdentity();
  const { identity: credentialIdentity } = useAuth();
  const queryClient = useQueryClient();

  // Prefer credential-derived identity over II, then anonymous
  const activeIdentity = iiIdentity ?? credentialIdentity ?? null;

  const actorQuery = useQuery<backendInterface>({
    queryKey: [
      ACTOR_QUERY_KEY,
      activeIdentity ? activeIdentity.getPrincipal().toString() : "anon",
    ],
    queryFn: async () => {
      if (!activeIdentity) {
        // Anonymous actor
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: { identity: activeIdentity },
      };

      const actor = await createActorWithConfig(actorOptions);

      // Initialize access control if admin token present
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      if (adminToken) {
        await actor._initializeAccessControlWithSecret(adminToken);
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
