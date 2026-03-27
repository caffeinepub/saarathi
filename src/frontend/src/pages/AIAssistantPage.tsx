import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  CheckCircle,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Search,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ParsedIntent =
  | {
      type: "CREATE_TASK";
      who: string[];
      what: string;
      when: string;
      where: string;
      why: string;
    }
  | {
      type: "SEND_DOCUMENT";
      docType: string;
      clientName: string;
      recipient: string;
    }
  | { type: "UNKNOWN" };

interface DisambiguationOptions {
  field: "who" | "document";
  query: string;
  options: Array<{ id: string; label: string; sub?: string }>;
  onSelect: (id: string, label: string) => void;
}

interface ActionHistoryItem {
  id: string;
  command: string;
  result: string;
  status: "success" | "error";
  timestamp: number;
}

// ─── Mock / Store Contacts ─────────────────────────────────────────────────
const MOCK_CONTACTS = [
  { id: "priya.sharma", label: "Priya Sharma", sub: "Sales Team" },
  { id: "priya.mehta", label: "Priya Mehta", sub: "Accounts" },
  { id: "ravi.kumar", label: "Ravi Kumar", sub: "Operations" },
  { id: "rajesh.mehta", label: "Mehta Industries (Rajesh)", sub: "Client" },
  { id: "amit.patel", label: "Patel Industries (Amit)", sub: "Client" },
  { id: "sanjay.gupta", label: "Sanjay Gupta", sub: "Management" },
];

