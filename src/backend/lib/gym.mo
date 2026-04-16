import GymTypes "../types/gym";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

module {
  // Key: phone. Value: list of attendance records for that user.
  type Store = Map.Map<Text, List.List<GymTypes.GymAttendance>>;

  // Stable ID is phone # "-" # date (one record per user per date).
  func makeId(phone : Text, date : Text) : Text {
    phone # "-" # date;
  };

  // Returns all attendance records for a user, sorted newest-date first.
  public func getAttendance(store : Store, phone : Text) : [GymTypes.GymAttendance] {
    switch (store.get(phone)) {
      case (null) { [] };
      case (?records) {
        records.toArray().sort(func(a : GymTypes.GymAttendance, b : GymTypes.GymAttendance) : { #less; #equal; #greater } {
          Text.compare(b.date, a.date)  // lexicographic YYYY-MM-DD sorts correctly
        });
      };
    };
  };

  // Upsert: creates or updates a record for (phone, date).
  public func markAttendance(
    store : Store,
    phone : Text,
    date : Text,
    status : GymTypes.AttendanceStatus,
    note : Text,
  ) : GymTypes.GymAttendance {
    let id = makeId(phone, date);
    let record : GymTypes.GymAttendance = { id; phone; date; status; note };

    let userRecords = switch (store.get(phone)) {
      case (null) { List.empty<GymTypes.GymAttendance>() };
      case (?r) { r };
    };

    // Check whether this date already exists — if so, update in place.
    let existing = userRecords.find(func(r : GymTypes.GymAttendance) : Bool { r.date == date });
    switch (existing) {
      case (?_) {
        userRecords.mapInPlace(func(r : GymTypes.GymAttendance) : GymTypes.GymAttendance {
          if (r.date == date) { record } else { r }
        });
      };
      case (null) {
        userRecords.add(record);
      };
    };

    store.add(phone, userRecords);
    record;
  };

  // Calculate the current attendance streak (consecutive present days counting
  // back from today).  `todayDate` is a YYYY-MM-DD string supplied by the frontend.
  // The streak resets if today (or yesterday) has no "present" record.
  //
  // Because the canister has no real-time clock for calendar dates, we accept
  // `todayDate` from the caller and walk backwards through sorted dates.
  public func calculateStreak(store : Store, phone : Text, todayDate : Text) : Nat {
    let records = getAttendance(store, phone); // sorted newest-first
    if (records.size() == 0) { return 0 };

    // Build maps for O(log n) lookup:
    //   presentDates — days marked #present
    //   restDates    — days marked #rest
    // Streak rule: walking backwards from todayDate —
    //   - #absent  → stop (streak breaks)
    //   - #rest    → skip (do not increment streak, do not break streak)
    //   - #present → increment streak and continue
    //   - no record → stop (unrecorded day counts as absent)
    let presentDates = Map.empty<Text, Bool>();
    let restDates = Map.empty<Text, Bool>();
    for (r in records.values()) {
      switch (r.status) {
        case (#present) { presentDates.add(r.date, true) };
        case (#rest) { restDates.add(r.date, true) };
        case (#absent) {};
      };
    };

    // We need to walk backwards: todayDate, then yesterday, etc.
    // Date arithmetic: parse YYYY-MM-DD into (year, month, day), decrement by 1 day.
    func parseDate(d : Text) : ?(Nat, Nat, Nat) {
      let parts = d.split(#char '-');
      let arr = parts.toArray();
      if (arr.size() != 3) { return null };
      switch (arr[0].toNat(), arr[1].toNat(), arr[2].toNat()) {
        case (?y, ?m, ?day) { ?(y, m, day) };
        case _ { null };
      };
    };

    func pad2(n : Nat) : Text {
      if (n < 10) { "0" # n.toText() } else { n.toText() };
    };

    func formatDate(y : Nat, m : Nat, d : Nat) : Text {
      y.toText() # "-" # pad2(m) # "-" # pad2(d)
    };

    func daysInMonth(year : Nat, month : Nat) : Nat {
      if (month == 2) {
        let leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0);
        if (leap) { 29 } else { 28 }
      } else if (month == 4 or month == 6 or month == 9 or month == 11) {
        30
      } else {
        31
      };
    };

    // Returns the previous calendar date, or null if we can't parse.
    func prevDate(d : Text) : ?Text {
      switch (parseDate(d)) {
        case (null) { null };
        case (?(y, m, day)) {
          if (day > 1) {
            ?formatDate(y, m, Nat.sub(day, 1))
          } else if (m > 1) {
            let prevM = Nat.sub(m, 1);
            ?formatDate(y, prevM, daysInMonth(y, prevM))
          } else {
            ?formatDate(Nat.sub(y, 1), 12, 31)
          };
        };
      };
    };

    // Walk backwards from todayDate, counting consecutive present days.
    // Rest days are skipped (don't break, don't count).
    // Any absent day or unrecorded day stops the walk.
    var streak = 0;
    var current = ?todayDate;
    label walk loop {
      switch (current) {
        case (null) { break walk };
        case (?d) {
          if (presentDates.containsKey(d)) {
            streak += 1;
            current := prevDate(d);
          } else if (restDates.containsKey(d)) {
            // rest day — skip over it without breaking streak
            current := prevDate(d);
          } else {
            break walk;
          };
        };
      };
    };

    streak;
  };
};
