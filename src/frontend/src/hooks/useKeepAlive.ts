import { useEffect } from "react";
import { createActorWithConfig } from "../config";
import { useAuth } from "../context/AuthContext";
import { asExtended } from "../utils/backendExtensions";

const PING_INTERVAL_MS = 25_000; // 25 seconds

/**
 * Sends a lightweight canister query every 25 seconds while the user
 * is logged in. This prevents the canister from being stopped due to
 * inactivity (IC0508 "canister is stopped").
 */
export function useKeepAlive() {
  const { isLoggedIn, identity } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) return;

    const ping = async () => {
      try {
        const actor = await createActorWithConfig(
          identity ? { agentOptions: { identity } } : undefined,
        );
        const ext = asExtended(actor);
        // getAllPublicUsers is a cheap query — we just fire and forget
        await ext.getAllPublicUsers();
      } catch {
        // Silently ignore — keep-alive pings are best-effort
      }
    };

    // Ping immediately, then on interval
    ping();
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoggedIn, identity]);
}
