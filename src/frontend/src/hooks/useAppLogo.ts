import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { backendInterface } from "../backend.d";
import { useActor } from "./useActor";

/**
 * Shared hook that fetches the app logo from the backend canister.
 * Returns the base64 data URL string, or null if not set.
 * Caches the result and can be invalidated by calling invalidateAppLogo().
 */
export function useAppLogo() {
  const { actor, isFetching } = useActor();

  const { data: logo = null } = useQuery<string | null>({
    queryKey: ["appLogo"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as unknown as backendInterface;
      return a.getAppLogo();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes — logo rarely changes
  });

  return logo;
}

export function useSetAppLogo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return async (logoDataUrl: string | null): Promise<void> => {
    if (!actor) throw new Error("Actor not ready");
    const a = actor as unknown as backendInterface;
    if (logoDataUrl !== null) {
      await a.setAppLogo(logoDataUrl);
    }
    // Invalidate so all components re-fetch immediately
    await queryClient.invalidateQueries({ queryKey: ["appLogo"] });
    // Optimistically update the cache right away
    queryClient.setQueryData(["appLogo"], logoDataUrl);
  };
}
