import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Bot,
  Briefcase,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import AIChatPanel from "../components/AIChatPanel";
import { useAuth } from "../context/AuthContext";
import AIAssistantPage from "../pages/AIAssistantPage";
import ActivitiesPage from "../pages/ActivitiesPage";
import BusinessSuitePage from "../pages/BusinessSuitePage";
import DashboardPage from "../pages/DashboardPage";
import MessengerPage from "../pages/MessengerPage";
import SettingsPage from "../pages/SettingsPage";

type PageKey =
  | "dashboard"
  | "messenger"
  | "activities"
  | "business"
  | "ai"
  | "settings";

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
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    color: "text-white/50",
  },
];

interface Notification {
  id: string;
  title: string;
  sender: string;
  date: string;
  read: boolean;
  type: "task_request";
}

function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem("saarathi_notifications");
        if (raw) setNotifications(JSON.parse(raw));
      } catch {}
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  function markAllRead() {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("saarathi_notifications", JSON.stringify(updated));
  }

  function dismiss(id: string, accepted: boolean) {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true, accepted } : n,
    );
    setNotifications(updated);
    localStorage.setItem("saarathi_notifications", JSON.stringify(updated));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount, markAllRead, dismiss };
}

function NotificationPanel({
  notifications,
  onMarkAllRead,
  onDismiss,
  onClose,
}: {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDismiss: (id: string, accepted: boolean) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-amber-100 z-50 overflow-hidden"
      data-ocid="notifications.popover"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-500">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-white" />
          <span className="font-semibold text-white text-sm">
            Task Requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-amber-100 hover:text-white text-xs font-medium"
            onClick={onMarkAllRead}
            data-ocid="notifications.button"
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-100 hover:text-white"
            data-ocid="notifications.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="max-h-72">
        {notifications.length === 0 ? (
          <div
            className="py-10 text-center"
            data-ocid="notifications.empty_state"
          >
            <p className="text-sm text-muted-foreground">No task requests</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 transition-colors ${
                  n.read ? "bg-white" : "bg-amber-50/60"
                }`}
                data-ocid="notifications.item.1"
              >
                <div className="flex items-start gap-2 mb-2">
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-stone-800 leading-tight">
                      {n.title}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      From {n.sender} · {n.date}
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => onDismiss(n.id, true)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                      data-ocid="notifications.confirm_button"
                    >
                      <CheckCircle className="w-3 h-3" /> Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismiss(n.id, false)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                      data-ocid="notifications.delete_button"
                    >
                      <XCircle className="w-3 h-3" /> Deny
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}

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
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { notifications, unreadCount, markAllRead, dismiss } =
    useNotifications();

  // Seed initial notifications on first load
  useEffect(() => {
    const existing = localStorage.getItem("saarathi_notifications");
    if (!existing) {
      const seed: Notification[] = [
        {
          id: "notif_1",
          title: "GST Filing Review — Please review Q3 GST returns",
          sender: "Ravi Kumar",
          date: "Today",
          read: false,
          type: "task_request",
        },
        {
          id: "notif_2",
          title:
            "Client Presentation — Prepare slides for Patel Industries demo",
          sender: "Priya Sharma",
          date: "Yesterday",
          read: false,
          type: "task_request",
        },
      ];
      localStorage.setItem("saarathi_notifications", JSON.stringify(seed));
    }
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const PAGE_COMPONENTS: Record<PageKey, React.ReactElement> = {
    dashboard: <DashboardPage onNavigate={setActivePage} />,
    messenger: <MessengerPage />,
    activities: <ActivitiesPage />,
    business: <BusinessSuitePage />,
    ai: <AIAssistantPage />,
    settings: <SettingsPage />,
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

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                if (!showNotifications) markAllRead();
              }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors text-muted-foreground hover:text-amber-600"
              data-ocid="notifications.open_modal_button"
              title="Task notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkAllRead={markAllRead}
                  onDismiss={dismiss}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </AnimatePresence>
          </div>
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
      <AIChatPanel />
    </div>
  );
}
