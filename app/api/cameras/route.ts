import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  try {
    const client = await clientPromise;
    const db = client.db();
    const camerasCollection = db.collection('cameras');
    let query = {};
    if (userId) {
      query = { userId };
    }
    const cameras = await camerasCollection.find(query).toArray();
    return NextResponse.json(cameras);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return NextResponse.json({ error: 'Failed to fetch cameras' }, { status: 500 });
  }
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

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }

    // Auto-generate RTSP URL if not provided (for discovered devices)
    const autoRtspUrl = rtspUrl || generateAutoRtspUrl(deviceType, connectionMethod);

    // Create new camera object
    const newCamera = {
      userId: userId || 'system',
      name,
      rtspUrl: autoRtspUrl,
      location,
      fullAddress: fullAddress || location,
      status: 'online',
      addedAt: new Date().toISOString(),
      streamType: streamType || determineStreamType(deviceType, connectionMethod),
      metadata: {
        aiMonitoring: true,
        monitoringStarted: new Date().toISOString(),
        deviceType,
        connectionMethod,
        autoConfigured: !rtspUrl
      }
    };

    const client = await clientPromise;
    const db = client.db();
    const camerasCollection = db.collection('cameras');
    const result = await camerasCollection.insertOne(newCamera);
    return NextResponse.json({
      success: true,
      message: `${name} added successfully to monitoring network`,
      camera: { ...newCamera, _id: result.insertedId }
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
