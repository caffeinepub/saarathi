import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

actor {
  // AccessControl
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserRole = AccessControl.UserRole;

  // ========================
  // HELPERS
  // ========================
  func arrayContains(arr : [Principal], item : Principal) : Bool {
    for (x in arr.vals()) {
      if (Principal.equal(x, item)) return true;
    };
    false;
  };

  func arrayAppendPrincipal(arr : [Principal], item : Principal) : [Principal] {
    let n = arr.size();
    Array.tabulate<Principal>(n + 1, func(i) { if (i < n) arr[i] else item });
  };

  func arrayFilterPrincipal(arr : [Principal], keep : Principal -> Bool) : [Principal] {
    var out : [Principal] = [];
    for (x in arr.vals()) {
      if (keep(x)) {
        out := arrayAppendPrincipal(out, x);
      };
    };
    out;
  };

  func arrayAppendPublicUser(arr : [PublicUser], item : PublicUser) : [PublicUser] {
    let n = arr.size();
    Array.tabulate<PublicUser>(n + 1, func(i) { if (i < n) arr[i] else item });
  };

  func arrayAppendGroupMsg(arr : [GroupMessage], item : GroupMessage) : [GroupMessage] {
    let n = arr.size();
    Array.tabulate<GroupMessage>(n + 1, func(i) { if (i < n) arr[i] else item });
  };

  func arrayAppendDM(arr : [DirectMessage], item : DirectMessage) : [DirectMessage] {
    let n = arr.size();
    Array.tabulate<DirectMessage>(n + 1, func(i) { if (i < n) arr[i] else item });
  };

  func arrayAppendGroup(arr : [Group], item : Group) : [Group] {
    let n = arr.size();
    Array.tabulate<Group>(n + 1, func(i) { if (i < n) arr[i] else item });
  };

  // ========================
  // USER PROFILES
  // ========================
  public type UserProfile = {
    username : Text;
    displayName : Text;
    businessName : Text;
    password : Text;
    role : UserRole;
  };

  public type PublicUser = {
    principal : Principal;
    displayName : Text;
    username : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  module UserProfile {
    public func compareByUsername(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.username, profile2.username);
    };
  };

  public shared ({ caller }) func registerUser(username : Text, displayName : Text, businessName : Text, password : Text) : async () {
    switch (userProfiles.entries().find(func(_, user) { user.username == username })) {
      case (?_) { Runtime.trap("This username is already taken. Choose another one!") };
      case (null) {
        let newUser : UserProfile = { username; displayName; businessName; password; role = #user };
        userProfiles.add(caller, newUser);
      };
    };
  };

  public shared ({ caller }) func login(username : Text, password : Text) : async () {
    let foundUser = userProfiles.entries().find(func(_, user) { user.username == username });
    switch (foundUser) {
      case (null) { Runtime.trap("Login failed! User not found!") };
      case (?(_, user)) {
        if (user.password != password) { Runtime.trap("Login failed! Wrong password!") };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("This user is not registered") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateUserProfile(updatedProfile : UserProfile) : async () {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("This user is not registered") };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getAllUsersByUsername() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.values().toArray().sort(UserProfile.compareByUsername);
  };

  public query func getAllPublicUsers() : async [PublicUser] {
    userProfiles.entries().map(func(p, u) : PublicUser {
      { principal = p; displayName = u.displayName; username = u.username }
    }).toArray();
  };

  // ========================
  // MESSENGER - GROUPS
  // ========================
  public type PostPermission = { #allMembers; #adminsOnly };

  public type Group = {
    id : Text;
    name : Text;
    description : Text;
    creator : Principal;
    members : [Principal];
    admins : [Principal];
    postPermission : PostPermission;
    parentGroupId : ?Text;
  };

  public type MsgType = { #text_; #image_; #file_ };

  public type GroupMessage = {
    id : Text;
    groupId : Text;
    sender : Principal;
    content : Text;
    blobId : ?Text;
    msgType : MsgType;
    timestamp : Int;
  };

  public type DirectMessage = {
    id : Text;
    from_ : Principal;
    to_ : Principal;
    content : Text;
    blobId : ?Text;
    msgType : MsgType;
    timestamp : Int;
  };

  var groupCounter : Nat = 0;
  let groups = Map.empty<Text, Group>();

  func nextGroupId() : Text {
    groupCounter += 1;
    "g" # groupCounter.toText();
  };

  func isGroupAdmin(group : Group, user : Principal) : Bool {
    arrayContains(group.admins, user);
  };

  func isGroupMember(group : Group, user : Principal) : Bool {
    arrayContains(group.members, user);
  };

  public shared ({ caller }) func createGroup(name : Text, description : Text) : async Text {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("Must be registered") };
    let id = nextGroupId();
    let g : Group = {
      id; name; description; creator = caller;
      members = [caller]; admins = [caller];
      postPermission = #allMembers; parentGroupId = null;
    };
    groups.add(id, g);
    id;
  };

  public shared ({ caller }) func createSubgroup(parentGroupId : Text, name : Text, description : Text) : async Text {
    switch (groups.get(parentGroupId)) {
      case (null) { Runtime.trap("Parent group not found") };
      case (?parent) {
        if (not isGroupAdmin(parent, caller)) { Runtime.trap("Only admins can create subgroups") };
        let id = nextGroupId();
        let g : Group = {
          id; name; description; creator = caller;
          members = [caller]; admins = [caller];
          postPermission = #allMembers; parentGroupId = ?parentGroupId;
        };
        groups.add(id, g);
        id;
      };
    };
  };

  public shared ({ caller }) func addGroupMember(groupId : Text, member : Principal) : async () {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?g) {
        if (not isGroupAdmin(g, caller)) { Runtime.trap("Only admins can add members") };
        if (not isGroupMember(g, member)) {
          let updated : Group = { id = g.id; name = g.name; description = g.description; creator = g.creator;
            members = arrayAppendPrincipal(g.members, member); admins = g.admins;
            postPermission = g.postPermission; parentGroupId = g.parentGroupId };
          groups.add(groupId, updated);
        };
      };
    };
  };

  public shared ({ caller }) func removeGroupMember(groupId : Text, member : Principal) : async () {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?g) {
        if (not isGroupAdmin(g, caller)) { Runtime.trap("Only admins can remove members") };
        let updated : Group = { id = g.id; name = g.name; description = g.description; creator = g.creator;
          members = arrayFilterPrincipal(g.members, func(m) { not Principal.equal(m, member) });
          admins = arrayFilterPrincipal(g.admins, func(m) { not Principal.equal(m, member) });
          postPermission = g.postPermission; parentGroupId = g.parentGroupId };
        groups.add(groupId, updated);
      };
    };
  };

  public shared ({ caller }) func assignGroupAdmin(groupId : Text, newAdmin : Principal) : async () {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?g) {
        if (not isGroupAdmin(g, caller)) { Runtime.trap("Only admins can assign admins") };
        if (not isGroupMember(g, newAdmin)) { Runtime.trap("User must be a member first") };
        if (not arrayContains(g.admins, newAdmin)) {
          let updated : Group = { id = g.id; name = g.name; description = g.description; creator = g.creator;
            members = g.members; admins = arrayAppendPrincipal(g.admins, newAdmin);
            postPermission = g.postPermission; parentGroupId = g.parentGroupId };
          groups.add(groupId, updated);
        };
      };
    };
  };

  public shared ({ caller }) func updateGroupSettings(groupId : Text, name : Text, description : Text, onlyAdmins : Bool) : async () {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?g) {
        if (not isGroupAdmin(g, caller)) { Runtime.trap("Only admins can update settings") };
        let perm : PostPermission = if (onlyAdmins) { #adminsOnly } else { #allMembers };
        let updated : Group = { id = g.id; name; description; creator = g.creator;
          members = g.members; admins = g.admins;
          postPermission = perm; parentGroupId = g.parentGroupId };
        groups.add(groupId, updated);
      };
    };
  };

  public query ({ caller }) func listMyGroups() : async [Group] {
    var result : [Group] = [];
    for (g in groups.values()) {
      if (isGroupMember(g, caller) and g.parentGroupId == null) {
        result := arrayAppendGroup(result, g);
      };
    };
    result;
  };

  public query func listSubgroups(parentGroupId : Text) : async [Group] {
    var result : [Group] = [];
    for (g in groups.values()) {
      switch (g.parentGroupId) {
        case (?pid) { if (pid == parentGroupId) result := arrayAppendGroup(result, g) };
        case (null) {};
      };
    };
    result;
  };

  public query func getGroup(groupId : Text) : async Group {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?g) { g };
    };
  };

  // ========================
  // MESSENGER - MESSAGES
  // ========================
  var msgCounter : Nat = 0;
  let groupMessages = Map.empty<Text, GroupMessage>();
  let directMessages = Map.empty<Text, DirectMessage>();

  func nextMsgId() : Text {
    msgCounter += 1;
    "m" # msgCounter.toText();
  };

  public shared ({ caller }) func sendGroupMessage(groupId : Text, content : Text, blobId : ?Text, msgType : MsgType) : async () {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?g) {
        if (not isGroupMember(g, caller)) { Runtime.trap("Not a member") };
        switch (g.postPermission) {
          case (#adminsOnly) {
            if (not isGroupAdmin(g, caller)) { Runtime.trap("Only admins can post in this group") };
          };
          case (#allMembers) {};
        };
        let id = nextMsgId();
        let msg : GroupMessage = { id; groupId; sender = caller; content; blobId; msgType; timestamp = Time.now() };
        groupMessages.add(id, msg);
      };
    };
  };

  public query func getGroupMessages(groupId : Text) : async [GroupMessage] {
    var result : [GroupMessage] = [];
    for (m in groupMessages.values()) {
      if (m.groupId == groupId) result := arrayAppendGroupMsg(result, m);
    };
    result;
  };

  public shared ({ caller }) func sendDirectMessage(to_ : Principal, content : Text, blobId : ?Text, msgType : MsgType) : async () {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("Must be registered") };
    let id = nextMsgId();
    let msg : DirectMessage = { id; from_ = caller; to_; content; blobId; msgType; timestamp = Time.now() };
    directMessages.add(id, msg);
  };

  public query ({ caller }) func getDirectMessages(otherUser : Principal) : async [DirectMessage] {
    var result : [DirectMessage] = [];
    for (m in directMessages.values()) {
      if ((Principal.equal(m.from_, caller) and Principal.equal(m.to_, otherUser)) or
          (Principal.equal(m.from_, otherUser) and Principal.equal(m.to_, caller))) {
        result := arrayAppendDM(result, m);
      };
    };
    result;
  };

  public query ({ caller }) func listDMConversations() : async [PublicUser] {
    var seen : [Principal] = [];
    var result : [PublicUser] = [];
    for (msg in directMessages.values()) {
      if (Principal.equal(msg.from_, caller) or Principal.equal(msg.to_, caller)) {
        let other = if (Principal.equal(msg.from_, caller)) { msg.to_ } else { msg.from_ };
        if (not arrayContains(seen, other)) {
          seen := arrayAppendPrincipal(seen, other);
          switch (userProfiles.get(other)) {
            case (?u) { result := arrayAppendPublicUser(result, { principal = other; displayName = u.displayName; username = u.username }) };
            case (null) {};
          };
        };
      };
    };
    result;
  };
};
