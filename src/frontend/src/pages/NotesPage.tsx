import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  Edit2,
  Eye,
  FileText,
  Pin,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import type { AppBackend, Note, Pdf, Subject } from "../types/appTypes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Color Config ─────────────────────────────────────────────────────────────

const COLOR_TAGS = [
  { key: "none", label: "None", dot: "", border: "border-l-border", bg: "" },
  {
    key: "red",
    label: "Red",
    dot: "bg-red-500",
    border: "border-l-red-500",
    bg: "bg-red-500/8",
  },
  {
    key: "yellow",
    label: "Yellow",
    dot: "bg-yellow-500",
    border: "border-l-yellow-500",
    bg: "bg-yellow-500/8",
  },
  {
    key: "green",
    label: "Green",
    dot: "bg-green-500",
    border: "border-l-green-500",
    bg: "bg-green-500/8",
  },
  {
    key: "blue",
    label: "Blue",
    dot: "bg-blue-500",
    border: "border-l-blue-500",
    bg: "bg-blue-500/8",
  },
  {
    key: "purple",
    label: "Purple",
    dot: "bg-purple-500",
    border: "border-l-purple-500",
    bg: "bg-purple-500/8",
  },
] as const;

type ColorKey = (typeof COLOR_TAGS)[number]["key"];

