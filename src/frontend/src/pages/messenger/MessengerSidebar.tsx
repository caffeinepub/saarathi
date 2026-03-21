import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronRight,
  Hash,
  MessageSquare,
  MessageSquarePlus,
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
  expandedGroups: Set<string>;
  onToggleGroupExpand: (groupId: string) => void;
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
  expandedGroups,
  onToggleGroupExpand,
}: Props) {
  const [dmExpanded, setDmExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);

  const topLevelGroups = groups.filter((g) => !g.parentGroupId);
  const getSubgroups = (parentId: string) =>
    groups.filter((g) => g.parentGroupId === parentId);

  const isActive = (target: ChatTarget) =>
    currentChat ? chatKey(currentChat) === chatKey(target) : false;

  return (
    <div
      className="flex flex-col h-full w-64 flex-shrink-0"
      style={{ backgroundColor: "#1e1e1e", borderRight: "1px solid #333" }}
    >
      {/* Header */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid #333" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-amber-400 text-lg">
            Messenger
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-3 space-y-1">
          {/* Direct Messages */}
          <div>
            {/* DM Section Header */}
            <div className="flex items-center px-2 py-1.5">
              <button
                type="button"
                onClick={() => setDmExpanded((v) => !v)}
                className="flex items-center gap-1.5 flex-1 text-xs font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
                data-ocid="messenger.dm.toggle"
              >
                {dmExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Direct Messages
              </button>
              {/* Visible New DM button in sidebar header */}
              <button
                type="button"
                onClick={onNewDM}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-semibold transition-colors"
                title="New DM"
                data-ocid="messenger.dm.open_modal_button"
              >
                <MessageSquarePlus className="w-3 h-3" />
                New DM
              </button>
            </div>

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
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors ${
                        active ? "bg-amber-500 text-white" : "hover:bg-white/10"
                      }`}
                      style={active ? {} : { color: "#b0a898" }}
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
                          active ? "bg-white/70" : "bg-emerald-400"
                        }`}
                      />
                    </button>
                  );
                })}
                {dmContacts.length === 0 && (
                  <p
                    className="px-2 py-2 text-xs italic"
                    style={{ color: "#665e50" }}
                  >
                    No conversations yet
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-px mx-2 my-2" style={{ backgroundColor: "#333" }} />

          {/* Groups */}
          <div>
            {/* Groups Section Header */}
            <div className="flex items-center px-2 py-1.5">
              <button
                type="button"
                onClick={() => setGroupsExpanded((v) => !v)}
                className="flex items-center gap-1.5 flex-1 text-xs font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
                data-ocid="messenger.groups.toggle"
              >
                {groupsExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Groups
              </button>
              <button
                type="button"
                onClick={onNewGroup}
                className="p-1 rounded-md text-amber-400/70 hover:text-amber-400 hover:bg-white/10 transition-colors"
                title="New Group"
                data-ocid="messenger.groups.open_modal_button"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

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
                          active ? "bg-amber-500" : "hover:bg-white/10"
                        }`}
                      >
                        {subgroups.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => onToggleGroupExpand(group.id)}
                            className={`pl-1.5 py-2 flex-shrink-0 ${
                              active
                                ? "text-white/70"
                                : "text-amber-400/60 hover:text-amber-400"
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="pl-3" />
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectChat(target)}
                          className={`flex-1 flex items-center gap-2 py-2 text-sm ${
                            subgroups.length === 0 ? "px-2" : "pl-0 pr-2"
                          } ${active ? "text-white" : ""}`}
                          style={active ? {} : { color: "#b0a898" }}
                          data-ocid={`messenger.groups.item.${idx + 1}`}
                        >
                          <Users className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/70" />
                          <span className="truncate text-xs font-medium">
                            {group.name}
                          </span>
                          <span
                            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-amber-500/20 text-amber-400"
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
                            className={`pr-1.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                              active
                                ? "text-white/70 !opacity-100"
                                : "text-amber-400/60 hover:text-amber-400"
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
                        <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-amber-500/30 pl-2">
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
                                    ? "bg-amber-500 text-white"
                                    : "hover:bg-white/10"
                                }`}
                                style={subActive ? {} : { color: "#9a9080" }}
                                data-ocid={`messenger.subgroup.item.${subIdx + 1}`}
                              >
                                <Hash className="w-3 h-3 flex-shrink-0 text-amber-400/70" />
                                <span className="truncate">{sub.name}</span>
                                <span
                                  className={`ml-auto text-[10px] ${
                                    subActive
                                      ? "text-white/70"
                                      : "text-amber-400/60"
                                  }`}
                                >
                                  {sub.members.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Always-visible New Group button */}
                <button
                  type="button"
                  onClick={onNewGroup}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors hover:bg-white/10 mt-1"
                  style={{ color: "#f59e0b" }}
                  data-ocid="messenger.groups.create_button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Group
                </button>

                {topLevelGroups.length === 0 && (
                  <p
                    className="px-2 py-1 text-xs italic"
                    style={{ color: "#665e50" }}
                  >
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
