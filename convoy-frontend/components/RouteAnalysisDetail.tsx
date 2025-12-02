import React from 'react';
import { RouteAnalysis } from '../types';
import { PlayCircle, ArrowRight, AlertTriangle, Database, Hash, ExternalLink } from 'lucide-react';

interface RouteAnalysisDetailProps {
  analysis: RouteAnalysis;
  start: string;
  end: string;
  onDeploy?: () => void;
  loading: boolean;
  // NEW: Explicitly accept these as optional props
  ipfsCid?: string;
  txHash?: string;
}

const RouteAnalysisDetail: React.FC<RouteAnalysisDetailProps> = ({ 
  analysis, 
  start, 
  end, 
  onDeploy, 
  loading,
  ipfsCid,    // Destructured new prop
  txHash      // Destructured new prop
}) => {
  return (
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
          <div
            className={`px-4 py-2 rounded font-bold font-mono border ${
              analysis.riskLevel === 'HIGH'
                ? 'bg-red-500/10 border-red-500 text-red-500'
                : analysis.riskLevel === 'MEDIUM'
                ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
            }`}
          >
            RISK: {analysis.riskLevel}
          </div>
          {onDeploy && (
            <button
              onClick={onDeploy}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 font-mono animate-pulse"
              disabled={loading}
            >
              <PlayCircle className="w-4 h-4" /> AUTHORIZE & DEPLOY
            </button>
          )}
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
              <p
                className={`text-xl font-mono ${
                  analysis.trafficCongestion > 50 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
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
          <h4 className="text-military-red text-sm font-bold mb-4 uppercase tracking-wider font-mono border-b border-military-700 pb-2">
            Checkpoint Sequence
          </h4>
          <ul className="space-y-4">
            {analysis.checkpoints.map((cp, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-military-red"></div>
                  {idx !== analysis.checkpoints.length - 1 && (
                    <div className="w-0.5 h-6 bg-military-700 my-1"></div>
                  )}
                </div>
                <span className="text-gray-300 font-mono text-sm">{cp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* BLOCKCHAIN & IPFS LOGS SECTION */}
      {(ipfsCid || txHash) && (
        <div className="mt-6 bg-military-900/80 p-5 rounded border border-emerald-500/30 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Database className="w-16 h-16 text-emerald-500" />
          </div>

          <h4 className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4" /> Immutable Ledger Records
          </h4>
          
          <div className="space-y-4 relative z-10">
            {ipfsCid && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">IPFS Content ID (CID)</span>
                <code className="bg-black/50 p-2 rounded text-emerald-400 text-xs font-mono break-all border border-military-700 select-all">
                  {ipfsCid}
                </code>
              </div>
            )}
            
            {txHash && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Blockchain Transaction Hash</span>
                <code className="bg-black/50 p-2 rounded text-emerald-400 text-xs font-mono break-all border border-military-700 select-all">
                  {txHash}
                </code>
                <a 
                  href={`https://amoy.polygonscan.com/tx/${txHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1 uppercase font-bold tracking-wider"
                >
                  Verify on PolygonScan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteAnalysisDetail;