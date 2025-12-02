
import { Convoy, ConvoyStatus, Alert } from './types';

export const MOCK_CONVOYS: Convoy[] = [
  {
    id: 'CV-ALPHA-01',
    name: 'Alpha Supply Unit',
    startLocation: 'Base HQ (Bangalore)',
    destination: 'Forward Post 4 (Mysore)',
    status: ConvoyStatus.MOVING,
    progress: 45,
    vehicleCount: 12,
    priority: 'HIGH',
    eta: '14:30 HRS',
    distance: '145 km'
  },
  {
    id: 'CV-BRAVO-09',
    name: 'Bravo Med Support',
    startLocation: 'Depot 7',
    destination: 'Base HQ',
    status: ConvoyStatus.DELAYED,
    progress: 78,
    vehicleCount: 4,
    priority: 'MEDIUM',
    eta: '16:00 HRS',
    distance: '88 km'
  },
  {
    id: 'CV-CHARLIE-22',
    name: 'Charlie Heavy Transport',
    startLocation: 'Sector 9',
    destination: 'Sector 1',
    status: ConvoyStatus.REROUTING,
    progress: 20,
    vehicleCount: 8,
    priority: 'HIGH',
    eta: 'UNKNOWN',
    distance: '210 km'
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    severity: 'CRITICAL',
    message: 'Civilian congestion detected on Route NH-44. Velocity drop > 40%.',
    timestamp: '10:02 HRS',
    location: 'Sector 4'
  },
  {
    id: 'ALT-002',
    severity: 'WARNING',
    message: 'Weather warning: Heavy rain predicted in Sector 2.',
    timestamp: '09:45 HRS'
  },
  {
    id: 'ALT-003',
    severity: 'INFO',
    message: 'CV-ALPHA-01 checked in at CP-2 securely.',
    timestamp: '09:30 HRS'
  }
];
