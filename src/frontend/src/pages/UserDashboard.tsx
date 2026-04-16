import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  FileText,
  Flame,
  MinusCircle,
  Phone,
  Timer,
  TrendingUp,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Layout, { USER_NAV_ITEMS } from "../components/Layout";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import {
  useGymAttendance,
  useGymStreak,
  useMarkGymAttendance,
} from "../hooks/useQueries";
import type {
  AppBackend,
  AttendanceStatus,
  GymRecord,
  StudySession,
} from "../types/appTypes";
import NotesPage from "./NotesPage";
import StudyTimerPage from "./StudyTimerPage";
import SyllabusTrackerPage from "./SyllabusTrackerPage";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatSelectedDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  home: { title: "Dashboard", subtitle: "Your daily overview" },
  study: { title: "Study Timer", subtitle: "Study sessions & topics" },
  syllabus: {
    title: "Syllabus Tracker",
    subtitle: "Subjects, chapters & progress",
  },
  notes: { title: "Notes / PDF", subtitle: "Your notes and documents" },
  gym: { title: "Gym Tracker", subtitle: "Track your gym attendance" },
  profile: { title: "Profile", subtitle: "Your account" },
};

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  className,
}: { value: number; className?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: "easeOut",
    });
    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [value, motionValue, rounded]);

  return <span className={className}>{display}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  gradient: string;
  delay: number;
  loading?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay,
  loading,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="cursor-default"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
        style={{ background: gradient }}
      >
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20"
          style={{ background: "white" }}
        />
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          {loading ? (
            <Skeleton className="h-7 w-16 bg-white/25 rounded-lg" />
          ) : (
            <p className="text-white text-xl font-bold font-display leading-tight">
              {value}
            </p>
          )}
          <p className="text-white/75 text-[11px] font-semibold leading-tight">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quick Access Card ────────────────────────────────────────────────────────

interface QuickCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  ocid: string;
  delay: number;
  onClick: () => void;
  accent: string;
  accentBg: string;
}

function QuickCard({
  icon: Icon,
  label,
  description,
  ocid,
  delay,
  onClick,
  accent,
  accentBg,
}: QuickCardProps) {
  return (
    <motion.button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="group text-left w-full"
    >
      <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <CardContent className="p-4 flex flex-col gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ background: accentBg }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.button>
  );
}

// ─── HomeTab ──────────────────────────────────────────────────────────────────

