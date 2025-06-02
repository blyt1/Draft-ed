from fastapi import APIRouter, HTTPException, Depends
from app.db import get_db
from app.models import CachedBeer
from app.schemas import BeerSearch
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/beers", tags=["beers"])

class BeerCreate(BaseModel):
    name: str
    brewery: Optional[str] = None
    type: Optional[str] = None
    abv: Optional[str] = None
    ibu: Optional[str] = None
    description: Optional[str] = None

@router.post("/add")
async def add_beer(beer: BeerCreate, db=Depends(get_db)):
    # Generate a unique _id
    beer_doc = beer.dict()
    beer_doc["_id"] = str(ObjectId())
    # Check for duplicate by name and brewery
    existing = await db.beers.find_one({"name": beer_doc["name"], "brewery": beer_doc.get("brewery")})
    if existing:
        raise HTTPException(status_code=400, detail="Beer already exists")
    await db.beers.insert_one(beer_doc)
    return {"message": "Beer added", "beer": beer_doc}

@router.get("/search")
async def search_beers(
    name: Optional[str] = None,
    brewery: Optional[str] = None,
    type: Optional[str] = None,
    keywords: Optional[str] = None,
    db=Depends(get_db)
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if brewery:
        query["brewery"] = {"$regex": brewery, "$options": "i"}
    if type:
        query["type"] = {"$regex": type, "$options": "i"}
    if keywords:
        # Search in name, brewery, type, description
        query["$or"] = [
            {"name": {"$regex": keywords, "$options": "i"}},
            {"brewery": {"$regex": keywords, "$options": "i"}},
            {"type": {"$regex": keywords, "$options": "i"}},
            {"description": {"$regex": keywords, "$options": "i"}},
        ]
    beers = await db.beers.find(query).to_list(50)
    return beers

@router.get("/{beer_id}")
async def get_beer(beer_id: str, db=Depends(get_db)):
    beer = await db.beers.find_one({"_id": beer_id})
    if not beer:
        raise HTTPException(status_code=404, detail="Beer not found")
    return beer 