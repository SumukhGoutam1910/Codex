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

export const POST = async (request: NextRequest) => {
  try {
    const {
      name,
      streamUrl,
      location,
      fullAddress,
      streamType,
      userId,
      deviceType,
      connectionMethod
    } = await request.json();

    if (!name || !location) {
      console.error('[Camera Add] Failure: Name and location are required');
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }


  // Auto-generate stream URL if not provided (for discovered devices)
  const autoStreamUrl = streamUrl || generateAutoStreamUrl(deviceType, connectionMethod);

    // Create new camera object
    const newCamera = {
      userId: userId || 'system',
      name,
      streamUrl: autoStreamUrl,
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
        autoConfigured: !streamUrl
      }
    };

    let client, db, camerasCollection, result;
    try {
      client = await clientPromise;
      db = client.db();
      camerasCollection = db.collection('cameras');
      result = await camerasCollection.insertOne(newCamera);
      console.log(`✅ [Camera Add] Connection established and camera added: ${name}`);
      return NextResponse.json({
        success: true,
        message: `${name} added successfully to monitoring network`,
        camera: { ...newCamera, _id: result.insertedId }
      });
    } catch (dbError) {
      console.error('❌ [Camera Add] Connection failure or interrupted:', dbError);
      return NextResponse.json(
        { error: 'Failed to add camera (DB connection error)' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [Camera Add] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to add camera' },
      { status: 500 }
    );
  }
};


function generateAutoStreamUrl(deviceType?: string, connectionMethod?: string): string {
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
