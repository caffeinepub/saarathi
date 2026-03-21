import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Briefcase,
  CheckSquare,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AIAssistantPage from "../pages/AIAssistantPage";
import ActivitiesPage from "../pages/ActivitiesPage";
import BusinessSuitePage from "../pages/BusinessSuitePage";
import DashboardPage from "../pages/DashboardPage";
import MessengerPage from "../pages/MessengerPage";

type PageKey = "dashboard" | "messenger" | "activities" | "business" | "ai";

const NAV_ITEMS: Array<{
  key: PageKey;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-amber-400",
  },
  {
    key: "messenger",
    label: "Messenger",
    icon: MessageSquare,
    color: "text-blue-400",
  },
  {
    key: "activities",
    label: "5W Activities",
    icon: CheckSquare,
    color: "text-emerald-400",
  },
  {
    key: "business",
    label: "Business Suite",
    icon: Briefcase,
    color: "text-amber-400",
  },
  { key: "ai", label: "AI Assistant", icon: Bot, color: "text-purple-400" },
];

function Sidebar({
  active,
  onNav,
  onLogout,
  mobile,
  onClose,
}: {
  active: PageKey;
  onNav: (key: PageKey) => void;
  onLogout: () => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const { profile } = useAuth();
  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "#2a2a2a", color: "#f5f0e8" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: "#3a3a3a" }}
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold tracking-wide text-amber-400">
          SAARATHI
        </span>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto opacity-60 hover:opacity-100"
            style={{ color: "#f5f0e8" }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => {
                onNav(item.key);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : "hover:bg-white/10"
              }`}
              style={isActive ? {} : { color: "#c8c0b0" }}
              data-ocid={`nav.${item.key}.link`}
            >
              <Icon
                className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-white" : item.color}`}
              />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="h-px mx-3" style={{ backgroundColor: "#3a3a3a" }} />

      {/* User footer */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-amber-500 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "#f5f0e8" }}
            >
              {profile?.displayName || profile?.username || "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "#7a7060" }}>
              {profile?.businessName || ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="w-7 h-7 hover:bg-white/10"
            style={{ color: "#7a7060" }}
            data-ocid="nav.logout.button"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  const PAGE_COMPONENTS: Record<PageKey, React.ReactElement> = {
    dashboard: <DashboardPage onNavigate={setActivePage} />,
    messenger: <MessengerPage />,
    activities: <ActivitiesPage />,
    business: <BusinessSuitePage />,
    ai: <AIAssistantPage />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0">
        <Sidebar active={activePage} onNav={setActivePage} onLogout={logout} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-60 md:hidden"
            >
              <Sidebar
                active={activePage}
                onNav={setActivePage}
                onLogout={logout}
                mobile
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-border bg-card flex-shrink-0">
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
            data-ocid="nav.menu.button"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            {NAV_ITEMS.find((n) => n.key === activePage)?.label}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {PAGE_COMPONENTS[activePage]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
