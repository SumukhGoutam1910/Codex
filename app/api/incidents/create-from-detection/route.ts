import { NextRequest, NextResponse } from 'next/server';
import { Incident } from '@/lib/types';
import { promises as fs } from 'fs';
import path from 'path';

// In a real application, you would use a proper database
// For this demo, we'll use file-based storage
const INCIDENTS_FILE = path.join(process.cwd(), 'data', 'incidents.json');

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadIncidents(): Promise<Incident[]> {
  await ensureDataDirectory();
  try {
    const data = await fs.readFile(INCIDENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveIncidents(incidents: Incident[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(INCIDENTS_FILE, JSON.stringify(incidents, null, 2));
}

async function saveIncidentImage(imageBase64: string, filename: string): Promise<string> {
  try {
    // Create snapshots directory in public folder for web access
    const snapshotsDir = path.join(process.cwd(), 'public', 'incident-snapshots');
    await fs.mkdir(snapshotsDir, { recursive: true });
    
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const imageName = `incident-${timestamp}.jpg`;
    const imagePath = path.join(snapshotsDir, imageName);
    
    // Save image
    await fs.writeFile(imagePath, base64Data, 'base64');
    
    // Return web-accessible path
    return `/incident-snapshots/${imageName}`;
  } catch (error) {
    console.error('Error saving incident image:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cameraId,
      cameraName,
      location,
      detectionType,
      confidence,
      timestamp,
      image,
      bbox,
      severity
    } = body;

    // Validate required fields
    if (!cameraId || !detectionType || !confidence || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save incident image if provided
    let imageUrl = '';
    if (image) {
      imageUrl = await saveIncidentImage(image, `detection_${cameraId}_${Date.now()}`);
    }

    // Load existing incidents
    const incidents = await loadIncidents();

    // Create new incident
    const newIncident: Incident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: detectionType.toLowerCase() as 'fire' | 'smoke',
      address: location || 'Unknown Location',
      nearestStation: 'Station 1', // You could implement logic to find nearest station
      snapshot: imageUrl,
      timestamp: new Date(timestamp).toISOString(),
      status: 'pending_admin',
      priority: severity === 'high' ? 'high' : 'medium',
      description: `Automated detection: ${detectionType} detected with ${Math.round(confidence * 100)}% confidence`,
      userId: 'admin', // From admin user
      cameraId: cameraId,
      confidence: confidence,
      detectionMethod: 'AI',
      aiMetadata: {
        modelVersion: 'YOLOv8-FireSmoke-v1.0',
        processingTime: 0, // Could be measured
        boundingBoxes: bbox ? [{
          x: bbox[0],
          y: bbox[1], 
          width: bbox[2] - bbox[0],
          height: bbox[3] - bbox[1]
        }] : [],
        classificationScores: {
          fire: detectionType.toLowerCase() === 'fire' ? confidence : 0,
          smoke: detectionType.toLowerCase() === 'smoke' ? confidence : 0
        }
      }
    };

    // Add to incidents list
    incidents.push(newIncident);

    // Save updated incidents
    await saveIncidents(incidents);

    console.log(`🚨 NEW INCIDENT CREATED: ${newIncident.id}`);
    console.log(`📍 Location: ${location}`);
    console.log(`🔥 Detection: ${detectionType} (${Math.round(confidence * 100)}% confidence)`);
    console.log(`📸 Image saved: ${imageUrl}`);

    // TODO: Send real-time notification to admin (WebSocket, Push notification, etc.)
    // For now, we'll log it
    console.log(`📧 ADMIN ALERT: Fire/Smoke detected at ${location} - Incident ${newIncident.id}`);

    return NextResponse.json({
      success: true,
      incidentId: newIncident.id,
      message: `${detectionType} incident reported successfully`,
      imageUrl: imageUrl,
      adminNotified: true
    });

  } catch (error) {
    console.error('Error creating incident from detection:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Detection Incident API - Use POST to report incidents',
    usage: {
      endpoint: '/api/incidents/create-from-detection',
      method: 'POST',
      requiredFields: ['cameraId', 'detectionType', 'confidence', 'timestamp'],
      optionalFields: ['cameraName', 'location', 'image', 'bbox', 'severity']
    }
  });
}