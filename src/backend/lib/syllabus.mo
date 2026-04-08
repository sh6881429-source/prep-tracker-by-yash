import Types "../types/syllabus";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  public type Subject = Types.Subject;
  public type Chapter = Types.Chapter;

  // Returns subjects for a phone, newest first, with computed chapterCount
  public func getSubjects(
    subjectStore : Map.Map<Text, List.List<Subject>>,
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
  ) : [Subject] {
    switch (subjectStore.get(phone)) {
      case (null) { [] };
      case (?subjects) {
        let allChapters : List.List<Chapter> = switch (chapterStore.get(phone)) {
          case (null) { List.empty<Chapter>() };
          case (?c) { c };
        };
        let withCounts = subjects.map<Subject, Subject>(func(s) {
          let count = allChapters.filter(func(c : Chapter) : Bool { c.subjectId == s.id }).size();
          { s with chapterCount = count };
        });
        withCounts.toArray().sort(func(a : Subject, b : Subject) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  // Returns chapters for a subject, newest first
  public func getChapters(
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
    subjectId : Nat,
  ) : [Chapter] {
    switch (chapterStore.get(phone)) {
      case (null) { [] };
      case (?chapters) {
        let filtered = chapters.filter(func(c : Chapter) : Bool { c.subjectId == subjectId });
        filtered.toArray().sort(func(a : Chapter, b : Chapter) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  // Returns all pending chapters for a phone, newest first
  public func getPendingChapters(
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
  ) : [Chapter] {
    switch (chapterStore.get(phone)) {
      case (null) { [] };
      case (?chapters) {
        let pending = chapters.filter(func(c : Chapter) : Bool { c.status == "pending" });
        pending.toArray().sort(func(a : Chapter, b : Chapter) : { #less; #equal; #greater } {
          Int.compare(b.createdAt, a.createdAt)
        });
      };
    };
  };

  // Returns count of pending chapters for a phone
  public func getPendingChaptersCount(
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
  ) : Nat {
    switch (chapterStore.get(phone)) {
      case (null) { 0 };
      case (?chapters) {
        chapters.filter(func(c : Chapter) : Bool { c.status == "pending" }).size();
      };
    };
  };

  // Adds a subject for a phone; returns the created Subject
  // NOTE: caller must increment nextSubjectId after calling this
  public func addSubject(
    subjectStore : Map.Map<Text, List.List<Subject>>,
    nextSubjectId : Nat,
    phone : Text,
    name : Text,
  ) : Subject {
    let subject : Subject = {
      id = nextSubjectId;
      phone;
      name;
      createdAt = Time.now();
      chapterCount = 0; // placeholder; actual count computed on read
    };

    let userSubjects = switch (subjectStore.get(phone)) {
      case (null) { List.empty<Subject>() };
      case (?s) { s };
    };
    userSubjects.add(subject);
    subjectStore.add(phone, userSubjects);
    subject;
  };

  // Deletes a subject and all its chapters
  public func deleteSubject(
    subjectStore : Map.Map<Text, List.List<Subject>>,
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
    subjectId : Nat,
  ) : { #ok; #err : Text } {
    switch (subjectStore.get(phone)) {
      case (null) { #err("Subject not found") };
      case (?subjects) {
        let found = subjects.find(func(s : Subject) : Bool { s.id == subjectId });
        switch (found) {
          case (null) { #err("Subject not found") };
          case (?_) {
            let filtered = subjects.filter(func(s : Subject) : Bool { s.id != subjectId });
            subjectStore.add(phone, filtered);
            // Remove all chapters for this subject
            switch (chapterStore.get(phone)) {
              case (null) {};
              case (?chapters) {
                let remaining = chapters.filter(func(c : Chapter) : Bool { c.subjectId != subjectId });
                chapterStore.add(phone, remaining);
              };
            };
            #ok;
          };
        };
      };
    };
  };

  // Adds a chapter inside a subject; returns the created Chapter
  // NOTE: caller must increment nextChapterId after calling this
  public func addChapter(
    subjectStore : Map.Map<Text, List.List<Subject>>,
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    nextChapterId : Nat,
    phone : Text,
    subjectId : Nat,
    name : Text,
  ) : { #ok : Chapter; #err : Text } {
    // Verify the subject exists and look up its name
    let subjectNameOpt : ?Text = switch (subjectStore.get(phone)) {
      case (null) { null };
      case (?subjects) {
        switch (subjects.find(func(s : Subject) : Bool { s.id == subjectId })) {
          case (null) { null };
          case (?s) { ?s.name };
        };
      };
    };

    let subjectName = switch (subjectNameOpt) {
      case (null) { return #err("Subject not found") };
      case (?n) { n };
    };

    let chapter : Chapter = {
      id = nextChapterId;
      subjectId;
      subjectName;
      phone;
      name;
      status = "pending";
      createdAt = Time.now();
    };

    let userChapters = switch (chapterStore.get(phone)) {
      case (null) { List.empty<Chapter>() };
      case (?c) { c };
    };
    userChapters.add(chapter);
    chapterStore.add(phone, userChapters);
    #ok(chapter);
  };

  // Deletes a chapter by id
  public func deleteChapter(
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
    chapterId : Nat,
  ) : { #ok; #err : Text } {
    switch (chapterStore.get(phone)) {
      case (null) { #err("Chapter not found") };
      case (?chapters) {
        let found = chapters.find(func(c : Chapter) : Bool { c.id == chapterId });
        switch (found) {
          case (null) { #err("Chapter not found") };
          case (?_) {
            let filtered = chapters.filter(func(c : Chapter) : Bool { c.id != chapterId });
            chapterStore.add(phone, filtered);
            #ok;
          };
        };
      };
    };
  };

  // Updates a chapter's status to "pending" or "completed"
  public func updateChapterStatus(
    chapterStore : Map.Map<Text, List.List<Chapter>>,
    phone : Text,
    chapterId : Nat,
    status : Text,
  ) : { #ok; #err : Text } {
    if (status != "pending" and status != "completed") {
      return #err("Invalid status: must be 'pending' or 'completed'");
    };

    switch (chapterStore.get(phone)) {
      case (null) { #err("Chapter not found") };
      case (?chapters) {
        let found = chapters.find(func(c : Chapter) : Bool { c.id == chapterId });
        switch (found) {
          case (null) { #err("Chapter not found") };
          case (?_) {
            chapters.mapInPlace(func(c : Chapter) : Chapter {
              if (c.id == chapterId) { { c with status } } else { c }
            });
            chapterStore.add(phone, chapters);
            #ok;
          };
        };
      };
    };
  };
};
