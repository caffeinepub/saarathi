import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Receipt, Send } from "lucide-react";
import { motion } from "motion/react";

export default function BusinessSuitePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
        data-ocid="business.section"
      >
        <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-amber-600" />
        </div>
        <Badge className="mb-4 bg-amber-100 text-amber-700 hover:bg-amber-100">
          Coming in Phase 3
        </Badge>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          Business Suite
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Full GST-compliant document management for Indian businesses. Create
          professional invoices, estimates, and proposals in minutes.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          {[
            { icon: Receipt, label: "GST Invoices", desc: "Tax compliant" },
            { icon: FileText, label: "Estimates", desc: "Quick quotes" },
            { icon: Send, label: "Proposals", desc: "Win clients" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="rounded-xl p-3 bg-muted/50 border border-border"
              >
                <Icon className="w-4 h-4 text-amber-600 mb-1.5" />
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
