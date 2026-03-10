from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")
    role: str
    site_id: Optional[str] = None
