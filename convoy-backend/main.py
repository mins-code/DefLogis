# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import random
import asyncio # <-- ADDED THIS IMPORT FOR ASYNCHRONOUS EXECUTION FIX
from google import genai
from google.genai import types
from datetime import datetime
from bson import ObjectId

# 1. Load Environment Variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_NAME = "deflogis" # Must match the database name in your MONGO_URI

# 2. Initialize FastAPI and Database/AI Clients
app = FastAPI(title="DefLogis AI Convoy API")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
ai = genai.Client(api_key=GEMINI_API_KEY)

# 3. Configure CORS (Allows React frontend to talk to this backend)
origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Pydantic Models (Data Structures mirroring frontend's types.ts)
class RouteAnalysis(BaseModel):
    routeId: str
    riskLevel: str = Field(pattern=r"^(LOW|MEDIUM|HIGH)$")
    estimatedDuration: str
    checkpoints: List[str]
    trafficCongestion: int = Field(..., ge=0, le=100)
    weatherImpact: str
    strategicNote: str

class Convoy(BaseModel):
    id: str
    name: str
    startLocation: str
    destination: str
    status: str
    progress: int = 0
    vehicleCount: int
    priority: str
    eta: str
    distance: str

class SecurityLog(BaseModel):
    id: str
    time: str
    event: str
    user: str
    ip: str
    status: str

# Define the JSON Schema for the Gemini response
GEMINI_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "routeId": {"type": types.Type.STRING},
        "riskLevel": {"type": types.Type.STRING, "enum": ["LOW", "MEDIUM", "HIGH"]},
        "estimatedDuration": {"type": types.Type.STRING},
        "checkpoints": {"type": types.Type.ARRAY, "items": {"type": types.Type.STRING}},
        "trafficCongestion": {"type": types.Type.NUMBER, "description": "Percentage probability 0-100"},
        "weatherImpact": {"type": types.Type.STRING},
        "strategicNote": {"type": types.Type.STRING}
    },
    required=["routeId", "riskLevel", "estimatedDuration", "checkpoints", "trafficCongestion", "strategicNote"]
)


# --- API Endpoints ---

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "Backend Online", "service": "DefLogis API"}


@app.post("/api/routes/analyze", response_model=RouteAnalysis)
async def analyze_route(start: str = Query(...), end: str = Query(...), vehicleCount: int = Query(...)):
    """Handles AI analysis request from the RoutePlanner. FIX: Uses asyncio.to_thread."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API Key missing.")

    prompt = f"""
      Act as a military logistics AI component of the "Code Red" system.
      Analyze a convoy movement from "{start}" to "{end}" with {vehicleCount} vehicles.
      Consider: Potential civilian traffic bottlenecks, strategic risk assessment, and weather impacts.
      Output a structured JSON response.
    """

    try:
        # FIX: Wrap the synchronous SDK call with asyncio.to_thread
        response = await asyncio.to_thread(
             ai.models.generate_content,
             model="gemini-2.5-flash",
             contents=prompt,
             config={
                 "response_mime_type": "application/json",
                 "response_schema": GEMINI_SCHEMA
             }
        )
        return RouteAnalysis.model_validate_json(response.text)

    except Exception as e:
        print(f"AI Analysis failed: {e}")
        # Fallback to mock data if AI service fails
        return {
            "routeId": f"MOCK-ERR-{random.randint(1000, 9999)}",
            "riskLevel": 'MEDIUM',
            "estimatedDuration": '2 Hours 15 Mins',
            "checkpoints": ['Alpha Checkpoint', 'Bridge crossing', 'City Outskirts'],
            "trafficCongestion": 65,
            "weatherImpact": 'AI Service Failure.',
            "strategicNote": 'AI service failed, falling back to cached route plan.'
        }


@app.post("/api/convoys/deploy", status_code=201)
async def deploy_convoy(convoy_data: Convoy):
    """Saves a new, AI-planned convoy to the database and logs the event."""
    
    # Save convoy to 'convoys' collection 
    convoy_dict = convoy_data.model_dump()
    await db.convoys.insert_one(convoy_dict)
    
    # Log the deployment event to 'security_logs' collection 
    log_entry = {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "event": "CONVOY_DEPLOYED",
        "user": "API_COMMANDER",
        "ip": "127.0.0.1",
        "status": "SUCCESS"
    }
    await db.security_logs.insert_one(log_entry)
    
    return {"message": "Convoy deployed and logged", "id": convoy_data.id}


@app.get("/api/convoys", response_model=List[Convoy])
async def get_active_convoys():
    """Retrieves all active convoys for Dashboard and Live Tracking."""
    # Retrieve all documents, exclude MongoDB's internal _id field
    convoys_cursor = db.convoys.find({}, {'_id': 0})
    convoys = await convoys_cursor.to_list(100)
    
    # Simple logic to add "live" progression to convoys if status is MOVING (simulates telemetry)
    for convoy in convoys:
        if convoy.get('status') == 'MOVING':
             # Simulate small progress jump
             convoy['progress'] = min(99, convoy.get('progress', 0) + random.randint(1, 3))
             # Update the document back to the database
             await db.convoys.update_one({'id': convoy['id']}, {'$set': {'progress': convoy['progress']}})
             
    return convoys


@app.get("/api/logs/security", response_model=List[SecurityLog])
async def get_security_logs():
    """Retrieves security audit logs."""
    # Retrieve all documents, sorted by time descending, exclude _id field
    logs_cursor = db.security_logs.find({}, {'_id': 0}).sort("time", -1)
    logs = await logs_cursor.to_list(50) 
    return logs