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
import hashlib 

# 1. Load Environment Variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_NAME = "deflogis" 

# --- IPFS (Pinata) CONFIGURATION (JWT) ---
PINATA_JWT = os.getenv("PINATA_JWT")

# --- ETHEREUM/BLOCKCHAIN CONFIGURATION ---
ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# --- DEBUG: CHECK CONFIGURATION ON STARTUP ---
print("--- CONFIGURATION CHECK ---")
print(f"Pinata JWT Loaded: {'Yes' if PINATA_JWT else 'No'}")
print(f"RPC URL Found: {'Yes' if ETHEREUM_RPC_URL else 'No'}")
if ETHEREUM_RPC_URL:
    print(f"RPC URL Start: {ETHEREUM_RPC_URL[:8]}...") # Should be https://
print(f"Contract Address: {CONTRACT_ADDRESS}")
print("---------------------------")

# 2. Initialize FastAPI and Database/AI Clients
app = FastAPI(title="DefLogis AI Convoy API")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
ai = genai.Client(api_key=GEMINI_API_KEY)

# 3. Configure CORS
origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://def-logis.vercel.app",
    "https://deflogis.onrender.com" # Added self just in case
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Pydantic Models
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
    analysis: Optional[RouteAnalysis] = None

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

# Gemini Schema
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
            print("SUCCESS: Web3 connected and contract initialized.")
        else:
            print("ERROR: Web3 failed to connect to RPC URL.")
    else:
        print("WARNING: Blockchain skipped (Missing RPC URL or Contract Address).")
except Exception as e:
    print(f"CRITICAL: Error initializing Web3: {e}")
    

# --- Utility Functions for IPFS & Blockchain ---

def calculate_route_hash(analysis: RouteAnalysis) -> str:
    analysis_json = json.dumps(
        analysis.model_dump(exclude_none=True), 
        sort_keys=True,
        indent=None,
        separators=(',', ':')
    )
    return hashlib.sha256(analysis_json.encode('utf-8')).hexdigest()

