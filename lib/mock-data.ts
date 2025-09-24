import { User, Camera, Incident, Responder } from './types';

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Rohit Sharma",
    email: "rohit@example.com",
    passwordHash: "$2a$10$srho36mUZxnZjFtUGYFYJ.xXn/I5q/ciFJqecXGXEFvx55K3nDBWS", // hash for "user123"
    role: "user",
    address: "123 MG Road, Pune, Maharashtra 411001"
  },
  {
    id: "u2",
    name: "Priya Patel",
    email: "priya@example.com",
    passwordHash: "$2a$10$srho36mUZxnZjFtUGYFYJ.xXn/I5q/ciFJqecXGXEFvx55K3nDBWS", // hash for "user123"
    role: "user",
    address: "456 FC Road, Pune, Maharashtra 411016"
  },
  {
    id: "a1",
    name: "Admin Officer",
    email: "admin@example.com",
    passwordHash: "$2a$10$R09mxgHSFuwNjrnD2L94KO9B6/6qP8ICl2jWFjVU/dyZ4vGHd/USG", // hash for "admin123"
    role: "admin",
    address: "Pune Fire Safety Control Center, Camp, Pune 411001"
  },
  {
    id: "r1",
    name: "Captain Suresh Kumar",
    email: "responder@example.com",
    passwordHash: "$2a$10$eBC3x7YC2OU3HHn8NjwZ7u4LJMpHOAG9qHVpAccyQcAU3TS.C23/q", // hash for "responder123"
    role: "responder",
    address: "Pune Fire Station 3, Koregaon Park"
  },
  {
    id: "r2",
    name: "Lieutenant Amit Singh",
    email: "responder2@example.com",
    passwordHash: "$2a$10$eBC3x7YC2OU3HHn8NjwZ7u4LJMpHOAG9qHVpAccyQcAU3TS.C23/q", // hash for "responder123"
    role: "responder",
    address: "Pune Fire Station 5, Aundh"
  }
];

export const mockCameras: Camera[] = [
  { 
    id: "c1", 
    userId: "u1", 
    name: "Home Living Room Camera", 
    rtspUrl: "rtsp://192.168.1.101:8080/video", 
    location: "Living Room, Ground Floor",
    fullAddress: "123 MG Road, Pune, Maharashtra 411001",
    status: "online",
    addedAt: "2025-09-20T10:30:00Z",
    streamType: "mobile_camdroid"
  },
  { 
    id: "c2", 
    userId: "u1", 
    name: "Kitchen Safety Camera", 
    rtspUrl: "rtsp://192.168.1.102:8080/video", 
    location: "Kitchen, Ground Floor",
    fullAddress: "123 MG Road, Pune, Maharashtra 411001",
    status: "online",
    addedAt: "2025-09-21T14:20:00Z",
    streamType: "mobile_camdroid"
  },
  { 
    id: "c3", 
    userId: "u2", 
    name: "Shop Front Camera", 
    rtspUrl: "rtsp://192.168.2.101:8080/video", 
    location: "Shop Front, Street Level",
    fullAddress: "456 FC Road, Pune, Maharashtra 411016",
    status: "online",
    addedAt: "2025-09-19T09:15:00Z",
    streamType: "mobile_camdroid"
  }
];

export const mockIncidents: Incident[] = [
  { 
    id: "i1", 
    cameraId: "c1", 
    userId: "u1", 
    userName: "Rohit Sharma",
    type: "fire", 
    confidence: 0.94, 
    timestamp: "2025-09-24T15:34:12Z", 
    address: "123 MG Road, Pune, Maharashtra 411001",
    location: "Living Room, Ground Floor",
    nearestStation: "Pune Fire Station 3, Koregaon Park", 
    snapshot: "/snapshots/fire_detection_i1.jpg", 
    status: "pending_admin",
    aiDetectionData: {
      modelVersion: "v2.1.0",
      processingTime: "0.3s",
      boundingBoxes: [{ x: 120, y: 80, width: 200, height: 150 }],
      hashId: "sha256:a1b2c3d4e5f6..."
    }
  },
  { 
    id: "i2", 
    cameraId: "c3", 
    userId: "u2", 
    userName: "Priya Patel",
    type: "smoke", 
    confidence: 0.87, 
    timestamp: "2025-09-24T16:05:42Z", 
    address: "456 FC Road, Pune, Maharashtra 411016",
    location: "Shop Front, Street Level",
    nearestStation: "Pune Fire Station 5, Aundh", 
    snapshot: "/snapshots/smoke_detection_i2.jpg", 
    status: "engaged",
    dispatchedTo: "r2",
    dispatchedAt: "2025-09-24T16:10:00Z",
    engagedAt: "2025-09-24T16:15:00Z",
    aiDetectionData: {
      modelVersion: "v2.1.0",
      processingTime: "0.2s",
      boundingBoxes: [{ x: 300, y: 150, width: 180, height: 120 }],
      hashId: "sha256:x9y8z7w6v5u4..."
    }
  },
  { 
    id: "i3", 
    cameraId: "c2", 
    userId: "u1", 
    userName: "Rohit Sharma",
    type: "fire", 
    confidence: 0.91, 
    timestamp: "2025-09-23T12:45:30Z", 
    address: "123 MG Road, Pune, Maharashtra 411001",
    location: "Kitchen, Ground Floor",
    nearestStation: "Pune Fire Station 3, Koregaon Park", 
    snapshot: "/snapshots/fire_detection_i3.jpg", 
    status: "resolved",
    dispatchedTo: "r1",
    dispatchedAt: "2025-09-23T12:50:00Z",
    engagedAt: "2025-09-23T13:05:00Z",
    resolvedAt: "2025-09-23T13:45:00Z",
    aiDetectionData: {
      modelVersion: "v2.1.0",
      processingTime: "0.25s",
      boundingBoxes: [{ x: 90, y: 200, width: 160, height: 140 }],
      hashId: "sha256:p9o8i7u6y5t4..."
    }
  }
];

