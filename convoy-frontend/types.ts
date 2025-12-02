
export enum ConvoyStatus {
  MOVING = 'MOVING',
  DELAYED = 'DELAYED',
  REROUTING = 'REROUTING',
  SECURE = 'SECURE',
  AT_CHECKPOINT = 'AT_CHECKPOINT'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Convoy {
  id: string;
  name: string;
  startLocation: string;
  destination: string;
  status: ConvoyStatus;
  progress: number; // 0 to 100
  vehicleCount: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  eta: string;
  distance: string;
  analysis?: RouteAnalysis;
  ipfsCid?: string; // Content Identifier for IPFS file
  txHash?: string; // Transaction hash for blockchain log
}

export interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
  location?: string;
}

export interface RouteAnalysis {
  routeId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedDuration: string;
  checkpoints: string[];
  trafficCongestion: number; // 0-100 probability
  weatherImpact: string;
  strategicNote: string;
}

export type UserRole = 'COMMANDER' | 'LOGISTICS_OFFICER' | 'FIELD_AGENT';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  clearanceLevel: number;
}
