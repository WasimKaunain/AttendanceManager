from app.schemas.mobile import MobileAttendanceResponse

def serialize_attendance(record, timezone_str: str):
    """
    Convert DB AttendanceRecord → API response with timezone applied
    """
    return (MobileAttendanceResponse.model_validate(record).to_local_time(timezone_str))