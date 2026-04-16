module {
  public type AttendanceStatus = { #present; #absent; #rest };

  public type GymAttendance = {
    id : Text;        // unique: phone # "-" # date
    phone : Text;
    date : Text;      // YYYY-MM-DD string
    status : AttendanceStatus;
    note : Text;      // optional workout note (empty string when absent or none)
  };

  public type AttendanceResult = {
    #ok : GymAttendance;
    #unauthorized;
  };
};
