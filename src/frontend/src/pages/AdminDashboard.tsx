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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BookOpen,
  Eye,
  EyeOff,
  ImageIcon,
  KeyRound,
  LogOut,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Layout, { ADMIN_NAV_ITEMS } from "../components/Layout";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import { useAppLogo, useSetAppLogo } from "../hooks/useAppLogo";
import { useAllUserDetails } from "../hooks/useQueries";
import {
  type AdminUserDetail,
  type AppBackend,
  DeleteResult,
} from "../types/appTypes";

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_PASS_KEY = "adminPassword";
const DEFAULT_ADMIN_PASS = "Yash89@#$48";

function getAdminPass(): string {
  return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASS;
}

function formatDate(createdAt: bigint): string {
  const ms = Number(createdAt / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: "blue" | "cyan";
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-0 shadow-card relative">
        <div className="absolute inset-0 gradient-card opacity-60 pointer-events-none" />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                accent === "blue" ? "bg-secondary/15" : "bg-accent/15"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${accent === "blue" ? "text-secondary" : "text-accent"}`}
              />
            </div>
          </div>
          <p className="text-3xl font-bold font-display text-foreground leading-none">
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            {label}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── User Row ────────────────────────────────────────────────────────────────

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
      className={`transition-colors ${index % 2 === 0 ? "bg-muted/20" : ""} hover:bg-accent/5`}
    >
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
      <TableCell className="text-sm text-muted-foreground font-mono">
        {user.phone}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(user.createdAt)}
      </TableCell>
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
      <TableCell className="text-right">
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

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: users, isLoading } = useAllUserDetails();
  const totalUsers = users?.length ?? 0;

  return (
    <div className="space-y-5" data-ocid="admin.overview.panel">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-card">
          <div className="gradient-hero p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-white/80" />
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                    Admin Panel
                  </span>
                </div>
                <h2 className="text-white text-2xl font-bold font-display">
                  Welcome, Yash
                </h2>
                <p className="text-white/50 text-sm mt-0.5">
                  Manage users and configure the app
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={isLoading ? "…" : totalUsers}
          accent="blue"
          index={0}
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={isLoading ? "…" : totalUsers}
          accent="cyan"
          index={1}
        />
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 grid grid-cols-2 gap-2">
            {[
              {
                label: "Manage Users",
                desc: "View, reveal PIN, delete",
                icon: Users,
              },
              {
                label: "App Settings",
                desc: "Password, logo & config",
                icon: KeyRound,
              },
            ].map(({ label, desc, icon: Icon }, i) => (
              <div
                key={label}
                className="p-3 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                <span className="text-[10px] font-semibold text-accent mt-1 inline-block">
                  {i === 0 ? "Users tab →" : "Settings tab →"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

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
        {/* Stats row */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="px-3 py-1.5 text-xs font-semibold gap-1.5"
          >
            <Users className="w-3 h-3" />
            Total: {isLoading ? "…" : totalUsers} users
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-xs font-semibold gap-1.5 border-accent/40 text-accent"
          >
            <ShieldCheck className="w-3 h-3" />
            Active: {isLoading ? "…" : totalUsers}
          </Badge>
        </div>

        {/* Table card */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              All Registered Users
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
                className="text-center py-14"
              >
                <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-3">
                  <UserCog className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No users registered yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users will appear here once they sign up
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" data-ocid="admin.users.table">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
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

// ─── Change Password Card ─────────────────────────────────────────────────────

function ChangePasswordCard() {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!currentPass || !newPass || !confirmPass) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (currentPass !== getAdminPass()) {
      toast.error("Current password is incorrect.");
      return;
    }
    if (newPass.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("New passwords do not match.");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(ADMIN_PASS_KEY, newPass);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setIsSaving(false);
      toast.success("Admin password updated successfully.");
    }, 600);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-accent" />
          Change Admin Password
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Admin info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">Y</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Yash</p>
            <p className="text-xs text-muted-foreground">
              Administrator account
            </p>
          </div>
          <Badge
            variant="outline"
            className="ml-auto border-accent/30 text-accent text-[10px]"
          >
            <ShieldCheck className="w-2.5 h-2.5 mr-1" />
            Admin
          </Badge>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-current-pass">Current Password</Label>
          <div className="relative">
            <Input
              id="admin-current-pass"
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="pr-10"
              data-ocid="admin.settings.current_pass"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-new-pass">New Password</Label>
          <div className="relative">
            <Input
              id="admin-new-pass"
              type={showNew ? "text" : "password"}
              placeholder="Enter new password (min 6 chars)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="pr-10"
              data-ocid="admin.settings.new_pass"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-confirm-pass">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="admin-confirm-pass"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="pr-10"
              data-ocid="admin.settings.confirm_pass"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          className="w-full h-11 rounded-xl font-semibold gradient-hero text-white border-0 hover:opacity-90 transition-opacity"
          onClick={handleSave}
          disabled={isSaving}
          data-ocid="admin.settings.save_pass_button"
        >
          {isSaving ? "Saving…" : "Update Password"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Change Logo Card ─────────────────────────────────────────────────────────

function ChangeLogoCard() {
  // Read current logo from backend (syncs across all devices)
  const currentLogo = useAppLogo();
  const setAppLogo = useSetAppLogo();
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error("Image must be under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setIsSaving(true);
      try {
        await setAppLogo(dataUrl);
        toast.success("App logo updated — now visible on all devices.");
      } catch {
        toast.error("Failed to save logo. Please try again.");
      } finally {
        setIsSaving(false);
        // Reset input so same file can be re-selected if needed
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await setAppLogo(null);
      toast.success("Logo removed. Default icon restored on all devices.");
    } catch {
      toast.error("Failed to remove logo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-accent" />
          App Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Preview */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/20 shadow-md">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="App logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {currentLogo ? "Custom logo active" : "Using default icon"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentLogo
                ? "Stored on server — visible on all devices"
                : "Upload a logo to brand your app on all devices"}
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFileChange}
          data-ocid="admin.settings.logo_input"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl gap-2 text-sm font-medium"
            onClick={() => fileRef.current?.click()}
            disabled={isSaving}
            data-ocid="admin.settings.upload_logo_button"
          >
            <Upload className="w-4 h-4" />
            {isSaving
              ? "Saving…"
              : currentLogo
                ? "Replace Logo"
                : "Upload Logo"}
          </Button>
          {currentLogo && (
            <Button
              variant="ghost"
              className="h-10 rounded-xl gap-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRemove}
              disabled={isSaving}
              data-ocid="admin.settings.remove_logo_button"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Supports PNG, JPG, SVG, WebP. Max 500 KB. Synced to all devices.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-4" data-ocid="admin.settings.panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4"
      >
        <ChangePasswordCard />
        <ChangeLogoCard />

        {/* Sign out card */}
        <Card className="shadow-card border-destructive/20">
          <CardHeader className="pb-3 border-b border-destructive/10">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <LogOut className="w-4 h-4" />
              Sign Out
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              You are signed in as{" "}
              <span className="font-semibold text-foreground">
                Admin (Yash)
              </span>
              . Signing out will end your current session.
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

// ─── Tab Metadata ─────────────────────────────────────────────────────────────

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Admin Overview", subtitle: "App management at a glance" },
  users: { title: "User Management", subtitle: "All registered users" },
  settings: {
    title: "Settings",
    subtitle: "Password, logo & admin configuration",
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { logout } = useAppAuth();

  const meta = TAB_META[activeTab] ?? { title: activeTab, subtitle: "" };

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    users: <UsersTab />,
    settings: <SettingsTab onLogout={logout} />,
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={ADMIN_NAV_ITEMS}
      userRole="admin"
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      <div data-ocid="admin.page">
        {/* Mobile page title */}
        <div className="lg:hidden mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-header`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold font-display text-foreground">
                {meta.title}
              </h2>
              <p className="text-muted-foreground text-sm">{meta.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
