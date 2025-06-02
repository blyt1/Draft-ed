from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, beers, user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Craft Beer Enthusiast API is running."}

app.include_router(auth.router)
app.include_router(beers.router)
app.include_router(user.router)

# Placeholder for including routers
# from .routes import auth, beers, user
# app.include_router(auth.router)
# app.include_router(beers.router)
# app.include_router(user.router) 