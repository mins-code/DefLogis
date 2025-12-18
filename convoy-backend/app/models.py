from pydantic import BaseModel, Field
from typing import List, Optional
from google.genai import types

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