function HomeTab({
  name,
  todayStudyTime,
  pendingChaptersCount,
  gymStreak,
  gymStreakLoading,
  onTabChange,
}: {
  name: string;
  todayStudyTime: string;
  pendingChaptersCount: number;
  gymStreak: number;
  gymStreakLoading: boolean;
  onTabChange: (tab: string) => void;
}) {
  const statCards = [
    {
      icon: Clock,
      label: "Today's Study",
      value: todayStudyTime,
      gradient:
        "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.48 0.22 264) 100%)",
      loading: false,
    },
    {
      icon: BookMarked,
      label: "Pending Chapters",
      value: String(pendingChaptersCount),
      gradient:
        "linear-gradient(135deg, oklch(0.38 0.18 290) 0%, oklch(0.55 0.22 300) 100%)",
      loading: false,
    },
    {
      icon: Flame,
      label: "Gym Streak",
      value: gymStreakLoading ? "…" : `${gymStreak}d`,
      gradient:
        "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.68 0.18 195) 100%)",
      loading: gymStreakLoading,
    },
  ];

  const quickAccess = [
    {
      icon: Timer,
      label: "Study Timer",
      description: "Track your study sessions",
      ocid: "home.study_timer.button",
      accent: "oklch(0.48 0.22 264)",
      accentBg: "oklch(0.48 0.22 264 / 0.12)",
      action: () => onTabChange("study"),
    },
    {
      icon: BookMarked,
      label: "Syllabus",
      description: "Subjects & chapters",
      ocid: "home.syllabus.button",
      accent: "oklch(0.55 0.22 300)",
      accentBg: "oklch(0.55 0.22 300 / 0.12)",
      action: () => onTabChange("syllabus"),
    },
    {
      icon: FileText,
      label: "Notes / PDF",
      description: "Your notes & documents",
      ocid: "home.notes.button",
      accent: "oklch(0.6 0.2 30)",
      accentBg: "oklch(0.6 0.2 30 / 0.12)",
      action: () => onTabChange("notes"),
    },
    {
      icon: Dumbbell,
      label: "Gym Tracker",
      description: "Attendance & streaks",
      ocid: "home.gym_tracker.button",
      accent: "oklch(0.55 0.22 160)",
      accentBg: "oklch(0.55 0.22 160 / 0.12)",
      action: () => onTabChange("gym"),
    },
  ];

  return (
    <div className="space-y-6" data-ocid="user.home.panel">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-5 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.25 0.06 264) 50%, oklch(0.18 0.08 264) 100%)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, white, transparent)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/65 text-xs font-semibold uppercase tracking-widest">
                Welcome back
              </p>
              <h2 className="text-white text-2xl font-bold font-display mt-1">
                {name} <span className="text-yellow-300">✦</span>
              </h2>
              <p className="text-white/50 text-xs mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center"
            >
              <TrendingUp className="w-7 h-7 text-cyan-300" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3"
        >
          Today's Overview
        </motion.h3>
        <div className="grid grid-cols-3 gap-2.5" data-ocid="user.stats.panel">
          {statCards.map((card, i) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              gradient={card.gradient}
              delay={0.15 + i * 0.08}
              loading={card.loading}
            />
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3"
        >
          Quick Access
        </motion.h3>
        <div
          className="grid grid-cols-2 gap-3"
          data-ocid="user.quickaccess.panel"
        >
          {quickAccess.map((item, i) => (
            <QuickCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              description={item.description}
              ocid={item.ocid}
              delay={0.35 + i * 0.07}
              onClick={item.action}
              accent={item.accent}
              accentBg={item.accentBg}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AttendanceModal ──────────────────────────────────────────────────────────

function AttendanceModal({
  dateStr,
  existing,
  isMutating,
  onSave,
  onClose,
}: {
  dateStr: string;
  existing: GymRecord | undefined;
  isMutating: boolean;
  onSave: (date: string, status: AttendanceStatus, note: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<AttendanceStatus>(
    existing?.status ?? "present",
  );
  const [note, setNote] = useState(existing?.note ?? "");

  const handleSave = () => {
    onSave(dateStr, selected, selected === "present" ? note : "");
    onClose();
  };

  const optionConfig = [
    {
      status: "present" as AttendanceStatus,
      label: "Present",
      sublabel: "Gym session done ✓",
      icon: CheckCircle2,
      activeStyle: {
        background:
          "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.55 0.25 240) 100%)",
        borderColor: "oklch(0.48 0.22 264)",
      },
      idleClass: "border-border bg-background hover:bg-muted/50",
      iconColor: "oklch(0.48 0.22 264)",
    },
    {
      status: "absent" as AttendanceStatus,
      label: "Absent",
      sublabel: "Missed the gym today",
      icon: XCircle,
      activeStyle: {
        background:
          "linear-gradient(135deg, oklch(0.55 0.25 27) 0%, oklch(0.48 0.22 20) 100%)",
        borderColor: "oklch(0.55 0.25 27)",
      },
      idleClass: "border-border bg-background hover:bg-muted/50",
      iconColor: "oklch(0.55 0.25 27)",
    },
    {
      status: "rest" as AttendanceStatus,
      label: "Rest Day",
      sublabel: "Recovery — streak safe 🛡",
      icon: MinusCircle,
      activeStyle: {
        background:
          "linear-gradient(135deg, oklch(0.68 0.18 195) 0%, oklch(0.60 0.18 185) 100%)",
        borderColor: "oklch(0.68 0.18 195)",
      },
      idleClass: "border-border bg-background hover:bg-muted/50",
      iconColor: "oklch(0.68 0.18 195)",
    },
  ] as const;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent border-0"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="relative z-10 w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        data-ocid="gym.modal.sheet"
      >
        {/* Gradient accent top bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.18 0.08 264), oklch(0.48 0.22 264), oklch(0.68 0.18 195))",
          }}
        />
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Mark Attendance
            </p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {formatSelectedDate(dateStr)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-ocid="gym.modal.close"
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Options */}
        <div className="px-5 pt-4 pb-2 space-y-2.5">
          {optionConfig.map(
            ({
              status,
              label,
              sublabel,
              icon: Icon,
              activeStyle,
              idleClass,
              iconColor,
            }) => {
              const isActive = selected === status;
              return (
                <motion.button
                  key={status}
                  type="button"
                  onClick={() => setSelected(status)}
                  data-ocid={`gym.modal.option.${status}`}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 ${isActive ? "" : idleClass}`}
                  style={
                    isActive
                      ? {
                          ...activeStyle,
                          border: `2px solid ${activeStyle.borderColor}`,
                        }
                      : undefined
                  }
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${isActive ? "bg-white/20" : "bg-muted"}`}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: isActive ? "white" : iconColor }}
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold leading-tight ${isActive ? "text-white" : "text-foreground"}`}
                    >
                      {label}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 leading-tight ${isActive ? "text-white/70" : "text-muted-foreground"}`}
                    >
                      {sublabel}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0"
                    >
                      <span className="text-white text-xs font-bold">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              );
            },
          )}

          <AnimatePresence>
            {selected === "present" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Input
                  placeholder="Workout note (optional) — e.g. Chest & Triceps"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 text-sm bg-background border-border rounded-xl h-11"
                  data-ocid="gym.modal.note"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl font-semibold"
            onClick={onClose}
            data-ocid="gym.modal.cancel"
          >
            Cancel
          </Button>
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={isMutating}
            whileTap={{ scale: 0.97 }}
            data-ocid="gym.modal.save"
            className="flex-1 h-12 rounded-xl font-semibold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.48 0.22 264) 100%)",
            }}
          >
            {isMutating ? "Saving…" : "Save"}
          </motion.button>
        </div>
      </motion.div>
    </dialog>
  );
}

// ─── GymTab ───────────────────────────────────────────────────────────────────

function GymTab({ phone }: { phone: string }) {
  const todayStr = useMemo(() => getTodayStr(), []);
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const viewYear = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d.getFullYear();
  }, [today, monthOffset]);

  const viewMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d.getMonth();
  }, [today, monthOffset]);

  const calendarGrid = useMemo(
    () => getCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const { data: records = [], isLoading: recordsLoading } =
    useGymAttendance(phone);
  const { data: streak = 0, isLoading: streakLoading } = useGymStreak(
    phone,
    todayStr,
  );
  const { mutate: markAttendance, isPending: isMutating } =
    useMarkGymAttendance(phone);

  const recordMap = useMemo(() => {
    const map: Record<string, GymRecord> = {};
    for (const r of records) map[r.date] = r;
    return map;
  }, [records]);

  const handleMark = useCallback(
    (date: string, status: AttendanceStatus, note: string) => {
      markAttendance({ date, status, note });
    },
    [markAttendance],
  );

  const viewMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthRecords = records.filter((r) =>
    r.date.startsWith(viewMonthPrefix),
  );
  const presentCount = monthRecords.filter(
    (r) => r.status === "present",
  ).length;
  const absentCount = monthRecords.filter((r) => r.status === "absent").length;
  const restCount = monthRecords.filter((r) => r.status === "rest").length;

  // Weekly summary — current week days mapped by day index
  const weekDayDates = useMemo(() => {
    const result: Record<number, string> = {};
    const d = new Date(`${todayStr}T00:00:00`);
    const dayOfWeek = d.getDay();
    for (let i = 0; i <= dayOfWeek; i++) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - (dayOfWeek - i));
      const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
      result[i] = key;
    }
    return result;
  }, [todayStr]);

  const isCurrentMonth = monthOffset === 0;

  // Day cell styling
  function getDayCellStyle(
    record: GymRecord | undefined,
    isToday: boolean,
  ): { className: string; style?: React.CSSProperties } {
    if (record?.status === "present") {
      return {
        className: isToday ? "ring-2 ring-offset-1 ring-white" : "",
        style: {
          background:
            "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.40 0.25 240) 100%)",
        },
      };
    }
    if (record?.status === "absent") {
      return {
        className: isToday ? "ring-2 ring-offset-1 ring-white" : "",
        style: {
          background:
            "linear-gradient(135deg, oklch(0.55 0.25 27) 0%, oklch(0.48 0.22 20) 100%)",
        },
      };
    }
    if (record?.status === "rest") {
      return {
        className: isToday ? "ring-2 ring-offset-1 ring-white" : "",
        style: {
          background:
            "linear-gradient(135deg, oklch(0.68 0.18 195) 0%, oklch(0.60 0.18 185) 100%)",
        },
      };
    }
    if (isToday) {
      return {
        className: "ring-2 ring-primary ring-offset-1",
        style: undefined,
      };
    }
    return { className: "", style: undefined };
  }

  function getDayTextColor(
    record: GymRecord | undefined,
    isToday: boolean,
    isFuture: boolean,
  ): string {
    if (record?.status) return "text-white font-bold";
    if (isToday) return "text-primary font-bold";
    if (isFuture) return "text-muted-foreground/50";
    return "text-foreground";
  }

  function getWeekDotStyle(
    status: AttendanceStatus | undefined,
  ): React.CSSProperties {
    if (status === "present")
      return {
        background:
          "linear-gradient(135deg, oklch(0.48 0.22 264), oklch(0.40 0.25 240))",
      };
    if (status === "absent")
      return { background: "oklch(0.55 0.25 27 / 0.25)" };
    if (status === "rest") return { background: "oklch(0.68 0.18 195 / 0.25)" };
    return {};
  }

  function getWeekDotBorder(status: AttendanceStatus | undefined): string {
    if (status === "present") return "border-secondary/60";
    if (status === "absent") return "border-destructive/40";
    if (status === "rest") return "border-accent/40";
    return "border-border";
  }

  return (
    <div className="space-y-4" data-ocid="user.gym.panel">
      {/* ── Streak Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div
            className="relative p-5 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.28 0.14 264) 50%, oklch(0.22 0.10 230) 100%)",
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
              style={{
                background: "radial-gradient(circle, white, transparent 70%)",
              }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.68 0.18 195), transparent 70%)",
              }}
            />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">
                  🔥 Current Streak
                </p>
                <div className="flex items-end gap-2 mt-1">
                  {streakLoading ? (
                    <Skeleton className="h-14 w-24 bg-white/20 rounded-xl" />
                  ) : (
                    <>
                      <motion.span
                        key={streak}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="text-white font-bold font-display leading-none"
                        style={{ fontSize: "clamp(2.5rem, 8vw, 3.5rem)" }}
                      >
                        <AnimatedCounter value={streak} />
                      </motion.span>
                      <span className="text-white/70 text-lg font-semibold mb-1">
                        {streak === 1 ? "day" : "days"}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-white/45 text-xs mt-1.5">
                  {streak === 0
                    ? "Start your streak today!"
                    : streak < 7
                      ? "Keep going, you're on a roll!"
                      : streak < 30
                        ? "Impressive dedication! 💪"
                        : "Legendary consistency! 🏆"}
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0"
              >
                <Flame className="w-8 h-8 text-orange-300" />
              </motion.div>
            </div>

            {/* Month summary stats */}
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
              {[
                {
                  label: "Present",
                  value: presentCount,
                  borderClass: "border-secondary/40",
                  bgStyle: { background: "oklch(0.48 0.22 264 / 0.2)" },
                },
                {
                  label: "Absent",
                  value: absentCount,
                  borderClass: "border-destructive/40",
                  bgStyle: { background: "oklch(0.55 0.25 27 / 0.2)" },
                },
                {
                  label: "Rest",
                  value: restCount,
                  borderClass: "border-accent/40",
                  bgStyle: { background: "oklch(0.68 0.18 195 / 0.2)" },
                },
              ].map(({ label, value, borderClass, bgStyle }) => (
                <div
                  key={label}
                  className={`rounded-xl px-3 py-2.5 text-center border ${borderClass}`}
                  style={bgStyle}
                >
                  <p className="text-white/55 text-[10px] uppercase font-bold tracking-wider">
                    {label}
                  </p>
                  <p className="text-white text-2xl font-bold mt-0.5 font-display">
                    {value}
                  </p>
                  <p className="text-white/40 text-[9px] mt-0.5">This month</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Weekly Summary ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="shadow-sm border border-border">
          <CardContent className="px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
              This Week
            </p>
            <div className="flex items-center gap-1 justify-between">
              {DAY_HEADERS.map((dayLabel, i) => {
                const weekDate = weekDayDates[i];
                const rec = weekDate ? recordMap[weekDate] : undefined;
                const isWeekToday = weekDate === todayStr;
                const isFutureDay = !weekDate;
                return (
                  <div
                    key={dayLabel}
                    className="flex flex-col items-center gap-1.5 flex-1"
                  >
                    <span
                      className={`text-[10px] font-semibold ${isWeekToday ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {dayLabel}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${getWeekDotBorder(rec?.status)} ${isWeekToday ? "ring-2 ring-primary ring-offset-1" : ""} ${isFutureDay ? "opacity-30" : ""}`}
                      style={getWeekDotStyle(rec?.status)}
                    >
                      {rec?.status === "present" && (
                        <span className="text-white text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                      {rec?.status === "absent" && (
                        <span className="text-[oklch(0.55_0.25_27)] text-[10px] font-bold">
                          ✗
                        </span>
                      )}
                      {rec?.status === "rest" && (
                        <span className="text-[oklch(0.68_0.18_195)] text-[10px] font-bold">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Calendar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3 px-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMonthOffset((o) => o - 1)}
            data-ocid="gym.month.prev"
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            {!isCurrentMonth && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-secondary font-semibold">
                  {presentCount}P
                </span>
                {" · "}
                <span className="text-destructive font-semibold">
                  {absentCount}A
                </span>
                {" · "}
                <span className="text-accent font-semibold">{restCount}R</span>
              </p>
            )}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={isCurrentMonth}
            data-ocid="gym.month.next"
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </motion.button>
        </div>

        {recordsLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : (
          <Card
            className="overflow-hidden border border-border shadow-sm"
            data-ocid="gym.calendar.grid"
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {calendarGrid.map((dateStr, idx) => {
                const col = idx % 7;
                if (!dateStr) {
                  return (
                    <div
                      key={`empty-r${Math.floor(idx / 7)}-c${col}`}
                      className="aspect-square border-b border-r border-border/30 last:border-r-0 bg-muted/10"
                    />
                  );
                }
                const record = recordMap[dateStr];
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                const dayNum = Number.parseInt(dateStr.split("-")[2], 10);
                const { className: cellClass, style: cellStyle } =
                  getDayCellStyle(record, isToday);
                const textColor = getDayTextColor(record, isToday, isFuture);

                return (
                  <motion.button
                    key={dateStr}
                    type="button"
                    onClick={() => !isFuture && setSelectedDate(dateStr)}
                    disabled={isFuture}
                    data-ocid={`gym.cal.${dateStr}`}
                    whileTap={isFuture ? undefined : { scale: 0.85 }}
                    className={`relative flex flex-col items-center justify-center aspect-square border-b border-r border-border/30 last:border-r-0 transition-all duration-150 ${
                      isFuture
                        ? "opacity-30 cursor-not-allowed"
                        : "cursor-pointer hover:brightness-110"
                    } ${cellClass}`}
                    style={cellStyle}
                  >
                    <span
                      className={`text-xs sm:text-sm font-semibold leading-none z-10 transition-colors ${textColor}`}
                    >
                      {dayNum}
                    </span>
                    {/* Workout note indicator dot */}
                    {record?.note && record.status === "present" && (
                      <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-white/60" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3">
          {[
            { color: "oklch(0.48 0.22 264)", label: "Present" },
            { color: "oklch(0.55 0.25 27)", label: "Absent" },
            { color: "oklch(0.68 0.18 195)", label: "Rest Day" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: color }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Attendance Modal ── */}
      <AnimatePresence>
        {selectedDate && (
          <AttendanceModal
            dateStr={selectedDate}
            existing={recordMap[selectedDate]}
            isMutating={isMutating}
            onSave={handleMark}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { session, logout } = useAppAuth();
  const name = session?.role === "user" ? session.name : "User";
  const phone = session?.role === "user" ? session.phone : "";
  const details = session?.role === "user" ? session.details : "";
  const initials =
    name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="space-y-4" data-ocid="user.profile.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        {/* Profile Hero Card */}
        <Card className="overflow-hidden border-0 shadow-card">
          <div
            className="relative p-6 flex flex-col items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.48 0.22 264) 80%, oklch(0.68 0.18 195) 100%)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 bottom-0 opacity-10"
              style={{
                background:
                  "radial-gradient(circle at top right, white, transparent 60%)",
              }}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shadow-lg relative z-10"
            >
              <span className="text-2xl font-bold text-white font-display">
                {initials}
              </span>
            </motion.div>
            <div className="text-center relative z-10">
              <h3 className="text-white text-xl font-bold font-display">
                {name}
              </h3>
              {details && (
                <p className="text-white/65 text-sm mt-1 max-w-xs">{details}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Account Info
            </p>
            {phone && (
              <div className="flex items-center gap-3 py-2.5 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Phone Number
                  </p>
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {phone}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Role
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">
                  Student
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Placeholder */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Settings
            </p>
            <div className="space-y-0.5">
              {[
                "Edit Profile",
                "Notifications",
                "Privacy",
                "Help & Support",
              ].map((item, i) => (
                <div
                  key={item}
                  data-ocid={`profile.settings.item.${i + 1}`}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0 group"
                >
                  <span className="text-sm font-medium text-foreground">
                    {item}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0 h-4 text-muted-foreground border-border"
                  >
                    Soon
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <motion.button
          type="button"
          onClick={logout}
          data-ocid="profile.logout.button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all duration-200"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.38 0.22 280) 100%)",
          }}
        >
          Sign Out
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── UserDashboard ────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const { session } = useAppAuth();
  const phone = session?.role === "user" ? session.phone : "";
  const name = session?.role === "user" ? session.name : "there";
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as AppBackend | null;

  const todayStr = useMemo(() => getTodayStr(), []);
  const [todayStudySeconds, setTodayStudySeconds] = useState(0);
  const [pendingChaptersCount, setPendingChaptersCount] = useState(0);

  const { data: gymStreak = 0, isLoading: gymStreakLoading } = useGymStreak(
    phone,
    todayStr,
  );

  const loadTodayStudy = useCallback(async () => {
    if (!phone || !actor) return;
    try {
      const data: StudySession[] = await actor.getStudySessions(phone);
      const total = data
        .filter((s) => s.date === todayStr)
        .reduce((acc, s) => acc + Number(s.durationSeconds), 0);
      setTodayStudySeconds(total);
    } catch {
      /* silent */
    }
  }, [phone, actor, todayStr]);

  const loadPendingCount = useCallback(async () => {
    if (!phone || !actor) return;
    try {
      const count = await actor.getPendingChaptersCount(phone);
      setPendingChaptersCount(Number(count));
    } catch {
      /* silent */
    }
  }, [phone, actor]);

  useEffect(() => {
    loadTodayStudy();
    loadPendingCount();
  }, [loadTodayStudy, loadPendingCount]);

  useEffect(() => {
    if (activeTab === "home") {
      loadTodayStudy();
      loadPendingCount();
    }
  }, [activeTab, loadTodayStudy, loadPendingCount]);

  const todayStudyTime = formatDuration(todayStudySeconds);
  const meta = PAGE_META[activeTab] ?? { title: activeTab, subtitle: "" };

  const tabContent: Record<string, React.ReactNode> = {
    home: (
      <HomeTab
        name={name}
        todayStudyTime={todayStudyTime}
        pendingChaptersCount={pendingChaptersCount}
        gymStreak={gymStreak}
        gymStreakLoading={gymStreakLoading}
        onTabChange={setActiveTab}
      />
    ),
    study: <StudyTimerPage />,
    syllabus: <SyllabusTrackerPage onBack={() => setActiveTab("home")} />,
    notes: <NotesPage onBack={() => setActiveTab("home")} />,
    gym: <GymTab phone={phone} />,
    profile: <ProfileTab />,
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={USER_NAV_ITEMS}
      userRole="user"
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      <div data-ocid="user.page">
        {/* Mobile page title */}
        <div className="lg:hidden mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-header`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
            >
              <h2 className="text-xl font-bold font-display text-foreground">
                {meta.title}
              </h2>
              <p className="text-muted-foreground text-sm">{meta.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {tabContent[activeTab]}
      </div>
    </Layout>
  );
}
