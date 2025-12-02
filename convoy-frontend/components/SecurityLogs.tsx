// components/SecurityLogs.tsx
import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Lock, Terminal } from 'lucide-react';

interface SecurityLogsProps {
  logs: any[]; // Accept logs as a prop (using 'any' for logs array for simplicity)
}

const SecurityLogs: React.FC<SecurityLogsProps> = ({ logs }) => {
  // Use the logs passed in as a prop instead of the mock data array
  const displayLogs = logs;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-military-800 p-6 rounded-lg border border-military-700 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
             <Shield className="w-8 h-8 text-military-red" />
             SECURITY LOGS
           </h2>
           <p className="text-gray-400 text-sm font-mono mt-2">AUDIT TRAIL // CLASSIFIED LEVEL 5</p>
        </div>
        <div className="text-right">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/30 border border-emerald-500/30 rounded text-emerald-500 text-xs font-mono mb-1">
             <CheckCircle className="w-3 h-3" /> SYSTEM SECURE
           </div>
           {/* Display last scan time dynamically */}
           <p className="text-gray-500 text-xs font-mono">LAST SCAN: {new Date().toLocaleTimeString('en-US')}</p>
        </div>
      </div>

      <div className="bg-military-900 border border-military-700 rounded-lg overflow-hidden">
        <div className="p-3 bg-black border-b border-military-700 flex items-center gap-2 text-xs font-mono text-gray-500">
          <Terminal className="w-4 h-4" />
          <span>/var/log/sys_audit.log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-military-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event ID</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">User</th>
                <th className="p-4">Source IP</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-military-800 text-gray-300">
              {/* Map over the displayLogs prop */}
              {displayLogs.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-military-800/50 transition-colors">
                  <td className="p-4 text-emerald-500/80">{log.time}</td>
                  <td className="p-4">{log.id}</td>
                  <td className="p-4 font-bold">{log.event}</td>
                  <td className="p-4">{log.user}</td>
                  <td className="p-4">{log.ip}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                      log.status === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-500' :
                      log.status === 'WARNING' ? 'bg-amber-500/20 border-amber-500 text-amber-500' :
                      log.status === 'SUCCESS' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' :
                      'bg-blue-500/20 border-blue-500 text-blue-500'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayLogs.length === 0 && (
             <div className="p-4 text-center text-gray-600 font-mono">No security logs retrieved. Check backend connection.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-military-800 p-5 rounded border border-military-700">
           <h3 className="text-white text-sm font-bold uppercase mb-4 flex items-center gap-2">
             <Lock className="w-4 h-4 text-military-red" /> Encryption Status
           </h3>
           <div className="space-y-4">
             <div className="flex justify-between text-xs font-mono text-gray-400 border-b border-military-700 pb-2">
               <span>Algorithm</span>
               <span className="text-white">AES-256-GCM</span>
             </div>
             <div className="flex justify-between text-xs font-mono text-gray-400 border-b border-military-700 pb-2">
               <span>Key Rotation</span>
               <span className="text-emerald-500">AUTO (24H)</span>
             </div>
             <div className="flex justify-between text-xs font-mono text-gray-400">
               <span>Handshake</span>
               <span className="text-emerald-500">VERIFIED</span>
             </div>
           </div>
        </div>

        <div className="bg-military-800 p-5 rounded border border-military-700">
           <h3 className="text-white text-sm font-bold uppercase mb-4 flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-amber-500" /> Intrusion Detection
           </h3>
           <div className="flex items-center justify-center h-24">
              <div className="text-center">
                 {/* Count CRITICAL logs */}
                 <p className="text-3xl font-bold text-emerald-500 font-mono">
                    {displayLogs.filter(log => log.status === 'CRITICAL').length}
                 </p>
                 <p className="text-xs text-gray-500 uppercase mt-1">Active Threats</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;