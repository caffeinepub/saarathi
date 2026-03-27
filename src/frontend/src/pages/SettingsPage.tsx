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
  Loader2,
  MessageCircle,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  Upload,
  User,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { asExtended } from "../utils/backendExtensions";

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

const DEMO_CONTACT_IDS = [
  "c_kavya_n",
  "c_suresh_m",
  "c_arjun_s",
  "c_deepika_j",
];

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
      id: "c_kavya_n",
      name: "Kavya Nair",
      phone: "+91 98230 00111",
      role: "Colleague",
    },
    {
      id: "c_suresh_m",
      name: "Suresh Mehta",
      phone: "+91 98340 00222",
      role: "Colleague",
    },
    {
      id: "c_arjun_s",
      name: "Arjun Singh",
      phone: "+91 98450 00333",
      role: "Colleague",
    },
    {
      id: "c_deepika_j",
      name: "Deepika Joshi",
      phone: "+91 98560 00444",
      role: "Colleague",
    },
  ];
}

export default function SettingsPage() {
  const { actor } = useActor();
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
  const [alsoAddAsClient, setAlsoAddAsClient] = useState(false);
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Find Users state
  const [findUsername, setFindUsername] = useState("");
  const [foundUser, setFoundUser] = useState<{
    username: string;
    displayName: string;
    businessName: string;
  } | null>(null);
  const [findError, setFindError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
    // Also add to Business Suite clients if checked
    if (alsoAddAsClient) {
      try {
        const existingClients = JSON.parse(
          localStorage.getItem("saarathi_clients") || "[]",
        );
        const newClient = {
          id: `c_${contact.id}`,
          name: contact.name,
          phone: contact.phone,
          email: "",
          gstin: "",
          address: "",
          city: "",
          state: "Maharashtra",
          placeOfSupply: "Maharashtra",
        };
        localStorage.setItem(
          "saarathi_clients",
          JSON.stringify([...existingClients, newClient]),
        );
      } catch {}
      toast.success("Contact added and registered as client in Business Suite");
    } else {
      toast.success("Contact added");
    }
    setNewContact({ name: "", phone: "", role: "Colleague" });
    setAlsoAddAsClient(false);
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

  async function searchUser() {
    setFoundUser(null);
    setFindError("");
    const query = findUsername.trim().toLowerCase();
    if (!query) return;

    setIsSearching(true);
    try {
      // Step 1: check localStorage (same-device users)
      const users = JSON.parse(localStorage.getItem("saarathi_users") || "{}");
      const currentUsername = JSON.parse(
        localStorage.getItem("saarathi_profile") || "{}",
      ).username?.toLowerCase();
      if (query === currentUsername) {
        setFindError("That's your own account.");
        return;
      }
      const localEntry = users[query];
      if (localEntry) {
        setFoundUser({
          username: localEntry.profile.username,
          displayName: localEntry.profile.displayName,
          businessName: localEntry.profile.businessName,
        });
        return;
      }

      // Step 2: query backend canister for cross-device lookup
      try {
        if (actor) {
          const allUsers = await asExtended(actor).getAllPublicUsers();
          const match = allUsers.find(
            (u) => u.username.toLowerCase() === query,
          );
          if (match) {
            if (match.username.toLowerCase() === currentUsername) {
              setFindError("That's your own account.");
              return;
            }
            setFoundUser({
              username: match.username,
              displayName: match.displayName,
              businessName: "",
            });
            return;
          }
        }
      } catch {
        // canister unavailable — fall through to not-found
      }

      setFindError("No user found with that username.");
    } catch {
      setFindError("Error searching users.");
    } finally {
      setIsSearching(false);
    }
  }

  function addFoundUserAsContact() {
    if (!foundUser) return;
    const exists = contacts.some(
      (c) => c.id === `user_${foundUser.username.toLowerCase()}`,
    );
    if (exists) {
      toast.error("This user is already in your contacts.");
      return;
    }
    const contact: Contact = {
      id: `user_${foundUser.username.toLowerCase()}`,
      name: foundUser.displayName || foundUser.username,
      phone: foundUser.businessName || "",
      role: "Colleague",
    };
    const updated = [...contacts, contact];
    setContacts(updated);
    localStorage.setItem("saarathi_contacts", JSON.stringify(updated));
    try {
      const dmContacts = JSON.parse(
        localStorage.getItem("saarathi_dm_contacts") || "[]",
      );
      if (
        !dmContacts.find(
          (d: { id: string }) =>
            d.id === `dm_${foundUser.username.toLowerCase()}`,
        )
      ) {
        dmContacts.push({
          id: `dm_${foundUser.username.toLowerCase()}`,
          name: foundUser.displayName || foundUser.username,
          username: foundUser.username,
        });
        localStorage.setItem(
          "saarathi_dm_contacts",
          JSON.stringify(dmContacts),
        );
      }
    } catch {}
    toast.success(
      `${foundUser.displayName || foundUser.username} added to contacts`,
    );
    setFoundUser(null);
    setFindUsername("");
  }

  const DEMO_GROUP_IDS = ["g1", "g1-sub1", "g2"];
  const DEMO_CHAT_KEYS = [
    "group_g1",
    "group_g1-sub1",
    "group_g2",
    "dm_kavya",
    "dm_suresh",
    "dm_arjun",
  ];

  function hasDemoData(): boolean {
    try {
      const groups = JSON.parse(
        localStorage.getItem("saarathi_groups") || "[]",
      );
      const hasGroups = groups.some(
        (g: { id: string; isDemo?: boolean }) =>
          g.isDemo === true || DEMO_GROUP_IDS.includes(g.id),
      );
      if (hasGroups) return true;

      const activities = JSON.parse(
        localStorage.getItem("saarathi_activities") || "[]",
      );
      if (activities.length > 0) return true;

      const docs = JSON.parse(
        localStorage.getItem("saarathi_business_docs") || "[]",
      );
      if (docs.length > 0) return true;

      return false;
    } catch {
      return false;
    }
  }

  const [demoActive, setDemoActive] = useState(hasDemoData);

  function clearDemoData() {
    const confirmed = window.confirm(
      "Remove all demo data including chats, groups, activities, invoices, and contacts? Your real data will be kept.",
    );
    if (!confirmed) return;

    // Clear demo groups
    try {
      const groups = JSON.parse(
        localStorage.getItem("saarathi_groups") || "[]",
      );
      const filtered = groups.filter(
        (g: { id: string; isDemo?: boolean }) =>
          !g.isDemo && !DEMO_GROUP_IDS.includes(g.id),
      );
      localStorage.setItem("saarathi_groups", JSON.stringify(filtered));
    } catch {}

    // Clear demo messages - scan all localStorage keys
    try {
      const msgs = JSON.parse(
        localStorage.getItem("saarathi_messages") || "{}",
      );
      // Remove hardcoded demo chat keys
      for (const key of DEMO_CHAT_KEYS) {
        delete msgs[key];
      }
      // Also collect all demo group IDs dynamically
      const allGroups = JSON.parse(
        localStorage.getItem("saarathi_groups") || "[]",
      );
      const demoGroupIds = new Set([
        ...DEMO_GROUP_IDS,
        ...allGroups
          .filter((g: { isDemo?: boolean }) => g.isDemo === true)
          .map((g: { id: string }) => g.id),
      ]);
      // Scan all keys for saarathi_messages_* pattern
      for (const lsKey of Object.keys(localStorage)) {
        if (lsKey.startsWith("saarathi_messages_")) {
          const chatId = lsKey.replace("saarathi_messages_", "");
          if (demoGroupIds.has(chatId) || DEMO_CHAT_KEYS.includes(chatId)) {
            localStorage.removeItem(lsKey);
          }
        }
      }
      // Remove demo group keys from saarathi_messages object
      for (const groupId of demoGroupIds) {
        delete msgs[`group_${groupId}`];
        delete msgs[groupId];
      }
      localStorage.setItem("saarathi_messages", JSON.stringify(msgs));
    } catch {}

    // Clear activities - keep real ones (isDemo !== true)
    try {
      const existingActivities = JSON.parse(
        localStorage.getItem("saarathi_activities") || "[]",
      );
      const realActivities = existingActivities.filter(
        (a: { isDemo?: boolean }) => a.isDemo !== true,
      );
      localStorage.setItem(
        "saarathi_activities",
        JSON.stringify(realActivities),
      );
    } catch {}

    // Clear business docs (invoices, proposals, estimates)
    try {
      localStorage.setItem("saarathi_business_docs", JSON.stringify([]));
    } catch {}

    // Clear clients
    try {
      localStorage.setItem("saarathi_clients", JSON.stringify([]));
    } catch {}

    // Clear products
    try {
      localStorage.setItem("saarathi_products", JSON.stringify([]));
    } catch {}

    // Filter out demo contacts
    try {
      const existingContacts = JSON.parse(
        localStorage.getItem("saarathi_contacts") || "[]",
      );
      const realContacts = existingContacts.filter(
        (c: { id: string }) =>
          !DEMO_CONTACT_IDS.some((demoId) => c.id.startsWith(demoId)),
      );
      localStorage.setItem("saarathi_contacts", JSON.stringify(realContacts));
      setContacts(realContacts);
    } catch {}

    // Clear DM contacts (demo ones)
    try {
      localStorage.setItem("saarathi_dm_contacts", JSON.stringify([]));
    } catch {}

    // Set flag so MessengerPage won't re-inject sample data on next mount
    localStorage.setItem("saarathi_demo_cleared", "true");
    // Also clear the saarathi_groups key so it doesn't restore demo groups
    localStorage.setItem("saarathi_groups", JSON.stringify([]));
    localStorage.setItem("saarathi_dm_contacts", JSON.stringify([]));
    localStorage.setItem("saarathi_messages", JSON.stringify({}));
    setDemoActive(false);
    toast.success("Demo data removed — now using real workspace");
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
            {/* Also register as client checkbox */}
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alsoAddAsClient}
                onChange={(e) => setAlsoAddAsClient(e.target.checked)}
                className="accent-amber-500 w-4 h-4"
                data-ocid="settings.checkbox"
              />
              Also register as a client in Business Suite
            </label>

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

        {/* Find Users Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-sky-500/10 border-b border-sky-500/20 flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">
              Find Users by Username
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-white/60">
              Search for other SAARATHI users by their username and add them as
              contacts or start a DM.
            </p>
            <div className="flex gap-2">
              <Input
                value={findUsername}
                onChange={(e) => setFindUsername(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isSearching && searchUser()
                }
                placeholder="Enter username to search"
                className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-white/30 flex-1"
                data-ocid="settings.search_input"
              />
              <Button
                onClick={searchUser}
                disabled={isSearching}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 disabled:opacity-60"
                data-ocid="settings.primary_button"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {isSearching && (
              <p
                className="text-sm text-white/40"
                data-ocid="settings.loading_state"
              >
                Searching users...
              </p>
            )}
            {findError && (
              <p
                className="text-sm text-red-400"
                data-ocid="settings.error_state"
              >
                {findError}
              </p>
            )}
            {foundUser && (
              <div
                className="rounded-xl bg-[#2a2a2a] border border-sky-500/20 p-4 flex items-center justify-between gap-3"
                data-ocid="settings.card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 text-base font-bold">
                    {(foundUser.displayName ||
                      foundUser.username)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {foundUser.displayName || foundUser.username}
                    </div>
                    {foundUser.businessName && (
                      <div className="text-xs text-white/50">
                        {foundUser.businessName}
                      </div>
                    )}
                    <div className="text-xs text-sky-400/70 font-mono">
                      @{foundUser.username}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={addFoundUserAsContact}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs px-3 py-1.5 h-auto"
                  data-ocid="settings.primary_button"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add to Contacts
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Demo Data Section */}
        <div className="rounded-2xl bg-[#1e1e1e] border border-white/8 overflow-hidden">
          <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
              Demo Data
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-white/60">
              Your app includes sample chats, contacts, activities, and invoices
              to help you explore. Remove them when you're ready to use real
              data.
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  demoActive
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {demoActive ? "Demo data is active" : "Using real data only"}
              </span>
            </div>
            {demoActive && (
              <Button
                onClick={clearDemoData}
                variant="destructive"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                data-ocid="settings.delete_button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Demo Data
              </Button>
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
