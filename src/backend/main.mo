import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";

import SyllabusTypes "types/syllabus";
import SyllabusApi "mixins/syllabus-api";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ---- User types ----
  public type UserProfile = {
    phone : Text;
    name : Text;
    details : Text;
    createdAt : Int;
  };

  public type AdminUserDetail = {
    phone : Text;
    name : Text;
    details : Text;
    createdAt : Int;
    pin : Text;
  };

  public type RegisterResult = {
    #ok : UserProfile;
    #phoneAlreadyTaken;
    #invalidPhone;
    #invalidPin;
  };

  public type LoginResult = {
    #ok : UserProfile;
    #userNotFound;
    #wrongPin;
  };

  public type DeleteResult = {
    #ok;
    #userNotFound;
  };

  // phone -> { profile, pin }
  type UserEntry = {
    profile : UserProfile;
    pin : Text;
  };

  // Legacy stable variable from previous version.
  type LegacyRole = { #admin; #user; #guest };
  type LegacyProfile = { name : Text };
  type LegacyUser = {
    principal : Principal;
    role : LegacyRole;
    profile : LegacyProfile;
  };
  var users : Map.Map<Principal, LegacyUser> = Map.empty();

  // New phone-based user store
  let userStore = Map.empty<Text, UserEntry>();

  // Map phone numbers to principals for authorization
  let phoneToPrincipal = Map.empty<Text, Principal>();

  // Study session types
  public type StudySession = {
    id : Nat;
    phone : Text;
    subject : Text;
    durationSeconds : Nat;
    date : Text;
    startTime : Int;
    endTime : Int;
  };

  // ---- Helpers ----
  func isValidPhone(phone : Text) : Bool {
    let chars = phone.chars();
    var count = 0;
    for (c in chars) {
      if (c < '0' or c > '9') { return false };
      count += 1;
    };
    count >= 7 and count <= 15;
  };

  func isValidPin(pin : Text) : Bool {
    let chars = pin.chars();
    var count = 0;
    for (c in chars) {
      if (c < '0' or c > '9') { return false };
      count += 1;
    };
    count == 4;
  };

  func compareSessionsByStartTimeDesc(a : StudySession, b : StudySession) : Order.Order {
    Int.compare(b.startTime, a.startTime);
  };

  func isPhoneOwnedByCaller(phone : Text, caller : Principal) : Bool {
    switch (phoneToPrincipal.get(phone)) {
      case (null) { false };
      case (?owner) { Principal.equal(owner, caller) };
    };
  };

  stable var nextSessionId = 1;
  let studySessionStore = Map.empty<Text, List.List<StudySession>>();

  // Syllabus stores
  let subjectStore = Map.empty<Text, List.List<SyllabusTypes.Subject>>();
  let chapterStore = Map.empty<Text, List.List<SyllabusTypes.Chapter>>();
  let nextSubjectId = [var 1];
  let nextChapterId = [var 1];
  include SyllabusApi(subjectStore, chapterStore, nextSubjectId, nextChapterId, phoneToPrincipal);

  // Drop the legacy data after upgrade
  system func postupgrade() {
    users := Map.empty();
  };

  // ---- Public API ----
  public shared ({ caller }) func registerUser(phone : Text, name : Text, details : Text, pin : Text) : async RegisterResult {
    if (not isValidPhone(phone)) { return #invalidPhone };
    if (not isValidPin(pin)) { return #invalidPin };
    switch (userStore.get(phone)) {
      case (?_) { return #phoneAlreadyTaken };
      case (null) {
        let profile : UserProfile = {
          phone;
          name;
          details;
          createdAt = Time.now();
        };
        userStore.add(phone, { profile; pin });
        // Map this phone to the caller's principal
        phoneToPrincipal.add(phone, caller);
        return #ok(profile);
      };
    };
  };

  public query func loginUser(phone : Text, pin : Text) : async LoginResult {
    switch (userStore.get(phone)) {
      case (null) { return #userNotFound };
      case (?entry) {
        if (entry.pin == pin) {
          return #ok(entry.profile);
        } else {
          return #wrongPin;
        };
      };
    };
  };

  public query func getUserProfile(phone : Text) : async ?UserProfile {
    switch (userStore.get(phone)) {
      case (null) { null };
      case (?entry) { ?entry.profile };
    };
  };

  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all user profiles");
    };
    userStore.values().map(func(e : UserEntry) : UserProfile { e.profile }).toArray();
  };

  // Admin: get all user details including PIN
  public query ({ caller }) func getAllUserDetails() : async [AdminUserDetail] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user details");
    };
    userStore.values().map(func(e : UserEntry) : AdminUserDetail {
      {
        phone = e.profile.phone;
        name = e.profile.name;
        details = e.profile.details;
        createdAt = e.profile.createdAt;
        pin = e.pin;
      }
    }).toArray();
  };

  // Admin: delete a user by phone
  public shared ({ caller }) func deleteUser(phone : Text) : async DeleteResult {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    switch (userStore.get(phone)) {
      case (null) { return #userNotFound };
      case (?_) {
        ignore userStore.remove(phone);
        ignore phoneToPrincipal.remove(phone);
        // Also remove all study sessions for this user
        ignore studySessionStore.remove(phone);
        return #ok;
      };
    };
  };

  // Study sessions feature
  public shared ({ caller }) func saveStudySession(phone : Text, subject : Text, durationSeconds : Nat, date : Text, startTime : Int, endTime : Int) : async Nat {
    // Verify the caller owns this phone number or is an admin
    if (not isPhoneOwnedByCaller(phone, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only save study sessions for your own phone number");
    };

    let sessionId = nextSessionId;
    nextSessionId += 1;

    let session : StudySession = {
      id = sessionId;
      phone;
      subject;
      durationSeconds;
      date;
      startTime;
      endTime;
    };

    let userSessions = switch (studySessionStore.get(phone)) {
      case (null) { List.empty<StudySession>() };
      case (?sessions) { sessions };
    };

    userSessions.add(session);
    studySessionStore.add(phone, userSessions);
    sessionId;
  };

  public query ({ caller }) func getStudySessions(phone : Text) : async [StudySession] {
    // Verify the caller owns this phone number or is an admin
    if (not isPhoneOwnedByCaller(phone, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view study sessions for your own phone number");
    };

    let userSessions = switch (studySessionStore.get(phone)) {
      case (null) { List.empty<StudySession>() };
      case (?sessions) { sessions };
    };

    userSessions.toArray().sort(
      compareSessionsByStartTimeDesc
    );
  };

  public shared ({ caller }) func deleteStudySession(phone : Text, sessionId : Nat) : async Bool {
    // Verify the caller owns this phone number or is an admin
    if (not isPhoneOwnedByCaller(phone, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only delete study sessions for your own phone number");
    };

    switch (studySessionStore.get(phone)) {
      case (null) { false };
      case (?sessions) {
        let filteredSessions = sessions.filter(
          func(s) { s.id != sessionId }
        );

        studySessionStore.add(phone, filteredSessions);
        true;
      };
    };
  };
};
