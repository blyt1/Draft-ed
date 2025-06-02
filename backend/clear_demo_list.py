from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "craftbeer"
DEMO_EMAIL = "demo@demo.com"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

result = db.users.update_one({"email": DEMO_EMAIL}, {"$set": {"beer_lists": []}})
if result.modified_count:
    print("Demo user's beer list cleared.")
else:
    print("Demo user not found or list already empty.") 