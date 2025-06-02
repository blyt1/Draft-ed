from fastapi import APIRouter, HTTPException, Depends, Query
from app.db import get_db
from app.schemas import BeerAdd
from app.utils import decode_access_token
from fastapi.security import OAuth2PasswordBearer
from typing import List
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter(prefix="/user", tags=["user"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/lists")
async def get_lists(user=Depends(get_current_user), category: str = Query(None)):
    # Find the master list (type 'All Beers')
    master = next((l for l in user.get("beer_lists", []) if l["type"] == "All Beers"), None)
    if not master:
        return []
    if category and category != "All Beers":
        filtered = [b for b in master["beers"] if b.get("type") == category]
        return [{"type": category, "beers": filtered}]
    return [master]

@router.post("/lists/add")
async def add_beer_to_list(beer: BeerAdd, user=Depends(get_current_user), db=Depends(get_db)):
    lists = user.get("beer_lists", [])
    for l in lists:
        if l["type"] == beer.list_type:
            for b in l["beers"]:
                if b.get("beer_id") == beer.beer_id or b.get("_id") == beer.beer_id:
                    b["elo_score"] = 1200
                    break
            else:
                l["beers"].append({"beer_id": beer.beer_id, "elo_score": 1200, "user_notes": ""})
            break
    else:
        lists.append({"type": beer.list_type, "beers": [{"beer_id": beer.beer_id, "elo_score": 1200, "user_notes": ""}]})
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"beer_lists": lists}})
    return {"message": "Beer added or updated"}

@router.post("/lists/{list_type}/remove/{beer_id}")
async def remove_beer_from_list(list_type: str, beer_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    lists = user.get("beer_lists", [])
    for l in lists:
        if l["type"] == list_type:
            l["beers"] = [b for b in l["beers"] if b["beer_id"] != beer_id]
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"beer_lists": lists}})
    return {"message": "Beer removed"}

@router.post("/lists/{list_type}/{beer_id}/notes")
async def update_notes(list_type: str, beer_id: str, notes: str, user=Depends(get_current_user), db=Depends(get_db)):
    lists = user.get("beer_lists", [])
    for l in lists:
        if l["type"] == list_type:
            for b in l["beers"]:
                if b["beer_id"] == beer_id:
                    b["user_notes"] = notes
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"beer_lists": lists}})
    return {"message": "Notes updated"}

# Pairwise comparison and Elo update
def update_elo(winner, loser, k=32):
    expected_win = 1 / (1 + 10 ** ((loser["elo_score"] - winner["elo_score"]) / 400))
    winner["elo_score"] += int(k * (1 - expected_win))
    loser["elo_score"] += int(k * (0 - (1 - expected_win)))

class CompareRequest(BaseModel):
    winner_id: str
    loser_id: str

@router.post("/lists/{list_type}/compare")
async def pairwise_compare(list_type: str, data: CompareRequest, user=Depends(get_current_user), db=Depends(get_db)):
    lists = user.get("beer_lists", [])
    winner_id = data.winner_id
    loser_id = data.loser_id
    for l in lists:
        if l["type"] == list_type:
            beers = l["beers"]
            winner = next((b for b in beers if b.get("beer_id") == winner_id or b.get("_id") == winner_id), None)
            loser = next((b for b in beers if b.get("beer_id") == loser_id or b.get("_id") == loser_id), None)
            if not winner:
                beer_doc = await db.beers.find_one({"_id": winner_id})
                if beer_doc:
                    winner = {"beer_id": winner_id, "elo_score": 1200, "user_notes": ""}
                    beers.append(winner)
            if not loser:
                beer_doc = await db.beers.find_one({"_id": loser_id})
                if beer_doc:
                    loser = {"beer_id": loser_id, "elo_score": 1200, "user_notes": ""}
                    beers.append(loser)
            if not winner or not loser:
                raise HTTPException(status_code=404, detail="Beer not found in list or database")
            update_elo(winner, loser)
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"beer_lists": lists}})
    return {"message": "Elo updated"}

# Note: list_type is used as a category, so users can have multiple lists (e.g., Double IPA, Stout, etc.)
# The frontend will pass the selected list_type for all list operations.
# No code change needed if already supported. 