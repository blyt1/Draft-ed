import motor.motor_asyncio
import asyncio

SAMPLE_BEERS = [
    {
        "_id": "1",
        "name": "Pliny the Elder",
        "brewery": "Russian River Brewing Company",
        "type": "Double IPA",
        "abv": "8.0",
        "ibu": "100",
        "description": "A well-balanced, hop-forward Double IPA with notes of pine, citrus, and floral aroma."
    },
    {
        "_id": "2",
        "name": "Guinness Draught",
        "brewery": "Guinness",
        "type": "Stout",
        "abv": "4.2",
        "ibu": "40",
        "description": "A classic Irish dry stout with creamy mouthfeel and roasted malt flavors."
    },
    {
        "_id": "3",
        "name": "Sierra Nevada Pale Ale",
        "brewery": "Sierra Nevada Brewing Co.",
        "type": "Pale Ale",
        "abv": "5.6",
        "ibu": "38",
        "description": "A crisp, refreshing pale ale with bold hop flavor and a hint of pine."
    },
    {
        "_id": "4",
        "name": "Allagash White",
        "brewery": "Allagash Brewing Company",
        "type": "Witbier",
        "abv": "5.2",
        "ibu": "13",
        "description": "A Belgian-style wheat beer with notes of coriander and orange peel."
    },
    {
        "_id": "5",
        "name": "Heady Topper",
        "brewery": "The Alchemist",
        "type": "Double IPA",
        "abv": "8.0",
        "ibu": "75",
        "description": "A hazy, juicy double IPA with intense hop aroma and flavor."
    }
]

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "craftbeer"

async def seed():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.beers.delete_many({})
    await db.beers.insert_many(SAMPLE_BEERS)
    print("Seeded beers collection with sample data.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed()) 