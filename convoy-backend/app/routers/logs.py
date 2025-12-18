from fastapi import APIRouter, Request
from typing import List
from app.models import SecurityLog

router = APIRouter()

@router.get("/security", response_model=List[SecurityLog])
async def get_security_logs(request: Request):
    db = request.app.db
    logs_cursor = db.security_logs.find({}, {'_id': 0}).sort("time", -1)
    logs = await logs_cursor.to_list(50)
    return logs
