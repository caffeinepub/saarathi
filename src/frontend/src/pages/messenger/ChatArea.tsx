import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  Download,
  File,
  FileText,
  Loader2,
  MapPin,
  MessageSquarePlus,
  Paperclip,
  Send,
  Settings,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CanisterBusinessDoc,
  CanisterClient,
  CanisterProduct,
} from "../../utils/backendExtensions";
import { getAvatarColor } from "./sampleData";
import type {
  BusinessDocPayload,
  ChatTarget,
  LocalGroup,
  LocalMessage,
  TaskPayload,
  TaskRequestStatus,
} from "./types";
import { formatTime, getInitials } from "./types";

interface ActivityAttachment {
  id: string;
  type: string;
  name: string;
  docId?: string;
}

interface Activity {
  id: string;
  title: string;
  taskType: string;
  assignees: string[];
  dateTime: string;
  deadline: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  notes: string;
  status: string;
  attachments?: ActivityAttachment[];
}

interface StoredDoc {
  id: string;
  type: "invoice" | "estimate" | "proposal";
  number: string;
  date: string;
  clientId: string;
  status: string;
  lineItems: Array<{ qty: number; rate: number; gstRate: number }>;
}

interface StoredClient {
  id: string;
  name: string;
  state: string;
  placeOfSupply: string;
}

function calcTotal(doc: StoredDoc, _clientState: string): number {
  return doc.lineItems.reduce((sum, item) => {
    const base = item.qty * item.rate;
    const gst = base * (item.gstRate / 100);
    return sum + base + gst;
  }, 0);
}

