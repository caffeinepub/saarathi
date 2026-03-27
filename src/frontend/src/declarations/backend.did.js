/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const UserProfile = IDL.Record({
  'username' : IDL.Text,
  'displayName' : IDL.Text,
  'password' : IDL.Text,
  'role' : UserRole,
  'businessName' : IDL.Text,
});
export const PublicUser = IDL.Record({
  'principal' : IDL.Principal,
  'displayName' : IDL.Text,
  'username' : IDL.Text,
});
export const PostPermission = IDL.Variant({
  'allMembers' : IDL.Null,
  'adminsOnly' : IDL.Null,
});
export const Group = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'description' : IDL.Text,
  'creator' : IDL.Principal,
  'members' : IDL.Vec(IDL.Principal),
  'admins' : IDL.Vec(IDL.Principal),
  'postPermission' : PostPermission,
  'parentGroupId' : IDL.Opt(IDL.Text),
});
export const MsgType = IDL.Variant({
  'text_' : IDL.Null,
  'image_' : IDL.Null,
  'file_' : IDL.Null,
});
export const GroupMessage = IDL.Record({
  'id' : IDL.Text,
  'groupId' : IDL.Text,
  'sender' : IDL.Principal,
  'content' : IDL.Text,
  'blobId' : IDL.Opt(IDL.Text),
  'msgType' : MsgType,
  'timestamp' : IDL.Int,
});
export const DirectMessage = IDL.Record({
  'id' : IDL.Text,
  'from_' : IDL.Principal,
  'to_' : IDL.Principal,
  'content' : IDL.Text,
  'blobId' : IDL.Opt(IDL.Text),
  'msgType' : MsgType,
  'timestamp' : IDL.Int,
});

const baseService = {
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'getAllUsersByUsername' : IDL.Func([], [IDL.Vec(UserProfile)], ['query']),
  'getAllPublicUsers' : IDL.Func([], [IDL.Vec(PublicUser)], ['query']),
  'getCallerUserProfile' : IDL.Func([], [UserProfile], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getUserProfile' : IDL.Func([IDL.Principal], [UserProfile], ['query']),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'login' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'registerUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'updateUserProfile' : IDL.Func([UserProfile], [], []),
  // Groups
  'createGroup' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
  'createSubgroup' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'addGroupMember' : IDL.Func([IDL.Text, IDL.Principal], [], []),
  'removeGroupMember' : IDL.Func([IDL.Text, IDL.Principal], [], []),
  'assignGroupAdmin' : IDL.Func([IDL.Text, IDL.Principal], [], []),
  'updateGroupSettings' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Bool], [], []),
  'listMyGroups' : IDL.Func([], [IDL.Vec(Group)], ['query']),
  'listSubgroups' : IDL.Func([IDL.Text], [IDL.Vec(Group)], ['query']),
  'getGroup' : IDL.Func([IDL.Text], [Group], ['query']),
  // Messages
  'sendGroupMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Opt(IDL.Text), MsgType], [], []),
  'getGroupMessages' : IDL.Func([IDL.Text], [IDL.Vec(GroupMessage)], ['query']),
  'sendDirectMessage' : IDL.Func([IDL.Principal, IDL.Text, IDL.Opt(IDL.Text), MsgType], [], []),
  'getDirectMessages' : IDL.Func([IDL.Principal], [IDL.Vec(DirectMessage)], ['query']),
  'listDMConversations' : IDL.Func([], [IDL.Vec(PublicUser)], ['query']),
};

export const idlService = IDL.Service(baseService);

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const UserProfile = IDL.Record({
    'username' : IDL.Text,
    'displayName' : IDL.Text,
    'password' : IDL.Text,
    'role' : UserRole,
    'businessName' : IDL.Text,
  });
  const PublicUser = IDL.Record({
    'principal' : IDL.Principal,
    'displayName' : IDL.Text,
    'username' : IDL.Text,
  });
  const PostPermission = IDL.Variant({
    'allMembers' : IDL.Null,
    'adminsOnly' : IDL.Null,
  });
  const Group = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'creator' : IDL.Principal,
    'members' : IDL.Vec(IDL.Principal),
    'admins' : IDL.Vec(IDL.Principal),
    'postPermission' : PostPermission,
    'parentGroupId' : IDL.Opt(IDL.Text),
  });
  const MsgType = IDL.Variant({
    'text_' : IDL.Null,
    'image_' : IDL.Null,
    'file_' : IDL.Null,
  });
  const GroupMessage = IDL.Record({
    'id' : IDL.Text,
    'groupId' : IDL.Text,
    'sender' : IDL.Principal,
    'content' : IDL.Text,
    'blobId' : IDL.Opt(IDL.Text),
    'msgType' : MsgType,
    'timestamp' : IDL.Int,
  });
  const DirectMessage = IDL.Record({
    'id' : IDL.Text,
    'from_' : IDL.Principal,
    'to_' : IDL.Principal,
    'content' : IDL.Text,
    'blobId' : IDL.Opt(IDL.Text),
    'msgType' : MsgType,
    'timestamp' : IDL.Int,
  });

  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'getAllUsersByUsername' : IDL.Func([], [IDL.Vec(UserProfile)], ['query']),
    'getAllPublicUsers' : IDL.Func([], [IDL.Vec(PublicUser)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [UserProfile], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getUserProfile' : IDL.Func([IDL.Principal], [UserProfile], ['query']),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'login' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'registerUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'updateUserProfile' : IDL.Func([UserProfile], [], []),
    'createGroup' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'createSubgroup' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'addGroupMember' : IDL.Func([IDL.Text, IDL.Principal], [], []),
    'removeGroupMember' : IDL.Func([IDL.Text, IDL.Principal], [], []),
    'assignGroupAdmin' : IDL.Func([IDL.Text, IDL.Principal], [], []),
    'updateGroupSettings' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Bool], [], []),
    'listMyGroups' : IDL.Func([], [IDL.Vec(Group)], ['query']),
    'listSubgroups' : IDL.Func([IDL.Text], [IDL.Vec(Group)], ['query']),
    'getGroup' : IDL.Func([IDL.Text], [Group], ['query']),
    'sendGroupMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Opt(IDL.Text), MsgType], [], []),
    'getGroupMessages' : IDL.Func([IDL.Text], [IDL.Vec(GroupMessage)], ['query']),
    'sendDirectMessage' : IDL.Func([IDL.Principal, IDL.Text, IDL.Opt(IDL.Text), MsgType], [], []),
    'getDirectMessages' : IDL.Func([IDL.Principal], [IDL.Vec(DirectMessage)], ['query']),
    'listDMConversations' : IDL.Func([], [IDL.Vec(PublicUser)], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };
