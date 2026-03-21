# SAARATHI - Phase 2: Messenger Module

## Current State
- Phase 1 deployed: user registration/login with username+password, sidebar navigation, dashboard with 4 module cards
- Backend: UserProfile, registerUser, login, getCallerUserProfile, updateUserProfile, getAllUsersByUsername
- MessengerPage.tsx is a placeholder with "Coming in Phase 2" content
- Authorization component already selected

## Requested Changes (Diff)

### Add
- **Groups**: Any user can create a group and becomes its admin. Groups have a name, description, and member list.
- **Group Admins**: Creator is admin. Admins can appoint additional admins per group. Admins can add/remove members.
- **Subgroups**: Group admins can create subgroups inside a parent group. Each subgroup can have its own admin(s).
- **Group Settings**: Admins can toggle whether all members can post or only admins can post.
- **Group Messages**: Members can send text messages in groups/subgroups. Admins can attach images/files via blob storage.
- **Direct Messages (DMs)**: Any two registered users can DM each other freely. Supports text, images, and files.
- **Message data**: Each message stores sender principal, timestamp, content (text or file reference), and type.
- **User list**: Backend endpoint to get all users (for DM and group member search).

### Modify
- **MessengerPage.tsx**: Replace placeholder with full messenger UI -- three-panel layout: sidebar (groups/DMs), conversation list, and message thread.

### Remove
- Nothing removed.

## Implementation Plan
1. Select `blob-storage` component (images/files in messages).
2. Generate Motoko backend additions:
   - Group, Subgroup, GroupMember, GroupMessage, DirectMessage types
   - createGroup, getGroup, listGroups, addGroupMember, removeGroupMember, assignGroupAdmin
   - createSubgroup, listSubgroups
   - updateGroupSettings (toggle posting permission)
   - sendGroupMessage, getGroupMessages
   - sendDirectMessage, getDirectMessages, listDMConversations
   - getAllUsers (public display info only: principal, displayName)
3. Build frontend Messenger UI:
   - Left sidebar: list of groups (user is member of) + DM conversations
   - Middle panel: group details or DM contact, message list
   - Right panel (or inline): message composer with text, image/file attach
   - Group creation modal
   - Group settings modal (admin only): manage members, posting permission, subgroups
   - Charcoal + Saffron color theme throughout
