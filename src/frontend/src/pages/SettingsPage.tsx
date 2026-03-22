import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Globe,
  MessageCircle,
  Plus,
  Save,
  Share2,
  Trash2,
  Upload,
  User,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  role: "Colleague" | "Client" | "Vendor";
}

interface NotifPrefs {
  newMessages: boolean;
  tasks: boolean;
  invoices: boolean;
  dailySummary: boolean;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem("saarathi_profile");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: "", businessName: "", gstin: "" };
}

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem("saarathi_notif_prefs");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    newMessages: true,
    tasks: true,
    invoices: true,
    dailySummary: false,
  };
}

function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem("saarathi_contacts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed[0].phone !== undefined
      )
        return parsed;
    }
  } catch {}
  return [
    {
      id: "c_priya_s",
      name: "Priya Sharma",
      phone: "+91 98765 43210",
      role: "Colleague",
    },
    {
      id: "c_ravi_k",
      name: "Ravi Kumar",
      phone: "+91 87654 32109",
      role: "Colleague",
    },
    {
      id: "c_rajesh_m",
      name: "Rajesh Mehta",
      phone: "+91 76543 21098",
      role: "Client",
    },
    {
      id: "c_amit_p",
      name: "Amit Patel",
      phone: "+91 65432 10987",
      role: "Client",
    },
  ];
}

export default function SettingsPage() {
  const [profile, setProfile] = useState(loadProfile);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs);
  const [language, setLanguage] = useState<"en" | "hi">(() => {
    try {
      return (localStorage.getItem("saarathi_language") as "en" | "hi") || "en";
    } catch {
      return "en";
    }
  });
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    role: "Colleague" as Contact["role"],
  });
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function saveProfile() {
    localStorage.setItem("saarathi_profile", JSON.stringify(profile));
    toast.success("Profile saved successfully");
  }

  function toggleNotif(key: keyof NotifPrefs) {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem("saarathi_notif_prefs", JSON.stringify(updated));
  }

  function saveLanguage(lang: "en" | "hi") {
    setLanguage(lang);
    localStorage.setItem("saarathi_language", lang);
    toast.success("Language preference saved");
  }

  function addContact() {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    const contact: Contact = {
      id: `c_${Date.now()}`,
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      role: newContact.role,
    };
    const updated = [...contacts, contact];
    setContacts(updated);
    localStorage.setItem("saarathi_contacts", JSON.stringify(updated));
    setNewContact({ name: "", phone: "", role: "Colleague" });
    toast.success("Contact added");
  }

  function deleteContact(id: string) {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    localStorage.setItem("saarathi_contacts", JSON.stringify(updated));
  }

  function parseAndImportCSV(text: string) {
    const lines = text.trim().split("\n").filter(Boolean);
    let added = 0;
    const newContacts: Contact[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        newContacts.push({
          id: `c_${Date.now()}_${added}`,
          name: parts[0],
          phone: parts[1],
          role: (parts[2] as Contact["role"]) || "Colleague",
        });
        added++;
      }
    }
    if (added > 0) {
      const updated = [...contacts, ...newContacts];
      setContacts(updated);
      localStorage.setItem("saarathi_contacts", JSON.stringify(updated));
      toast.success(`Imported ${added} contacts`);
      setCsvText("");
    } else {
      toast.error("No valid contacts found. Format: Name, Phone, Role");
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseAndImportCSV(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      "Hey! I'm using SAARATHI for managing my business. Join me! https://saarathi.app",
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  const ROLE_COLORS: Record<Contact["role"], string> = {
    Colleague: "bg-blue-500/20 text-blue-300",
    Client: "bg-amber-500/20 text-amber-300",
    Vendor: "bg-emerald-500/20 text-emerald-300",
  };

  return (
    <ScrollArea className="h-full">
      <div
        className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-12"
        data-ocid="settings.page"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/50">
              Manage your profile and preferences
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Business Profile
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">
                Full Name
              </Label>
              <Input
                value={profile.name}
                onChange={(e) =>
                  setProfile((p: typeof profile) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
                placeholder="Rajesh Kumar"
                className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">
                Business Name
              </Label>
              <Input
                value={profile.businessName}
                onChange={(e) =>
                  setProfile((p: typeof profile) => ({
                    ...p,
                    businessName: e.target.value,
                  }))
                }
                placeholder="Kumar Enterprises"
                className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs uppercase tracking-wide">
                GSTIN
              </Label>
              <Input
                value={profile.gstin}
                onChange={(e) =>
                  setProfile((p: typeof profile) => ({
                    ...p,
                    gstin: e.target.value,
                  }))
                }
                placeholder="29ABCDE1234F1Z5"
                className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 font-mono"
                data-ocid="settings.input"
              />
            </div>
            <Button
              onClick={saveProfile}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-ocid="settings.save_button"
            >
              <Save className="w-4 h-4 mr-2" /> Save Profile
            </Button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Notifications
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {(
              [
                {
                  key: "newMessages",
                  label: "New Messages",
                  desc: "Get notified for new chat messages",
                },
                {
                  key: "tasks",
                  label: "Task Requests",
                  desc: "Alerts for incoming 5W task requests",
                },
                {
                  key: "invoices",
                  label: "Invoice Updates",
                  desc: "When invoices are sent or viewed",
                },
                {
                  key: "dailySummary",
                  label: "Daily Summary",
                  desc: "Morning recap of your activities",
                },
              ] as Array<{ key: keyof NotifPrefs; label: string; desc: string }>
            ).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-white/40">{item.desc}</div>
                </div>
                <Switch
                  checked={notifPrefs[item.key]}
                  onCheckedChange={() => toggleNotif(item.key)}
                  className="data-[state=checked]:bg-amber-500"
                  data-ocid="settings.switch"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Language Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Language
            </h2>
          </div>
          <div className="p-5 flex gap-3">
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => saveLanguage(lang)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  language === lang
                    ? "bg-amber-500 text-black border-amber-500"
                    : "bg-[#2a2a2a] text-white/60 border-white/10 hover:border-amber-500/40"
                }`}
                data-ocid="settings.radio"
              >
                {lang === "en" ? "🇬🇧 English" : "🇮🇳 हिंदी"}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Contacts ({contacts.length})
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Add Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
              <Input
                value={newContact.name}
                onChange={(e) =>
                  setNewContact((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Contact Name"
                className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-white/30"
                data-ocid="settings.input"
              />
              <Input
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
                className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-white/30"
                data-ocid="settings.input"
              />
              <select
                value={newContact.role}
                onChange={(e) =>
                  setNewContact((p) => ({
                    ...p,
                    role: e.target.value as Contact["role"],
                  }))
                }
                className="bg-[#2a2a2a] border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                data-ocid="settings.select"
              >
                <option value="Colleague">Colleague</option>
                <option value="Client">Client</option>
                <option value="Vendor">Vendor</option>
              </select>
              <Button
                onClick={addContact}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-3"
                data-ocid="settings.primary_button"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* CSV Import */}
            <div className="rounded-xl bg-[#2a2a2a] border border-white/8 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Upload className="w-3 h-3" />
                <span>Import from CSV (Name, Phone, Role)</span>
              </div>
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV: Priya Sharma, +91 98765 43210, Colleague"
                rows={3}
                className="bg-[#1e1e1e] border-white/10 text-white placeholder:text-white/30 text-xs font-mono"
                data-ocid="settings.textarea"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                  onClick={() => fileRef.current?.click()}
                  data-ocid="settings.upload_button"
                >
                  <Upload className="w-3 h-3 mr-1" /> Upload File
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                  onClick={() => csvText.trim() && parseAndImportCSV(csvText)}
                  data-ocid="settings.secondary_button"
                >
                  Import
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>

            <Separator className="bg-white/8" />

            {/* Contact List */}
            {contacts.length === 0 ? (
              <div
                className="py-8 text-center text-white/30 text-sm"
                data-ocid="settings.empty_state"
              >
                No contacts yet. Add your first contact above.
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact, i) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#2a2a2a] border border-white/8"
                    data-ocid={`settings.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                        {contact.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {contact.name}
                        </div>
                        <div className="text-xs text-white/40">
                          {contact.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[contact.role]}`}
                      >
                        {contact.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteContact(contact.id)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        data-ocid={`settings.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Invite Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              Invite to SAARATHI
            </h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-white/60 mb-4">
              Invite your colleagues, clients, and vendors to SAARATHI via
              WhatsApp. They'll get a direct link to join your workspace.
            </p>
            <Button
              onClick={shareWhatsApp}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              data-ocid="settings.primary_button"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 pb-4">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-amber-400/60"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </ScrollArea>
  );
}
