import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const cameras = await db.collection('cameras').find({}).toArray();

    let onlineCount = 0;
    let offlineCount = 0;

    for (const camera of cameras) {
      if (!camera.streamUrl) continue;

      let status = 'offline';
      
      try {
        console.log(`🔍 Checking camera status: ${camera.name} - ${camera.streamUrl}`);
        
        // Disable SSL verification for cameras with self-signed certificates
        const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        if (camera.streamUrl.startsWith('https:')) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        try {
          const response = await fetch(camera.streamUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'CameraStatusChecker/1.0',
              'Accept': '*/*'
            }
          });
          
          clearTimeout(timeoutId);
          status = (response.ok || response.status < 500) ? 'online' : 'offline';
          console.log(`📊 ${camera.name}: ${status} (HTTP ${response.status})`);
          
        } finally {
          // Restore SSL setting
          if (originalRejectUnauthorized !== undefined) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
          } else {
            delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          }
        }
        
      } catch (error: any) {
        console.log(`❌ ${camera.name}: offline - ${error.message}`);
        status = 'offline';
      }

      // Update camera status in database
      await db.collection('cameras').updateOne(
        { _id: camera._id },
        { 
          $set: { 
            status,
            lastChecked: new Date().toISOString(),
            'metadata.monitoringActive': status === 'online',
            'metadata.monitoringServerStatus': status === 'online' ? 'running' : 'stopped',
            ...(status === 'online' && !camera.metadata?.monitoringStarted && {
              'metadata.monitoringStarted': new Date().toISOString()
            })
          } 
        }
      );

      if (status === 'online') {
        onlineCount++;
      } else {
        offlineCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status check completed for ${cameras.length} cameras`,
      stats: {
        total: cameras.length,
        online: onlineCount,
        offline: offlineCount
      }
    });

  } catch (error) {
    console.error('Error checking camera statuses:', error);
    return NextResponse.json(
      { error: 'Failed to check camera statuses' },
      { status: 500 }
    );
  }
}