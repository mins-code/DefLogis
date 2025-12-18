from fastapi.testclient import TestClient
from app.main import app
from app.routers import routes
import pytest
from unittest.mock import MagicMock, AsyncMock

client = TestClient(app)

# Mock DB
@pytest.fixture(autouse=True)
def mock_db_fixture():
    app.db = MagicMock()
    app.db.users = AsyncMock()
    app.db.users.find_one = AsyncMock(return_value=None)
    app.db.users.insert_one = AsyncMock()

    app.db.security_logs = AsyncMock()
    app.db.security_logs.insert_one = AsyncMock()
    app.db.security_logs.find.return_value.sort.return_value.to_list = AsyncMock(return_value=[])

    app.db.convoys = AsyncMock()
    app.db.convoys.insert_one = AsyncMock()
    app.db.convoys.find.return_value.to_list = AsyncMock(return_value=[])

    return app.db

# Mock AI Service
@pytest.fixture(autouse=True)
def mock_ai_service(monkeypatch):
    async def mock_analyze(*args, **kwargs):
        from app.models import RouteAnalysis
        return RouteAnalysis(
            routeId="TEST-ROUTE",
            riskLevel="LOW",
            estimatedDuration="1h",
            checkpoints=["A", "B"],
            trafficCongestion=10,
            weatherImpact="Clear",
            strategicNote="None"
        )
    # Patch the function where it is imported in the router
    monkeypatch.setattr(routes, "analyze_route_service", mock_analyze)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Backend Online"

def test_register_user():
    response = client.post("/api/users/signup", json={
        "id": "test_user",
        "name": "Test User",
        "role": "COMMANDER"
    })
    assert response.status_code == 201
    assert response.json()["user"]["id"] == "test_user"

def test_analyze_route():
    response = client.post("/api/routes/analyze?start=A&end=B&vehicleCount=5")
    assert response.status_code == 200
    assert response.json()["routeId"] == "TEST-ROUTE"
