import React, { useState } from 'react';
import { RouteAnalysis, Convoy, ConvoyStatus } from '../types';
import { analyzeRouteWithAI } from '../services/geminiService';
import { Loader2, ShieldCheck, AlertTriangle, Map, ArrowRight, PlayCircle } from 'lucide-react';

// Added API Base URL
const API_BASE_URL = 'https://deflogis.onrender.com/api'; 

interface RoutePlannerProps {
  onAddConvoy: (convoy: Convoy) => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ onAddConvoy }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [vehicleCount, setVehicleCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;

    setLoading(true);
    // analyzeRouteWithAI now calls the FastAPI backend
    const result = await analyzeRouteWithAI(start, end, vehicleCount);
    setAnalysis(result);
    setLoading(false);
  };

  const handleDeploy = async () => { // Made async
    if (!analysis) return;

    const newConvoy: Convoy = {
      id: analysis.routeId || `CV-${Math.floor(Math.random()*1000)}`,
      name: `UNIT ${start.substring(0,3).toUpperCase()}-${end.substring(0,3).toUpperCase()}`,
      startLocation: start,
      destination: end,
      status: ConvoyStatus.MOVING,
      progress: 0,
      vehicleCount: vehicleCount,
      priority: analysis.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
      eta: analysis.estimatedDuration,
      distance: 'Calculating...' 
    };

    // --- NEW BACKEND CALL to Deploy ---
    try {
        setLoading(true); // Optional: Re-use loading state for deployment
        const response = await fetch(`${API_BASE_URL}/convoys/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConvoy)
        });

        if (!response.ok) {
            throw new Error('Deployment failed on server.');
        }
        
        // Update local state (in App.tsx) after successful deployment
        onAddConvoy(newConvoy); 
    } catch (error) {
        console.error("Failed to deploy convoy:", error);
        alert("DEPLOYMENT FAILED. Check backend server and connection.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="bg-military-800 p-6 rounded-lg border border-military-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
          <Map className="w-5 h-5 text-military-red" />
          ROUTE OPTIMIZATION REQUEST
        </h2>
        <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-mono">Start Point</label>
            <input 
              type="text" 
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="e.g. Base Alpha"
              className="bg-military-900 border border-military-700 text-white p-2 rounded focus:border-military-red focus:outline-none font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-mono">Destination</label>
            <input 
              type="text" 
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="e.g. Outpost 9"
              className="bg-military-900 border border-military-700 text-white p-2 rounded focus:border-military-red focus:outline-none font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-mono">Convoy Size</label>
            <input 
              type="number" 
              value={vehicleCount}
              onChange={(e) => setVehicleCount(Number(e.target.value))}
              className="bg-military-900 border border-military-700 text-white p-2 rounded focus:border-military-red focus:outline-none font-mono"
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-military-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded border border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 font-mono"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'INITIATE ANALYSIS'}
            </button>
          </div>
        </form>
      </div>

      {analysis && (
        <div className="flex-1 bg-military-800 p-6 rounded-lg border border-military-700 animate-in fade-in slide-in-from-bottom-4 flex flex-col">
          <div className="flex justify-between items-start mb-6 border-b border-military-700 pb-4">
             <div>
               <h3 className="text-lg font-bold text-white font-mono">ANALYSIS RESULT: {analysis.routeId}</h3>
               <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <span>{start}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{end}</span>
               </div>
             </div>
             <div className="flex gap-4 items-center">
               <div className={`px-4 py-2 rounded font-bold font-mono border ${
                 analysis.riskLevel === 'HIGH' ? 'bg-red-500/10 border-red-500 text-red-500' :
                 analysis.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500 text-amber-500' :
                 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
               }`}>
                 RISK: {analysis.riskLevel}
               </div>
               
               <button 
                 onClick={handleDeploy}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 font-mono animate-pulse"
                 disabled={loading} // Added disabled prop
               >
                 <PlayCircle className="w-4 h-4" /> AUTHORIZE & DEPLOY
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-military-900 p-4 rounded border border-military-700">
                 <h4 className="text-military-red text-sm font-bold mb-2 uppercase tracking-wider font-mono">Strategic Assessment</h4>
                 <p className="text-gray-300 leading-relaxed font-mono text-sm">{analysis.strategicNote}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-military-900 p-4 rounded border border-military-700">
                  <h4 className="text-gray-400 text-xs font-bold mb-1 uppercase">Est. Duration</h4>
                  <p className="text-xl text-white font-mono">{analysis.estimatedDuration}</p>
                </div>
                <div className="bg-military-900 p-4 rounded border border-military-700">
                  <h4 className="text-gray-400 text-xs font-bold mb-1 uppercase">Congestion Prob.</h4>
                  <p className={`text-xl font-mono ${analysis.trafficCongestion > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {analysis.trafficCongestion}%
                  </p>
                </div>
              </div>

              <div className="bg-military-900 p-4 rounded border border-military-700">
                <h4 className="text-gray-400 text-xs font-bold mb-2 uppercase">Weather Impact</h4>
                <div className="flex items-center gap-2 text-gray-300">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-mono">{analysis.weatherImpact}</span>
                </div>
              </div>
            </div>

            <div className="bg-military-900 p-4 rounded border border-military-700 h-full">
              <h4 className="text-military-red text-sm font-bold mb-4 uppercase tracking-wider font-mono border-b border-military-700 pb-2">Checkpoint Sequence</h4>
              <ul className="space-y-4">
                {analysis.checkpoints.map((cp, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-military-red"></div>
                      {idx !== analysis.checkpoints.length - 1 && <div className="w-0.5 h-6 bg-military-700 my-1"></div>}
                    </div>
                    <span className="text-gray-300 font-mono text-sm">{cp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePlanner;