// ─── Domain Types ────────────────────────────────────────────────────────────

export interface UserProfile {
  phone: string;
  name: string;
  details: string;
  createdAt: bigint;
}

export interface AdminUserDetail {
  phone: string;
  name: string;
  details: string;
  pin: string;
  createdAt: bigint;
}

export interface StudySession {
  id: bigint;
  phone: string;
  subject: string;
  durationSeconds: bigint;
  date: string;
  startTime: bigint;
  endTime: bigint;
}

export interface Subject {
  id: bigint;
  phone: string;
  name: string;
  createdAt: bigint;
  chapterCount: bigint;
}

export interface Chapter {
  id: bigint;
  subjectId: bigint;
  phone: string;
  name: string;
  status: string; // 'pending' | 'completed'
  createdAt: bigint;
  subjectName: string; // populated on pending list
}

// ─── Result Variants ─────────────────────────────────────────────────────────

export type LoginResult =
  | { __kind__: "ok"; ok: UserProfile }
  | { __kind__: "userNotFound" }
  | { __kind__: "wrongPin" };

export type RegisterResult =
  | { __kind__: "ok"; ok: UserProfile }
  | { __kind__: "phoneAlreadyTaken" }
  | { __kind__: "invalidPhone" }
  | { __kind__: "invalidPin" };

export type DeleteResultKind = "ok" | "notFound";

export const DeleteResult = {
  ok: "ok" as DeleteResultKind,
  notFound: "notFound" as DeleteResultKind,
};

// ─── Extended Backend Interface ───────────────────────────────────────────────

export interface AppBackend {
  // Auth
  loginUser(phone: string, pin: string): Promise<LoginResult>;
  registerUser(
    phone: string,
    name: string,
    details: string,
    pin: string,
  ): Promise<RegisterResult>;

  // Admin
  getAllUserDetails(): Promise<AdminUserDetail[]>;
  getAllUserProfiles(): Promise<UserProfile[]>;
  deleteUser(phone: string): Promise<DeleteResultKind>;

  // Study
  getStudySessions(phone: string): Promise<StudySession[]>;
  saveStudySession(
    phone: string,
    subject: string,
    durationSeconds: bigint,
    date: string,
    startTime: bigint,
    endTime: bigint,
  ): Promise<void>;
  deleteStudySession(phone: string, id: bigint): Promise<void>;

  // Syllabus — Subjects
  getSubjects(phone: string): Promise<Subject[]>;
  addSubject(
    phone: string,
    name: string,
  ): Promise<{ ok: Subject } | { err: string }>;
  deleteSubject(
    phone: string,
    subjectId: bigint,
  ): Promise<{ ok: null } | { err: string }>;

  // Syllabus — Chapters
  getChapters(phone: string, subjectId: bigint): Promise<Chapter[]>;
  addChapter(
    phone: string,
    subjectId: bigint,
    name: string,
  ): Promise<{ ok: Chapter } | { err: string }>;
  deleteChapter(
    phone: string,
    chapterId: bigint,
  ): Promise<{ ok: null } | { err: string }>;
  updateChapterStatus(
    phone: string,
    chapterId: bigint,
    status: string,
  ): Promise<{ ok: null } | { err: string }>;

  // Syllabus — Pending
  getPendingChapters(phone: string): Promise<Chapter[]>;
  getPendingChaptersCount(phone: string): Promise<bigint>;
}
