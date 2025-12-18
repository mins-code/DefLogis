from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from app.config import settings
from app.routers import users, routes, convoys, logs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    client = AsyncIOMotorClient(settings.MONGO_URI)
    app.db = client[settings.DATABASE_NAME]
    print(f"--- CONFIGURATION CHECK ---")
    print(f"Pinata JWT Loaded: {'Yes' if settings.PINATA_JWT else 'No'}")
    print(f"RPC URL Found: {'Yes' if settings.ETHEREUM_RPC_URL else 'No'}")
    print(f"Contract Address: {settings.CONTRACT_ADDRESS}")
    print("---------------------------")
    yield
    # Shutdown
    client.close()

app = FastAPI(title="DefLogis AI Convoy API", lifespan=lifespan)

# CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://def-logis.vercel.app",
    "https://deflogis.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
@app.get("/")
def read_root():
    from app.services.blockchain_service import w3
    return {
        "status": "Backend Online",
        "service": "DefLogis API",
        "web3_connected": w3.is_connected() if w3 else False
    }

# Include Routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(routes.router, prefix="/api/routes", tags=["Routes"])
app.include_router(convoys.router, prefix="/api/convoys", tags=["Convoys"])
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
