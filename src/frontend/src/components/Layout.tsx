import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Timer,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAppAuth } from "../hooks/useAppAuth";
import { useAppLogo } from "../hooks/useAppLogo";
import BottomNav from "./BottomNav";
import type { NavItem } from "./BottomNav";

const BOT_NAV_COLLAPSED_KEY = "preptracker_botnav_collapsed";

export interface SideNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  navItems: SideNavItem[];
  userRole: "user" | "admin";
  pageTitle?: string;
  pageSubtitle?: string;
}

const SIDEBAR_KEY = "preptracker_sidebar_collapsed";

function AppLogo({ collapsed }: { collapsed: boolean }) {
  const logoSrc = useAppLogo();

  return (
    <div
      className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "justify-center" : ""}`}
    >
      <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="App logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="w-5 h-5 text-white" />
        )}
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight font-display truncate">
            Prep Tracker
          </p>
          <p className="text-[10px] text-white/50 leading-tight">by Yash</p>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  navItems,
  activeTab,
  onTabChange,
  userRole,
  onLogout,
}: {
  navItems: SideNavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  userRole: "user" | "admin";
  onLogout: () => void;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored === "true";
  });

  const { session } = useAppAuth();
  const displayName =
    session?.name || (userRole === "admin" ? "Admin" : "User");
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const sidebarWidth = collapsed ? "w-[68px]" : "w-60";

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out ${sidebarWidth}`}
      style={{
        background:
          "linear-gradient(180deg, oklch(0.18 0.08 264) 0%, oklch(0.14 0.07 264) 100%)",
        borderRight: "1px solid oklch(0.25 0.06 264)",
      }}
      data-ocid="sidebar"
    >
      {/* Logo area */}
      <div
        className={`flex items-center justify-between px-3.5 pt-5 pb-4 border-b border-white/10 ${collapsed ? "px-2.5" : ""}`}
      >
        <AppLogo collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-ocid="sidebar.toggle"
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200 ml-1"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-white/70" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-white/70" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto"
        aria-label="Sidebar navigation"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`sidebar.nav.${item.id}`}
              onClick={() => onTabChange(item.id)}
              aria-selected={isActive}
              aria-label={item.label}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative
                ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                ${
                  isActive
                    ? "bg-secondary text-white shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-xl bg-secondary"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`flex-shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-semibold leading-tight truncate">
                  {item.label}
                </span>
              )}
              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-elevated">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin badge */}
      {userRole === "admin" && !collapsed && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-accent/15 border border-accent/25 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <span className="text-xs font-semibold text-accent">Admin Mode</span>
        </div>
      )}

      {/* User profile + Logout */}
      <div
        className={`border-t border-white/10 p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-white/50 leading-tight capitalize">
                {userRole}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          data-ocid="sidebar.logout"
          aria-label="Sign out"
          className={`flex items-center gap-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 w-full
            ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
  navItems,
  userRole,
  pageTitle,
  pageSubtitle,
}: LayoutProps) {
  const { logout } = useAppAuth();

  // Track bottom nav collapsed state so main content padding adjusts
  const [navCollapsed, setNavCollapsed] = useState(
    () => localStorage.getItem(BOT_NAV_COLLAPSED_KEY) === "true",
  );

  // Convert SideNavItem to NavItem for BottomNav
  const bottomNavItems: NavItem[] = navItems.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
  }));

  // When collapsed the nav disappears completely (height 0); only the toggle pill (~28px) remains.
  // When expanded, nav is ~60px + safe area. Add comfortable buffer.
  const mobilePb = navCollapsed ? "pb-[40px]" : "pb-[88px]";

  return (
    <div className="min-h-screen bg-background flex" data-ocid="layout.root">
      {/* Desktop sidebar — completely isolated from mobile via hidden lg:flex */}
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        userRole={userRole}
        onLogout={logout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-40 h-14 bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-4 gap-3"
          data-ocid="mobile.header"
        >
          <MobileLogoBar userRole={userRole} />
        </header>

        {/* Desktop page header */}
        {(pageTitle || pageSubtitle) && (
          <div className="hidden lg:block px-8 pt-7 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={pageTitle}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {pageTitle && (
                  <h1 className="text-2xl font-bold font-display text-foreground">
                    {pageTitle}
                  </h1>
                )}
                {pageSubtitle && (
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {pageSubtitle}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Scrollable content — padding-bottom adjusts to nav height on mobile */}
        <main
          className={`flex-1 overflow-y-auto lg:pb-8 px-4 lg:px-8 pt-4 lg:pt-4 transition-[padding] duration-200 ${mobilePb}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-w-2xl mx-auto lg:mx-0 lg:max-w-4xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav — lg:hidden ensures zero desktop impact */}
      <BottomNav
        items={bottomNavItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onCollapsedChange={setNavCollapsed}
      />
    </div>
  );
}

function MobileLogoBar({ userRole }: { userRole: "user" | "admin" }) {
  const { logout } = useAppAuth();
  const { session } = useAppAuth();
  const logoSrc = useAppLogo();

  const displayName =
    session?.name || (userRole === "admin" ? "Admin" : "User");
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="flex items-center gap-2 flex-1">
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0 overflow-hidden">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="App logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-4 h-4 text-white" />
          )}
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

      {userRole === "admin" && (
        <span className="mr-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
          Admin
        </span>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={logout}
          data-ocid="mobile.header.logout"
          aria-label="Sign out"
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
        >
          <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>
        </button>
      </div>
    </>
  );
}

// Export nav item presets for use in dashboards
export const USER_NAV_ITEMS: SideNavItem[] = [
  { id: "home", label: "Dashboard", icon: <Home className="w-4.5 h-4.5" /> },
  {
    id: "study",
    label: "Study Timer",
    icon: <Timer className="w-4.5 h-4.5" />,
  },
  {
    id: "syllabus",
    label: "Syllabus",
    icon: <BookMarked className="w-4.5 h-4.5" />,
  },
  {
    id: "notes",
    label: "Notes / PDF",
    icon: <FileText className="w-4.5 h-4.5" />,
  },
  {
    id: "gym",
    label: "Gym Tracker",
    icon: <Dumbbell className="w-4.5 h-4.5" />,
  },
  { id: "profile", label: "Profile", icon: <User className="w-4.5 h-4.5" /> },
];

export const ADMIN_NAV_ITEMS: SideNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-4.5 h-4.5" />,
  },
  { id: "users", label: "Users", icon: <Users className="w-4.5 h-4.5" /> },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4.5 h-4.5" />,
  },
];
