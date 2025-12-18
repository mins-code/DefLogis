from fastapi import APIRouter, HTTPException, Request
from typing import List
from datetime import datetime
import random
from app.models import User, UserBase
from app.config import settings

router = APIRouter()

@router.post("/signup", status_code=201)
async def register_user(user_data: UserBase, request: Request):
    db = request.app.db
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

@router.post("/login", response_model=User)
async def login_user(user_data: UserBase, request: Request):
    db = request.app.db
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

@router.get("", response_model=List[User])
async def get_all_users(request: Request):
    db = request.app.db
    users_cursor = db.users.find({}, {'_id': 0})
    users = await users_cursor.to_list(100)
    return users
