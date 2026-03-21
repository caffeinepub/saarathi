import { MessageSquarePlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

export default function MessengerPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.username || "me";
  const currentDisplayName = profile?.displayName || profile?.username || "You";

  const [groups, setGroups] = useState<LocalGroup[]>(() =>
    makeSampleGroups(currentUserId),
  );
  const [dmContacts, setDmContacts] = useState<LocalUser[]>(() => [
    SAMPLE_USERS[0],
    SAMPLE_USERS[1],
  ]);
  const [messages, setMessages] = useState<Record<string, LocalMessage[]>>(() =>
    makeSampleMessages(currentUserId, currentDisplayName),
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
      };
      setGroups((prev) => [...prev, newGroup]);
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
      className="h-full flex overflow-hidden relative"
      data-ocid="messenger.panel"
    >
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
        />
      )}

      {/* Floating New DM Button — visible only when sidebar is shown */}
      {showSidebar && (
        <button
          type="button"
          onClick={() => setShowNewDM(true)}
          className="fixed bottom-6 left-52 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95"
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
