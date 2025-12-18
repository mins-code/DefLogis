import asyncio
import requests
from datetime import datetime
from app.config import settings
from app.models import RouteAnalysis

async def upload_to_ipfs(convoy_id: str, analysis: RouteAnalysis) -> str:
    """Uploads RouteAnalysis JSON to Pinata via asyncio.to_thread using JWT."""
    if not settings.PINATA_JWT:
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
            'Authorization': f'Bearer {settings.PINATA_JWT}',
            'Content-Type': 'application/json'
        }

        response = requests.post(url, headers=headers, json=data)

        if not response.ok:
            print(f"Pinata API Error: {response.status_code} - {response.text}")
            response.raise_for_status()

        return response.json()['IpfsHash']

    return await asyncio.to_thread(sync_upload)
