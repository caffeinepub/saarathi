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
  Building2,
  Copy,
  Download,
  Edit2,
  FileDown,
  FileText,
  Package,
  Plus,
  Printer,
  Receipt,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  type CanisterBusinessDoc,
  type CanisterClient,
  type CanisterProduct,
  asExtended,
  canisterDocStatusToLocal,
  canisterDocTypeToLocal,
  docStatusToCanister,
  docTypeToCanister,
} from "../utils/backendExtensions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  placeOfSupply: string;
}

interface Product {
  id: string;
  name: string;
  hsnSac: string;
  description: string;
  unit: string;
  price: number;
  gstRate: number;
}

interface LineItem {
  id: string;
  productId: string;
  description: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
  gstRate: number;
}

type DocType = "invoice" | "estimate" | "proposal";
type DocStatus = "draft" | "sent" | "paid" | "accepted" | "rejected";

interface BusinessDoc {
  id: string;
  type: DocType;
  number: string;
  date: string;
  dueDate: string;
  validity: string;
  clientId: string;
  businessGstin: string;
  placeOfSupply: string;
  lineItems: LineItem[];
  notes: string;
  terms: string;
  coverMessage: string;
  status: DocStatus;
  createdAt: number;
  linkedChatId?: string;
}

// ─── Indian States ────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ["Nos", "Kg", "Hr", "Set", "Ltr", "Mtr", "Sqft", "Box"];

// ─── Sample Data ──────────────────────────────────────────────────────────────
const INITIAL_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Verma Industries",
    gstin: "27AABCV5678R1ZX",
    email: "accounts@vermaindustries.in",
    phone: "9823456780",
    address: "Plot 12, Butibori MIDC",
    city: "Nagpur",
    state: "Maharashtra",
    placeOfSupply: "Maharashtra",
  },
  {
    id: "c2",
    name: "Kapoor Exports LLP",
    gstin: "24AABCK8901P1Z5",
    email: "kapoor.exports@gmail.com",
    phone: "9879001234",
    address: "A-44, Sachin GIDC",
    city: "Surat",
    state: "Gujarat",
    placeOfSupply: "Gujarat",
  },
  {
    id: "c3",
    name: "Bharat Tech Solutions",
    gstin: "27AABCB1234K1ZX",
    email: "finance@bharattech.co.in",
    phone: "9922001133",
    address: "303, Baner Road, Baner",
    city: "Pune",
    state: "Maharashtra",
    placeOfSupply: "Maharashtra",
  },
];

const _INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Export Consulting",
    hsnSac: "998211",
    description:
      "Export documentation, compliance, and trade consulting services",
    unit: "Hr",
    price: 3500,
    gstRate: 18,
  },
  {
    id: "p2",
    name: "Import Documentation",
    hsnSac: "998212",
    description: "Import customs documentation and clearance assistance",
    unit: "Set",
    price: 8000,
    gstRate: 18,
  },
  {
    id: "p3",
    name: "Business Registration",
    hsnSac: "998219",
    description:
      "Company incorporation, GST registration, and startup compliance",
    unit: "Set",
    price: 12000,
    gstRate: 18,
  },
  {
    id: "p4",
    name: "Annual Compliance Package",
    hsnSac: "998311",
    description: "Annual GST filing, ITR, ROC compliance, and audit support",
    unit: "Yr",
    price: 45000,
    gstRate: 18,
  },
];

const SAMPLE_INVOICE_ITEMS: LineItem[] = [
  {
    id: "li1",
    productId: "p1",
    description: "Export Consulting",
    hsnSac: "998211",
    qty: 10,
    unit: "Hr",
    rate: 3500,
    gstRate: 18,
  },
];

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const _INITIAL_DOCS: BusinessDoc[] = [
  {
    id: "d1",
    type: "invoice",
    number: "INV-001",
    date: today,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    validity: "",
    clientId: "c1",
    businessGstin: "27AABCT9801R1ZY",
    placeOfSupply: "Maharashtra",
    lineItems: SAMPLE_INVOICE_ITEMS,
    notes:
      "Payment due within 10 days. NEFT/RTGS/UPI accepted. For queries contact accounts@tattvatraders.in",
    terms: "",
    coverMessage: "",
    status: "sent",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "d2",
    type: "estimate",
    number: "EST-001",
    date: today,
    dueDate: "",
    validity: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    clientId: "c2",
    businessGstin: "27AABCT9801R1ZY",
    placeOfSupply: "Gujarat",
    lineItems: [
      {
        id: "li2",
        productId: "p1",
        description: "Export Consulting",
        hsnSac: "998211",
        qty: 8,
        unit: "Hr",
        rate: 3500,
        gstRate: 18,
      },
      {
        id: "li3",
        productId: "p2",
        description: "Import Documentation",
        hsnSac: "998212",
        qty: 3,
        unit: "Set",
        rate: 8000,
        gstRate: 18,
      },
    ],
    notes: "Estimate valid for 15 days. Prices may vary based on scope.",
    terms: "",
    coverMessage: "",
    status: "draft",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: "d3",
    type: "proposal",
    number: "PRO-001",
    date: today,
    dueDate: "",
    validity: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    clientId: "c3",
    businessGstin: "27AABCT9801R1ZY",
    placeOfSupply: "Maharashtra",
    lineItems: [
      {
        id: "li4",
        productId: "p4",
        description: "Annual Compliance Package",
        hsnSac: "998311",
        qty: 1,
        unit: "Yr",
        rate: 45000,
        gstRate: 18,
      },
    ],
    notes:
      "We look forward to a long-term compliance partnership with Bharat Tech Solutions.",
    terms:
      "50% advance on signing. Balance on delivery of first quarterly filing. Work commences within 5 business days of advance receipt.",
    coverMessage:
      "Dear Priya Bhosale and team, please find our proposal for the Annual Compliance Package. Tattva Traders has been helping businesses stay fully compliant since 2018. We are confident this package will save your team significant time and ensure zero penalties.",
    status: "draft",
    createdAt: Date.now(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function numToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return `Minus ${numToWords(-n)}`;
  let rem = n;
  let result = "";
  if (rem >= 10000000) {
    result += `${numToWords(Math.floor(rem / 10000000))} Crore `;
    rem %= 10000000;
  }
  if (rem >= 100000) {
    result += `${numToWords(Math.floor(rem / 100000))} Lakh `;
    rem %= 100000;
  }
  if (rem >= 1000) {
    result += `${numToWords(Math.floor(rem / 1000))} Thousand `;
    rem %= 1000;
  }
  if (rem >= 100) {
    result += `${ones[Math.floor(rem / 100)]} Hundred `;
    rem %= 100;
  }
  if (rem >= 20) {
    result += `${tens[Math.floor(rem / 10)]} `;
    rem %= 10;
  }
  if (rem > 0) result += `${ones[rem]} `;
  return result.trim();
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = `Rupees ${numToWords(rupees)}`;
  if (paise > 0) result += ` and ${numToWords(paise)} Paise`;
  return `${result} Only`;
}

function calcLineAmount(item: LineItem) {
  return item.qty * item.rate;
}

function calcTotals(
  lineItems: LineItem[],
  clientState: string,
  placeOfSupply: string,
) {
  const subtotal = lineItems.reduce((s, li) => s + calcLineAmount(li), 0);
  const isIntraState = clientState === placeOfSupply;
  const gstBreakdown: Record<
    number,
    { cgst: number; sgst: number; igst: number }
  > = {};
  for (const li of lineItems) {
    const base = calcLineAmount(li);
    const gstAmt = (base * li.gstRate) / 100;
    if (!gstBreakdown[li.gstRate])
      gstBreakdown[li.gstRate] = { cgst: 0, sgst: 0, igst: 0 };
    if (isIntraState) {
      gstBreakdown[li.gstRate].cgst += gstAmt / 2;
      gstBreakdown[li.gstRate].sgst += gstAmt / 2;
    } else {
      gstBreakdown[li.gstRate].igst += gstAmt;
    }
  }
  const totalGst = Object.values(gstBreakdown).reduce(
    (s, g) => s + g.cgst + g.sgst + g.igst,
    0,
  );
  const grandTotal = subtotal + totalGst;
  return { subtotal, gstBreakdown, totalGst, grandTotal, isIntraState };
}

function newLineItem(): LineItem {
  return {
    id: `li${Date.now()}${Math.random()}`,
    productId: "",
    description: "",
    hsnSac: "",
    qty: 1,
    unit: "Nos",
    rate: 0,
    gstRate: 18,
  };
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600 border-gray-200" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700 border-blue-200" },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  accepted: {
    label: "Accepted",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

function nextStatus(s: DocStatus, type: DocType): DocStatus {
  if (type === "invoice") {
    if (s === "draft") return "sent";
    if (s === "sent") return "paid";
    return "draft";
  }
  if (type === "proposal") {
    if (s === "draft") return "sent";
    if (s === "sent") return "accepted";
    return "draft";
  }
  // estimate
  if (s === "draft") return "sent";
  return "draft";
}

function genDocNumber(type: DocType, docs: BusinessDoc[]) {
  const prefix =
    type === "invoice" ? "INV" : type === "estimate" ? "EST" : "PRO";
  const count = docs.filter((d) => d.type === type).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
}

// ─── Client Dialog ────────────────────────────────────────────────────────────
function ClientDialog({
  open,
  client,
  onClose,
  onSave,
}: {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (c: Client) => void;
}) {
  const blank: Client = {
    id: "",
    name: "",
    gstin: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    placeOfSupply: "",
  };
  const [form, setForm] = useState<Client>(client ?? blank);

  // Sync if client prop changes
  const clientKey = client?.id ?? "new";

  function reset() {
    setForm(client ?? blank);
  }

  function set(k: keyof Client, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (k === "state" && !form.placeOfSupply) {
      setForm((prev) => ({ ...prev, state: v, placeOfSupply: v }));
    }
  }

  function handleSave() {
    if (!form.name.trim() || !form.state.trim() || !form.placeOfSupply.trim()) {
      toast.error("Name, State, and Place of Supply are required.");
      return;
    }
    onSave({ ...form, id: form.id || `c${Date.now()}` });
    onClose();
    toast.success(client ? "Client updated!" : "Client added!");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
      key={clientKey}
    >
      <DialogContent
        className="max-w-lg w-full max-h-[calc(100vh-80px)] overflow-y-auto bg-[#fdf8f0] border border-amber-200"
        style={{ marginTop: "4rem" }}
        data-ocid="client.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground">
            {client ? "Edit Client" : "Add New Client"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Dialog</DialogDescription>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">
              Business Name *
            </Label>
            <Input
              className="mt-1 bg-white"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Mehta Exports Pvt Ltd"
              data-ocid="client.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">GSTIN</Label>
            <Input
              className="mt-1 bg-white font-mono text-sm"
              value={form.gstin}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              placeholder="27AABCU9603R1ZX"
              data-ocid="client.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              className="mt-1 bg-white"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="9820012345"
              data-ocid="client.input"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              className="mt-1 bg-white"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="billing@example.com"
              data-ocid="client.input"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Address</Label>
            <Input
              className="mt-1 bg-white"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, Area"
              data-ocid="client.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">City</Label>
            <Input
              className="mt-1 bg-white"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Mumbai"
              data-ocid="client.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">State *</Label>
            <Select value={form.state} onValueChange={(v) => set("state", v)}>
              <SelectTrigger
                className="mt-1 bg-white"
                data-ocid="client.select"
              >
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200">
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">
              Place of Supply *
            </Label>
            <Select
              value={form.placeOfSupply}
              onValueChange={(v) => set("placeOfSupply", v)}
            >
              <SelectTrigger
                className="mt-1 bg-white"
                data-ocid="client.select"
              >
                <SelectValue placeholder="Select place of supply" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200">
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              reset();
              onClose();
            }}
            data-ocid="client.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleSave}
            data-ocid="client.save_button"
          >
            {client ? "Update Client" : "Add Client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Product Dialog ───────────────────────────────────────────────────────────
function ProductDialog({
  open,
  product,
  onClose,
  onSave,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const blank: Product = {
    id: "",
    name: "",
    hsnSac: "",
    description: "",
    unit: "Nos",
    price: 0,
    gstRate: 18,
  };
  const [form, setForm] = useState<Product>(product ?? blank);
  const productKey = product?.id ?? "new";

  function set<K extends keyof Product>(k: K, v: Product[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    onSave({ ...form, id: form.id || `p${Date.now()}` });
    onClose();
    toast.success(product ? "Product updated!" : "Product added!");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      key={productKey}
    >
      <DialogContent
        className="max-w-lg w-full max-h-[calc(100vh-80px)] overflow-y-auto bg-[#fdf8f0] border border-amber-200"
        style={{ marginTop: "4rem" }}
        data-ocid="product.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground">
            {product ? "Edit Product / Service" : "Add Product / Service"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Dialog</DialogDescription>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Name *</Label>
            <Input
              className="mt-1 bg-white"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Software Consulting"
              data-ocid="product.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              HSN / SAC Code
            </Label>
            <Input
              className="mt-1 bg-white font-mono text-sm"
              value={form.hsnSac}
              onChange={(e) => set("hsnSac", e.target.value)}
              placeholder="998314"
              data-ocid="product.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Unit</Label>
            <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
              <SelectTrigger
                className="mt-1 bg-white"
                data-ocid="product.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200">
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Default Price (₹) *
            </Label>
            <Input
              type="number"
              className="mt-1 bg-white"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              placeholder="2000"
              data-ocid="product.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">GST Rate *</Label>
            <Select
              value={String(form.gstRate)}
              onValueChange={(v) => set("gstRate", Number(v))}
            >
              <SelectTrigger
                className="mt-1 bg-white"
                data-ocid="product.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200">
                {GST_RATES.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              className="mt-1 bg-white resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description..."
              data-ocid="product.textarea"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="product.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleSave}
            data-ocid="product.save_button"
          >
            {product ? "Update" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Form Dialog ─────────────────────────────────────────────────────
function DocFormDialog({
  open,
  type,
  editDoc,
  clients,
  products,
  allDocs,
  onClose,
  onSave,
  onAddClient,
}: {
  open: boolean;
  type: DocType;
  editDoc: BusinessDoc | null;
  clients: Client[];
  products: Product[];
  allDocs: BusinessDoc[];
  onClose: () => void;
  onSave: (doc: BusinessDoc) => void;
  onAddClient: (c: Client) => void;
}) {
  const blankDoc = (): BusinessDoc => ({
    id: "",
    type,
    number: genDocNumber(type, allDocs),
    date: today,
    dueDate: nextMonth,
    validity: nextMonth,
    clientId: clients[0]?.id ?? "",
    businessGstin: "27AABCS5555R1ZY",
    placeOfSupply: "Maharashtra",
    lineItems: [newLineItem()],
    notes: "",
    terms: "",
    coverMessage: "",
    status: "draft",
    createdAt: Date.now(),
  });

  const [doc, setDoc] = useState<BusinessDoc>(editDoc ?? blankDoc());
  const [showInlineClient, setShowInlineClient] = useState(false);
  const [inlineClient, setInlineClient] = useState<Partial<Client>>({});
  const [contactSuggestion, setContactSuggestion] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  function checkContactMatch(name: string) {
    if (name.length < 3) {
      setContactSuggestion(null);
      return;
    }
    try {
      const contacts = JSON.parse(
        localStorage.getItem("saarathi_contacts") || "[]",
      );
      const match = contacts.find((c: { name: string; phone: string }) =>
        c.name.toLowerCase().includes(name.toLowerCase()),
      );
      setContactSuggestion(match ?? null);
    } catch {
      setContactSuggestion(null);
    }
  }

  const docKey = editDoc?.id ?? `new-${type}`;

  const selectedClient = clients.find((c) => c.id === doc.clientId);
  const totals = calcTotals(
    doc.lineItems,
    selectedClient?.state ?? "",
    doc.placeOfSupply,
  );

  function setField<K extends keyof BusinessDoc>(k: K, v: BusinessDoc[K]) {
    setDoc((prev) => ({ ...prev, [k]: v }));
  }

  function updateLineItem(
    id: string,
    k: keyof LineItem,
    v: LineItem[keyof LineItem],
  ) {
    setDoc((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li) =>
        li.id === id ? { ...li, [k]: v } : li,
      ),
    }));
  }

  function applyProduct(lineId: string, prodId: string) {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    setDoc((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li) =>
        li.id === lineId
          ? {
              ...li,
              productId: p.id,
              description: p.name,
              hsnSac: p.hsnSac,
              unit: p.unit,
              rate: p.price,
              gstRate: p.gstRate,
            }
          : li,
      ),
    }));
  }

  function addLineItem() {
    setDoc((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newLineItem()],
    }));
  }

  function removeLineItem(id: string) {
    setDoc((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((li) => li.id !== id),
    }));
  }

  function handleSaveInlineClient() {
    if (!inlineClient.name || !inlineClient.state) {
      toast.error("Name and State required.");
      return;
    }
    const c: Client = {
      id: `c${Date.now()}`,
      name: inlineClient.name ?? "",
      gstin: inlineClient.gstin ?? "",
      email: inlineClient.email ?? "",
      phone: inlineClient.phone ?? "",
      address: inlineClient.address ?? "",
      city: inlineClient.city ?? "",
      state: inlineClient.state ?? "",
      placeOfSupply: inlineClient.placeOfSupply ?? inlineClient.state ?? "",
    };
    onAddClient(c);
    setField("clientId", c.id);
    setShowInlineClient(false);
    setInlineClient({});
    toast.success("Client added!");
  }

  function handleSave() {
    if (!doc.clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (doc.lineItems.length === 0) {
      toast.error("Add at least one line item.");
      return;
    }
    onSave({ ...doc, id: doc.id || `d${Date.now()}` });
    onClose();
    toast.success(editDoc ? "Document updated!" : "Document created!");
  }

  const typeLabel =
    type === "invoice"
      ? "Invoice"
      : type === "estimate"
        ? "Estimate"
        : "Proposal";
  const typePrefix =
    type === "invoice" ? "INV" : type === "estimate" ? "EST" : "PRO";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      key={docKey}
    >
      <DialogContent
        className="sm:max-w-5xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto bg-[#fdf8f0] border border-amber-200"
        data-ocid="doc.dialog"
      >
        {/* Print-only header */}
        <div className="hidden print:block mb-6 border-b-2 border-amber-400 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-amber-700">
                SAARATHI Business Suite
              </h1>
              <p className="text-sm text-gray-600">
                GSTIN: {doc.businessGstin}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800">
                {typeLabel.toUpperCase()}
              </h2>
              <p className="text-sm"># {doc.number}</p>
              <p className="text-sm">Date: {formatDate(doc.date)}</p>
            </div>
          </div>
        </div>

        <DialogHeader className="print:hidden">
          <DialogTitle className="font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            {editDoc ? `Edit ${typeLabel}` : `New ${typeLabel}`}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Dialog</DialogDescription>

        <div className="space-y-5 mt-2">
          {/* Proposal cover message */}
          {type === "proposal" && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Cover Message
              </Label>
              <Textarea
                className="mt-1 bg-white resize-none"
                rows={3}
                value={doc.coverMessage}
                onChange={(e) => setField("coverMessage", e.target.value)}
                placeholder="Dear [Client], please find our proposal..."
                data-ocid="doc.textarea"
              />
            </div>
          )}

          {/* Doc header fields */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-amber-100">
            <div>
              <Label className="text-xs text-muted-foreground">
                {typePrefix} Number
              </Label>
              <Input
                className="mt-1 bg-amber-50 font-mono text-sm font-medium"
                value={doc.number}
                onChange={(e) => setField("number", e.target.value)}
                data-ocid="doc.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                className="mt-1 bg-white"
                value={doc.date}
                onChange={(e) => setField("date", e.target.value)}
                data-ocid="doc.input"
              />
            </div>
            {type === "invoice" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Due Date
                </Label>
                <Input
                  type="date"
                  className="mt-1 bg-white"
                  value={doc.dueDate}
                  onChange={(e) => setField("dueDate", e.target.value)}
                  data-ocid="doc.input"
                />
              </div>
            )}
            {(type === "estimate" || type === "proposal") && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Valid Until
                </Label>
                <Input
                  type="date"
                  className="mt-1 bg-white"
                  value={doc.validity}
                  onChange={(e) => setField("validity", e.target.value)}
                  data-ocid="doc.input"
                />
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">
                Your GSTIN
              </Label>
              <Input
                className="mt-1 bg-white font-mono text-sm"
                value={doc.businessGstin}
                onChange={(e) =>
                  setField("businessGstin", e.target.value.toUpperCase())
                }
                data-ocid="doc.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Place of Supply
              </Label>
              <Select
                value={doc.placeOfSupply}
                onValueChange={(v) => setField("placeOfSupply", v)}
              >
                <SelectTrigger className="mt-1 bg-white" data-ocid="doc.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-amber-200">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client */}
          <div className="p-4 bg-white rounded-xl border border-amber-100">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Bill To (Client) *
            </Label>
            <Select
              value={doc.clientId}
              onValueChange={(v) => {
                if (v === "__new__") setShowInlineClient(true);
                else setField("clientId", v);
              }}
            >
              <SelectTrigger className="bg-white" data-ocid="doc.select">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-200">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.city}, {c.state}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ Add New Client</SelectItem>
              </SelectContent>
            </Select>

            {selectedClient && (
              <div className="mt-2 text-xs text-muted-foreground bg-amber-50 rounded-lg p-2 space-y-0.5">
                <div className="font-medium text-amber-800">
                  {selectedClient.name}
                </div>
                {selectedClient.gstin && (
                  <div>GSTIN: {selectedClient.gstin}</div>
                )}
                {selectedClient.address && (
                  <div>
                    {selectedClient.address}, {selectedClient.city}
                  </div>
                )}
                <div>{selectedClient.state}</div>
              </div>
            )}

            {/* Inline new client */}
            <AnimatePresence>
              {showInlineClient && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 border border-amber-200 rounded-xl p-3 bg-amber-50/60 overflow-hidden"
                >
                  <div className="font-semibold text-sm text-amber-700 mb-2">
                    New Client (quick add)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Business Name *"
                        className="bg-white text-sm"
                        value={inlineClient.name ?? ""}
                        onChange={(e) => {
                          setInlineClient((p) => ({
                            ...p,
                            name: e.target.value,
                          }));
                          checkContactMatch(e.target.value);
                        }}
                        data-ocid="doc.input"
                      />
                      {contactSuggestion && (
                        <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                          <span className="text-blue-700">
                            Link to existing contact:{" "}
                            <strong>{contactSuggestion.name}</strong>?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineClient((p) => ({
                                ...p,
                                name: contactSuggestion.name,
                                phone: contactSuggestion.phone,
                              }));
                              setContactSuggestion(null);
                            }}
                            className="ml-auto px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                            data-ocid="doc.primary_button"
                          >
                            Link
                          </button>
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="GSTIN"
                      className="bg-white text-sm font-mono"
                      value={inlineClient.gstin ?? ""}
                      onChange={(e) =>
                        setInlineClient((p) => ({
                          ...p,
                          gstin: e.target.value.toUpperCase(),
                        }))
                      }
                      data-ocid="doc.input"
                    />
                    <Input
                      placeholder="City"
                      className="bg-white text-sm"
                      value={inlineClient.city ?? ""}
                      onChange={(e) =>
                        setInlineClient((p) => ({ ...p, city: e.target.value }))
                      }
                      data-ocid="doc.input"
                    />
                    <div className="col-span-2">
                      <Select
                        value={inlineClient.state ?? ""}
                        onValueChange={(v) =>
                          setInlineClient((p) => ({
                            ...p,
                            state: v,
                            placeOfSupply: v,
                          }))
                        }
                      >
                        <SelectTrigger
                          className="bg-white text-sm"
                          data-ocid="doc.select"
                        >
                          <SelectValue placeholder="State *" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-amber-200">
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInlineClient(false)}
                      data-ocid="doc.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={handleSaveInlineClient}
                      data-ocid="doc.save_button"
                    >
                      Add & Select
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-stone-800 text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-stone-200">
                Line Items
              </span>
              <span className="text-xs text-stone-400">
                {doc.lineItems.length} item
                {doc.lineItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: "640px" }}>
                <thead>
                  <tr className="bg-stone-700 text-white">
                    <th
                      className="text-left py-2.5 px-3 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ minWidth: "160px" }}
                    >
                      Product / Description
                    </th>
                    <th
                      className="text-left py-2.5 px-2 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ width: "80px" }}
                    >
                      HSN/SAC
                    </th>
                    <th
                      className="text-center py-2.5 px-2 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ width: "70px" }}
                    >
                      Qty
                    </th>
                    <th
                      className="text-left py-2.5 px-2 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ width: "70px" }}
                    >
                      Unit
                    </th>
                    <th
                      className="text-right py-2.5 px-2 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ width: "90px" }}
                    >
                      Rate (₹)
                    </th>
                    <th
                      className="text-center py-2.5 px-2 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ width: "70px" }}
                    >
                      GST%
                    </th>
                    <th
                      className="text-right py-2.5 px-3 font-semibold uppercase tracking-wide text-[10px] text-stone-200"
                      style={{ width: "90px" }}
                    >
                      Amount (₹)
                    </th>
                    <th style={{ width: "40px" }} />
                  </tr>
                </thead>
                <tbody>
                  {doc.lineItems.map((li, idx) => (
                    <tr
                      key={li.id}
                      className={`border-b border-stone-100 ${idx % 2 === 0 ? "bg-white" : "bg-stone-50/40"}`}
                      data-ocid={`doc.row.${idx + 1}`}
                    >
                      <td className="py-2 px-3">
                        <Select
                          value={li.productId}
                          onValueChange={(v) => applyProduct(li.id, v)}
                        >
                          <SelectTrigger
                            className="h-7 text-xs bg-white border border-stone-200 rounded mb-1"
                            data-ocid="doc.select"
                          >
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-amber-200">
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="h-7 text-xs bg-white border border-stone-200 rounded"
                          placeholder="Description"
                          value={li.description}
                          onChange={(e) =>
                            updateLineItem(li.id, "description", e.target.value)
                          }
                          data-ocid="doc.input"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          className="h-7 text-xs bg-white font-mono border border-stone-200 rounded"
                          value={li.hsnSac}
                          onChange={(e) =>
                            updateLineItem(li.id, "hsnSac", e.target.value)
                          }
                          data-ocid="doc.input"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          className="h-7 text-xs bg-white text-center border border-stone-200 rounded"
                          value={li.qty}
                          onChange={(e) =>
                            updateLineItem(li.id, "qty", Number(e.target.value))
                          }
                          data-ocid="doc.input"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Select
                          value={li.unit}
                          onValueChange={(v) =>
                            updateLineItem(li.id, "unit", v)
                          }
                        >
                          <SelectTrigger
                            className="h-7 text-xs bg-white border border-stone-200 rounded"
                            data-ocid="doc.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-amber-200">
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          className="h-7 text-xs bg-white text-right border border-stone-200 rounded"
                          value={li.rate}
                          onChange={(e) =>
                            updateLineItem(
                              li.id,
                              "rate",
                              Number(e.target.value),
                            )
                          }
                          data-ocid="doc.input"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Select
                          value={String(li.gstRate)}
                          onValueChange={(v) =>
                            updateLineItem(li.id, "gstRate", Number(v))
                          }
                        >
                          <SelectTrigger
                            className="h-7 text-xs bg-white border border-stone-200 rounded"
                            data-ocid="doc.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-amber-200">
                            {GST_RATES.map((r) => (
                              <SelectItem key={r} value={String(r)}>
                                {r}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-amber-700">
                        {formatINR(calcLineAmount(li))}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {doc.lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(li.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100 text-stone-300 hover:text-red-600 transition-colors mx-auto"
                            data-ocid={`doc.delete_button.${idx + 1}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Item Button */}
            <button
              type="button"
              onClick={addLineItem}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-amber-600 border-t border-dashed border-amber-300 hover:bg-amber-50 transition-colors"
              data-ocid="doc.button"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>

            {/* Totals */}
            <div className="mt-0 pt-4 px-4 pb-4 border-t border-amber-100 bg-amber-50/30">
              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(totals.subtotal)}</span>
                </div>
                {Object.entries(totals.gstBreakdown).map(([rate, g]) =>
                  totals.isIntraState ? (
                    <>
                      <div
                        key={`cgst-${rate}`}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>CGST {Number(rate) / 2}%</span>
                        <span>{formatINR(g.cgst)}</span>
                      </div>
                      <div
                        key={`sgst-${rate}`}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>SGST {Number(rate) / 2}%</span>
                        <span>{formatINR(g.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div
                      key={`igst-${rate}`}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span>IGST {rate}%</span>
                      <span>{formatINR(g.igst)}</span>
                    </div>
                  ),
                )}
                <div className="flex justify-between font-bold text-base text-foreground border-t border-amber-200 pt-2 mt-1">
                  <span>Grand Total</span>
                  <span className="text-amber-700">
                    {formatINR(totals.grandTotal)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground italic bg-amber-50 rounded-lg p-2">
                  {amountInWords(totals.grandTotal)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {totals.isIntraState
                    ? "(Intra-state: CGST + SGST)"
                    : "(Inter-state: IGST)"}
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                className="mt-1 bg-white resize-none"
                rows={3}
                value={doc.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Payment instructions, thank you note..."
                data-ocid="doc.textarea"
              />
            </div>
            {type === "proposal" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Terms & Conditions
                </Label>
                <Textarea
                  className="mt-1 bg-white resize-none"
                  rows={3}
                  value={doc.terms}
                  onChange={(e) => setField("terms", e.target.value)}
                  placeholder="Payment terms, delivery conditions..."
                  data-ocid="doc.textarea"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1 print:hidden">
            <Button
              variant="outline"
              onClick={() => printDocInNewWindow(doc, selectedClient)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              data-ocid="doc.button"
            >
              <Printer className="w-4 h-4 mr-2" /> Print / PDF
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={onClose}
              data-ocid="doc.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleSave}
              data-ocid="doc.save_button"
            >
              {editDoc ? "Update" : `Save ${typeLabel}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Print in New Window ─────────────────────────────────────────────────────
function printDocInNewWindow(doc: BusinessDoc, client: Client | undefined) {
  const totals = calcTotals(
    doc.lineItems,
    client?.state ?? "",
    doc.placeOfSupply,
  );
  const typeLabel =
    doc.type === "invoice"
      ? "TAX INVOICE"
      : doc.type === "estimate"
        ? "ESTIMATE"
        : "PROPOSAL";
  const gstRows = Object.entries(totals.gstBreakdown)
    .map(([rate, g]) => {
      if (totals.isIntraState) {
        return `<tr><td style="padding:4px 8px;border:1px solid #ddd">GST ${rate}%</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">CGST ${formatINR(g.cgst)}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">SGST ${formatINR(g.sgst)}</td></tr>`;
      }
      return `<tr><td style="padding:4px 8px;border:1px solid #ddd">IGST ${rate}%</td><td colspan="2" style="padding:4px 8px;border:1px solid #ddd;text-align:right">${formatINR(g.igst)}</td></tr>`;
    })
    .join("");
  const lineRows = doc.lineItems
    .map(
      (li, i) => `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${li.description || "—"}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.hsnSac || "—"}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.qty} ${li.unit}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${formatINR(li.rate)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.gstRate}%</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${formatINR(li.qty * li.rate)}</td>
      </tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${typeLabel} - ${doc.number}</title><style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #222; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    table { border-collapse: collapse; width: 100%; }
    th { background: #d97706; color: white; padding: 8px; border: 1px solid #ddd; text-align: left; }
    .label { color: #888; font-size: 12px; }
    .grand-total td { font-weight: bold; font-size: 16px; background: #fef3c7; }
  </style></head><body>
  <div class="no-print" style="text-align:right;margin-bottom:12px">
    <button onclick="window.print()" style="padding:8px 20px;background:#d97706;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer">🖨️ Print / Save as PDF</button>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d97706;padding-bottom:16px;margin-bottom:16px">
    <div>
      <div style="font-size:22px;font-weight:bold;color:#92400e">SAARATHI</div>
      <div style="font-size:13px;color:#666">Business Suite</div>
      <div class="label">GSTIN: ${doc.businessGstin || "—"}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:bold;color:#92400e">${typeLabel}</div>
      <div style="font-size:15px"><strong>#${doc.number}</strong></div>
      <div class="label">Date: ${formatDate(doc.date)}</div>
      ${doc.dueDate ? `<div class="label">Due: ${formatDate(doc.dueDate)}</div>` : ""}
      ${doc.validity ? `<div class="label">Valid till: ${formatDate(doc.validity)}</div>` : ""}
    </div>
  </div>
  ${
    client
      ? `<div style="background:#fffbeb;padding:12px;border-radius:6px;margin-bottom:16px;border:1px solid #fde68a">
    <div class="label">Bill To</div>
    <div style="font-weight:bold;font-size:16px;margin-top:4px">${client.name}</div>
    <div style="margin-top:2px">${client.address}, ${client.city}, ${client.state}</div>
    ${client.gstin ? `<div class="label" style="margin-top:4px">GSTIN: ${client.gstin}</div>` : ""}
    ${client.phone ? `<div class="label">Phone: ${client.phone}</div>` : ""}
    ${client.email ? `<div class="label">Email: ${client.email}</div>` : ""}
  </div>`
      : ""
  }
  <table style="margin-bottom:16px">
    <thead><tr>
      <th style="width:40px">#</th>
      <th>Description</th>
      <th>HSN/SAC</th>
      <th>Qty / Unit</th>
      <th>Rate</th>
      <th>GST%</th>
      <th>Amount</th>
    </tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <table style="width:380px;margin-left:auto;margin-bottom:16px">
    <tbody>
      <tr><td style="padding:6px 8px;border:1px solid #ddd">Subtotal</td><td colspan="2" style="padding:6px 8px;border:1px solid #ddd;text-align:right">${formatINR(totals.subtotal)}</td></tr>
      ${gstRows}
      <tr class="grand-total"><td colspan="2" style="padding:8px;border:1px solid #ddd">Grand Total</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${formatINR(totals.grandTotal)}</td></tr>
    </tbody>
  </table>
  <div style="font-style:italic;color:#555;margin-bottom:12px;padding:8px;background:#fffbeb;border-radius:4px">${amountInWords(totals.grandTotal)}</div>
  ${doc.notes ? `<div style="margin-bottom:8px"><strong>Notes:</strong> ${doc.notes}</div>` : ""}
  ${doc.terms ? `<div style="margin-bottom:8px"><strong>Terms &amp; Conditions:</strong> ${doc.terms}</div>` : ""}
  </body></html>`;
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) {
    alert("Please allow popups to generate the PDF.");
    return;
  }
  popup.document.write(html);
  popup.document.close();
  setTimeout(() => {
    popup.print();
  }, 300);
}

// ─── Document List Card ───────────────────────────────────────────────────────
function DocCard({
  doc,
  client,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusCycle,
  onSendToMessenger,
  onPrint,
  onMarkPaid,
  onSendReminder,
}: {
  doc: BusinessDoc;
  client: Client | undefined;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStatusCycle: () => void;
  onSendToMessenger: () => void;
  onPrint: () => void;
  onMarkPaid?: () => void;
  onSendReminder?: () => void;
}) {
  const sc = STATUS_CONFIG[doc.status];
  const total = calcTotals(
    doc.lineItems,
    client?.state ?? "",
    doc.placeOfSupply,
  ).grandTotal;

  // Due countdown
  const dueDays = doc.dueDate
    ? Math.ceil(
        (new Date(doc.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const isOverdueDoc = dueDays !== null && dueDays < 0 && doc.status !== "paid";
  const isDueTodayDoc = dueDays === 0 && doc.status !== "paid";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`doc.item.${index + 1}`}
      className="bg-white rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-mono mb-0.5">
            {doc.number}
          </div>
          <div className="font-semibold text-foreground truncate">
            {client?.name ?? "Unknown Client"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatDate(doc.date)}
            {doc.dueDate && ` · Due: ${formatDate(doc.dueDate)}`}
            {doc.validity && ` · Valid till: ${formatDate(doc.validity)}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-lg text-amber-700">
            {formatINR(total)}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc.color}`}
              data-ocid={`doc.row.${index + 1}`}
            >
              {sc.label}
            </span>
            {dueDays !== null && doc.status !== "paid" && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isOverdueDoc
                    ? "bg-red-100 text-red-600"
                    : isDueTodayDoc
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-50 text-blue-600"
                }`}
              >
                {isOverdueDoc
                  ? `Overdue by ${Math.abs(dueDays)}d`
                  : isDueTodayDoc
                    ? "Due today"
                    : `Due in ${dueDays}d`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {doc.type === "invoice" && doc.status !== "paid" && onMarkPaid && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-green-300 text-green-700 hover:bg-green-50 font-semibold"
            onClick={onMarkPaid}
            data-ocid={`doc.mark_paid.button.${index + 1}`}
          >
            ✓ Mark as Paid
          </Button>
        )}
        {doc.type === "invoice" && doc.status === "paid" && (
          <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold flex items-center gap-1">
            ✓ Paid
          </span>
        )}
        {doc.type === "invoice" && doc.status !== "paid" && onSendReminder && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={onSendReminder}
            data-ocid={`doc.send_reminder.button.${index + 1}`}
          >
            <Send className="w-3 h-3 mr-1" /> Reminder
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
          onClick={onEdit}
          data-ocid={`doc.edit_button.${index + 1}`}
        >
          <Edit2 className="w-3 h-3 mr-1" /> View / Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={onStatusCycle}
          data-ocid={`doc.toggle.${index + 1}`}
        >
          {sc.label} →
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-green-200 text-green-700 hover:bg-green-50"
          onClick={onSendToMessenger}
          data-ocid={`doc.button.${index + 1}`}
        >
          <Send className="w-3 h-3 mr-1" /> Send
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={onDuplicate}
          data-ocid={`doc.secondary_button.${index + 1}`}
        >
          <Copy className="w-3 h-3 mr-1" /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
          onClick={onPrint}
          data-ocid={`doc.button.${index + 1}`}
        >
          <FileDown className="w-3 h-3 mr-1" /> PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-red-200 text-red-600 hover:bg-red-50"
          onClick={onDelete}
          data-ocid={`doc.delete_button.${index + 1}`}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Doc List Tab ─────────────────────────────────────────────────────────────
function DocListTab({
  type,
  docs,
  clients,
  products,
  allDocs,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onStatusCycle,
  onSendToMessenger,
  onAddClient,
  onPrintDoc,
}: {
  type: DocType;
  docs: BusinessDoc[];
  clients: Client[];
  products: Product[];
  allDocs: BusinessDoc[];
  onAdd: (doc: BusinessDoc) => void;
  onUpdate: (doc: BusinessDoc) => void;
  onDelete: (id: string) => void;
  onDuplicate: (doc: BusinessDoc) => void;
  onStatusCycle: (id: string) => void;
  onSendToMessenger: (doc: BusinessDoc) => void;
  onAddClient: (c: Client) => void;
  onPrintDoc: (doc: BusinessDoc) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState<BusinessDoc | null>(null);

  // Listen for prefill event from chat context (invoice only)
  useEffect(() => {
    if (type !== "invoice") return;
    function handlePrefill(e: Event) {
      const doc = (e as CustomEvent<BusinessDoc>).detail;
      setEditDoc(doc);
      setShowForm(true);
    }
    window.addEventListener("saarathi:open-invoice-prefill", handlePrefill);
    return () =>
      window.removeEventListener(
        "saarathi:open-invoice-prefill",
        handlePrefill,
      );
  }, [type]);

  const typeLabel =
    type === "invoice"
      ? "Invoice"
      : type === "estimate"
        ? "Estimate"
        : "Proposal";

  const filtered = docs.filter((d) => d.type === type);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            setEditDoc(null);
            setShowForm(true);
          }}
          data-ocid="doc.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" /> New {typeLabel}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="doc.empty_state"
        >
          <FileText className="w-12 h-12 mx-auto mb-3 text-amber-200" />
          <div className="font-medium">No {typeLabel.toLowerCase()}s yet</div>
          <div className="text-sm mt-1">
            {type === "invoice"
              ? "Generate invoices from conversations 💬 — open Messenger and tap 'Create Invoice'"
              : `Create your first ${typeLabel.toLowerCase()} using the button above.`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((doc, i) => (
              <DocCard
                key={doc.id}
                doc={doc}
                client={clients.find((c) => c.id === doc.clientId)}
                index={i}
                onEdit={() => {
                  setEditDoc(doc);
                  setShowForm(true);
                }}
                onDelete={() => onDelete(doc.id)}
                onDuplicate={() => onDuplicate(doc)}
                onStatusCycle={() => onStatusCycle(doc.id)}
                onSendToMessenger={() => onSendToMessenger(doc)}
                onPrint={() => onPrintDoc(doc)}
                onMarkPaid={() => {
                  onStatusCycle(doc.id);
                  // Post chat message
                  try {
                    const paidMsg = {
                      id: `paid_${Date.now()}`,
                      senderId: "me",
                      senderName: "You",
                      content: `💳 Invoice ${doc.number} has been marked as Paid`,
                      msgType: "text",
                      timestamp: Date.now(),
                    };
                    const stored = JSON.parse(
                      localStorage.getItem("saarathi_messages") || "{}",
                    );
                    const chatKey = doc.linkedChatId || "group_g1";
                    stored[chatKey] = [...(stored[chatKey] ?? []), paidMsg];
                    localStorage.setItem(
                      "saarathi_messages",
                      JSON.stringify(stored),
                    );
                    window.dispatchEvent(
                      new CustomEvent("saarathi_messages_updated"),
                    );
                  } catch {}
                  toast.success("Invoice marked as paid");
                }}
                onSendReminder={() => {
                  const reminderMsg = {
                    id: `reminder_${Date.now()}`,
                    senderId: "me",
                    senderName: "You",
                    content: `💳 Payment reminder: Invoice ${doc.number} for ₹${calcTotals(doc.lineItems, "", "").grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} is due. Please arrange payment at the earliest.`,
                    msgType: "text",
                    timestamp: Date.now(),
                  };
                  try {
                    const stored = JSON.parse(
                      localStorage.getItem("saarathi_messages") || "{}",
                    );
                    stored.group_g1 = [...(stored.group_g1 ?? []), reminderMsg];
                    localStorage.setItem(
                      "saarathi_messages",
                      JSON.stringify(stored),
                    );
                  } catch {}
                  toast.success("Reminder sent to chat");
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <DocFormDialog
        open={showForm}
        type={type}
        editDoc={editDoc}
        clients={clients}
        products={products}
        allDocs={allDocs}
        onClose={() => {
          setShowForm(false);
          setEditDoc(null);
        }}
        onSave={(doc) => {
          if (editDoc) onUpdate(doc);
          else onAdd(doc);
        }}
        onAddClient={onAddClient}
      />
    </div>
  );
}

// ─── Send to Messenger Confirm ────────────────────────────────────────────────

// ─── Print Doc Overlay (for card PDF button) ──────────────────────────────────
function PrintDocOverlay({
  doc,
  client,
  onDone,
}: {
  doc: BusinessDoc;
  client: Client | undefined;
  onDone: () => void;
}) {
  const totals = calcTotals(
    doc.lineItems,
    client?.state ?? "",
    doc.placeOfSupply,
  );
  const typeLabel =
    doc.type === "invoice"
      ? "INVOICE"
      : doc.type === "estimate"
        ? "ESTIMATE"
        : "PROPOSAL";

  // Use effect to auto-close after print
  return (
    <div
      id="pdf-print-area"
      className="fixed inset-0 z-[9999] bg-white overflow-auto print:static print:inset-auto p-8"
    >
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-start mb-6 print:hidden">
          <span className="text-sm text-muted-foreground">Print Preview</span>
          <button
            type="button"
            onClick={onDone}
            className="text-sm underline text-amber-700"
          >
            ✕ Close
          </button>
        </div>

        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-700">{typeLabel}</h1>
            <p className="text-sm font-mono text-muted-foreground">
              {doc.number}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {formatDate(doc.date)}
            </p>
            {doc.dueDate && (
              <p>
                <span className="font-semibold">Due:</span>{" "}
                {formatDate(doc.dueDate)}
              </p>
            )}
            {doc.validity && (
              <p>
                <span className="font-semibold">Valid till:</span>{" "}
                {formatDate(doc.validity)}
              </p>
            )}
          </div>
        </div>

        {/* Bill To */}
        {client && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Bill To
            </p>
            <p className="font-bold text-foreground">{client.name}</p>
            {client.address && (
              <p className="text-sm">
                {client.address}, {client.city}
              </p>
            )}
            <p className="text-sm">{client.state}</p>
            {client.gstin && (
              <p className="text-sm font-mono">GSTIN: {client.gstin}</p>
            )}
          </div>
        )}

        {/* GST Info */}
        {doc.businessGstin && (
          <div className="mb-4 text-sm">
            <span className="font-semibold">Business GSTIN:</span>{" "}
            {doc.businessGstin}
            {doc.placeOfSupply && (
              <span className="ml-4">
                <span className="font-semibold">Place of Supply:</span>{" "}
                {doc.placeOfSupply}
              </span>
            )}
          </div>
        )}

        {/* Cover Message for Proposals */}
        {doc.type === "proposal" && doc.coverMessage && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            {doc.coverMessage}
          </div>
        )}

        {/* Line Items */}
        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="bg-amber-500 text-white">
              <th className="text-left p-2">Description</th>
              <th className="text-center p-2">HSN/SAC</th>
              <th className="text-center p-2">Qty</th>
              <th className="text-center p-2">Unit</th>
              <th className="text-right p-2">Rate</th>
              <th className="text-center p-2">GST%</th>
              <th className="text-right p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.lineItems.map((li, i) => (
              <tr
                key={li.id}
                className={i % 2 === 0 ? "bg-white" : "bg-amber-50/30"}
              >
                <td className="p-2">{li.description}</td>
                <td className="p-2 text-center font-mono text-xs">
                  {li.hsnSac}
                </td>
                <td className="p-2 text-center">{li.qty}</td>
                <td className="p-2 text-center">{li.unit}</td>
                <td className="p-2 text-right">{formatINR(li.rate)}</td>
                <td className="p-2 text-center">{li.gstRate}%</td>
                <td className="p-2 text-right">
                  {formatINR(li.qty * li.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            {Object.entries(totals.gstBreakdown).map(([rate, g]) => (
              <div key={rate}>
                {!totals.isIntraState ? (
                  <div className="flex justify-between">
                    <span>IGST {rate}%</span>
                    <span>{formatINR(g.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST {Number(rate) / 2}%</span>
                      <span>{formatINR(g.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST {Number(rate) / 2}%</span>
                      <span>{formatINR(g.sgst)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t border-amber-300 pt-1">
              <span>Grand Total</span>
              <span className="text-amber-700">
                {formatINR(totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic mb-4">
          Amount in words: {amountInWords(totals.grandTotal)}
        </p>

        {/* Notes */}
        {doc.notes && (
          <div className="mb-4">
            <p className="font-semibold text-sm mb-1">Notes:</p>
            <p className="text-sm whitespace-pre-wrap">{doc.notes}</p>
          </div>
        )}

        {/* Terms for Proposals */}
        {doc.type === "proposal" && doc.terms && (
          <div className="mb-4">
            <p className="font-semibold text-sm mb-1">Terms & Conditions:</p>
            <p className="text-sm whitespace-pre-wrap">{doc.terms}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => printDocInNewWindow(doc, client)}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function SendDocDialog({
  doc,
  client,
  onClose,
}: {
  doc: BusinessDoc | null;
  client: Client | undefined;
  onClose: () => void;
}) {
  if (!doc) return null;
  const totals = calcTotals(
    doc.lineItems,
    client?.state ?? "",
    doc.placeOfSupply,
  );
  const typeLabel =
    doc.type === "invoice"
      ? "Invoice"
      : doc.type === "estimate"
        ? "Estimate"
        : "Proposal";

  const message = [
    `📄 *${typeLabel} ${doc.number}*`,
    `Client: ${client?.name ?? "—"}`,
    `Date: ${formatDate(doc.date)}`,
    doc.dueDate ? `Due: ${formatDate(doc.dueDate)}` : "",
    `Amount: ${formatINR(totals.grandTotal)}`,
    doc.notes ? `Note: ${doc.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  function handleSend() {
    localStorage.setItem(
      "saarathi_pending_task_message",
      JSON.stringify({
        groupId: "general",
        text: message,
        timestamp: Date.now(),
      }),
    );
    onClose();
    toast.success(`${typeLabel} sent to Messenger!`);
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
        data-ocid="doc.modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Send className="w-4 h-4 text-blue-600" /> Send to Messenger
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Dialog</DialogDescription>
        <p className="text-sm text-muted-foreground">Preview message:</p>
        <div className="bg-white rounded-xl border border-blue-100 p-4 text-sm whitespace-pre-wrap font-mono text-foreground">
          {message}
        </div>
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="doc.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSend}
            data-ocid="doc.confirm_button"
          >
            <Send className="w-4 h-4 mr-2" /> Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab({
  clients,
  onAdd,
  onUpdate,
  onDelete,
}: {
  clients: Client[];
  onAdd: (c: Client) => void;
  onUpdate: (c: Client) => void;
  onDelete: (id: string) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            setEditClient(null);
            setShowDialog(true);
          }}
          data-ocid="client.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="client.empty_state"
        >
          <Users className="w-12 h-12 mx-auto mb-3 text-amber-200" />
          <div className="font-medium">No clients yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {clients.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`client.item.${i + 1}`}
                className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">
                      {c.name}
                    </div>
                    {c.gstin && (
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        GSTIN: {c.gstin}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {[c.city, c.state].filter(Boolean).join(", ")}
                    </div>
                    {c.phone && (
                      <div className="text-xs text-muted-foreground">
                        {c.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setEditClient(c);
                        setShowDialog(true);
                      }}
                      data-ocid={`client.edit_button.${i + 1}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        onDelete(c.id);
                        toast.success("Client removed.");
                      }}
                      data-ocid={`client.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ClientDialog
        open={showDialog}
        client={editClient}
        onClose={() => {
          setShowDialog(false);
          setEditClient(null);
        }}
        onSave={(c) => {
          if (editClient) onUpdate(c);
          else onAdd(c);
          setShowDialog(false);
          setEditClient(null);
        }}
      />
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab({
  products,
  onAdd,
  onUpdate,
  onDelete,
}: {
  products: Product[];
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            setEditProduct(null);
            setShowDialog(true);
          }}
          data-ocid="product.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="product.empty_state"
        >
          <Package className="w-12 h-12 mx-auto mb-3 text-amber-200" />
          <div className="font-medium">No products yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`product.item.${i + 1}`}
                className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">
                      {p.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      HSN/SAC:{" "}
                      <span className="font-mono">{p.hsnSac || "—"}</span>
                      {" · "}
                      {p.unit}
                      {" · "}
                      {formatINR(p.price)}/{p.unit}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        GST {p.gstRate}%
                      </span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {p.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setEditProduct(p);
                        setShowDialog(true);
                      }}
                      data-ocid={`product.edit_button.${i + 1}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        onDelete(p.id);
                        toast.success("Product removed.");
                      }}
                      data-ocid={`product.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ProductDialog
        open={showDialog}
        product={editProduct}
        onClose={() => {
          setShowDialog(false);
          setEditProduct(null);
        }}
        onSave={(p) => {
          if (editProduct) onUpdate(p);
          else onAdd(p);
          setShowDialog(false);
          setEditProduct(null);
        }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function MoneySnapshot() {
  const [data, setData] = useState<{
    expected: number;
    pending: number;
    overdue: number;
    isReal: boolean;
  } | null>(null);

  useEffect(() => {
    function recalculate() {
      try {
        const docs = JSON.parse(
          localStorage.getItem("saarathi_business_docs") || "[]",
        );
        const invoices = docs.filter(
          (d: { type: string }) => d.type === "invoice",
        );
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const thisMonthInvoices = invoices.filter((d: { date: string }) =>
          d.date?.startsWith(thisMonth),
        );

        if (thisMonthInvoices.length > 0) {
          const calcTotal = (d: {
            lineItems: Array<{ qty: number; rate: number; gstRate: number }>;
          }) =>
            d.lineItems.reduce(
              (s, i) => s + i.qty * i.rate * (1 + i.gstRate / 100),
              0,
            );

          const expected = thisMonthInvoices.reduce(
            (s: number, d: any) => s + calcTotal(d),
            0,
          );
          const pending = thisMonthInvoices
            .filter((d: { status: string }) => d.status !== "paid")
            .reduce((s: number, d: any) => s + calcTotal(d), 0);
          const overdue = thisMonthInvoices
            .filter((d: { status: string; dueDate?: string }) => {
              if (d.status === "paid") return false;
              if (!d.dueDate) return false;
              return new Date(d.dueDate) < now;
            })
            .reduce((s: number, d: any) => s + calcTotal(d), 0);

          setData({ expected, pending, overdue, isReal: true });
        } else {
          setData({
            expected: 120000,
            pending: 68000,
            overdue: 18000,
            isReal: false,
          });
        }
      } catch {
        setData({
          expected: 120000,
          pending: 68000,
          overdue: 18000,
          isReal: false,
        });
      }
    }
    recalculate();
    window.addEventListener("saarathi:docs-updated", recalculate);
    return () =>
      window.removeEventListener("saarathi:docs-updated", recalculate);
  }, []);

  if (!data) return null;

  const fmt = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <div
      className="mb-4 p-4 rounded-xl border border-amber-200/20 bg-amber-950/20"
      data-ocid="business.money_snapshot"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
          This Month
        </span>
        {!data.isReal && (
          <span className="text-[10px] text-stone-500 italic">
            Sample data — start creating invoices
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-lg font-bold text-white">
            {fmt(data.expected)}
          </div>
          <div className="text-[10px] text-stone-400">Expected</div>
        </div>
        <div>
          <div className="text-lg font-bold text-amber-400">
            {fmt(data.pending)}
          </div>
          <div className="text-[10px] text-stone-400">⚠ Pending</div>
        </div>
        <div>
          <div className="text-lg font-bold text-red-400">
            {fmt(data.overdue)}
          </div>
          <div className="text-[10px] text-stone-400">Overdue</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-green-400 font-medium">
        ↑ +12% from last month
      </div>
    </div>
  );
}

export default function BusinessSuitePage() {
  const { actor } = useActor();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [docs, setDocs] = useState<BusinessDoc[]>([]);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [canisterStopped, setCanisterStopped] = useState(false);
  const [sendTarget, setSendTarget] = useState<BusinessDoc | null>(null);
  const [printDoc, setPrintDoc] = useState<BusinessDoc | null>(null);

  // Mapping helpers
  function mapCanisterClient(c: CanisterClient): Client {
    return {
      id: c.id,
      name: c.name,
      gstin: c.gstin,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      state: c.state,
      placeOfSupply: c.placeOfSupply,
    };
  }
  function mapCanisterProduct(p: CanisterProduct): Product {
    return {
      id: p.id,
      name: p.name,
      hsnSac: p.hsnSac,
      description: p.description,
      unit: p.unit,
      price: p.price,
      gstRate: p.gstRate,
    };
  }
  function mapCanisterDoc(d: CanisterBusinessDoc): BusinessDoc {
    return {
      id: d.id,
      type: canisterDocTypeToLocal(d.docType) as DocType,
      number: d.number,
      date: d.date,
      dueDate: d.dueDate,
      validity: d.validity,
      clientId: d.clientId,
      businessGstin: d.businessGstin,
      placeOfSupply: d.placeOfSupply,
      lineItems: d.lineItems,
      notes: d.notes,
      terms: d.terms,
      coverMessage: d.coverMessage,
      status: canisterDocStatusToLocal(d.status) as DocStatus,
      createdAt: Number(d.createdAt) / 1_000_000,
      linkedChatId: d.linkedChatId || undefined,
    };
  }

  // Load data from canister + poll docs every 5s
  // biome-ignore lint/correctness/useExhaustiveDependencies: mapping helpers are stable component functions
  useEffect(() => {
    if (!actor) return;
    const ext = asExtended(actor);

    async function fetchAll() {
      try {
        const [rawClients, rawProducts, rawDocs] = await Promise.all([
          ext.listMyClients(),
          ext.listMyProducts(),
          ext.listMyDocs(),
        ]);
        setClients(rawClients.map(mapCanisterClient));
        setProducts(rawProducts.map(mapCanisterProduct));
        setDocs(rawDocs.map(mapCanisterDoc));
      } catch (err) {
        const msg = String(err);
        if (
          msg.includes("IC0508") ||
          msg.includes("is stopped") ||
          msg.includes("stopped and therefore")
        ) {
          setCanisterStopped(true);
        } else {
          console.error("Failed to load business data:", err);
          toast.error("Failed to load business data");
        }
      } finally {
        setLoadingBusiness(false);
      }
    }

    fetchAll();
    const interval = setInterval(async () => {
      if (!actor) return;
      try {
        const rawDocs = await asExtended(actor).listMyDocs();
        setDocs(rawDocs.map(mapCanisterDoc));
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [actor]);

  // Sync docs and clients when updated externally (e.g. via Send Now in chat)
  useEffect(() => {
    function handleDocsUpdated() {
      try {
        const raw = localStorage.getItem("saarathi_business_docs");
        if (raw) setDocs(JSON.parse(raw));
        const rawClients = localStorage.getItem("saarathi_clients");
        if (rawClients) setClients(JSON.parse(rawClients));
      } catch {}
    }
    window.addEventListener("saarathi:docs-updated", handleDocsUpdated);
    return () =>
      window.removeEventListener("saarathi:docs-updated", handleDocsUpdated);
  }, []);

  // Pre-fill invoice from chat context
  useEffect(() => {
    try {
      const raw = localStorage.getItem("saarathi_prefill_invoice");
      if (raw) {
        localStorage.removeItem("saarathi_prefill_invoice");
        const prefill = JSON.parse(raw) as {
          clientName: string;
          amount: number;
        };
        const clientsRaw = localStorage.getItem("saarathi_clients");
        const clientsList: Array<{ id: string; name: string }> = clientsRaw
          ? JSON.parse(clientsRaw)
          : INITIAL_CLIENTS;
        let client = clientsList.find(
          (c) => c.name.toLowerCase() === prefill.clientName.toLowerCase(),
        );
        if (!client) client = clientsList[0];
        const clientId = client?.id ?? "c1";
        const newDoc: BusinessDoc = {
          id: `inv_prefill_${Date.now()}`,
          type: "invoice",
          number: `INV-${String(Date.now()).slice(-4)}`,
          clientId,
          date: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          validity: "",
          businessGstin: "",
          placeOfSupply: "",
          status: "draft",
          lineItems: [
            {
              id: "li1",
              productId: "",
              description: "Services",
              hsnSac: "",
              qty: 1,
              unit: "Nos",
              rate: prefill.amount,
              gstRate: 18,
            },
          ],
          notes: "",
          terms: "",
          coverMessage: "",
          createdAt: Date.now(),
        };
        window.dispatchEvent(
          new CustomEvent("saarathi:open-invoice-prefill", { detail: newDoc }),
        );
      }
    } catch {}
  }, []);

  // Doc counts for tab badges
  const counts = useMemo(
    () => ({
      invoice: docs.filter((d) => d.type === "invoice").length,
      estimate: docs.filter((d) => d.type === "estimate").length,
      proposal: docs.filter((d) => d.type === "proposal").length,
    }),
    [docs],
  );

  async function addDoc(doc: BusinessDoc) {
    if (!actor) {
      toast.error("Not connected");
      return;
    }
    try {
      const ext = asExtended(actor);
      await ext.createDoc(
        docTypeToCanister(doc.type),
        doc.number,
        doc.date,
        doc.dueDate,
        doc.validity,
        doc.clientId,
        doc.businessGstin,
        doc.placeOfSupply,
        doc.lineItems,
        doc.notes,
        doc.terms,
        doc.coverMessage,
        doc.linkedChatId || "",
      );
      const rawDocs = await ext.listMyDocs();
      setDocs(rawDocs.map(mapCanisterDoc));
      // Auto-message in chat when invoice/doc is saved
      if (doc.type === "invoice") {
        try {
          const client = clients.find((c) => c.id === doc.clientId);
          const clientName = client?.name ?? "Client";
          const msg = {
            id: `inv_msg_${Date.now()}`,
            senderId: "me",
            senderName: "You",
            content: `📄 Invoice ${doc.number} sent to ${clientName}`,
            msgType: "text",
            timestamp: Date.now(),
          };
          const stored = JSON.parse(
            localStorage.getItem("saarathi_messages") || "{}",
          );
          const chatKey = "group_g1";
          stored[chatKey] = [...(stored[chatKey] ?? []), msg];
          localStorage.setItem("saarathi_messages", JSON.stringify(stored));
        } catch {}
        toast.success("Invoice ready");
      }
    } catch (err) {
      console.error("Failed to create doc:", err);
      toast.error("Failed to save document");
    }
  }
  async function updateDoc(doc: BusinessDoc) {
    if (!actor) return;
    try {
      await asExtended(actor).updateDoc(
        doc.id,
        doc.date,
        doc.dueDate,
        doc.validity,
        doc.clientId,
        doc.businessGstin,
        doc.placeOfSupply,
        doc.lineItems,
        doc.notes,
        doc.terms,
        doc.coverMessage,
      );
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    } catch (err) {
      console.error("Failed to update doc:", err);
      toast.error("Failed to update document");
    }
  }
  async function deleteDoc(id: string) {
    if (!actor) return;
    try {
      await asExtended(actor).deleteDoc(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted.");
    } catch (err) {
      console.error("Failed to delete doc:", err);
      toast.error("Failed to delete document");
    }
  }
  async function duplicateDoc(doc: BusinessDoc) {
    if (!actor) return;
    try {
      const ext = asExtended(actor);
      const newDoc: BusinessDoc = {
        ...doc,
        id: `d${Date.now()}`,
        number: genDocNumber(doc.type, docs),
        date: today,
        status: "draft",
        createdAt: Date.now(),
      };
      await ext.createDoc(
        docTypeToCanister(newDoc.type),
        newDoc.number,
        newDoc.date,
        newDoc.dueDate,
        newDoc.validity,
        newDoc.clientId,
        newDoc.businessGstin,
        newDoc.placeOfSupply,
        newDoc.lineItems,
        newDoc.notes,
        newDoc.terms,
        newDoc.coverMessage,
        newDoc.linkedChatId || "",
      );
      const rawDocs = await ext.listMyDocs();
      setDocs(rawDocs.map(mapCanisterDoc));
      toast.success("Document duplicated.");
    } catch (err) {
      console.error("Failed to duplicate doc:", err);
      toast.error("Failed to duplicate document");
    }
  }
  async function cycleDocStatus(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (!doc || !actor) return;
    const newStatus = nextStatus(doc.status, doc.type);
    try {
      await asExtended(actor).updateDocStatus(
        id,
        docStatusToCanister(newStatus),
      );
      setDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
      );
    } catch (err) {
      console.error("Failed to update doc status:", err);
      toast.error("Failed to update status");
    }
  }

  async function addClient(c: Client) {
    if (!actor) return;
    try {
      const ext = asExtended(actor);
      await ext.createClient(
        c.name,
        c.gstin,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.placeOfSupply,
      );
      const rawClients = await ext.listMyClients();
      setClients(rawClients.map(mapCanisterClient));
    } catch (err) {
      console.error("Failed to add client:", err);
      toast.error("Failed to save client");
    }
  }
  async function updateClient(c: Client) {
    if (!actor) return;
    try {
      const ext = asExtended(actor);
      await ext.updateClient(
        c.id,
        c.name,
        c.gstin,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.placeOfSupply,
      );
      setClients((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    } catch (err) {
      console.error("Failed to update client:", err);
      toast.error("Failed to update client");
    }
  }
  async function deleteClient(id: string) {
    if (!actor) return;
    try {
      await asExtended(actor).deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete client:", err);
      toast.error("Failed to delete client");
    }
  }

  async function addProduct(p: Product) {
    if (!actor) return;
    try {
      const ext = asExtended(actor);
      await ext.createProduct(
        p.name,
        p.hsnSac,
        p.description,
        p.unit,
        p.price,
        p.gstRate,
      );
      const rawProducts = await ext.listMyProducts();
      setProducts(rawProducts.map(mapCanisterProduct));
    } catch (err) {
      console.error("Failed to add product:", err);
      toast.error("Failed to save product");
    }
  }
  async function updateProduct(p: Product) {
    if (!actor) return;
    try {
      const ext = asExtended(actor);
      await ext.updateProduct(
        p.id,
        p.name,
        p.hsnSac,
        p.description,
        p.unit,
        p.price,
        p.gstRate,
      );
      setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error("Failed to update product");
    }
  }
  async function deleteProduct(id: string) {
    if (!actor) return;
    try {
      await asExtended(actor).deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Failed to delete product");
    }
  }

  function handlePrintDoc(doc: BusinessDoc) {
    const client = clients.find((c) => c.id === doc.clientId);
    printDocInNewWindow(doc, client);
  }

  const docTabProps = {
    clients,
    products,
    allDocs: docs,
    onAdd: addDoc,
    onUpdate: updateDoc,
    onDelete: deleteDoc,
    onDuplicate: duplicateDoc,
    onStatusCycle: cycleDocStatus,
    onSendToMessenger: setSendTarget,
    onAddClient: addClient,
    onPrintDoc: handlePrintDoc,
  };

  if (loadingBusiness) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="text-amber-600 text-sm animate-pulse">
          Loading business data…
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          [data-ocid="doc.dialog"] { display: block !important; box-shadow: none !important; position: static !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>

      <div className="min-h-full bg-background">
        {canisterStopped && (
          <div className="bg-yellow-500/20 border-b border-yellow-500/40 px-4 py-2 text-yellow-700 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Backend temporarily unavailable — showing cached data. Retrying...
            </span>
          </div>
        )}
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6" /> Business Suite
              </h1>
              <p className="text-amber-100 text-sm mt-0.5">
                GST-Compliant Invoices · Estimates · Proposals
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-right">
                <div className="text-white font-semibold text-lg">
                  {docs.length}
                </div>
                <div className="text-amber-100 text-xs">Documents</div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold text-lg">
                  {clients.length}
                </div>
                <div className="text-amber-100 text-xs">Clients</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          <MoneySnapshot />
          <Tabs defaultValue="invoices">
            <TabsList className="mb-6 bg-amber-50 border border-amber-200 flex-wrap h-auto gap-1 p-1">
              {(
                [
                  {
                    value: "invoices",
                    label: "Invoices",
                    count: counts.invoice,
                    icon: Receipt,
                  },
                  {
                    value: "estimates",
                    label: "Estimates",
                    count: counts.estimate,
                    icon: FileText,
                  },
                  {
                    value: "proposals",
                    label: "Proposals",
                    count: counts.proposal,
                    icon: Send,
                  },
                  {
                    value: "clients",
                    label: "Clients",
                    count: clients.length,
                    icon: Users,
                  },
                  {
                    value: "products",
                    label: "Products",
                    count: products.length,
                    icon: Package,
                  },
                ] as const
              ).map(({ value, label, count, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white flex items-center gap-1.5"
                  data-ocid="business.tab"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className="text-xs bg-amber-100 data-[state=active]:bg-amber-400/60 text-amber-700 data-[state=active]:text-white px-1.5 py-0.5 rounded-full ml-0.5">
                    {count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="invoices" data-ocid="business.panel">
              <DocListTab type="invoice" docs={docs} {...docTabProps} />
            </TabsContent>
            <TabsContent value="estimates" data-ocid="business.panel">
              <DocListTab type="estimate" docs={docs} {...docTabProps} />
            </TabsContent>
            <TabsContent value="proposals" data-ocid="business.panel">
              <DocListTab type="proposal" docs={docs} {...docTabProps} />
            </TabsContent>
            <TabsContent value="clients" data-ocid="business.panel">
              <ClientsTab
                clients={clients}
                onAdd={addClient}
                onUpdate={updateClient}
                onDelete={deleteClient}
              />
            </TabsContent>
            <TabsContent value="products" data-ocid="business.panel">
              <ProductsTab
                products={products}
                onAdd={addProduct}
                onUpdate={updateProduct}
                onDelete={deleteProduct}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Send to Messenger */}
        {sendTarget && (
          <SendDocDialog
            doc={sendTarget}
            client={clients.find((c) => c.id === sendTarget.clientId)}
            onClose={() => setSendTarget(null)}
          />
        )}

        {/* Print-only overlay for card PDF button */}
        {printDoc && (
          <PrintDocOverlay
            doc={printDoc}
            client={clients.find((c) => c.id === printDoc.clientId)}
            onDone={() => setPrintDoc(null)}
          />
        )}
      </div>
    </>
  );
}
