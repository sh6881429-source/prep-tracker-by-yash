import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Check,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import type { AppBackend, Chapter, Subject } from "../types/appTypes";

type View = "subjects" | "pending";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border p-5 space-y-4"
      >
        <p className="text-sm text-foreground font-medium leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
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
      </motion.div>
    </div>
  );
}

// ─── Subjects List ────────────────────────────────────────────────────────────
function SubjectsView({
  phone,
  actor,
  onSelectSubject,
}: {
  phone: string;
  actor: AppBackend;
  onSelectSubject: (subject: Subject) => void;
}) {
  const [view, setView] = useState<View>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingChapters, setPendingChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Subject | null>(null);
  const [markingId, setMarkingId] = useState<bigint | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await actor.getSubjects(phone);
      setSubjects([...data].sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch {
      // silent
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
      // silent
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
      // silent
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleMarkCompleted(chapter: Chapter) {
    setMarkingId(chapter.id);
    try {
      await actor.updateChapterStatus(phone, chapter.id, "completed");
      await loadPending();
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="space-y-4" data-ocid="syllabus.subjects.panel">
      {/* Tab toggle */}
      <div
        className="flex rounded-xl bg-muted p-1 gap-1"
        data-ocid="syllabus.view.toggle"
      >
        <button
          type="button"
          onClick={() => setView("subjects")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 ${
            view === "subjects"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
          data-ocid="syllabus.tab.subjects"
        >
          Subjects
        </button>
        <button
          type="button"
          onClick={() => setView("pending")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            view === "pending"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
          data-ocid="syllabus.tab.pending"
        >
          <Clock className="w-3.5 h-3.5" />
          Pending
          {pendingChapters.length > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {pendingChapters.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === "subjects" ? (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Add Subject */}
            <Card className="shadow-none border-border">
              <CardContent className="p-3">
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
                  <Button
                    size="sm"
                    onClick={handleAddSubject}
                    disabled={addingSubject || !newSubjectName.trim()}
                    className="h-9 px-3"
                    data-ocid="syllabus.subject.add.button"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-1">Add</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subjects list */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="syllabus.subjects.empty"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                  <BookMarked className="w-7 h-7 text-primary/60" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  No subjects yet
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Add a subject above to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {subjects.map((subject, i) => (
                  <motion.div
                    key={String(subject.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      type="button"
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/30 hover:border-primary/25 transition-all duration-200 group cursor-pointer w-full text-left"
                      onClick={() => onSelectSubject(subject)}
                      data-ocid={`syllabus.subject.row.${i + 1}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {subject.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(subject.chapterCount)} chapter
                          {Number(subject.chapterCount) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(subject);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        data-ocid={`syllabus.subject.delete.${i + 1}`}
                        aria-label="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {pendingChapters.length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="syllabus.pending.empty"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-primary/60" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  All caught up!
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  No pending chapters right now
                </p>
              </div>
            ) : (
              pendingChapters.map((chapter, i) => (
                <motion.div
                  key={String(chapter.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card"
                    data-ocid={`syllabus.pending.row.${i + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {chapter.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.subjectName}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkCompleted(chapter)}
                      disabled={markingId === chapter.id}
                      className="h-7 px-2.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
                      data-ocid={`syllabus.pending.complete.${i + 1}`}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Done
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm delete dialog */}
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
  const [addingChapter, setAddingChapter] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Chapter | null>(null);
  const [togglingId, setTogglingId] = useState<bigint | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadChapters = useCallback(async () => {
    try {
      const data = await actor.getChapters(phone, subject.id);
      setChapters([...data].sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch {
      // silent
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
        setNewChapterName("");
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

  async function handleToggleStatus(chapter: Chapter) {
    setTogglingId(chapter.id);
    const next = chapter.status === "pending" ? "completed" : "pending";
    try {
      await actor.updateChapterStatus(phone, chapter.id, next);
      await loadChapters();
    } finally {
      setTogglingId(null);
    }
  }

  const pending = chapters.filter((c) => c.status === "pending");
  const completed = chapters.filter((c) => c.status === "completed");

  return (
    <div className="space-y-4" data-ocid="syllabus.detail.panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent/40 transition-colors"
          data-ocid="syllabus.detail.back.button"
          aria-label="Back to subjects"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">
            {subject.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} ·{" "}
            {pending.length} pending
          </p>
        </div>
      </div>

      {/* Add Chapter */}
      <Card className="shadow-none border-border">
        <CardContent className="p-3">
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
            <Button
              size="sm"
              onClick={handleAddChapter}
              disabled={addingChapter || !newChapterName.trim()}
              className="h-9 px-3"
              data-ocid="syllabus.chapter.add.button"
            >
              <Plus className="w-4 h-4" />
              <span className="ml-1">Add</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chapters list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-12" data-ocid="syllabus.chapters.empty">
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-primary/60" />
          </div>
          <p className="font-semibold text-foreground text-sm">
            No chapters yet
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Add a chapter above to start tracking
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Pending ({pending.length})
              </p>
              <div className="space-y-2">
                {pending.map((chapter, i) => (
                  <ChapterRow
                    key={String(chapter.id)}
                    chapter={chapter}
                    index={i}
                    toggling={togglingId === chapter.id}
                    onToggle={() => handleToggleStatus(chapter)}
                    onDelete={() => setConfirmDelete(chapter)}
                  />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Completed ({completed.length})
              </p>
              <div className="space-y-2">
                {completed.map((chapter, i) => (
                  <ChapterRow
                    key={String(chapter.id)}
                    chapter={chapter}
                    index={i}
                    toggling={togglingId === chapter.id}
                    onToggle={() => handleToggleStatus(chapter)}
                    onDelete={() => setConfirmDelete(chapter)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm delete dialog */}
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

function ChapterRow({
  chapter,
  index,
  toggling,
  onToggle,
  onDelete,
}: {
  chapter: Chapter;
  index: number;
  toggling: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isPending = chapter.status === "pending";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border group transition-all duration-200 ${
          isPending ? "border-border bg-card" : "border-primary/20 bg-primary/5"
        }`}
        data-ocid={`syllabus.chapter.row.${index + 1}`}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={toggling}
          aria-label={isPending ? "Mark as completed" : "Mark as pending"}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            isPending
              ? "border-muted-foreground/40 hover:border-primary"
              : "border-primary bg-primary"
          }`}
          data-ocid={`syllabus.chapter.toggle.${index + 1}`}
        >
          {!isPending && <Check className="w-3.5 h-3.5 text-white" />}
        </button>
        <p
          className={`flex-1 text-sm font-medium min-w-0 truncate ${
            isPending ? "text-foreground" : "text-muted-foreground line-through"
          }`}
        >
          {chapter.name}
        </p>
        <Badge
          variant="secondary"
          className={`text-[10px] h-5 px-1.5 font-semibold shrink-0 ${
            isPending
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          {isPending ? "Pending" : "Done"}
        </Badge>
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          data-ocid={`syllabus.chapter.delete.${index + 1}`}
          aria-label="Delete chapter"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SyllabusTrackerPage({
  onBack,
}: { onBack: () => void }) {
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
      {/* Page header with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent/40 transition-colors"
          data-ocid="syllabus.page.back.button"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">
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
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
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
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
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
