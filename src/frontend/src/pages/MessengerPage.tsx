import { Compass, MessageSquarePlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../store/dataStore";
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
}: {
  messages: Record<string, LocalMessage[]>;
  currentUserId: string;
  onNavigate?: (page: string) => void;
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
            ) => {
              return (
                sum +
                d.lineItems.reduce(
                  (
                    s: number,
                    item: { qty: number; rate: number; gstRate: number },
                  ) => s + item.qty * item.rate * (1 + item.gstRate / 100),
                  0,
                )
              );
            },
            0,
          );
        }
      }
    } catch {}

    const allMessages = Object.values(messages).flat();
    const unread = allMessages.filter(
      (m) =>
        m.senderId !== currentUserId &&
        m.timestamp > Date.now() - 24 * 60 * 60 * 1000,
    ).length;

    return { pending, overdue, amountDue, unread: unread || 5, today };
  }, [messages, currentUserId]);

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
    title: "Send messages like WhatsApp",
    body: "Chat with your team, groups, and contacts just like you do on WhatsApp.",
    icon: "💬",
  },
  {
    title: "AI turns messages into tasks",
    body: "Type naturally — SAARATHI AI detects when you mention a task or meeting and creates it for you.",
    icon: "✨",
  },
  {
    title: "Track payments and invoices",
    body: "Generate GST-compliant invoices directly from chat conversations with one tap.",
    icon: "💰",
  },
  {
    title: "Use AI buttons inside chat",
    body: "Every chat has smart AI action buttons — Reply, Create Task, Create Invoice — always ready.",
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
  const currentUserId = profile?.username || "me";
  const currentDisplayName = profile?.displayName || profile?.username || "You";

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem("saarathi_onboarded");
    } catch {
      return false;
    }
  });

  const [groups, setGroups] = useState<LocalGroup[]>(() =>
    makeSampleGroups(currentUserId),
  );
  const [dmContacts, setDmContacts] = useState<LocalUser[]>(() => [
    SAMPLE_USERS[0],
    SAMPLE_USERS[1],
    SAMPLE_USERS[5], // Ravi Kumar
  ]);
  const [messages, setMessages] = useState<Record<string, LocalMessage[]>>(
    () => {
      const base = makeSampleMessages(currentUserId, currentDisplayName);
      try {
        const stored = localStorage.getItem("saarathi_messages");
        if (stored) {
          const parsed: Record<string, LocalMessage[]> = JSON.parse(stored);
          const merged = { ...base };
          for (const [key, msgs] of Object.entries(parsed)) {
            const existing = merged[key] ?? [];
            const existingIds = new Set(existing.map((m) => m.id));
            const newMsgs = msgs.filter((m) => !existingIds.has(m.id));
            merged[key] = [...existing, ...newMsgs].sort(
              (a, b) => a.timestamp - b.timestamp,
            );
          }
          return merged;
        }
      } catch {}
      return base;
    },
  );
  const [currentChat, setCurrentChat] = useState<ChatTarget | null>(null);

  // Track which groups are expanded in sidebar
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["g1"]),
  );

  // Modals
  const [showNewDM, setShowNewDM] = useState(false);
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
    },
    [currentChat, currentUserId, currentDisplayName],
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
    (name: string, description: string) => {
      const newGroup: LocalGroup = {
        id: `g_${Date.now()}`,
        name,
        description,
        creatorId: currentUserId,
        members: [currentUserId],
        admins: [currentUserId],
        onlyAdminsCanPost: false,
        depth: 0,
      };
      setGroups((prev) => [...prev, newGroup]);
      setCurrentChat({ type: "group", groupId: newGroup.id, name });
      setMobileShowChat(true);
    },
    [currentUserId],
  );

  const handleCreateSubgroup = useCallback(
    (parentId: string, name: string, description: string) => {
      const newSubgroupId = `g_sub_${Date.now()}`;
      const newGroup: LocalGroup = {
        id: newSubgroupId,
        name,
        description,
        creatorId: currentUserId,
        members: [currentUserId],
        admins: [currentUserId],
        onlyAdminsCanPost: false,
        parentGroupId: parentId,
        depth: 0, // will be overridden below
      };
      setGroups((prev) => {
        const parent = prev.find((g) => g.id === parentId);
        const parentDepth = parent?.depth ?? 0;
        const groupWithDepth = { ...newGroup, depth: parentDepth + 1 };
        return [...prev, groupWithDepth];
      });
      setExpandedGroups((prev) => new Set([...prev, parentId]));
    },
    [currentUserId],
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

  const allUsers: LocalUser[] = [
    {
      id: currentUserId,
      displayName: currentDisplayName,
      username: currentUserId,
    },
    ...SAMPLE_USERS,
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
