import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const NAV_COLLAPSED_KEY = "preptracker_botnav_collapsed";

export default function BottomNav({
  items,
  activeTab,
  onTabChange,
  onCollapsedChange,
}: BottomNavProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(NAV_COLLAPSED_KEY, String(next));
    onCollapsedChange?.(next);
  };

  return (
    /* Outer wrapper: fixed bottom, mobile only */
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      data-ocid="bottom-nav.root"
    >
      {/* Fold/unfold toggle pill — always visible, floats above nav */}
      <div className="flex justify-center pointer-events-none">
        <motion.button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          data-ocid="bottom-nav.toggle"
          className="pointer-events-auto mb-1 flex items-center gap-1 px-3 py-1 rounded-full bg-card/95 border border-border shadow-md text-muted-foreground hover:text-foreground transition-colors duration-200"
          style={{ boxShadow: "0 -2px 12px -2px oklch(0.18 0.08 264 / 0.14)" }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <span className="text-[10px] font-semibold select-none">
            {collapsed ? "Nav" : "Hide"}
          </span>
          {collapsed ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </motion.button>
      </div>

      {/* The nav bar itself — height:0 + overflow:hidden = fully invisible when collapsed */}
      <motion.nav
        animate={{ height: collapsed ? 0 : "auto" }}
        initial={false}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="bg-card/98 backdrop-blur-md border-t border-border overflow-hidden"
        style={{
          boxShadow: collapsed
            ? "none"
            : "0 -4px 24px -4px oklch(0.18 0.08 264 / 0.12)",
        }}
        aria-label="Main navigation"
        aria-hidden={collapsed}
      >
        <div className="flex items-stretch" style={{ height: 60 }}>
          {items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.tab`}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-200 min-h-[44px]
                  ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-selected={isActive}
                aria-label={item.label}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "oklch(0.48 0.22 264)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon with scale animation */}
                <motion.span
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`transition-colors duration-200 ${isActive ? "text-primary" : ""}`}
                >
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </motion.span>

                {/* Label */}
                <span
                  className={`text-[10px] font-semibold leading-tight whitespace-nowrap
                    ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Safe-area spacer inside nav */}
        <div className="bg-card/98 h-[env(safe-area-inset-bottom,0px)]" />
      </motion.nav>
    </div>
  );
}
