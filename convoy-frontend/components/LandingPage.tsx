
import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center text-white">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
             backgroundSize: '30px 30px'
           }}>
      </div>
      
      {/* Red Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-military-red/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 text-center space-y-8 max-w-4xl px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-24 h-24 bg-military-red/10 border border-military-red rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <Shield className="w-12 h-12 text-military-red" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">
            AI Convoy <span className="text-military-red">Chain</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-mono tracking-widest uppercase mt-2">
            DEFENCE LOGISTICS SYSTEM
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="bg-military-900/50 backdrop-blur border border-military-700 p-8 rounded-lg max-w-lg mx-auto"
        >
          <div className="space-y-4 text-left font-mono text-sm text-gray-300 mb-8 border-l-2 border-military-red pl-4">
            <p>SYSTEM STATUS: <span className="text-emerald-500">ONLINE</span></p>
            <p>ENCRYPTION: <span className="text-emerald-500">AES-256 ACTIVE</span></p>
            <p>NETWORK: <span className="text-emerald-500">SECURE MESH DETECTED</span></p>
          </div>

          <button 
            onClick={onEnter}
            className="group w-full bg-transparent hover:bg-military-red border border-military-red text-military-red hover:text-white transition-all duration-300 py-4 px-8 rounded font-bold tracking-widest flex items-center justify-center gap-2"
          >
            INITIALIZE SEQUENCE
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em] font-mono">
          Restricted Access // Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
