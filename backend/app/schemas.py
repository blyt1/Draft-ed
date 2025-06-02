from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class BeerSearch(BaseModel):
    name: Optional[str] = None
    brewery: Optional[str] = None
    type: Optional[str] = None
    keywords: Optional[str] = None

class BeerAdd(BaseModel):
    beer_id: str
    list_type: str 