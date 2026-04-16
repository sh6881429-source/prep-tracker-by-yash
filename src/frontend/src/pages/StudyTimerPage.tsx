import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  Pause,
  Pencil,
  Play,
  Square,
  Timer,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import type { AppBackend, StudySession } from "../types/appTypes";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatSessionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime12(ms: bigint): string {
  const d = new Date(Number(ms));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"];

// ─── Circular Ring SVG ───────────────────────────────────────────────────────

const RING_SIZE = 240;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_SECONDS = 3600;

function CircularRing({
  elapsed,
  isRunning,
}: {
  elapsed: number;
  isRunning: boolean;
}) {
  const progress = Math.min(elapsed / MAX_SECONDS, 1);
  const offset = CIRCUMFERENCE * (1 - progress);
  const center = RING_SIZE / 2;
  const gradId = "ringGradient";
  const filterGlowId = "ringGlow";

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      className="-rotate-90"
      role="img"
      aria-label="Study timer progress ring"
    >
      <title>Study timer progress ring</title>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.48 0.22 264)" />
          <stop offset="100%" stopColor="oklch(0.68 0.18 195)" />
        </linearGradient>
        <filter id={filterGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isRunning ? "5" : "0"} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="oklch(0.85 0.03 264)"
        strokeWidth={STROKE}
        opacity={0.35}
      />
      {/* Progress arc with glow */}
      {elapsed > 0 && (
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          filter={isRunning ? `url(#${filterGlowId})` : undefined}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      )}
      {/* Second glow layer for extra depth when running */}
      {isRunning && elapsed > 0 && (
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke="oklch(0.68 0.18 195 / 0.3)"
          strokeWidth={STROKE + 8}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      )}
    </svg>
  );
}

// ─── Weekly Bar Chart ─────────────────────────────────────────────────────────

