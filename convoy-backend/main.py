# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import random
import asyncio
from google import genai
from google.genai import types
from datetime import datetime
from bson import ObjectId
import json 
import requests 
from web3 import Web3 
import hashlib # ADDED for route hashing

# 1. Load Environment Variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_NAME = "deflogis" # Must match the database name in your MONGO_URI
# --- NEW IPFS/BLOCKCHAIN ENV VARS ---
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")
ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
# -------------------------------------

# 2. Initialize FastAPI and Database/AI Clients
app = FastAPI(title="DefLogis AI Convoy API")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
ai = genai.Client(api_key=GEMINI_API_KEY)

# 3. Configure CORS (Allows React frontend to talk to this backend)
origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://def-logis.vercel.app",
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
    ipfsCid: Optional[str] = None 
    txHash: Optional[str] = None

class SecurityLog(BaseModel):
    id: str
    time: str
    event: str
    user: str
    ip: str
    status: str

class DeployRequest(BaseModel):
    convoy: Convoy
    analysis: RouteAnalysis

class UserBase(BaseModel):
    id: str 
    role: str = Field(pattern=r"^(COMMANDER|LOGISTICS_OFFICER|FIELD_AGENT)$")
    name: str
    
class User(UserBase):
    clearanceLevel: int

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


# --- WEB3 and Contract Setup ---

# ABI for the logRoute function in your ConvoyLog contract
CONVOY_LOG_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_convoyId", "type": "string"},
            {"internalType": "string", "name": "_ipfsCid", "type": "string"},
            {"internalType": "string", "name": "_routeHash", "type": "string"}
        ],
        "name": "logRoute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

w3 = None
contract_instance = None
try:
    if ETHEREUM_RPC_URL and CONTRACT_ADDRESS:
        w3 = Web3(Web3.HTTPProvider(ETHEREUM_RPC_URL))
        if w3.is_connected():
            contract_instance = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONVOY_LOG_ABI)
            print("Web3 connected and contract initialized.")
        else:
            print("Web3 failed to connect.")
except Exception as e:
    print(f"Error initializing Web3: {e}")
    

# --- Utility Functions for IPFS & Blockchain ---

def calculate_route_hash(analysis: RouteAnalysis) -> str:
    """Creates a unique, verifiable hash of the RouteAnalysis data."""
    # Convert the analysis object to a canonical JSON string and hash it
    analysis_json = json.dumps(
        analysis.model_dump(exclude_none=True), 
        sort_keys=True,
        indent=None,
        separators=(',', ':')
    )
    return hashlib.sha256(analysis_json.encode('utf-8')).hexdigest()

