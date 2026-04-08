module {
  public type Subject = {
    id : Nat;
    phone : Text;
    name : Text;
    createdAt : Int;
    chapterCount : Nat; // computed on read, not stored
  };

  public type Chapter = {
    id : Nat;
    subjectId : Nat;
    subjectName : Text; // stored at creation time for efficient pending list
    phone : Text;
    name : Text;
    status : Text; // "pending" or "completed"
    createdAt : Int;
  };
};
