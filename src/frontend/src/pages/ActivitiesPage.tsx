import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  Target,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { dataStore } from "../store/dataStore";

// ─── Types ───────────────────────────────────────────────────────────────────
type TaskType = "meeting" | "groupTask" | "other";
type ActivityStatus = "pending" | "inProgress" | "completed";

interface Activity {
  id: string;
  title: string;
  taskType: TaskType;
  assignees: string[];
  groupId?: string;
  dateTime: string;
  deadline: string;
  location: string;
  notes: string;
  status: ActivityStatus;
  createdBy: string;
  createdAt: number;
  messengerSent: boolean;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_GROUPS = ["Sales Team", "Accounts", "Operations", "Management"];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    title: "GST Filing — Q3 Review",
    taskType: "meeting",
    assignees: ["Priya Sharma", "Rahul Gupta"],
    groupId: "Accounts",
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Conference Room B, Head Office",
    notes:
      "Compile all purchase invoices and sales register. Review input tax credit discrepancies before filing.",
    status: "pending",
    createdBy: "Admin",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    messengerSent: false,
  },
  {
    id: "a2",
    title: "Monthly Sales Performance Review",
    taskType: "groupTask",
    assignees: ["Amit Verma", "Sunita Patel", "Deepak Nair"],
    groupId: "Sales Team",
    dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Zoom — Meeting ID: 8823 4412",
    notes:
      "Each member to present their pipeline and closed deals. Discuss targets for next month.",
    status: "inProgress",
    createdBy: "Admin",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    messengerSent: true,
  },
  {
    id: "a3",
    title: "Client Site Visit — Mehta Exports",
    taskType: "meeting",
    assignees: ["Rajesh Mehta"],
    dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Mehta Exports, MIDC Andheri East, Mumbai",
    notes:
      "Demonstrate new inventory module. Collect signed proposal copy and discuss implementation timeline.",
    status: "completed",
    createdBy: "Admin",
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    messengerSent: false,
  },
  {
    id: "a4",
    title: "Vendor Payment Reconciliation",
    taskType: "groupTask",
    assignees: ["Priya Sharma"],
    groupId: "Accounts",
    dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    location: "Accounts Office, 2nd Floor",
    notes:
      "Cross-check all vendor invoices against bank statements. Flag any discrepancies above ₹5,000.",
    status: "pending",
    createdBy: "Admin",
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    messengerSent: false,
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
}: {
  activity: Activity;
  index: number;
  onStatusChange: (id: string) => void;
  onSendToMessenger: (activity: Activity) => void;
}) {
  const sc = STATUS_CONFIG[activity.status];
  const tc = TASK_TYPE_CONFIG[activity.taskType];
  const overdue = isOverdue(activity.deadline, activity.status);
  const StatusIcon = sc.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`activity.item.${index + 1}`}
      className="bg-white rounded-xl border border-amber-100 shadow-card hover:shadow-md transition-shadow p-5"
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
                Overdue
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground text-base leading-snug truncate">
            {activity.title}
          </h3>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${sc.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </span>
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
            <span className="truncate">{activity.location}</span>
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
        <p className="text-xs text-muted-foreground bg-amber-50/60 rounded-lg px-3 py-2 mb-4 line-clamp-2">
          {activity.notes}
        </p>
      )}

      <div className="flex gap-2">
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
      </div>
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
  const [notes, setNotes] = useState("");

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
    setNotes("");
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
      notes,
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
          <Input
            placeholder="Office, Zoom link, address..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-white"
            data-ocid="activity.input"
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
  ]
    .filter(Boolean)
    .join("\n");

  function handleSend() {
    if (!activity) return;
    const payload = {
      groupId: activity.groupId || "general",
      text: message,
      timestamp: Date.now(),
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
    { month: "long", year: "numeric" },
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

  // This week agenda
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const thisWeekActs = activities.filter((a) => {
    const d = new Date(a.dateTime);
    return d >= startOfWeek && d <= endOfWeek;
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

  const STATUS_DOT: Record<ActivityStatus, string> = {
    pending: "bg-amber-400",
    inProgress: "bg-blue-400",
    completed: "bg-green-400",
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border-b border-amber-100">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg hover:bg-amber-200 flex items-center justify-center transition-colors"
            data-ocid="activity.pagination_prev"
          >
            <ChevronLeft className="w-4 h-4 text-amber-700" />
          </button>
          <span className="font-semibold text-amber-800">{monthName}</span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg hover:bg-amber-200 flex items-center justify-center transition-colors"
            data-ocid="activity.pagination_next"
          >
            <ChevronRight className="w-4 h-4 text-amber-700" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground bg-amber-50/40 border-b border-amber-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {["a", "b", "c", "d", "e", "f"].slice(0, firstDay).map((k) => (
            <div key={`pad-${k}`} />
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
                className={`py-2 px-1 text-sm flex flex-col items-center gap-0.5 border-b border-r border-border/30 hover:bg-amber-50 transition-colors ${
                  isSelected ? "bg-amber-100" : ""
                }`}
                data-ocid="activity.button"
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-amber-500 text-white"
                      : isSelected
                        ? "text-amber-700 font-bold"
                        : "text-foreground"
                  }`}
                >
                  {day}
                </span>
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {dayActs.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Panel */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-card">
          <h3 className="font-semibold text-foreground mb-3">
            {new Date(
              currentYear,
              currentMonth,
              selectedDay,
            ).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          {selectedActs.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-ocid="activity.empty_state"
            >
              No activities scheduled for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedActs.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[a.status]}`}
                  />
                  <div>
                    <div className="font-medium text-sm">{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(a.dateTime)} · {a.location || "No location"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* This Week Agenda */}
      <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" /> This Week
        </h3>
        {thisWeekActs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activities this week.
          </p>
        ) : (
          <div className="space-y-2">
            {thisWeekActs.map((a) => {
              const sc = STATUS_CONFIG[a.status];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="text-center min-w-[40px]">
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.dateTime).toLocaleDateString("en-IN", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="font-bold text-amber-600 text-sm">
                      {new Date(a.dateTime).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {a.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(a.dateTime)}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}
                  >
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
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

  // Persist activities to dataStore whenever they change
  useEffect(() => {
    dataStore.setActivities(activities);
  }, [activities]);

  const availableGroups =
    messengerGroups.length > 0 ? messengerGroups : SAMPLE_GROUPS;
  const availableUsers = messengerUsers;

  const filtered = useMemo(() => {
    const base = [...activities].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === "all") return base;
    return base.filter((a) => a.status === filter);
  }, [activities, filter]);

  function handleCreate(a: Activity) {
    setActivities((prev) => [a, ...prev]);
  }

  function handleStatusChange(id: string) {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: nextStatus(a.status) } : a,
      ),
    );
  }

  function handleMessengerSent(id: string) {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, messengerSent: true } : a)),
    );
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
                    Create your first activity using the button above.
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
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
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
