import NotesLib "../lib/notes";
import NotesTypes "../types/notes";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  noteStore : Map.Map<Text, List.List<NotesTypes.Note>>,
  pdfStore : Map.Map<Text, List.List<NotesTypes.Pdf>>,
  phoneToPrincipal : Map.Map<Text, Principal>,
) {
  func notesOwnerCheck(phone : Text, caller : Principal) : Bool {
    switch (phoneToPrincipal.get(phone)) {
      case (null) { false };
      case (?owner) { Principal.equal(owner, caller) };
    };
  };

  // ---- Notes API ----

  public shared ({ caller }) func getNotes(phone : Text) : async [NotesTypes.Note] {
    if (not notesOwnerCheck(phone, caller)) {
      return [];
    };
    NotesLib.getNotes(noteStore, phone);
  };

  public shared ({ caller }) func addNote(
    phone : Text,
    subject : Text,
    title : Text,
    content : Text,
    colorTag : Text,
    isPinned : Bool,
  ) : async NotesTypes.NoteResult {
    if (not notesOwnerCheck(phone, caller)) {
      return #unauthorized;
    };
    let note = NotesLib.addNote(noteStore, phone, subject, title, content, colorTag, isPinned);
    #ok(note);
  };

  public shared ({ caller }) func updateNote(
    phone : Text,
    id : Text,
    subject : Text,
    title : Text,
    content : Text,
    colorTag : Text,
    isPinned : Bool,
  ) : async NotesTypes.NoteResult {
    if (not notesOwnerCheck(phone, caller)) {
      return #unauthorized;
    };
    NotesLib.updateNote(noteStore, phone, id, subject, title, content, colorTag, isPinned);
  };

  public shared ({ caller }) func deleteNote(phone : Text, id : Text) : async Bool {
    if (not notesOwnerCheck(phone, caller)) {
      return false;
    };
    NotesLib.deleteNote(noteStore, phone, id);
  };

  public shared ({ caller }) func toggleNotePin(phone : Text, id : Text) : async NotesTypes.NoteResult {
    if (not notesOwnerCheck(phone, caller)) {
      return #unauthorized;
    };
    NotesLib.toggleNotePin(noteStore, phone, id);
  };

  // ---- PDFs API ----

  public shared ({ caller }) func getPdfs(phone : Text) : async [NotesTypes.Pdf] {
    if (not notesOwnerCheck(phone, caller)) {
      return [];
    };
    NotesLib.getPdfs(pdfStore, phone);
  };

  public shared ({ caller }) func uploadPdf(
    phone : Text,
    subject : Text,
    filename : Text,
    fileData : [Nat8],
    contentType : Text,
  ) : async NotesTypes.PdfResult {
    if (not notesOwnerCheck(phone, caller)) {
      return #unauthorized;
    };
    let pdf = NotesLib.uploadPdf(pdfStore, phone, subject, filename, fileData, contentType);
    #ok(pdf);
  };

  public query func getPdfFile(id : Text) : async ?[Nat8] {
    NotesLib.getPdfFile(pdfStore, id);
  };

  public shared ({ caller }) func deletePdf(phone : Text, id : Text) : async Bool {
    if (not notesOwnerCheck(phone, caller)) {
      return false;
    };
    NotesLib.deletePdf(pdfStore, phone, id);
  };
};
