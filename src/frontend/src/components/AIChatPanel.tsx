/**
 * AIChatPanel — embeddable AI chat panel for every module.
 * Shares the same NLP engine + disambiguation flow as the standalone AI Assistant.
 */
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  CheckCircle,
  ChevronRight,
  FileText,
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

// ─── Types ──────────────────────────────────────────────────────────────────
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

interface ChatMessage {
  id: string;
  role: "user" | "ai" | "info";
  text: string;
  parsed?: ParsedIntent;
  disambig?: DisambiguationOptions;
  timestamp: number;
}

// ─── Data helpers (same as AIAssistantPage) ──────────────────────────────────
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
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) return p;
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

// ─── NLP ──────────────────────────────────────────────────────────────────────
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
  if (lower.includes("today"))
    return now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
  return now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseCommand(input: string): ParsedIntent {
  const lower = input.toLowerCase();
  const isDoc =
    ["send", "invoice", "estimate", "proposal", "document", "quote"].some((k) =>
      lower.includes(k),
    ) &&
    !["task", "schedule", "meeting", "assign"].some((k) => lower.includes(k));

  if (isDoc) {
    let docType = "invoice";
    if (lower.includes("estimate") || lower.includes("quote"))
      docType = "estimate";
    else if (lower.includes("proposal")) docType = "proposal";
    let clientName = "";
    const clientMatch = input.match(
      /(?:for|of)\s+([A-Z][\w\s]+?)(?:\s+to|\s+invoice|$)/i,
    );
    if (clientMatch) clientName = clientMatch[1].trim();
    let recipient = "";
    const toMatch = input.match(/\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (toMatch) recipient = toMatch[1].trim();
    return { type: "SEND_DOCUMENT", docType, clientName, recipient };
  }

  const isTask = [
    "ask",
    "tell",
    "remind",
    "meeting",
    "task",
    "schedule",
    "create",
    "assign",
  ].some((k) => lower.includes(k));
  if (isTask) {
    let who: string[] = [];
    const whoMatch = input.match(
      /(?:ask|tell|remind|assign|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    );
    if (whoMatch) who = [whoMatch[1]];
    let what = "";
    const whatMatch = input.match(
      /\bto\b\s+(.+?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next|by|at|on)|$)/i,
    );
    if (whatMatch) what = whatMatch[1].trim();
    else
      what = input
        .replace(/^(ask|tell|remind|create|schedule)\s+\w+\s+(to\s+)?/i, "")
        .trim();
    const when = parseRelativeDate(input);
    let where = "";
    const whereMatch = input.match(
      /\bat\s+([A-Z][\w\s]+?)(?:\s+(?:tomorrow|today|on|by)|$)/i,
    );
    if (whereMatch && !whereMatch[1].match(/\d{1,2}(am|pm)/i))
      where = whereMatch[1];
    let why = "";
    const whyMatch = input.match(
      /\bfor\s+(.+?)(?:\s+(?:tomorrow|today|by)|$)/i,
    );
    if (whyMatch) why = whyMatch[1];
    return { type: "CREATE_TASK", who, what, when, where, why };
  }

  return { type: "UNKNOWN" };
}

function confirmTask(parsed: Extract<ParsedIntent, { type: "CREATE_TASK" }>) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 3);
  const newActivity = {
    id: `ai_${Date.now()}`,
    title: parsed.what || "New Task",
    taskType: "meeting",
    assignees: parsed.who.filter(Boolean),
    groupId: "",
    dateTime: tomorrow.toISOString().slice(0, 16),
    deadline: deadline.toISOString().slice(0, 10),
    location: parsed.where || "",
    notes: parsed.why || "",
    status: "pending",
    createdBy: "AI Panel",
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
  toast.success("Task created in 5W Activity Builder!");
}

