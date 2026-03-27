/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface UserProfile {
  'username' : string,
  'displayName' : string,
  'password' : string,
  'role' : UserRole,
  'businessName' : string,
}
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface PublicUser {
  'principal' : Principal,
  'displayName' : string,
  'username' : string,
}
export type PostPermission = { 'allMembers' : null } | { 'adminsOnly' : null };
export interface Group {
  'id' : string,
  'name' : string,
  'description' : string,
  'creator' : Principal,
  'members' : Array<Principal>,
  'admins' : Array<Principal>,
  'postPermission' : PostPermission,
  'parentGroupId' : [] | [string],
}
export type MsgType = { 'text_' : null } | { 'image_' : null } | { 'file_' : null };
export interface GroupMessage {
  'id' : string,
  'groupId' : string,
  'sender' : Principal,
  'content' : string,
  'blobId' : [] | [string],
  'msgType' : MsgType,
  'timestamp' : bigint,
}
export interface DirectMessage {
  'id' : string,
  'from_' : Principal,
  'to_' : Principal,
  'content' : string,
  'blobId' : [] | [string],
  'msgType' : MsgType,
  'timestamp' : bigint,
}
export interface Client {
  'id' : string,
  'name' : string,
  'gstin' : string,
  'email' : string,
  'phone' : string,
  'address' : string,
  'city' : string,
  'state' : string,
  'placeOfSupply' : string,
  'owner' : Principal,
}
export interface Product {
  'id' : string,
  'name' : string,
  'hsnSac' : string,
  'description' : string,
  'unit' : string,
  'price' : number,
  'gstRate' : number,
  'owner' : Principal,
}
export type ActivityStatus = { 'pending' : null } | { 'inProgress' : null } | { 'completed' : null } | { 'change_requested' : null };
export type TaskType = { 'meeting' : null } | { 'groupTask' : null } | { 'other' : null };
export interface Activity {
  'id' : string,
  'title' : string,
  'taskType' : TaskType,
  'assignees' : Array<string>,
  'groupId' : string,
  'dateTime' : string,
  'deadline' : string,
  'location' : string,
  'notes' : string,
  'status' : ActivityStatus,
  'createdBy' : Principal,
  'createdAt' : bigint,
  'messengerSent' : boolean,
  'chatThreadId' : string,
}
export type DocType = { 'invoice' : null } | { 'estimate' : null } | { 'proposal' : null };
export type DocStatus = { 'draft' : null } | { 'sent' : null } | { 'paid' : null } | { 'accepted' : null } | { 'rejected' : null };
export interface LineItem {
  'id' : string,
  'productId' : string,
  'description' : string,
  'hsnSac' : string,
  'qty' : number,
  'unit' : string,
  'rate' : number,
  'gstRate' : number,
}
export interface BusinessDoc {
  'id' : string,
  'docType' : DocType,
  'number' : string,
  'date' : string,
  'dueDate' : string,
  'validity' : string,
  'clientId' : string,
  'businessGstin' : string,
  'placeOfSupply' : string,
  'lineItems' : Array<LineItem>,
  'notes' : string,
  'terms' : string,
  'coverMessage' : string,
  'status' : DocStatus,
  'createdAt' : bigint,
  'linkedChatId' : string,
  'owner' : Principal,
}
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'getAllUsersByUsername' : ActorMethod<[], Array<UserProfile>>,
  'getAllPublicUsers' : ActorMethod<[], Array<PublicUser>>,
  'getCallerUserProfile' : ActorMethod<[], UserProfile>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getUserProfile' : ActorMethod<[Principal], UserProfile>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'login' : ActorMethod<[string, string], undefined>,
  'registerUser' : ActorMethod<[string, string, string, string], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'updateUserProfile' : ActorMethod<[UserProfile], undefined>,
  'createGroup' : ActorMethod<[string, string], string>,
  'createSubgroup' : ActorMethod<[string, string, string], string>,
  'addGroupMember' : ActorMethod<[string, Principal], undefined>,
  'removeGroupMember' : ActorMethod<[string, Principal], undefined>,
  'assignGroupAdmin' : ActorMethod<[string, Principal], undefined>,
  'updateGroupSettings' : ActorMethod<[string, string, string, boolean], undefined>,
  'listMyGroups' : ActorMethod<[], Array<Group>>,
  'listSubgroups' : ActorMethod<[string], Array<Group>>,
  'getGroup' : ActorMethod<[string], Group>,
  'sendGroupMessage' : ActorMethod<[string, string, [] | [string], MsgType], undefined>,
  'getGroupMessages' : ActorMethod<[string], Array<GroupMessage>>,
  'sendDirectMessage' : ActorMethod<[Principal, string, [] | [string], MsgType], undefined>,
  'getDirectMessages' : ActorMethod<[Principal], Array<DirectMessage>>,
  'listDMConversations' : ActorMethod<[], Array<PublicUser>>,
  'createClient' : ActorMethod<[string, string, string, string, string, string, string, string], string>,
  'updateClient' : ActorMethod<[string, string, string, string, string, string, string, string, string], undefined>,
  'deleteClient' : ActorMethod<[string], undefined>,
  'listMyClients' : ActorMethod<[], Array<Client>>,
  'createProduct' : ActorMethod<[string, string, string, string, number, number], string>,
  'updateProduct' : ActorMethod<[string, string, string, string, string, number, number], undefined>,
  'deleteProduct' : ActorMethod<[string], undefined>,
  'listMyProducts' : ActorMethod<[], Array<Product>>,
  'createActivity' : ActorMethod<[string, TaskType, Array<string>, string, string, string, string, string, string], string>,
  'updateActivityStatus' : ActorMethod<[string, ActivityStatus], undefined>,
  'updateActivity' : ActorMethod<[string, string, TaskType, Array<string>, string, string, string, string, string], undefined>,
  'deleteActivity' : ActorMethod<[string], undefined>,
  'listMyActivities' : ActorMethod<[], Array<Activity>>,
  'createDoc' : ActorMethod<[DocType, string, string, string, string, string, string, string, Array<LineItem>, string, string, string, string], string>,
  'updateDoc' : ActorMethod<[string, string, string, string, string, string, string, Array<LineItem>, string, string, string], undefined>,
  'updateDocStatus' : ActorMethod<[string, DocStatus], undefined>,
  'deleteDoc' : ActorMethod<[string], undefined>,
  'listMyDocs' : ActorMethod<[], Array<BusinessDoc>>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