function ShareBusinessDocModal({
  open,
  onClose,
  onSend,
  cachedDocs: cachedDocsFromParent,
  cachedClients: cachedClientsFromParent,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (payload: BusinessDocPayload) => void;
  cachedDocs?: CanisterBusinessDoc[];
  cachedClients?: CanisterClient[];
}) {
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Use canister data if available, else fall back to localStorage
    if (cachedDocsFromParent && cachedDocsFromParent.length > 0) {
      setDocs(
        cachedDocsFromParent.map((d) => ({
          id: d.id,
          type: ("invoice" in d.docType
            ? "invoice"
            : "estimate" in d.docType
              ? "estimate"
              : "proposal") as "invoice" | "estimate" | "proposal",
          number: d.number,
          date: d.date,
          clientId: d.clientId,
          status:
            "paid" in d.status ? "paid" : "sent" in d.status ? "sent" : "draft",
          lineItems: d.lineItems.map((li) => ({
            qty: li.qty,
            rate: li.rate,
            gstRate: li.gstRate,
          })),
        })),
      );
      setClients(
        (cachedClientsFromParent ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          state: c.state,
          placeOfSupply: c.placeOfSupply,
        })),
      );
    } else {
      try {
        const rawDocs = localStorage.getItem("saarathi_business_docs");
        if (rawDocs) setDocs(JSON.parse(rawDocs));
        else setDocs([]);
        const rawClients = localStorage.getItem("saarathi_clients");
        if (rawClients) setClients(JSON.parse(rawClients));
        else setClients([]);
      } catch {
        setDocs([]);
        setClients([]);
      }
    }
    setSelected(null);
  }, [open, cachedDocsFromParent, cachedClientsFromParent]);

  const selectedDoc = docs.find((d) => d.id === selected);

  function handleSend() {
    if (!selectedDoc) return;
    const client = clients.find((c) => c.id === selectedDoc.clientId);
    onSend({
      docId: selectedDoc.id,
      docType: selectedDoc.type,
      docNumber: selectedDoc.number,
      clientName: client?.name ?? "Unknown Client",
      grandTotal: calcTotal(selectedDoc, client?.state ?? ""),
      date: selectedDoc.date,
      status: selectedDoc.status,
    });
    onClose();
  }

  const TYPE_COLORS: Record<string, string> = {
    invoice: "bg-amber-100 text-amber-700",
    estimate: "bg-blue-100 text-blue-700",
    proposal: "bg-purple-100 text-purple-700",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-white border border-amber-200"
        data-ocid="messenger.share_doc.dialog"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            Send Invoice / Proposal
          </DialogTitle>
        </DialogHeader>

        {docs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No documents found. Create invoices or proposals in Business Suite
              first.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64 border border-amber-100 rounded-lg">
            <div className="p-2 space-y-1.5">
              {docs.map((d) => {
                const client = clients.find((c) => c.id === d.clientId);
                const total = calcTotal(d, client?.state ?? "");
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selected === d.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-transparent hover:bg-amber-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          TYPE_COLORS[d.type] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {d.type}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {d.number}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {client?.name ?? "Unknown Client"}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      ₹
                      {total.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-300 text-stone-600"
            data-ocid="messenger.share_doc.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedDoc}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-ocid="messenger.share_doc.submit_button"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareActivityModal({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (payload: TaskPayload) => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("saarathi_activities");
      if (raw) setActivities(JSON.parse(raw));
      else setActivities([]);
    } catch {
      setActivities([]);
    }
    setSelected(null);
  }, [open]);

  const selectedActivity = activities.find((a) => a.id === selected);

  function handleSend() {
    if (!selectedActivity) return;
    onSend({
      activityId: selectedActivity.id,
      title: selectedActivity.title,
      taskType: selectedActivity.taskType,
      assignees: selectedActivity.assignees,
      dateTime: selectedActivity.dateTime,
      deadline: selectedActivity.deadline,
      location: selectedActivity.location,
      notes: selectedActivity.notes,
      attachments: selectedActivity.attachments?.map((a) => ({
        id: a.id,
        type: a.type,
        name: a.name,
        docId: a.docId,
      })),
      locationLat: selectedActivity.locationLat,
      locationLng: selectedActivity.locationLng,
      locationAddress: selectedActivity.locationAddress,
    });
    onClose();
  }

  const TASK_TYPE_LABELS: Record<string, string> = {
    meeting: "Meeting",
    groupTask: "Group Task",
    other: "Other",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-white border border-amber-200"
        data-ocid="messenger.share_activity.dialog"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4 text-white" />
            </div>
            Share Activity as Task Request
          </DialogTitle>
        </DialogHeader>

        {activities.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No activities found. Create activities in the 5W Activity Builder
              first.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64 border border-amber-100 rounded-lg">
            <div className="p-2 space-y-1.5">
              {activities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(a.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selected === a.id
                      ? "border-amber-400 bg-amber-50"
                      : "border-transparent hover:bg-amber-50/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {TASK_TYPE_LABELS[a.taskType] ?? a.taskType}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-stone-800 truncate">
                    {a.title}
                  </p>
                  {a.assignees.length > 0 && (
                    <p className="text-xs text-stone-500 mt-0.5 truncate">
                      {a.assignees.join(", ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-300 text-stone-600"
            data-ocid="messenger.share_activity.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedActivity}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-ocid="messenger.share_activity.submit_button"
          >
            <Send className="w-4 h-4 mr-2" />
            Send as Task Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_LABELS: Record<TaskRequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  change_requested: "Change Requested",
  denied: "Denied",
};

const STATUS_COLORS: Record<TaskRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  accepted: "bg-green-100 text-green-700 border-green-300",
  change_requested: "bg-blue-100 text-blue-700 border-blue-300",
  denied: "bg-red-100 text-red-700 border-red-300",
};

function TaskRequestCard({
  msg,
  isOwn,
  onUpdateStatus,
  onOpenRequestChange,
  onAcceptChangeRequest,
  onRejectChangeRequest,
}: {
  msg: LocalMessage;
  isOwn: boolean;
  onUpdateStatus: (msgId: string, status: TaskRequestStatus) => void;
  onOpenRequestChange: (msg: LocalMessage) => void;
  onAcceptChangeRequest?: (msgId: string) => void;
  onRejectChangeRequest?: (msgId: string) => void;
}) {
  const tp = msg.taskPayload;
  if (!tp) return null;
  const status = msg.taskStatus ?? "pending";

  const TASK_TYPE_LABELS: Record<string, string> = {
    meeting: "Meeting",
    groupTask: "Group Task",
    other: "Other",
  };

  return (
    <div
      className={`max-w-[360px] rounded-2xl border-2 overflow-hidden shadow-sm ${
        isOwn ? "border-amber-300" : "border-amber-200"
      } bg-white`}
    >
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 flex items-center gap-2">
        <MessageSquarePlus className="w-4 h-4 text-white flex-shrink-0" />
        <span className="text-white font-semibold text-xs uppercase tracking-wide">
          Task Request
        </span>
        <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
          {TASK_TYPE_LABELS[tp.taskType] ?? tp.taskType}
        </span>
      </div>

      <div className="p-3 space-y-2">
        <p className="font-bold text-stone-800 text-sm leading-snug">
          {tp.title}
        </p>

        {tp.assignees.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Users className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="truncate">{tp.assignees.join(", ")}</span>
          </div>
        )}

        {tp.dateTime && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>
              {new Date(tp.dateTime).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              {" at "}
              {new Date(tp.dateTime).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {tp.location && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="truncate">{tp.location}</span>
          </div>
        )}

        {tp.notes && (
          <p className="text-xs text-stone-500 bg-amber-50 rounded-lg p-2 leading-relaxed line-clamp-2">
            {tp.notes}
          </p>
        )}

        {tp.attachments && tp.attachments.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Paperclip className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="text-xs text-stone-500 font-medium">
              Attachments:
            </span>
            {tp.attachments.slice(0, 3).map((att) => (
              <span
                key={att.id}
                className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 rounded-full border border-purple-100"
              >
                <FileText className="w-3 h-3" />
                {att.name}
              </span>
            ))}
            {tp.attachments.length > 3 && (
              <span className="text-[11px] text-stone-400">
                +{tp.attachments.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        {isOwn && status === "change_requested" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(msg.id, "accepted");
                onAcceptChangeRequest?.(msg.id);
              }}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
              data-ocid="messenger.task.confirm_button"
            >
              Accept Changes
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(msg.id, "denied");
                onRejectChangeRequest?.(msg.id);
              }}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              data-ocid="messenger.task.delete_button"
            >
              Reject Changes
            </button>
          </div>
        ) : isOwn ? (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              STATUS_COLORS[status]
            }`}
          >
            {status === "accepted" && <CheckCircle className="w-3 h-3" />}
            {status === "denied" && <XCircle className="w-3 h-3" />}
            {STATUS_LABELS[status]}
          </div>
        ) : status === "pending" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(msg.id, "accepted")}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
              data-ocid="messenger.task.confirm_button"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onOpenRequestChange(msg)}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-white transition-colors"
              data-ocid="messenger.task.secondary_button"
            >
              Request Change
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(msg.id, "denied")}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              data-ocid="messenger.task.delete_button"
            >
              Deny
            </button>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              STATUS_COLORS[status]
            }`}
          >
            {status === "accepted" && <CheckCircle className="w-3 h-3" />}
            {status === "denied" && <XCircle className="w-3 h-3" />}
            {STATUS_LABELS[status]}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestChangeDrawer({
  msg,
  onClose,
  onSubmit,
}: {
  msg: LocalMessage | null;
  onClose: () => void;
  onSubmit: (
    msgId: string,
    type: "comment" | "edit",
    comment: string,
    editedFields?: Partial<TaskPayload>,
  ) => void;
}) {
  const [mode, setMode] = useState<"comment" | "edit">("comment");
  const [comment, setComment] = useState("");
  const [editWho, setEditWho] = useState("");
  const [editWhat, setEditWhat] = useState("");
  const [editWhen, setEditWhen] = useState("");
  const [editWhere, setEditWhere] = useState("");
  const [editWhy, setEditWhy] = useState("");

  // Sync fields when msg changes
  const prevMsgId = useRef<string | null>(null);
  if (msg && msg.id !== prevMsgId.current) {
    prevMsgId.current = msg.id;
    setEditWho(msg.taskPayload?.assignees.join(", ") ?? "");
    setEditWhat(msg.taskPayload?.title ?? "");
    setEditWhen(msg.taskPayload?.dateTime ?? "");
    setEditWhere(msg.taskPayload?.location ?? "");
    setEditWhy(msg.taskPayload?.notes ?? "");
    setComment("");
    setMode("comment");
  }

  if (!msg) return null;

  function handleSubmit() {
    if (!msg) return;
    if (mode === "comment") {
      if (!comment.trim()) return;
      onSubmit(msg.id, "comment", comment.trim());
    } else {
      const fields: Partial<TaskPayload> = {};
      if (editWhat) fields.title = editWhat;
      if (editWhen) fields.dateTime = editWhen;
      if (editWhere) fields.location = editWhere;
      if (editWhy) fields.notes = editWhy;
      if (editWho)
        fields.assignees = editWho
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      onSubmit(msg.id, "edit", "", fields);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      data-ocid="messenger.task.modal"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/50 w-full h-full cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      {/* Drawer panel */}
      <div
        className="relative z-10 rounded-t-2xl overflow-hidden"
        style={{
          backgroundColor: "#1e1e1e",
          borderTop: "1px solid #333",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #333" }}
        >
          <span className="font-bold text-amber-400 text-base">
            🔁 Request Changes
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors"
            data-ocid="messenger.task.close_button"
          >
            ✕
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex px-5 pt-4 gap-2">
          <button
            type="button"
            onClick={() => setMode("comment")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === "comment"
                ? "bg-amber-500 text-white"
                : "bg-white/10 text-stone-400 hover:bg-white/20"
            }`}
            data-ocid="messenger.task.tab"
          >
            💬 Add Comment
          </button>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === "edit"
                ? "bg-amber-500 text-white"
                : "bg-white/10 text-stone-400 hover:bg-white/20"
            }`}
            data-ocid="messenger.task.tab"
          >
            ✏️ Edit Activity
          </button>
        </div>

        {/* Body */}
        <div
          className="px-5 py-4 space-y-3 overflow-y-auto"
          style={{ maxHeight: "55vh" }}
        >
          {mode === "comment" ? (
            <>
              <span className="block text-xs font-semibold text-stone-400 mb-1">
                What would you like to change?
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Can we move this to tomorrow? / Change time to 6 PM"
                className="w-full rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ backgroundColor: "#2a2a2a", border: "1px solid #444" }}
                data-ocid="messenger.task.textarea"
              />
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="block text-[11px] font-semibold text-amber-400 mb-1">
                  WHO
                </span>
                <input
                  type="text"
                  value={editWho}
                  onChange={(e) => setEditWho(e.target.value)}
                  placeholder="Assignees (comma separated)"
                  className="w-full rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                  }}
                  data-ocid="messenger.task.input"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-amber-400 mb-1">
                  WHAT
                </span>
                <input
                  type="text"
                  value={editWhat}
                  onChange={(e) => setEditWhat(e.target.value)}
                  placeholder="Task title"
                  className="w-full rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                  }}
                  data-ocid="messenger.task.input"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-amber-400 mb-1">
                  WHEN
                </span>
                <input
                  type="datetime-local"
                  value={editWhen}
                  onChange={(e) => setEditWhen(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    colorScheme: "dark",
                  }}
                  data-ocid="messenger.task.input"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-amber-400 mb-1">
                  WHERE
                </span>
                <input
                  type="text"
                  value={editWhere}
                  onChange={(e) => setEditWhere(e.target.value)}
                  placeholder="Location"
                  className="w-full rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                  }}
                  data-ocid="messenger.task.input"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-amber-400 mb-1">
                  WHY / NOTES
                </span>
                <textarea
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  rows={3}
                  placeholder="Notes or reason for change"
                  className="w-full rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                  }}
                  data-ocid="messenger.task.textarea"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="px-5 pb-6 pt-2" style={{ borderTop: "1px solid #333" }}>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors"
            data-ocid="messenger.task.submit_button"
          >
            {mode === "comment" ? "Send Change Request" : "Propose Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BusinessDocCard({ msg }: { msg: LocalMessage }) {
  const bp = msg.businessDocPayload;
  if (!bp) return null;

  const TYPE_CONFIG: Record<
    string,
    { label: string; color: string; headerBg: string }
  > = {
    invoice: {
      label: "Invoice",
      color: "bg-amber-100 text-amber-700 border-amber-300",
      headerBg: "from-amber-500 to-amber-400",
    },
    estimate: {
      label: "Estimate",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      headerBg: "from-blue-500 to-blue-400",
    },
    proposal: {
      label: "Proposal",
      color: "bg-purple-100 text-purple-700 border-purple-300",
      headerBg: "from-purple-600 to-purple-500",
    },
  };
  const cfg = TYPE_CONFIG[bp.docType] ?? TYPE_CONFIG.invoice;

  return (
    <div className="max-w-[340px] rounded-2xl border-2 border-amber-200 overflow-hidden shadow-sm bg-white">
      <div
        className={`bg-gradient-to-r ${cfg.headerBg} px-4 py-2.5 flex items-center gap-2`}
      >
        <Briefcase className="w-4 h-4 text-white flex-shrink-0" />
        <span className="text-white font-semibold text-xs uppercase tracking-wide">
          {cfg.label}
        </span>
        <span className="ml-auto text-[10px] font-mono bg-white/20 text-white px-2 py-0.5 rounded-full">
          {bp.docNumber}
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        <p className="font-bold text-stone-800 text-sm">{bp.clientName}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {new Date(bp.date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-sm font-bold text-amber-700">
            ₹
            {bp.grandTotal.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-[10px] capitalize ${cfg.color}`}
          >
            {bp.status}
          </Badge>
          <button
            type="button"
            onClick={() => {
              const html = `<html><head><title>${bp.docNumber}</title></head><body style="font-family:sans-serif;padding:24px;max-width:600px;margin:auto"><h2>${bp.docType.toUpperCase()} — ${bp.docNumber}</h2><p><strong>Client:</strong> ${bp.clientName}</p><p><strong>Date:</strong> ${bp.date}</p><p><strong>Grand Total:</strong> ₹${bp.grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p><p><strong>Status:</strong> ${bp.status}</p></body></html>`;
              const win = window.open("", "_blank");
              if (win) {
                win.document.write(html);
                win.document.close();
                win.print();
              }
            }}
            className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 font-medium px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-50 transition-colors"
            data-ocid="messenger.download_button"
            title="Download / Print document"
          >
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
  onUpdateTaskStatus,
  onOpenRequestChange,
  onAcceptChangeRequest,
  onRejectChangeRequest,
}: {
  msg: LocalMessage;
  isOwn: boolean;
  onUpdateTaskStatus: (msgId: string, status: TaskRequestStatus) => void;
  onOpenRequestChange: (msg: LocalMessage) => void;
  onAcceptChangeRequest?: (msgId: string) => void;
  onRejectChangeRequest?: (msgId: string) => void;
}) {
  if (msg.msgType === "task_request") {
    return (
      <div
        className={`flex gap-2.5 min-w-0 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
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
          className={`flex flex-col gap-0.5 min-w-0 ${isOwn ? "items-end" : "items-start"}`}
        >
          {!isOwn && (
            <span className="text-[11px] font-semibold text-muted-foreground px-1">
              {msg.senderName}
            </span>
          )}
          <TaskRequestCard
            msg={msg}
            isOwn={isOwn}
            onUpdateStatus={onUpdateTaskStatus}
            onOpenRequestChange={onOpenRequestChange}
            onAcceptChangeRequest={onAcceptChangeRequest}
            onRejectChangeRequest={onRejectChangeRequest}
          />
          <span className="text-[10px] text-muted-foreground px-1">
            {formatTime(msg.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  if (msg.msgType === "business_doc") {
    return (
      <div
        className={`flex gap-2.5 min-w-0 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
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
          className={`flex flex-col gap-0.5 min-w-0 ${isOwn ? "items-end" : "items-start"}`}
        >
          {!isOwn && (
            <span className="text-[11px] font-semibold text-muted-foreground px-1">
              {msg.senderName}
            </span>
          )}
          <BusinessDocCard msg={msg} />
          <span className="text-[10px] text-muted-foreground px-1">
            {formatTime(msg.timestamp)}
          </span>
        </div>
      </div>
    );
  }

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
        className={`max-w-[72%] min-w-0 ${
          isOwn ? "items-end" : "items-start"
        } flex flex-col gap-0.5`}
      >
        {!isOwn ? (
          <span className="text-[11px] font-semibold text-muted-foreground px-1">
            {msg.senderName}
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold self-end mr-1 mb-0.5">
            You
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
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}
          {msg.msgType === "image" && msg.blobUrl && (
            <div className="relative group/img">
              <img
                src={msg.blobUrl}
                alt="Attachment"
                className="max-w-[220px] rounded-lg"
              />
              <a
                href={msg.blobUrl}
                download="image"
                target="_blank"
                rel="noreferrer"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                data-ocid="messenger.download_button"
                title="Download image"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
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
              <div className="flex-1">
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
              {msg.blobUrl && (
                <a
                  href={msg.blobUrl}
                  download={msg.fileName || "file"}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isOwn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
                  data-ocid="messenger.download_button"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
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

// ─── Workspace Tabs Content ───────────────────────────────────────────────────────────────────
function GroupTasksTab({ groupName }: { groupName: string }) {
  const mockTasks = [
    {
      id: "t1",
      title: "Send homework PDF to parents",
      assignee: "Priya Sharma",
      due: "Today",
      status: "pending",
    },
    {
      id: "t2",
      title: "Confirm parent-teacher meeting agenda",
      assignee: "You",
      due: "Tomorrow",
      status: "inProgress",
    },
    {
      id: "t3",
      title: "Prepare Q3 performance report",
      assignee: "Rajesh Kumar",
      due: "3 days",
      status: "pending",
    },
  ];

  return (
    <div className="p-4 space-y-3" data-ocid="messenger.tasks.panel">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tasks in {groupName}
        </h4>
        <span className="text-xs text-amber-600 font-medium">
          {mockTasks.length} tasks
        </span>
      </div>
      {mockTasks.map((t, i) => (
        <div
          key={t.id}
          className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border"
          data-ocid={`messenger.tasks.item.${i + 1}`}
        >
          <div
            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              t.status === "inProgress" ? "bg-blue-500" : "bg-amber-400"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {t.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.assignee} · Due: {t.due}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupFilesTab() {
  const mockFiles = [
    {
      id: "f1",
      name: "Q1_Pipeline_Report.xlsx",
      size: "248 KB",
      date: "Today",
    },
    {
      id: "f2",
      name: "Client_Proposal_Mehta.pdf",
      size: "1.2 MB",
      date: "Yesterday",
    },
    { id: "f3", name: "Team_Photo.jpg", size: "3.4 MB", date: "3 days ago" },
  ];

  return (
    <div className="p-4 space-y-3" data-ocid="messenger.files.panel">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Shared Files
      </h4>
      {mockFiles.map((f, i) => (
        <div
          key={f.id}
          className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
          data-ocid={`messenger.files.item.${i + 1}`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {f.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {f.size} · {f.date}
            </p>
          </div>
          <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

function GroupPaymentsTab({ groupName }: { groupName: string }) {
  const mockInvoices = [
    {
      id: "i1",
      number: "INV-042",
      client: "Mehta Exports",
      amount: "₹42,000",
      status: "paid",
    },
    {
      id: "i2",
      number: "INV-045",
      client: "Patel Enterprises",
      amount: "₹28,500",
      status: "pending",
    },
    {
      id: "i3",
      number: "INV-048",
      client: "Kumar Industries",
      amount: "₹15,750",
      status: "draft",
    },
  ];

  const statusColor: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    draft: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-4 space-y-3" data-ocid="messenger.payments.panel">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Invoices — {groupName}
        </h4>
      </div>
      {mockInvoices.map((inv, i) => (
        <div
          key={inv.id}
          className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
          data-ocid={`messenger.payments.item.${i + 1}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {inv.number}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColor[inv.status]}`}
              >
                {inv.status}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground truncate mt-0.5">
              {inv.client}
            </p>
          </div>
          <span className="text-sm font-bold text-amber-700 flex-shrink-0">
            {inv.amount}
          </span>
        </div>
      ))}
      {mockInvoices.length === 0 && (
        <div
          className="py-8 text-center"
          data-ocid="messenger.payments.empty_state"
        >
          <p className="text-sm text-muted-foreground">
            No invoices linked to this group yet.
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  currentChat: ChatTarget | null;
  messages: LocalMessage[];
  groups: LocalGroup[];
  currentUserId: string;
  currentDisplayName: string;
  onSendMessage: (content: string, file?: File) => void;
  onSendTaskRequest: (payload: TaskPayload) => void;
  onSendBusinessDoc: (payload: BusinessDocPayload) => void;
  onUpdateTaskStatus: (msgId: string, status: TaskRequestStatus) => void;
  onOpenSettings: (groupId: string) => void;
  onBack: () => void;
  isMobile: boolean;
  onNavigate?: (page: string) => void;
  cachedClients?: CanisterClient[];
  cachedDocs?: CanisterBusinessDoc[];
  cachedProducts?: CanisterProduct[];
  onSaveClient?: (name: string) => Promise<string>;
  onSaveProduct?: (
    name: string,
    price: number,
    gstRate: number,
  ) => Promise<string>;
  onSaveDoc?: (
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
  ) => Promise<string>;
}

// ──────────────────────────────────────────────────────────
// InlineDockAIPanel — docked right-side AI assistant panel
// ──────────────────────────────────────────────────────────
interface InlineDockAIPanelProps {
  messages: LocalMessage[];
  onClose: () => void;
  input: string;
  setInput: (v: string) => void;
  onCreateTask: (fields: {
    who: string;
    what: string;
    when: string;
    where: string;
    why: string;
  }) => void;
  onCreateInvoice: (client: string, amount: number) => void;
  onCreateProposal: (fields: {
    client: string;
    title: string;
    amount: number;
  }) => void;
  onAIReply: () => void;
}

function InlineDockAIPanel({
  messages,
  onClose,
  input,
  setInput,
  onCreateTask,
  onCreateInvoice,
  onCreateProposal,
  onAIReply,
}: InlineDockAIPanelProps) {
  const lastThree = messages.slice(-3);
  const lastMsgText = messages[messages.length - 1]?.content ?? "";
  const lower = lastMsgText.toLowerCase();

  const proactiveSuggestions: { label: string; action: () => void }[] = [];
  if (lower.includes("meet") || lower.includes("call")) {
    proactiveSuggestions.push({
      label: "📌 Schedule Meeting",
      action: () =>
        onCreateTask({
          who: "",
          what: `Schedule: ${lastMsgText.slice(0, 40)}`,
          when: "tomorrow",
          where: "",
          why: "",
        }),
    });
  }
  if (lower.includes("invoice") || lower.includes("payment")) {
    proactiveSuggestions.push({
      label: "💰 Create Invoice",
      action: () => onCreateInvoice("", 10000),
    });
  }
  if (
    lower.includes("send") ||
    lower.includes("review") ||
    lower.includes("follow")
  ) {
    proactiveSuggestions.push({
      label: "📌 Create Task",
      action: () =>
        onCreateTask({
          who: "",
          what: lastMsgText.slice(0, 60),
          when: "today",
          where: "",
          why: "",
        }),
    });
  }
  if (lower.includes("proposal") || lower.includes("quote")) {
    proactiveSuggestions.push({
      label: "📋 Create Proposal",
      action: () =>
        onCreateProposal({
          client: "",
          title: lastMsgText.slice(0, 50),
          amount: 10000,
        }),
    });
  }
  proactiveSuggestions.push({ label: "✨ Draft Reply", action: onAIReply });

  function handleCommand() {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    const capitalizedWords = input.match(/\b[A-Z][a-z]+\b/g) ?? [];
    const amountMatch = input.match(/₹?\s*(\d[\d,]*)/);
    const amount = amountMatch
      ? Number.parseInt(amountMatch[1].replace(/,/g, ""), 10)
      : 10000;
    const entityName = capitalizedWords[0] ?? "";

    if (cmd.includes("create task") || cmd.includes("task for")) {
      onCreateTask({
        who: entityName,
        what:
          input
            .replace(/create task|task for/gi, "")
            .trim()
            .slice(0, 60) || "Follow up",
        when: cmd.includes("tomorrow") ? "tomorrow" : "today",
        where: "",
        why: "",
      });
    } else if (cmd.includes("create invoice") || cmd.includes("invoice for")) {
      onCreateInvoice(entityName, amount);
    } else if (
      cmd.includes("create proposal") ||
      cmd.includes("proposal for")
    ) {
      onCreateProposal({
        client: entityName,
        title: input
          .replace(/create proposal|proposal for/gi, "")
          .trim()
          .slice(0, 60),
        amount,
      });
    } else if (cmd.includes("reply") || cmd.includes("draft")) {
      onAIReply();
    } else {
      onAIReply();
    }
    setInput("");
  }

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col border-l bg-[#1a1a1a] border-[#2d2d2d] overflow-hidden"
      data-ocid="messenger.ai_panel.panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2d2d2d] flex-shrink-0">
        <span className="text-sm font-semibold text-amber-400">
          ✨ AI Assistant
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-500 hover:text-stone-300 text-xs"
          data-ocid="messenger.ai_panel.close_button"
        >
          ✕
        </button>
      </div>

      {/* Context card */}
      {lastThree.length > 0 && (
        <div className="mx-3 mt-2.5 p-2.5 rounded-lg bg-stone-900 border border-[#2d2d2d] flex-shrink-0">
          <p className="text-[10px] text-stone-500 font-medium mb-1.5 uppercase tracking-wide">
            Recent context
          </p>
          {lastThree.map((m) => (
            <p key={m.id} className="text-xs text-stone-400 truncate leading-5">
              <span className="text-stone-500">
                {m.senderName?.split(" ")[0] ?? "User"}:
              </span>{" "}
              <span>
                {m.content.slice(0, 50)}
                {m.content.length > 50 ? "…" : ""}
              </span>
            </p>
          ))}
        </div>
      )}

      {/* Proactive suggestions */}
      {proactiveSuggestions.length > 0 && (
        <div className="px-3 mt-2.5 flex-shrink-0">
          <p className="text-[10px] text-stone-500 uppercase tracking-wide mb-1.5">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {proactiveSuggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={s.action}
                className="text-xs px-2.5 py-1 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors"
                data-ocid="messenger.ai_panel.suggestion.button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command input */}
      <div className="px-3 pb-3 flex-shrink-0 border-t border-[#2d2d2d] pt-3">
        <p className="text-[10px] text-stone-500 uppercase tracking-wide mb-1.5">
          Command
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCommand();
              }
            }}
            placeholder="e.g. create invoice for Priya"
            className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            data-ocid="messenger.ai_panel.input"
          />
          <button
            type="button"
            onClick={handleCommand}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors flex-shrink-0"
            data-ocid="messenger.ai_panel.send_button"
          >
            Send
          </button>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-[10px] text-stone-600">
            Try: "create task for Ravi", "invoice for Girish ₹35000", "draft
            reply"
          </p>
        </div>
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
  onSendTaskRequest,
  onSendBusinessDoc,
  onUpdateTaskStatus,
  onOpenSettings,
  onBack,
  isMobile,
  onNavigate,
  cachedClients,
  cachedDocs,
  cachedProducts: _cachedProducts,
  onSaveClient,
  onSaveProduct,
  onSaveDoc,
}: Props) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showShareActivity, setShowShareActivity] = useState(false);
  const [showShareDoc, setShowShareDoc] = useState(false);
  const [showAIReply, setShowAIReply] = useState(false);
  const [aiReplyText, setAIReplyText] = useState("");
  const [showCommitmentHint, setShowCommitmentHint] = useState(false);
  const [commitmentText, setCommitmentText] = useState("");
  const [showAutoInvoice, setShowAutoInvoice] = useState(false);
  const [chipsHidden, setChipsHidden] = useState(false);
  const [invoiceEditMode, setInvoiceEditMode] = useState(false);
  const [invFormClient, setInvFormClient] = useState("");
  const [invFormAmount, setInvFormAmount] = useState(0);
  const [invFormGst, setInvFormGst] = useState(18);
  const [invFormDate, setInvFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [invFormDesc, setInvFormDesc] = useState("Professional services");
  const [invFormLineItems, setInvFormLineItems] = useState<
    Array<{
      id: string;
      description: string;
      qty: number;
      rate: number;
      gstRate: number;
    }>
  >([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductRate, setNewProductRate] = useState(0);
  const [newProductGst, setNewProductGst] = useState(18);
  const [autoInvoiceData, setAutoInvoiceData] = useState<{
    client: string;
    amount: number;
    basedOnPrevious: boolean;
  } | null>(null);
  const [requestChangeMsg, setRequestChangeMsg] = useState<LocalMessage | null>(
    null,
  );
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelInput, setAiPanelInput] = useState("");
  const [showInlineTask, setShowInlineTask] = useState(false);
  const [taskFields, setTaskFields] = useState({
    who: "",
    what: "",
    when: "",
    where: "",
    why: "",
  });
  const [showInlineProposal, setShowInlineProposal] = useState(false);
  const [proposalFields, setProposalFields] = useState({
    client: "",
    title: "",
    amount: 10000,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger scroll on message count change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgCount]);

  function handleRequestChangeSubmit(
    msgId: string,
    type: "comment" | "edit",
    comment: string,
    editedFields?: Partial<TaskPayload>,
  ) {
    onUpdateTaskStatus(msgId, "change_requested");
    if (type === "comment") {
      onSendMessage(`🔁 Change requested: ${comment}`);
    } else if (type === "edit" && editedFields) {
      const parts: string[] = ["🔁 Proposed changes:"];
      if (editedFields.title) parts.push(`What: ${editedFields.title}`);
      if (editedFields.dateTime) {
        const d = new Date(editedFields.dateTime);
        parts.push(
          `When: ${d.toLocaleDateString("en-IN")} at ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
        );
      }
      if (editedFields.location) parts.push(`Where: ${editedFields.location}`);
      if (editedFields.notes) parts.push(`Notes: ${editedFields.notes}`);
      onSendMessage(parts.join("\n"));
    }
    setRequestChangeMsg(null);
  }

  function handleAcceptChangeRequest(msgId: string) {
    onUpdateTaskStatus(msgId, "accepted");
    onSendMessage("✅ Changes accepted. Activity updated.");
  }

  function handleRejectChangeRequest(msgId: string) {
    onUpdateTaskStatus(msgId, "denied");
    onSendMessage("❌ Change request declined");
  }

  // Reset hints when chat changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentChat is a prop, intentional
  useEffect(() => {
    setShowCommitmentHint(false);
    setShowAutoInvoice(false);
    setAutoInvoiceData(null);
    setChipsHidden(false);
    setInvoiceEditMode(false);
  }, [currentChat]);

  function markCommitmentActed(text: string) {
    try {
      const existing = JSON.parse(
        localStorage.getItem("saarathi_commitments") || "[]",
      );
      const updated = existing.map(
        (c: { text: string; timestamp: number; acted: boolean }) =>
          c.text === text ? { ...c, acted: true } : c,
      );
      localStorage.setItem("saarathi_commitments", JSON.stringify(updated));
    } catch {}
  }

  function computeAutoInvoice(msgText: string): {
    client: string;
    amount: number;
    basedOnPrevious: boolean;
  } {
    const chatContext = messages
      .slice(-5)
      .map((m) => m.content)
      .join(" ");
    const companyMatch = chatContext.match(
      /\b[A-Z][a-z]+(?:\s+(?:Industries|Pvt|Ltd|Exports|Trading|Co|Group|Enterprises))\b/g,
    );
    const clientName = companyMatch?.[0] ?? "";

    try {
      const storedDocs = JSON.parse(
        localStorage.getItem("saarathi_business_docs") || "[]",
      );
      const storedClients = JSON.parse(
        localStorage.getItem("saarathi_clients") || "[]",
      );
      const clientRec = storedClients.find(
        (c: { name: string; id: string }) =>
          clientName &&
          c.name
            .toLowerCase()
            .includes(clientName.toLowerCase().split(" ")[0].toLowerCase()),
      );
      if (clientRec) {
        const clientInvoices = storedDocs.filter(
          (d: { type: string; clientId: string }) =>
            d.type === "invoice" && d.clientId === clientRec.id,
        );
        if (clientInvoices.length > 0) {
          const last = clientInvoices[clientInvoices.length - 1];
          const total = last.lineItems.reduce(
            (s: number, i: { qty: number; rate: number; gstRate: number }) =>
              s + i.qty * i.rate * (1 + i.gstRate / 100),
            0,
          );
          if (total > 0)
            return {
              client: clientRec.name,
              amount: total,
              basedOnPrevious: true,
            };
        }
      }
    } catch {}

    const amountMatch = msgText.match(
      /₹\s*(\d[\d,]*)|([\d]+)\s*(?:rs|rupees|k\b)/i,
    );
    if (amountMatch) {
      const raw = (amountMatch[1] || amountMatch[2]).replace(/,/g, "");
      const isK = raw.toLowerCase().endsWith("k");
      const numStr = isK ? raw.slice(0, -1) : raw;
      const amt = isK
        ? Number.parseInt(numStr) * 1000
        : Number.parseInt(numStr);
      if (amt > 0)
        return {
          client: clientName || "Client",
          amount: amt,
          basedOnPrevious: false,
        };
    }

    return {
      client: clientName || "Client",
      amount: 10000,
      basedOnPrevious: false,
    };
  }

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
            Select a conversation to start chatting, or use AI to draft a
            message ✨
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
        ? `👥 Group · ${activeGroup.members.length} members${activeGroup.onlyAdminsCanPost ? " · Admins only" : ""}`
        : "";

  const parentGroup = activeGroup?.parentGroupId
    ? groups.find((g) => g.id === activeGroup.parentGroupId)
    : null;

  // Dynamic AI action bar based on last message
  const lastMsgContent =
    messages[messages.length - 1]?.content?.toLowerCase() ?? "";

  // Contextual suggestion chips based on last message
  const contextualChips: Array<{ label: string; draft: string }> = (() => {
    if (
      lastMsgContent.includes("payment") ||
      lastMsgContent.includes("invoice") ||
      lastMsgContent.includes("₹")
    ) {
      return [
        {
          label: "Ask for payment",
          draft:
            "Hi, just a gentle reminder that your payment is due. Please let me know when it will be processed.",
        },
        {
          label: "Send invoice reminder",
          draft:
            "Please find attached the invoice for your reference. Kindly process the payment at the earliest.",
        },
        {
          label: "Request update",
          draft:
            "Could you please provide an update on the payment status? Thank you.",
        },
      ];
    }
    if (
      lastMsgContent.includes("meet") ||
      lastMsgContent.includes("call") ||
      lastMsgContent.includes("tomorrow")
    ) {
      return [
        {
          label: "Schedule meeting",
          draft:
            "Could we schedule a quick meeting to discuss this? Please share your availability.",
        },
        {
          label: "Confirm time",
          draft:
            "Please confirm the time that works best for you for our meeting.",
        },
        {
          label: "Set reminder",
          draft:
            "I'll make a note and follow up. Please remind me if you don't hear back.",
        },
      ];
    }
    return [
      {
        label: "Reply politely",
        draft:
          "Thank you for reaching out. I appreciate your patience and will get back to you shortly.",
      },
      {
        label: "Ask for update",
        draft:
          "Hi, just checking in — could you please share an update on this?",
      },
      {
        label: "Say thanks",
        draft: "Thank you for your message. Appreciate the quick response!",
      },
    ];
  })();
  const showMeeting =
    lastMsgContent.includes("meet") ||
    lastMsgContent.includes("call") ||
    lastMsgContent.includes("schedule");
  const showTaskBtn =
    lastMsgContent.includes("send") ||
    lastMsgContent.includes("review") ||
    lastMsgContent.includes("update");
  const showInvoiceBtn =
    lastMsgContent.includes("invoice") ||
    lastMsgContent.includes("payment") ||
    lastMsgContent.includes("pay");
  const hasContextualButtons = showMeeting || showTaskBtn || showInvoiceBtn;
  const showFallbackAll = !hasContextualButtons;

  // Smart typing suggestions
  const draft = text.toLowerCase();
  const suggestions: string[] = [];
  if (draft.length > 3) {
    if (
      draft.includes("late") ||
      draft.includes("payment") ||
      draft.includes("due")
    ) {
      suggestions.push("Ask for payment");
    }
    if (
      draft.includes("meet") ||
      draft.includes("call") ||
      draft.includes("discuss")
    ) {
      suggestions.push("Schedule meeting");
    }
    if (
      draft.includes("sorry") ||
      draft.includes("apolog") ||
      draft.includes("mistake")
    ) {
      suggestions.push("Reply politely");
    }
    if (suggestions.length === 0 && draft.length > 5) {
      suggestions.push("Reply politely", "Ask for payment");
    }
  }

  function generateAIDraftReply(msgs: LocalMessage[]): string {
    const lastFive = msgs
      .slice(-5)
      .map((m) => m.content.toLowerCase())
      .join(" ");
    if (lastFive.includes("meet"))
      return "I'll confirm the meeting details shortly.";
    if (
      lastFive.includes("invoice") ||
      lastFive.includes("payment") ||
      lastFive.includes("amount")
    )
      return "I'll process the payment shortly.";
    if (lastFive.includes("?"))
      return "Thanks for reaching out, I'll get back to you soon.";
    return "Got it, will follow up shortly.";
  }

  function handleAIReply() {
    const draft = generateAIDraftReply(messages);
    setAIReplyText(draft);
    setShowAIReply(true);
    toast.info("AI suggestion ready");
  }

  function handleCreateTaskFromChat() {
    const lastFive = messages.slice(-5);
    const allText = lastFive.map((m) => m.content).join(" ");
    const capitalizedWords = allText.match(/\b[A-Z][a-z]+\b/g) ?? [];
    const whoArr = [...new Set(capitalizedWords)].slice(0, 2);
    const what = (
      lastFive[lastFive.length - 1]?.content ?? "Follow up task"
    ).slice(0, 60);
    let when = "today";
    if (allText.toLowerCase().includes("tomorrow")) when = "tomorrow";
    else if (allText.toLowerCase().includes("next week")) when = "next week";
    setTaskFields({
      who: whoArr.join(", "),
      what,
      when,
      where: "",
      why: "",
    });
    setShowInlineTask(true);
    toast.info("AI suggestion ready");
  }

  function handleCreateInvoiceFromChat() {
    const allText = messages
      .slice(-5)
      .map((m) => m.content)
      .join(" ");
    const companyMatch = allText.match(
      /\b[A-Z][a-z]+\s+(?:Industries|Pvt|Ltd|Exports|Trading|Co|Group)\b/g,
    );
    const clientName = companyMatch?.[0] ?? "";
    const invoiceData = computeAutoInvoice(allText);
    setInvFormClient(clientName || invoiceData.client);
    setInvFormAmount(invoiceData.amount);
    setInvFormGst(18);
    setInvFormDate(new Date().toISOString().slice(0, 10));
    setInvFormDesc("Professional services");
    setAutoInvoiceData({
      client: clientName || invoiceData.client,
      amount: invoiceData.amount,
      basedOnPrevious: invoiceData.basedOnPrevious,
    });
    setShowAutoInvoice(true);
    setInvoiceEditMode(true);
    toast.info("AI suggestion ready");
  }

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

    // Detect commitment intent
    const lowerContent = content.toLowerCase();
    const commitmentKeywords = [
      "i will",
      "will send",
      "tomorrow",
      "later",
      "i'll",
      "i'll send",
    ];
    if (commitmentKeywords.some((k) => lowerContent.includes(k))) {
      try {
        const existing = JSON.parse(
          localStorage.getItem("saarathi_commitments") || "[]",
        );
        existing.push({ text: content, timestamp: Date.now(), acted: false });
        localStorage.setItem("saarathi_commitments", JSON.stringify(existing));
      } catch {}
      setCommitmentText(content);
      setShowCommitmentHint(true);
    }

    // Detect invoice/payment intent
    if (lowerContent.includes("invoice") || lowerContent.includes("payment")) {
      const invoiceData = computeAutoInvoice(content);
      setAutoInvoiceData(invoiceData);
      setShowAutoInvoice(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isGroupChat = currentChat.type === "group";

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAIPanel((v) => !v)}
          className={`w-8 h-8 transition-colors ${showAIPanel ? "text-amber-400 bg-amber-500/10" : "text-muted-foreground hover:text-amber-400"}`}
          data-ocid="messenger.ai_panel.toggle"
          title="Toggle AI Assistant"
        >
          <span className="text-sm">✨</span>
        </Button>
      </div>

      {/* Workspace context strip for group chats */}
      {isGroupChat && activeGroup && (
        <div
          className="flex items-center gap-3 px-4 py-2 border-b flex-shrink-0"
          style={{ background: "#1e1e1e", borderColor: "#2d2d2d" }}
        >
          <span className="text-xs font-medium text-amber-400">
            {parentGroup
              ? `📂 ${parentGroup.name} / ${activeGroup.name}`
              : `📂 ${activeGroup.name}`}
          </span>
          <span className="text-xs text-stone-400">
            👥 {activeGroup.members.length} members
          </span>
          <span className="text-xs text-orange-400">· 3 pending actions</span>
          <span className="text-xs text-amber-400">· ₹12,000 pending</span>
        </div>
      )}

      {/* Group chat workspace tabs vs DM standard view */}
      {isGroupChat ? (
        <Tabs
          defaultValue="chat"
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex-shrink-0 px-4 pt-2 pb-0 border-b border-border bg-card">
            <TabsList className="h-8 bg-transparent p-0 gap-1">
              <TabsTrigger
                value="chat"
                className="h-7 text-xs px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent bg-transparent"
                data-ocid="messenger.chat.tab"
              >
                💬 Chat
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="h-7 text-xs px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent bg-transparent"
                data-ocid="messenger.tasks.tab"
              >
                📌 Tasks
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="h-7 text-xs px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent bg-transparent"
                data-ocid="messenger.files.tab"
              >
                📁 Files
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="h-7 text-xs px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent bg-transparent"
                data-ocid="messenger.payments.tab"
              >
                💰 Payments
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Chat tab: messages + composer */}
          <TabsContent
            value="chat"
            className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="flex flex-col flex-1 overflow-hidden min-h-0">
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
                        Start conversation or use AI to draft message ✨ — use
                        the AI Action Bar below
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.senderId === currentUserId}
                      onUpdateTaskStatus={onUpdateTaskStatus}
                      onOpenRequestChange={setRequestChangeMsg}
                      onAcceptChangeRequest={handleAcceptChangeRequest}
                      onRejectChangeRequest={handleRejectChangeRequest}
                    />
                  ))}
                </div>
                {renderComposer()}
              </div>
              {showAIPanel && (
                <InlineDockAIPanel
                  messages={messages}
                  onClose={() => setShowAIPanel(false)}
                  input={aiPanelInput}
                  setInput={setAiPanelInput}
                  onCreateTask={(fields) => {
                    setTaskFields(fields);
                    setShowInlineTask(true);
                  }}
                  onCreateInvoice={(client, amount) => {
                    setInvFormClient(client);
                    setInvFormAmount(amount);
                    setInvFormGst(18);
                    setInvFormDate(new Date().toISOString().slice(0, 10));
                    setInvFormDesc("Professional services");
                    setAutoInvoiceData({
                      client,
                      amount,
                      basedOnPrevious: false,
                    });
                    setShowAutoInvoice(true);
                    setInvoiceEditMode(true);
                  }}
                  onCreateProposal={(fields) => {
                    setProposalFields(fields);
                    setShowInlineProposal(true);
                  }}
                  onAIReply={handleAIReply}
                />
              )}
            </div>
          </TabsContent>

          {/* Tasks tab */}
          <TabsContent value="tasks" className="flex-1 overflow-y-auto mt-0">
            <GroupTasksTab groupName={headerTitle} />
          </TabsContent>

          {/* Files tab */}
          <TabsContent value="files" className="flex-1 overflow-y-auto mt-0">
            <GroupFilesTab />
          </TabsContent>

          {/* Payments tab */}
          <TabsContent value="payments" className="flex-1 overflow-y-auto mt-0">
            <GroupPaymentsTab groupName={headerTitle} />
          </TabsContent>
        </Tabs>
      ) : (
        /* DM: standard messages + composer */
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
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
                    Start conversation or use AI to draft message ✨
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.senderId === currentUserId}
                  onUpdateTaskStatus={onUpdateTaskStatus}
                  onOpenRequestChange={setRequestChangeMsg}
                  onAcceptChangeRequest={handleAcceptChangeRequest}
                  onRejectChangeRequest={handleRejectChangeRequest}
                />
              ))}
            </div>
            {renderComposer()}
          </div>
          {showAIPanel && (
            <InlineDockAIPanel
              messages={messages}
              onClose={() => setShowAIPanel(false)}
              input={aiPanelInput}
              setInput={setAiPanelInput}
              onCreateTask={(fields) => {
                setTaskFields(fields);
                setShowInlineTask(true);
              }}
              onCreateInvoice={(client, amount) => {
                setInvFormClient(client);
                setInvFormAmount(amount);
                setInvFormGst(18);
                setInvFormDate(new Date().toISOString().slice(0, 10));
                setInvFormDesc("Professional services");
                setAutoInvoiceData({ client, amount, basedOnPrevious: false });
                setShowAutoInvoice(true);
                setInvoiceEditMode(true);
              }}
              onCreateProposal={(fields) => {
                setProposalFields(fields);
                setShowInlineProposal(true);
              }}
              onAIReply={handleAIReply}
            />
          )}
        </div>
      )}

      {/* AI Reply Preview Dialog */}
      <Dialog
        open={showAIReply}
        onOpenChange={(v) => !v && setShowAIReply(false)}
      >
        <DialogContent
          className="sm:max-w-md bg-white border border-purple-200"
          data-ocid="messenger.ai_reply.dialog"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              ✨ AI Draft Reply
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Review and edit before sending:
            </p>
            <Textarea
              value={aiReplyText}
              onChange={(e) => setAIReplyText(e.target.value)}
              className="min-h-[80px] border-purple-200 focus:ring-purple-400"
              data-ocid="messenger.ai_reply.textarea"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAIReply(false)}
                data-ocid="messenger.ai_reply.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (aiReplyText.trim()) {
                    onSendMessage(aiReplyText.trim());
                    setShowAIReply(false);
                    setAIReplyText("");
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                data-ocid="messenger.ai_reply.submit_button"
              >
                <Send className="w-4 h-4 mr-1" /> Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Activity Modal */}
      <ShareActivityModal
        open={showShareActivity}
        onClose={() => setShowShareActivity(false)}
        onSend={(payload) => {
          onSendTaskRequest(payload);
        }}
      />

      {/* Share Business Doc Modal */}
      <ShareBusinessDocModal
        open={showShareDoc}
        onClose={() => setShowShareDoc(false)}
        onSend={(payload) => {
          onSendBusinessDoc(payload);
        }}
        cachedDocs={cachedDocs}
        cachedClients={cachedClients}
      />
      <RequestChangeDrawer
        msg={requestChangeMsg}
        onClose={() => setRequestChangeMsg(null)}
        onSubmit={handleRequestChangeSubmit}
      />
    </div>
  );

  function renderComposer() {
    return (
      <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
        {!canPost ? (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <span>Only admins can post in this group</span>
          </div>
        ) : (
          <>
            {/* Inline Task Card */}
            {showInlineTask && (
              <div
                className="mb-2 p-3 rounded-xl border border-blue-500/40 bg-blue-950/30"
                data-ocid="messenger.inline_task.card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400 font-semibold text-sm">
                    📌 New Task
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInlineTask(false)}
                    className="ml-auto text-stone-500 hover:text-stone-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={taskFields.who}
                    onChange={(e) =>
                      setTaskFields((p) => ({ ...p, who: e.target.value }))
                    }
                    placeholder="Who (assignee)"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    data-ocid="messenger.inline_task.input"
                  />
                  <input
                    type="text"
                    value={taskFields.what}
                    onChange={(e) =>
                      setTaskFields((p) => ({ ...p, what: e.target.value }))
                    }
                    placeholder="What (task description)"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input
                    type="text"
                    value={taskFields.when}
                    onChange={(e) =>
                      setTaskFields((p) => ({ ...p, when: e.target.value }))
                    }
                    placeholder="When (due date/time)"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input
                    type="text"
                    value={taskFields.where}
                    onChange={(e) =>
                      setTaskFields((p) => ({ ...p, where: e.target.value }))
                    }
                    placeholder="Where (location, optional)"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <textarea
                    value={taskFields.why}
                    onChange={(e) =>
                      setTaskFields((p) => ({ ...p, why: e.target.value }))
                    }
                    placeholder="Why (reason/context, optional)"
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineTask(false)}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white transition-colors"
                    data-ocid="messenger.inline_task.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!taskFields.what.trim()) return;
                      try {
                        const acts = JSON.parse(
                          localStorage.getItem("saarathi_activities") || "[]",
                        );
                        acts.push({
                          id: `act_${Date.now()}`,
                          who: taskFields.who
                            ? taskFields.who
                                .split(",")
                                .map((s: string) => s.trim())
                                .filter(Boolean)
                            : [],
                          what: taskFields.what,
                          when: taskFields.when || "today",
                          where: taskFields.where,
                          why: taskFields.why,
                          status: "pending",
                          createdAt: new Date().toISOString(),
                          sourceChat: true,
                        });
                        localStorage.setItem(
                          "saarathi_activities",
                          JSON.stringify(acts),
                        );
                      } catch {}
                      onSendMessage(
                        `📌 Task created: ${taskFields.what}${taskFields.who ? ` — assigned to ${taskFields.who}` : ""}`,
                      );
                      setShowInlineTask(false);
                      setTaskFields({
                        who: "",
                        what: "",
                        when: "",
                        where: "",
                        why: "",
                      });
                      toast.success("Task created");
                    }}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    data-ocid="messenger.inline_task.submit_button"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            )}

            {/* Inline Proposal Card */}
            {showInlineProposal && (
              <div
                className="mb-2 p-3 rounded-xl border border-purple-500/40 bg-purple-950/30"
                data-ocid="messenger.inline_proposal.card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 font-semibold text-sm">
                    📋 New Proposal
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInlineProposal(false)}
                    className="ml-auto text-stone-500 hover:text-stone-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={proposalFields.client}
                    onChange={(e) =>
                      setProposalFields((p) => ({
                        ...p,
                        client: e.target.value,
                      }))
                    }
                    placeholder="Client Name"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    data-ocid="messenger.inline_proposal.input"
                  />
                  <input
                    type="text"
                    value={proposalFields.title}
                    onChange={(e) =>
                      setProposalFields((p) => ({
                        ...p,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Proposal Title"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input
                    type="number"
                    value={proposalFields.amount}
                    onChange={(e) =>
                      setProposalFields((p) => ({
                        ...p,
                        amount: Number(e.target.value),
                      }))
                    }
                    placeholder="Amount (₹)"
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineProposal(false)}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white transition-colors"
                    data-ocid="messenger.inline_proposal.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!proposalFields.client.trim()) return;
                      const today = new Date().toISOString().slice(0, 10);
                      const currentChatKey = currentChat
                        ? currentChat.type === "group"
                          ? `group_${(currentChat as { groupId: string }).groupId}`
                          : `dm_${(currentChat as { userId: string }).userId}`
                        : "";
                      // Find or create client
                      const activeClients2 =
                        cachedClients && cachedClients.length > 0
                          ? cachedClients
                          : (() => {
                              try {
                                return JSON.parse(
                                  localStorage.getItem("saarathi_clients") ||
                                    "[]",
                                );
                              } catch {
                                return [];
                              }
                            })();
                      let clientId = activeClients2.find(
                        (c: { name: string }) =>
                          c.name === proposalFields.client,
                      )?.id;
                      if (!clientId) {
                        clientId = onSaveClient
                          ? await onSaveClient(proposalFields.client)
                          : `client_prop_${Date.now()}`;
                        if (!onSaveClient) {
                          try {
                            const cl = JSON.parse(
                              localStorage.getItem("saarathi_clients") || "[]",
                            );
                            cl.push({
                              id: clientId,
                              name: proposalFields.client,
                            });
                            localStorage.setItem(
                              "saarathi_clients",
                              JSON.stringify(cl),
                            );
                          } catch {}
                        }
                      }
                      if (onSaveDoc) {
                        await onSaveDoc(
                          "proposal",
                          clientId || "",
                          [
                            {
                              productId: "",
                              description: proposalFields.title || "Services",
                              hsnSac: "",
                              qty: 1,
                              unit: "nos",
                              rate: proposalFields.amount,
                              gstRate: 18,
                            },
                          ],
                          today,
                          today,
                          proposalFields.title,
                          currentChatKey,
                        );
                      } else {
                        try {
                          const docs = JSON.parse(
                            localStorage.getItem("saarathi_business_docs") ||
                              "[]",
                          );
                          const propNum = `PROP-${String(docs.filter((d: { type: string }) => d.type === "proposal").length + 1).padStart(3, "0")}`;
                          docs.push({
                            id: `prop_${Date.now()}`,
                            type: "proposal",
                            number: propNum,
                            date: today,
                            clientId: clientId || "",
                            status: "draft",
                            notes: proposalFields.title,
                            lineItems: [
                              {
                                id: "1",
                                description: proposalFields.title || "Services",
                                qty: 1,
                                rate: proposalFields.amount,
                                gstRate: 18,
                              },
                            ],
                          });
                          localStorage.setItem(
                            "saarathi_business_docs",
                            JSON.stringify(docs),
                          );
                          window.dispatchEvent(
                            new CustomEvent("saarathi:docs-updated"),
                          );
                        } catch {}
                      }
                      onSendMessage(
                        `📋 Proposal ${proposalFields.title ? `"${proposalFields.title}" ` : ""}sent to ${proposalFields.client}`,
                      );
                      setShowInlineProposal(false);
                      setProposalFields({
                        client: "",
                        title: "",
                        amount: 10000,
                      });
                      toast.success("Proposal created");
                    }}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    data-ocid="messenger.inline_proposal.submit_button"
                  >
                    Send Proposal
                  </button>
                </div>
              </div>
            )}

            {/* Smart typing suggestions — contextual chips */}
            {!chipsHidden && contextualChips.length > 0 && (
              <div
                className="flex items-center gap-1.5 mb-2 flex-wrap"
                data-ocid="messenger.suggestions.panel"
              >
                {contextualChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setText(chip.draft)}
                    className="text-xs px-2.5 py-1 rounded-full bg-transparent border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors font-medium"
                    data-ocid="messenger.suggestion.button"
                  >
                    {chip.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setChipsHidden(true)}
                  className="ml-auto text-stone-500 hover:text-stone-300 text-xs px-1"
                  data-ocid="messenger.suggestions.close_button"
                  title="Hide suggestions"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Commitment hint */}
            {showCommitmentHint && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-amber-950/40 border border-amber-700/40 text-amber-300 text-xs">
                <span>⚠</span>
                <span className="flex-1">Create follow-up task?</span>
                <button
                  type="button"
                  onClick={() => {
                    markCommitmentActed(commitmentText);
                    setShowCommitmentHint(false);
                    onNavigate?.("activities");
                  }}
                  className="px-2 py-0.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-xs font-semibold"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommitmentHint(false)}
                  className="px-2 py-0.5 bg-transparent text-amber-400 hover:text-amber-200 text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Auto-invoice card */}
            {showAutoInvoice && autoInvoiceData && (
              <div
                className="mb-2 p-3 rounded-xl border border-amber-500/40 bg-amber-950/30"
                data-ocid="messenger.auto_invoice.card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-400 font-semibold text-sm">
                    💰 Invoice Draft
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAutoInvoice(false);
                      setInvoiceEditMode(false);
                    }}
                    className="ml-auto text-stone-500 hover:text-stone-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-stone-300 space-y-0.5 mb-2">
                  <div>
                    Client:{" "}
                    <span className="text-white font-medium">
                      {autoInvoiceData.client}
                    </span>
                  </div>
                  <div>
                    Amount:{" "}
                    <span className="text-amber-300 font-bold">
                      ₹
                      {autoInvoiceData.amount.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  {autoInvoiceData.basedOnPrevious && (
                    <div className="text-stone-500 italic">
                      Based on previous invoice
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!autoInvoiceData) return;
                      const today = new Date().toISOString().slice(0, 10);
                      const dueDate = new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000,
                      )
                        .toISOString()
                        .slice(0, 10);
                      const currentChatKey = currentChat
                        ? currentChat.type === "group"
                          ? `group_${(currentChat as { groupId: string }).groupId}`
                          : `dm_${(currentChat as { userId: string }).userId}`
                        : "";
                      const activeClients3 =
                        cachedClients && cachedClients.length > 0
                          ? cachedClients
                          : (() => {
                              try {
                                return JSON.parse(
                                  localStorage.getItem("saarathi_clients") ||
                                    "[]",
                                );
                              } catch {
                                return [];
                              }
                            })();
                      let clientId2 = activeClients3.find(
                        (c: { name: string }) =>
                          c.name === autoInvoiceData.client,
                      )?.id;
                      if (!clientId2) {
                        clientId2 = onSaveClient
                          ? await onSaveClient(autoInvoiceData.client)
                          : `client_auto_${Date.now()}`;
                        if (!onSaveClient) {
                          try {
                            const cl2 = JSON.parse(
                              localStorage.getItem("saarathi_clients") || "[]",
                            );
                            cl2.push({
                              id: clientId2,
                              name: autoInvoiceData.client,
                              state: "Maharashtra",
                              placeOfSupply: "Maharashtra",
                              phone: "",
                              email: "",
                              gstin: "",
                              address: "",
                            });
                            localStorage.setItem(
                              "saarathi_clients",
                              JSON.stringify(cl2),
                            );
                          } catch {}
                        }
                      }
                      let invNum = "INV-001";
                      if (onSaveDoc) {
                        await onSaveDoc(
                          "invoice",
                          clientId2 || "",
                          [
                            {
                              productId: "",
                              description: "Services",
                              hsnSac: "",
                              qty: 1,
                              unit: "nos",
                              rate: autoInvoiceData.amount,
                              gstRate: 18,
                            },
                          ],
                          today,
                          dueDate,
                          "",
                          currentChatKey,
                        );
                        const newDocs = (cachedDocs ?? []).filter(
                          (d) => "invoice" in d.docType,
                        );
                        invNum = `INV-${String(newDocs.length).padStart(3, "0")}`;
                      } else {
                        try {
                          const d2 = JSON.parse(
                            localStorage.getItem("saarathi_business_docs") ||
                              "[]",
                          );
                          invNum = `INV-${String(d2.filter((d: { type: string }) => d.type === "invoice").length + 1).padStart(3, "0")}`;
                          d2.push({
                            id: `inv_auto_${Date.now()}`,
                            type: "invoice",
                            number: invNum,
                            date: today,
                            dueDate,
                            clientId: clientId2 || "",
                            status: "sent",
                            notes: "",
                            lineItems: [
                              {
                                id: "1",
                                description: "Services",
                                qty: 1,
                                rate: autoInvoiceData.amount,
                                gstRate: 18,
                              },
                            ],
                          });
                          localStorage.setItem(
                            "saarathi_business_docs",
                            JSON.stringify(d2),
                          );
                          window.dispatchEvent(
                            new CustomEvent("saarathi:docs-updated"),
                          );
                        } catch {}
                      }
                      onSendMessage(
                        `📄 Invoice ${invNum} sent to ${autoInvoiceData.client}`,
                      );
                      setShowAutoInvoice(false);
                      toast.success("Invoice created and sent");
                    }}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    data-ocid="messenger.auto_invoice.send_button"
                  >
                    Send Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvFormClient(autoInvoiceData.client);
                      setInvFormAmount(autoInvoiceData.amount);
                      setInvFormGst(18);
                      setInvFormDate(new Date().toISOString().slice(0, 10));
                      setInvFormDesc("Professional services");
                      setInvoiceEditMode(true);
                    }}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white transition-colors"
                    data-ocid="messenger.auto_invoice.edit_button"
                  >
                    Edit
                  </button>
                </div>

                {invoiceEditMode && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
                    <p className="text-xs text-amber-400 font-semibold">
                      Edit Invoice
                    </p>
                    <div className="space-y-1.5">
                      <div className="space-y-1">
                        <span className="text-xs text-stone-400">Client</span>
                        {(() => {
                          const clientList =
                            cachedClients && cachedClients.length > 0
                              ? cachedClients
                              : (() => {
                                  try {
                                    return JSON.parse(
                                      localStorage.getItem(
                                        "saarathi_clients",
                                      ) || "[]",
                                    );
                                  } catch {
                                    return [];
                                  }
                                })();
                          return (
                            <select
                              value={invFormClient}
                              onChange={(e) => {
                                if (e.target.value === "__new__") {
                                  setShowNewClientForm(true);
                                } else {
                                  setInvFormClient(e.target.value);
                                  setShowNewClientForm(false);
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                            >
                              <option value="">-- Select Client --</option>
                              {clientList.map(
                                (c: { id: string; name: string }) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ),
                              )}
                              <option value="__new__">+ Add New Client</option>
                            </select>
                          );
                        })()}
                        {showNewClientForm && (
                          <div className="p-2 rounded-lg bg-stone-900 border border-amber-500/30 space-y-1.5">
                            <p className="text-xs text-amber-400 font-medium">
                              New Client
                            </p>
                            <input
                              type="text"
                              value={newClientName}
                              onChange={(e) => setNewClientName(e.target.value)}
                              placeholder="Client Name *"
                              className="w-full px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <input
                              type="text"
                              value={newClientPhone}
                              onChange={(e) =>
                                setNewClientPhone(e.target.value)
                              }
                              placeholder="Phone (optional)"
                              className="w-full px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!newClientName.trim()) return;
                                  if (onSaveClient) {
                                    await onSaveClient(newClientName.trim());
                                  } else {
                                    try {
                                      const clients = JSON.parse(
                                        localStorage.getItem(
                                          "saarathi_clients",
                                        ) || "[]",
                                      );
                                      clients.push({
                                        id: `client_${Date.now()}`,
                                        name: newClientName.trim(),
                                        phone: newClientPhone.trim(),
                                        email: "",
                                        gstin: "",
                                        address: "",
                                      });
                                      localStorage.setItem(
                                        "saarathi_clients",
                                        JSON.stringify(clients),
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent(
                                          "saarathi:clients-updated",
                                        ),
                                      );
                                    } catch {}
                                  }
                                  setInvFormClient(newClientName.trim());
                                  setNewClientName("");
                                  setNewClientPhone("");
                                  setShowNewClientForm(false);
                                  toast.success("Client added");
                                }}
                                className="flex-1 text-xs py-1 rounded bg-amber-500 hover:bg-amber-600 text-white"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewClientForm(false)}
                                className="px-3 text-xs py-1 rounded bg-stone-700 text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="date"
                        value={invFormDate}
                        onChange={(e) => setInvFormDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <div className="space-y-1">
                        <span className="text-xs text-stone-400">
                          Products / Services
                        </span>
                        {invFormLineItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-lg bg-stone-900 border border-stone-700 space-y-1"
                          >
                            <div className="flex gap-1">
                              {(() => {
                                const storedProducts = (() => {
                                  try {
                                    return JSON.parse(
                                      localStorage.getItem(
                                        "saarathi_products",
                                      ) || "[]",
                                    );
                                  } catch {
                                    return [];
                                  }
                                })();
                                return (
                                  <select
                                    value={item.description}
                                    onChange={(e) => {
                                      if (e.target.value === "__new__") {
                                        setShowNewProductForm(true);
                                        return;
                                      }
                                      const prod = storedProducts.find(
                                        (p: {
                                          name: string;
                                          price: number;
                                          gstRate: number;
                                        }) => p.name === e.target.value,
                                      );
                                      setInvFormLineItems((prev) =>
                                        prev.map((li, i) =>
                                          i === idx
                                            ? {
                                                ...li,
                                                description: e.target.value,
                                                rate: prod
                                                  ? prod.price
                                                  : li.rate,
                                                gstRate: prod
                                                  ? (prod.gstRate ?? 18)
                                                  : li.gstRate,
                                              }
                                            : li,
                                        ),
                                      );
                                    }}
                                    className="flex-1 px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  >
                                    <option value="">
                                      -- Select Product --
                                    </option>
                                    {storedProducts.map(
                                      (p: { id: string; name: string }) => (
                                        <option key={p.id} value={p.name}>
                                          {p.name}
                                        </option>
                                      ),
                                    )}
                                    <option
                                      value={item.description || "Custom"}
                                    >
                                      {item.description || "Custom item"}
                                    </option>
                                    <option value="__new__">
                                      + New Product
                                    </option>
                                  </select>
                                );
                              })()}
                              <button
                                type="button"
                                onClick={() =>
                                  setInvFormLineItems((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                className="px-2 text-xs text-red-400 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) =>
                                  setInvFormLineItems((prev) =>
                                    prev.map((li, i) =>
                                      i === idx
                                        ? { ...li, qty: Number(e.target.value) }
                                        : li,
                                    ),
                                  )
                                }
                                placeholder="Qty"
                                className="w-16 px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                              <input
                                type="number"
                                value={Math.round(item.rate)}
                                onChange={(e) =>
                                  setInvFormLineItems((prev) =>
                                    prev.map((li, i) =>
                                      i === idx
                                        ? {
                                            ...li,
                                            rate: Number(e.target.value),
                                          }
                                        : li,
                                    ),
                                  )
                                }
                                placeholder="Rate ₹"
                                className="flex-1 px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                              <select
                                value={item.gstRate}
                                onChange={(e) =>
                                  setInvFormLineItems((prev) =>
                                    prev.map((li, i) =>
                                      i === idx
                                        ? {
                                            ...li,
                                            gstRate: Number(e.target.value),
                                          }
                                        : li,
                                    ),
                                  )
                                }
                                className="w-20 px-1 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                              >
                                {[0, 5, 12, 18, 28].map((r) => (
                                  <option key={r} value={r}>
                                    GST {r}%
                                  </option>
                                ))}
                              </select>
                            </div>
                            <p className="text-xs text-stone-400 text-right">
                              ₹
                              {(
                                item.qty *
                                item.rate *
                                (1 + item.gstRate / 100)
                              ).toLocaleString("en-IN", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              (incl. GST)
                            </p>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setInvFormLineItems((prev) => [
                              ...prev,
                              {
                                id: `li_${Date.now()}`,
                                description: "",
                                qty: 1,
                                rate:
                                  invFormAmount > 0
                                    ? invFormAmount / 1.18
                                    : 1000,
                                gstRate: invFormGst,
                              },
                            ])
                          }
                          className="w-full text-xs py-1.5 rounded-lg border border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          + Add Product / Service
                        </button>
                        {invFormLineItems.length > 0 && (
                          <div className="flex justify-between text-xs pt-1 border-t border-stone-700">
                            <span className="text-stone-400">
                              Total (incl. GST)
                            </span>
                            <span className="text-amber-400 font-semibold">
                              ₹
                              {invFormLineItems
                                .reduce(
                                  (s, i) =>
                                    s + i.qty * i.rate * (1 + i.gstRate / 100),
                                  0,
                                )
                                .toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}
                            </span>
                          </div>
                        )}
                        {invFormLineItems.length === 0 && (
                          <div>
                            <input
                              type="number"
                              value={invFormAmount}
                              onChange={(e) =>
                                setInvFormAmount(Number(e.target.value))
                              }
                              placeholder="Amount (₹)"
                              className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <p className="text-xs text-stone-500 mt-0.5">
                              Or add products above for itemized invoice
                            </p>
                          </div>
                        )}
                      </div>
                      {showNewProductForm && (
                        <div className="p-2 rounded-lg bg-stone-900 border border-amber-500/30 space-y-1.5">
                          <p className="text-xs text-amber-400 font-medium">
                            New Product / Service
                          </p>
                          <input
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="Product Name *"
                            className="w-full px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={newProductRate}
                              onChange={(e) =>
                                setNewProductRate(Number(e.target.value))
                              }
                              placeholder="Price ₹"
                              className="flex-1 px-2 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <select
                              value={newProductGst}
                              onChange={(e) =>
                                setNewProductGst(Number(e.target.value))
                              }
                              className="w-20 px-1 py-1 text-xs rounded bg-stone-800 border border-stone-600 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                            >
                              {[0, 5, 12, 18, 28].map((r) => (
                                <option key={r} value={r}>
                                  GST {r}%
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newProductName.trim()) return;
                                if (onSaveProduct) {
                                  await onSaveProduct(
                                    newProductName.trim(),
                                    newProductRate,
                                    newProductGst,
                                  );
                                } else {
                                  try {
                                    const products = JSON.parse(
                                      localStorage.getItem(
                                        "saarathi_products",
                                      ) || "[]",
                                    );
                                    products.push({
                                      id: `prod_${Date.now()}`,
                                      name: newProductName.trim(),
                                      price: newProductRate,
                                      gstRate: newProductGst,
                                      unit: "nos",
                                      description: "",
                                    });
                                    localStorage.setItem(
                                      "saarathi_products",
                                      JSON.stringify(products),
                                    );
                                    window.dispatchEvent(
                                      new CustomEvent(
                                        "saarathi:products-updated",
                                      ),
                                    );
                                  } catch {}
                                }
                                setInvFormLineItems((prev) => [
                                  ...prev,
                                  {
                                    id: `li_${Date.now()}`,
                                    description: newProductName.trim(),
                                    qty: 1,
                                    rate: newProductRate,
                                    gstRate: newProductGst,
                                  },
                                ]);
                                setNewProductName("");
                                setNewProductRate(0);
                                setNewProductGst(18);
                                setShowNewProductForm(false);
                                toast.success("Product added");
                              }}
                              className="flex-1 text-xs py-1 rounded bg-amber-500 hover:bg-amber-600 text-white"
                            >
                              Save & Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowNewProductForm(false)}
                              className="px-3 text-xs py-1 rounded bg-stone-700 text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={invFormDesc}
                        onChange={(e) => setInvFormDesc(e.target.value)}
                        placeholder="Notes (optional)"
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs rounded-lg bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceEditMode(false);
                          setShowNewClientForm(false);
                          setShowNewProductForm(false);
                        }}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white transition-colors"
                        data-ocid="messenger.auto_invoice.cancel_button"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const currentChatKey = currentChat
                            ? currentChat.type === "group"
                              ? `group_${(currentChat as { groupId: string }).groupId}`
                              : `dm_${(currentChat as { userId: string }).userId}`
                            : "";
                          const activeClients4 =
                            cachedClients && cachedClients.length > 0
                              ? cachedClients
                              : (() => {
                                  try {
                                    return JSON.parse(
                                      localStorage.getItem(
                                        "saarathi_clients",
                                      ) || "[]",
                                    );
                                  } catch {
                                    return [];
                                  }
                                })();
                          let clientId3 = activeClients4.find(
                            (c: { name: string }) => c.name === invFormClient,
                          )?.id;
                          if (!clientId3 && invFormClient) {
                            clientId3 = onSaveClient
                              ? await onSaveClient(invFormClient)
                              : `client_auto_${Date.now()}`;
                            if (!onSaveClient) {
                              try {
                                const cl3 = JSON.parse(
                                  localStorage.getItem("saarathi_clients") ||
                                    "[]",
                                );
                                cl3.push({
                                  id: clientId3,
                                  name: invFormClient,
                                  phone: "",
                                  email: "",
                                  gstin: "",
                                  address: "",
                                });
                                localStorage.setItem(
                                  "saarathi_clients",
                                  JSON.stringify(cl3),
                                );
                              } catch {}
                            }
                          }
                          const lineItemsToSave =
                            invFormLineItems.length > 0
                              ? invFormLineItems.map((li) => ({
                                  productId: "",
                                  description: li.description || invFormDesc,
                                  hsnSac: "",
                                  qty: li.qty,
                                  unit: "nos",
                                  rate: li.rate,
                                  gstRate: li.gstRate,
                                }))
                              : [
                                  {
                                    productId: "",
                                    description: invFormDesc,
                                    hsnSac: "",
                                    qty: 1,
                                    unit: "nos",
                                    rate:
                                      invFormAmount / (1 + invFormGst / 100),
                                    gstRate: invFormGst,
                                  },
                                ];
                          let invNum2 = "INV-001";
                          if (onSaveDoc) {
                            await onSaveDoc(
                              "invoice",
                              clientId3 || "",
                              lineItemsToSave,
                              invFormDate,
                              invFormDate,
                              invFormDesc,
                              currentChatKey,
                            );
                            const newDocs2 = (cachedDocs ?? []).filter(
                              (d) => "invoice" in d.docType,
                            );
                            invNum2 = `INV-${String(newDocs2.length).padStart(3, "0")}`;
                          } else {
                            try {
                              const d3 = JSON.parse(
                                localStorage.getItem(
                                  "saarathi_business_docs",
                                ) || "[]",
                              );
                              invNum2 = `INV-${String(d3.filter((d: { type: string }) => d.type === "invoice").length + 1).padStart(3, "0")}`;
                              d3.push({
                                id: `inv_edit_${Date.now()}`,
                                type: "invoice",
                                number: invNum2,
                                date: invFormDate,
                                dueDate: invFormDate,
                                clientId: clientId3 || "",
                                status: "sent",
                                notes: invFormDesc,
                                lineItems: lineItemsToSave.map((li, i) => ({
                                  id: `li${i}`,
                                  description: li.description,
                                  qty: li.qty,
                                  rate: li.rate,
                                  gstRate: li.gstRate,
                                })),
                              });
                              localStorage.setItem(
                                "saarathi_business_docs",
                                JSON.stringify(d3),
                              );
                              window.dispatchEvent(
                                new CustomEvent("saarathi:docs-updated"),
                              );
                            } catch {}
                          }
                          onSendMessage(
                            `📄 Invoice ${invNum2} sent to ${invFormClient}`,
                          );
                          setInvoiceEditMode(false);
                          setShowAutoInvoice(false);
                          setShowNewClientForm(false);
                          setShowNewProductForm(false);
                          setInvFormLineItems([]);
                          toast.success("Invoice created successfully");
                        }}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                        data-ocid="messenger.auto_invoice.confirm_button"
                      >
                        Send Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File preview */}
            {pendingFile && (
              <div className="mb-2 flex items-center gap-2">
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
              <button
                type="button"
                onClick={() => setShowShareActivity(true)}
                className="p-2 text-amber-500 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50 flex-shrink-0 mb-0.5"
                title="Share Activity as Task Request"
                data-ocid="messenger.share_activity.open_modal_button"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowShareDoc(true)}
                className="p-2 text-blue-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 flex-shrink-0 mb-0.5"
                title="Send Invoice / Proposal"
                data-ocid="messenger.share_doc.open_modal_button"
              >
                <Briefcase className="w-4 h-4" />
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

            {/* Dynamic AI Action Bar */}
            <div
              className="mt-2 border border-amber-500/30 bg-amber-950/20 rounded-xl px-3 py-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              data-ocid="messenger.ai_action.panel"
            >
              {hasContextualButtons && (
                <p className="text-[10px] text-purple-400 font-medium mb-1">
                  AI suggests:
                </p>
              )}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleAIReply}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors font-medium"
                  data-ocid="messenger.ai_reply.button"
                >
                  ✨ AI Reply
                </button>
                {(showFallbackAll || showMeeting) && (
                  <button
                    type="button"
                    onClick={handleCreateTaskFromChat}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
                    data-ocid="messenger.schedule_meeting.button"
                  >
                    📌 Schedule Meeting
                  </button>
                )}
                {(showFallbackAll || showTaskBtn) && (
                  <button
                    type="button"
                    onClick={handleCreateTaskFromChat}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-medium"
                    data-ocid="messenger.create_task.button"
                  >
                    📌 Create Task
                  </button>
                )}
                {(showFallbackAll || showInvoiceBtn) && (
                  <button
                    type="button"
                    onClick={handleCreateInvoiceFromChat}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium"
                    data-ocid="messenger.create_invoice.button"
                  >
                    💰 Create Invoice
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}