function getContacts() {
  try {
    const raw = localStorage.getItem("saarathi_contacts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return MOCK_CONTACTS;
}

function getDocuments() {
  try {
    const raw =
      localStorage.getItem("saarathi_business_docs") ||
      localStorage.getItem("saarathi_invoices");
    if (raw)
      return JSON.parse(raw) as Array<{
        id: string;
        type: string;
        number: string;
        clientId: string;
      }>;
  } catch {}
  return [];
}

function getClients() {
  try {
    const raw = localStorage.getItem("saarathi_clients");
    if (raw) return JSON.parse(raw) as Array<{ id: string; name: string }>;
  } catch {}
  return [
    { id: "c1", name: "Mehta Exports Pvt Ltd" },
    { id: "c2", name: "Sharma Trading Co" },
    { id: "c3", name: "Kumar Industries" },
    { id: "c4", name: "Patel Enterprises" },
  ];
}

// ─── NLP Parser ──────────────────────────────────────────────────────────────
function parseRelativeDate(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  if (lower.includes("today")) {
    return now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const d = new Date(now);
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }
  const dateMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  );
  if (dateMatch) return `${dateMatch[1]} ${dateMatch[2]}`;
  return "Not specified";
}

function parseCommand(input: string): ParsedIntent {
  const lower = input.toLowerCase();

  // SEND_DOCUMENT detection
  const sendDocPatterns = [
    /send\s+(.+?)\s+invoice/i,
    /send\s+(invoice|proposal|estimate)/i,
    /(invoice|proposal|estimate).*\bto\b.*\b(\w+)/i,
  ];
  const isSendDoc =
    sendDocPatterns.some((p) => p.test(lower)) ||
    (lower.includes("send") &&
      (lower.includes("invoice") ||
        lower.includes("proposal") ||
        lower.includes("estimate")));

  if (isSendDoc) {
    let docType = "invoice";
    if (lower.includes("proposal")) docType = "proposal";
    if (lower.includes("estimate")) docType = "estimate";

    // Extract client name — pattern: "X invoice" or "invoice for X" or "invoice to X"
    let clientName = "";
    const clientMatch =
      input.match(
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:invoice|proposal|estimate)/i,
      ) ||
      input.match(
        /(?:invoice|proposal|estimate)\s+(?:for|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      );
    if (clientMatch) clientName = clientMatch[1];

    // Extract recipient — after "to"
    let recipient = "";
    const toMatch = input.match(/\bto\b\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (toMatch) recipient = toMatch[1];

    return { type: "SEND_DOCUMENT", docType, clientName, recipient };
  }

  // CREATE_TASK detection
  const isTask =
    lower.includes("ask") ||
    lower.includes("tell") ||
    lower.includes("remind") ||
    lower.includes("meeting") ||
    lower.includes("task") ||
    lower.includes("schedule") ||
    lower.includes("create") ||
    lower.includes("assign");

  if (isTask) {
    // WHO — extract name after "ask", "tell", "remind"
    let who: string[] = [];
    const whoMatch = input.match(
      /(?:ask|tell|remind|assign|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    );
    if (whoMatch) who = [whoMatch[1]];

    // WHAT — after "to" or before company name
    let what = "";
    const whatMatch = input.match(
      /\bto\b\s+(.+?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next|by|at|on)|$)/i,
    );
    if (whatMatch) what = whatMatch[1].trim();
    else
      what = input
        .replace(/^(ask|tell|remind|create|schedule)\s+\w+\s+(to\s+)?/i, "")
        .trim();

    // WHEN — dates
    const when = parseRelativeDate(input);

    // WHERE — after "at" (if location-like)
    let where = "";
    const whereMatch = input.match(
      /\bat\s+([A-Z][\w\s]+?)(?:\s+(?:tomorrow|today|on|by)|$)/i,
    );
    if (whereMatch && !whereMatch[1].match(/\d{1,2}(am|pm)/i))
      where = whereMatch[1];

    // WHY — "for" clause
    let why = "";
    const whyMatch = input.match(
      /\bfor\s+(.+?)(?:\s+(?:tomorrow|today|by)|$)/i,
    );
    if (whyMatch) why = whyMatch[1];

    return { type: "CREATE_TASK", who, what, when, where, why };
  }

  return { type: "UNKNOWN" };
}

// ─── Parsed Card ─────────────────────────────────────────────────────────────
function ParsedCard({
  parsed,
  onConfirm,
  onCancel,
}: {
  parsed: ParsedIntent;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (parsed.type === "CREATE_TASK") {
    const fields = [
      {
        label: "WHO",
        value: parsed.who.join(", ") || "Not specified",
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: "WHAT",
        value: parsed.what || "Not specified",
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "WHEN",
        value: parsed.when || "Not specified",
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "WHERE",
        value: parsed.where || "Not specified",
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "WHY",
        value: parsed.why || "Not specified",
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-amber-200 overflow-hidden shadow-md bg-white"
        data-ocid="ai.dialog"
      >
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3 flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">
            New 5W Task — Confirm
          </span>
        </div>
        <div className="p-4 space-y-2">
          {fields.map((f) => (
            <div
              key={f.label}
              className={`flex gap-3 items-start p-2 rounded-lg ${f.bg}`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-widest min-w-[44px] pt-0.5 ${f.color}`}
              >
                {f.label}
              </span>
              <span className="text-sm text-stone-700 flex-1">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 border-stone-300"
            data-ocid="ai.cancel_button"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            data-ocid="ai.confirm_button"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Create Task
          </Button>
        </div>
      </motion.div>
    );
  }

  if (parsed.type === "SEND_DOCUMENT") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-blue-200 overflow-hidden shadow-md bg-white"
        data-ocid="ai.dialog"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm capitalize">
            Send {parsed.docType} — Confirm
          </span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex gap-3 items-start p-2 rounded-lg bg-blue-50">
            <span className="text-[10px] font-bold uppercase tracking-widest min-w-[60px] pt-0.5 text-blue-600">
              DOC TYPE
            </span>
            <span className="text-sm text-stone-700 capitalize">
              {parsed.docType}
            </span>
          </div>
          <div className="flex gap-3 items-start p-2 rounded-lg bg-amber-50">
            <span className="text-[10px] font-bold uppercase tracking-widest min-w-[60px] pt-0.5 text-amber-600">
              CLIENT
            </span>
            <span className="text-sm text-stone-700">
              {parsed.clientName || "Not detected"}
            </span>
          </div>
          <div className="flex gap-3 items-start p-2 rounded-lg bg-green-50">
            <span className="text-[10px] font-bold uppercase tracking-widest min-w-[60px] pt-0.5 text-green-600">
              SEND TO
            </span>
            <span className="text-sm text-stone-700">
              {parsed.recipient || "Not specified"}
            </span>
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 border-stone-300"
            data-ocid="ai.cancel_button"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            data-ocid="ai.confirm_button"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Send Document
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ─── Disambiguation UI ────────────────────────────────────────────────────────
function DisambiguationPanel({
  disambig,
  onDismiss,
}: {
  disambig: DisambiguationOptions;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border-2 border-purple-200 overflow-hidden shadow-md bg-white"
      data-ocid="ai.dialog"
    >
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-white" />
        <span className="text-white font-semibold text-sm">
          Multiple matches for "{disambig.query}" — please select
        </span>
      </div>
      <div className="p-3 space-y-2">
        {disambig.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => disambig.onSelect(opt.id, opt.label)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
            data-ocid="ai.button"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-stone-800">
                {opt.label}
              </div>
              {opt.sub && (
                <div className="text-xs text-stone-500">{opt.sub}</div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        ))}
      </div>
      <div className="px-3 pb-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-stone-300 text-stone-600"
          onClick={onDismiss}
          data-ocid="ai.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Action History Item ──────────────────────────────────────────────────────
function HistoryItem({ item }: { item: ActionHistoryItem }) {
  const timeStr = new Date(item.timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 bg-white">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          item.status === "success" ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {item.status === "success" ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-stone-700 truncate">
          {item.command}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.result}</p>
      </div>
      <span className="text-[10px] text-stone-400 flex-shrink-0">
        {timeStr}
      </span>
    </div>
  );
}

// ─── Example Commands Panel ───────────────────────────────────────────────────
const EXAMPLE_COMMANDS = [
  {
    icon: "🗓️",
    text: "Ask Priya to confirm meeting with Patel Industries tomorrow",
  },
  {
    icon: "📋",
    text: "Remind Ravi to send the GST filing documents by Friday",
  },
  { icon: "📤", text: "Send Mehta Industries invoice to Ravi in messenger" },
  {
    icon: "🤝",
    text: "Schedule client presentation with Sanjay at Head Office next Monday",
  },
  { icon: "📄", text: "Send proposal for Kumar Industries to Rajesh" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const [intentHint, setIntentHint] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedIntent | null>(null);
  const [disambig, setDisambig] = useState<DisambiguationOptions | null>(null);
  const [history, setHistory] = useState<ActionHistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // On mount, load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("saarathi_ai_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  function saveHistory(items: ActionHistoryItem[]) {
    setHistory(items);
    localStorage.setItem("saarathi_ai_history", JSON.stringify(items));
  }

  function addHistory(
    command: string,
    result: string,
    status: "success" | "error",
  ) {
    const item: ActionHistoryItem = {
      id: `h${Date.now()}`,
      command,
      result,
      status,
      timestamp: Date.now(),
    };
    saveHistory([item, ...history].slice(0, 10));
  }

  function handleProcess() {
    const cmd = input.trim();
    if (!cmd) return;

    setIsProcessing(true);
    setTimeout(() => {
      const result = parseCommand(cmd);

      if (result.type === "CREATE_TASK") {
        // Check for disambiguation on WHO
        const contacts = getContacts();
        const whoQuery = result.who[0] ?? "";
        if (whoQuery) {
          const matches = contacts.filter((c) =>
            c.label.toLowerCase().includes(whoQuery.toLowerCase()),
          );
          if (matches.length > 1) {
            setIsProcessing(false);
            setDisambig({
              field: "who",
              query: whoQuery,
              options: matches,
              onSelect: (_, label) => {
                const updated: ParsedIntent = { ...result, who: [label] };
                setDisambig(null);
                setParsed(updated);
              },
            });
            return;
          }
          if (matches.length === 1) {
            result.who = [matches[0].label];
          }
        }
      }

      if (result.type === "SEND_DOCUMENT") {
        // Disambiguate document
        const docs = getDocuments();
        const clients = getClients();
        const clientQuery = result.clientName?.toLowerCase() ?? "";

        const matchingClients = clients.filter((c) =>
          c.name.toLowerCase().includes(clientQuery),
        );
        const matchingDocs = docs.filter((d) => {
          const c = clients.find((cl) => cl.id === d.clientId);
          return c?.name.toLowerCase().includes(clientQuery);
        });

        if (matchingDocs.length > 1) {
          setIsProcessing(false);
          setDisambig({
            field: "document",
            query: result.clientName,
            options: matchingDocs.map((d) => {
              const c = clients.find((cl) => cl.id === d.clientId);
              return {
                id: d.id,
                label: `${d.type.toUpperCase()} ${d.number}`,
                sub: c?.name ?? "",
              };
            }),
            onSelect: (id) => {
              const selectedDoc = matchingDocs.find((d) => d.id === id);
              if (selectedDoc) {
                const c = clients.find((cl) => cl.id === selectedDoc.clientId);
                const updated: ParsedIntent = {
                  ...result,
                  clientName: c?.name ?? result.clientName,
                };
                setDisambig(null);
                setParsed(updated);
              }
            },
          });
          return;
        }

        // Disambiguate recipient
        const contacts = getContacts();
        const recipQuery = result.recipient?.toLowerCase() ?? "";
        if (recipQuery) {
          const recipMatches = contacts.filter((c) =>
            c.label.toLowerCase().includes(recipQuery),
          );
          if (recipMatches.length > 1) {
            setIsProcessing(false);
            setDisambig({
              field: "who",
              query: result.recipient,
              options: recipMatches,
              onSelect: (_, label) => {
                const updated: ParsedIntent = { ...result, recipient: label };
                setDisambig(null);
                setParsed(updated);
              },
            });
            return;
          }
          if (recipMatches.length === 1) {
            result.recipient = recipMatches[0].label;
          }
        }

        if (matchingClients.length === 1) {
          result.clientName = matchingClients[0].name;
        }
      }

      setIsProcessing(false);

      if (result.type === "UNKNOWN") {
        addHistory(
          cmd,
          "⚠ Partial AI response — couldn't fully understand your request. Try rephrasing.",
          "error",
        );
        setParsed({ type: "UNKNOWN" });
        setIsProcessing(false);
        return;
      }

      setParsed(result);
    }, 800);
  }

  function handleConfirm() {
    if (!parsed) return;

    if (parsed.type === "CREATE_TASK") {
      // Save to saarathi_activities
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 3);

      const newActivity = {
        id: `ai_${Date.now()}`,
        title: parsed.what || "New Task",
        taskType: "meeting",
        assignees: parsed.who.filter(Boolean),
        groupId: "",
        dateTime: tomorrow.toISOString().slice(0, 16),
        deadline: deadlineDate.toISOString().slice(0, 10),
        location: parsed.where || "",
        notes: parsed.why || "",
        status: "pending",
        createdBy: "AI Assistant",
        createdAt: Date.now(),
        messengerSent: false,
      };

      try {
        const existing = JSON.parse(
          localStorage.getItem("saarathi_activities") || "[]",
        );
        localStorage.setItem(
          "saarathi_activities",
          JSON.stringify([newActivity, ...existing]),
        );
      } catch {}

      addHistory(
        input,
        `Task created: "${parsed.what}" assigned to ${parsed.who.join(", ") || "unassigned"}`,
        "success",
      );
      toast.success("Task created in 5W Activity Builder!");
    }

    if (parsed.type === "SEND_DOCUMENT") {
      // Add to saarathi_messages as a mock send action
      const msg = {
        id: `ai_msg_${Date.now()}`,
        senderId: "me",
        senderName: "You (AI)",
        content: `${parsed.docType.toUpperCase()} sent to ${parsed.recipient}`,
        msgType: "text",
        timestamp: Date.now(),
      };

      try {
        const existing = JSON.parse(
          localStorage.getItem("saarathi_messages") || "{}",
        );
        const key = `dm_${parsed.recipient.toLowerCase().replace(/\s+/g, "_")}`;
        const conv = existing[key] || [];
        existing[key] = [...conv, msg];
        localStorage.setItem("saarathi_messages", JSON.stringify(existing));
      } catch {}

      addHistory(
        input,
        `${parsed.docType} for ${parsed.clientName} sent to ${parsed.recipient} in Messenger`,
        "success",
      );
      toast.success(
        `${parsed.docType} sent to ${parsed.recipient} in Messenger!`,
      );
    }

    setParsed(null);
    setInput("");
  }

  function handleCancel() {
    setParsed(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleProcess();
  }

  function handleExampleClick(text: string) {
    setInput(text);
    setParsed(null);
    setDisambig(null);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-400 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                AI Deep Dive
              </h1>
              <p className="text-amber-100 text-sm">
                Use chat for daily actions. Use this for advanced queries.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input */}
          <div
            className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4"
            data-ocid="ai.section"
          >
            <label
              htmlFor="ai-command-input"
              className="block text-sm font-semibold text-stone-700 mb-2"
            >
              What would you like to do?
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="ai-command-input"
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const v = e.target.value.toLowerCase();
                  if (v.includes("meet") || v.includes("meeting"))
                    setIntentHint("💡 Detected: Meeting — Create a task?");
                  else if (
                    v.includes("pay") ||
                    v.includes("invoice") ||
                    v.includes("amount")
                  )
                    setIntentHint("💡 Detected: Payment — Create an invoice?");
                  else if (v.includes("follow up") || v.includes("remind"))
                    setIntentHint("💡 Detected: Follow-up — Set a reminder?");
                  else setIntentHint(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Ask Priya to confirm meeting with Patel Industries tomorrow..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/30 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                data-ocid="ai.input"
                disabled={isProcessing}
              />
              <Button
                onClick={handleProcess}
                disabled={isProcessing || !input.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-xl"
                data-ocid="ai.submit_button"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {intentHint && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
                {intentHint}
              </div>
            )}
            {!input && !isProcessing && (
              <p className="text-xs text-muted-foreground mt-2">
                Try:{" "}
                <button
                  type="button"
                  className="text-amber-600 cursor-pointer hover:underline"
                  onClick={() => handleExampleClick(EXAMPLE_COMMANDS[0].text)}
                >
                  Ask Priya to confirm meeting tomorrow
                </button>
              </p>
            )}
          </div>

          {/* Disambiguation */}
          <AnimatePresence>
            {disambig && (
              <DisambiguationPanel
                disambig={disambig}
                onDismiss={() => setDisambig(null)}
              />
            )}
          </AnimatePresence>

          {/* Parsed Card */}
          <AnimatePresence>
            {parsed && parsed.type === "UNKNOWN" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3"
                data-ocid="ai.error_state"
              >
                <span className="text-amber-600 text-lg leading-none mt-0.5">
                  ⚠
                </span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">
                    Partial AI response
                  </p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Couldn't fully understand your request. Try rephrasing or
                    use an example below.
                  </p>
                  <button
                    type="button"
                    className="text-xs text-amber-600 hover:underline mt-1.5"
                    onClick={() => setParsed(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
            {parsed && parsed.type !== "UNKNOWN" && (
              <>
                <ParsedCard
                  parsed={parsed}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
                {/* Quick action buttons after AI response */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 pt-1"
                  data-ocid="ai.success_state"
                >
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium transition-colors border border-amber-200"
                    data-ocid="ai.primary_button"
                  >
                    📌 Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParsed(null);
                      setInput("");
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors border border-blue-200"
                    data-ocid="ai.secondary_button"
                  >
                    💬 Open Chat
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors border border-green-200"
                    data-ocid="ai.submit_button"
                  >
                    💰 Create Invoice
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Action History */}
          {history.length > 0 && (
            <div
              className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4"
              data-ocid="ai.panel"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-stone-700">
                  Recent Actions
                </h3>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  onClick={() => saveHistory([])}
                  data-ocid="ai.delete_button"
                >
                  Clear
                </button>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {history.slice(0, 5).map((item) => (
                    <HistoryItem key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty state */}
          {history.length === 0 && !parsed && !disambig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
              data-ocid="ai.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Type a command above to get started.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI will parse it and ask for confirmation before executing.
              </p>
            </motion.div>
          )}
        </div>

        {/* Example Commands Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                Examples
              </Badge>
            </div>
            <div className="space-y-2">
              {EXAMPLE_COMMANDS.map((ex) => (
                <button
                  key={ex.text.slice(0, 20)}
                  type="button"
                  onClick={() => handleExampleClick(ex.text)}
                  className="w-full text-left p-3 rounded-xl border border-stone-100 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
                  data-ocid="ai.button"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0">{ex.icon}</span>
                    <span className="text-xs text-stone-600 group-hover:text-stone-800 leading-relaxed">
                      {ex.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <h4 className="font-semibold text-sm text-amber-800 mb-2">
              How it works
            </h4>
            <ol className="space-y-1.5 text-xs text-amber-700">
              <li className="flex gap-2">
                <span className="font-bold">1.</span> Type a natural language
                command
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span> AI parses the intent &amp;
                extracts fields
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span> If ambiguous, select from
                options
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span> Review parsed card &amp;
                confirm
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span> Task or document action is
                executed
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
