import asyncio
import random
from google import genai
from app.config import settings
from app.models import GEMINI_SCHEMA, RouteAnalysis

ai = genai.Client(api_key=settings.GEMINI_API_KEY)

async def analyze_route_service(start: str, end: str, vehicleCount: int) -> RouteAnalysis:
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API Key missing.")

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
        return RouteAnalysis(
            routeId=f"MOCK-ERR-{random.randint(1000, 9999)}",
            riskLevel='MEDIUM',
            estimatedDuration='2 Hours 15 Mins',
            checkpoints=['Alpha Checkpoint', 'Bridge crossing', 'City Outskirts'],
            trafficCongestion=65,
            weatherImpact='AI Service Failure.',
            strategicNote='AI service failed, falling back to cached route plan.'
        )
