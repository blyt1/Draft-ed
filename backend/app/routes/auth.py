from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import UserCreate, UserLogin, Token
from app.utils import get_password_hash, verify_password, create_access_token
from app.db import get_db
from app.models import User
from pymongo.errors import DuplicateKeyError
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db=Depends(get_db)):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_pw,
        "beer_lists": []
    }
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"} 