async def upload_to_ipfs(convoy_id: str, analysis: RouteAnalysis) -> str:
    """Uploads RouteAnalysis JSON to Pinata via asyncio.to_thread."""
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        raise ValueError("Pinata API keys are missing.")

    data = {
        'routeId': analysis.routeId,
        'convoyId': convoy_id,
        'timestamp': datetime.now().isoformat(),
        'analysis': analysis.model_dump()
    }
    
    # Sync operation wrapped in asyncio.to_thread
    def sync_upload():
        url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        headers = {
            'accept': 'application/json',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status() 
        return response.json()['IpfsHash']

    return await asyncio.to_thread(sync_upload)

async def log_cid_on_chain(convoy_id: str, ipfs_cid: str, route_hash: str) -> str:
    """Logs the IPFS CID and route hash to the smart contract."""
    if not w3 or not contract_instance or not PRIVATE_KEY:
        raise ValueError("Web3 connection/contract/private key is missing.")

    account = w3.eth.account.from_key(PRIVATE_KEY)
    sender_address = account.address

    # Build the transaction to call logRoute
    transaction = contract_instance.functions.logRoute(
        convoy_id, 
        ipfs_cid, 
        route_hash
    ).build_transaction({
        'from': sender_address,
        'nonce': w3.eth.get_transaction_count(sender_address),
        'gas': 2000000, 
        'gasPrice': w3.to_wei('50', 'gwei') 
    })

    # Sign and Send the transaction (Sync operations wrapped in asyncio.to_thread)
    def sync_send_transaction():
        signed_txn = w3.eth.account.sign_transaction(transaction, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if tx_receipt.status != 1:
            raise Exception("Blockchain transaction failed to confirm.")
        return tx_hash.hex()
        
    return await asyncio.to_thread(sync_send_transaction)


# --- API Endpoints ---

# --- User Authentication Endpoints ---

@app.post("/api/users/signup", status_code=201)
async def register_user(user_data: UserBase):
    """Registers a new user and stores their details in the 'users' collection."""
    
    # 1. Check if user ID already exists
    existing_user = await db.users.find_one({"id": user_data.id})
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID already registered.")
    
    # 2. Determine Clearance Level based on role (simple logic)
    clearance = 0
    if user_data.role == 'COMMANDER':
        clearance = 5
    elif user_data.role == 'LOGISTICS_OFFICER':
        clearance = 3
    elif user_data.role == 'FIELD_AGENT':
        clearance = 1
        
    # 3. Create full user object and save to 'users' collection
    user_to_save = User(
        id=user_data.id,
        name=user_data.name,
        role=user_data.role,
        clearanceLevel=clearance
    )
    
    # Stores the user record in the 'users' collection
    await db.users.insert_one(user_to_save.model_dump())
    
    # 4. Log the registration event
    log_entry = {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "event": "USER_REGISTERED",
        "user": user_to_save.id,
        "ip": "127.0.0.1",
        "status": "INFO"
    }
    await db.security_logs.insert_one(log_entry)
    
    # Returns the registered user details, without the clearance level for this response
    return {"message": "User registered successfully", "user": user_to_save.model_dump(exclude=['clearanceLevel'])}


@app.post("/api/users/login", response_model=User)
async def login_user(user_data: UserBase):
    """Authenticates a user by checking ID and Role against the 'users' collection."""
    
    # In a real app, this would check a hashed password. Here we check ID and Role.
    user_record = await db.users.find_one({"id": user_data.id, "role": user_data.role})

    if not user_record:
        # Provide a more specific error for better frontend feedback
        user_id_exists = await db.users.find_one({"id": user_data.id})
        if user_id_exists:
             raise HTTPException(status_code=401, detail="Invalid Role for this ID.")
        else:
             raise HTTPException(status_code=404, detail="User ID not found.")

    # Log the login event
    log_entry = {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "event": "USER_LOGIN",
        "user": user_data.id,
        "ip": "127.0.0.1",
        "status": "SUCCESS"
    }
    await db.security_logs.insert_one(log_entry)

    # Return the full User object (excluding MongoDB's internal _id)
    user_record.pop('_id', None)
    return User.model_validate(user_record)

# --- Endpoint to retrieve all users ---
@app.get("/api/users", response_model=List[User])
async def get_all_users():
    """Retrieves all registered users from the 'users' collection."""
    # Retrieve all documents, exclude MongoDB's internal _id field
    users_cursor = db.users.find({}, {'_id': 0})
    users = await users_cursor.to_list(100)
    return users
# ---------------------------------------------


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


@app.post("/api/convoys/deploy", response_model=Convoy, status_code=201) 
async def deploy_convoy(deploy_data: DeployRequest):
    """Saves a new, AI-planned convoy to the database and logs the event, including IPFS/Blockchain logging."""
    
    convoy_data = deploy_data.convoy
    analysis_data = deploy_data.analysis
    
    ipfs_cid = None
    tx_hash = None
    route_hash = None
    
    try:
        # 1. Calculate Route Hash
        route_hash = calculate_route_hash(analysis_data)

        # 2. Upload Route Analysis to IPFS (Pinata)
        ipfs_cid = await upload_to_ipfs(convoy_data.id, analysis_data)
        convoy_data.ipfsCid = ipfs_cid
        
        # 3. Log CID and Hash to Blockchain
        tx_hash = await log_cid_on_chain(convoy_data.id, ipfs_cid, route_hash)
        convoy_data.txHash = tx_hash
        
        # 4. Save Convoy (with new log data) to MongoDB
        convoy_dict = convoy_data.model_dump(exclude_none=True)
        await db.convoys.insert_one(convoy_dict)
        
        # 5. Log the deployment event to 'security_logs'
        log_entry = {
            "id": f"LOG-BC-{random.randint(1000, 9999)}",
            "time": datetime.now().strftime("%H:%M:%S"),
            "event": "CONVOY_DEPLOYED_BC", 
            "user": "API_COMMANDER",
            "ip": "127.0.0.1",
            "status": "SUCCESS"
        }
        await db.security_logs.insert_one(log_entry)
        
        return convoy_data # Return the Convoy object including CID and Tx Hash
        
    except Exception as e:
        # Generic error handling for IPFS/Blockchain failure
        print(f"CRITICAL LOGGING FAILURE: {e}")
        
        # Log CRITICAL event for security audit trail
        error_log_entry = {
            "id": f"LOG-FAIL-{random.randint(1000, 9999)}",
            "time": datetime.now().strftime("%H:%M:%S"),
            "event": "BC_LOG_FAILURE", 
            "user": "SYSTEM_BOT",
            "ip": "N/A",
            "status": "CRITICAL"
        }
        await db.security_logs.insert_one(error_log_entry)
        
        # Save convoy to DB anyway, but flag the failed log (fail-safe deployment)
        convoy_data.ipfsCid = ipfs_cid or "FAILED_UPLOAD"
        convoy_data.txHash = tx_hash or "FAILED_TRANSACTION"

        convoy_dict = convoy_data.model_dump(exclude_none=True)
        await db.convoys.insert_one(convoy_dict)

        # Re-raise HTTPException to notify the frontend of the failure
        raise HTTPException(
            status_code=500, 
            detail=f"Deployment initiated, but critical IPFS/Blockchain log failed: {e}. Check server logs."
        )


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
