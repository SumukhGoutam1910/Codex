import { NextRequest, NextResponse } from 'next/server';
import { mockCameras, mockIncidents, simulateAIDetection, findNearestAvailableResponder } from '@/lib/mock-data';

export async function GET() {
  // Return current detection status for all cameras
  const detectionStatuses = mockCameras.map(camera => ({
    cameraId: camera.id,
    location: camera.location,
    status: camera.status,
    lastDetection: camera.metadata?.lastDetection || null,
    detectionHistory: camera.metadata?.detectionHistory || []
  }));

  return NextResponse.json({
    totalCameras: mockCameras.length,
    activeCameras: mockCameras.filter(c => c.status === 'online').length,
    recentDetections: mockIncidents
      .filter(incident => 
        incident.detectionMethod === 'AI' && 
        new Date(incident.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      )
      .length,
    cameraStatuses: detectionStatuses
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, cameraId } = await request.json();

    switch (action) {
      case 'simulate_detection':
        // Simulate AI detection for a specific camera
        const camera = mockCameras.find(c => c.id === cameraId);
        if (!camera) {
          return NextResponse.json(
            { error: 'Camera not found' },
            { status: 404 }
          );
        }

        if (camera.status !== 'online') {
          return NextResponse.json(
            { error: 'Camera is not online' },
            { status: 400 }
          );
        }

        // Simulate AI detection result
        const detectionResult = simulateAIDetection(camera);
        
        if (detectionResult.detected && detectionResult.type && detectionResult.confidence) {
          // Find nearest fire station for the incident
          const nearestResponder = findNearestAvailableResponder(camera.location);
          
          // Create new incident
          const newIncident = {
            id: `INC-${Date.now()}`,
            userId: camera.userId,
            type: detectionResult.type as 'fire' | 'smoke',
            location: camera.location,
            address: camera.fullAddress || camera.location,
            timestamp: new Date().toISOString(),
            status: 'pending' as const,
            priority: (detectionResult.confidence > 0.8 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
            description: `${detectionResult.type} detected by AI camera monitoring`,
            detectionMethod: 'AI' as const,
            cameraId: camera.id,
            confidence: detectionResult.confidence,
            nearestStation: nearestResponder?.unit || 'Fire Station 1',
            snapshot: `https://example.com/snapshots/${camera.id}_${Date.now()}.jpg`,
            aiMetadata: {
              modelVersion: "FireDetect-v2.1",
              processingTime: detectionResult.processingTime || 150,
              boundingBoxes: detectionResult.boundingBoxes || [],
              classificationScores: {
                fire: detectionResult.type === 'fire' ? detectionResult.confidence : 0,
                smoke: detectionResult.type === 'smoke' ? detectionResult.confidence : 0
              }
            }
          };

          // Add to incidents array
          mockIncidents.unshift(newIncident);

          // Update camera metadata
          if (!camera.metadata) {
            camera.metadata = { detectionHistory: [] };
          }
          
          camera.metadata.lastDetection = {
            timestamp: new Date().toISOString(),
            type: detectionResult.type,
            confidence: detectionResult.confidence
          };

          if (!camera.metadata.detectionHistory) {
            camera.metadata.detectionHistory = [];
          }
          
          camera.metadata.detectionHistory.unshift({
            timestamp: new Date().toISOString(),
            type: detectionResult.type,
            confidence: detectionResult.confidence,
            incidentId: newIncident.id
          });

          // Keep only last 50 detections
          camera.metadata.detectionHistory = camera.metadata.detectionHistory.slice(0, 50);

          return NextResponse.json({
            success: true,
            detected: true,
            incident: newIncident,
            detection: detectionResult,
            message: `${detectionResult.type} detected with ${Math.round(detectionResult.confidence * 100)}% confidence`
          });
        } else {
          return NextResponse.json({
            success: true,
            detected: false,
            message: 'No fire or smoke detected in current frame'
          });
        }

      case 'start_monitoring':
        // Start AI monitoring for a camera
        const monitorCamera = mockCameras.find(c => c.id === cameraId);
        if (!monitorCamera) {
          return NextResponse.json(
            { error: 'Camera not found' },
            { status: 404 }
          );
        }

        if (monitorCamera.status !== 'online') {
          return NextResponse.json(
            { error: 'Camera must be online to start monitoring' },
            { status: 400 }
          );
        }

        // In a real system, this would start the AI monitoring process
        // For simulation, we'll just mark it as monitored
        if (!monitorCamera.metadata) {
          monitorCamera.metadata = {};
        }
        monitorCamera.metadata.aiMonitoring = true;
        monitorCamera.metadata.monitoringStarted = new Date().toISOString();

        return NextResponse.json({
          success: true,
          message: `AI monitoring started for camera at ${monitorCamera.location}`,
          camera: monitorCamera
        });

      case 'stop_monitoring':
        // Stop AI monitoring for a camera
        const stopCamera = mockCameras.find(c => c.id === cameraId);
        if (!stopCamera) {
          return NextResponse.json(
            { error: 'Camera not found' },
            { status: 404 }
          );
        }

        if (stopCamera.metadata) {
          stopCamera.metadata.aiMonitoring = false;
          stopCamera.metadata.monitoringStopped = new Date().toISOString();
        }

        return NextResponse.json({
          success: true,
          message: `AI monitoring stopped for camera at ${stopCamera.location}`,
          camera: stopCamera
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in detection API:', error);
    return NextResponse.json(
      { error: 'Failed to process detection request' },
      { status: 500 }
    );
  }
}