async def upload_to_ipfs(convoy_id: str, analysis: RouteAnalysis) -> str:
    """Uploads RouteAnalysis JSON to Pinata via asyncio.to_thread using JWT."""
    if not PINATA_JWT:
        print("Pinata Upload Failed: PINATA_JWT is missing in env.")
        raise ValueError("Pinata JWT is missing.")

    data = {
        'routeId': analysis.routeId,
        'convoyId': convoy_id,
        'timestamp': datetime.now().isoformat(),
        'analysis': analysis.model_dump()
    }
    
    def sync_upload():
        url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        headers = {
            'Authorization': f'Bearer {PINATA_JWT}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if not response.ok:
            print(f"Pinata API Error: {response.status_code} - {response.text}")
            response.raise_for_status()
            
        return response.json()['IpfsHash']

    return await asyncio.to_thread(sync_upload)

async def log_cid_on_chain(convoy_id: str, ipfs_cid: str, route_hash: str) -> str:
    if not w3 or not contract_instance or not PRIVATE_KEY:
        print("Blockchain Log Failed: Web3/Contract/Key not ready.")
        raise ValueError("Web3 connection/contract/private key is missing.")

    def sync_send_transaction():
        account = w3.eth.account.from_key(PRIVATE_KEY)
        sender_address = account.address

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

        signed_txn = w3.eth.account.sign_transaction(transaction, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if tx_receipt.status != 1:
            raise Exception("Blockchain transaction failed to confirm.")
            
        return tx_hash.hex()
        
    return await asyncio.to_thread(sync_send_transaction)


# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Backend Online", "service": "DefLogis API", "web3_connected": w3.is_connected() if w3 else False}

@app.post("/api/users/signup", status_code=201)
async def register_user(user_data: UserBase):
    existing_user = await db.users.find_one({"id": user_data.id})
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID already registered.")
    
    clearance = 0
    if user_data.role == 'COMMANDER': clearance = 5
    elif user_data.role == 'LOGISTICS_OFFICER': clearance = 3
    elif user_data.role == 'FIELD_AGENT': clearance = 1
        
    user_to_save = User(
        id=user_data.id,
        name=user_data.name,
        role=user_data.role,
        clearanceLevel=clearance
    )
    
    await db.users.insert_one(user_to_save.model_dump())
    
    log_entry = {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "event": "USER_REGISTERED",
        "user": user_to_save.id,
        "ip": "127.0.0.1",
        "status": "INFO"
    }
    await db.security_logs.insert_one(log_entry)
    return {"message": "User registered successfully", "user": user_to_save.model_dump(exclude=['clearanceLevel'])}

@app.post("/api/users/login", response_model=User)
async def login_user(user_data: UserBase):
    user_record = await db.users.find_one({"id": user_data.id, "role": user_data.role})

    if not user_record:
        user_id_exists = await db.users.find_one({"id": user_data.id})
        if user_id_exists:
             raise HTTPException(status_code=401, detail="Invalid Role for this ID.")
        else:
             raise HTTPException(status_code=404, detail="User ID not found.")

    log_entry = {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "event": "USER_LOGIN",
        "user": user_data.id,
        "ip": "127.0.0.1",
        "status": "SUCCESS"
    }
    await db.security_logs.insert_one(log_entry)

    user_record.pop('_id', None)
    return User.model_validate(user_record)

@app.get("/api/users", response_model=List[User])
async def get_all_users():
    users_cursor = db.users.find({}, {'_id': 0})
    users = await users_cursor.to_list(100)
    return users

@app.post("/api/routes/analyze", response_model=RouteAnalysis)
async def analyze_route(start: str = Query(...), end: str = Query(...), vehicleCount: int = Query(...)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API Key missing.")

    prompt = f"""
      Act as a military logistics AI component of the "Code Red" system.
      Analyze a convoy movement from "{start}" to "{end}" with {vehicleCount} vehicles.
      Consider: Potential civilian traffic bottlenecks, strategic risk assessment, and weather impacts.
      Output a structured JSON response.
    """

    try:
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
        
        # 4. Save Convoy
        convoy_data.analysis = analysis_data
        convoy_dict = convoy_data.model_dump(exclude_none=True)
        await db.convoys.insert_one(convoy_dict)
        
        # 5. Log Success
        log_entry = {
            "id": f"LOG-BC-{random.randint(1000, 9999)}",
            "time": datetime.now().strftime("%H:%M:%S"),
            "event": "CONVOY_DEPLOYED_BC", 
            "user": "API_COMMANDER",
            "ip": "127.0.0.1",
            "status": "SUCCESS"
        }
        await db.security_logs.insert_one(log_entry)
        
        return convoy_data
        
    except Exception as e:
        print(f"DEPLOYMENT ERROR: {e}")
        
        # Log Failure
        error_log_entry = {
            "id": f"LOG-FAIL-{random.randint(1000, 9999)}",
            "time": datetime.now().strftime("%H:%M:%S"),
            "event": "BC_LOG_FAILURE", 
            "user": "SYSTEM_BOT",
            "ip": "N/A",
            "status": "CRITICAL"
        }
        await db.security_logs.insert_one(error_log_entry)
        
        # Fail-safe save
        convoy_data.ipfsCid = ipfs_cid or "FAILED_UPLOAD"
        convoy_data.txHash = tx_hash or "FAILED_TRANSACTION"
        convoy_data.analysis = analysis_data 

        convoy_dict = convoy_data.model_dump(exclude_none=True)
        await db.convoys.insert_one(convoy_dict)

        # Raise error to frontend so user knows logs failed
        raise HTTPException(
            status_code=500, 
            detail=f"Deployment initiated, but critical IPFS/Blockchain log failed: {e}"
        )

@app.get("/api/convoys", response_model=List[Convoy])
async def get_active_convoys():
    convoys_cursor = db.convoys.find({}, {'_id': 0})
    convoys = await convoys_cursor.to_list(100)
    
    for convoy in convoys:
        if convoy.get('status') == 'MOVING':
             convoy['progress'] = min(99, convoy.get('progress', 0) + random.randint(1, 3))
             await db.convoys.update_one({'id': convoy['id']}, {'$set': {'progress': convoy['progress']}})
             
    return convoys

@app.get("/api/logs/security", response_model=List[SecurityLog])
async def get_security_logs():
    logs_cursor = db.security_logs.find({}, {'_id': 0}).sort("time", -1)
    logs = await logs_cursor.to_list(50) 
    return logs