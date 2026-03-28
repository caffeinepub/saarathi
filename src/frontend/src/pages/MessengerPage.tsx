import { Compass, MessageSquarePlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import { dataStore } from "../store/dataStore";
import { asExtended } from "../utils/backendExtensions";
import ChatArea from "./messenger/ChatArea";
import MessengerSidebar from "./messenger/MessengerSidebar";
import {
  GroupSettingsModal,
  NewDMModal,
  NewGroupModal,
  NewSubgroupModal,
} from "./messenger/Modals";
import {
  SAMPLE_USERS,
  makeSampleGroups,
  makeSampleMessages,
} from "./messenger/sampleData";
import type {
  BusinessDocPayload,
  ChatTarget,
  LocalGroup,
  LocalMessage,
  LocalUser,
  TaskPayload,
  TaskRequestStatus,
} from "./messenger/types";
import { chatKey } from "./messenger/types";

interface MessengerPageProps {
  onNavigate?: (page: string) => void;
}

// ─── Today Summary Strip ──────────────────────────────────────────────────────
function CommitmentBanner({
  onNavigate,
}: { onNavigate?: (page: string) => void }) {
  const [pendingCommitment, setPendingCommitment] = useState<{
    text: string;
    timestamp: number;
  } | null>(null);

  function checkCommitments() {
    try {
      const items = JSON.parse(
        localStorage.getItem("saarathi_commitments") || "[]",
      );
      const twentyMinsAgo = Date.now() - 20 * 60 * 1000;
      const stale = items.find(
        (c: { text: string; timestamp: number; acted: boolean }) =>
          !c.acted && c.timestamp < twentyMinsAgo,
      );
      setPendingCommitment(stale ?? null);
    } catch {
      setPendingCommitment(null);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: checkCommitments is stable
  useEffect(() => {
    checkCommitments();
    const interval = setInterval(checkCommitments, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!pendingCommitment) return null;

  function dismiss() {
    try {
      const items = JSON.parse(
        localStorage.getItem("saarathi_commitments") || "[]",
      );
      const updated = items.map(
        (c: { text: string; timestamp: number; acted: boolean }) =>
          c.text === pendingCommitment?.text
            ? { ...c, timestamp: Date.now() }
            : c,
      );
      localStorage.setItem("saarathi_commitments", JSON.stringify(updated));
    } catch {}
    setPendingCommitment(null);
  }

  function createTask() {
    try {
      const items = JSON.parse(
        localStorage.getItem("saarathi_commitments") || "[]",
      );
      const updated = items.map(
        (c: { text: string; timestamp: number; acted: boolean }) =>
          c.text === pendingCommitment?.text ? { ...c, acted: true } : c,
      );
      localStorage.setItem("saarathi_commitments", JSON.stringify(updated));
    } catch {}
    setPendingCommitment(null);
    onNavigate?.("activities");
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 bg-orange-950/50 border-b border-orange-700/40"
      data-ocid="messenger.commitment_banner"
    >
      <span className="text-orange-300 text-sm">⚠</span>
      <span className="text-orange-200 text-xs flex-1 truncate">
        You said you'd follow up — still pending
      </span>
      <button
        type="button"
        onClick={createTask}
        className="text-xs px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-semibold whitespace-nowrap"
        data-ocid="messenger.commitment_banner.create_task.button"
      >
        Create Task
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="text-xs px-2 py-1 text-orange-400 hover:text-orange-200 whitespace-nowrap"
        data-ocid="messenger.commitment_banner.remind_later.button"
      >
        Remind Later
      </button>
    </div>
  );
}

function TodaySummaryStrip({
  messages,
  currentUserId,
  onNavigate,
  cachedDocs,
}: {
  messages: Record<string, LocalMessage[]>;
  currentUserId: string;
  onNavigate?: (page: string) => void;
  cachedDocs?: import("../utils/backendExtensions").CanisterBusinessDoc[];
}) {
  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let pending = 3;
    let overdue = 1;
    let amountDue = 28500;

    try {
      const raw = localStorage.getItem("saarathi_activities");
      if (raw) {
        const acts = JSON.parse(raw);
        pending = acts.filter(
          (a: { status: string }) =>
            a.status !== "completed" && a.status !== "done",
        ).length;
        overdue = acts.filter((a: { deadline: string; status: string }) => {
          if (!a.deadline || a.status === "completed") return false;
          return new Date(a.deadline) < new Date();
        }).length;
      }
    } catch {}

    if (cachedDocs && cachedDocs.length > 0) {
      const unpaidDocs = cachedDocs.filter(
        (d) => "invoice" in d.docType && !("paid" in d.status),
      );
      if (unpaidDocs.length > 0) {
        amountDue = unpaidDocs.reduce(
          (sum, d) =>
            sum +
            d.lineItems.reduce(
              (s, li) => s + li.qty * li.rate * (1 + li.gstRate / 100),
              0,
            ),
          0,
        );
      }
    } else {
      try {
        const raw = localStorage.getItem("saarathi_business_docs");
        if (raw) {
          const docs = JSON.parse(raw);
          const unpaid = docs.filter(
            (d: {
              type: string;
              status: string;
              lineItems: Array<{ qty: number; rate: number; gstRate: number }>;
            }) => d.type === "invoice" && d.status !== "paid",
          );
          if (unpaid.length > 0) {
            amountDue = unpaid.reduce(
              (
                sum: number,
                d: {
                  lineItems: Array<{
                    qty: number;
                    rate: number;
                    gstRate: number;
                  }>;
                },
              ) =>
                sum +
                d.lineItems.reduce(
                  (
                    s: number,
                    item: { qty: number; rate: number; gstRate: number },
                  ) => s + item.qty * item.rate * (1 + item.gstRate / 100),
                  0,
                ),
              0,
            );
          }
        }
      } catch {}
    }

    const allMessages = Object.values(messages).flat();
    const unread = allMessages.filter(
      (m) =>
        m.senderId !== currentUserId &&
        m.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    ).length;

    return { pending, overdue, amountDue, unread: unread || 5, today };
  }, [messages, currentUserId, cachedDocs]);

  return (
    <div
      className="flex items-center gap-1 px-4 py-2 flex-shrink-0 overflow-x-auto"
      style={{
        background: "#111",
        borderBottom: "1px solid #2a2a2a",
        minHeight: "38px",
      }}
      data-ocid="messenger.summary.panel"
    >
      <span className="text-xs font-semibold text-amber-400/60 mr-1 whitespace-nowrap">
        Today:
      </span>
      <button
        type="button"
        onClick={() => onNavigate?.("activities")}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors whitespace-nowrap font-medium"
        data-ocid="messenger.summary.actions.button"
        title="Go to Activities"
      >
        🔴 {counts.pending} Pending
      </button>
      {counts.overdue > 0 && (
        <button
          type="button"
          onClick={() => onNavigate?.("activities")}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-900/40 text-orange-400 hover:bg-orange-900/60 transition-colors whitespace-nowrap font-medium"
          data-ocid="messenger.summary.overdue.button"
          title="Overdue actions"
        >
          ⚠️ {counts.overdue} Overdue
        </button>
      )}
      <button
        type="button"
        onClick={() => onNavigate?.("business")}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 transition-colors whitespace-nowrap font-medium"
        data-ocid="messenger.summary.money.button"
        title="Go to Business Suite"
      >
        💰 ₹
        {counts.amountDue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}{" "}
        Due
      </button>
      <button
        type="button"
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 transition-colors whitespace-nowrap font-medium"
        data-ocid="messenger.summary.messages.button"
        title="Unread messages"
      >
        💬 {counts.unread} Unread
      </button>
    </div>
  );
}

// ─── Onboarding Modal ──────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    title: "Welcome to SAARATHI!",
    body: "You’re now exploring with demo data from Tattva Traders — a small consulting firm just like yours. See how chat drives the entire workflow.",
    icon: "💬",
  },
  {
    title: "Chat Creates Actions",
    body: "In the Tattva Traders Team group, Suresh just flagged the GST filing deadline. One tap creates a task — no separate to-do app needed.",
    icon: "✨",
  },
  {
    title: "Track Payments Easily",
    body: "INV-001 for Verma Industries (₹35,000) is due in 10 days. SAARATHI tracks it and sends reminders directly from chat.",
    icon: "💰",
  },
  {
    title: "AI Works Inside Chat",
    body: "Use the ✨ AI button inside any chat to create tasks, draft invoices, or send reminders — all without leaving the conversation.",
    icon: "🤖",
  },
];

function OnboardingModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  function finish() {
    localStorage.setItem("saarathi_onboarded", "true");
    onDone();
  }

  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      data-ocid="onboarding.modal"
    >
      <div className="w-full max-w-sm bg-[#1e1e1e] rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-amber-400">SAARATHI</span>
            <span className="ml-2 text-xs text-amber-400/60">
              {step + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-white/30 hover:text-white/60"
            data-ocid="onboarding.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 text-center">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-lg font-bold text-white mb-3">{current.title}</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            {current.body}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {ONBOARDING_STEPS.map((step_item, i) => (
            <div
              key={step_item.title}
              className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-amber-400" : "bg-white/20"}`} // biome-ignore lint/suspicious/noArrayIndexKey: index needed for step comparison
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={finish}
            className="flex-1 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            data-ocid="onboarding.cancel_button"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) finish();
              else setStep((s) => s + 1);
            }}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm rounded-xl transition-colors"
            data-ocid="onboarding.primary_button"
          >
            {isLast ? "Start Using App" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessengerPage({ onNavigate }: MessengerPageProps) {
  const { profile } = useAuth();
  const { actor } = useActor();
  const currentUserId = profile?.username || "me";
  const currentDisplayName = profile?.displayName || profile?.username || "You";
  // Map username -> principal string for backend DM calls
  const [principalMap, setPrincipalMap] = useState<Record<string, string>>({});
  const [cachedClients, setCachedClients] = useState<
    import("../utils/backendExtensions").CanisterClient[]
  >([]);
  const [cachedDocs, setCachedDocs] = useState<
    import("../utils/backendExtensions").CanisterBusinessDoc[]
  >([]);
  const [cachedProducts, setCachedProducts] = useState<
    import("../utils/backendExtensions").CanisterProduct[]
  >([]);

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem("saarathi_onboarded");
    } catch {
      return false;
    }
  });

  const [groups, setGroups] = useState<LocalGroup[]>(() => {
    const demoCleared =
      localStorage.getItem("saarathi_demo_cleared") === "true";
    try {
      const stored = localStorage.getItem("saarathi_groups");
      if (stored) {
        const parsed = JSON.parse(stored) as LocalGroup[];
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    if (demoCleared) return [];
    return makeSampleGroups(currentUserId);
  });
  const [dmContacts, setDmContacts] = useState<LocalUser[]>(() => {
    const demoCleared =
      localStorage.getItem("saarathi_demo_cleared") === "true";
    try {
      const stored = localStorage.getItem("saarathi_dm_contacts");
      if (stored) {
        const parsed = JSON.parse(stored) as LocalUser[];
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    if (demoCleared) return [];
    return [SAMPLE_USERS[0], SAMPLE_USERS[1], SAMPLE_USERS[2]];
  });
  const [messages, setMessages] = useState<Record<string, LocalMessage[]>>(
    () => {
      try {
        const stored = localStorage.getItem("saarathi_messages");
        if (stored) {
          return JSON.parse(stored) as Record<string, LocalMessage[]>;
        }
      } catch {}
      if (localStorage.getItem("saarathi_demo_cleared") === "true") return {};
      return makeSampleMessages(currentUserId, currentDisplayName);
    },
  );
  const [currentChat, setCurrentChat] = useState<ChatTarget | null>(null);

  // Track which groups are expanded in sidebar
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["g1"]),
  );

  // Modals
  const [showNewDM, setShowNewDM] = useState(false);
  const [settingsContacts, setSettingsContacts] = useState<LocalUser[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("saarathi_contacts") || "[]");
      return raw.map((c: { id: string; name: string; phone: string }) => ({
        id: c.id,
        displayName: c.name || c.phone,
        username: c.phone,
      }));
    } catch {
      return [];
    }
  });
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [settingsGroupId, setSettingsGroupId] = useState<string | null>(null);
  const [showNewSubgroup, setShowNewSubgroup] = useState(false);
  const [subgroupParentId, setSubgroupParentId] = useState<string | null>(null);

  // Mobile: show sidebar or chat
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load real groups + DM contacts from backend on actor ready
  useEffect(() => {
    if (!actor) return;
    let cancelled = false;
    async function loadBackendData() {
      if (!actor) return;
      try {
        const ext = asExtended(actor);
        const [backendGroups, dmConversations] = await Promise.all([
          ext.listMyGroups(),
          ext.listDMConversations(),
        ]);
        // Fetch business data in parallel (non-blocking)
        Promise.all([
          ext.listMyClients(),
          ext.listMyDocs(),
          ext.listMyProducts(),
        ])
          .then(([clients, docs, products]) => {
            if (cancelled) return;
            setCachedClients(clients);
            setCachedDocs(docs);
            setCachedProducts(products);
          })
          .catch(() => {});
        if (cancelled) return;
        // Merge backend groups (non-demo)
        if (backendGroups.length > 0) {
          setGroups((prev) => {
            const existingIds = new Set(prev.map((g) => g.id));
            const newGroups = backendGroups
              .filter((bg) => bg.parentGroupId.length === 0) // top-level only from listMyGroups
              .filter((bg) => !existingIds.has(bg.id))
              .map((bg) => ({
                id: bg.id,
                name: bg.name,
                description: bg.description,
                creatorId: bg.creator.toString(),
                members: bg.members.map((m) => m.toString()),
                admins: bg.admins.map((a) => a.toString()),
                onlyAdminsCanPost: "adminsOnly" in bg.postPermission,
                depth: 0,
                isDemo: false,
              }));
            return newGroups.length > 0 ? [...prev, ...newGroups] : prev;
          });
        }
        // Merge DM contacts from backend
        if (dmConversations.length > 0) {
          const principalMapUpdate: Record<string, string> = {};
          setDmContacts((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newContacts = dmConversations
              .filter((pu) => !existingIds.has(pu.username))
              .map((pu) => {
                principalMapUpdate[pu.username] = pu.principal.toString();
                return {
                  id: pu.username,
                  displayName: pu.displayName || pu.username,
                  username: pu.username,
                };
              });
            return newContacts.length > 0 ? [...prev, ...newContacts] : prev;
          });
          setPrincipalMap((prev) => ({ ...prev, ...principalMapUpdate }));
        }
      } catch {
        // Backend unavailable — continue with localStorage data
      }
    }
    loadBackendData();
    return () => {
      cancelled = true;
    };
  }, [actor]);

  // Persist groups so other modules (5W) can read them
  useEffect(() => {
    dataStore.setGroups(groups);
  }, [groups]);

  // Persist messages to localStorage so AI panel writes are visible
  useEffect(() => {
    try {
      localStorage.setItem("saarathi_messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Sync messages written by AI panel (same-tab custom event + cross-tab storage event)
  useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem("saarathi_messages");
        if (!stored) return;
        const parsed: Record<string, LocalMessage[]> = JSON.parse(stored);
        setMessages((prev) => {
          const merged = { ...prev };
          for (const [key, msgs] of Object.entries(parsed)) {
            const existing = merged[key] ?? [];
            const existingIds = new Set(existing.map((m) => m.id));
            const newMsgs = (msgs as LocalMessage[]).filter(
              (m) => !existingIds.has(m.id),
            );
            if (newMsgs.length > 0) {
              merged[key] = [...existing, ...newMsgs].sort(
                (a, b) => a.timestamp - b.timestamp,
              );
            }
          }
          return merged;
        });
      } catch {}
    };
    window.addEventListener("saarathi_messages_updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("saarathi_messages_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Sync settingsContacts when Settings page adds contacts
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "saarathi_contacts") {
        try {
          const raw = JSON.parse(e.newValue || "[]");
          setSettingsContacts(
            raw.map((c: { id: string; name: string; phone: string }) => ({
              id: c.id,
              displayName: c.name || c.phone,
              username: c.phone,
            })),
          );
        } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist dmContacts so AI panel can build correct DM keys
  useEffect(() => {
    try {
      localStorage.setItem(
        "saarathi_dm_contacts",
        JSON.stringify(
          dmContacts.map((u) => ({
            id: u.id,
            label: u.displayName,
            username: u.username,
          })),
        ),
      );
    } catch {}
  }, [dmContacts]);

  // Poll backend for new messages in non-demo groups (every 5 seconds)
  // eslint-disable-next-line
  useEffect(() => {
    if (!actor || !currentChat) return;
    const nonDemoGroup =
      currentChat.type === "group"
        ? groups.find((g) => g.id === currentChat.groupId && !g.isDemo)
        : null;
    const isDMWithPrincipal =
      currentChat.type === "dm" && principalMap[currentChat.userId];
    if (!nonDemoGroup && !isDMWithPrincipal) return;

    async function pollMessages() {
      if (!actor) return;
      try {
        let canisterMsgs: Array<{
          id: string;
          sender?: { toString(): string };
          from_?: { toString(): string };
          content: string;
          timestamp: bigint;
        }> = [];
        if (nonDemoGroup && currentChat && currentChat.type === "group") {
          canisterMsgs = await asExtended(actor).getGroupMessages(
            currentChat.groupId,
          );
        } else if (
          isDMWithPrincipal &&
          currentChat &&
          currentChat.type === "dm"
        ) {
          const principalStr = principalMap[currentChat.userId];
          const { Principal } = await import("@icp-sdk/core/principal");
          canisterMsgs = await asExtended(actor).getDirectMessages(
            Principal.fromText(principalStr),
          );
        }
        if (canisterMsgs.length === 0) return;
        const chatKeyStr =
          currentChat && currentChat.type === "group"
            ? `group_${currentChat.groupId}`
            : currentChat && currentChat.type === "dm"
              ? `dm_${currentChat.userId}`
              : "";
        if (!chatKeyStr) return;
        setMessages((prev) => {
          const existing = prev[chatKeyStr] ?? [];
          const existingIds = new Set(existing.map((m) => m.id));
          const newMsgs = canisterMsgs
            .filter((m) => !existingIds.has(m.id))
            .map((m) => {
              const senderPrincipal = m.sender ?? m.from_;
              const senderStr = senderPrincipal
                ? senderPrincipal.toString()
                : "unknown";
              return {
                id: m.id,
                senderId: senderStr,
                senderName: `${senderStr.slice(0, 8)}…`,
                content: m.content,
                msgType: "text" as const,
                timestamp: Number(m.timestamp / 1_000_000n),
              };
            });
          if (newMsgs.length === 0) return prev;
          const merged = [...existing, ...newMsgs].sort(
            (a, b) => a.timestamp - b.timestamp,
          );
          return { ...prev, [chatKeyStr]: merged };
        });
      } catch {
        // Polling error — silently ignore
      }
    }

    pollMessages(); // Immediate fetch on chat open
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [actor, currentChat, groups, principalMap]);

  // Inject pending task messages written by AI panel
  useEffect(() => {
    try {
      const raw = localStorage.getItem("saarathi_pending_task_message");
      if (raw) {
        const payload = JSON.parse(raw);
        const key = payload.groupId ? `group_${payload.groupId}` : "group_g1";
        const msg: LocalMessage = {
          id: `ai_task_${Date.now()}`,
          senderId: "ai_assistant",
          senderName: "AI Assistant",
          content: `Task Request: ${payload.title || "New Task"}`,
          msgType: "task_request",
          timestamp: Date.now(),
          taskPayload: payload,
          taskStatus: "pending",
        };
        setMessages((prev) => ({
          ...prev,
          [key]: [...(prev[key] ?? []), msg],
        }));
        localStorage.removeItem("saarathi_pending_task_message");
      }
    } catch {}
  }, []);

  // Persist users so 5W WHO can read them
  useEffect(() => {
    dataStore.setUsers([
      {
        id: currentUserId,
        displayName: currentDisplayName,
        username: currentUserId,
      },
      ...SAMPLE_USERS,
    ]);
  }, [currentUserId, currentDisplayName]);

  const handleSelectChat = useCallback((target: ChatTarget) => {
    setCurrentChat(target);
    setMobileShowChat(true);
  }, []);

  const handleBack = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  const handleSendMessage = useCallback(
    (content: string, file?: File) => {
      if (!currentChat) return;
      const key = chatKey(currentChat);
      const msgType: "text" | "image" | "file" = file
        ? file.type.startsWith("image/")
          ? "image"
          : "file"
        : "text";

      let blobUrl: string | undefined;
      if (file && msgType === "image") {
        blobUrl = URL.createObjectURL(file);
      }

      const newMsg: LocalMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        senderId: currentUserId,
        senderName: currentDisplayName,
        content,
        msgType,
        blobUrl,
        fileName: file?.name,
        fileSize: file ? formatFileSize(file.size) : undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => ({
        ...prev,
        [key]: [...(prev[key] ?? []), newMsg],
      }));

      // Also send to backend for non-demo chats (text messages only)
      if (actor && !file && msgType === "text") {
        if (currentChat.type === "group") {
          const group = groups.find((g) => g.id === currentChat.groupId);
          if (group && !group.isDemo) {
            asExtended(actor)
              .sendGroupMessage(currentChat.groupId, content, [], {
                text_: null,
              })
              .catch(() => {});
          }
        } else if (currentChat.type === "dm") {
          const principalStr = principalMap[currentChat.userId];
          if (principalStr) {
            // Import Principal dynamically to avoid circular deps
            import("@icp-sdk/core/principal")
              .then(({ Principal }) => {
                const toPrincipal = Principal.fromText(principalStr);
                asExtended(actor)
                  .sendDirectMessage(toPrincipal, content, [], { text_: null })
                  .catch(() => {});
              })
              .catch(() => {});
          }
        }
      }
    },
    [
      currentChat,
      currentUserId,
      currentDisplayName,
      actor,
      groups,
      principalMap,
    ],
  );

  const handleSendTaskRequest = useCallback(
    (payload: TaskPayload) => {
      if (!currentChat) return;
      const key = chatKey(currentChat);
      const newMsg: LocalMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: `Task Request: ${payload.title}`,
        msgType: "task_request",
        timestamp: Date.now(),
        taskPayload: payload,
        taskStatus: "pending",
      };
      setMessages((prev) => ({
        ...prev,
        [key]: [...(prev[key] ?? []), newMsg],
      }));
    },
    [currentChat, currentUserId, currentDisplayName],
  );

  const handleSendBusinessDoc = useCallback(
    (payload: BusinessDocPayload) => {
      if (!currentChat) return;
      const key = chatKey(currentChat);
      const newMsg: LocalMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: `${payload.docType === "invoice" ? "Invoice" : payload.docType === "estimate" ? "Estimate" : "Proposal"} ${payload.docNumber}`,
        msgType: "business_doc",
        timestamp: Date.now(),
        businessDocPayload: payload,
      };
      setMessages((prev) => ({
        ...prev,
        [key]: [...(prev[key] ?? []), newMsg],
      }));
    },
    [currentChat, currentUserId, currentDisplayName],
  );

  const handleUpdateTaskStatus = useCallback(
    (msgId: string, status: TaskRequestStatus) => {
      if (!currentChat) return;
      const key = chatKey(currentChat);
      setMessages((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((m) =>
          m.id === msgId ? { ...m, taskStatus: status } : m,
        ),
      }));
    },
    [currentChat],
  );

  const handleStartDM = useCallback((user: LocalUser) => {
    setDmContacts((prev) =>
      prev.some((u) => u.id === user.id) ? prev : [...prev, user],
    );
    setCurrentChat({
      type: "dm",
      userId: user.id,
      displayName: user.displayName,
    });
    setMobileShowChat(true);
  }, []);

  const handleCreateGroup = useCallback(
    async (name: string, description: string) => {
      const localId = `g_${Date.now()}`;
      const newGroup: LocalGroup = {
        id: localId,
        name,
        description,
        creatorId: currentUserId,
        members: [currentUserId],
        admins: [currentUserId],
        onlyAdminsCanPost: false,
        depth: 0,
        isDemo: false,
      };
      setGroups((prev) => [...prev, newGroup]);
      setCurrentChat({ type: "group", groupId: localId, name });
      setMobileShowChat(true);
      // Also create on backend and update the group id
      if (actor) {
        try {
          const backendId = await asExtended(actor).createGroup(
            name,
            description,
          );
          if (backendId && backendId !== localId) {
            setGroups((prev) =>
              prev.map((g) => (g.id === localId ? { ...g, id: backendId } : g)),
            );
            setCurrentChat({ type: "group", groupId: backendId, name });
          }
        } catch {
          // Backend unavailable — keep local group
        }
      }
    },
    [currentUserId, actor],
  );

  const handleCreateSubgroup = useCallback(
    async (parentId: string, name: string, description: string) => {
      const localId = `g_sub_${Date.now()}`;
      const newGroup: LocalGroup = {
        id: localId,
        name,
        description,
        creatorId: currentUserId,
        members: [currentUserId],
        admins: [currentUserId],
        onlyAdminsCanPost: false,
        parentGroupId: parentId,
        depth: 0, // will be overridden below
        isDemo: false,
      };
      setGroups((prev) => {
        const parent = prev.find((g) => g.id === parentId);
        const parentDepth = parent?.depth ?? 0;
        const groupWithDepth = { ...newGroup, depth: parentDepth + 1 };
        return [...prev, groupWithDepth];
      });
      setExpandedGroups((prev) => new Set([...prev, parentId]));
      // Also create on backend
      if (actor) {
        try {
          const backendId = await asExtended(actor).createSubgroup(
            parentId,
            name,
            description,
          );
          if (backendId && backendId !== localId) {
            setGroups((prev) =>
              prev.map((g) => (g.id === localId ? { ...g, id: backendId } : g)),
            );
          }
        } catch {
          // Backend unavailable — keep local subgroup
        }
      }
    },
    [currentUserId, actor],
  );

  const handleDeleteSubgroup = useCallback((subgroupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== subgroupId));
    setCurrentChat((prev) => {
      if (
        prev?.type === "group" &&
        (prev as { groupId: string }).groupId === subgroupId
      ) {
        return null;
      }
      return prev;
    });
  }, []);

  const handleUpdateGroup = useCallback(
    (
      groupId: string,
      name: string,
      description: string,
      onlyAdminsCanPost: boolean,
    ) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, name, description, onlyAdminsCanPost } : g,
        ),
      );
      if (
        currentChat?.type === "group" &&
        (currentChat as { groupId: string }).groupId === groupId
      ) {
        setCurrentChat({ type: "group", groupId, name });
      }
    },
    [currentChat],
  );

  const handleAddMember = useCallback((groupId: string, userId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.members.includes(userId)
          ? { ...g, members: [...g.members, userId] }
          : g,
      ),
    );
  }, []);

  const handleRemoveMember = useCallback((groupId: string, userId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.filter((m) => m !== userId),
              admins: g.admins.filter((a) => a !== userId),
            }
          : g,
      ),
    );
  }, []);

  const handleMakeAdmin = useCallback((groupId: string, userId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.admins.includes(userId)
          ? { ...g, admins: [...g.admins, userId] }
          : g,
      ),
    );
  }, []);

  const handleRemoveAdmin = useCallback((groupId: string, userId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, admins: g.admins.filter((a) => a !== userId) }
          : g,
      ),
    );
  }, []);

  const handleOpenSettings = useCallback((groupId: string) => {
    setSettingsGroupId(groupId);
    setShowGroupSettings(true);
  }, []);

  const handleSaveClient = async (name: string): Promise<string> => {
    if (!actor) return "";
    try {
      const ext = asExtended(actor);
      const id = await ext.createClient(name, "", "", "", "", "", "", "");
      const updated = await ext.listMyClients();
      setCachedClients(updated);
      return id;
    } catch {
      return "";
    }
  };

  const handleSaveProduct = async (
    name: string,
    price: number,
    gstRate: number,
  ): Promise<string> => {
    if (!actor) return "";
    try {
      const ext = asExtended(actor);
      const id = await ext.createProduct(name, "", "", "pcs", price, gstRate);
      const updated = await ext.listMyProducts();
      setCachedProducts(updated);
      return id;
    } catch {
      return "";
    }
  };

  const handleSaveDoc = async (
    docType: string,
    clientId: string,
    lineItems: Array<{
      productId: string;
      description: string;
      hsnSac: string;
      qty: number;
      unit: string;
      rate: number;
      gstRate: number;
    }>,
    date: string,
    dueDate: string,
    notes: string,
    linkedChatId: string,
  ): Promise<string> => {
    if (!actor) return "";
    try {
      const ext = asExtended(actor);
      const docTypeVariant =
        docType === "estimate"
          ? { estimate: null }
          : docType === "proposal"
            ? { proposal: null }
            : { invoice: null };
      const lineItemsForCanister = lineItems.map((li, idx) => ({
        id: `li_${Date.now()}_${idx}`,
        ...li,
      }));
      const numPrefix =
        docType === "invoice" ? "INV" : docType === "estimate" ? "EST" : "PROP";
      const existingCount = cachedDocs.filter((d) =>
        docType === "invoice"
          ? "invoice" in d.docType
          : docType === "estimate"
            ? "estimate" in d.docType
            : "proposal" in d.docType,
      ).length;
      const num = `${numPrefix}-${String(existingCount + 1).padStart(3, "0")}`;
      const id = await ext.createDoc(
        docTypeVariant,
        num,
        date,
        dueDate,
        "",
        clientId,
        "",
        "",
        lineItemsForCanister,
        notes,
        "",
        "",
        linkedChatId,
      );
      const updated = await ext.listMyDocs();
      setCachedDocs(updated);
      return id;
    } catch {
      return "";
    }
  };

  const allUsers: LocalUser[] = [
    {
      id: currentUserId,
      displayName: currentDisplayName,
      username: currentUserId,
    },
    ...SAMPLE_USERS,
    ...settingsContacts.filter(
      (c) => c.id !== currentUserId && !SAMPLE_USERS.find((s) => s.id === c.id),
    ),
  ];

  const settingsGroup = groups.find((g) => g.id === settingsGroupId) ?? null;
  const currentMessages = currentChat
    ? (messages[chatKey(currentChat)] ?? [])
    : [];

  const showSidebar = !isMobile || !mobileShowChat;
  const showChat = !isMobile || mobileShowChat;

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      data-ocid="messenger.panel"
    >
      {showOnboarding && (
        <OnboardingModal onDone={() => setShowOnboarding(false)} />
      )}

      {/* Commitment Banner */}
      <CommitmentBanner onNavigate={onNavigate} />

      {/* Today Summary Strip */}
      <TodaySummaryStrip
        messages={messages}
        currentUserId={currentUserId}
        onNavigate={onNavigate}
        cachedDocs={cachedDocs}
      />

      {/* Main flex row: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        {showSidebar && (
          <MessengerSidebar
            groups={groups}
            dmContacts={dmContacts}
            currentChat={currentChat}
            onSelectChat={handleSelectChat}
            onNewDM={() => setShowNewDM(true)}
            onNewGroup={() => setShowNewGroup(true)}
            onGroupSettings={handleOpenSettings}
            onNewSubgroup={(parentId) => {
              setSubgroupParentId(parentId);
              setShowNewSubgroup(true);
            }}
            currentUserId={currentUserId}
            expandedGroups={expandedGroups}
            onToggleGroupExpand={(groupId) => {
              setExpandedGroups((prev) => {
                const next = new Set(prev);
                if (next.has(groupId)) next.delete(groupId);
                else next.add(groupId);
                return next;
              });
            }}
          />
        )}

        {/* Chat area */}
        {showChat && (
          <ChatArea
            currentChat={currentChat}
            messages={currentMessages}
            groups={groups}
            currentUserId={currentUserId}
            currentDisplayName={currentDisplayName}
            onSendMessage={handleSendMessage}
            onSendTaskRequest={handleSendTaskRequest}
            onSendBusinessDoc={handleSendBusinessDoc}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onOpenSettings={handleOpenSettings}
            onBack={handleBack}
            isMobile={isMobile}
            onNavigate={onNavigate}
            cachedClients={cachedClients}
            cachedDocs={cachedDocs}
            cachedProducts={cachedProducts}
            onSaveClient={handleSaveClient}
            onSaveProduct={handleSaveProduct}
            onSaveDoc={handleSaveDoc}
          />
        )}
      </div>

      {/* Floating New DM Button — visible only when sidebar is shown */}
      {showSidebar && (
        <button
          type="button"
          onClick={() => setShowNewDM(true)}
          className="fixed bottom-6 right-24 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          data-ocid="messenger.new_dm.open_modal_button"
          title="New Direct Message"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New DM
        </button>
      )}

      {/* Modals */}
      <NewDMModal
        open={showNewDM}
        onClose={() => setShowNewDM(false)}
        existingDMs={dmContacts.map((u) => u.id)}
        currentUserId={currentUserId}
        onStartDM={handleStartDM}
        allUsers={allUsers}
      />

      <NewGroupModal
        open={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onCreateGroup={handleCreateGroup}
      />

      <NewSubgroupModal
        open={showNewSubgroup}
        parentGroup={groups.find((g) => g.id === subgroupParentId) ?? null}
        onClose={() => {
          setShowNewSubgroup(false);
          setSubgroupParentId(null);
        }}
        onCreateSubgroup={handleCreateSubgroup}
      />

      <GroupSettingsModal
        open={showGroupSettings}
        group={settingsGroup}
        currentUserId={currentUserId}
        allUsers={allUsers}
        allGroups={groups}
        onClose={() => {
          setShowGroupSettings(false);
          setSettingsGroupId(null);
        }}
        onUpdateGroup={handleUpdateGroup}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onMakeAdmin={handleMakeAdmin}
        onRemoveAdmin={handleRemoveAdmin}
        onDeleteSubgroup={handleDeleteSubgroup}
        onCreateSubgroup={() => {
          const parentId = settingsGroupId;
          setShowGroupSettings(false);
          setSettingsGroupId(null);
          if (parentId) {
            setSubgroupParentId(parentId);
            setTimeout(() => setShowNewSubgroup(true), 50);
          }
        }}
      />
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
