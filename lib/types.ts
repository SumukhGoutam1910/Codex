export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'responder';
  address: string;
}

export interface Camera {
  id?: string;
  _id?: string;
  userId: string;
  name: string;
  streamUrl: string; // Local network URL (e.g., http://192.168.1.100:8080/video)
  remoteStreamUrl?: string; // External access URL (e.g., http://yourname.duckdns.org:8080/video)
  location: string;
  fullAddress?: string;
  status: 'online' | 'offline';
  addedAt?: string;
  streamType?: 'mobile_camdroid' | 'ip_camera' | 'webcam';
  networkAccess?: {
    localIP: string; // Internal IP (192.168.1.100)
    externalURL?: string; // DDNS URL (yourname.duckdns.org)
    portForwarding?: {
      externalPort: number; // Router port (8080)
      internalPort: number; // Camera port (8080)
    };
    ddnsProvider?: 'duckdns' | 'no-ip' | 'dynu' | 'custom';
    lastOnline?: string; // Track when camera was last seen
  };
  metadata?: {
    aiMonitoring?: boolean;
    monitoringStarted?: string;
    monitoringStopped?: string;
    monitoringActive?: boolean; // Is AI currently running?
    monitoringServerStatus?: 'running' | 'stopped' | 'error';
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