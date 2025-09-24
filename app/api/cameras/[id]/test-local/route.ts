import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const cameraId = params.id;

    if (!ObjectId.isValid(cameraId)) {
      return NextResponse.json({ error: 'Invalid camera ID' }, { status: 400 });
    }

    const camera = await db.collection('cameras').findOne(
      { _id: new ObjectId(cameraId) }
    );

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    const localUrl = camera.streamUrl;
    if (!localUrl) {
      return NextResponse.json({ error: 'No local URL configured' }, { status: 400 });
    }

    // Try to reach the camera on local network with a quick test
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      // Disable SSL verification for local cameras with self-signed certs
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      if (localUrl.startsWith('https:')) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      let response: Response;
      try {
        response = await fetch(localUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'NetworkTestAgent/1.0',
          }
        });
      } finally {
        clearTimeout(timeoutId);
        // Restore SSL setting
        if (originalRejectUnauthorized !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }

      const isReachable = response.ok || response.status < 500;
      
      return NextResponse.json({
        success: true,
        localNetwork: isReachable,
        status: response.status,
        message: isReachable ? 'Local network access available' : 'Local network access unavailable'
      });

    } catch (error: any) {
      // Network error usually means not on local network
      console.log(`Local network test failed for ${cameraId}:`, error.message);
      
      return NextResponse.json({
        success: true,
        localNetwork: false,
        message: 'Not on local network'
      });
    }

  } catch (error) {
    console.error('Error testing local network:', error);
    return NextResponse.json(
      { error: 'Failed to test local network access' },
      { status: 500 }
    );
  }
}