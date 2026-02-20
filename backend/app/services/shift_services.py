from datetime import datetime, time, timedelta


def parse_time(t: str) -> time:
    return datetime.strptime(t, "%H:%M").time()


def is_late(check_in: datetime, shift_start: str, grace_minutes: int) -> bool:
    start = parse_time(shift_start)
    allowed = datetime.combine(check_in.date(), start) + timedelta(minutes=grace_minutes)
    return check_in > allowed


def calculate_overtime(total_hours: float, threshold: float) -> float:
    if total_hours > threshold:
        return round(total_hours - threshold, 2)
    return 0.0
