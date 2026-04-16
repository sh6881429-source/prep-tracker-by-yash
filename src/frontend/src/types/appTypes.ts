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

// ─── Gym Types ────────────────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "rest";

export interface GymRecord {
  id: string;
  phone: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note: string;
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

export type AttendanceResult =
  | { __kind__: "ok"; ok: GymRecord }
  | { __kind__: "unauthorized"; unauthorized: null };

// ─── Notes & PDF Types ────────────────────────────────────────────────────────

export interface Note {
  id: string;
  phone: string;
  subject: string;
  title: string;
  content: string;
  colorTag: string;
  isPinned: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Pdf {
  id: string;
  phone: string;
  subject: string;
  filename: string;
  fileData: Uint8Array;
  contentType: string;
  createdAt: bigint;
}

export type NoteResult =
  | { __kind__: "ok"; ok: Note }
  | { __kind__: "notFound"; notFound: null }
  | { __kind__: "unauthorized"; unauthorized: null };

export type PdfResult =
  | { __kind__: "ok"; ok: Pdf }
  | { __kind__: "notFound"; notFound: null }
  | { __kind__: "unauthorized"; unauthorized: null };

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

  // Gym
  getGymAttendance(phone: string): Promise<GymRecord[]>;
  markGymAttendance(
    phone: string,
    date: string,
    status: AttendanceStatus,
    note: string,
  ): Promise<AttendanceResult>;
  getGymStreak(phone: string, todayDate: string): Promise<bigint>;

  // Notes
  getNotes(phone: string): Promise<Note[]>;
  addNote(
    phone: string,
    subject: string,
    title: string,
    content: string,
    colorTag: string,
    isPinned: boolean,
  ): Promise<NoteResult>;
  updateNote(
    phone: string,
    id: string,
    subject: string,
    title: string,
    content: string,
    colorTag: string,
    isPinned: boolean,
  ): Promise<NoteResult>;
  deleteNote(phone: string, id: string): Promise<boolean>;
  toggleNotePin(phone: string, id: string): Promise<NoteResult>;

  // PDFs
  getPdfs(phone: string): Promise<Pdf[]>;
  uploadPdf(
    phone: string,
    subject: string,
    filename: string,
    fileData: Uint8Array,
    contentType: string,
  ): Promise<PdfResult>;
  getPdfFile(id: string): Promise<Uint8Array | null>;
  deletePdf(phone: string, id: string): Promise<boolean>;
}
