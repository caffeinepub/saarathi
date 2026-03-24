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
}: {
  open: boolean;
  onClose: () => void;
  onSend: (payload: BusinessDocPayload) => void;
}) {
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
    setSelected(null);
  }, [open]);

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
}: {
  msg: LocalMessage;
  isOwn: boolean;
  onUpdateStatus: (msgId: string, status: TaskRequestStatus) => void;
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
      {/* Card Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 flex items-center gap-2">
        <MessageSquarePlus className="w-4 h-4 text-white flex-shrink-0" />
        <span className="text-white font-semibold text-xs uppercase tracking-wide">
          Task Request
        </span>
        <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
          {TASK_TYPE_LABELS[tp.taskType] ?? tp.taskType}
        </span>
      </div>

      {/* Card Body */}
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

      {/* Actions / Status */}
      <div className="px-3 pb-3">
        {isOwn ? (
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
              onClick={() => onUpdateStatus(msg.id, "change_requested")}
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
}: {
  msg: LocalMessage;
  isOwn: boolean;
  onUpdateTaskStatus: (msgId: string, status: TaskRequestStatus) => void;
}) {
  if (msg.msgType === "task_request") {
    return (
      <div
        className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
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
          className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
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
        className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
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
          className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
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
}: Props) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showShareActivity, setShowShareActivity] = useState(false);
  const [showShareDoc, setShowShareDoc] = useState(false);
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
            onUpdateTaskStatus={onUpdateTaskStatus}
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
        )}
      </div>

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
      />
    </div>
  );
}
