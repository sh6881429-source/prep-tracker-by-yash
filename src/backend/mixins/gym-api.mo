import GymLib "../lib/gym";
import GymTypes "../types/gym";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  gymStore : Map.Map<Text, List.List<GymTypes.GymAttendance>>,
  phoneToPrincipal : Map.Map<Text, Principal>,
) {
  func gymOwnerCheck(phone : Text, caller : Principal) : Bool {
    switch (phoneToPrincipal.get(phone)) {
      case (null) { false };
      case (?owner) { Principal.equal(owner, caller) };
    };
  };

  // Return all attendance records for the user (newest date first).
  public shared ({ caller }) func getGymAttendance(phone : Text) : async [GymTypes.GymAttendance] {
    if (not gymOwnerCheck(phone, caller)) {
      return [];
    };
    GymLib.getAttendance(gymStore, phone);
  };

  // Mark or update attendance for a given date.
  // `status` is #present, #absent, or #rest; `note` is "" when not applicable.
  // Rest days do not break the streak.
  public shared ({ caller }) func markGymAttendance(
    phone : Text,
    date : Text,
    status : GymTypes.AttendanceStatus,
    note : Text,
  ) : async GymTypes.AttendanceResult {
    if (not gymOwnerCheck(phone, caller)) {
      return #unauthorized;
    };
    let record = GymLib.markAttendance(gymStore, phone, date, status, note);
    #ok(record);
  };

  // Calculate and return the current streak.
  // `todayDate` must be supplied as a YYYY-MM-DD string by the caller.
  public shared ({ caller }) func getGymStreak(phone : Text, todayDate : Text) : async Nat {
    if (not gymOwnerCheck(phone, caller)) {
      return 0;
    };
    GymLib.calculateStreak(gymStore, phone, todayDate);
  };
};
