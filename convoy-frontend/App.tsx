// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import RoutePlanner from './components/RoutePlanner';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import LiveTracking from './components/LiveTracking';
import SecurityLogs from './components/SecurityLogs';
import SystemConfig from './components/SystemConfig';
import { LayoutDashboard, Map, Shield, Settings, Menu, X, Globe, LogOut } from 'lucide-react';
import { User, Convoy, Alert } from './types';
import { MOCK_CONVOYS } from './constants';

type ViewState = 'LANDING' | 'LOGIN' | 'APP';
type TabState = 'dashboard' | 'routes' | 'tracking' | 'logs' | 'config';

const API_BASE_URL = 'https://deflogis.onrender.com/api'; 
const MOCK_ALERTS: Alert[] = [{ id: 'SYS-000', severity: 'INFO', message: 'Backend connection established.', timestamp: 'NOW' }];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [activeTab, setActiveTab] = useState<TabState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Central State for Convoys and Logs (Fetched from MongoDB via FastAPI)
  const [convoys, setConvoys] = useState<Convoy[]>([]); // Initial state is empty
  const [securityLogs, setSecurityLogs] = useState<any[]>([]); 
  
  // Fetching Logic
  const fetchAllData = useCallback(async () => {
    try {
        // 1. Fetch Convoys
        const convoyRes = await fetch(`${API_BASE_URL}/convoys`);
        if (convoyRes.ok) {
            const fetchedConvoys = await convoyRes.json();
            setConvoys(fetchedConvoys);
        } else {
             console.warn("Failed to fetch convoys from API. Using mock data.");
             setConvoys(MOCK_CONVOYS); 
        }
        
        // 2. Fetch Security Logs
        const logsRes = await fetch(`${API_BASE_URL}/logs/security`);
        if (logsRes.ok) {
            const fetchedLogs = await logsRes.json();
            setSecurityLogs(fetchedLogs);
        }
        
    } catch (error) {
        console.error("Error connecting to backend API:", error);
        // Fallback to mock data if connection fails entirely
        setConvoys(MOCK_CONVOYS); 
        setSecurityLogs(MOCK_ALERTS); 
    }
  }, []);

  useEffect(() => {
      // Fetch initial data on load
      fetchAllData();
      
      // Set up auto-refresh for live data (30 seconds)
      const intervalId = setInterval(fetchAllData, 30000); 
      
      // Clear interval on component unmount
      return () => clearInterval(intervalId);
  }, [fetchAllData]); // Re-run effect if fetchAllData changes (it won't because of useCallback)

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('APP');
  };

  const handleLogout = () => {
    setUser(null);
    setView('LANDING');
    setActiveTab('dashboard');
  };

  const handleAddConvoy = (newConvoy: Convoy) => {
    // Add the new convoy to the local state immediately after deployment success
    setConvoys(prev => [newConvoy, ...prev]);
    setActiveTab('tracking'); // Switch to tracking to show the new convoy
  };

  // View Routing
  if (view === 'LANDING') {
    return <LandingPage onEnter={() => setView('LOGIN')} />;
  }

  if (view === 'LOGIN') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-military-900 border-r border-military-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-military-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">
              AI Convoy <span className="text-military-red">Chain</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">DEFENCE LOGISTICS SYSTEM</p>
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold tracking-wide transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-military-red text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'text-gray-400 hover:bg-military-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            COMMAND CENTER
          </button>
          
          <button 
            onClick={() => { setActiveTab('routes'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold tracking-wide transition-all ${
              activeTab === 'routes' 
                ? 'bg-military-red text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'text-gray-400 hover:bg-military-800 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            ROUTE OPS
          </button>

          <button 
            onClick={() => { setActiveTab('tracking'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold tracking-wide transition-all ${
              activeTab === 'tracking' 
                ? 'bg-military-red text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'text-gray-400 hover:bg-military-800 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            LIVE TRACKING
          </button>

          <div className="pt-4 border-t border-military-800 mt-4">
             <div className="px-4 py-2 text-xs text-gray-600 font-mono uppercase">System</div>
             
             {/* RBAC Example: Only Commander sees Security Logs */}
             {user?.role === 'COMMANDER' && (
               <button 
                 onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold tracking-wide transition-all ${
                    activeTab === 'logs' 
                      ? 'bg-military-red text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                      : 'text-gray-400 hover:bg-military-800 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  SECURITY LOGS
               </button>
             )}
             
             <button 
               onClick={() => { setActiveTab('config'); setSidebarOpen(false); }}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold tracking-wide transition-all ${
                  activeTab === 'config' 
                    ? 'bg-military-red text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                    : 'text-gray-400 hover:bg-military-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                CONFIG
             </button>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-military-800 bg-military-900">
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-military-700 flex items-center justify-center font-bold text-xs text-military-red border border-military-600">
                {user?.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-white truncate">{user?.name.toUpperCase()}</p>
                 <p className="text-[10px] text-gray-500 font-mono truncate">{user?.role.replace('_', ' ')}</p>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-500 hover:bg-red-950/30 rounded border border-transparent hover:border-red-900 transition-colors"
           >
             <LogOut className="w-3 h-3" /> LOGOUT
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-military-800 via-black to-black">
        {/* Mobile Header */}
        <header className="md:hidden p-4 border-b border-military-800 flex items-center justify-between bg-military-900 shrink-0">
           <h1 className="text-lg font-black italic text-white uppercase">AI Convoy <span className="text-military-red">Chain</span></h1>
           <button onClick={() => setSidebarOpen(true)} className="text-white">
             <Menu className="w-6 h-6" />
           </button>
        </header>

        {/* View Area - Changed from overflow-hidden to overflow-y-auto to allow scrolling */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-military-700 scrollbar-track-military-900">
          {activeTab === 'dashboard' && <Dashboard convoys={convoys} />}
          {activeTab === 'routes' && <RoutePlanner onAddConvoy={handleAddConvoy} />}
          {activeTab === 'tracking' && <LiveTracking convoys={convoys} />}
          {/* Pass logs state to SecurityLogs */}
          {activeTab === 'logs' && <SecurityLogs logs={securityLogs} />}
          {activeTab === 'config' && <SystemConfig />}
        </div>
      </main>
    </div>
  );
};

export default App;