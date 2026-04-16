import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminUserDetail,
  AppBackend,
  AttendanceStatus,
  GymRecord,
  UserProfile,
} from "../types/appTypes";
import { useActor } from "./useActor";

export function useCallerUserRole() {
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

// ─── Gym Hooks ─────────────────────────────────────────────────────────────

export function useGymAttendance(phone: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GymRecord[]>({
    queryKey: ["gymAttendance", phone],
    queryFn: async () => {
      if (!actor || !phone) return [];
      const a = actor as unknown as AppBackend;
      return a.getGymAttendance(phone);
    },
    enabled: !!actor && !isFetching && !!phone,
  });
}

export function useGymStreak(phone: string, todayDate: string) {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["gymStreak", phone, todayDate],
    queryFn: async () => {
      if (!actor || !phone) return 0;
      const a = actor as unknown as AppBackend;
      const result = await a.getGymStreak(phone, todayDate);
      return Number(result);
    },
    enabled: !!actor && !isFetching && !!phone,
  });
}

export function useMarkGymAttendance(phone: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      status,
      note,
    }: {
      date: string;
      status: AttendanceStatus;
      note: string;
    }) => {
      if (!actor || !phone) throw new Error("Not ready");
      const a = actor as unknown as AppBackend;
      return a.markGymAttendance(phone, date, status, note);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["gymAttendance", phone],
      });
      void queryClient.invalidateQueries({ queryKey: ["gymStreak", phone] });
    },
  });
}
