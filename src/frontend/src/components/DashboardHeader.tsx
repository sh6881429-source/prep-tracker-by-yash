import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, LogOut, User } from "lucide-react";
import { useAppAuth } from "../hooks/useAppAuth";

interface DashboardHeaderProps {
  userRole: "user" | "admin";
}

export default function DashboardHeader({ userRole }: DashboardHeaderProps) {
  const { session, logout } = useAppAuth();

  const displayName =
    session?.name || (userRole === "admin" ? "Admin" : "User");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-4">
      {/* Logo + App name */}
      <div className="flex items-center gap-2.5 flex-1">
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground leading-tight font-display">
            Prep Tracker
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            by Yash
          </span>
        </div>
      </div>

      {/* Role badge */}
      {userRole === "admin" && (
        <span className="mr-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
          Admin
        </span>
      )}

      {/* Profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-ocid="profile.toggle"
            className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Profile menu"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs font-semibold gradient-hero text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-foreground">
              {displayName}
            </p>
            {session?.role === "user" && session.phone && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {session.phone}
              </p>
            )}
          </div>
          <DropdownMenuItem
            data-ocid="profile.button"
            className="gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            data-ocid="logout.button"
            onClick={logout}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
