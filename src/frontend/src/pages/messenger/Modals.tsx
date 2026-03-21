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
  Search,
  Settings,
  Shield,
  UserMinus,
  UserPlus,
  Users,
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
        className="sm:max-w-md"
        data-ocid="messenger.new_dm.dialog"
      >
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9"
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback
                      className={`text-xs font-bold text-white ${getAvatarColor(user.id)}`}
                    >
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  {existingDMs.includes(user.id) && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Existing
                    </Badge>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">
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
        className="sm:max-w-md"
        data-ocid="messenger.new_group.dialog"
      >
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Team"
              data-ocid="messenger.new_group.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-desc">Description</Label>
            <Textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              data-ocid="messenger.new_group.textarea"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="messenger.new_group.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={isLoading || !name.trim()}
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
        className="sm:max-w-md"
        data-ocid="messenger.new_subgroup.dialog"
      >
        <DialogHeader>
          <DialogTitle>
            Create Subgroup
            {parentGroup && (
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                in {parentGroup.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-name">Subgroup Name *</Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Zone"
              data-ocid="messenger.new_subgroup.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-desc">Description</Label>
            <Textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this subgroup"
              rows={2}
              data-ocid="messenger.new_subgroup.textarea"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="messenger.new_subgroup.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={isLoading || !name.trim()}
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
}

export function GroupSettingsModal({
  open,
  group,
  currentUserId,
  allUsers,
  onClose,
  onUpdateGroup,
  onAddMember,
  onRemoveMember,
  onMakeAdmin,
  onRemoveAdmin,
  onCreateSubgroup,
}: GroupSettingsProps) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [onlyAdmins, setOnlyAdmins] = useState(
    group?.onlyAdminsCanPost ?? false,
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync when group changes
  if (group && name === "" && group.name) {
    setName(group.name);
    setDescription(group.description);
    setOnlyAdmins(group.onlyAdminsCanPost);
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

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    onUpdateGroup(group.id, name.trim(), description.trim(), onlyAdmins);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="messenger.group_settings.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Group Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">General</h4>
            <div className="space-y-2">
              <Label htmlFor="gs-name">Group Name</Label>
              <Input
                id="gs-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="messenger.group_settings.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gs-desc">Description</Label>
              <Textarea
                id="gs-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                data-ocid="messenger.group_settings.textarea"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Admins only can post
                </p>
                <p className="text-xs text-muted-foreground">
                  Only admins can send messages
                </p>
              </div>
              <Switch
                checked={onlyAdmins}
                onCheckedChange={setOnlyAdmins}
                data-ocid="messenger.group_settings.switch"
              />
            </div>
          </div>

          {/* Members */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Members ({group.members.length})
            </h4>
            <ScrollArea className="h-44 border border-border rounded-lg">
              <div className="p-2 space-y-1">
                {memberUsers.map((user, idx) => {
                  const isCurrentUser = user.id === currentUserId;
                  const isUserAdmin = group.admins.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50"
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
                        <p className="text-sm font-medium truncate">
                          {user.displayName}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                      {isUserAdmin && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Crown className="w-2.5 h-2.5" />
                          Admin
                        </Badge>
                      )}
                      {!isCurrentUser && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-muted-foreground hover:text-primary"
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
                            className="w-6 h-6 text-muted-foreground hover:text-destructive"
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
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Add Members
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search users to add..."
                className="pl-9"
                data-ocid="messenger.add_member.search_input"
              />
            </div>
            {memberSearch && nonMembers.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                {nonMembers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onAddMember(group.id, user.id);
                      setMemberSearch("");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left border-b border-border last:border-b-0"
                    data-ocid="messenger.add_member.button"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback
                        className={`text-[10px] font-bold text-white ${getAvatarColor(user.id)}`}
                      >
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.displayName}</span>
                    <UserPlus className="w-3.5 h-3.5 ml-auto text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create subgroup */}
          {!group.parentGroupId && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                Subgroups
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCreateSubgroup();
                  onClose();
                }}
                className="w-full border-dashed"
                data-ocid="messenger.create_subgroup.button"
              >
                <Hash className="w-4 h-4 mr-2" />
                Create Subgroup
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="messenger.group_settings.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || !name.trim()}
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
