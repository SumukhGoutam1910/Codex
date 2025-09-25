import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

// Background camera status monitoring service
class CameraStatusMonitor {
  private static instance: CameraStatusMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private aiProcesses: Map<string, ChildProcess> = new Map(); // Track AI detection processes

  private constructor() {}

  public static getInstance(): CameraStatusMonitor {
    if (!CameraStatusMonitor.instance) {
      CameraStatusMonitor.instance = new CameraStatusMonitor();
    }
    return CameraStatusMonitor.instance;
  }

  public async start() {
    console.log('🚨 Background monitor start() method called');
    if (this.isRunning) {
      console.log('📊 Camera status monitor already running');
      return;
    }

    console.log('🚀 Starting background camera status monitor...');
    this.isRunning = true;

    // Run immediately on start
    console.log('🏁 Running initial camera status check...');
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
    
    // Stop all AI detection processes
    this.stopAllAIProcesses();
    
    this.isRunning = false;
    console.log('⏹️ Background camera status monitor stopped');
  }

  public getStatus() {
    return {
      running: this.isRunning,
      intervalId: !!this.intervalId,
      aiProcessesRunning: this.aiProcesses.size,
      monitoredCameras: Array.from(this.aiProcesses.keys())
    };
  }

  private stopAllAIProcesses() {
    console.log(`🤖 Stopping ${this.aiProcesses.size} AI detection processes...`);
    this.aiProcesses.forEach((process, cameraId) => {
      try {
        process.kill('SIGTERM');
        console.log(`🛑 Stopped AI process for camera: ${cameraId}`);
      } catch (error) {
        console.error(`❌ Error stopping AI process for camera ${cameraId}:`, error);
      }
    });
    this.aiProcesses.clear();
  }

  private async startAIDetection(camera: any) {
    if (this.aiProcesses.has(camera._id.toString())) {
      console.log(`🔄 AI detection already running for camera: ${camera.name}`);
      return; // Already running
    }

    try {
      console.log(`🤖 Starting AI detection for camera: ${camera.name}`);
      
      // Path to the Python AI detection script
      const pythonScript = path.join(process.cwd(), 'mdl.py');
      const pythonExecutable = path.join(process.cwd(), 'env', 'Scripts', 'python.exe');
      
      console.log(`🐍 Python executable: ${pythonExecutable}`);
      console.log(`📜 Script path: ${pythonScript}`);
      console.log(`📹 Stream URL: ${camera.streamUrl}`);
      
      // Spawn Python process for AI detection using virtual environment
      const streamUrl = camera.streamUrl.endsWith('/video') ? camera.streamUrl : `${camera.streamUrl}/video`;
      
      const aiProcess = spawn(pythonExecutable, [
        pythonScript,
        camera._id.toString(), // camera_id
        streamUrl, // stream_url with /video endpoint
        camera.name, // camera_name
        camera.location || 'Unknown Location' // location
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      // Handle process output
      aiProcess.stdout.on('data', (data) => {
        console.log(`🤖 AI[${camera.name}]: ${data.toString().trim()}`);
      });

      aiProcess.stderr.on('data', (data) => {
        console.error(`❌ AI[${camera.name}] Error: ${data.toString().trim()}`);
      });

      aiProcess.on('close', (code) => {
        console.log(`🤖 AI process for ${camera.name} exited with code: ${code}`);
        this.aiProcesses.delete(camera._id.toString());
      });

      aiProcess.on('error', (error) => {
        console.error(`❌ Failed to start AI process for ${camera.name}:`, error);
        this.aiProcesses.delete(camera._id.toString());
      });

      // Store the process
      this.aiProcesses.set(camera._id.toString(), aiProcess);
      
      console.log(`✅ AI detection started for camera: ${camera.name}`);
      
    } catch (error) {
      console.error(`❌ Error starting AI detection for camera ${camera.name}:`, error);
    }
  }

  private async checkAllCameraStatuses() {
    console.log('�🚨🚨 STARTING CAMERA STATUS CHECK 🚨🚨🚨');
    try {
      const client = await clientPromise;
      const db = client.db();
      const cameras = await db.collection('cameras').find({}).toArray();

      console.log(`📊 Found ${cameras.length} cameras in database`);
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

        // Manage AI detection processes
        const cameraId = camera._id.toString();
        const shouldRunAI = status === 'online'; // Always run AI for online cameras
        const isAIRunning = this.aiProcesses.has(cameraId);

        console.log(`🔍 Camera ${camera.name}: status=${status}, shouldRunAI=${shouldRunAI}, isAIRunning=${isAIRunning}`);

        if (shouldRunAI && !isAIRunning) {
          // Start AI detection if camera is online
          await this.startAIDetection(camera);
        } else if (!shouldRunAI && isAIRunning) {
          // Stop AI detection if camera is offline
          const process = this.aiProcesses.get(cameraId);
          if (process) {
            try {
              process.kill('SIGTERM');
              console.log(`🛑 Stopped AI process for camera: ${camera.name}`);
            } catch (error) {
              console.error(`❌ Error stopping AI process for camera ${camera.name}:`, error);
            }
            this.aiProcesses.delete(cameraId);
          }
        }

        if (status === 'online') {
          onlineCount++;
        } else {
          offlineCount++;
        }
      }

      console.log(`📊 Status check complete: ${onlineCount} online, ${offlineCount} offline | AI processes: ${this.aiProcesses.size}`);
      
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