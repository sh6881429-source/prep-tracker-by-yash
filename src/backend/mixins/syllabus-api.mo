import SyllabusLib "../lib/syllabus";
import SyllabusTypes "../types/syllabus";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  subjectStore : Map.Map<Text, List.List<SyllabusTypes.Subject>>,
  chapterStore : Map.Map<Text, List.List<SyllabusTypes.Chapter>>,
  nextSubjectId : [var Nat],
  nextChapterId : [var Nat],
  phoneToPrincipal : Map.Map<Text, Principal>,
) {
  func syllabusOwnerCheck(phone : Text, caller : Principal) : Bool {
    switch (phoneToPrincipal.get(phone)) {
      case (null) { false };
      case (?owner) { Principal.equal(owner, caller) };
    };
  };

  // Returns all subjects for a phone (newest first)
  public shared ({ caller }) func getSubjects(phone : Text) : async [SyllabusTypes.Subject] {
    if (not syllabusOwnerCheck(phone, caller)) {
      return [];
    };
    SyllabusLib.getSubjects(subjectStore, chapterStore, phone);
  };

  // Returns chapters for a given subject (newest first)
  public shared ({ caller }) func getChapters(phone : Text, subjectId : Nat) : async [SyllabusTypes.Chapter] {
    if (not syllabusOwnerCheck(phone, caller)) {
      return [];
    };
    SyllabusLib.getChapters(chapterStore, phone, subjectId);
  };

  // Returns all pending chapters across all subjects for a phone (newest first)
  public shared ({ caller }) func getPendingChapters(phone : Text) : async [SyllabusTypes.Chapter] {
    if (not syllabusOwnerCheck(phone, caller)) {
      return [];
    };
    SyllabusLib.getPendingChapters(chapterStore, phone);
  };

  // Returns the count of pending chapters for the home dashboard
  public shared ({ caller }) func getPendingChaptersCount(phone : Text) : async Nat {
    if (not syllabusOwnerCheck(phone, caller)) {
      return 0;
    };
    SyllabusLib.getPendingChaptersCount(chapterStore, phone);
  };

  // Adds a new subject; caller must own the phone
  public shared ({ caller }) func addSubject(phone : Text, name : Text) : async { #ok : SyllabusTypes.Subject; #err : Text } {
    if (not syllabusOwnerCheck(phone, caller)) {
      return #err("Unauthorized: You can only add subjects for your own account");
    };
    let subject = SyllabusLib.addSubject(subjectStore, nextSubjectId[0], phone, name);
    nextSubjectId[0] += 1;
    #ok(subject);
  };

  // Deletes a subject and all its chapters; caller must own the phone
  public shared ({ caller }) func deleteSubject(phone : Text, subjectId : Nat) : async { #ok; #err : Text } {
    if (not syllabusOwnerCheck(phone, caller)) {
      return #err("Unauthorized: You can only delete subjects for your own account");
    };
    SyllabusLib.deleteSubject(subjectStore, chapterStore, phone, subjectId);
  };

  // Adds a chapter inside a subject; caller must own the phone
  public shared ({ caller }) func addChapter(phone : Text, subjectId : Nat, name : Text) : async { #ok : SyllabusTypes.Chapter; #err : Text } {
    if (not syllabusOwnerCheck(phone, caller)) {
      return #err("Unauthorized: You can only add chapters for your own account");
    };
    let result = SyllabusLib.addChapter(subjectStore, chapterStore, nextChapterId[0], phone, subjectId, name);
    switch (result) {
      case (#ok(_)) { nextChapterId[0] += 1 };
      case (#err(_)) {};
    };
    result;
  };

  // Deletes a chapter; caller must own the phone
  public shared ({ caller }) func deleteChapter(phone : Text, chapterId : Nat) : async { #ok; #err : Text } {
    if (not syllabusOwnerCheck(phone, caller)) {
      return #err("Unauthorized: You can only delete chapters for your own account");
    };
    SyllabusLib.deleteChapter(chapterStore, phone, chapterId);
  };

  // Updates chapter status to "pending" or "completed"; caller must own the phone
  public shared ({ caller }) func updateChapterStatus(phone : Text, chapterId : Nat, status : Text) : async { #ok; #err : Text } {
    if (not syllabusOwnerCheck(phone, caller)) {
      return #err("Unauthorized: You can only update chapters for your own account");
    };
    SyllabusLib.updateChapterStatus(chapterStore, phone, chapterId, status);
  };
};
