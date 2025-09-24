import { NextRequest, NextResponse } from 'next/server';
import { mockCameras } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (userId) {
    // Return cameras for specific user
    const userCameras = mockCameras.filter(camera => camera.userId === userId);
    return NextResponse.json(userCameras);
  }
  
  // Return all cameras (admin view)
  return NextResponse.json(mockCameras);
}

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      rtspUrl, 
      location, 
      fullAddress, 
      streamType, 
      userId,
      deviceType,
      connectionMethod 
    } = await request.json();
    
    // For device discovery, we have more flexible requirements
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }

    // Generate new camera ID
    const newId = 'c' + (mockCameras.length + 1);
    
    // Auto-generate RTSP URL if not provided (for discovered devices)
    const autoRtspUrl = rtspUrl || generateAutoRtspUrl(deviceType, connectionMethod);
    
    // Create new camera object
    const newCamera = {
      id: newId,
      userId: userId || 'system', // Default to system if not specified
      name,
      rtspUrl: autoRtspUrl,
      location,
      fullAddress: fullAddress || location, // Use location as fallback
      status: 'online' as const,
      addedAt: new Date().toISOString(),
      streamType: streamType || determineStreamType(deviceType, connectionMethod),
      metadata: {
        aiMonitoring: true,
        monitoringStarted: new Date().toISOString(),
        deviceType,
        connectionMethod,
        autoConfigured: !rtspUrl // Mark as auto-configured if RTSP was generated
      }
    };

    // Add to mock data (in real app, save to database)
    mockCameras.push(newCamera);
    
    return NextResponse.json({ 
      success: true, 
      message: `${name} added successfully to monitoring network`,
      camera: newCamera
    });
  } catch (error) {
    console.error('Error adding camera:', error);
    return NextResponse.json(
      { error: 'Failed to add camera' },
      { status: 500 }
    );
  }
}

function generateAutoRtspUrl(deviceType?: string, connectionMethod?: string): string {
  switch (deviceType) {
    case 'mobile_phone':
      return `camdroid://mobile-${Date.now()}:8080/video`;
    case 'ip_camera':
      const randomIP = `192.168.1.${100 + Math.floor(Math.random() * 50)}`;
      return `rtsp://${randomIP}:554/stream1`;
    case 'laptop_webcam':
      const laptopIP = `192.168.1.${150 + Math.floor(Math.random() * 20)}`;
      return `http://${laptopIP}:8081/webcam/stream`;
    case 'smart_camera':
      const smartIP = `192.168.1.${200 + Math.floor(Math.random() * 20)}`;
      return `rtsp://${smartIP}:554/live`;
    default:
      return `rtsp://192.168.1.${100 + Math.floor(Math.random() * 100)}:554/stream`;
  }
}

function determineStreamType(deviceType?: string, connectionMethod?: string): 'mobile_camdroid' | 'ip_camera' | 'webcam' {
  if (deviceType === 'mobile_phone') return 'mobile_camdroid';
  if (deviceType === 'laptop_webcam') return 'webcam';
  return 'ip_camera';
}