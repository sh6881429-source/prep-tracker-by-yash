module {
  public type Note = {
    id : Text;
    phone : Text;
    subject : Text;
    title : Text;
    content : Text; // rich text stored as JSON/HTML string
    colorTag : Text; // "Red" | "Yellow" | "Green" | "Blue" | "Purple" | ""
    isPinned : Bool;
    createdAt : Int;
    updatedAt : Int;
  };

  public type Pdf = {
    id : Text;
    phone : Text;
    subject : Text;
    filename : Text;
    fileData : [Nat8];
    contentType : Text;
    createdAt : Int;
  };

  public type NoteResult = {
    #ok : Note;
    #notFound;
    #unauthorized;
  };

  public type PdfResult = {
    #ok : Pdf;
    #notFound;
    #unauthorized;
  };
};
