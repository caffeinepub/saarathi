import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronRight,
  Hash,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { getAvatarColor } from "./sampleData";
import type { ChatTarget, LocalGroup, LocalUser } from "./types";
import { chatKey, getInitials } from "./types";

interface Props {
  groups: LocalGroup[];
  dmContacts: LocalUser[];
  currentChat: ChatTarget | null;
  onSelectChat: (target: ChatTarget) => void;
  onNewDM: () => void;
  onNewGroup: () => void;
  onGroupSettings: (groupId: string) => void;
  currentUserId: string;
}

export default function MessengerSidebar({
  groups,
  dmContacts,
  currentChat,
  onSelectChat,
  onNewDM,
  onNewGroup,
  onGroupSettings,
  currentUserId,
}: Props) {
  const [dmExpanded, setDmExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["g1"]),
  );

  const topLevelGroups = groups.filter((g) => !g.parentGroupId);
  const getSubgroups = (parentId: string) =>
    groups.filter((g) => g.parentGroupId === parentId);

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const isActive = (target: ChatTarget) =>
    currentChat ? chatKey(currentChat) === chatKey(target) : false;

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-sidebar-foreground text-lg">
            Messenger
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-3 space-y-1">
          {/* Direct Messages */}
          <div>
            <button
              type="button"
              onClick={() => setDmExpanded((v) => !v)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              data-ocid="messenger.dm.toggle"
            >
              {dmExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Direct Messages
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewDM();
                }}
                className="ml-auto p-0.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-primary transition-colors"
                title="New DM"
                data-ocid="messenger.dm.open_modal_button"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </button>

            {dmExpanded && (
              <div className="mt-1 space-y-0.5">
                {dmContacts.map((user, idx) => {
                  const target: ChatTarget = {
                    type: "dm",
                    userId: user.id,
                    displayName: user.displayName,
                  };
                  const active = isActive(target);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => onSelectChat(target)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                      data-ocid={`messenger.dm.item.${idx + 1}`}
                    >
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback
                          className={`text-[10px] font-bold text-white ${
                            active ? "bg-white/20" : getAvatarColor(user.id)
                          }`}
                        >
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-medium">
                        {user.displayName}
                      </span>
                      <span
                        className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                          active ? "bg-white/60" : "bg-emerald-500"
                        }`}
                      />
                    </button>
                  );
                })}
                {dmContacts.length === 0 && (
                  <p className="px-2 py-2 text-xs text-sidebar-foreground/40 italic">
                    No conversations yet
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-sidebar-border mx-2 my-2" />

          {/* Groups */}
          <div>
            <button
              type="button"
              onClick={() => setGroupsExpanded((v) => !v)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              data-ocid="messenger.groups.toggle"
            >
              {groupsExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Groups
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewGroup();
                }}
                className="ml-auto p-0.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-primary transition-colors"
                title="New Group"
                data-ocid="messenger.groups.open_modal_button"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </button>

            {groupsExpanded && (
              <div className="mt-1 space-y-0.5">
                {topLevelGroups.map((group, idx) => {
                  const subgroups = getSubgroups(group.id);
                  const isExpanded = expandedGroups.has(group.id);
                  const target: ChatTarget = {
                    type: "group",
                    groupId: group.id,
                    name: group.name,
                  };
                  const active = isActive(target);
                  const isAdmin = group.admins.includes(currentUserId);

                  return (
                    <div key={group.id}>
                      <div
                        className={`flex items-center gap-1 rounded-md transition-colors group ${
                          active ? "bg-primary" : "hover:bg-sidebar-accent"
                        }`}
                      >
                        {subgroups.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleGroupExpand(group.id)}
                            className={`pl-1 py-1.5 flex-shrink-0 ${
                              active
                                ? "text-primary-foreground/70"
                                : "text-sidebar-foreground/40 hover:text-sidebar-foreground"
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectChat(target)}
                          className={`flex-1 flex items-center gap-2 py-1.5 text-sm ${
                            subgroups.length === 0 ? "px-2" : "pl-0 pr-2"
                          } ${
                            active
                              ? "text-primary-foreground"
                              : "text-sidebar-foreground/70"
                          }`}
                          data-ocid={`messenger.groups.item.${idx + 1}`}
                        >
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate text-xs font-medium">
                            {group.name}
                          </span>
                          <span
                            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-sidebar-border text-sidebar-foreground/50"
                            }`}
                          >
                            {group.members.length}
                          </span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGroupSettings(group.id);
                            }}
                            className={`pr-1.5 py-1.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity ${
                              active
                                ? "text-primary-foreground/70 !opacity-100"
                                : "text-sidebar-foreground/40"
                            }`}
                            title="Group settings"
                            data-ocid="messenger.group.settings.button"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Subgroups */}
                      {isExpanded && subgroups.length > 0 && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {subgroups.map((sub, subIdx) => {
                            const subTarget: ChatTarget = {
                              type: "group",
                              groupId: sub.id,
                              name: sub.name,
                            };
                            const subActive = isActive(subTarget);
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => onSelectChat(subTarget)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                                  subActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                }`}
                                data-ocid={`messenger.subgroup.item.${subIdx + 1}`}
                              >
                                <Hash className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{sub.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {topLevelGroups.length === 0 && (
                  <p className="px-2 py-2 text-xs text-sidebar-foreground/40 italic">
                    No groups yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
