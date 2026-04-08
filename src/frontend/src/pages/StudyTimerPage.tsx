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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  Pause,
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
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_SECONDS = 3600; // 60 min = full ring

function CircularRing({ elapsed }: { elapsed: number }) {
  const progress = Math.min(elapsed / MAX_SECONDS, 1);
  const offset = CIRCUMFERENCE * (1 - progress);
  const center = RING_SIZE / 2;

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      className="-rotate-90"
      role="img"
      aria-label="Study timer progress ring"
    >
      <title>Study timer progress ring</title>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="oklch(0.88 0.015 240)"
        strokeWidth={STROKE}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.55 0.22 264)" />
          <stop offset="100%" stopColor="oklch(0.62 0.16 195)" />
        </linearGradient>
      </defs>
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
      className="flex items-end justify-between gap-1 h-20"
      aria-label="Weekly study chart"
    >
      {weekDates.map((date, i) => {
        const height = Math.max((totals[i] / maxVal) * 100, 4);
        const isToday = date === todayStr;
        return (
          <div
            key={date}
            className="flex-1 flex flex-col items-center gap-1"
            aria-label={`${DAY_LABELS[i]}: ${formatDuration(totals[i])}`}
          >
            <div
              className="w-full flex flex-col justify-end"
              style={{ height: 72 }}
            >
              <motion.div
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                style={{ height: `${height}%` }}
                className={`w-full rounded-sm ${
                  isToday
                    ? "bg-gradient-to-t from-indigo-light to-accent"
                    : "bg-secondary"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-semibold ${
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
      data-ocid={`study.session.item.${index + 1}`}
    >
      <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
        <BookOpen className="w-4 h-4 text-primary" />
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
        <span className="text-xs font-bold text-accent">
          {formatDuration(Number(session.durationSeconds))}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label="Delete session"
              data-ocid={`study.session.delete_button.${index + 1}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type TimerState = "idle" | "running" | "paused";

export default function StudyTimerPage() {
  const { session } = useAppAuth();
  const phone = session?.role === "user" ? session.phone : "";
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as AppBackend | null;

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0); // seconds
  const [subject, setSubject] = useState("");
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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTick = (startAt: number) => {
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

    // Reset immediately for snappy UX
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

  // ── Computed stats
  const todayStr = getTodayStr();
  const weekDates = getWeekDates();

  const todaySeconds = sessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + Number(s.durationSeconds), 0);

  const weekSeconds = sessions
    .filter((s) => weekDates.includes(s.date))
    .reduce((acc, s) => acc + Number(s.durationSeconds), 0);

  return (
    <div className="space-y-5 pb-4" data-ocid="study.page">
      {/* ── Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="border border-border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today
              </p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {isLoading ? "—" : formatDuration(todaySeconds)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                This Week
              </p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {isLoading ? "—" : formatDuration(weekSeconds)}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        <Card className="border border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Overview
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-20 w-full rounded-lg" />
            ) : (
              <WeeklyChart sessions={sessions} weekDates={weekDates} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Timer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border border-border shadow-none">
          <CardContent className="p-5 flex flex-col items-center gap-5">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Study Timer
              </span>
            </div>

            {/* Ring + Time */}
            <div className="relative w-[240px] h-[240px] flex items-center justify-center">
              <CircularRing elapsed={elapsed} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p
                    className="font-mono text-3xl font-bold text-foreground tracking-tight"
                    data-ocid="study.timer.display"
                  >
                    {formatTimer(elapsed)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {timerState === "idle" && "Ready"}
                    {timerState === "running" && "Studying..."}
                    {timerState === "paused" && "Paused"}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject input */}
            <Input
              type="text"
              placeholder="What are you studying?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={timerState !== "idle"}
              maxLength={80}
              aria-label="Study subject"
              data-ocid="study.subject.input"
              className="text-center text-sm font-medium placeholder:text-muted-foreground/60 disabled:opacity-60"
            />

            {/* Controls */}
            <AnimatePresence mode="wait">
              {timerState === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <Button
                    onClick={handleStart}
                    disabled={isSaving}
                    data-ocid="study.start.button"
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                </motion.div>
              )}

              {timerState === "running" && (
                <motion.div
                  key="running"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex gap-3"
                >
                  <Button
                    onClick={handlePause}
                    variant="secondary"
                    data-ocid="study.pause.button"
                    className="flex-1 h-12 text-sm font-semibold rounded-xl"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    disabled={isSaving}
                    data-ocid="study.stop.button"
                    className="flex-1 h-12 text-sm font-semibold rounded-xl"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </motion.div>
              )}

              {timerState === "paused" && (
                <motion.div
                  key="paused"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex gap-3"
                >
                  <Button
                    onClick={handleResume}
                    data-ocid="study.resume.button"
                    className="flex-1 h-12 text-sm font-semibold rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    disabled={isSaving}
                    data-ocid="study.stop.button"
                    className="flex-1 h-12 text-sm font-semibold rounded-xl"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {isSaving && (
              <p
                className="text-xs text-muted-foreground animate-pulse"
                data-ocid="study.save.loading_state"
              >
                Saving session...
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Session History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        <Card className="border border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Session History
              </span>
            </div>

            {isLoading ? (
              <div
                className="space-y-3 mt-3"
                data-ocid="study.sessions.loading_state"
              >
                {SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div
                className="py-10 text-center"
                data-ocid="study.sessions.empty_state"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                  <Timer className="w-6 h-6 text-primary/50" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No sessions yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start your first session above!
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
