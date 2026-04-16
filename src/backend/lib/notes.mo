import NotesTypes "../types/notes";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  // ---- Notes ----

  // Returns all notes for a phone: pinned first, then non-pinned by newest createdAt
  public func getNotes(noteStore : Map.Map<Text, List.List<NotesTypes.Note>>, phone : Text) : [NotesTypes.Note] {
    switch (noteStore.get(phone)) {
      case (null) { [] };
      case (?notes) {
        let arr = notes.toArray();
        arr.sort(func(a : NotesTypes.Note, b : NotesTypes.Note) : { #less; #equal; #greater } {
          if (a.isPinned and not b.isPinned) { #less }
          else if (not a.isPinned and b.isPinned) { #greater }
          else { Int.compare(b.createdAt, a.createdAt) };
        });
      };
    };
  };

  public func addNote(
    noteStore : Map.Map<Text, List.List<NotesTypes.Note>>,
    phone : Text,
    subject : Text,
    title : Text,
    content : Text,
    colorTag : Text,
    isPinned : Bool,
  ) : NotesTypes.Note {
    let now = Time.now();
    let id = now.toText() # "-" # phone;
    let note : NotesTypes.Note = {
      id;
      phone;
      subject;
      title;
      content;
      colorTag;
      isPinned;
      createdAt = now;
      updatedAt = now;
    };
    let userNotes = switch (noteStore.get(phone)) {
      case (null) { List.empty<NotesTypes.Note>() };
      case (?n) { n };
    };
    userNotes.add(note);
    noteStore.add(phone, userNotes);
    note;
  };

  public func updateNote(
    noteStore : Map.Map<Text, List.List<NotesTypes.Note>>,
    phone : Text,
    id : Text,
    subject : Text,
    title : Text,
    content : Text,
    colorTag : Text,
    isPinned : Bool,
  ) : NotesTypes.NoteResult {
    switch (noteStore.get(phone)) {
      case (null) { #notFound };
      case (?notes) {
        switch (notes.find(func(n : NotesTypes.Note) : Bool { n.id == id })) {
          case (null) { #notFound };
          case (?existing) {
            let updated : NotesTypes.Note = {
              existing with
              subject;
              title;
              content;
              colorTag;
              isPinned;
              updatedAt = Time.now();
            };
            notes.mapInPlace(func(n : NotesTypes.Note) : NotesTypes.Note {
              if (n.id == id) { updated } else { n }
            });
            noteStore.add(phone, notes);
            #ok(updated);
          };
        };
      };
    };
  };

  public func deleteNote(
    noteStore : Map.Map<Text, List.List<NotesTypes.Note>>,
    phone : Text,
    id : Text,
  ) : Bool {
    switch (noteStore.get(phone)) {
      case (null) { false };
      case (?notes) {
        switch (notes.find(func(n : NotesTypes.Note) : Bool { n.id == id })) {
          case (null) { false };
          case (?_) {
            let filtered = notes.filter(func(n : NotesTypes.Note) : Bool { n.id != id });
            noteStore.add(phone, filtered);
            true;
          };
        };
      };
    };
  };

  public func toggleNotePin(
    noteStore : Map.Map<Text, List.List<NotesTypes.Note>>,
    phone : Text,
    id : Text,
  ) : NotesTypes.NoteResult {
    switch (noteStore.get(phone)) {
      case (null) { #notFound };
      case (?notes) {
        switch (notes.find(func(n : NotesTypes.Note) : Bool { n.id == id })) {
          case (null) { #notFound };
          case (?existing) {
            let updated : NotesTypes.Note = {
              existing with
              isPinned = not existing.isPinned;
              updatedAt = Time.now();
            };
            notes.mapInPlace(func(n : NotesTypes.Note) : NotesTypes.Note {
              if (n.id == id) { updated } else { n }
            });
            noteStore.add(phone, notes);
            #ok(updated);
          };
        };
      };
    };
  };

  // ---- PDFs ----

  // Returns all PDFs for a phone, sorted newest first
  public func getPdfs(pdfStore : Map.Map<Text, List.List<NotesTypes.Pdf>>, phone : Text) : [NotesTypes.Pdf] {
    switch (pdfStore.get(phone)) {
      case (null) { [] };
      case (?pdfs) {
        pdfs.toArray().sort(func(a : NotesTypes.Pdf, b : NotesTypes.Pdf) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  public func uploadPdf(
    pdfStore : Map.Map<Text, List.List<NotesTypes.Pdf>>,
    phone : Text,
    subject : Text,
    filename : Text,
    fileData : [Nat8],
    contentType : Text,
  ) : NotesTypes.Pdf {
    let now = Time.now();
    let id = now.toText() # "-pdf-" # phone;
    let pdf : NotesTypes.Pdf = {
      id;
      phone;
      subject;
      filename;
      fileData;
      contentType;
      createdAt = now;
    };
    let userPdfs = switch (pdfStore.get(phone)) {
      case (null) { List.empty<NotesTypes.Pdf>() };
      case (?p) { p };
    };
    userPdfs.add(pdf);
    pdfStore.add(phone, userPdfs);
    pdf;
  };

  // Returns raw bytes for a PDF by id (searches across all users)
  public func getPdfFile(
    pdfStore : Map.Map<Text, List.List<NotesTypes.Pdf>>,
    id : Text,
  ) : ?[Nat8] {
    for ((_, pdfs) in pdfStore.entries()) {
      switch (pdfs.find(func(p : NotesTypes.Pdf) : Bool { p.id == id })) {
        case (?pdf) { return ?pdf.fileData };
        case (null) {};
      };
    };
    null;
  };

  public func deletePdf(
    pdfStore : Map.Map<Text, List.List<NotesTypes.Pdf>>,
    phone : Text,
    id : Text,
  ) : Bool {
    switch (pdfStore.get(phone)) {
      case (null) { false };
      case (?pdfs) {
        switch (pdfs.find(func(p : NotesTypes.Pdf) : Bool { p.id == id })) {
          case (null) { false };
          case (?_) {
            let filtered = pdfs.filter(func(p : NotesTypes.Pdf) : Bool { p.id != id });
            pdfStore.add(phone, filtered);
            true;
          };
        };
      };
    };
  };
};
