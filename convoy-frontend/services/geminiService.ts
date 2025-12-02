// services/geminiService.ts
import { RouteAnalysis } from '../types';

// IMPORTANT: This URL must match the address where your Python FastAPI server is running
const API_BASE_URL = 'https://deflogis.onrender.com/api'; 

export const analyzeRouteWithAI = async (
  start: string,
  end: string,
  vehicleCount: number
): Promise<RouteAnalysis> => {
  try {
    // Send request with query parameters
    const url = `${API_BASE_URL}/routes/analyze?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&vehicleCount=${vehicleCount}`;
    
    const response = await fetch(url, {
      method: 'POST', // Use POST method as defined in main.py
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
        // Catch any error returned by the backend
        const errorDetail = await response.json();
        throw new Error(`Backend Error: ${errorDetail.detail || response.statusText}`);
    }

    const data = await response.json();
    return data as RouteAnalysis;

  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback logic for when the backend is unreachable or returns an error
    return {
      routeId: `CONN-ERR-${Math.floor(Math.random() * 1000)}`,
      riskLevel: 'LOW',
      estimatedDuration: 'N/A',
      checkpoints: ['Connection Failed'],
      trafficCongestion: 0,
      weatherImpact: 'Check FastAPI server (convoy-backend) status.',
      strategicNote: 'Failed to communicate with the AI Routing API. Please verify server connection.'
    };
  }
};