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
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
