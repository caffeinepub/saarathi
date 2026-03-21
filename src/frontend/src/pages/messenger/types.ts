export type MsgType = "text" | "image" | "file";

export interface LocalUser {
  id: string;
  displayName: string;
  username: string;
}

export interface LocalGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  members: string[];
  admins: string[];
  onlyAdminsCanPost: boolean;
  parentGroupId?: string;
}

export interface LocalMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  blobUrl?: string;
  msgType: MsgType;
  timestamp: number;
  fileName?: string;
  fileSize?: string;
}

export type ChatTarget =
  | { type: "dm"; userId: string; displayName: string }
  | { type: "group"; groupId: string; name: string };

export function chatKey(target: ChatTarget): string {
  return target.type === "dm"
    ? `dm_${target.userId}`
    : `group_${target.groupId}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
