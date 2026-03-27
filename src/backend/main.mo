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

  // ========================
  // PHASE 3 - CLIENTS
  // ========================
  public type Client = {
    id : Text;
    name : Text;
    gstin : Text;
    email : Text;
    phone : Text;
    address : Text;
    city : Text;
    state : Text;
    placeOfSupply : Text;
    owner : Principal;
  };

  var clientCounter : Nat = 0;
  let clients = Map.empty<Text, Client>();

  func nextClientId() : Text {
    clientCounter += 1;
    "cli" # clientCounter.toText();
  };

  public shared ({ caller }) func createClient(name : Text, gstin : Text, email : Text, phone : Text, address : Text, city : Text, state : Text, placeOfSupply : Text) : async Text {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("Must be registered") };
    let id = nextClientId();
    let c : Client = { id; name; gstin; email; phone; address; city; state; placeOfSupply; owner = caller };
    clients.add(id, c);
    id;
  };

  public shared ({ caller }) func updateClient(id : Text, name : Text, gstin : Text, email : Text, phone : Text, address : Text, city : Text, state : Text, placeOfSupply : Text) : async () {
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client not found") };
      case (?c) {
        if (not Principal.equal(c.owner, caller)) { Runtime.trap("Unauthorized") };
        let updated : Client = { id; name; gstin; email; phone; address; city; state; placeOfSupply; owner = caller };
        clients.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteClient(id : Text) : async () {
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client not found") };
      case (?c) {
        if (not Principal.equal(c.owner, caller)) { Runtime.trap("Unauthorized") };
        ignore (clients.remove(id));
      };
    };
  };

  public query ({ caller }) func listMyClients() : async [Client] {
    var result : [Client] = [];
    for (c in clients.values()) {
      if (Principal.equal(c.owner, caller)) {
        let n = result.size();
        result := Array.tabulate<Client>(n + 1, func(i) { if (i < n) result[i] else c });
      };
    };
    result;
  };

  // ========================
  // PHASE 3 - PRODUCTS
  // ========================
  public type Product = {
    id : Text;
    name : Text;
    hsnSac : Text;
    description : Text;
    unit : Text;
    price : Float;
    gstRate : Float;
    owner : Principal;
  };

  var productCounter : Nat = 0;
  let products = Map.empty<Text, Product>();

  func nextProductId() : Text {
    productCounter += 1;
    "pro" # productCounter.toText();
  };

  public shared ({ caller }) func createProduct(name : Text, hsnSac : Text, description : Text, unit : Text, price : Float, gstRate : Float) : async Text {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("Must be registered") };
    let id = nextProductId();
    let p : Product = { id; name; hsnSac; description; unit; price; gstRate; owner = caller };
    products.add(id, p);
    id;
  };

  public shared ({ caller }) func updateProduct(id : Text, name : Text, hsnSac : Text, description : Text, unit : Text, price : Float, gstRate : Float) : async () {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) {
        if (not Principal.equal(p.owner, caller)) { Runtime.trap("Unauthorized") };
        let updated : Product = { id; name; hsnSac; description; unit; price; gstRate; owner = caller };
        products.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) {
        if (not Principal.equal(p.owner, caller)) { Runtime.trap("Unauthorized") };
        ignore (products.remove(id));
      };
    };
  };

  public query ({ caller }) func listMyProducts() : async [Product] {
    var result : [Product] = [];
    for (p in products.values()) {
      if (Principal.equal(p.owner, caller)) {
        let n = result.size();
        result := Array.tabulate<Product>(n + 1, func(i) { if (i < n) result[i] else p });
      };
    };
    result;
  };

  // ========================
  // PHASE 3 - ACTIVITIES
  // ========================
  public type ActivityStatus = { #pending; #inProgress; #completed; #change_requested };
  public type TaskType = { #meeting; #groupTask; #other };

  public type Activity = {
    id : Text;
    title : Text;
    taskType : TaskType;
    assignees : [Text];
    groupId : Text;
    dateTime : Text;
    deadline : Text;
    location : Text;
    notes : Text;
    status : ActivityStatus;
    createdBy : Principal;
    createdAt : Int;
    messengerSent : Bool;
    chatThreadId : Text;
  };

  var activityCounter : Nat = 0;
  let activities = Map.empty<Text, Activity>();

  func nextActivityId() : Text {
    activityCounter += 1;
    "act" # activityCounter.toText();
  };

  public shared ({ caller }) func createActivity(title : Text, taskType : TaskType, assignees : [Text], groupId : Text, dateTime : Text, deadline : Text, location : Text, notes : Text, chatThreadId : Text) : async Text {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("Must be registered") };
    let id = nextActivityId();
    let a : Activity = {
      id; title; taskType; assignees; groupId; dateTime; deadline; location; notes;
      status = #pending; createdBy = caller; createdAt = Time.now();
      messengerSent = chatThreadId != ""; chatThreadId;
    };
    activities.add(id, a);
    id;
  };

  public shared ({ caller }) func updateActivityStatus(id : Text, status : ActivityStatus) : async () {
    switch (activities.get(id)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?a) {
        let updated : Activity = {
          id = a.id; title = a.title; taskType = a.taskType; assignees = a.assignees;
          groupId = a.groupId; dateTime = a.dateTime; deadline = a.deadline;
          location = a.location; notes = a.notes; status;
          createdBy = a.createdBy; createdAt = a.createdAt;
          messengerSent = a.messengerSent; chatThreadId = a.chatThreadId;
        };
        activities.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func updateActivity(id : Text, title : Text, taskType : TaskType, assignees : [Text], groupId : Text, dateTime : Text, deadline : Text, location : Text, notes : Text) : async () {
    switch (activities.get(id)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?a) {
        if (not Principal.equal(a.createdBy, caller)) { Runtime.trap("Unauthorized") };
        let updated : Activity = {
          id; title; taskType; assignees; groupId; dateTime; deadline; location; notes;
          status = a.status; createdBy = a.createdBy; createdAt = a.createdAt;
          messengerSent = a.messengerSent; chatThreadId = a.chatThreadId;
        };
        activities.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteActivity(id : Text) : async () {
    switch (activities.get(id)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?a) {
        if (not Principal.equal(a.createdBy, caller)) { Runtime.trap("Unauthorized") };
        ignore (activities.remove(id));
      };
    };
  };

  public query ({ caller }) func listMyActivities() : async [Activity] {
    var result : [Activity] = [];
    switch (userProfiles.get(caller)) {
      case (null) {};
      case (?profile) {
        for (a in activities.values()) {
          var isAssigned = false;
          for (u in a.assignees.vals()) {
            if (u == profile.username) isAssigned := true;
          };
          if (Principal.equal(a.createdBy, caller) or isAssigned) {
            let n = result.size();
            result := Array.tabulate<Activity>(n + 1, func(i) { if (i < n) result[i] else a });
          };
        };
      };
    };
    result;
  };

  // ========================
  // PHASE 3 - BUSINESS DOCS
  // ========================
  public type DocType = { #invoice; #estimate; #proposal };
  public type DocStatus = { #draft; #sent; #paid; #accepted; #rejected };

  public type LineItem = {
    id : Text;
    productId : Text;
    description : Text;
    hsnSac : Text;
    qty : Float;
    unit : Text;
    rate : Float;
    gstRate : Float;
  };

  public type BusinessDoc = {
    id : Text;
    docType : DocType;
    number : Text;
    date : Text;
    dueDate : Text;
    validity : Text;
    clientId : Text;
    businessGstin : Text;
    placeOfSupply : Text;
    lineItems : [LineItem];
    notes : Text;
    terms : Text;
    coverMessage : Text;
    status : DocStatus;
    createdAt : Int;
    linkedChatId : Text;
    owner : Principal;
  };

  var docCounter : Nat = 0;
  let businessDocs = Map.empty<Text, BusinessDoc>();

  func nextDocId() : Text {
    docCounter += 1;
    "doc" # docCounter.toText();
  };

  public shared ({ caller }) func createDoc(docType : DocType, number : Text, date : Text, dueDate : Text, validity : Text, clientId : Text, businessGstin : Text, placeOfSupply : Text, lineItems : [LineItem], notes : Text, terms : Text, coverMessage : Text, linkedChatId : Text) : async Text {
    if (not (userProfiles.containsKey(caller))) { Runtime.trap("Must be registered") };
    let id = nextDocId();
    let d : BusinessDoc = {
      id; docType; number; date; dueDate; validity; clientId; businessGstin;
      placeOfSupply; lineItems; notes; terms; coverMessage;
      status = #draft; createdAt = Time.now(); linkedChatId; owner = caller;
    };
    businessDocs.add(id, d);
    id;
  };

  public shared ({ caller }) func updateDoc(id : Text, date : Text, dueDate : Text, validity : Text, clientId : Text, businessGstin : Text, placeOfSupply : Text, lineItems : [LineItem], notes : Text, terms : Text, coverMessage : Text) : async () {
    switch (businessDocs.get(id)) {
      case (null) { Runtime.trap("Doc not found") };
      case (?d) {
        if (not Principal.equal(d.owner, caller)) { Runtime.trap("Unauthorized") };
        let updated : BusinessDoc = {
          id; docType = d.docType; number = d.number; date; dueDate; validity; clientId;
          businessGstin; placeOfSupply; lineItems; notes; terms; coverMessage;
          status = d.status; createdAt = d.createdAt; linkedChatId = d.linkedChatId; owner = caller;
        };
        businessDocs.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func updateDocStatus(id : Text, status : DocStatus) : async () {
    switch (businessDocs.get(id)) {
      case (null) { Runtime.trap("Doc not found") };
      case (?d) {
        if (not Principal.equal(d.owner, caller)) { Runtime.trap("Unauthorized") };
        let updated : BusinessDoc = {
          id; docType = d.docType; number = d.number; date = d.date; dueDate = d.dueDate;
          validity = d.validity; clientId = d.clientId; businessGstin = d.businessGstin;
          placeOfSupply = d.placeOfSupply; lineItems = d.lineItems; notes = d.notes;
          terms = d.terms; coverMessage = d.coverMessage; status;
          createdAt = d.createdAt; linkedChatId = d.linkedChatId; owner = d.owner;
        };
        businessDocs.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteDoc(id : Text) : async () {
    switch (businessDocs.get(id)) {
      case (null) { Runtime.trap("Doc not found") };
      case (?d) {
        if (not Principal.equal(d.owner, caller)) { Runtime.trap("Unauthorized") };
        ignore (businessDocs.remove(id));
      };
    };
  };

  public query ({ caller }) func listMyDocs() : async [BusinessDoc] {
    var result : [BusinessDoc] = [];
    for (d in businessDocs.values()) {
      if (Principal.equal(d.owner, caller)) {
        let n = result.size();
        result := Array.tabulate<BusinessDoc>(n + 1, func(i) { if (i < n) result[i] else d });
      };
    };
    result;
  };

};
