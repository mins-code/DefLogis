
import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Database, Wifi, Bell, Shield, Radio } from 'lucide-react';

const SystemConfig: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    lowBandwidth: false,
    encryptionLevel: 'HIGH',
    satelliteSync: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
          <Settings className="w-8 h-8 text-military-red" />
          SYSTEM CONFIGURATION
        </h2>
        <p className="text-gray-400 text-sm font-mono mt-2">GLOBAL PARAMETERS // ADMIN ACCESS REQUIRED</p>
      </div>

      <div className="space-y-6">
        {/* Network Section */}
        <section className="bg-military-800 rounded border border-military-700 overflow-hidden">
           <div className="p-4 bg-military-900/50 border-b border-military-700 flex items-center gap-2">
             <Wifi className="w-4 h-4 text-emerald-500" />
             <h3 className="text-white font-bold text-sm uppercase font-mono">Network & Connectivity</h3>
           </div>
           <div className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-white font-bold text-sm font-mono">Satellite Uplink Sync</p>
                   <p className="text-gray-500 text-xs mt-1">Enable real-time synchronization with orbital assets.</p>
                </div>
                <button 
                  onClick={() => toggle('satelliteSync')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.satelliteSync ? 'bg-emerald-600' : 'bg-military-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.satelliteSync ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
             </div>
             
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-white font-bold text-sm font-mono">Low Bandwidth Mode</p>
                   <p className="text-gray-500 text-xs mt-1">Optimize data packets for congested networks (Mesh fallback).</p>
                </div>
                <button 
                  onClick={() => toggle('lowBandwidth')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.lowBandwidth ? 'bg-emerald-600' : 'bg-military-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.lowBandwidth ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
             </div>
           </div>
        </section>

        {/* Security Section */}
        <section className="bg-military-800 rounded border border-military-700 overflow-hidden">
           <div className="p-4 bg-military-900/50 border-b border-military-700 flex items-center gap-2">
             <Shield className="w-4 h-4 text-military-red" />
             <h3 className="text-white font-bold text-sm uppercase font-mono">Security Protocols</h3>
           </div>
           <div className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-white font-bold text-sm font-mono">Encryption Standard</p>
                   <p className="text-gray-500 text-xs mt-1">Current active cipher suite for data transmission.</p>
                </div>
                <div className="flex gap-2">
                  {['STD', 'HIGH', 'MIL-SPEC'].map(level => (
                    <button 
                      key={level}
                      className={`px-3 py-1 text-xs font-mono border rounded ${
                         settings.encryptionLevel === level 
                           ? 'bg-military-red text-white border-military-red' 
                           : 'bg-transparent text-gray-500 border-military-700'
                      }`}
                      onClick={() => setSettings(prev => ({...prev, encryptionLevel: level}))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
             </div>
           </div>
        </section>

        {/* System Section */}
        <section className="bg-military-800 rounded border border-military-700 overflow-hidden">
           <div className="p-4 bg-military-900/50 border-b border-military-700 flex items-center gap-2">
             <Database className="w-4 h-4 text-blue-500" />
             <h3 className="text-white font-bold text-sm uppercase font-mono">System Preferences</h3>
           </div>
           <div className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-white font-bold text-sm font-mono">Auto-Refresh Dashboard</p>
                   <p className="text-gray-500 text-xs mt-1">Refresh telemetry data every 30 seconds.</p>
                </div>
                <button 
                  onClick={() => toggle('autoRefresh')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoRefresh ? 'bg-emerald-600' : 'bg-military-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoRefresh ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div>
                   <p className="text-white font-bold text-sm font-mono">Push Notifications</p>
                   <p className="text-gray-500 text-xs mt-1">Receive alerts for CRITICAL events.</p>
                </div>
                <button 
                  onClick={() => toggle('notifications')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifications ? 'bg-emerald-600' : 'bg-military-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
             </div>
           </div>
        </section>

        <div className="flex justify-end gap-4 pt-4">
           <button className="px-6 py-2 bg-transparent text-gray-400 border border-military-700 rounded hover:text-white font-mono text-sm flex items-center gap-2">
             <RefreshCw className="w-4 h-4" /> RESET DEFAULTS
           </button>
           <button className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-mono text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
             <Save className="w-4 h-4" /> SAVE CHANGES
           </button>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
