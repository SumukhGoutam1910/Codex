import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Background camera status monitoring service
class CameraStatusMonitor {
  private static instance: CameraStatusMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): CameraStatusMonitor {
    if (!CameraStatusMonitor.instance) {
      CameraStatusMonitor.instance = new CameraStatusMonitor();
    }
    return CameraStatusMonitor.instance;
  }

  public async start() {
    if (this.isRunning) {
      console.log('📊 Camera status monitor already running');
      return;
    }

    console.log('🚀 Starting background camera status monitor...');
    this.isRunning = true;

    // Run immediately on start
    await this.checkAllCameraStatuses();

    // Then run every 3 seconds
    this.intervalId = setInterval(async () => {
      await this.checkAllCameraStatuses();
    }, 3000);

    console.log('✅ Background camera status monitor started');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Background camera status monitor stopped');
  }

  public getStatus() {
    return {
      running: this.isRunning,
      intervalId: !!this.intervalId
    };
  }

  private async checkAllCameraStatuses() {
    try {
      const client = await clientPromise;
      const db = client.db();
      const cameras = await db.collection('cameras').find({}).toArray();

      if (cameras.length === 0) {
        console.log('📷 No cameras to monitor');
        return;
      }

      console.log(`🔍 Checking status of ${cameras.length} cameras...`);
      let onlineCount = 0;
      let offlineCount = 0;

      for (const camera of cameras) {
        if (!camera.streamUrl) continue;

        let status = 'offline';
        
        try {
          // Disable SSL verification for cameras with self-signed certificates
          const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          if (camera.streamUrl.startsWith('https:')) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          try {
            const response = await fetch(camera.streamUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'BackgroundCameraMonitor/1.0',
                'Accept': '*/*'
              }
            });
            
            clearTimeout(timeoutId);
            status = (response.ok || response.status < 500) ? 'online' : 'offline';
            
          } finally {
            // Restore SSL setting
            if (originalRejectUnauthorized !== undefined) {
              process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
            } else {
              delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
            }
          }
          
        } catch (error: any) {
          status = 'offline';
        }

        // Update camera status and AI monitoring in database
        const updateData: any = {
          status,
          lastChecked: new Date().toISOString(),
          'metadata.monitoringActive': status === 'online' && camera.metadata?.aiMonitoring,
          'metadata.monitoringServerStatus': status === 'online' && camera.metadata?.aiMonitoring ? 'running' : 'stopped',
        };

        // Set monitoring start time if camera comes online and AI is enabled
        if (status === 'online' && camera.metadata?.aiMonitoring && !camera.metadata?.monitoringStarted) {
          updateData['metadata.monitoringStarted'] = new Date().toISOString();
        }

        await db.collection('cameras').updateOne(
          { _id: camera._id },
          { $set: updateData }
        );

        if (status === 'online') {
          onlineCount++;
        } else {
          offlineCount++;
        }
      }

      console.log(`📊 Status check complete: ${onlineCount} online, ${offlineCount} offline`);
      
    } catch (error) {
      console.error('❌ Error in background camera status check:', error);
    }
  }
}

// API endpoints to control the background monitor
export async function POST(request: NextRequest) {
  const { action } = await request.json();
  const monitor = CameraStatusMonitor.getInstance();

  switch (action) {
    case 'start':
      await monitor.start();
      return NextResponse.json({
        success: true,
        message: 'Background camera monitor started',
        status: monitor.getStatus()
      });

    case 'stop':
      monitor.stop();
      return NextResponse.json({
        success: true,
        message: 'Background camera monitor stopped',
        status: monitor.getStatus()
      });

    case 'status':
      return NextResponse.json({
        success: true,
        status: monitor.getStatus()
      });

    default:
      return NextResponse.json(
        { error: 'Invalid action. Use: start, stop, or status' },
        { status: 400 }
      );
  }
}

export async function GET(request: NextRequest) {
  const monitor = CameraStatusMonitor.getInstance();
  return NextResponse.json({
    success: true,
    status: monitor.getStatus()
  });
}