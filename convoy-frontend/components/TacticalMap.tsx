import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TacticalMap: React.FC = () => {
  const [nodes, setNodes] = useState<{id: number, x: number, y: number}[]>([]);

  useEffect(() => {
    // Generate random nodes for the grid
    const newNodes = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    setNodes(newNodes);
  }, []);

  return (
    <div className="relative w-full h-full bg-military-900 overflow-hidden rounded-lg border border-military-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      {/* Grid Background */}
      <div className="absolute inset-0" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.5) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite] origin-center opacity-20 pointer-events-none">
        <div className="w-full h-1/2 bg-gradient-to-r from-transparent via-military-accent/20 to-transparent border-b border-military-accent/50 blur-sm"></div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Connections */}
        {nodes.map((node, i) => (
          nodes.map((target, j) => {
            if (i < j && Math.random() > 0.85) {
               return (
                 <motion.line
                   key={`${i}-${j}`}
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ pathLength: 1, opacity: 0.3 }}
                   transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                   x1={`${node.x}%`} y1={`${node.y}%`}
                   x2={`${target.x}%`} y2={`${target.y}%`}
                   stroke="#94a3b8"
                   strokeWidth="1"
                 />
               )
            }
            return null;
          })
        ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
             <circle cx={`${node.x}%`} cy={`${node.y}%`} r="3" fill="#ef4444" className="animate-pulse" />
             <text x={`${node.x}%`} y={`${node.y}%`} dx="8" dy="4" fill="#64748b" fontSize="10" fontFamily="monospace">CP-{node.id}</text>
          </g>
        ))}
      </svg>
      
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur border border-military-700 p-2 text-xs font-mono text-military-red">
        LIVE FEED // TACTICAL GRID
        <br />
        <span className="text-white">SAT-LINK: CONNECTED</span>
      </div>
    </div>
  );
};

export default TacticalMap;
