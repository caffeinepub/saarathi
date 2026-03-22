export type MsgType =
  | "text"
  | "image"
  | "file"
  | "task_request"
  | "business_doc";
export type TaskRequestStatus =
  | "pending"
  | "accepted"
  | "change_requested"
  | "denied";

export interface TaskPayload {
  activityId: string;
  title: string;
  taskType: string;
  assignees: string[];
  dateTime: string;
  deadline: string;
  location: string;
  notes: string;
  attachments?: Array<{
    id: string;
    type: string;
    name: string;
    docId?: string;
  }>;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
}

export interface BusinessDocPayload {
  docId: string;
  docType: "invoice" | "estimate" | "proposal";
  docNumber: string;
  clientName: string;
  grandTotal: number;
  date: string;
  status: string;
}

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
  /** 0 = top-level, 1 = first-level subgroup, … max 9 */
  depth: number;
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
  taskPayload?: TaskPayload;
  taskStatus?: TaskRequestStatus;
  businessDocPayload?: BusinessDocPayload;
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
