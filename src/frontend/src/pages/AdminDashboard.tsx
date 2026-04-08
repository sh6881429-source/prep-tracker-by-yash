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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Dumbbell,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import type { NavItem } from "../components/BottomNav";
import DashboardHeader from "../components/DashboardHeader";
import PlaceholderCard from "../components/PlaceholderCard";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import { useAllUserDetails } from "../hooks/useQueries";
import {
  type AdminUserDetail,
  type AppBackend,
  DeleteResult,
} from "../types/appTypes";

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "users",
    label: "Users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

function formatDate(createdAt: bigint): string {
  // Motoko Time.now() returns nanoseconds; convert to ms
  const ms = Number(createdAt / 1_000_000n);
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UserRow({
  user,
  index,
  onDeleted,
}: {
  user: AdminUserDetail;
  index: number;
  onDeleted: (phone: string) => void;
}) {
  const [pinVisible, setPinVisible] = useState(false);
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!actor) return;
    setIsDeleting(true);
    try {
      const newActor = actor as unknown as AppBackend;
      const result = await newActor.deleteUser(user.phone);
      if (result === DeleteResult.ok) {
        toast.success(`${user.name} has been removed.`);
        await queryClient.invalidateQueries({ queryKey: ["allUserDetails"] });
        onDeleted(user.phone);
      } else {
        toast.error("User not found. They may have already been deleted.");
      }
    } catch {
      toast.error("Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const initial = (user.name?.[0] || "U").toUpperCase();

  return (
    <TableRow
      data-ocid={`admin.users.item.${index}`}
      className="hover:bg-muted/30 transition-colors"
    >
      {/* Name */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {user.name || "Unnamed"}
          </span>
        </div>
      </TableCell>

      {/* Phone */}
      <TableCell className="text-sm text-muted-foreground font-mono">
        {user.phone}
      </TableCell>

      {/* Join Date */}
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(user.createdAt)}
      </TableCell>

      {/* PIN */}
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono tracking-widest">
            {pinVisible ? user.pin : "••••"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setPinVisible((v) => !v)}
            data-ocid={`admin.users.toggle.${index}`}
            aria-label={pinVisible ? "Hide PIN" : "Reveal PIN"}
          >
            {pinVisible ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-ocid={`admin.users.delete_button.${index}`}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.users.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove their account and all associated
                data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.users.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.users.confirm_button"
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

function OverviewTab() {
  const { data: users } = useAllUserDetails();
  const totalUsers = users?.length ?? 0;

  return (
    <div className="space-y-4" data-ocid="admin.overview.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-card">
          <div className="gradient-hero p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-white/80" />
                  <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                    Admin Panel
                  </span>
                </div>
                <h2 className="text-white text-2xl font-bold font-display">
                  Prep Tracker
                </h2>
                <p className="text-white/60 text-sm mt-0.5">
                  Management Dashboard
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider">
                  Users
                </p>
                <p className="text-white text-xl font-bold mt-0.5">
                  {totalUsers > 0 ? totalUsers : "—"}
                </p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider">
                  Active
                </p>
                <p className="text-white text-xl font-bold mt-0.5">
                  {totalUsers > 0 ? totalUsers : "—"}
                </p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider">
                  Sessions
                </p>
                <p className="text-white text-xl font-bold mt-0.5">—</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <PlaceholderCard
          icon={Users}
          title="User Mgmt"
          subtitle="Manage roles & access"
          color="blue"
          index={1}
        />
        <PlaceholderCard
          icon={BookOpen}
          title="Content"
          subtitle="Manage study content"
          color="purple"
          index={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PlaceholderCard
          icon={Dumbbell}
          title="Gym Config"
          subtitle="Configure workouts"
          color="teal"
          index={3}
        />
        <PlaceholderCard
          icon={BarChart3}
          title="Analytics"
          subtitle="App-wide analytics"
          color="orange"
          index={4}
        />
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading, isError } = useAllUserDetails();
  const [deletedPhones, setDeletedPhones] = useState<Set<string>>(new Set());

  const visibleUsers = users?.filter((u) => !deletedPhones.has(u.phone)) ?? [];
  const totalUsers = visibleUsers.length;

  function handleDeleted(phone: string) {
    setDeletedPhones((prev) => new Set([...prev, phone]));
  }

  return (
    <div className="space-y-4" data-ocid="admin.users.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4"
      >
        {/* Stats chips */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="px-3 py-1.5 text-xs font-semibold gap-1.5"
          >
            <Users className="w-3 h-3" />
            Total Users: {isLoading ? "…" : totalUsers}
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-xs font-semibold gap-1.5 border-accent/40 text-accent"
          >
            <ShieldCheck className="w-3 h-3" />
            Active Users: {isLoading ? "…" : totalUsers}
          </Badge>
        </div>

        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isError ? (
              <div
                data-ocid="admin.users.error_state"
                className="text-center py-10"
              >
                <p className="text-sm text-destructive">
                  Failed to load users. Please refresh.
                </p>
              </div>
            ) : isLoading ? (
              <div
                data-ocid="admin.users.loading_state"
                className="overflow-x-auto"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>PIN</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-7 w-7 rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : visibleUsers.length === 0 ? (
              <div
                data-ocid="admin.users.empty_state"
                className="text-center py-12"
              >
                <UserCog className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No users registered yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Users will appear here once they sign up
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" data-ocid="admin.users.table">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[110px]">Joined</TableHead>
                      <TableHead className="min-w-[90px]">PIN</TableHead>
                      <TableHead className="w-12 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleUsers.map((user, i) => (
                      <UserRow
                        key={user.phone}
                        user={user}
                        index={i + 1}
                        onDeleted={handleDeleted}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SettingsTab({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-4" data-ocid="admin.settings.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4"
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-accent" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "General Settings",
                "Role Management",
                "Notifications Config",
                "Data Export",
                "App Maintenance",
              ].map((item, i) => (
                <div
                  key={item}
                  data-ocid={`admin.settings.item.${i + 1}`}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <span className="text-sm font-medium text-foreground">
                    {item}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Soon
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sign Out card */}
        <Card className="shadow-card border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <LogOut className="w-4 h-4" />
              Sign Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You are logged in as{" "}
              <span className="font-semibold text-foreground">
                Admin (Yash)
              </span>
              . Signing out will end your session.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-ocid="admin.settings.signout_button"
                  variant="destructive"
                  className="w-full h-11 font-semibold gap-2 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="admin.signout.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of Admin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your session will be cleared. You will need to log in again
                    to access the admin panel.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="admin.signout.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="admin.signout.confirm_button"
                    onClick={onLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { logout } = useAppAuth();

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    users: <UsersTab />,
    settings: <SettingsTab onLogout={logout} />,
  };

  const tabLabels: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: "Admin Overview",
      subtitle: "App management at a glance",
    },
    users: { title: "User Management", subtitle: "All registered users" },
    settings: { title: "Settings", subtitle: "App configuration" },
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-ocid="admin.page"
    >
      <DashboardHeader userRole="admin" />

      <main className="flex-1 pt-14 pb-20 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          <motion.div
            key={`${activeTab}-header`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <h2 className="text-xl font-bold font-display text-foreground">
              {tabLabels[activeTab]?.title}
            </h2>
            <p className="text-muted-foreground text-sm">
              {tabLabels[activeTab]?.subtitle}
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
