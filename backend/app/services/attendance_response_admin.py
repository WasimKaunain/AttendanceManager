from app.schemas.attendance import AttendanceResponse

def serialize_admin_attendance(record, timezone_str: str):
    return (
        AttendanceResponse
        .model_validate(record)
        .to_local_time(timezone_str)
    )