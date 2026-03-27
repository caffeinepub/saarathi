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

/** Extended actor type that includes group/messaging methods. */
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
}

/**
 * Cast a standard actor to the extended interface.
 * The underlying canister supports these methods; we're just providing
 * the missing TypeScript types.
 */
export function asExtended(actor: backendInterface): ExtendedBackend {
  return actor as unknown as ExtendedBackend;
}
