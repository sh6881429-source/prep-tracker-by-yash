import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type RegisterResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "invalidPhone";
    invalidPhone: null;
} | {
    __kind__: "invalidPin";
    invalidPin: null;
} | {
    __kind__: "phoneAlreadyTaken";
    phoneAlreadyTaken: null;
};
export interface AdminUserDetail {
    pin: string;
    name: string;
    createdAt: bigint;
    details: string;
    phone: string;
}
export interface StudySession {
    id: bigint;
    startTime: bigint;
    subject: string;
    endTime: bigint;
    date: string;
    durationSeconds: bigint;
    phone: string;
}
export type LoginResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "wrongPin";
    wrongPin: null;
} | {
    __kind__: "userNotFound";
    userNotFound: null;
};
export interface Subject {
    id: bigint;
    name: string;
    createdAt: bigint;
    chapterCount: bigint;
    phone: string;
}
export interface UserProfile {
    name: string;
    createdAt: bigint;
    details: string;
    phone: string;
}
export interface Chapter {
    id: bigint;
    status: string;
    subjectName: string;
    name: string;
    createdAt: bigint;
    subjectId: bigint;
    phone: string;
}
export enum DeleteResult {
    ok = "ok",
    userNotFound = "userNotFound"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChapter(phone: string, subjectId: bigint, name: string): Promise<{
        __kind__: "ok";
        ok: Chapter;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addSubject(phone: string, name: string): Promise<{
        __kind__: "ok";
        ok: Subject;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteChapter(phone: string, chapterId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteStudySession(phone: string, sessionId: bigint): Promise<boolean>;
    deleteSubject(phone: string, subjectId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteUser(phone: string): Promise<DeleteResult>;
    getAllUserDetails(): Promise<Array<AdminUserDetail>>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getCallerUserRole(): Promise<UserRole>;
    getChapters(phone: string, subjectId: bigint): Promise<Array<Chapter>>;
    getPendingChapters(phone: string): Promise<Array<Chapter>>;
    getPendingChaptersCount(phone: string): Promise<bigint>;
    getStudySessions(phone: string): Promise<Array<StudySession>>;
    getSubjects(phone: string): Promise<Array<Subject>>;
    getUserProfile(phone: string): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    loginUser(phone: string, pin: string): Promise<LoginResult>;
    registerUser(phone: string, name: string, details: string, pin: string): Promise<RegisterResult>;
    saveStudySession(phone: string, subject: string, durationSeconds: bigint, date: string, startTime: bigint, endTime: bigint): Promise<bigint>;
    updateChapterStatus(phone: string, chapterId: bigint, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