function confirmDocument(
  parsed: Extract<ParsedIntent, { type: "SEND_DOCUMENT" }>,
) {
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
    existing[key] = [...(existing[key] || []), msg];
    localStorage.setItem("saarathi_messages", JSON.stringify(existing));
  } catch {}
  toast.success(`${parsed.docType} sent to ${parsed.recipient} in Messenger!`);
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function DisambiguationCard({
  disambig,
  onDismiss,
}: { disambig: DisambiguationOptions; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border-2 border-purple-200 overflow-hidden bg-white shadow-sm">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-2 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-white" />
        <span className="text-white font-semibold text-xs">
          Multiple matches for "{disambig.query}"
        </span>
      </div>
      <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
        {disambig.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => disambig.onSelect(opt.id, opt.label)}
            className="w-full flex items-center gap-2 p-2 rounded-lg border border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-stone-800 truncate">
                {opt.label}
              </div>
              {opt.sub && (
                <div className="text-[10px] text-stone-500">{opt.sub}</div>
              )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          </button>
        ))}
      </div>
      <div className="px-2 pb-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-stone-300"
          onClick={onDismiss}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ParsedConfirmCard({
  parsed,
  onConfirm,
  onCancel,
}: { parsed: ParsedIntent; onConfirm: () => void; onCancel: () => void }) {
  if (parsed.type === "CREATE_TASK") {
    const fields = [
      {
        label: "WHO",
        value: parsed.who.join(", ") || "—",
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: "WHAT",
        value: parsed.what || "—",
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "WHEN",
        value: parsed.when || "—",
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "WHERE",
        value: parsed.where || "—",
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "WHY",
        value: parsed.why || "—",
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
    ];
    return (
      <div className="rounded-xl border-2 border-amber-200 overflow-hidden bg-white shadow-sm">
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-2 flex items-center gap-2">
          <MessageSquarePlus className="w-3.5 h-3.5 text-white" />
          <span className="text-white font-semibold text-xs">
            New 5W Task — Confirm
          </span>
        </div>
        <div className="p-2 space-y-1.5">
          {fields.map((f) => (
            <div
              key={f.label}
              className={`flex gap-2 items-start p-1.5 rounded-lg ${f.bg}`}
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-widest min-w-[36px] pt-0.5 ${f.color}`}
              >
                {f.label}
              </span>
              <span className="text-xs text-stone-700 flex-1 leading-snug">
                {f.value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 px-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 text-xs border-stone-300"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Create Task
          </Button>
        </div>
      </div>
    );
  }
  if (parsed.type === "SEND_DOCUMENT") {
    return (
      <div className="rounded-xl border-2 border-blue-200 overflow-hidden bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-white" />
          <span className="text-white font-semibold text-xs capitalize">
            Send {parsed.docType} — Confirm
          </span>
        </div>
        <div className="p-2 space-y-1.5">
          {[
            {
              label: "DOC",
              value: parsed.docType,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "CLIENT",
              value: parsed.clientName || "Not detected",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "SEND TO",
              value: parsed.recipient || "Not specified",
              color: "text-green-600",
              bg: "bg-green-50",
            },
          ].map((f) => (
            <div
              key={f.label}
              className={`flex gap-2 items-start p-1.5 rounded-lg ${f.bg}`}
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-widest min-w-[40px] pt-0.5 ${f.color}`}
              >
                {f.label}
              </span>
              <span className="text-xs text-stone-700 flex-1">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 px-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 text-xs border-stone-300"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            Send
          </Button>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Main Panel ──────────────────────────────────────────────────────────────
export default function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: 'Hi! Type a command like "Ask Priya to confirm meeting tomorrow" or "Send Mehta invoice to Ravi".',
      timestamp: Date.now(),
    },
  ]);
  const [pendingParsed, setPendingParsed] = useState<ParsedIntent | null>(null);
  const [pendingDisambig, setPendingDisambig] =
    useState<DisambiguationOptions | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on any state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingParsed, pendingDisambig]);

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}${Math.random()}`,
        role,
        text,
        timestamp: Date.now(),
      },
    ]);
  }

  function handleProcess() {
    const cmd = input.trim();
    if (!cmd || isProcessing) return;
    setInput("");
    addMessage("user", cmd);
    setIsProcessing(true);

    setTimeout(() => {
      const result = parseCommand(cmd);
      if (result.type === "UNKNOWN") {
        setIsProcessing(false);
        addMessage(
          "ai",
          'I couldn\'t understand that command. Try: "Ask Priya to confirm meeting tomorrow" or "Send Mehta Industries invoice to Ravi".',
        );
        return;
      }

      if (result.type === "CREATE_TASK") {
        const contacts = getContacts();
        const whoQuery = result.who[0] ?? "";
        if (whoQuery) {
          const matches = contacts.filter((c) =>
            c.label.toLowerCase().includes(whoQuery.toLowerCase()),
          );
          if (matches.length > 1) {
            setIsProcessing(false);
            addMessage(
              "ai",
              `Found ${matches.length} contacts matching "${whoQuery}". Please select:`,
            );
            setPendingDisambig({
              field: "who",
              query: whoQuery,
              options: matches,
              onSelect: (_, label) => {
                const updated: ParsedIntent = { ...result, who: [label] };
                setPendingDisambig(null);
                addMessage("info", `Selected: ${label}`);
                setPendingParsed(updated);
              },
            });
            return;
          }
          if (matches.length === 1) result.who = [matches[0].label];
        }
      }

      if (result.type === "SEND_DOCUMENT") {
        const docs = getDocuments();
        const clients = getClients();
        const clientQuery = result.clientName?.toLowerCase() ?? "";
        const matchingDocs = docs.filter((d) => {
          const c = clients.find((cl) => cl.id === d.clientId);
          return c?.name.toLowerCase().includes(clientQuery);
        });
        if (matchingDocs.length > 1) {
          setIsProcessing(false);
          addMessage(
            "ai",
            `Found ${matchingDocs.length} documents for "${result.clientName}". Please select:`,
          );
          setPendingDisambig({
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
              const c = clients.find((cl) => cl.id === selectedDoc?.clientId);
              const updated: ParsedIntent = {
                ...result,
                clientName: c?.name ?? result.clientName,
              };
              setPendingDisambig(null);
              addMessage("info", `Selected: ${c?.name ?? "document"}`);
              setPendingParsed(updated);
            },
          });
          return;
        }
        const contacts = getContacts();
        const recipMatches = contacts.filter((c) =>
          c.label.toLowerCase().includes(result.recipient?.toLowerCase() ?? ""),
        );
        if (recipMatches.length > 1) {
          setIsProcessing(false);
          addMessage(
            "ai",
            `Found ${recipMatches.length} contacts matching "${result.recipient}". Please select:`,
          );
          setPendingDisambig({
            field: "who",
            query: result.recipient,
            options: recipMatches,
            onSelect: (_, label) => {
              const updated: ParsedIntent = { ...result, recipient: label };
              setPendingDisambig(null);
              addMessage("info", `Selected: ${label}`);
              setPendingParsed(updated);
            },
          });
          return;
        }
        if (recipMatches.length === 1) result.recipient = recipMatches[0].label;
        const matchingClients = clients.filter((c) =>
          c.name.toLowerCase().includes(clientQuery),
        );
        if (matchingClients.length === 1)
          result.clientName = matchingClients[0].name;
      }

      setIsProcessing(false);
      setPendingParsed(result);
      if (result.type === "CREATE_TASK")
        addMessage(
          "ai",
          "I've parsed your request as a 5W task. Please review and confirm:",
        );
      if (result.type === "SEND_DOCUMENT")
        addMessage(
          "ai",
          "I've parsed your request. Please review and confirm:",
        );
    }, 700);
  }

  function handleConfirm() {
    if (!pendingParsed) return;
    if (pendingParsed.type === "CREATE_TASK") {
      confirmTask(pendingParsed);
      addMessage(
        "ai",
        `Task "${pendingParsed.what}" created and added to 5W Activity Builder.`,
      );
    }
    if (pendingParsed.type === "SEND_DOCUMENT") {
      confirmDocument(pendingParsed);
      addMessage(
        "ai",
        `${pendingParsed.docType} for ${pendingParsed.clientName} sent to ${pendingParsed.recipient} in Messenger.`,
      );
    }
    setPendingParsed(null);
  }

  function handleCancel() {
    setPendingParsed(null);
    addMessage("ai", "Cancelled. What else can I help you with?");
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        title="AI Assistant"
        data-ocid="ai_panel.fab"
      >
        <Bot className="w-5 h-5 text-white" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-22 right-6 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden"
            style={{ maxHeight: "min(540px, calc(100vh - 120px))" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-400 px-4 py-3 flex items-center gap-2 flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm flex-1">
                AI Assistant
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 py-3">
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-amber-500 text-white rounded-br-sm"
                          : msg.role === "info"
                            ? "bg-stone-100 text-stone-600 italic"
                            : "bg-stone-100 text-stone-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0 ml-1.5 mt-0.5">
                        <span className="text-[9px] text-white font-bold">
                          YOU
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mr-1.5">
                      <Bot className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="bg-stone-100 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                      <span className="text-xs text-stone-500">
                        Processing...
                      </span>
                    </div>
                  </div>
                )}

                {/* Disambiguation */}
                <AnimatePresence>
                  {pendingDisambig && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <DisambiguationCard
                        disambig={pendingDisambig}
                        onDismiss={() => {
                          setPendingDisambig(null);
                          addMessage(
                            "ai",
                            "Cancelled. What else can I help you with?",
                          );
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm card */}
                <AnimatePresence>
                  {pendingParsed && pendingParsed.type !== "UNKNOWN" && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <ParsedConfirmCard
                        parsed={pendingParsed}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Result indicators */}
            <div className="px-3 flex-shrink-0">
              {messages.length > 1 &&
                messages[messages.length - 1].role === "ai" &&
                !pendingParsed &&
                !pendingDisambig &&
                !isProcessing && (
                  <div className="flex items-center gap-1 pb-1">
                    {messages[messages.length - 1].text.includes("created") ||
                    messages[messages.length - 1].text.includes("sent") ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-[10px] font-medium">Done</span>
                      </div>
                    ) : messages[messages.length - 1].text.includes(
                        "couldn't",
                      ) ? (
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3 h-3" />
                        <span className="text-[10px] font-medium">
                          Not understood
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-stone-100 p-3 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleProcess()}
                  placeholder="Type a command..."
                  disabled={
                    isProcessing || !!pendingParsed || !!pendingDisambig
                  }
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                  data-ocid="ai_panel.input"
                />
                <Button
                  size="sm"
                  onClick={handleProcess}
                  disabled={
                    isProcessing ||
                    !input.trim() ||
                    !!pendingParsed ||
                    !!pendingDisambig
                  }
                  className="bg-amber-500 hover:bg-amber-600 text-white px-3 rounded-xl"
                  data-ocid="ai_panel.submit"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
