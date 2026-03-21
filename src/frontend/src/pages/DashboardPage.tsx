import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckSquare,
  FileText,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";

type PageKey = "dashboard" | "messenger" | "activities" | "business" | "ai";

const MODULE_CARDS = [
  {
    key: "messenger" as PageKey,
    icon: MessageSquare,
    title: "Messenger",
    description:
      "Team messaging with groups and subgroups. Keep your team aligned and communicate efficiently.",
    badge: "Phase 2",
    badgeVariant: "secondary" as const,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "activities" as PageKey,
    icon: CheckSquare,
    title: "5W Activities",
    description:
      "Structured activity tracking using What, Who, When, Where, Why framework for clear accountability.",
    badge: "Phase 2",
    badgeVariant: "secondary" as const,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "business" as PageKey,
    icon: Briefcase,
    title: "Business Suite",
    description:
      "GST-compliant invoices, estimates, and business proposals. Built for Indian businesses.",
    badge: "Phase 3",
    badgeVariant: "secondary" as const,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "ai" as PageKey,
    icon: Bot,
    title: "AI Assistant",
    description:
      "Smart productivity guidance, business templates, and contextual suggestions powered by AI.",
    badge: "Phase 3",
    badgeVariant: "secondary" as const,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const STATS = [
  { icon: Users, label: "Team Members", value: "—", hint: "Coming soon" },
  { icon: CheckSquare, label: "Activities", value: "—", hint: "Coming soon" },
  { icon: FileText, label: "Invoices", value: "—", hint: "Coming soon" },
  { icon: TrendingUp, label: "This Month", value: "—", hint: "Coming soon" },
];

export default function DashboardPage({
  onNavigate,
}: {
  onNavigate: (key: PageKey) => void;
}) {
  const { profile } = useAuth();
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
        data-ocid="dashboard.section"
      >
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {greeting()},
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          {profile?.displayName || profile?.username || "Welcome"}{" "}
          <span className="text-primary">👋</span>
        </h1>
        {profile?.businessName && (
          <p className="text-muted-foreground mt-1">{profile.businessName}</p>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="shadow-card border-border"
              data-ocid={`dashboard.stat.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.hint}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Modules heading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-4"
      >
        <h2 className="font-display text-xl font-semibold text-foreground">
          Platform Modules
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your complete toolkit for business productivity
        </p>
      </motion.div>

      {/* Module cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {MODULE_CARDS.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (i + 3) }}
              data-ocid={`dashboard.module.item.${i + 1}`}
            >
              <Card className="shadow-card border-border hover:shadow-md transition-shadow duration-200 h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${mod.color}`} />
                    </div>
                    <Badge variant={mod.badgeVariant} className="text-xs">
                      {mod.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {mod.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-fit -ml-2 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                    onClick={() => onNavigate(mod.key)}
                    data-ocid={`dashboard.module.${mod.key}.button`}
                  >
                    Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
