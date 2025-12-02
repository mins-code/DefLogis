// components/LoginPage.tsx
import React, { useState } from 'react';
import { User, UserRole } from '../types';
// Note: AlertTriangle needs to be imported for error messages
import { Shield, Lock, Scan, UserCheck, AlertTriangle } from 'lucide-react';

// Added API Base URL
const API_BASE_URL = 'https://deflogis.onrender.com/api'; 

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('COMMANDER');
  const [id, setId] = useState('CMD-8921');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for API error messages
  const [showRegister, setShowRegister] = useState(false); // State to switch mode

  // Simple function to derive the user's name based on a convention
  const deriveName = (r: UserRole) => {
      switch (r) {
          case 'COMMANDER': return 'Atul Naik';
          case 'LOGISTICS_OFFICER': return 'Logistics Officer';
          case 'FIELD_AGENT': return 'Field Agent';
          default: return 'User';
      }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !role) return;

    setLoading(true);
    setError(null);

    const endpoint = showRegister ? 'signup' : 'login';
    const payload = { 
        id: id, 
        role: role, 
        // We pass the derived name for storage during signup and consistent payload
        name: deriveName(role) 
    };

    try {
        const url = `${API_BASE_URL}/users/${endpoint}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle HTTP errors (e.g., 400, 401, 404 from the backend)
            setError(data.detail || `Authentication failed with status ${response.status}`);
            return;
        }

        if (showRegister) {
            // Successfully signed up
            alert("Registration successful! Please log in.");
            setShowRegister(false); // Switch back to login view
            setId(payload.id); // Keep the ID for immediate login attempt
        } else {
            // Successfully logged in. The backend returns the full User object.
            onLogin(data as User);
        }

    } catch (err) {
        console.error("Auth API call failed:", err);
        setError("Network Error: Could not reach the authentication server. Please check FastAPI server status.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-military-900 border border-military-700 rounded-lg shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-military-800 p-6 border-b border-military-700 text-center">
          <div className="mx-auto w-12 h-12 bg-military-900 rounded-full flex items-center justify-center border border-military-700 mb-3">
             <Lock className="w-6 h-6 text-military-red" />
          </div>
          <h2 className="text-xl font-bold text-white font-mono tracking-wider">{showRegister ? 'USER REGISTRATION' : 'SECURITY CLEARANCE'}</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">{showRegister ? 'CREATE NEW PERSONNEL FILE' : 'IDENTITY VERIFICATION REQUIRED'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-mono uppercase">Personnel ID</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={showRegister ? 'e.g., LOG-005' : 'e.g., CMD-8921'}
              className="w-full bg-black border border-military-700 text-white p-3 rounded focus:border-military-red focus:outline-none font-mono tracking-widest"
              required
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
          
          {/* NEW: Error Display */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 text-red-400 text-xs font-mono rounded flex items-center">
                <AlertTriangle className="w-3 h-3 inline mr-2 shrink-0" />
                {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="cursor-target w-full bg-white text-black font-bold py-4 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-mono uppercase tracking-widest mt-4"
          >
            {loading ? (
              <>
                <Scan className="w-5 h-5 animate-spin" /> {showRegister ? 'PROCESSING...' : 'VERIFYING...'}
              </>
            ) : (
              showRegister ? 'REGISTER PERSONNEL' : 'ACCESS DASHBOARD'
            )}
          </button>
        </form>
        
        {/* NEW: Switch Register/Login Mode */}
        <div className="p-4 text-center border-t border-military-800 bg-military-900/50">
           <button 
             onClick={() => { setShowRegister(prev => !prev); setError(null); }}
             className="text-xs text-blue-400 hover:text-blue-300 font-mono"
           >
             {showRegister ? 'Already registered? Log in.' : 'New user? Register here.'}
           </button>
        </div>

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
