import { Badge } from "@/components/ui/badge";
import { BookOpen, Bot, Lightbulb, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
        data-ocid="ai.section"
      >
        <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6">
          <Bot className="w-10 h-10 text-purple-600" />
        </div>
        <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100">
          Coming in Phase 3
        </Badge>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          AI Assistant
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Your intelligent business guide. Get smart suggestions, auto-generate
          documents, track productivity patterns, and receive contextual tips
          tailored to Indian small businesses.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          {[
            { icon: Lightbulb, label: "Smart Tips", desc: "Business insights" },
            { icon: BookOpen, label: "Templates", desc: "Ready-made docs" },
            { icon: Zap, label: "Auto-draft", desc: "AI-powered text" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="rounded-xl p-3 bg-muted/50 border border-border"
              >
                <Icon className="w-4 h-4 text-purple-600 mb-1.5" />
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
