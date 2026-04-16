import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AdminUserDetail {
    pin: string;
    name: string;
    createdAt: bigint;
    details: string;
    phone: string;
}
export type NoteResult = {
    __kind__: "ok";
    ok: Note;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export type PdfResult = {
    __kind__: "ok";
    ok: Pdf;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export type AttendanceResult = {
    __kind__: "ok";
    ok: GymAttendance;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface Chapter {
    id: bigint;
    status: string;
    subjectName: string;
    name: string;
    createdAt: bigint;
    subjectId: bigint;
    phone: string;
}
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
export interface GymAttendance {
    id: string;
    status: AttendanceStatus;
    date: string;
    note: string;
    phone: string;
}
export interface Pdf {
    id: string;
    subject: string;
    contentType: string;
    createdAt: bigint;
    fileData: Uint8Array;
    filename: string;
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
export interface Note {
    id: string;
    title: string;
    content: string;
    subject: string;
    createdAt: bigint;
    updatedAt: bigint;
    colorTag: string;
    phone: string;
    isPinned: boolean;
}
export enum AttendanceStatus {
    present = "present",
    rest = "rest",
    absent = "absent"
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
    addNote(phone: string, subject: string, title: string, content: string, colorTag: string, isPinned: boolean): Promise<NoteResult>;
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
    deleteNote(phone: string, id: string): Promise<boolean>;
    deletePdf(phone: string, id: string): Promise<boolean>;
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
    getAppLogo(): Promise<string | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChapters(phone: string, subjectId: bigint): Promise<Array<Chapter>>;
    getGymAttendance(phone: string): Promise<Array<GymAttendance>>;
    getGymStreak(phone: string, todayDate: string): Promise<bigint>;
    getNotes(phone: string): Promise<Array<Note>>;
    getPdfFile(id: string): Promise<Uint8Array | null>;
    getPdfs(phone: string): Promise<Array<Pdf>>;
    getPendingChapters(phone: string): Promise<Array<Chapter>>;
    getPendingChaptersCount(phone: string): Promise<bigint>;
    getStudySessions(phone: string): Promise<Array<StudySession>>;
    getSubjects(phone: string): Promise<Array<Subject>>;
    getUserProfile(phone: string): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    loginUser(phone: string, pin: string): Promise<LoginResult>;
    markGymAttendance(phone: string, date: string, status: AttendanceStatus, note: string): Promise<AttendanceResult>;
    registerUser(phone: string, name: string, details: string, pin: string): Promise<RegisterResult>;
    saveStudySession(phone: string, subject: string, durationSeconds: bigint, date: string, startTime: bigint, endTime: bigint): Promise<bigint>;
    setAppLogo(logo: string): Promise<void>;
    toggleNotePin(phone: string, id: string): Promise<NoteResult>;
    updateChapterStatus(phone: string, chapterId: bigint, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateNote(phone: string, id: string, subject: string, title: string, content: string, colorTag: string, isPinned: boolean): Promise<NoteResult>;
    uploadPdf(phone: string, subject: string, filename: string, fileData: Uint8Array, contentType: string): Promise<PdfResult>;
}
