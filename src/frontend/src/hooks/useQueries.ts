import { useQuery } from "@tanstack/react-query";
import type {
  AdminUserDetail,
  AppBackend,
  UserProfile,
} from "../types/appTypes";
import { useActor } from "./useActor";

export function useCallerUserRole() {
  // UserRole / getCallerUserRole no longer supported in the current backend.
  // Returns null safely so existing call sites still compile.
  return useQuery<null>({
    queryKey: ["callerUserRole"],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      const a = actor as unknown as AppBackend;
      // Method may not exist in current backend — fail gracefully
      if (
        typeof (a as unknown as Record<string, unknown>).isCallerAdmin !==
        "function"
      )
        return false;
      return (
        actor as unknown as { isCallerAdmin(): Promise<boolean> }
      ).isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as AppBackend;
      return a.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUserDetails() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminUserDetail[]>({
    queryKey: ["allUserDetails"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as AppBackend;
      return a.getAllUserDetails();
    },
    enabled: !!actor && !isFetching,
  });
}
