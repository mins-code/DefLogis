from fastapi import APIRouter, HTTPException, Request
from typing import List
import random
from datetime import datetime
from app.models import Convoy, DeployRequest
from app.services.blockchain_service import calculate_route_hash, log_cid_on_chain
from app.services.ipfs_service import upload_to_ipfs

router = APIRouter()

@router.post("/deploy", response_model=Convoy, status_code=201)
async def deploy_convoy(deploy_data: DeployRequest, request: Request):
    db = request.app.db
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

@router.get("", response_model=List[Convoy])
async def get_active_convoys(request: Request):
    db = request.app.db
    convoys_cursor = db.convoys.find({}, {'_id': 0})
    convoys = await convoys_cursor.to_list(100)

    for convoy in convoys:
        if convoy.get('status') == 'MOVING':
             convoy['progress'] = min(99, convoy.get('progress', 0) + random.randint(1, 3))
             await db.convoys.update_one({'id': convoy['id']}, {'$set': {'progress': convoy['progress']}})

    return convoys
