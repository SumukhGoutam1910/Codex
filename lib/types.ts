export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'responder';
  address: string;
}

export interface Camera {
  id: string;
  userId: string;
  name: string;
  rtspUrl: string;
  location: string;
  fullAddress?: string;
  status: 'online' | 'offline';
  addedAt?: string;
  streamType?: 'mobile_camdroid' | 'ip_camera' | 'webcam';
  metadata?: {
    aiMonitoring?: boolean;
    monitoringStarted?: string;
    monitoringStopped?: string;
    lastDetection?: {
      timestamp: string;
      type: 'fire' | 'smoke';
      confidence: number;
    };
    detectionHistory?: Array<{
      timestamp: string;
      type: 'fire' | 'smoke';
      confidence: number;
      incidentId?: string;
    }>;
  };
}

export interface Incident {
  id: string;
  cameraId?: string;
  userId: string;
  userName?: string;
  type: 'fire' | 'smoke';
  confidence?: number;
  timestamp: string;
  address: string;
  location?: string;
  nearestStation: string;
  snapshot: string;
  status: 'pending' | 'pending_admin' | 'dispatched' | 'engaged' | 'resolved' | 'false_alarm';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  detectionMethod?: 'AI' | 'manual' | 'sensor';
  dispatchedTo?: string;
  dispatchedAt?: string;
  engagedAt?: string;
  resolvedAt?: string;
  aiMetadata?: {
    modelVersion: string;
    processingTime: number;
    boundingBoxes: Array<{x: number, y: number, width: number, height: number}>;
    classificationScores: {
      fire: number;
      smoke: number;
    };
  };
  aiDetectionData?: {
    modelVersion: string;
    processingTime: string;
    boundingBoxes: Array<{x: number, y: number, width: number, height: number}>;
    hashId: string;
  };
}

export interface Responder {
  id: string;
  name: string;
  unit?: string;
  location: string;
  available: boolean;
  status: 'idle' | 'responding' | 'engaged' | 'returning';
  contactNumber?: string;
  vehicleNumber?: string;
  teamSize?: number;
  equipment?: string[];
  coverage?: string[];
  responseTime?: string;
  currentIncident?: string;
  engagedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'responder';
  address: string;
}

export interface NotificationAlert {
  id: string;
  type: 'incident_detected' | 'unit_dispatched' | 'unit_engaged' | 'unit_resolved';
  message: string;
  timestamp: string;
  userId?: string;
  incidentId?: string;
  read: boolean;
}