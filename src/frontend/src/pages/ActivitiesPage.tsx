import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, MapPin, Target } from "lucide-react";
import { motion } from "motion/react";

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
        data-ocid="activities.section"
      >
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckSquare className="w-10 h-10 text-emerald-600" />
        </div>
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Coming in Phase 2
        </Badge>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          5W Activities
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Structured activity tracking using the proven 5W framework — What,
          Who, When, Where, Why. Create clear, accountable tasks for your team.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          {[
            { icon: Target, label: "What & Why", desc: "Goal clarity" },
            { icon: Clock, label: "When & Who", desc: "Time & ownership" },
            { icon: MapPin, label: "Where", desc: "Location tracking" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="rounded-xl p-3 bg-muted/50 border border-border"
              >
                <Icon className="w-4 h-4 text-emerald-600 mb-1.5" />
                <div className="text-xs font-semibold text-foreground">
                  {f.label}
                </div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
