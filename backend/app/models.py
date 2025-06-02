from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class Beer(BaseModel):
    id: Optional[str] = Field(default_factory=str, alias="_id")
    name: str
    brewery: Optional[str] = None
    type: Optional[str] = None
    abv: Optional[str] = None
    ibu: Optional[str] = None
    description: Optional[str] = None

class BeerInList(BaseModel):
    beer_id: str
    elo_score: int = 1200
    user_notes: Optional[str] = None

class BeerList(BaseModel):
    type: str
    beers: List[BeerInList] = []

class User(BaseModel):
    id: Optional[str] = Field(default_factory=str, alias="_id")
    username: str
    email: str
    password_hash: str
    beer_lists: List[BeerList] = []

class CachedBeer(BaseModel):
    id: str = Field(alias="_id")
    name: str
    brewery: Optional[str] = None
    type: Optional[str] = None
    abv: Optional[str] = None
    ibu: Optional[str] = None
    description: Optional[str] = None
    last_fetched: Optional[str] = None 