const NOTE_FILTERS = [
  { key: "all", label: "All" },
  { key: "pinned", label: "📌 Pinned" },
  { key: "red", label: "Red", dot: "bg-red-500" },
  { key: "yellow", label: "Yellow", dot: "bg-yellow-500" },
  { key: "green", label: "Green", dot: "bg-green-500" },
  { key: "blue", label: "Blue", dot: "bg-blue-500" },
  { key: "purple", label: "Purple", dot: "bg-purple-500" },
] as const;

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
            data-ocid="notes.confirm.cancel"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            data-ocid="notes.confirm.delete"
          >
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Color Dot Picker ─────────────────────────────────────────────────────────
function ColorDotPicker({
  value,
  onChange,
}: { value: ColorKey; onChange: (k: ColorKey) => void }) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      data-ocid="notes.form.color"
    >
      {COLOR_TAGS.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          aria-label={c.label}
          data-ocid={`notes.form.color.${c.key}`}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-150
            ${value === c.key ? "border-primary scale-110 shadow-md" : "border-border hover:border-muted-foreground/50"}
            ${c.key === "none" ? "bg-muted" : ""}`}
          title={c.label}
        >
          {c.dot ? (
            <span className={`w-4 h-4 rounded-full ${c.dot}`} />
          ) : (
            <X className="w-3 h-3 text-muted-foreground" />
          )}
          {value === c.key && (
            <motion.div
              layoutId="color-ring"
              className="absolute inset-0 rounded-full border-2 border-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Note Form ────────────────────────────────────────────────────────────────
function NoteForm({
  note,
  subjects,
  onSave,
  onCancel,
  saving,
}: {
  note: Note | null;
  subjects: Subject[];
  onSave: (data: {
    subject: string;
    title: string;
    content: string;
    colorTag: string;
    isPinned: boolean;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [subject, setSubject] = useState(note?.subject ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [colorTag, setColorTag] = useState<ColorKey>(
    (note?.colorTag as ColorKey) ?? "none",
  );
  const [isPinned, setIsPinned] = useState(note?.isPinned ?? false);
  const [customSubject, setCustomSubject] = useState("");

  const finalSubject = subject === "__custom__" ? customSubject : subject;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
      data-ocid="notes.form.panel"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent/20 transition-colors"
          data-ocid="notes.form.back"
          aria-label="Cancel"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">
            {note ? "Edit Note" : "New Note"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Fill in the details below
          </p>
        </div>
        {/* Pin quick toggle */}
        <button
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          className={`ml-auto w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200
            ${isPinned ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
          data-ocid="notes.form.pin"
          aria-label={isPinned ? "Unpin note" : "Pin note"}
          title={isPinned ? "Pinned" : "Pin this note"}
        >
          <Pin className={`w-4 h-4 ${isPinned ? "fill-primary" : ""}`} />
        </button>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
        style={{
          borderLeft:
            colorTag !== "none"
              ? `4px solid var(--color-border-${colorTag}, oklch(var(--primary)))`
              : undefined,
        }}
      >
        {/* Navy Quill toolbar theme handled via CSS */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Title
            </Label>
            <Input
              placeholder="Note title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm font-medium"
              data-ocid="notes.form.title"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Subject <span className="text-destructive">*</span>
            </Label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
              data-ocid="notes.form.subject"
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={String(s.id)} value={s.name}>
                  {s.name}
                </option>
              ))}
              <option value="__custom__">+ Add new subject…</option>
            </select>
            {subject === "__custom__" && (
              <Input
                placeholder="Enter subject name…"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="h-10 text-sm mt-1.5"
                data-ocid="notes.form.custom_subject"
              />
            )}
          </div>

          {/* Content — Quill with navy toolbar */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Content
            </Label>
            <div
              className="rounded-xl border border-input overflow-hidden notes-editor-premium"
              data-ocid="notes.form.content"
            >
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={QUILL_MODULES}
                placeholder="Write your note here…"
              />
            </div>
          </div>

          {/* Color tag */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Color Tag
            </Label>
            <ColorDotPicker value={colorTag} onChange={setColorTag} />
          </div>

          {/* Pin info row */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
            <Pin
              className={`w-3.5 h-3.5 flex-shrink-0 ${isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`}
            />
            <span className="text-xs text-muted-foreground flex-1">
              {isPinned ? (
                <span className="text-primary font-medium">
                  Note is pinned — will appear at the top
                </span>
              ) : (
                "Click the pin icon above to pin this note"
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl"
          data-ocid="notes.form.cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({
              subject: finalSubject,
              title,
              content,
              colorTag,
              isPinned,
            })
          }
          disabled={saving || !title.trim() || !finalSubject.trim()}
          className="flex-1 h-11 rounded-xl font-semibold gradient-hero text-white border-0"
          data-ocid="notes.form.save"
        >
          {saving ? "Saving…" : note ? "Save Changes" : "Create Note"}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({
  note,
  index,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  index: number;
  onEdit: (n: Note) => void;
  onDelete: (n: Note) => void;
  onTogglePin: (n: Note) => void;
}) {
  const colorCfg =
    COLOR_TAGS.find((c) => c.key === note.colorTag) ?? COLOR_TAGS[0];
  const excerpt = stripHtml(note.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="group"
      data-ocid={`notes.card.${index + 1}`}
    >
      <div
        className={`relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:border-primary/20 border-l-4 ${colorCfg.border}`}
      >
        {/* Color tint overlay */}
        {colorCfg.bg && (
          <div
            className={`absolute inset-0 ${colorCfg.bg} pointer-events-none`}
          />
        )}

        {/* Pin badge */}
        {note.isPinned && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center z-10">
            <Pin className="w-3 h-3 text-primary fill-primary" />
          </div>
        )}

        <div className="relative p-4">
          {/* Title row */}
          <div className="pr-8 mb-1.5">
            <p className="text-sm font-bold text-foreground line-clamp-1">
              {note.title}
            </p>
          </div>

          {/* Subject badge */}
          <div className="mb-2">
            <Badge
              variant="secondary"
              className="text-[10px] h-4.5 px-1.5 font-medium"
            >
              {note.subject}
            </Badge>
          </div>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-3 break-words mb-2.5">
              {excerpt.slice(0, 150)}
              {excerpt.length > 150 ? "…" : ""}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">
              {formatDate(note.createdAt)}
            </span>

            {/* Action buttons — always visible on mobile, hover on desktop */}
            <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note);
                }}
                className={`p-1.5 rounded-lg transition-colors ${note.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                aria-label={note.isPinned ? "Unpin" : "Pin"}
                data-ocid={`notes.pin.${index + 1}`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${note.isPinned ? "fill-primary" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Edit note"
                data-ocid={`notes.edit.${index + 1}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete note"
                data-ocid={`notes.delete.${index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────
function NotesTab({
  phone,
  actor,
  subjects,
}: { phone: string; actor: AppBackend; subjects: Subject[] }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editNote, setEditNote] = useState<Note | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const data = await actor.getNotes(phone);
      setNotes(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [phone, actor]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filtered = notes
    .filter((n) => {
      if (filter === "all") return true;
      if (filter === "pinned") return n.isPinned;
      return n.colorTag === filter;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return Number(b.createdAt - a.createdAt);
    });

  async function handleSave(data: {
    subject: string;
    title: string;
    content: string;
    colorTag: string;
    isPinned: boolean;
  }) {
    setSaving(true);
    try {
      if (editNote === "new") {
        await actor.addNote(
          phone,
          data.subject,
          data.title,
          data.content,
          data.colorTag,
          data.isPinned,
        );
      } else if (editNote) {
        await actor.updateNote(
          phone,
          editNote.id,
          data.subject,
          data.title,
          data.content,
          data.colorTag,
          data.isPinned,
        );
      }
      await loadNotes();
      setEditNote(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(note: Note) {
    await actor.deleteNote(phone, note.id);
    await loadNotes();
    setConfirmDelete(null);
  }

  async function handleTogglePin(note: Note) {
    await actor.toggleNotePin(phone, note.id);
    await loadNotes();
  }

  if (editNote !== null) {
    return (
      <NoteForm
        note={editNote === "new" ? null : editNote}
        subjects={subjects}
        onSave={handleSave}
        onCancel={() => setEditNote(null)}
        saving={saving}
      />
    );
  }

  return (
    <div className="space-y-4" data-ocid="notes.list.panel">
      {/* Add button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => setEditNote("new")}
          className="w-full h-11 text-sm rounded-xl font-semibold gradient-hero text-white border-0 gap-2"
          data-ocid="notes.add.button"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </motion.div>

      {/* Filter bar */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        data-ocid="notes.filter.bar"
      >
        {NOTE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150
              ${
                filter === f.key
                  ? "bg-secondary text-white border-secondary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-secondary/40 hover:text-foreground"
              }`}
            data-ocid={`notes.filter.${f.key}`}
          >
            {"dot" in f && f.dot && (
              <span className={`w-2 h-2 rounded-full ${f.dot} flex-shrink-0`} />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-14"
          data-ocid="notes.list.empty"
        >
          <div className="w-16 h-16 rounded-2xl gradient-card border border-border flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-secondary" />
          </div>
          <p className="font-bold text-foreground">No notes found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {filter === "all"
              ? 'Tap "New Note" to get started'
              : "Try a different filter"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              index={i}
              onEdit={setEditNote}
              onDelete={setConfirmDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            message={`Delete note "${confirmDelete.title}"? This cannot be undone.`}
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PDF Action Dialog ────────────────────────────────────────────────────────
function PdfActionDialog({
  pdf,
  onView,
  onDownload,
  onClose,
}: {
  pdf: Pdf;
  onView: () => void;
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">
                {pdf.filename}
              </p>
              <p className="text-xs text-muted-foreground">{pdf.subject}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          What would you like to do with this PDF?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl gap-2"
            onClick={onView}
            data-ocid="pdf.action.view"
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl gap-2 gradient-hero text-white border-0"
            onClick={onDownload}
            data-ocid="pdf.action.download"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function PdfViewerModal({
  url,
  filename,
  onClose,
}: { url: string; filename: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent/20 transition-colors"
          aria-label="Close viewer"
          data-ocid="pdf.viewer.close"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-3.5 h-3.5 text-red-500" />
        </div>
        <p className="text-sm font-semibold text-foreground truncate min-w-0">
          {filename}
        </p>
      </div>
      <iframe
        src={url}
        title={filename}
        className="flex-1 w-full border-0"
        data-ocid="pdf.viewer.frame"
      />
    </div>
  );
}

// ─── PDFs Tab ─────────────────────────────────────────────────────────────────
function PdfsTab({
  phone,
  actor,
  subjects,
}: { phone: string; actor: AppBackend; subjects: Subject[] }) {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Pdf | null>(null);
  const [actionPdf, setActionPdf] = useState<Pdf | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerFilename, setViewerFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const loadPdfs = useCallback(async () => {
    try {
      const data = await actor.getPdfs(phone);
      setPdfs([...data].sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [phone, actor]);

  useEffect(() => {
    loadPdfs();
  }, [loadPdfs]);
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const finalSubject =
    selectedSubject === "__custom__" ? customSubject : selectedSubject;
  const canUpload = !uploading && !!file && !!finalSubject.trim();

  async function handleUpload() {
    if (!file || !finalSubject.trim()) return;
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await actor.uploadPdf(
        phone,
        finalSubject,
        file.name,
        bytes,
        file.type || "application/pdf",
      );
      setFile(null);
      setSelectedSubject("");
      setCustomSubject("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadPdfs();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(pdf: Pdf) {
    await actor.deletePdf(phone, pdf.id);
    await loadPdfs();
    setConfirmDelete(null);
  }

  async function openPdfBlob(pdf: Pdf, mode: "view" | "download") {
    setActionPdf(null);
    try {
      const bytes = await actor.getPdfFile(pdf.id);
      if (!bytes || bytes.length === 0) return;
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: pdf.contentType || "application/pdf",
      });
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      if (mode === "view") {
        setViewerFilename(pdf.filename);
        setViewerUrl(url);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = pdf.filename;
        a.click();
      }
    } catch {
      /* silent */
    }
  }

  return (
    <div className="space-y-4" data-ocid="pdfs.panel">
      {/* Upload form */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold text-foreground">Upload PDF</p>
          </div>

          <div className="space-y-3 pb-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Subject <span className="text-destructive">*</span>
              </Label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                data-ocid="pdfs.upload.subject"
              >
                <option value="">Select subject…</option>
                {subjects.map((s) => (
                  <option key={String(s.id)} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="__custom__">+ Add new subject…</option>
              </select>
              {selectedSubject === "__custom__" && (
                <Input
                  placeholder="Enter subject name…"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="h-10 text-sm mt-1.5"
                  data-ocid="pdfs.upload.custom_subject"
                />
              )}
            </div>

            {/* Drop zone */}
            <button
              type="button"
              className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200
                ${file ? "border-secondary/40 bg-secondary/5" : "border-border hover:border-secondary/40 hover:bg-secondary/5"}`}
              onClick={() => fileInputRef.current?.click()}
              data-ocid="pdfs.upload.dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                data-ocid="pdfs.upload.input"
              />
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${file ? "bg-secondary/15" : "bg-muted"}`}
                >
                  <FileText
                    className={`w-5 h-5 ${file ? "text-secondary" : "text-muted-foreground"}`}
                  />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-secondary truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tap to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Tap to select PDF
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      PDF files only
                    </p>
                  </div>
                )}
              </div>
            </button>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleUpload}
                disabled={!canUpload}
                className="w-full h-11 rounded-xl text-sm font-semibold gradient-hero text-white border-0"
                data-ocid="pdfs.upload.button"
              >
                {uploading ? "Uploading…" : "Upload PDF"}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* PDF list */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : pdfs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
          data-ocid="pdfs.list.empty"
        >
          <div className="w-16 h-16 rounded-2xl gradient-card border border-border flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-secondary" />
          </div>
          <p className="font-bold text-foreground">No PDFs uploaded</p>
          <p className="text-muted-foreground text-sm mt-1">
            Upload a PDF using the form above
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {pdfs.map((pdf, i) => (
            <motion.div
              key={pdf.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 2, transition: { duration: 0.15 } }}
            >
              <div
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:bg-accent/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 group"
                data-ocid={`pdfs.card.${i + 1}`}
              >
                {/* PDF icon */}
                <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {pdf.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 font-medium"
                    >
                      {pdf.subject}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(pdf.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openPdfBlob(pdf, "view")}
                    className="p-2 rounded-xl text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                    aria-label="View PDF"
                    data-ocid={`pdfs.view.${i + 1}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openPdfBlob(pdf, "download")}
                    className="p-2 rounded-xl text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                    aria-label="Download PDF"
                    data-ocid={`pdfs.download.${i + 1}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(pdf)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete PDF"
                    data-ocid={`pdfs.delete.${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AnimatePresence>
        {actionPdf && (
          <PdfActionDialog
            pdf={actionPdf}
            onView={() => openPdfBlob(actionPdf, "view")}
            onDownload={() => openPdfBlob(actionPdf, "download")}
            onClose={() => setActionPdf(null)}
          />
        )}
        {confirmDelete && (
          <ConfirmDialog
            message={`Delete "${confirmDelete.filename}"? This cannot be undone.`}
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Full-screen PDF viewer */}
      {viewerUrl && (
        <PdfViewerModal
          url={viewerUrl}
          filename={viewerFilename}
          onClose={() => {
            setViewerUrl(null);
            setViewerFilename("");
          }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotesPage({ onBack }: { onBack: () => void }) {
  const { session } = useAppAuth();
  const phone = session?.role === "user" ? session.phone : "";
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as AppBackend | null;
  const [activeTab, setActiveTab] = useState<"notes" | "pdfs">("notes");
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const loadSubjects = useCallback(async () => {
    if (!actor || !phone) return;
    try {
      const data = await actor.getSubjects(phone);
      setSubjects(data);
    } catch {
      /* silent */
    }
  }, [actor, phone]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  if (!actor || !phone) {
    return (
      <div className="py-12 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-secondary border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="notes.page">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          whileTap={{ scale: 0.93 }}
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent/20 transition-colors"
          data-ocid="notes.page.back"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-foreground">Notes & PDFs</h2>
          <p className="text-xs text-muted-foreground">Your study materials</p>
        </div>
        {/* Tab pills in header area */}
        <div className="flex rounded-xl bg-muted p-0.5 gap-0.5 flex-shrink-0">
          {(["notes", "pdfs"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 capitalize
                ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              data-ocid={`notes.tab.${tab}`}
            >
              {tab === "notes" ? "Notes" : "PDFs"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "notes" ? (
          <motion.div
            key="notes"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
          >
            <NotesTab phone={phone} actor={actor} subjects={subjects} />
          </motion.div>
        ) : (
          <motion.div
            key="pdfs"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <PdfsTab phone={phone} actor={actor} subjects={subjects} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
