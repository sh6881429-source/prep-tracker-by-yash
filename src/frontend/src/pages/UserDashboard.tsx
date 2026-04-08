import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookMarked,
  BookOpen,
  Clock,
  Dumbbell,
  FileText,
  Flame,
  Home,
  Timer,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import type { NavItem } from "../components/BottomNav";
import DashboardHeader from "../components/DashboardHeader";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import type { AppBackend, StudySession } from "../types/appTypes";
import StudyTimerPage from "./StudyTimerPage";
import SyllabusTrackerPage from "./SyllabusTrackerPage";

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
  { id: "study", label: "Study", icon: <BookOpen className="w-5 h-5" /> },
  { id: "gym", label: "Gym", icon: <Dumbbell className="w-5 h-5" /> },
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

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

function HomeTab({
  name,
  todayStudyTime,
  pendingChaptersCount,
  onTabChange,
  onNavigate,
}: {
  name: string;
  todayStudyTime: string;
  pendingChaptersCount: number;
  onTabChange: (tab: string) => void;
  onNavigate: (page: string) => void;
}) {
  const statCards = [
    {
      icon: Clock,
      label: "Today's Study Time",
      value: todayStudyTime,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: BookOpen,
      label: "Pending Chapters",
      value: String(pendingChaptersCount),
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
    {
      icon: Flame,
      label: "Gym Streak",
      value: "0 days",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const quickAccess = [
    {
      icon: Timer,
      label: "Study Timer",
      ocid: "home.study_timer.button",
      action: () => onTabChange("study"),
      available: true,
    },
    {
      icon: BookMarked,
      label: "Syllabus Tracker",
      ocid: "home.syllabus.button",
      action: () => onNavigate("syllabus"),
      available: true,
    },
    {
      icon: FileText,
      label: "Notes / PDF",
      ocid: "home.notes.button",
      action: undefined as (() => void) | undefined,
      available: false,
    },
    {
      icon: Dumbbell,
      label: "Gym Tracker",
      ocid: "home.gym_tracker.button",
      action: () => onTabChange("gym"),
      available: false,
    },
  ];

  return (
    <div className="space-y-5" data-ocid="user.home.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-card">
          <div className="gradient-hero p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">
                  Welcome back,
                </p>
                <h2 className="text-white text-2xl font-bold font-display mt-0.5">
                  {name} 👋
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-300" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              {["Streak", "Sessions", "Goals"].map((label) => (
                <div
                  key={label}
                  className="flex-1 bg-white/10 rounded-xl p-3 text-center"
                >
                  <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider">
                    {label}
                  </p>
                  <p className="text-white text-xl font-bold mt-0.5">—</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Today's Overview
        </h3>
        <div className="grid grid-cols-3 gap-2.5" data-ocid="user.stats.panel">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border border-border shadow-none"
                data-ocid={`user.stats.item.${i + 1}`}
              >
                <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-base font-bold text-foreground leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Access
        </h3>
        <div
          className="grid grid-cols-2 gap-3"
          data-ocid="user.quickaccess.panel"
        >
          {quickAccess.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                data-ocid={item.ocid}
                onClick={item.action}
                disabled={!item.action}
                className="group flex flex-col items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/40 hover:border-primary/30 transition-all duration-200 active:scale-[0.97] text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-200">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-medium px-1.5 py-0 h-4 ${
                      item.available
                        ? "bg-green-100 text-green-700 border-green-200"
                        : ""
                    }`}
                    data-ocid={`user.quickaccess.item.${i + 1}`}
                  >
                    {item.available ? "Active" : "Coming Soon"}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function GymTab() {
  return (
    <div className="space-y-4" data-ocid="user.gym.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="font-bold text-foreground text-lg">Gym Tracker</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Log workouts, track exercises, sets, reps, and monitor your fitness
            journey.
          </p>
          <span className="inline-block mt-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
            Coming Soon
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileTab() {
  const { session, logout } = useAppAuth();
  const name = session?.role === "user" ? session.name : "User";
  const details = session?.role === "user" ? session.details : "";

  return (
    <div className="space-y-4" data-ocid="user.profile.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {name[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground text-lg">{name}</h3>
                {details ? (
                  <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                    {details}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">Member</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card mt-4">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Settings
            </h4>
            <div className="space-y-3">
              {[
                "Edit Profile",
                "Notifications",
                "Privacy",
                "Help & Support",
              ].map((item, i) => (
                <div
                  key={item}
                  data-ocid={`profile.settings.item.${i + 1}`}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm font-medium text-foreground">
                    {item}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={logout}
          data-ocid="profile.logout.button"
          className="w-full mt-4 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
        >
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [activePage, setActivePage] = useState("dashboard");
  const { session } = useAppAuth();
  const phone = session?.role === "user" ? session.phone : "";
  const name = session?.role === "user" ? session.name : "there";
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as AppBackend | null;

  const [todayStudySeconds, setTodayStudySeconds] = useState(0);
  const [pendingChaptersCount, setPendingChaptersCount] = useState(0);

  const loadTodayStudy = useCallback(async () => {
    if (!phone || !actor) return;
    try {
      const data: StudySession[] = await actor.getStudySessions(phone);
      const todayStr = getTodayStr();
      const total = data
        .filter((s) => s.date === todayStr)
        .reduce((acc, s) => acc + Number(s.durationSeconds), 0);
      setTodayStudySeconds(total);
    } catch {
      // silent
    }
  }, [phone, actor]);

  const loadPendingCount = useCallback(async () => {
    if (!phone || !actor) return;
    try {
      const count = await actor.getPendingChaptersCount(phone);
      setPendingChaptersCount(Number(count));
    } catch {
      // silent
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

  useEffect(() => {
    if (activePage === "dashboard") loadPendingCount();
  }, [activePage, loadPendingCount]);

  const todayStudyTime = formatDuration(todayStudySeconds);

  if (activePage === "syllabus") {
    return (
      <div
        className="min-h-screen bg-background flex flex-col"
        data-ocid="user.page"
      >
        <DashboardHeader userRole="user" />
        <main className="flex-1 pt-14 pb-20 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <h2 className="text-xl font-bold font-display text-foreground">
                Syllabus Tracker
              </h2>
              <p className="text-muted-foreground text-sm">
                Subjects, chapters & progress
              </p>
            </motion.div>
            <SyllabusTrackerPage onBack={() => setActivePage("dashboard")} />
          </div>
        </main>
        <BottomNav
          items={navItems}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActivePage("dashboard");
            setActiveTab(tab);
          }}
        />
      </div>
    );
  }

  const tabContent: Record<string, React.ReactNode> = {
    home: (
      <HomeTab
        name={name}
        todayStudyTime={todayStudyTime}
        pendingChaptersCount={pendingChaptersCount}
        onTabChange={setActiveTab}
        onNavigate={setActivePage}
      />
    ),
    study: <StudyTimerPage />,
    gym: <GymTab />,
    profile: <ProfileTab />,
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-ocid="user.page"
    >
      <DashboardHeader userRole="user" />
      <main className="flex-1 pt-14 pb-20 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          <motion.div
            key={`${activeTab}-header`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <h2 className="text-xl font-bold font-display text-foreground capitalize">
              {activeTab === "home"
                ? "Dashboard"
                : `${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)}`}
            </h2>
            <p className="text-muted-foreground text-sm">
              {activeTab === "home" && "Your daily overview"}
              {activeTab === "study" && "Study sessions & topics"}
              {activeTab === "gym" && "Workouts & exercises"}
              {activeTab === "profile" && "Your account"}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav
        items={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
