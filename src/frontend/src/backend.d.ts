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
}
