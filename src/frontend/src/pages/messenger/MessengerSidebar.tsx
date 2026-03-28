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
import { SAMPLE_DEMO_KEYS, getAvatarColor } from "./sampleData";
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
  onNewSubgroup: (parentId: string) => void;
  currentUserId: string;
  expandedGroups: Set<string>;
  onToggleGroupExpand: (groupId: string) => void;
}

interface GroupTreeItemProps {
  group: LocalGroup;
  allGroups: LocalGroup[];
  currentChat: ChatTarget | null;
  onSelectChat: (target: ChatTarget) => void;
  onGroupSettings: (groupId: string) => void;
  onNewSubgroup: (parentId: string) => void;
  currentUserId: string;
  expandedGroups: Set<string>;
  onToggleGroupExpand: (groupId: string) => void;
  itemIndex: number;
}

function DemoBadge() {
  return (
    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold flex-shrink-0">
      Demo
    </span>
  );
}

function RealBadge() {
  return (
    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold flex-shrink-0">
      Real
    </span>
  );
}

function GroupTreeItem({
  group,
  allGroups,
  currentChat,
  onSelectChat,
  onGroupSettings,
  onNewSubgroup,
  currentUserId,
  expandedGroups,
  onToggleGroupExpand,
  itemIndex,
}: GroupTreeItemProps) {
  const children = allGroups.filter((g) => g.parentGroupId === group.id);
  const isExpanded = expandedGroups.has(group.id);
  const isAdmin = group.admins.includes(currentUserId);
  const depth = group.depth ?? 0;
  const canAddSubgroup = isAdmin && depth < 9;
  const indentPx = depth * 12;
  const isDemo =
    group.isDemo === true || SAMPLE_DEMO_KEYS.groupIds.includes(group.id);

  const target: ChatTarget = {
    type: "group",
    groupId: group.id,
    name: group.name,
  };
  const active = currentChat ? chatKey(currentChat) === chatKey(target) : false;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md transition-colors group ${
          active ? "bg-amber-500" : "hover:bg-white/10"
        }`}
        style={{ paddingLeft: `${indentPx}px` }}
      >
        {/* Expand/collapse chevron */}
        {children.length > 0 ? (
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

        {/* Chat select button */}
        <button
          type="button"
          onClick={() => onSelectChat(target)}
          className={`flex-1 flex items-center gap-1.5 py-2 text-sm min-w-0 ${
            children.length === 0 ? "px-2" : "pl-0 pr-2"
          } ${active ? "text-white" : ""}`}
          style={active ? {} : { color: "#b0a898" }}
          data-ocid={`messenger.groups.item.${itemIndex}`}
        >
          {depth === 0 ? (
            <Users className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/70" />
          ) : (
            <Hash className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/70" />
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {group.name}
          </span>
          {isDemo ? <DemoBadge /> : <RealBadge />}
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

        {/* + Sub button — only for admins, only when depth < 9 */}
        {canAddSubgroup && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNewSubgroup(group.id);
            }}
            className={`py-2 pr-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold ${
              active
                ? "text-white/70 !opacity-100"
                : "text-amber-400/70 hover:text-amber-300"
            }`}
            title="Add subgroup"
            data-ocid="messenger.group.add_subgroup.button"
          >
            +Sub
          </button>
        )}

        {/* Settings gear */}
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

      {/* Children (recursive) */}
      {isExpanded && children.length > 0 && (
        <div className="mt-0.5 space-y-0.5 border-l-2 border-amber-500/20 ml-4">
          {children.map((child, ci) => (
            <GroupTreeItem
              key={child.id}
              group={child}
              allGroups={allGroups}
              currentChat={currentChat}
              onSelectChat={onSelectChat}
              onGroupSettings={onGroupSettings}
              onNewSubgroup={onNewSubgroup}
              currentUserId={currentUserId}
              expandedGroups={expandedGroups}
              onToggleGroupExpand={onToggleGroupExpand}
              itemIndex={ci + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessengerSidebar({
  groups,
  dmContacts,
  currentChat,
  onSelectChat,
  onNewDM,
  onNewGroup,
  onGroupSettings,
  onNewSubgroup,
  currentUserId,
  expandedGroups,
  onToggleGroupExpand,
}: Props) {
  const [dmExpanded, setDmExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);

  const topLevelGroups = groups.filter((g) => !g.parentGroupId);

  const isActive = (target: ChatTarget) =>
    currentChat ? chatKey(currentChat) === chatKey(target) : false;

  return (
    <div
      className="flex flex-col h-full w-72 flex-shrink-0 overflow-hidden"
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
                  const isDemoUser = SAMPLE_DEMO_KEYS.userIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => onSelectChat(target)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-colors ${
                        active ? "bg-amber-500 text-white" : "hover:bg-white/10"
                      }`}
                      style={active ? {} : { color: "#b0a898" }}
                      data-ocid={`messenger.dm.item.${idx + 1}`}
                    >
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback
                          className={`text-[9px] font-bold text-white ${
                            active ? "bg-white/30" : getAvatarColor(user.id)
                          }`}
                        >
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-medium flex-1">
                        {user.displayName}
                      </span>
                      {isDemoUser ? (
                        <DemoBadge />
                      ) : user.id !== currentUserId ? (
                        <RealBadge />
                      ) : null}
                    </button>
                  );
                })}

                {dmContacts.length === 0 && (
                  <p
                    className="px-2 py-1 text-xs italic"
                    style={{ color: "#665e50" }}
                  >
                    No DMs yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="mt-3">
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
            </div>

            {groupsExpanded && (
              <div className="mt-1 space-y-0.5">
                {topLevelGroups.map((group, idx) => (
                  <GroupTreeItem
                    key={group.id}
                    group={group}
                    allGroups={groups}
                    currentChat={currentChat}
                    onSelectChat={onSelectChat}
                    onGroupSettings={onGroupSettings}
                    onNewSubgroup={onNewSubgroup}
                    currentUserId={currentUserId}
                    expandedGroups={expandedGroups}
                    onToggleGroupExpand={onToggleGroupExpand}
                    itemIndex={idx + 1}
                  />
                ))}

                {/* New Group button */}
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
