import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Crown,
  Hash,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { SAMPLE_USERS, getAvatarColor } from "./sampleData";
import type { LocalGroup, LocalUser } from "./types";
import { getInitials } from "./types";

// ─── New DM Modal ──────────────────────────────────────────────────────────────

interface NewDMProps {
  open: boolean;
  onClose: () => void;
  existingDMs: string[];
  currentUserId: string;
  onStartDM: (user: LocalUser) => void;
}

export function NewDMModal({
  open,
  onClose,
  existingDMs,
  currentUserId,
  onStartDM,
}: NewDMProps) {
  const [search, setSearch] = useState("");
  const allUsers = SAMPLE_USERS.filter((u) => u.id !== currentUserId);
  const filtered = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-white"
        data-ocid="messenger.new_dm.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            New Direct Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 bg-amber-50/60 border-amber-200 text-stone-700 placeholder:text-stone-400"
              data-ocid="messenger.new_dm.search_input"
            />
          </div>
          <ScrollArea className="h-56">
            <div className="space-y-1">
              {filtered.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onStartDM(user);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors text-left"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback
                      className={`text-xs font-bold text-white ${getAvatarColor(user.id)}`}
                    >
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-stone-500">@{user.username}</p>
                  </div>
                  {existingDMs.includes(user.id) && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs bg-amber-100 text-amber-700"
                    >
                      Existing
                    </Badge>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-stone-400 text-sm py-6">
                  No users found
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Group Modal ───────────────────────────────────────────────────────────

interface NewGroupProps {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string) => void;
}

export function NewGroupModal({ open, onClose, onCreateGroup }: NewGroupProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    onCreateGroup(name.trim(), description.trim());
    setName("");
    setDescription("");
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-white"
        data-ocid="messenger.new_group.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Create New Group
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-stone-700 font-medium">
              Group Name *
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Team"
              className="bg-amber-50/60 border-amber-200 text-stone-700 placeholder:text-stone-400"
              data-ocid="messenger.new_group.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-desc" className="text-stone-700 font-medium">
              Description
            </Label>
            <Textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="bg-amber-50/60 border-amber-200 text-stone-700 placeholder:text-stone-400 resize-none"
              data-ocid="messenger.new_group.textarea"
            />
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              You will be the group admin. You can manage members and settings
              after creation.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-300 text-stone-600 hover:bg-stone-50"
            data-ocid="messenger.new_group.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={isLoading || !name.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-ocid="messenger.new_group.submit_button"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Subgroup Modal ────────────────────────────────────────────────────────

interface NewSubgroupProps {
  open: boolean;
  parentGroup: LocalGroup | null;
  onClose: () => void;
  onCreateSubgroup: (
    parentId: string,
    name: string,
    description: string,
  ) => void;
}

export function NewSubgroupModal({
  open,
  parentGroup,
  onClose,
  onCreateSubgroup,
}: NewSubgroupProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !parentGroup) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    onCreateSubgroup(parentGroup.id, name.trim(), description.trim());
    setName("");
    setDescription("");
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-white"
        data-ocid="messenger.new_subgroup.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Hash className="w-4 h-4 text-white" />
            </div>
            <div>
              Create Subgroup
              {parentGroup && (
                <p className="text-stone-500 font-normal text-sm mt-0.5">
                  Under: {parentGroup.name}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-name" className="text-stone-700 font-medium">
              Subgroup Name *
            </Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Zone"
              className="bg-amber-50/60 border-amber-200 text-stone-700 placeholder:text-stone-400"
              data-ocid="messenger.new_subgroup.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-desc" className="text-stone-700 font-medium">
              Description
            </Label>
            <Textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this subgroup"
              rows={2}
              className="bg-amber-50/60 border-amber-200 text-stone-700 placeholder:text-stone-400 resize-none"
              data-ocid="messenger.new_subgroup.textarea"
            />
          </div>
          {parentGroup && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                You will automatically become admin of this subgroup.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-300 text-stone-600 hover:bg-stone-50"
            data-ocid="messenger.new_subgroup.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={isLoading || !name.trim() || !parentGroup}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-ocid="messenger.new_subgroup.submit_button"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Hash className="w-4 h-4 mr-2" />
            )}
            Create Subgroup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Group Settings Modal ──────────────────────────────────────────────────────

interface GroupSettingsProps {
  open: boolean;
  group: LocalGroup | null;
  currentUserId: string;
  allUsers: LocalUser[];
  allGroups: LocalGroup[];
  onClose: () => void;
  onUpdateGroup: (
    groupId: string,
    name: string,
    description: string,
    onlyAdminsCanPost: boolean,
  ) => void;
  onAddMember: (groupId: string, userId: string) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
  onMakeAdmin: (groupId: string, userId: string) => void;
  onRemoveAdmin: (groupId: string, userId: string) => void;
  onCreateSubgroup: () => void;
  onDeleteSubgroup: (subgroupId: string) => void;
}

export function GroupSettingsModal({
  open,
  group,
  currentUserId,
  allUsers,
  allGroups,
  onClose,
  onUpdateGroup,
  onAddMember,
  onRemoveMember,
  onMakeAdmin,
  onRemoveAdmin,
  onCreateSubgroup,
  onDeleteSubgroup,
}: GroupSettingsProps) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  // membersCanPost = true means members can send (onlyAdminsCanPost = false)
  const [membersCanPost, setMembersCanPost] = useState(
    !(group?.onlyAdminsCanPost ?? false),
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync when group changes
  if (group && name === "" && group.name) {
    setName(group.name);
    setDescription(group.description);
    setMembersCanPost(!group.onlyAdminsCanPost);
  }

  if (!group) return null;

  const memberUsers = allUsers.filter((u) => group.members.includes(u.id));
  const nonMembers = allUsers.filter(
    (u) =>
      !group.members.includes(u.id) &&
      u.id !== currentUserId &&
      (u.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(memberSearch.toLowerCase())),
  );

  // Get subgroups of this group
  const subgroups = allGroups.filter((g) => g.parentGroupId === group.id);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    onUpdateGroup(group.id, name.trim(), description.trim(), !membersCanPost);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white"
        data-ocid="messenger.group_settings.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Group Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
            <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
              General
            </h4>
            <div className="space-y-2">
              <Label htmlFor="gs-name" className="text-stone-600">
                Group Name
              </Label>
              <Input
                id="gs-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-amber-200 text-stone-700"
                data-ocid="messenger.group_settings.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gs-desc" className="text-stone-600">
                Description
              </Label>
              <Textarea
                id="gs-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="bg-white border-amber-200 text-stone-700 resize-none"
                data-ocid="messenger.group_settings.textarea"
              />
            </div>
          </div>

          {/* Messaging permissions */}
          <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
            <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
              Messaging Permissions
            </h4>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-stone-700">
                  Allow members to send messages
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {membersCanPost
                    ? "All members can send messages in this group"
                    : "Only admins can send messages in this group"}
                </p>
              </div>
              <Switch
                checked={membersCanPost}
                onCheckedChange={setMembersCanPost}
                data-ocid="messenger.group_settings.switch"
              />
            </div>
            {!membersCanPost && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-100 border border-amber-200 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This group is in announcement mode. Only admins can post.
                </p>
              </div>
            )}
          </div>

          {/* Subgroups section - only for top-level groups */}
          {!group.parentGroupId && (
            <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
                  Subgroups ({subgroups.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onCreateSubgroup();
                    onClose();
                  }}
                  className="h-7 text-xs text-amber-700 hover:bg-amber-100 hover:text-amber-800 gap-1"
                  data-ocid="messenger.create_subgroup.button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Subgroup
                </Button>
              </div>

              {subgroups.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-amber-200 rounded-lg">
                  <Hash className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-stone-400">No subgroups yet</p>
                  <button
                    type="button"
                    onClick={() => {
                      onCreateSubgroup();
                      onClose();
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-1 underline"
                  >
                    Create the first subgroup
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {subgroups.map((sub) => {
                    const subAdmins = allUsers.filter((u) =>
                      sub.admins.includes(u.id),
                    );
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-amber-100"
                        data-ocid="messenger.subgroup.settings_item"
                      >
                        <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Hash className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 truncate">
                            {sub.name}
                          </p>
                          <p className="text-xs text-stone-400">
                            {sub.members.length} member
                            {sub.members.length !== 1 ? "s" : ""}
                            {subAdmins.length > 0 && (
                              <span className="ml-2 text-amber-600">
                                · Admin:{" "}
                                {subAdmins.map((u) => u.displayName).join(", ")}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteSubgroup(sub.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove subgroup"
                          data-ocid="messenger.subgroup.delete_button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Members */}
          <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
            <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
              Members ({group.members.length})
            </h4>
            <ScrollArea className="h-44 border border-amber-100 rounded-lg bg-white">
              <div className="p-2 space-y-1">
                {memberUsers.map((user, idx) => {
                  const isCurrentUser = user.id === currentUserId;
                  const isUserAdmin = group.admins.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-amber-50"
                      data-ocid={`messenger.member.item.${idx + 1}`}
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback
                          className={`text-[10px] font-bold text-white ${getAvatarColor(user.id)}`}
                        >
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">
                          {user.displayName}
                          {isCurrentUser && (
                            <span className="text-xs text-stone-400 ml-1">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-400">
                          @{user.username}
                        </p>
                      </div>
                      {isUserAdmin && (
                        <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200">
                          <Crown className="w-2.5 h-2.5" />
                          Admin
                        </Badge>
                      )}
                      {!isCurrentUser && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-stone-400 hover:text-amber-600"
                            title={isUserAdmin ? "Remove admin" : "Make admin"}
                            onClick={() =>
                              isUserAdmin
                                ? onRemoveAdmin(group.id, user.id)
                                : onMakeAdmin(group.id, user.id)
                            }
                            data-ocid="messenger.member.toggle_admin.button"
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-stone-400 hover:text-red-500"
                            title="Remove member"
                            onClick={() => onRemoveMember(group.id, user.id)}
                            data-ocid="messenger.member.delete_button"
                          >
                            <UserMinus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Add member */}
          <div className="space-y-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
            <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
              Add Members
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search users to add..."
                className="pl-9 bg-white border-amber-200 text-stone-700 placeholder:text-stone-400"
                data-ocid="messenger.add_member.search_input"
              />
            </div>
            {memberSearch && nonMembers.length > 0 && (
              <div className="border border-amber-100 rounded-lg overflow-hidden bg-white">
                {nonMembers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onAddMember(group.id, user.id);
                      setMemberSearch("");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50 text-left border-b border-amber-50 last:border-b-0"
                    data-ocid="messenger.add_member.button"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback
                        className={`text-[10px] font-bold text-white ${getAvatarColor(user.id)}`}
                      >
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-stone-700">
                      {user.displayName}
                    </span>
                    <UserPlus className="w-3.5 h-3.5 ml-auto text-amber-500" />
                  </button>
                ))}
              </div>
            )}
            {memberSearch && nonMembers.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-2">
                No users found or all matching users are already members.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-300 text-stone-600 hover:bg-stone-50"
            data-ocid="messenger.group_settings.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || !name.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-ocid="messenger.group_settings.save_button"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
