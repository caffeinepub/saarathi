/**
 * backendExtensions.ts
 *
 * The generated backend.ts only exposes the user auth methods in its
 * backendInterface type. The canister actually supports group/messaging
 * methods too (defined in declarations/backend.did.d.ts _SERVICE).
 *
 * This file provides a typed helper to access those extra methods
 * without modifying the auto-generated backend.ts.
 */
import type { Principal } from "@icp-sdk/core/principal";
import type { backendInterface } from "../backend";

export type MsgType = { text_: null } | { image_: null } | { file_: null };

export interface PublicUser {
  principal: Principal;
  displayName: string;
  username: string;
}

export type PostPermission = { allMembers: null } | { adminsOnly: null };

export interface CanisterGroup {
  id: string;
  name: string;
  description: string;
  creator: Principal;
  members: Principal[];
  admins: Principal[];
  postPermission: PostPermission;
  parentGroupId: [] | [string];
}

export interface CanisterGroupMessage {
  id: string;
  groupId: string;
  sender: Principal;
  content: string;
  blobId: [] | [string];
  msgType: MsgType;
  timestamp: bigint;
}

export interface CanisterDirectMessage {
  id: string;
  from_: Principal;
  to_: Principal;
  content: string;
  blobId: [] | [string];
  msgType: MsgType;
  timestamp: bigint;
}

// ─── Phase 3 Types ────────────────────────────────────────────────────────────

// Phase 3 - Clients
export interface CanisterClient {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  placeOfSupply: string;
  owner: Principal;
}

// Phase 3 - Products
export interface CanisterProduct {
  id: string;
  name: string;
  hsnSac: string;
  description: string;
  unit: string;
  price: number;
  gstRate: number;
  owner: Principal;
}

// Phase 3 - Activities
export type CanisterActivityStatus =
  | { pending: null }
  | { inProgress: null }
  | { completed: null }
  | { change_requested: null };
export type CanisterTaskType =
  | { meeting: null }
  | { groupTask: null }
  | { other: null };

export interface CanisterActivity {
  id: string;
  title: string;
  taskType: CanisterTaskType;
  assignees: string[];
  groupId: string;
  dateTime: string;
  deadline: string;
  location: string;
  notes: string;
  status: CanisterActivityStatus;
  createdBy: Principal;
  createdAt: bigint;
  messengerSent: boolean;
  chatThreadId: string;
}

// Phase 3 - Business Docs
export type CanisterDocType =
  | { invoice: null }
  | { estimate: null }
  | { proposal: null };
export type CanisterDocStatus =
  | { draft: null }
  | { sent: null }
  | { paid: null }
  | { accepted: null }
  | { rejected: null };

export interface CanisterLineItem {
  id: string;
  productId: string;
  description: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
  gstRate: number;
}

export interface CanisterBusinessDoc {
  id: string;
  docType: CanisterDocType;
  number: string;
  date: string;
  dueDate: string;
  validity: string;
  clientId: string;
  businessGstin: string;
  placeOfSupply: string;
  lineItems: CanisterLineItem[];
  notes: string;
  terms: string;
  coverMessage: string;
  status: CanisterDocStatus;
  createdAt: bigint;
  linkedChatId: string;
  owner: Principal;
}

