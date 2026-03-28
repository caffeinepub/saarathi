import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  File,
  FileText,
  ImageIcon,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Target,
  Upload,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MapPickerModal from "../components/MapPickerModal";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import { dataStore } from "../store/dataStore";
import {
  type CanisterActivity,
  activityStatusToCanister,
  asExtended,
  canisterStatusToActivity,
  canisterTaskTypeToLocal,
  taskTypeToCanister,
} from "../utils/backendExtensions";

// ─── Types ───────────────────────────────────────────────────────────────────
type TaskType = "meeting" | "groupTask" | "other";
type ActivityStatus =
  | "pending"
  | "inProgress"
  | "completed"
  | "change_requested";

interface ActivityAttachment {
  id: string;
  type: "invoice" | "estimate" | "proposal" | "image" | "pdf";
  name: string;
  docId?: string;
  dataUrl?: string;
}

interface Activity {
  id: string;
  title: string;
  taskType: TaskType;
  assignees: string[];
  groupId?: string;
  dateTime: string;
  deadline: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  notes: string;
  status: ActivityStatus;
  createdBy: string;
  createdAt: number;
  messengerSent: boolean;
  isDemo?: boolean;
  attachments?: ActivityAttachment[];
  chatThreadId?: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_GROUPS = ["Sales Team", "Accounts", "Operations", "Management"];

// ─── Auto Priority ────────────────────────────────────────────────────────────
function computePriority(
  activity: Activity,
): "urgent" | "action_needed" | null {
  const today = new Date().toISOString().slice(0, 10);
  const actDate = activity.dateTime?.slice(0, 10) ?? "";
  if (actDate === today) return "urgent";
  const lower = activity.title.toLowerCase();
  if (lower.includes("send") || lower.includes("review"))
    return "action_needed";
  return null;
}

const _INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    title: "GST Return Filing — Q4",
    taskType: "groupTask",
    assignees: ["Suresh Mehta"],
    groupId: "Accounts & GST",
    dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Online — GST Portal",
    notes:
      "File GSTR-1 for Q4. Ensure all B2B invoices are uploaded and input tax credit is reconciled before filing.",
    status: "pending",
    createdBy: "Admin",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    messengerSent: true,
    isDemo: true,
  },
  {
    id: "a2",
    title: "Follow-up Call — Verma Industries",
    taskType: "meeting",
    assignees: ["Kavya Nair"],
    groupId: "Client Projects",
    dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Phone / Google Meet",
    notes:
      "Discuss revised pricing and project timeline for the import consulting engagement. Key contact: Mr. Rajan Verma, MD. Ask about advance payment.",
    status: "pending",
    createdBy: "Admin",
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    messengerSent: true,
    isDemo: true,
  },
  {
    id: "a3",
    title: "Send Revised Proposal — Kapoor Exports",
    taskType: "groupTask",
    assignees: ["Kavya Nair", "Suresh Mehta"],
    groupId: "Client Projects",
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Email / SAARATHI Messenger",
    notes:
      "Send revised estimate (EST-001) to Kapoor Exports after Suresh confirms GST applicability. Target: ₹96,000 with 18% GST.",
    status: "inProgress",
    createdBy: "Admin",
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    messengerSent: false,
    isDemo: true,
  },
  {
    id: "a4",
    title: "Collect Advance Payment — Verma Industries",
    taskType: "groupTask",
    assignees: ["Kavya Nair"],
    groupId: "Client Projects",
    dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Bank Transfer / UPI",
    notes:
      "Collect 30% advance (approx ₹10,500) before project kickoff. Client has agreed to upfront payment. Follow up if not received by deadline.",
    status: "pending",
    createdBy: "Admin",
    createdAt: Date.now() - 30 * 60 * 1000,
    messengerSent: false,
    isDemo: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function isOverdue(deadline: string, status: ActivityStatus) {
  if (status === "completed" || !deadline) return false;
  return new Date(deadline) < new Date();
}
function nextStatus(s: ActivityStatus): ActivityStatus {
  if (s === "pending") return "inProgress";
  if (s === "inProgress") return "completed";
  if (s === "change_requested") return "pending";
  return "pending";
}

const STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  inProgress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  change_requested: {
    label: "🔁 Change Requested",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: AlertCircle,
  },
};

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; color: string }> = {
  meeting: { label: "Meeting", color: "bg-purple-100 text-purple-700" },
  groupTask: { label: "Group Task", color: "bg-cyan-100 text-cyan-700" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700" },
};

// ─── Activity Card ────────────────────────────────────────────────────────────
function ActivityCard({
  activity,
  index,
  onStatusChange,
  onSendToMessenger,
  onNudge,
  onMarkDone,
}: {
  activity: Activity;
  index: number;
  onStatusChange: (id: string) => void;
  onSendToMessenger: (activity: Activity) => void;
  onNudge: (activity: Activity, message: string) => void;
  onMarkDone: (id: string) => void;
}) {
  const sc = STATUS_CONFIG[activity.status];
  const tc = TASK_TYPE_CONFIG[activity.taskType];
  const overdue = isOverdue(activity.deadline, activity.status);
  const StatusIcon = sc.icon;
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeTone, setNudgeTone] = useState<"gentle" | "urgent" | "custom">(
    "gentle",
  );
  const [nudgeCustom, setNudgeCustom] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const deadlineDate = activity.deadline?.slice(0, 10);
  const isToday = deadlineDate === today;
  const overdueByDays =
    overdue && deadlineDate
      ? Math.ceil(
          (Date.now() - new Date(deadlineDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
  const dueTodayOrSoon =
    !overdue && deadlineDate && deadlineDate > today
      ? Math.ceil(
          (new Date(deadlineDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  const gentleMsg = `Hi, just a gentle reminder about "${activity.title}". Please take a look when you get a chance.`;
  const urgentMsg = `URGENT: Action required on "${activity.title}". This needs your immediate attention.`;

  function handleNudgeSend() {
    let msg = gentleMsg;
    if (nudgeTone === "urgent") msg = urgentMsg;
    else if (nudgeTone === "custom") msg = nudgeCustom || gentleMsg;
    onNudge(activity, msg);
    setNudgeOpen(false);
    setNudgeTone("gentle");
    setNudgeCustom("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`activity.item.${index + 1}`}
      className={`bg-white rounded-xl border shadow-card hover:shadow-md transition-shadow p-5 ${
        activity.status === "completed"
          ? "border-green-100 opacity-50"
          : activity.status === "inProgress"
            ? "border-blue-100 opacity-75"
            : overdue
              ? "border-l-4 border-l-red-500 border-red-100 animate-urgent-pulse"
              : isToday
                ? "border-amber-300 bg-amber-50/30"
                : "border-amber-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${tc.color}`}
            >
              {tc.label}
            </span>
            {activity.messengerSent && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Sent
              </span>
            )}
            {overdue && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                {overdueByDays > 0 ? `Overdue by ${overdueByDays}d` : "Overdue"}
              </span>
            )}
            {isToday && !overdue && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                ⏰ Due today
              </span>
            )}
            {dueTodayOrSoon > 0 && dueTodayOrSoon <= 2 && !isToday && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Due in {dueTodayOrSoon}d
              </span>
            )}
            {(() => {
              const p = computePriority(activity);
              if (p === "urgent")
                return (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                    🔴 Urgent
                  </span>
                );
              if (p === "action_needed")
                return (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                    ⚡ Action needed
                  </span>
                );
              return null;
            })()}
          </div>
          <h3 className="font-semibold text-foreground text-base leading-snug truncate">
            {activity.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${sc.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {activity.status === "inProgress" ? "Accepted" : sc.label}
          </span>
          {activity.status === "inProgress" && (
            <span className="text-[10px] text-blue-500">
              Waiting for completion
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">
            {activity.groupId ? `${activity.groupId} — ` : ""}
            {activity.assignees.join(", ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span>
            {formatDate(activity.dateTime)} {formatTime(activity.dateTime)}
          </span>
        </div>
        {activity.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            {activity.locationLat && activity.locationLng ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${activity.locationLat}&mlon=${activity.locationLng}#map=15/${activity.locationLat}/${activity.locationLng}`}
                target="_blank"
                rel="noreferrer"
                className="truncate text-orange-600 hover:underline flex items-center gap-1"
              >
                {activity.location}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <span className="truncate">{activity.location}</span>
            )}
          </div>
        )}
        {activity.deadline && (
          <div
            className={`flex items-center gap-2 ${overdue ? "text-red-600" : ""}`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Deadline: {formatDate(activity.deadline)}</span>
          </div>
        )}
      </div>

      {activity.notes && (
        <p className="text-xs text-muted-foreground bg-amber-50/60 rounded-lg px-3 py-2 mb-3 line-clamp-2">
          {activity.notes}
        </p>
      )}

      {activity.attachments && activity.attachments.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Paperclip className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          {activity.attachments.slice(0, 3).map((att) => (
            <span
              key={att.id}
              className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-100"
            >
              {att.type === "image" ? (
                <ImageIcon className="w-3 h-3" />
              ) : att.type === "pdf" ? (
                <File className="w-3 h-3" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              {att.name}
            </span>
          ))}
          {activity.attachments.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{activity.attachments.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {activity.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => onStatusChange(activity.id)}
            data-ocid={`activity.toggle.${index + 1}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Change Status
          </Button>
        )}
        {activity.status === "inProgress" && (
          <Button
            size="sm"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            onClick={() => onMarkDone(activity.id)}
            data-ocid={`activity.save_button.${index + 1}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Mark as Done
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={() => onSendToMessenger(activity)}
          disabled={activity.messengerSent}
          data-ocid={`activity.send_button.${index + 1}`}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {activity.messengerSent ? "Sent" : "Send to Messenger"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={`border-orange-200 text-orange-600 hover:bg-orange-50 px-2.5 ${nudgeOpen ? "bg-orange-50" : ""}`}
          onClick={() => setNudgeOpen((v) => !v)}
          title="Send nudge reminder to chat"
          data-ocid={`activity.toggle.${index + 1}`}
        >
          🔔 Nudge
        </Button>
      </div>

      {/* Inline nudge tone selector */}
      {nudgeOpen && (
        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100 space-y-2">
          <p className="text-xs font-semibold text-orange-700">
            Choose reminder tone:
          </p>
          <div className="flex gap-1.5">
            {(["gentle", "urgent", "custom"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setNudgeTone(t);
                  if (t !== "custom") setNudgeCustom("");
                }}
                className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                  nudgeTone === t
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-orange-600 border-orange-200 hover:bg-orange-100"
                }`}
                data-ocid={`activity.nudge_${t}.button`}
              >
                {t === "gentle"
                  ? "🤝 Gentle"
                  : t === "urgent"
                    ? "🚨 Urgent"
                    : "✏️ Custom"}
              </button>
            ))}
          </div>
          {nudgeTone === "custom" && (
            <textarea
              className="w-full text-xs p-2 border border-orange-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
              rows={2}
              placeholder="Custom reminder message..."
              value={nudgeCustom || gentleMsg}
              onChange={(e) => setNudgeCustom(e.target.value)}
              data-ocid="activity.nudge_custom.textarea"
            />
          )}
          {nudgeTone !== "custom" && (
            <p className="text-xs text-stone-500 italic line-clamp-2">
              "{nudgeTone === "gentle" ? gentleMsg : urgentMsg}"
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setNudgeOpen(false)}
              className="text-xs px-2.5 py-1 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
              data-ocid="activity.nudge_cancel.button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNudgeSend}
              className="text-xs px-2.5 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
              data-ocid="activity.nudge_send.button"
            >
              Send Nudge
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── New Activity Dialog ──────────────────────────────────────────────────────
function NewActivityDialog({
  open,
  onClose,
  onCreate,
  availableGroups,
  availableUsers,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (a: Activity) => void;
  availableGroups: string[];
  availableUsers: string[];
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("meeting");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [locationAddress, setLocationAddress] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<ActivityAttachment[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [businessDocs, setBusinessDocs] = useState<
    Array<{ id: string; type: string; number: string; clientName?: string }>
  >([]);

  function reset() {
    setTitle("");
    setTaskType("meeting");
    setAssigneeInput("");
    setAssignees([]);
    setShowSuggestions(false);
    setGroupId("");
    setDateTime("");
    setDeadline("");
    setLocation("");
    setLocationLat(undefined);
    setLocationLng(undefined);
    setLocationAddress(undefined);
    setNotes("");
    setAttachments([]);
    setShowMapPicker(false);
    setShowDocPicker(false);
  }

  function handleAddAssignee(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && assigneeInput.trim()) {
      e.preventDefault();
      setAssignees((prev) => [...prev, assigneeInput.trim()]);
      setAssigneeInput("");
    }
  }

  function handleSubmit() {
    if (!title.trim() || !dateTime) {
      toast.error("Title and date/time are required.");
      return;
    }
    const activity: Activity = {
      id: `a${Date.now()}`,
      title: title.trim(),
      taskType,
      assignees,
      groupId: groupId || undefined,
      dateTime,
      deadline,
      location,
      locationLat,
      locationLng,
      locationAddress,
      notes,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "pending",
      createdBy: "You",
      createdAt: Date.now(),
      messengerSent: false,
    };
    onCreate(activity);
    reset();
    onClose();
    toast.success("Activity created!");
  }

  const SECTION_STYLE = "rounded-xl border p-4 mb-4";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#fdf8f0] border border-amber-200"
        data-ocid="activity.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-foreground">
            New 5W Activity
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Dialog</DialogDescription>

        {/* WHO */}
        <div className={`${SECTION_STYLE} border-amber-200 bg-amber-50/40`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-amber-700 uppercase text-xs tracking-wider">
              WHO
            </span>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Add Assignees (press Enter)
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {assignees.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() =>
                      setAssignees(assignees.filter((x) => x !== a))
                    }
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <Input
                placeholder="Type name and press Enter..."
                value={assigneeInput}
                onChange={(e) => {
                  setAssigneeInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  handleAddAssignee(e);
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                data-ocid="activity.input"
                className="bg-white"
              />
              {showSuggestions &&
                availableUsers.filter(
                  (u) =>
                    u.toLowerCase().includes(assigneeInput.toLowerCase()) &&
                    !assignees.includes(u) &&
                    assigneeInput.length > 0,
                ).length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {availableUsers
                      .filter(
                        (u) =>
                          u
                            .toLowerCase()
                            .includes(assigneeInput.toLowerCase()) &&
                          !assignees.includes(u),
                      )
                      .map((u) => (
                        <button
                          key={u}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 text-stone-700"
                          onMouseDown={() => {
                            setAssignees((prev) => [...prev, u]);
                            setAssigneeInput("");
                            setShowSuggestions(false);
                          }}
                        >
                          {u}
                        </button>
                      ))}
                  </div>
                )}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Group (optional)
            </Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="bg-white" data-ocid="activity.select">
                <SelectValue placeholder="Select a group..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200">
                {availableGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* WHAT */}
        <div className={`${SECTION_STYLE} border-blue-200 bg-blue-50/30`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-blue-700 uppercase text-xs tracking-wider">
              WHAT
            </span>
          </div>
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Task Type
            </Label>
            <div className="flex gap-2">
              {(["meeting", "groupTask", "other"] as TaskType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTaskType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    taskType === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-muted-foreground border-border hover:border-blue-300"
                  }`}
                  data-ocid="activity.toggle"
                >
                  {t === "meeting"
                    ? "Meeting"
                    : t === "groupTask"
                      ? "Group Task"
                      : "Other"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Title *
            </Label>
            <Input
              placeholder="e.g. GST Filing Review..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white"
              data-ocid="activity.input"
            />
          </div>
        </div>

        {/* WHEN */}
        <div className={`${SECTION_STYLE} border-green-200 bg-green-50/30`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-green-700 uppercase text-xs tracking-wider">
              WHEN
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Date & Time *
              </Label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="bg-white"
                data-ocid="activity.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Deadline
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-white"
                data-ocid="activity.input"
              />
            </div>
          </div>
        </div>

        {/* WHERE */}
        <div className={`${SECTION_STYLE} border-orange-200 bg-orange-50/30`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-orange-700 uppercase text-xs tracking-wider">
              WHERE
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                const raw = localStorage.getItem("saarathi_business_docs");
                if (raw) setBusinessDocs(JSON.parse(raw));
              } catch {}
              setShowMapPicker(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 text-sm text-left transition-colors mb-2"
            data-ocid="activity.button"
          >
            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
            <span
              className={location ? "text-stone-700" : "text-muted-foreground"}
            >
              {location || "Pick location on map..."}
            </span>
            {locationLat && locationLng && (
              <ExternalLink className="w-3.5 h-3.5 text-orange-400 ml-auto shrink-0" />
            )}
          </button>
          {locationLat && locationLng && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${locationLat}&mlon=${locationLng}#map=15/${locationLat}/${locationLng}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-orange-600 hover:underline flex items-center gap-1 mb-2"
            >
              <ExternalLink className="w-3 h-3" /> View on OpenStreetMap
            </a>
          )}
          <Input
            placeholder="Or type address manually..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-white text-sm"
            data-ocid="activity.input"
          />
          <MapPickerModal
            open={showMapPicker}
            initialAddress={location}
            onClose={() => setShowMapPicker(false)}
            onConfirm={(loc) => {
              setLocation(loc.address);
              setLocationLat(loc.lat || undefined);
              setLocationLng(loc.lng || undefined);
              setLocationAddress(loc.address);
            }}
          />
        </div>

        {/* WHY */}
        <div className={`${SECTION_STYLE} border-purple-200 bg-purple-50/30`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-purple-700 uppercase text-xs tracking-wider">
              WHY / NOTES
            </span>
          </div>
          <Textarea
            placeholder="Purpose, goals, instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="bg-white resize-none"
            data-ocid="activity.textarea"
          />
          {/* Attachments */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Attachments
              </span>
            </div>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem("saarathi_business_docs");
                    if (raw) setBusinessDocs(JSON.parse(raw));
                    else setBusinessDocs([]);
                  } catch {
                    setBusinessDocs([]);
                  }
                  setShowDocPicker(true);
                }}
                data-ocid="activity.upload_button"
              >
                <Briefcase className="w-3.5 h-3.5 mr-1" /> Attach Document
              </Button>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  data-ocid="activity.upload_button"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      const type: ActivityAttachment["type"] =
                        file.type.startsWith("image/") ? "image" : "pdf";
                      setAttachments((prev) => [
                        ...prev,
                        {
                          id: `att_${Date.now()}`,
                          type,
                          name: file.name,
                          dataUrl,
                        },
                      ]);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {/* Doc picker inline */}
            {showDocPicker && (
              <div className="border border-amber-200 rounded-lg bg-white shadow-sm mb-2 max-h-40 overflow-y-auto">
                {businessDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">
                    No documents found. Create in Business Suite first.
                  </p>
                ) : (
                  businessDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 border-b border-amber-100 last:border-0 flex items-center gap-2"
                      onClick={() => {
                        setAttachments((prev) => [
                          ...prev,
                          {
                            id: `att_${Date.now()}`,
                            type: doc.type as ActivityAttachment["type"],
                            name: `${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} ${doc.number}${doc.clientName ? ` — ${doc.clientName}` : ""}`,
                            docId: doc.id,
                          },
                        ]);
                        setShowDocPicker(false);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} #
                        {doc.number}
                        {doc.clientName ? ` — ${doc.clientName}` : ""}
                      </span>
                    </button>
                  ))
                )}
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-gray-50 border-t"
                  onClick={() => setShowDocPicker(false)}
                >
                  Close
                </button>
              </div>
            )}
            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((att) => (
                  <span
                    key={att.id}
                    className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-100"
                  >
                    {att.type === "image" ? (
                      <ImageIcon className="w-3 h-3" />
                    ) : att.type === "pdf" ? (
                      <File className="w-3 h-3" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    {att.name}
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((a) => a.id !== att.id),
                        )
                      }
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="activity.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleSubmit}
            data-ocid="activity.submit_button"
          >
            Create Activity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Send to Messenger Dialog ─────────────────────────────────────────────────
function SendToMessengerDialog({
  activity,
  onClose,
  onSent,
}: {
  activity: Activity | null;
  onClose: () => void;
  onSent: (id: string) => void;
}) {
  if (!activity) return null;

  const message = [
    `📋 *${activity.title}*`,
    `Type: ${TASK_TYPE_CONFIG[activity.taskType].label}`,
    activity.assignees.length ? `👥 Who: ${activity.assignees.join(", ")}` : "",
    activity.groupId ? `🏢 Group: ${activity.groupId}` : "",
    `📅 When: ${formatDate(activity.dateTime)} at ${formatTime(activity.dateTime)}`,
    activity.deadline ? `⏰ Deadline: ${formatDate(activity.deadline)}` : "",
    activity.location ? `📍 Where: ${activity.location}` : "",
    activity.notes ? `📝 Notes: ${activity.notes}` : "",
    activity.attachments && activity.attachments.length > 0
      ? `📎 ${activity.attachments.length} attachment(s)`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  function handleSend() {
    if (!activity) return;
    const taskPayload = {
      activityId: activity.id,
      title: activity.title,
      taskType: activity.taskType,
      assignees: activity.assignees,
      dateTime: activity.dateTime,
      deadline: activity.deadline,
      location: activity.location,
      notes: activity.notes,
      attachments: activity.attachments?.map((a) => ({
        id: a.id,
        type: a.type,
        name: a.name,
        docId: a.docId,
      })),
      locationLat: activity.locationLat,
      locationLng: activity.locationLng,
      locationAddress: activity.locationAddress,
    };
    const payload = {
      groupId: activity.groupId || "general",
      text: message,
      timestamp: Date.now(),
      taskPayload,
    };
    localStorage.setItem(
      "saarathi_pending_task_message",
      JSON.stringify(payload),
    );
    onSent(activity.id);
    onClose();
    toast.success("Task sent to messenger!");
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-md bg-[#fdf8f0] border border-amber-200"
        data-ocid="activity.modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Send to Messenger
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Dialog</DialogDescription>
        <p className="text-sm text-muted-foreground mb-3">
          Preview the message that will be sent:
        </p>
        <div className="bg-white rounded-xl border border-blue-100 p-4 text-sm whitespace-pre-wrap font-mono text-foreground leading-relaxed">
          {message}
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="activity.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSend}
            data-ocid="activity.confirm_button"
          >
            <Send className="w-4 h-4 mr-2" /> Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Task Type dot colors for calendar
const TASK_TYPE_DOT: Record<TaskType, string> = {
  meeting: "bg-blue-500",
  groupTask: "bg-green-500",
  other: "bg-amber-400",
};

// ─── Scheduler / Calendar View ────────────────────────────────────────────────
function SchedulerTab({ activities }: { activities: Activity[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate(),
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    },
  );

  function actsByDay(day: number) {
    return activities.filter((a) => {
      const d = new Date(a.dateTime);
      return (
        d.getDate() === day &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });
  }

  const selectedActs = selectedDay ? actsByDay(selectedDay) : [];

  // This week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  }

  const selectedDateLabel = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay).toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
        },
      )
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left: Calendar + This Week */}
      <div className="lg:col-span-2 space-y-5">
        {/* Calendar Card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Month Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <button
              type="button"
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl hover:bg-amber-50 flex items-center justify-center transition-colors text-stone-500 hover:text-amber-700"
              data-ocid="activity.pagination_prev"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="font-bold text-lg text-stone-800">
                {monthName}
              </span>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl hover:bg-amber-50 flex items-center justify-center transition-colors text-stone-500 hover:text-amber-700"
              data-ocid="activity.pagination_next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-stone-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-stone-400 py-2.5 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 p-2 gap-1">
            {Array.from({ length: firstDay }, (_, i) => String(i)).map((k) => (
              <div key={`pad-${currentMonth}-${currentYear}-${k}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayActs = actsByDay(day);
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const isSelected = day === selectedDay;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all hover:bg-amber-50 ${
                    isSelected && !isToday ? "bg-amber-100" : ""
                  }`}
                  data-ocid="activity.button"
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      isToday
                        ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                        : isSelected
                          ? "bg-amber-200 text-amber-800"
                          : "text-stone-700 hover:text-amber-700"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-1 h-2 items-center">
                    {dayActs.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className={`w-1.5 h-1.5 rounded-full ${TASK_TYPE_DOT[a.taskType]}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-stone-100 bg-stone-50/50">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Legend:
            </span>
            {(
              [
                ["meeting", "bg-blue-500", "Meeting"],
                ["groupTask", "bg-green-500", "Group Task"],
                ["other", "bg-amber-400", "Other"],
              ] as const
            ).map(([, color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-[10px] text-stone-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-stone-800 text-sm">This Week</h3>
          </div>
          <div className="grid grid-cols-7 divide-x divide-stone-100">
            {weekDays.map((wd) => {
              const wdActs = activities.filter((a) => {
                const d = new Date(a.dateTime);
                return (
                  d.getDate() === wd.getDate() &&
                  d.getMonth() === wd.getMonth() &&
                  d.getFullYear() === wd.getFullYear()
                );
              });
              const isWdToday = wd.toDateString() === today.toDateString();
              return (
                <div
                  key={wd.toISOString()}
                  className={`p-2 min-h-[80px] ${isWdToday ? "bg-amber-50" : ""}`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isWdToday ? "text-amber-600" : "text-stone-400"}`}
                  >
                    {wd.toLocaleDateString("en-IN", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-xs font-bold mb-1.5 ${isWdToday ? "text-amber-700" : "text-stone-600"}`}
                  >
                    {wd.getDate()}
                  </div>
                  <div className="space-y-1">
                    {wdActs.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded truncate ${
                          a.taskType === "meeting"
                            ? "bg-blue-100 text-blue-700"
                            : a.taskType === "groupTask"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                        title={a.title}
                      >
                        {a.title}
                      </div>
                    ))}
                    {wdActs.length > 2 && (
                      <div className="text-[9px] text-stone-400">
                        +{wdActs.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Day Detail Panel */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden sticky top-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3">
            <h3 className="font-semibold text-white text-sm">
              {selectedDateLabel ?? "Select a day"}
            </h3>
            <p className="text-amber-100 text-xs mt-0.5">
              {selectedActs.length}{" "}
              {selectedActs.length === 1 ? "activity" : "activities"}
            </p>
          </div>

          {/* Timeline */}
          <div className="p-3">
            {selectedActs.length === 0 ? (
              <div
                className="py-8 text-center"
                data-ocid="activity.empty_state"
              >
                <Calendar className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                <p className="text-sm text-stone-400">No activities</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedActs.map((a) => {
                  const borderColor =
                    a.taskType === "meeting"
                      ? "border-blue-400"
                      : a.taskType === "groupTask"
                        ? "border-green-500"
                        : "border-amber-400";
                  const sc = STATUS_CONFIG[a.status];
                  const StatusIcon = sc.icon;
                  return (
                    <div
                      key={a.id}
                      className={`p-3 rounded-xl border-l-4 ${borderColor} bg-stone-50 border border-stone-100`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-stone-800 leading-tight">
                          {a.title}
                        </p>
                        <span
                          className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${sc.color}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-medium">
                        {formatTime(a.dateTime)}
                      </p>
                      {a.assignees.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {a.assignees.slice(0, 3).map((name) => (
                            <span
                              key={name}
                              className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[9px] font-bold flex items-center justify-center"
                              title={name}
                            >
                              {name.charAt(0).toUpperCase()}
                            </span>
                          ))}
                          {a.assignees.length > 3 && (
                            <span className="text-[9px] text-stone-400">
                              +{a.assignees.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.username || "me";
  const currentDisplayName = profile?.displayName || profile?.username || "You";
  const { actor } = useActor();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | ActivityStatus>("all");
  const [messengerTarget, setMessengerTarget] = useState<Activity | null>(null);
  const [messengerGroups, setMessengerGroups] = useState<string[]>([]);
  const [messengerUsers, setMessengerUsers] = useState<string[]>([]);

  useEffect(() => {
    const groups = dataStore.getGroups();
    const users = dataStore.getUsers();
    if (groups.length > 0)
      setMessengerGroups(
        groups
          .filter((g: { parentGroupId?: string }) => !g.parentGroupId)
          .map((g: { name: string }) => g.name),
      );
    if (users.length > 0)
      setMessengerUsers(
        users.map((u: { displayName: string }) => u.displayName),
      );
  }, []);

  // Load activities from canister + poll every 5s
  useEffect(() => {
    if (!actor) return;
    const ext = asExtended(actor);

    async function fetchActivities() {
      try {
        const raw = await ext.listMyActivities();
        const mapped: Activity[] = raw.map((a: CanisterActivity) => ({
          id: a.id,
          title: a.title,
          taskType: canisterTaskTypeToLocal(a.taskType) as Activity["taskType"],
          assignees: a.assignees,
          groupId: a.groupId || undefined,
          dateTime: a.dateTime,
          deadline: a.deadline,
          location: a.location,
          notes: a.notes,
          status: canisterStatusToActivity(a.status) as Activity["status"],
          createdBy: a.createdBy.toString(),
          createdAt: Number(a.createdAt) / 1_000_000,
          messengerSent: a.messengerSent,
          chatThreadId: a.chatThreadId || undefined,
        }));
        setActivities(mapped);
      } catch (err) {
        console.error("Failed to load activities:", err);
        toast.error("Failed to load activities");
      } finally {
        setLoadingActivities(false);
      }
    }

    fetchActivities();
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [actor]);

  // Pre-fill from chat context
  useEffect(() => {
    try {
      const raw = localStorage.getItem("saarathi_prefill_activity");
      if (raw) {
        const prefill = JSON.parse(raw);
        localStorage.removeItem("saarathi_prefill_activity");
        setShowNew(true);
        toast.info("Pre-filled from chat context");
        // Store prefill for the dialog to consume
        localStorage.setItem(
          "saarathi_prefill_pending",
          JSON.stringify(prefill),
        );
      }
    } catch {}
  }, []);

  const availableGroups =
    messengerGroups.length > 0 ? messengerGroups : SAMPLE_GROUPS;
  const availableUsers = messengerUsers;

  const filtered = useMemo(() => {
    const base = [...activities].sort((a, b) => {
      // Sort completed to the bottom
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;
      return b.createdAt - a.createdAt;
    });
    if (filter === "all") return base;
    return base.filter((a) => a.status === filter);
  }, [activities, filter]);

  async function handleCreate(a: Activity) {
    if (!actor) {
      toast.error("Not connected");
      return;
    }
    try {
      await asExtended(actor).createActivity(
        a.title,
        taskTypeToCanister(a.taskType),
        a.assignees,
        a.groupId || "",
        a.dateTime,
        a.deadline,
        a.location,
        a.notes,
        a.chatThreadId || "",
      );
      // Refresh list
      const raw = await asExtended(actor).listMyActivities();
      const mapped: Activity[] = raw.map((c: CanisterActivity) => ({
        id: c.id,
        title: c.title,
        taskType: canisterTaskTypeToLocal(c.taskType) as Activity["taskType"],
        assignees: c.assignees,
        groupId: c.groupId || undefined,
        dateTime: c.dateTime,
        deadline: c.deadline,
        location: c.location,
        notes: c.notes,
        status: canisterStatusToActivity(c.status) as Activity["status"],
        createdBy: c.createdBy.toString(),
        createdAt: Number(c.createdAt) / 1_000_000,
        messengerSent: c.messengerSent,
        chatThreadId: c.chatThreadId || undefined,
      }));
      setActivities(mapped);
      toast.success("Action created");
      // Post confirmation message to linked chat
      try {
        const chatTarget = a.chatThreadId || "group_g1";
        const msgs = JSON.parse(
          localStorage.getItem("saarathi_messages") || "{}",
        );
        const now = Date.now();
        msgs[chatTarget] = [
          ...(msgs[chatTarget] || []),
          {
            id: `act_${now}`,
            senderId: currentUserId,
            senderName: currentDisplayName,
            content: `📌 Task created: ${a.title}`,
            msgType: "text",
            timestamp: now,
          },
        ];
        localStorage.setItem("saarathi_messages", JSON.stringify(msgs));
      } catch {}
    } catch (err) {
      console.error("Failed to create activity:", err);
      toast.error("Failed to create activity");
    }
  }

  async function handleStatusChange(id: string) {
    const activity = activities.find((a) => a.id === id);
    if (!activity || !actor) return;
    const newStatus = nextStatus(activity.status);
    try {
      await asExtended(actor).updateActivityStatus(
        id,
        activityStatusToCanister(newStatus),
      );
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
      );
    } catch (err) {
      console.error("Failed to update activity status:", err);
      toast.error("Failed to update status");
    }
  }

  async function handleMarkDone(id: string) {
    const activity = activities.find((a) => a.id === id);
    if (!actor) return;
    try {
      await asExtended(actor).updateActivityStatus(id, { completed: null });
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a)),
      );
      toast.success("Task marked as completed!");
      if (activity) {
        try {
          const chatTarget = activity.chatThreadId || "group_g1";
          const msgs = JSON.parse(
            localStorage.getItem("saarathi_messages") || "{}",
          );
          const now = Date.now();
          msgs[chatTarget] = [
            ...(msgs[chatTarget] || []),
            {
              id: `done_${now}`,
              senderId: "me",
              senderName: "You",
              content: `✅ Task completed: ${activity.title}`,
              msgType: "text",
              timestamp: now,
            },
          ];
          localStorage.setItem("saarathi_messages", JSON.stringify(msgs));
          window.dispatchEvent(new CustomEvent("saarathi_messages_updated"));
        } catch {}
      }
    } catch (err) {
      console.error("Failed to mark done:", err);
      toast.error("Failed to complete task");
    }
  }

  async function handleMessengerSent(id: string) {
    const activity = activities.find((a) => a.id === id);
    if (!actor || !activity) return;
    try {
      await asExtended(actor).updateActivity(
        id,
        activity.title,
        taskTypeToCanister(activity.taskType),
        activity.assignees,
        activity.groupId || "",
        activity.dateTime,
        activity.deadline,
        activity.location,
        activity.notes,
      );
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, messengerSent: true } : a)),
      );
    } catch {
      // Non-critical: update local state anyway
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, messengerSent: true } : a)),
      );
    }
  }

  function handleNudge(activity: Activity, message?: string) {
    const key = activity.chatThreadId ?? "group_g1";
    const reminderText =
      message ||
      `⏰ Reminder: ${activity.title} — due ${activity.deadline || activity.dateTime}`;
    const reminder = {
      id: `nudge_${Date.now()}`,
      senderId: "me",
      senderName: "You",
      content: reminderText,
      msgType: "text",
      timestamp: Date.now(),
    };
    try {
      const stored = JSON.parse(
        localStorage.getItem("saarathi_messages") || "{}",
      );
      stored[key] = [...(stored[key] ?? []), reminder];
      localStorage.setItem("saarathi_messages", JSON.stringify(stored));
    } catch {}
    toast.success("Reminder sent to chat");
  }

  const counts = useMemo(
    () => ({
      all: activities.length,
      pending: activities.filter((a) => a.status === "pending").length,
      inProgress: activities.filter((a) => a.status === "inProgress").length,
      completed: activities.filter((a) => a.status === "completed").length,
    }),
    [activities],
  );

  const FILTERS: Array<{
    key: "all" | ActivityStatus;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "inProgress", label: "In Progress", count: counts.inProgress },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  if (loadingActivities) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="text-amber-600 text-sm animate-pulse">
          Loading activities…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              5W Activity Builder
            </h1>
            <p className="text-amber-100 text-sm mt-0.5">
              Who · What · When · Where · Why
            </p>
          </div>
          <Button
            className="bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-md"
            onClick={() => setShowNew(true)}
            data-ocid="activity.primary_button"
          >
            <Plus className="w-4 h-4 mr-2" /> New Activity
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <Tabs defaultValue="activities">
          <TabsList className="mb-6 bg-amber-50 border border-amber-200">
            <TabsTrigger
              value="activities"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              data-ocid="activity.tab"
            >
              Activities
            </TabsTrigger>
            <TabsTrigger
              value="scheduler"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              data-ocid="activity.tab"
            >
              Scheduler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" data-ocid="activity.panel">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 mb-5">
              {FILTERS.map((f) => (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  data-ocid="activity.tab"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    filter === f.key
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-muted-foreground border-border hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === f.key ? "bg-amber-400/60" : "bg-muted"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Activity List */}
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                  data-ocid="activity.empty_state"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    No activities yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create tasks from chat using AI 💬 — open Messenger and tap
                    'Create Task'
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((a, i) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      index={i}
                      onStatusChange={handleStatusChange}
                      onSendToMessenger={setMessengerTarget}
                      onNudge={handleNudge}
                      onMarkDone={handleMarkDone}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* From Conversations section */}
            <div
              className="mt-6"
              data-ocid="activity.from_conversations.section"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-[10px] text-white">💬</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                  From Conversations
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  Chat-extracted tasks
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    id: "fc1",
                    title: "Send homework PDF to parents",
                    from: "Class 3",
                    assignee: "You",
                    due: "Today",
                    overdue: false,
                  },
                  {
                    id: "fc2",
                    title: "Confirm parent-teacher meeting",
                    from: "School Group",
                    assignee: "You",
                    due: "Tomorrow",
                    overdue: false,
                  },
                  {
                    id: "fc3",
                    title: "Review Q3 invoice",
                    from: "Finance Team",
                    assignee: "Ravi Kumar",
                    due: "Yesterday",
                    overdue: true,
                  },
                ].map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border bg-white ${
                      t.overdue
                        ? "border-red-200 animate-urgent-pulse"
                        : "border-blue-100"
                    }`}
                    data-ocid={`activity.from_chat.item.${i + 1}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px]">💬</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        From: {t.from} · {t.assignee} · Due: {t.due}
                        {t.overdue && (
                          <span className="ml-1 text-red-500 font-medium">
                            (Overdue)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scheduler" data-ocid="activity.panel">
            <SchedulerTab activities={activities} />
          </TabsContent>
        </Tabs>
      </div>

      <NewActivityDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={handleCreate}
        availableGroups={availableGroups}
        availableUsers={availableUsers}
      />

      <SendToMessengerDialog
        activity={messengerTarget}
        onClose={() => setMessengerTarget(null)}
        onSent={handleMessengerSent}
      />
    </div>
  );
}
