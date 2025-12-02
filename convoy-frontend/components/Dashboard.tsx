import React from 'react';
import { MOCK_ALERTS } from '../constants';
import { ConvoyStatus, Convoy } from '../types';
import TacticalMap from './TacticalMap';
import { Activity, AlertTriangle, Truck, Zap, Radio } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '0600', traffic: 20, speed: 60 },
  { time: '0800', traffic: 65, speed: 45 },
  { time: '1000', traffic: 80, speed: 30 },
  { time: '1200', traffic: 50, speed: 55 },
  { time: '1400', traffic: 40, speed: 65 },
  { time: '1600', traffic: 70, speed: 35 },
  { time: '1800', traffic: 90, speed: 20 },
];

interface DashboardProps {
  convoys: Convoy[];
}

const Dashboard: React.FC<DashboardProps> = ({ convoys }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
      
      {/* Left Column: Metrics & Alerts */}
      <div className="flex flex-col gap-6 lg:col-span-1 h-full overflow-y-auto pr-2">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-military-800 p-4 rounded border border-military-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest font-mono">Active Units</h3>
              <p className="text-3xl text-white font-bold mt-1 font-mono">{convoys.filter(c => c.status === ConvoyStatus.MOVING).length}</p>
              <p className="text-xs text-emerald-500 mt-2 font-mono flex items-center gap-1">
                 <Activity className="w-3 h-3" /> +2 En Route
              </p>
           </div>
           <div className="bg-military-800 p-4 rounded border border-military-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-12 h-12 text-military-red" />
              </div>
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest font-mono">Threat Level</h3>
              <p className="text-3xl text-military-red font-bold mt-1 font-mono">MODERATE</p>
              <p className="text-xs text-military-red/70 mt-2 font-mono">Sector 4 Congestion</p>
           </div>
        </div>

        {/* Live Alerts */}
        <div className="bg-military-800 rounded border border-military-700 flex-1 flex flex-col min-h-[300px]">
           <div className="p-4 border-b border-military-700 flex justify-between items-center bg-military-900/50">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-amber-500" />
                 Intel Feed
              </h3>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {MOCK_ALERTS.map(alert => (
                <div key={alert.id} className="p-3 bg-military-900/80 border-l-2 border-military-red rounded-r text-sm">
                   <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500 text-black' : 
                        alert.severity === 'WARNING' ? 'bg-amber-500 text-black' : 
                        'bg-blue-500 text-black'
                      }`}>{alert.severity}</span>
                      <span className="text-gray-500 text-xs font-mono">{alert.timestamp}</span>
                   </div>
                   <p className="text-gray-300 font-mono text-xs leading-relaxed">{alert.message}</p>
                   {alert.location && <p className="text-military-red/70 text-xs font-mono mt-1">LOC: {alert.location}</p>}
                </div>
              ))}
           </div>
        </div>

        {/* Efficiency Chart */}
        <div className="bg-military-800 p-4 rounded border border-military-700 h-64 flex flex-col">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest font-mono mb-4">Traffic vs Velocity</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="traffic" stroke="#ef4444" fillOpacity={1} fill="url(#colorTraffic)" />
                <Area type="monotone" dataKey="speed" stroke="#10b981" fillOpacity={1} fill="url(#colorSpeed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Center & Right Column: Map & Active Convoys */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full">
        {/* Map Area */}
        <div className="flex-1 min-h-[400px] relative rounded-lg overflow-hidden border border-military-700 shadow-2xl">
          <TacticalMap />
        </div>

        {/* Convoy Status Table */}
        <div className="h-64 bg-military-800 rounded border border-military-700 overflow-hidden flex flex-col">
          <div className="p-3 bg-military-900 border-b border-military-700 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm uppercase font-mono flex items-center gap-2">
               <Radio className="w-4 h-4 text-emerald-500" />
               Active Convoys Status
            </h3>
            <span className="text-xs text-gray-500 font-mono">SYNCING...</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm text-gray-400 font-mono">
              <thead className="bg-military-900/50 text-xs uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">ETA</th>
                  <th className="p-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-military-700">
                {convoys.map(convoy => (
                  <tr key={convoy.id} className="hover:bg-military-700/30 transition-colors">
                    <td className="p-3 text-white font-bold">{convoy.id}</td>
                    <td className="p-3">{convoy.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        convoy.status === ConvoyStatus.MOVING ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                        convoy.status === ConvoyStatus.DELAYED ? 'bg-red-500/10 border-red-500 text-red-500' :
                        'bg-amber-500/10 border-amber-500 text-amber-500'
                      }`}>
                        {convoy.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="w-24 h-2 bg-military-900 rounded-full overflow-hidden border border-military-700">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${convoy.progress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-3">{convoy.eta}</td>
                    <td className="p-3 text-xs">
                      <span className={convoy.priority === 'HIGH' ? 'text-military-red' : 'text-gray-400'}>
                        [{convoy.priority}]
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;