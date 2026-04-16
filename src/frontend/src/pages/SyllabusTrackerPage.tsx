import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Plus,
  RotateCcw,
  Target,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import type { AppBackend, Chapter, Subject } from "../types/appTypes";

// ─── Revision storage (localStorage per user) ────────────────────────────────
function revKey(phone: string, chapterId: bigint) {
  return `rev_${phone}_${String(chapterId)}`;
}
function targetKey(phone: string, chapterId: bigint) {
  return `revtarget_${phone}_${String(chapterId)}`;
}
function getRevCount(phone: string, chapterId: bigint): number {
  return Number.parseInt(
    localStorage.getItem(revKey(phone, chapterId)) ?? "0",
    10,
  );
}
function getRevTarget(phone: string, chapterId: bigint): number {
  return Number.parseInt(
    localStorage.getItem(targetKey(phone, chapterId)) ?? "1",
    10,
  );
}
function setRevCount(phone: string, chapterId: bigint, val: number) {
  localStorage.setItem(revKey(phone, chapterId), String(Math.max(0, val)));
}
function setRevTarget(phone: string, chapterId: bigint, val: number) {
  localStorage.setItem(targetKey(phone, chapterId), String(Math.max(1, val)));
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.96 }}
        transition={{ duration: 0.22, type: "spring", bounce: 0.25 }}
        className="w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.18 0.08 264) 0%, oklch(0.22 0.06 264) 100%)",
        }}
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-white/90 font-medium leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              onClick={onCancel}
              data-ocid="confirm.cancel.button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={onConfirm}
              data-ocid="confirm.delete.button"
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────
function SubjectCard({
  subject,
  index,
  onSelect,
  onDelete,
}: {
  subject: Subject;
  index: number;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const chapterCount = Number(subject.chapterCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", bounce: 0.3 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      onClick={onSelect}
      data-ocid={`syllabus.subject.row.${index + 1}`}
    >
      {/* Gradient border left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.48 0.22 264) 0%, oklch(0.68 0.18 195) 100%)",
        }}
      />
      <div
        className="ml-1 p-4 rounded-r-2xl border border-l-0 transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.97 0.01 240) 100%)",
          borderColor: "oklch(0.93 0.01 240)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.12) 0%, oklch(0.68 0.18 195 / 0.08) 100%)",
            }}
          >
            <BookOpen
              className="w-5 h-5"
              style={{ color: "oklch(0.48 0.22 264)" }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {subject.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
            </p>
            {/* Progress bar placeholder — actual progress shown in detail view */}
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full w-0"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.48 0.22 264) 0%, oklch(0.68 0.18 195) 100%)",
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              data-ocid={`syllabus.subject.delete.${index + 1}`}
              aria-label="Delete subject"
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Chapter Card ─────────────────────────────────────────────────────────────
function ChapterCard({
  chapter,
  index,
  phone,
  onDelete,
  onStatusChange,
}: {
  chapter: Chapter;
  index: number;
  phone: string;
  onDelete: () => void;
  onStatusChange: (completed: boolean) => void;
}) {
  const [revCount, setRevCountState] = useState(() =>
    getRevCount(phone, chapter.id),
  );
  const [revTarget, _setRevTargetState] = useState(() =>
    getRevTarget(phone, chapter.id),
  );
  const [tickAnim, setTickAnim] = useState(false);

  const isCompleted = revCount >= revTarget;
  const progressPct = Math.min(100, (revCount / Math.max(1, revTarget)) * 100);

  function handleTick() {
    const next = revCount + 1;
    setRevCount(phone, chapter.id, next);
    setRevCountState(next);
    setTickAnim(true);
    setTimeout(() => setTickAnim(false), 500);
    if (next >= revTarget && chapter.status === "pending") {
      onStatusChange(true);
    }
  }

  function handleUndo() {
    const next = Math.max(0, revCount - 1);
    setRevCount(phone, chapter.id, next);
    setRevCountState(next);
    if (next < revTarget && chapter.status === "completed") {
      onStatusChange(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", bounce: 0.25 }}
      className="group relative rounded-2xl overflow-hidden"
      data-ocid={`syllabus.chapter.row.${index + 1}`}
    >
      {/* Completed: green left border; pending: cyan */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{
          background: isCompleted
            ? "linear-gradient(180deg, oklch(0.6 0.17 145) 0%, oklch(0.75 0.14 155) 100%)"
            : "linear-gradient(180deg, oklch(0.68 0.18 195) 0%, oklch(0.48 0.22 264) 100%)",
        }}
      />
      <div
        className="ml-1 p-4 rounded-r-2xl border border-l-0 transition-all duration-300"
        style={{
          background: isCompleted
            ? "linear-gradient(135deg, oklch(0.97 0.02 145 / 0.6) 0%, oklch(0.99 0.01 145) 100%)"
            : "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.005 240) 100%)",
          borderColor: isCompleted
            ? "oklch(0.6 0.17 145 / 0.25)"
            : "oklch(0.93 0.01 240)",
        }}
      >
        <div className="flex items-start gap-3">
          {/* Tick button */}
          <motion.button
            type="button"
            onClick={handleTick}
            animate={
              tickAnim
                ? {
                    scale: [1, 1.4, 0.9, 1],
                    backgroundColor: "oklch(0.6 0.17 145 / 0.2)",
                  }
                : {}
            }
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 border-2 mt-0.5"
            style={{
              borderColor: isCompleted
                ? "oklch(0.6 0.17 145)"
                : "oklch(0.68 0.18 195)",
              background: isCompleted
                ? "oklch(0.6 0.17 145 / 0.15)"
                : "oklch(0.68 0.18 195 / 0.1)",
            }}
            data-ocid={`syllabus.chapter.tick.${index + 1}`}
            aria-label="Log revision"
          >
            <Check
              className="w-4 h-4"
              style={{
                color: isCompleted
                  ? "oklch(0.6 0.17 145)"
                  : "oklch(0.68 0.18 195)",
              }}
            />
          </motion.button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`text-sm font-bold truncate ${
                  isCompleted
                    ? "text-foreground/70 line-through"
                    : "text-foreground"
                }`}
              >
                {chapter.name}
              </p>
              {isCompleted && (
                <Badge
                  className="text-[10px] h-4 px-1.5 shrink-0 font-semibold border"
                  style={{
                    background: "oklch(0.6 0.17 145 / 0.12)",
                    color: "oklch(0.45 0.17 145)",
                    borderColor: "oklch(0.6 0.17 145 / 0.3)",
                  }}
                >
                  Done
                </Badge>
              )}
            </div>

            {/* Revision progress */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">
                  Target: {revTarget}
                </span>
              </div>
              <span
                className="text-[11px] font-bold"
                style={{
                  color: isCompleted
                    ? "oklch(0.6 0.17 145)"
                    : "oklch(0.48 0.22 264)",
                }}
              >
                {revCount} / {revTarget}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isCompleted
                    ? "linear-gradient(90deg, oklch(0.6 0.17 145) 0%, oklch(0.75 0.14 155) 100%)"
                    : "linear-gradient(90deg, oklch(0.68 0.18 195) 0%, oklch(0.48 0.22 264) 100%)",
                }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {/* Undo button */}
            <motion.button
              type="button"
              onClick={handleUndo}
              disabled={revCount === 0}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-30"
              data-ocid={`syllabus.chapter.undo.${index + 1}`}
              aria-label="Undo revision"
            >
              <RotateCcw className="w-3 h-3" />
            </motion.button>
            {/* Delete */}
            <motion.button
              type="button"
              onClick={onDelete}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              data-ocid={`syllabus.chapter.delete.${index + 1}`}
              aria-label="Delete chapter"
            >
              <Trash2 className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Subjects List View ───────────────────────────────────────────────────────
function SubjectsView({
  phone,
  actor,
  onSelectSubject,
}: {
  phone: string;
  actor: AppBackend;
  onSelectSubject: (subject: Subject) => void;
}) {
  type TabView = "subjects" | "pending";
  const [view, setView] = useState<TabView>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingChapters, setPendingChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Subject | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await actor.getSubjects(phone);
      setSubjects([...data].sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [phone, actor]);

  const loadPending = useCallback(async () => {
    try {
      const data = await actor.getPendingChapters(phone);
      setPendingChapters(
        [...data].sort((a, b) => Number(b.createdAt - a.createdAt)),
      );
    } catch {
      /* silent */
    }
  }, [phone, actor]);

  useEffect(() => {
    loadSubjects();
    loadPending();
  }, [loadSubjects, loadPending]);

  useEffect(() => {
    if (view === "pending") loadPending();
  }, [view, loadPending]);

  async function handleAddSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    setAddingSubject(true);
    try {
      const result = await actor.addSubject(phone, name);
      if ("ok" in result) {
        setNewSubjectName("");
        await loadSubjects();
      }
    } finally {
      setAddingSubject(false);
      inputRef.current?.focus();
    }
  }

  async function handleDeleteSubject(subject: Subject) {
    try {
      await actor.deleteSubject(phone, subject.id);
      await Promise.all([loadSubjects(), loadPending()]);
    } catch {
      /* silent */
    } finally {
      setConfirmDelete(null);
    }
  }

  // Pending chapters that haven't met their revision target
  const reallyPending = pendingChapters.filter(
    (ch) => getRevCount(phone, ch.id) < getRevTarget(phone, ch.id),
  );

  return (
    <div className="space-y-4" data-ocid="syllabus.subjects.panel">
      {/* Tab toggle */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ background: "oklch(0.93 0.01 240)" }}
        data-ocid="syllabus.view.toggle"
      >
        {(["subjects", "pending"] as TabView[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setView(tab)}
            className="flex-1 text-sm font-semibold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
            style={
              view === tab
                ? {
                    background: "oklch(1 0 0)",
                    color: "oklch(0.18 0.08 264)",
                    boxShadow: "0 1px 4px oklch(0.18 0.08 264 / 0.12)",
                  }
                : { color: "oklch(0.5 0.02 250)" }
            }
            data-ocid={`syllabus.tab.${tab}`}
          >
            {tab === "pending" ? (
              <>
                <Clock className="w-3.5 h-3.5" />
                Pending
                {reallyPending.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "oklch(0.48 0.22 264)" }}
                  >
                    {reallyPending.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <BookMarked className="w-3.5 h-3.5" />
                Subjects
              </>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === "subjects" ? (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Add Subject input */}
            <div
              className="rounded-2xl p-3 border"
              style={{
                background:
                  "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.97 0.01 240) 100%)",
                borderColor: "oklch(0.93 0.01 240)",
              }}
            >
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="New subject name…"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                  className="flex-1 h-9 text-sm"
                  data-ocid="syllabus.subject.input"
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    size="sm"
                    onClick={handleAddSubject}
                    disabled={addingSubject || !newSubjectName.trim()}
                    className="h-9 px-4 font-semibold shadow-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.38 0.18 264) 100%)",
                      color: "white",
                    }}
                    data-ocid="syllabus.subject.add.button"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Subjects list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-14"
                data-ocid="syllabus.subjects.empty"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.1) 0%, oklch(0.68 0.18 195 / 0.08) 100%)",
                  }}
                >
                  <BookMarked
                    className="w-8 h-8"
                    style={{ color: "oklch(0.48 0.22 264 / 0.5)" }}
                  />
                </div>
                <p className="font-bold text-foreground">No subjects yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Add a subject above to get started
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2.5">
                {subjects.map((subject, i) => (
                  <SubjectCard
                    key={String(subject.id)}
                    subject={subject}
                    index={i}
                    onSelect={() => onSelectSubject(subject)}
                    onDelete={() => setConfirmDelete(subject)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {reallyPending.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-14"
                data-ocid="syllabus.pending.empty"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.6 0.17 145 / 0.1) 0%, oklch(0.75 0.14 155 / 0.08) 100%)",
                  }}
                >
                  <Check
                    className="w-8 h-8"
                    style={{ color: "oklch(0.6 0.17 145 / 0.6)" }}
                  />
                </div>
                <p className="font-bold text-foreground">All caught up!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  No pending chapters right now
                </p>
              </motion.div>
            ) : (
              reallyPending.map((chapter, i) => {
                const revCount = getRevCount(phone, chapter.id);
                const revTarget = getRevTarget(phone, chapter.id);
                const needed = revTarget - revCount;
                return (
                  <motion.div
                    key={String(chapter.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative rounded-2xl overflow-hidden"
                    data-ocid={`syllabus.pending.row.${i + 1}`}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                      style={{
                        background:
                          "linear-gradient(180deg, oklch(0.65 0.2 30) 0%, oklch(0.75 0.18 40) 100%)",
                      }}
                    />
                    <div
                      className="ml-1 px-4 py-3.5 rounded-r-2xl border border-l-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.005 240) 100%)",
                        borderColor: "oklch(0.93 0.01 240)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {chapter.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">
                              {chapter.subjectName}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ·
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "oklch(0.65 0.2 30)" }}
                            >
                              {needed} revision{needed !== 1 ? "s" : ""} left
                            </span>
                          </div>
                          {/* mini progress bar */}
                          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (revCount / Math.max(1, revTarget)) * 100)}%`,
                                background:
                                  "linear-gradient(90deg, oklch(0.65 0.2 30) 0%, oklch(0.75 0.18 40) 100%)",
                              }}
                            />
                          </div>
                        </div>
                        <Badge
                          className="text-[10px] h-5 px-2 font-semibold shrink-0 border"
                          style={{
                            background: "oklch(0.65 0.2 30 / 0.1)",
                            color: "oklch(0.5 0.18 30)",
                            borderColor: "oklch(0.65 0.2 30 / 0.25)",
                          }}
                        >
                          {revCount}/{revTarget}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            message={`Delete "${confirmDelete.name}"? This will also remove all its chapters.`}
            onConfirm={() => handleDeleteSubject(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subject Detail (Chapters) ────────────────────────────────────────────────
function SubjectDetailView({
  subject,
  phone,
  actor,
  onBack,
}: {
  subject: Subject;
  phone: string;
  actor: AppBackend;
  onBack: () => void;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChapterName, setNewChapterName] = useState("");
  const [newRevTarget, setNewRevTarget] = useState("1");
  const [addingChapter, setAddingChapter] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Chapter | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadChapters = useCallback(async () => {
    try {
      const data = await actor.getChapters(phone, subject.id);
      setChapters([...data].sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [phone, actor, subject.id]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  async function handleAddChapter() {
    const name = newChapterName.trim();
    if (!name) return;
    setAddingChapter(true);
    try {
      const result = await actor.addChapter(phone, subject.id, name);
      if ("ok" in result) {
        const target = Math.max(1, Number.parseInt(newRevTarget, 10) || 1);
        setRevTarget(phone, result.ok.id, target);
        setNewChapterName("");
        setNewRevTarget("1");
        await loadChapters();
      }
    } finally {
      setAddingChapter(false);
      inputRef.current?.focus();
    }
  }

  async function handleDeleteChapter(chapter: Chapter) {
    try {
      await actor.deleteChapter(phone, chapter.id);
      await loadChapters();
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleStatusChange(chapter: Chapter, completed: boolean) {
    const next = completed ? "completed" : "pending";
    try {
      await actor.updateChapterStatus(phone, chapter.id, next);
      await loadChapters();
    } catch {
      /* silent */
    }
  }

  // Subject-level progress stats
  const totalChapters = chapters.length;
  const completedCount = chapters.filter(
    (ch) => getRevCount(phone, ch.id) >= getRevTarget(phone, ch.id),
  ).length;
  const subjectProgress =
    totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return (
    <div className="space-y-4" data-ocid="syllabus.detail.panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.93 }}
          className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.97 0.01 240) 100%)",
            borderColor: "oklch(0.93 0.01 240)",
          }}
          data-ocid="syllabus.detail.back.button"
          aria-label="Back to subjects"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">
            {subject.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {totalChapters} chapter{totalChapters !== 1 ? "s" : ""} ·{" "}
            {completedCount} completed
          </p>
        </div>
        {/* Subject progress badge */}
        <div
          className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            background:
              subjectProgress === 100
                ? "oklch(0.6 0.17 145 / 0.12)"
                : "oklch(0.48 0.22 264 / 0.1)",
            color:
              subjectProgress === 100
                ? "oklch(0.45 0.17 145)"
                : "oklch(0.48 0.22 264)",
          }}
        >
          {subjectProgress}%
        </div>
      </div>

      {/* Subject progress bar */}
      {totalChapters > 0 && (
        <div
          className="rounded-2xl p-3 border"
          style={{
            borderColor: "oklch(0.93 0.01 240)",
            background: "oklch(0.985 0.005 240)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Subject Progress
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: "oklch(0.48 0.22 264)" }}
            >
              {completedCount}/{totalChapters} chapters
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  subjectProgress === 100
                    ? "linear-gradient(90deg, oklch(0.6 0.17 145) 0%, oklch(0.75 0.14 155) 100%)"
                    : "linear-gradient(90deg, oklch(0.48 0.22 264) 0%, oklch(0.68 0.18 195) 100%)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${subjectProgress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Add Chapter */}
      <div
        className="rounded-2xl p-3 border space-y-2"
        style={{
          background:
            "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.97 0.01 240) 100%)",
          borderColor: "oklch(0.93 0.01 240)",
        }}
      >
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="New chapter name…"
            value={newChapterName}
            onChange={(e) => setNewChapterName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
            className="flex-1 h-9 text-sm"
            data-ocid="syllabus.chapter.input"
          />
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                max="99"
                value={newRevTarget}
                onChange={(e) => setNewRevTarget(e.target.value)}
                className="w-16 h-9 text-sm text-center"
                placeholder="Rev"
                data-ocid="syllabus.chapter.target.input"
              />
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                onClick={handleAddChapter}
                disabled={addingChapter || !newChapterName.trim()}
                className="h-9 px-4 font-semibold shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.38 0.18 264) 100%)",
                  color: "white",
                }}
                data-ocid="syllabus.chapter.add.button"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </motion.div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground pl-0.5">
          Set a revision target (how many times to revise this chapter)
        </p>
      </div>

      {/* Chapters */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : chapters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-14"
          data-ocid="syllabus.chapters.empty"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.1) 0%, oklch(0.68 0.18 195 / 0.08) 100%)",
            }}
          >
            <BookOpen
              className="w-8 h-8"
              style={{ color: "oklch(0.48 0.22 264 / 0.5)" }}
            />
          </div>
          <p className="font-bold text-foreground">No chapters yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Add a chapter above to start tracking
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {chapters.map((chapter, i) => (
            <ChapterCard
              key={String(chapter.id)}
              chapter={chapter}
              index={i}
              phone={phone}
              onDelete={() => setConfirmDelete(chapter)}
              onStatusChange={(completed) =>
                handleStatusChange(chapter, completed)
              }
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            message={`Delete "${confirmDelete.name}"?`}
            onConfirm={() => handleDeleteChapter(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SyllabusTrackerPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const { session } = useAppAuth();
  const phone = session?.role === "user" ? session.phone : "";
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as AppBackend | null;
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  if (!actor || !phone) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="syllabus.page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.93 }}
          className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.97 0.01 240) 100%)",
            borderColor: "oklch(0.93 0.01 240)",
          }}
          data-ocid="syllabus.page.back.button"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="min-w-0">
          <h2
            className="text-lg font-black tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.48 0.22 264) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Syllabus Tracker
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage your subjects &amp; chapters
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedSubject ? (
          <motion.div
            key={`detail-${String(selectedSubject.id)}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25, type: "spring", bounce: 0.2 }}
          >
            <SubjectDetailView
              subject={selectedSubject}
              phone={phone}
              actor={actor}
              onBack={() => setSelectedSubject(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="subjects-list"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25, type: "spring", bounce: 0.2 }}
          >
            <SubjectsView
              phone={phone}
              actor={actor}
              onSelectSubject={setSelectedSubject}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