function WeeklyChart({
  sessions,
  weekDates,
}: {
  sessions: StudySession[];
  weekDates: string[];
}) {
  const todayStr = getTodayStr();
  const totals = weekDates.map((date) =>
    sessions
      .filter((s) => s.date === date)
      .reduce((acc, s) => acc + Number(s.durationSeconds), 0),
  );
  const maxVal = Math.max(...totals, 1);

  return (
    <div
      className="flex items-end justify-between gap-1.5 h-24"
      aria-label="Weekly study chart"
    >
      {weekDates.map((date, i) => {
        const height = Math.max((totals[i] / maxVal) * 100, 4);
        const isToday = date === todayStr;
        return (
          <div
            key={date}
            className="flex-1 flex flex-col items-center gap-1.5"
            aria-label={`${DAY_LABELS[i]}: ${formatDuration(totals[i])}`}
          >
            <div
              className="w-full flex flex-col justify-end"
              style={{ height: 80 }}
            >
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.06,
                  ease: "easeOut",
                }}
                style={{
                  height: `${height}%`,
                  originY: 1,
                  transformOrigin: "bottom",
                }}
                className={`w-full rounded-t-md ${isToday ? "" : "opacity-70"}`}
              >
                {isToday ? (
                  <div
                    className="w-full h-full rounded-t-md"
                    style={{
                      background:
                        "linear-gradient(180deg, oklch(0.68 0.18 195) 0%, oklch(0.48 0.22 264) 100%)",
                      boxShadow: "0 0 10px oklch(0.68 0.18 195 / 0.5)",
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-t-md"
                    style={{
                      background: "oklch(0.48 0.22 264 / 0.7)",
                    }}
                  />
                )}
              </motion.div>
            </div>
            <span
              className={`text-[10px] font-bold ${
                isToday ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {DAY_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Session Row ─────────────────────────────────────────────────────────────

function SessionRow({
  session,
  index,
  onDelete,
}: {
  session: StudySession;
  index: number;
  onDelete: (id: bigint) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, delay: index * 0.045 }}
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border/60 mb-2 last:mb-0 cursor-default"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.04) 0%, oklch(0.68 0.18 195 / 0.03) 100%)",
        boxShadow: "0 2px 8px oklch(0.18 0.08 264 / 0.06)",
      }}
      data-ocid={`study.session.item.${index + 1}`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.15) 0%, oklch(0.68 0.18 195 / 0.12) 100%)",
        }}
      >
        <BookOpen className="w-4 h-4 text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {session.subject}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatSessionDate(session.date)} &middot;{" "}
          {formatTime12(session.startTime)} – {formatTime12(session.endTime)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.12) 0%, oklch(0.68 0.18 195 / 0.1) 100%)",
            color: "oklch(0.48 0.22 264)",
          }}
        >
          {formatDuration(Number(session.durationSeconds))}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Delete session"
              data-ocid={`study.session.delete_button.${index + 1}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="study.delete.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{session.subject}&quot; (
                {formatDuration(Number(session.durationSeconds))}). This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="study.delete.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="study.delete.confirm_button"
                onClick={() => onDelete(session.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
  gradientFrom,
  gradientTo,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delay: number;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-2xl p-4 flex items-center gap-3 border border-border/50"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        boxShadow: "0 4px 16px oklch(0.18 0.08 264 / 0.08)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "oklch(1 0 0 / 0.15)" }}
      >
        <Icon className="w-5 h-5" style={{ color: "oklch(1 0 0 / 0.9)" }} />
      </div>
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "oklch(1 0 0 / 0.65)" }}
        >
          {label}
        </p>
        <p
          className="text-xl font-bold leading-tight"
          style={{ color: "oklch(1 0 0)" }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TimerState = "idle" | "running" | "paused";

export default function StudyTimerPage() {
  const { session } = useAppAuth();
  const phone = session?.role === "user" ? session.phone : "";
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as AppBackend | null;

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [subject, setSubject] = useState("");
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(0);

  // Sessions data
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!phone || !actor) return;
    try {
      const data = await actor.getStudySessions(phone);
      setSessions(
        [...data].sort((a, b) => Number(b.startTime) - Number(a.startTime)),
      );
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [phone, actor]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTick = (startAt: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const deltaSeconds = Math.floor((Date.now() - startAt) / 1000);
      setElapsed(accumulatedRef.current + deltaSeconds);
    }, 250);
  };

  const handleStart = () => {
    const now = Date.now();
    sessionStartRef.current = now;
    startedAtRef.current = now;
    accumulatedRef.current = 0;
    setElapsed(0);
    setTimerState("running");
    setIsEditingSubject(false);
    startTick(now);
  };

  const handlePause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    accumulatedRef.current += Math.floor(
      (Date.now() - startedAtRef.current) / 1000,
    );
    setTimerState("paused");
  };

  const handleResume = () => {
    const now = Date.now();
    startedAtRef.current = now;
    setTimerState("running");
    startTick(now);
  };

  const handleStop = async () => {
    if (!actor) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finalSeconds =
      timerState === "running"
        ? accumulatedRef.current +
          Math.floor((Date.now() - startedAtRef.current) / 1000)
        : accumulatedRef.current;

    const endTime = Date.now();
    const startTime = sessionStartRef.current;
    const subjectLabel = subject.trim() || "Study Session";
    const dateStr = getTodayStr();
    const minutes = Math.round(finalSeconds / 60);

    // Reset immediately
    setTimerState("idle");
    setElapsed(0);
    accumulatedRef.current = 0;

    if (finalSeconds < 10) {
      toast.error("Session too short to save (minimum 10 seconds).");
      return;
    }

    setIsSaving(true);
    try {
      await actor.saveStudySession(
        phone,
        subjectLabel,
        BigInt(finalSeconds),
        dateStr,
        BigInt(startTime),
        BigInt(endTime),
      );
      toast.success(
        `Session saved! ${
          minutes > 0
            ? `${minutes} minute${minutes === 1 ? "" : "s"}`
            : "<1 minute"
        } logged.`,
      );
      setSubject("");
      await loadSessions();
    } catch (err) {
      console.error("Failed to save session:", err);
      toast.error("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteStudySession(phone, id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session deleted.");
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session.");
    }
  };

  const todayStr = getTodayStr();
  const weekDates = getWeekDates();
  const isRunning = timerState === "running";

  const todaySeconds = sessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + Number(s.durationSeconds), 0);

  const weekSeconds = sessions
    .filter((s) => weekDates.includes(s.date))
    .reduce((acc, s) => acc + Number(s.durationSeconds), 0);

  return (
    <div className="space-y-4 pb-4" data-ocid="study.page">
      {/* ── Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Clock}
          label="Today"
          value={isLoading ? "—" : formatDuration(todaySeconds)}
          delay={0}
          gradientFrom="oklch(0.48 0.22 264)"
          gradientTo="oklch(0.38 0.2 264)"
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={isLoading ? "—" : formatDuration(weekSeconds)}
          delay={0.07}
          gradientFrom="oklch(0.55 0.19 220)"
          gradientTo="oklch(0.68 0.18 195)"
        />
      </div>

      {/* ── Timer Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
      >
        <div
          className="rounded-2xl border border-border/50 overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.18 0.08 264) 0%, oklch(0.22 0.07 264) 60%, oklch(0.25 0.06 264) 100%)",
            boxShadow: isRunning
              ? "0 8px 32px oklch(0.68 0.18 195 / 0.25), 0 0 0 1px oklch(0.68 0.18 195 / 0.2)"
              : "0 4px 20px oklch(0.18 0.08 264 / 0.2)",
            transition: "box-shadow 0.6s ease",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(1 0 0 / 0.08)" }}
              >
                <Timer
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.68 0.18 195)" }}
                />
              </div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "oklch(1 0 0 / 0.5)" }}
              >
                Study Timer
              </span>
            </div>
            {isRunning && (
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
                className="flex items-center gap-1.5"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "oklch(0.68 0.18 195)" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "oklch(0.68 0.18 195)" }}
                >
                  Live
                </span>
              </motion.div>
            )}
          </div>

          {/* Ring + Time */}
          <div className="flex flex-col items-center px-5 pb-2">
            <motion.div
              animate={isRunning ? { scale: [1, 1.01, 1] } : { scale: 1 }}
              transition={
                isRunning
                  ? {
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2.5,
                      ease: "easeInOut",
                    }
                  : {}
              }
              className="relative w-[240px] h-[240px] flex items-center justify-center"
              style={
                isRunning
                  ? {
                      filter:
                        "drop-shadow(0 0 20px oklch(0.68 0.18 195 / 0.35))",
                    }
                  : {}
              }
            >
              <CircularRing elapsed={elapsed} isRunning={isRunning} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      color: "oklch(1 0 0)",
                      textShadow: isRunning
                        ? "0 0 20px oklch(0.68 0.18 195 / 0.6)"
                        : "none",
                      transition: "text-shadow 0.6s ease",
                    }}
                    data-ocid="study.timer.display"
                  >
                    {formatTimer(elapsed)}
                  </p>
                  <p
                    className="text-xs font-semibold mt-1"
                    style={{
                      color:
                        timerState === "running"
                          ? "oklch(0.68 0.18 195)"
                          : timerState === "paused"
                            ? "oklch(0.75 0.15 60)"
                            : "oklch(1 0 0 / 0.4)",
                    }}
                  >
                    {timerState === "idle" && "Ready to study"}
                    {timerState === "running" && "Studying..."}
                    {timerState === "paused" && "Paused"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Subject input */}
            <div className="w-full max-w-xs mb-4 relative">
              {isEditingSubject || timerState === "idle" ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="What are you studying?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onBlur={() => setIsEditingSubject(false)}
                    disabled={timerState !== "idle"}
                    maxLength={80}
                    aria-label="Study subject"
                    data-ocid="study.subject.input"
                    ref={(el) => {
                      if (el && isEditingSubject) el.focus();
                    }}
                    className="w-full text-center text-sm font-semibold rounded-xl px-4 py-2.5 outline-none pr-9"
                    style={{
                      background: "oklch(1 0 0 / 0.08)",
                      border: "1px solid oklch(1 0 0 / 0.15)",
                      color: "oklch(1 0 0)",
                    }}
                  />
                  <Pencil
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: "oklch(1 0 0 / 0.3)" }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    (timerState as string) === "idle" &&
                    setIsEditingSubject(true)
                  }
                  className="w-full text-center text-sm font-semibold rounded-xl px-4 py-2.5 flex items-center justify-center gap-2"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    color: subject
                      ? "oklch(1 0 0 / 0.9)"
                      : "oklch(1 0 0 / 0.35)",
                    cursor:
                      (timerState as string) === "idle" ? "text" : "default",
                  }}
                >
                  {subject || "What are you studying?"}
                  {(timerState as string) === "idle" && (
                    <Pencil
                      className="w-3 h-3 shrink-0"
                      style={{ color: "oklch(1 0 0 / 0.3)" }}
                    />
                  )}
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="w-full max-w-xs mb-5">
              <AnimatePresence mode="wait">
                {timerState === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.button
                      type="button"
                      onClick={handleStart}
                      disabled={isSaving}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      data-ocid="study.start.button"
                      className="w-full h-13 flex items-center justify-center gap-2.5 rounded-2xl text-base font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.68 0.18 195) 100%)",
                        color: "oklch(1 0 0)",
                        boxShadow:
                          "0 4px 20px oklch(0.68 0.18 195 / 0.4), 0 2px 6px oklch(0.48 0.22 264 / 0.3)",
                        height: "52px",
                      }}
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Start Session
                    </motion.button>
                  </motion.div>
                )}

                {timerState === "running" && (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      type="button"
                      onClick={handlePause}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      data-ocid="study.pause.button"
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold"
                      style={{
                        background: "oklch(1 0 0 / 0.12)",
                        border: "1px solid oklch(1 0 0 / 0.2)",
                        color: "oklch(1 0 0)",
                        height: "48px",
                      }}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleStop}
                      disabled={isSaving}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      data-ocid="study.stop.button"
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.5 0.22 20) 0%, oklch(0.58 0.24 27) 100%)",
                        color: "oklch(1 0 0)",
                        boxShadow: "0 3px 12px oklch(0.55 0.22 27 / 0.35)",
                        height: "48px",
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop
                    </motion.button>
                  </motion.div>
                )}

                {timerState === "paused" && (
                  <motion.div
                    key="paused"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      type="button"
                      onClick={handleResume}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      data-ocid="study.resume.button"
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.68 0.18 195) 100%)",
                        color: "oklch(1 0 0)",
                        boxShadow: "0 3px 14px oklch(0.68 0.18 195 / 0.35)",
                        height: "48px",
                      }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Resume
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleStop}
                      disabled={isSaving}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      data-ocid="study.stop.button"
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.5 0.22 20) 0%, oklch(0.58 0.24 27) 100%)",
                        color: "oklch(1 0 0)",
                        boxShadow: "0 3px 12px oklch(0.55 0.22 27 / 0.35)",
                        height: "48px",
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop & Save
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSaving && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4 }}
                className="text-xs font-semibold mb-3"
                style={{ color: "oklch(0.68 0.18 195)" }}
                data-ocid="study.save.loading_state"
              >
                Saving session...
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Weekly Chart Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="rounded-2xl border border-border/50 overflow-hidden"
        style={{
          background: "oklch(1 0 0)",
          boxShadow: "0 2px 12px oklch(0.18 0.08 264 / 0.06)",
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.12) 0%, oklch(0.68 0.18 195 / 0.1) 100%)",
              }}
            >
              <TrendingUp className="w-3.5 h-3.5 text-secondary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Weekly Overview
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <WeeklyChart sessions={sessions} weekDates={weekDates} />
          )}
        </div>
      </motion.div>

      {/* ── Session History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="rounded-2xl border border-border/50 overflow-hidden"
        style={{
          background: "oklch(1 0 0)",
          boxShadow: "0 2px 12px oklch(0.18 0.08 264 / 0.06)",
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.12) 0%, oklch(0.68 0.18 195 / 0.1) 100%)",
              }}
            >
              <BookOpen className="w-3.5 h-3.5 text-secondary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Session History
            </span>
            {sessions.length > 0 && (
              <span
                className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.48 0.22 264 / 0.1)",
                  color: "oklch(0.48 0.22 264)",
                }}
              >
                {sessions.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2" data-ocid="study.sessions.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-[68px] w-full rounded-xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div
              className="py-10 text-center"
              data-ocid="study.sessions.empty_state"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.1) 0%, oklch(0.68 0.18 195 / 0.08) 100%)",
                }}
              >
                <Timer
                  className="w-7 h-7"
                  style={{ color: "oklch(0.48 0.22 264 / 0.5)" }}
                />
              </div>
              <p className="text-sm font-bold text-foreground">
                No sessions yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start your first study session above!
              </p>
            </div>
          ) : (
            <div data-ocid="study.sessions.list">
              <AnimatePresence initial={false}>
                {sessions.map((s, i) => (
                  <SessionRow
                    key={s.id.toString()}
                    session={s}
                    index={i}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
