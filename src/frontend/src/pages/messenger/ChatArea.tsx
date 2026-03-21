import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  File,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAvatarColor } from "./sampleData";
import type { ChatTarget, LocalGroup, LocalMessage } from "./types";
import { formatTime, getInitials } from "./types";

interface Props {
  currentChat: ChatTarget | null;
  messages: LocalMessage[];
  groups: LocalGroup[];
  currentUserId: string;
  currentDisplayName: string;
  onSendMessage: (content: string, file?: File) => void;
  onOpenSettings: (groupId: string) => void;
  onBack: () => void;
  isMobile: boolean;
}

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: LocalMessage;
  isOwn: boolean;
}) {
  return (
    <div
      className={`flex gap-2.5 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      } group`}
    >
      {!isOwn && (
        <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
          <AvatarFallback
            className={`text-[10px] font-bold text-white ${getAvatarColor(msg.senderId)}`}
          >
            {getInitials(msg.senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[72%] ${
          isOwn ? "items-end" : "items-start"
        } flex flex-col gap-0.5`}
      >
        {!isOwn && (
          <span className="text-[11px] font-semibold text-muted-foreground px-1">
            {msg.senderName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border text-foreground rounded-tl-sm"
          }`}
        >
          {msg.msgType === "text" && (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
          {msg.msgType === "image" && msg.blobUrl && (
            <img
              src={msg.blobUrl}
              alt="Attachment"
              className="max-w-[220px] rounded-lg"
            />
          )}
          {msg.msgType === "file" && (
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  isOwn ? "bg-white/20" : "bg-muted"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-xs leading-tight">
                  {msg.fileName || "File"}
                </p>
                {msg.fileSize && (
                  <p
                    className={`text-[11px] ${
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.fileSize}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function ChatArea({
  currentChat,
  messages,
  groups,
  currentUserId,
  onSendMessage,
  onOpenSettings,
  onBack,
  isMobile,
}: Props) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger scroll on message count change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgCount]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center" data-ocid="messenger.empty_state">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            Select a conversation
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Choose a group or direct message from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  const activeGroup =
    currentChat.type === "group"
      ? groups.find(
          (g) => g.id === (currentChat as { groupId: string }).groupId,
        )
      : null;

  const isAdmin = activeGroup?.admins.includes(currentUserId) ?? false;

  const canPost =
    currentChat.type === "dm" || !activeGroup?.onlyAdminsCanPost || isAdmin;

  const headerTitle =
    currentChat.type === "dm" ? currentChat.displayName : currentChat.name;

  const headerSub =
    currentChat.type === "dm"
      ? "Direct Message"
      : activeGroup
        ? `${activeGroup.members.length} members${activeGroup.onlyAdminsCanPost ? " \u00b7 Admins only" : ""}`
        : "";

  const handleSend = async () => {
    const content = text.trim();
    if (!content && !pendingFile) return;
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 120));
    onSendMessage(
      content || (pendingFile?.name ?? ""),
      pendingFile ?? undefined,
    );
    setText("");
    setPendingFile(null);
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        {isMobile && (
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="messenger.back.button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          {currentChat.type === "dm" ? (
            <Avatar className="w-8 h-8">
              <AvatarFallback
                className={`text-xs font-bold text-white ${getAvatarColor(
                  (currentChat as { userId: string }).userId,
                )}`}
              >
                {getInitials(headerTitle)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Users className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-sm truncate">
            {headerTitle}
          </h2>
          {headerSub && (
            <p className="text-xs text-muted-foreground truncate">
              {headerSub}
            </p>
          )}
        </div>
        {currentChat.type === "group" && isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onOpenSettings((currentChat as { groupId: string }).groupId)
            }
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            data-ocid="messenger.group.settings.button"
            title="Group settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-full text-center"
            data-ocid="messenger.messages.empty_state"
          >
            <p className="text-muted-foreground text-sm">
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
      </div>

      {/* File preview */}
      {pendingFile && (
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-2 flex-shrink-0">
          <File className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground truncate">
            {pendingFile.name}
          </span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            className="ml-auto text-muted-foreground hover:text-destructive text-xs"
          >
            Remove
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
        {!canPost ? (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <span>Only admins can post in this group</span>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted flex-shrink-0 mb-0.5"
              title="Attach file"
              data-ocid="messenger.upload_button"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPendingFile(f);
                e.target.value = "";
              }}
            />
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${headerTitle}...`}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] bg-background border-border text-sm py-2"
              rows={1}
              data-ocid="messenger.input"
            />
            <Button
              onClick={() => void handleSend()}
              disabled={isSending || (!text.trim() && !pendingFile)}
              size="icon"
              className="w-9 h-9 bg-primary hover:bg-primary/90 flex-shrink-0 mb-0.5"
              data-ocid="messenger.submit_button"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
