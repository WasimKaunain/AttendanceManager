from pydantic import BaseModel
from datetime import datetime
import pytz


class ORMBase(BaseModel):
    class Config:
        from_attributes = True

    def to_local_time(self, timezone_str: str):
        """
        Convert all datetime fields from UTC → given timezone
        """
        if not timezone_str:
            return self

        try:
            tz = pytz.timezone(timezone_str)
        except Exception:
            return self

        data = self.__dict__.copy()

        for key, value in data.items():
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    # assume stored in UTC
                    value = value.replace(tzinfo=pytz.utc)

                data[key] = value.astimezone(tz)

        return self.__class__(**data)