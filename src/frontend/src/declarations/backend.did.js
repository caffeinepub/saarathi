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

// Phase 3 types
export const Client = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'gstin' : IDL.Text,
  'email' : IDL.Text,
  'phone' : IDL.Text,
  'address' : IDL.Text,
  'city' : IDL.Text,
  'state' : IDL.Text,
  'placeOfSupply' : IDL.Text,
  'owner' : IDL.Principal,
});
export const Product = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'hsnSac' : IDL.Text,
  'description' : IDL.Text,
  'unit' : IDL.Text,
  'price' : IDL.Float64,
  'gstRate' : IDL.Float64,
  'owner' : IDL.Principal,
});
export const ActivityStatus = IDL.Variant({
  'pending' : IDL.Null,
  'inProgress' : IDL.Null,
  'completed' : IDL.Null,
  'change_requested' : IDL.Null,
});
export const TaskType = IDL.Variant({
  'meeting' : IDL.Null,
  'groupTask' : IDL.Null,
  'other' : IDL.Null,
});
export const Activity = IDL.Record({
  'id' : IDL.Text,
  'title' : IDL.Text,
  'taskType' : TaskType,
  'assignees' : IDL.Vec(IDL.Text),
  'groupId' : IDL.Text,
  'dateTime' : IDL.Text,
  'deadline' : IDL.Text,
  'location' : IDL.Text,
  'notes' : IDL.Text,
  'status' : ActivityStatus,
  'createdBy' : IDL.Principal,
  'createdAt' : IDL.Int,
  'messengerSent' : IDL.Bool,
  'chatThreadId' : IDL.Text,
});
export const DocType = IDL.Variant({
  'invoice' : IDL.Null,
  'estimate' : IDL.Null,
  'proposal' : IDL.Null,
});
export const DocStatus = IDL.Variant({
  'draft' : IDL.Null,
  'sent' : IDL.Null,
  'paid' : IDL.Null,
  'accepted' : IDL.Null,
  'rejected' : IDL.Null,
});
export const LineItem = IDL.Record({
  'id' : IDL.Text,
  'productId' : IDL.Text,
  'description' : IDL.Text,
  'hsnSac' : IDL.Text,
  'qty' : IDL.Float64,
  'unit' : IDL.Text,
  'rate' : IDL.Float64,
  'gstRate' : IDL.Float64,
});
export const BusinessDoc = IDL.Record({
  'id' : IDL.Text,
  'docType' : DocType,
  'number' : IDL.Text,
  'date' : IDL.Text,
  'dueDate' : IDL.Text,
  'validity' : IDL.Text,
  'clientId' : IDL.Text,
  'businessGstin' : IDL.Text,
  'placeOfSupply' : IDL.Text,
  'lineItems' : IDL.Vec(LineItem),
  'notes' : IDL.Text,
  'terms' : IDL.Text,
  'coverMessage' : IDL.Text,
  'status' : DocStatus,
  'createdAt' : IDL.Int,
  'linkedChatId' : IDL.Text,
  'owner' : IDL.Principal,
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
  // Clients
  'createClient' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'updateClient' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
  'deleteClient' : IDL.Func([IDL.Text], [], []),
  'listMyClients' : IDL.Func([], [IDL.Vec(Client)], ['query']),
  // Products
  'createProduct' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Float64, IDL.Float64], [IDL.Text], []),
  'updateProduct' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Float64, IDL.Float64], [], []),
  'deleteProduct' : IDL.Func([IDL.Text], [], []),
  'listMyProducts' : IDL.Func([], [IDL.Vec(Product)], ['query']),
  // Activities
  'createActivity' : IDL.Func([IDL.Text, TaskType, IDL.Vec(IDL.Text), IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'updateActivityStatus' : IDL.Func([IDL.Text, ActivityStatus], [], []),
  'updateActivity' : IDL.Func([IDL.Text, IDL.Text, TaskType, IDL.Vec(IDL.Text), IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
  'deleteActivity' : IDL.Func([IDL.Text], [], []),
  'listMyActivities' : IDL.Func([], [IDL.Vec(Activity)], ['query']),
  // Business Docs
  'createDoc' : IDL.Func([DocType, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(LineItem), IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'updateDoc' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(LineItem), IDL.Text, IDL.Text, IDL.Text], [], []),
  'updateDocStatus' : IDL.Func([IDL.Text, DocStatus], [], []),
  'deleteDoc' : IDL.Func([IDL.Text], [], []),
  'listMyDocs' : IDL.Func([], [IDL.Vec(BusinessDoc)], ['query']),
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
  const Client = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'gstin' : IDL.Text,
    'email' : IDL.Text,
    'phone' : IDL.Text,
    'address' : IDL.Text,
    'city' : IDL.Text,
    'state' : IDL.Text,
    'placeOfSupply' : IDL.Text,
    'owner' : IDL.Principal,
  });
  const Product = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'hsnSac' : IDL.Text,
    'description' : IDL.Text,
    'unit' : IDL.Text,
    'price' : IDL.Float64,
    'gstRate' : IDL.Float64,
    'owner' : IDL.Principal,
  });
  const ActivityStatus = IDL.Variant({
    'pending' : IDL.Null,
    'inProgress' : IDL.Null,
    'completed' : IDL.Null,
    'change_requested' : IDL.Null,
  });
  const TaskType = IDL.Variant({
    'meeting' : IDL.Null,
    'groupTask' : IDL.Null,
    'other' : IDL.Null,
  });
  const Activity = IDL.Record({
    'id' : IDL.Text,
    'title' : IDL.Text,
    'taskType' : TaskType,
    'assignees' : IDL.Vec(IDL.Text),
    'groupId' : IDL.Text,
    'dateTime' : IDL.Text,
    'deadline' : IDL.Text,
    'location' : IDL.Text,
    'notes' : IDL.Text,
    'status' : ActivityStatus,
    'createdBy' : IDL.Principal,
    'createdAt' : IDL.Int,
    'messengerSent' : IDL.Bool,
    'chatThreadId' : IDL.Text,
  });
  const DocType = IDL.Variant({
    'invoice' : IDL.Null,
    'estimate' : IDL.Null,
    'proposal' : IDL.Null,
  });
  const DocStatus = IDL.Variant({
    'draft' : IDL.Null,
    'sent' : IDL.Null,
    'paid' : IDL.Null,
    'accepted' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const LineItem = IDL.Record({
    'id' : IDL.Text,
    'productId' : IDL.Text,
    'description' : IDL.Text,
    'hsnSac' : IDL.Text,
    'qty' : IDL.Float64,
    'unit' : IDL.Text,
    'rate' : IDL.Float64,
    'gstRate' : IDL.Float64,
  });
  const BusinessDoc = IDL.Record({
    'id' : IDL.Text,
    'docType' : DocType,
    'number' : IDL.Text,
    'date' : IDL.Text,
    'dueDate' : IDL.Text,
    'validity' : IDL.Text,
    'clientId' : IDL.Text,
    'businessGstin' : IDL.Text,
    'placeOfSupply' : IDL.Text,
    'lineItems' : IDL.Vec(LineItem),
    'notes' : IDL.Text,
    'terms' : IDL.Text,
    'coverMessage' : IDL.Text,
    'status' : DocStatus,
    'createdAt' : IDL.Int,
    'linkedChatId' : IDL.Text,
    'owner' : IDL.Principal,
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
    // Clients
    'createClient' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'updateClient' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
    'deleteClient' : IDL.Func([IDL.Text], [], []),
    'listMyClients' : IDL.Func([], [IDL.Vec(Client)], ['query']),
    // Products
    'createProduct' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Float64, IDL.Float64], [IDL.Text], []),
    'updateProduct' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Float64, IDL.Float64], [], []),
    'deleteProduct' : IDL.Func([IDL.Text], [], []),
    'listMyProducts' : IDL.Func([], [IDL.Vec(Product)], ['query']),
    // Activities
    'createActivity' : IDL.Func([IDL.Text, TaskType, IDL.Vec(IDL.Text), IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'updateActivityStatus' : IDL.Func([IDL.Text, ActivityStatus], [], []),
    'updateActivity' : IDL.Func([IDL.Text, IDL.Text, TaskType, IDL.Vec(IDL.Text), IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
    'deleteActivity' : IDL.Func([IDL.Text], [], []),
    'listMyActivities' : IDL.Func([], [IDL.Vec(Activity)], ['query']),
    // Business Docs
    'createDoc' : IDL.Func([DocType, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(LineItem), IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'updateDoc' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(LineItem), IDL.Text, IDL.Text, IDL.Text], [], []),
    'updateDocStatus' : IDL.Func([IDL.Text, DocStatus], [], []),
    'deleteDoc' : IDL.Func([IDL.Text], [], []),
    'listMyDocs' : IDL.Func([], [IDL.Vec(BusinessDoc)], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };
