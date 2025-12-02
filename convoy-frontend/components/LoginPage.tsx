
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Lock, Scan, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('COMMANDER');
  const [id, setId] = useState('CMD-8921');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      onLogin({
        id: id,
        name: role === 'COMMANDER' ? 'Atul Naik' : 'Logistics Officer',
        role: role,
        clearanceLevel: role === 'COMMANDER' ? 5 : 3
      });
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-military-900 border border-military-700 rounded-lg shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-military-800 p-6 border-b border-military-700 text-center">
          <div className="mx-auto w-12 h-12 bg-military-900 rounded-full flex items-center justify-center border border-military-700 mb-3">
             <Lock className="w-6 h-6 text-military-red" />
          </div>
          <h2 className="text-xl font-bold text-white font-mono tracking-wider">SECURITY CLEARANCE</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">IDENTITY VERIFICATION REQUIRED</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-mono uppercase">Personnel ID</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-black border border-military-700 text-white p-3 rounded focus:border-military-red focus:outline-none font-mono tracking-widest"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-mono uppercase">Role Designation</label>
            <div className="grid grid-cols-1 gap-2">
              {(['COMMANDER', 'LOGISTICS_OFFICER', 'FIELD_AGENT'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 border rounded text-xs font-mono font-bold text-left transition-all flex items-center gap-3 ${
                    role === r 
                      ? 'bg-military-red text-white border-military-red' 
                      : 'bg-transparent border-military-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-mono uppercase tracking-widest mt-4"
          >
            {loading ? (
              <>
                <Scan className="w-5 h-5 animate-spin" /> VERIFYING...
              </>
            ) : (
              'ACCESS DASHBOARD'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-black p-4 text-center border-t border-military-800">
           <p className="text-[10px] text-military-red/50 font-mono">
             UNAUTHORIZED ACCESS IS A PUNISHABLE OFFENSE UNDER MILITARY ACT 404
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
