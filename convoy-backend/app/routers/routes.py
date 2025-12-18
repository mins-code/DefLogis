from fastapi import APIRouter, Query, HTTPException
from app.models import RouteAnalysis
from app.services.ai_service import analyze_route_service

router = APIRouter()

@router.post("/analyze", response_model=RouteAnalysis)
async def analyze_route(start: str = Query(...), end: str = Query(...), vehicleCount: int = Query(...)):
    return await analyze_route_service(start, end, vehicleCount)
