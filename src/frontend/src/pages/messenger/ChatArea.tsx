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
  const [autoInvoiceData, setAutoInvoiceData] = useState<{
    client: string;
    amount: number;
    basedOnPrevious: boolean;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger scroll on message count change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgCount]);

  // Reset hints when chat changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentChat is a prop, intentional
  useEffect(() => {
    setShowCommitmentHint(false);
    setShowAutoInvoice(false);
    setAutoInvoiceData(null);
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

  const SUGGESTION_TEMPLATES: Record<string, string> = {
    "Reply politely":
      "Thank you for reaching out. I appreciate your patience and will get back to you shortly.",
    "Ask for payment":
      "Hi, just a gentle reminder that the payment for our recent work is due. Please let me know if you have any questions.",
    "Schedule meeting":
      "Could we schedule a quick meeting to discuss this? Please let me know your availability.",
  };

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
    const who = [...new Set(capitalizedWords)].slice(0, 2);
    const what = (
      lastFive[lastFive.length - 1]?.content ?? "Follow up task"
    ).slice(0, 60);
    let when = "today";
    if (allText.toLowerCase().includes("tomorrow")) when = "tomorrow";
    else if (allText.toLowerCase().includes("next week")) when = "next week";
    const prefill = {
      who,
      what,
      when,
      chatTarget: {
        type: currentChat?.type,
        name:
          currentChat?.type === "dm"
            ? (currentChat as { displayName: string }).displayName
            : (currentChat as { name: string }).name,
      },
    };
    try {
      localStorage.setItem(
        "saarathi_prefill_activity",
        JSON.stringify(prefill),
      );
    } catch {}
    if (onNavigate) onNavigate("activities");
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
    const prefill = { clientName, chatContext: allText.slice(0, 200) };
    try {
      localStorage.setItem("saarathi_prefill_invoice", JSON.stringify(prefill));
    } catch {}
    if (onNavigate) onNavigate("business");
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
                    Start conversation or use AI to draft message ✨ — use the
                    AI Action Bar below
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
            {renderComposer()}
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
        <>
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
              />
            ))}
          </div>
          {renderComposer()}
        </>
      )}

      {/* AI Reply Preview Dialog */}
      <Dialog
        open={showAIReply}
        onOpenChange={(v) => !v && setShowAIReply(false)}
      >
        <DialogContent
          className="sm:max-w-md bg-white border border-purple-200"
          data-ocid="messenger.ai_reply.dialog"
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
            {/* Smart typing suggestions */}
            {suggestions.length > 0 && (
              <div
                className="flex gap-1.5 mb-2 flex-wrap"
                data-ocid="messenger.suggestions.panel"
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setText(SUGGESTION_TEMPLATES[s] ?? s)}
                    className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors font-medium"
                    data-ocid="messenger.suggestion.button"
                  >
                    💡 {s}
                  </button>
                ))}
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
                    💰 Invoice Draft Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAutoInvoice(false)}
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
                    onClick={() => {
                      try {
                        const storedDocs2 = JSON.parse(
                          localStorage.getItem("saarathi_business_docs") ||
                            "[]",
                        );
                        const storedClients2 = JSON.parse(
                          localStorage.getItem("saarathi_clients") || "[]",
                        );
                        let clientId2 = storedClients2.find(
                          (c: { name: string; id: string }) =>
                            c.name === autoInvoiceData.client,
                        )?.id;
                        if (!clientId2) {
                          clientId2 = `client_auto_${Date.now()}`;
                          storedClients2.push({
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
                            JSON.stringify(storedClients2),
                          );
                        }
                        const invNum = `INV-${String(storedDocs2.filter((d: { type: string }) => d.type === "invoice").length + 1).padStart(3, "0")}`;
                        const newInv = {
                          id: `inv_auto_${Date.now()}`,
                          type: "invoice",
                          number: invNum,
                          date: new Date().toISOString().slice(0, 10),
                          dueDate: new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000,
                          )
                            .toISOString()
                            .slice(0, 10),
                          clientId: clientId2,
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
                        };
                        storedDocs2.push(newInv);
                        localStorage.setItem(
                          "saarathi_business_docs",
                          JSON.stringify(storedDocs2),
                        );
                        window.dispatchEvent(
                          new CustomEvent("saarathi:docs-updated"),
                        );
                        onSendMessage(
                          `📄 Invoice ${invNum} sent to ${autoInvoiceData.client}`,
                        );
                      } catch {}
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
                      try {
                        localStorage.setItem(
                          "saarathi_prefill_invoice",
                          JSON.stringify({
                            clientName: autoInvoiceData.client,
                            amount: autoInvoiceData.amount,
                          }),
                        );
                      } catch {}
                      setShowAutoInvoice(false);
                      onNavigate?.("business");
                    }}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white transition-colors"
                    data-ocid="messenger.auto_invoice.edit_button"
                  >
                    Edit
                  </button>
                </div>
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
            <div className="mt-2" data-ocid="messenger.ai_action.panel">
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