export const mockResponders: Responder[] = [
  { 
    id: "r1", 
    name: "Captain Suresh Kumar",
    unit: "Fire Unit Alpha-3", 
    location: "Pune Fire Station 3, Koregaon Park", 
    available: true, 
    status: "idle",
    contactNumber: "+91-9876543210",
    vehicleNumber: "MH-12-FB-1003",
    teamSize: 4,
    equipment: ["Fire Engine", "Ladder Truck", "Breathing Apparatus"],
    coverage: ["MG Road", "Koregaon Park", "Camp Area"],
    responseTime: "8-12 minutes"
  },
  { 
    id: "r2", 
    name: "Lieutenant Amit Singh",
    unit: "Fire Unit Beta-5", 
    location: "Pune Fire Station 5, Aundh", 
    available: false, 
    status: "engaged",
    contactNumber: "+91-9876543211",
    vehicleNumber: "MH-12-FB-1005",
    teamSize: 3,
    equipment: ["Fire Engine", "Water Tanker", "Rescue Equipment"],
    coverage: ["FC Road", "Aundh", "Baner Area"],
    responseTime: "10-15 minutes",
    currentIncident: "i2",
    engagedAt: "2025-09-24T16:15:00Z"
  },
  { 
    id: "r3", 
    name: "Sub Officer Rahul Desai",
    unit: "Fire Unit Gamma-7", 
    location: "Pune Fire Station 7, Hadapsar", 
    available: true, 
    status: "idle",
    contactNumber: "+91-9876543212",
    vehicleNumber: "MH-12-FB-1007",
    teamSize: 3,
    equipment: ["Fire Engine", "Chemical Foam Unit"],
    coverage: ["Hadapsar", "Magarpatta", "Wanowrie"],
    responseTime: "12-18 minutes"
  }
];

// Mock function to find nearest available responder
export function findNearestAvailableResponder(userAddress: string): Responder | null {
  // Simple mock logic - in real app would use geolocation/mapping service
  const availableResponders = mockResponders.filter(r => r.available);
  
  // Priority based on coverage areas (mock logic)
  if (userAddress.includes("MG Road") || userAddress.includes("Camp")) {
    return availableResponders.find(r => r.coverage?.includes("MG Road")) || availableResponders[0];
  }
  if (userAddress.includes("FC Road") || userAddress.includes("Aundh")) {
    return availableResponders.find(r => r.coverage?.includes("FC Road")) || availableResponders[0];
  }
  
  return availableResponders[0] || null;
}

// Mock AI detection simulation
export function simulateAIDetection(camera: Camera): { 
  detected: boolean; 
  type?: 'fire' | 'smoke'; 
  confidence?: number;
  processingTime?: number;
  boundingBoxes?: Array<{x: number, y: number, width: number, height: number}>;
} {
  // Simulate random AI detection for demo purposes
  const random = Math.random();
  
  if (random < 0.05) { // 5% chance of fire detection
    const confidence = 0.85 + (Math.random() * 0.15); // 85-100% confidence
    return {
      detected: true,
      type: 'fire',
      confidence,
      processingTime: 120 + Math.random() * 80, // 120-200ms processing time
      boundingBoxes: [
        {
          x: Math.floor(Math.random() * 400),
          y: Math.floor(Math.random() * 300),
          width: 50 + Math.floor(Math.random() * 100),
          height: 50 + Math.floor(Math.random() * 100)
        }
      ]
    };
  } else if (random < 0.08) { // 3% chance of smoke detection
    const confidence = 0.70 + (Math.random() * 0.25); // 70-95% confidence
    return {
      detected: true,
      type: 'smoke',
      confidence,
      processingTime: 140 + Math.random() * 100, // 140-240ms processing time
      boundingBoxes: [
        {
          x: Math.floor(Math.random() * 400),
          y: Math.floor(Math.random() * 300),
          width: 80 + Math.floor(Math.random() * 120),
          height: 60 + Math.floor(Math.random() * 100)
        }
      ]
    };
  }
  
  return { 
    detected: false,
    processingTime: 80 + Math.random() * 40 // 80-120ms for normal processing
  };
}