/** Extended actor type that includes group/messaging/phase3 methods. */
export interface ExtendedBackend extends backendInterface {
  getAllPublicUsers(): Promise<PublicUser[]>;
  createGroup(name: string, description: string): Promise<string>;
  createSubgroup(
    parentGroupId: string,
    name: string,
    description: string,
  ): Promise<string>;
  listMyGroups(): Promise<CanisterGroup[]>;
  listSubgroups(parentGroupId: string): Promise<CanisterGroup[]>;
  sendGroupMessage(
    groupId: string,
    content: string,
    blobId: [] | [string],
    msgType: MsgType,
  ): Promise<void>;
  getGroupMessages(groupId: string): Promise<CanisterGroupMessage[]>;
  sendDirectMessage(
    to_: Principal,
    content: string,
    blobId: [] | [string],
    msgType: MsgType,
  ): Promise<void>;
  getDirectMessages(otherUser: Principal): Promise<CanisterDirectMessage[]>;
  listDMConversations(): Promise<PublicUser[]>;
  // Clients
  createClient(
    name: string,
    gstin: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    state: string,
    placeOfSupply: string,
  ): Promise<string>;
  updateClient(
    id: string,
    name: string,
    gstin: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    state: string,
    placeOfSupply: string,
  ): Promise<void>;
  deleteClient(id: string): Promise<void>;
  listMyClients(): Promise<CanisterClient[]>;
  // Products
  createProduct(
    name: string,
    hsnSac: string,
    description: string,
    unit: string,
    price: number,
    gstRate: number,
  ): Promise<string>;
  updateProduct(
    id: string,
    name: string,
    hsnSac: string,
    description: string,
    unit: string,
    price: number,
    gstRate: number,
  ): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  listMyProducts(): Promise<CanisterProduct[]>;
  // Activities
  createActivity(
    title: string,
    taskType: CanisterTaskType,
    assignees: string[],
    groupId: string,
    dateTime: string,
    deadline: string,
    location: string,
    notes: string,
    chatThreadId: string,
  ): Promise<string>;
  updateActivityStatus(
    id: string,
    status: CanisterActivityStatus,
  ): Promise<void>;
  updateActivity(
    id: string,
    title: string,
    taskType: CanisterTaskType,
    assignees: string[],
    groupId: string,
    dateTime: string,
    deadline: string,
    location: string,
    notes: string,
  ): Promise<void>;
  deleteActivity(id: string): Promise<void>;
  listMyActivities(): Promise<CanisterActivity[]>;
  // Business Docs
  createDoc(
    docType: CanisterDocType,
    number: string,
    date: string,
    dueDate: string,
    validity: string,
    clientId: string,
    businessGstin: string,
    placeOfSupply: string,
    lineItems: CanisterLineItem[],
    notes: string,
    terms: string,
    coverMessage: string,
    linkedChatId: string,
  ): Promise<string>;
  updateDoc(
    id: string,
    date: string,
    dueDate: string,
    validity: string,
    clientId: string,
    businessGstin: string,
    placeOfSupply: string,
    lineItems: CanisterLineItem[],
    notes: string,
    terms: string,
    coverMessage: string,
  ): Promise<void>;
  updateDocStatus(id: string, status: CanisterDocStatus): Promise<void>;
  deleteDoc(id: string): Promise<void>;
  listMyDocs(): Promise<CanisterBusinessDoc[]>;
}

/**
 * Cast a standard actor to the extended interface.
 * The underlying canister supports these methods; we're just providing
 * the missing TypeScript types.
 */
export function asExtended(actor: backendInterface): ExtendedBackend {
  return actor as unknown as ExtendedBackend;
}

// ─── Variant Helpers ─────────────────────────────────────────────────────────

export function activityStatusToCanister(
  status: string,
): CanisterActivityStatus {
  if (status === "inProgress") return { inProgress: null };
  if (status === "completed") return { completed: null };
  if (status === "change_requested") return { change_requested: null };
  return { pending: null };
}

export function canisterStatusToActivity(
  status: CanisterActivityStatus,
): string {
  if ("inProgress" in status) return "inProgress";
  if ("completed" in status) return "completed";
  if ("change_requested" in status) return "change_requested";
  return "pending";
}

export function taskTypeToCanister(tt: string): CanisterTaskType {
  if (tt === "groupTask") return { groupTask: null };
  if (tt === "other") return { other: null };
  return { meeting: null };
}

export function canisterTaskTypeToLocal(tt: CanisterTaskType): string {
  if ("groupTask" in tt) return "groupTask";
  if ("other" in tt) return "other";
  return "meeting";
}

export function docTypeToCanister(dt: string): CanisterDocType {
  if (dt === "estimate") return { estimate: null };
  if (dt === "proposal") return { proposal: null };
  return { invoice: null };
}

export function canisterDocTypeToLocal(dt: CanisterDocType): string {
  if ("estimate" in dt) return "estimate";
  if ("proposal" in dt) return "proposal";
  return "invoice";
}

export function docStatusToCanister(ds: string): CanisterDocStatus {
  if (ds === "sent") return { sent: null };
  if (ds === "paid") return { paid: null };
  if (ds === "accepted") return { accepted: null };
  if (ds === "rejected") return { rejected: null };
  return { draft: null };
}

export function canisterDocStatusToLocal(ds: CanisterDocStatus): string {
  if ("sent" in ds) return "sent";
  if ("paid" in ds) return "paid";
  if ("accepted" in ds) return "accepted";
  if ("rejected" in ds) return "rejected";
  return "draft";
}
