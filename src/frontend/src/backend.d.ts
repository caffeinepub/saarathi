import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
// User types
export interface UserProfile {
    username: string;
    displayName: string;
    password: string;
    role: UserRole;
    businessName: string;
}
export declare enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
// Messenger types
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
export type MsgType = { text_: null } | { image_: null } | { file_: null };
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
// Phase 3 - Client
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
// Phase 3 - Product
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
// Phase 3 - Activity
export type ActivityStatus = { pending: null } | { inProgress: null } | { completed: null } | { change_requested: null };
export type TaskType = { meeting: null } | { groupTask: null } | { other: null };
export interface CanisterActivity {
    id: string;
    title: string;
    taskType: TaskType;
    assignees: string[];
    groupId: string;
    dateTime: string;
    deadline: string;
    location: string;
    notes: string;
    status: ActivityStatus;
    createdBy: Principal;
    createdAt: bigint;
    messengerSent: boolean;
    chatThreadId: string;
}
// Phase 3 - Business Docs
export type DocType = { invoice: null } | { estimate: null } | { proposal: null };
export type DocStatus = { draft: null } | { sent: null } | { paid: null } | { accepted: null } | { rejected: null };
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
    docType: DocType;
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
    status: DocStatus;
    createdAt: bigint;
    linkedChatId: string;
    owner: Principal;
}
export interface backendInterface {
    // Auth
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllUsersByUsername(): Promise<Array<UserProfile>>;
    getAllPublicUsers(): Promise<Array<PublicUser>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, password: string): Promise<void>;
    registerUser(username: string, displayName: string, businessName: string, password: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateUserProfile(updatedProfile: UserProfile): Promise<void>;
    // Groups
    createGroup(name: string, description: string): Promise<string>;
    createSubgroup(parentGroupId: string, name: string, description: string): Promise<string>;
    addGroupMember(groupId: string, member: Principal): Promise<void>;
    removeGroupMember(groupId: string, member: Principal): Promise<void>;
    assignGroupAdmin(groupId: string, newAdmin: Principal): Promise<void>;
    updateGroupSettings(groupId: string, name: string, description: string, onlyAdmins: boolean): Promise<void>;
    listMyGroups(): Promise<Array<CanisterGroup>>;
    listSubgroups(parentGroupId: string): Promise<Array<CanisterGroup>>;
    getGroup(groupId: string): Promise<CanisterGroup>;
    // Messages
    sendGroupMessage(groupId: string, content: string, blobId: [] | [string], msgType: MsgType): Promise<void>;
    getGroupMessages(groupId: string): Promise<Array<CanisterGroupMessage>>;
    sendDirectMessage(to_: Principal, content: string, blobId: [] | [string], msgType: MsgType): Promise<void>;
    getDirectMessages(otherUser: Principal): Promise<Array<CanisterDirectMessage>>;
    listDMConversations(): Promise<Array<PublicUser>>;
    // Clients
    createClient(name: string, gstin: string, email: string, phone: string, address: string, city: string, state: string, placeOfSupply: string): Promise<string>;
    updateClient(id: string, name: string, gstin: string, email: string, phone: string, address: string, city: string, state: string, placeOfSupply: string): Promise<void>;
    deleteClient(id: string): Promise<void>;
    listMyClients(): Promise<Array<CanisterClient>>;
    // Products
    createProduct(name: string, hsnSac: string, description: string, unit: string, price: number, gstRate: number): Promise<string>;
    updateProduct(id: string, name: string, hsnSac: string, description: string, unit: string, price: number, gstRate: number): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    listMyProducts(): Promise<Array<CanisterProduct>>;
    // Activities
    createActivity(title: string, taskType: TaskType, assignees: string[], groupId: string, dateTime: string, deadline: string, location: string, notes: string, chatThreadId: string): Promise<string>;
    updateActivityStatus(id: string, status: ActivityStatus): Promise<void>;
    updateActivity(id: string, title: string, taskType: TaskType, assignees: string[], groupId: string, dateTime: string, deadline: string, location: string, notes: string): Promise<void>;
    deleteActivity(id: string): Promise<void>;
    listMyActivities(): Promise<Array<CanisterActivity>>;
    // Business Docs
    createDoc(docType: DocType, number: string, date: string, dueDate: string, validity: string, clientId: string, businessGstin: string, placeOfSupply: string, lineItems: CanisterLineItem[], notes: string, terms: string, coverMessage: string, linkedChatId: string): Promise<string>;
    updateDoc(id: string, date: string, dueDate: string, validity: string, clientId: string, businessGstin: string, placeOfSupply: string, lineItems: CanisterLineItem[], notes: string, terms: string, coverMessage: string): Promise<void>;
    updateDocStatus(id: string, status: DocStatus): Promise<void>;
    deleteDoc(id: string): Promise<void>;
    listMyDocs(): Promise<Array<CanisterBusinessDoc>>;
}
