import React, { useState } from 'react';
import { RouteAnalysis, Convoy, ConvoyStatus } from '../types';
import { analyzeRouteWithAI } from '../services/geminiService';
import RouteAnalysisDetail from './RouteAnalysisDetail';
import { Loader2, Map, ArrowRight } from 'lucide-react';

const API_BASE_URL = 'https://deflogis.onrender.com/api';

interface RoutePlannerProps {
  onAddConvoy: (convoy: Convoy) => void;
  convoys: Convoy[];
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ onAddConvoy, convoys }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [vehicleCount, setVehicleCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [newAnalysis, setNewAnalysis] = useState<RouteAnalysis | null>(null);
  const [selectedConvoy, setSelectedConvoy] = useState<Convoy | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;

    setLoading(true);
    try {
      const result = await analyzeRouteWithAI(start, end, vehicleCount);
      setNewAnalysis(result);
      setSelectedConvoy(null);
    } catch (error) {
      console.error('Error during route analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!newAnalysis || !start || !end) return;

    setLoading(true);

    const newConvoy: Convoy = {
      id: `CV-${Math.floor(Math.random() * 9000) + 1000}`, // Fixed string interpolation
      name: `Unit ${start.substring(0, 3).toUpperCase()}-${end.substring(0, 3).toUpperCase()}`, // Fixed string interpolation
      startLocation: start,
      destination: end,
      status: ConvoyStatus.MOVING,
      progress: 0,
      vehicleCount: vehicleCount,
      priority: newAnalysis.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
      eta: newAnalysis.estimatedDuration,
      distance: 'Calculating...',
      analysis: newAnalysis,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/convoys/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          convoy: newConvoy,
          analysis: newAnalysis,
        }),
      });

      if (response.ok) {
        const savedConvoy = await response.json();
        onAddConvoy(savedConvoy);
        handleClearView();
        alert(`Mission Authorized. Convoy ${savedConvoy.id} Deployed.`);
      } else {
        const errorData = await response.json();
        console.error('Backend Error Details:', errorData);
        alert(`Deployment Failed: ${errorData.detail || 'Unknown Server Error'}`);
      }
    } catch (error) {
      console.error('Deployment network error:', error);
      alert('Network Error: Could not reach deployment server.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearView = () => {
    setNewAnalysis(null);
    setSelectedConvoy(null);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Column: Convoy List */}
      <div className="lg:w-1/3 flex flex-col gap-4">
        <div className="bg-military-800 p-4 rounded border border-military-700">
          <h2 className="text-white font-bold text-sm uppercase font-mono mb-4">Deployed Convoys</h2>
          <div className="space-y-2">
            {convoys.map((convoy) => (
              <button
                key={convoy.id}
                onClick={() => {
                  setSelectedConvoy(convoy);
                  setNewAnalysis(null);
                }}
                className={`w-full text-left p-4 rounded border transition-all ${
                  selectedConvoy?.id === convoy.id
                    ? 'bg-military-700 border-military-red shadow-[inset_2px_0_0_0_#ef4444]'
                    : 'bg-military-900/50 border-military-700 hover:bg-military-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-white font-mono">{convoy.id}</span>
                  <span className="text-gray-400 text-xs">{convoy.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <ArrowRight className="w-3 h-3" />
                  {convoy.startLocation} → {convoy.destination}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Analysis Form and Details */}
      <div className="lg:w-2/3 flex flex-col gap-4">
        {/* Analysis Request Form */}
        <div className="bg-military-800 p-6 rounded-lg border border-military-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
              <Map className="w-5 h-5 text-military-red" />
              Route Optimization Request
            </h2>
            <button
              onClick={handleClearView}
              className="text-sm text-gray-400 hover:text-white transition-colors font-mono"
            >
              Clear View
            </button>
          </div>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initiate Analysis'}
              </button>
            </div>
          </form>
        </div>

        {/* Analysis Details */}
        {selectedConvoy?.analysis || newAnalysis ? (
          <RouteAnalysisDetail
            analysis={selectedConvoy?.analysis || newAnalysis!}
            start={selectedConvoy?.startLocation || start}
            end={selectedConvoy?.destination || end}
            onDeploy={selectedConvoy ? undefined : handleDeploy}
            loading={loading}
          />
        ) : (
          <div className="flex-1 bg-military-800 p-6 rounded-lg border border-military-700 flex items-center justify-center text-gray-400 font-mono">
            Select a deployed convoy or run a new route analysis.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePlanner;