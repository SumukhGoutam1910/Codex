import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { active, action } = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const cameraId = params.id;

    if (!ObjectId.isValid(cameraId)) {
      return NextResponse.json({ error: 'Invalid camera ID' }, { status: 400 });
    }

    // Update the camera's AI monitoring status
    const updateData: any = {
      'metadata.monitoringActive': active,
    };

    if (active) {
      // Starting AI monitoring
      updateData['metadata.aiMonitoring'] = true;
      updateData['metadata.monitoringStarted'] = new Date().toISOString();
      updateData['metadata.monitoringServerStatus'] = 'running';
    } else {
      // Stopping AI monitoring
      updateData['metadata.monitoringStopped'] = new Date().toISOString();
      updateData['metadata.monitoringServerStatus'] = 'stopped';
    }

    const result = await db.collection('cameras').updateOne(
      { _id: new ObjectId(cameraId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    // In a real implementation, you would:
    // 1. Start/stop the actual AI monitoring process
    // 2. Communicate with your AI service/worker
    // 3. Handle process management (PM2, Docker containers, etc.)
    
    // For now, we'll simulate the response
    console.log(`AI Monitoring ${action} for camera ${cameraId}`);
    
    // Get updated camera data
    const updatedCamera = await db.collection('cameras').findOne(
      { _id: new ObjectId(cameraId) }
    );

    return NextResponse.json({
      success: true,
      message: `AI monitoring ${action}ed successfully`,
      camera: updatedCamera,
      status: active ? 'running' : 'stopped'
    });

  } catch (error) {
    console.error('Error toggling AI monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to toggle AI monitoring' },
      { status: 500 }
    );
  }
}

// Get AI monitoring status
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
      { _id: new ObjectId(cameraId) },
      { projection: { metadata: 1, name: 1 } }
    );

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      aiMonitoring: camera.metadata?.aiMonitoring || false,
      monitoringActive: camera.metadata?.monitoringActive || false,
      monitoringServerStatus: camera.metadata?.monitoringServerStatus || 'stopped',
      lastDetection: camera.metadata?.lastDetection || null,
      detectionHistory: camera.metadata?.detectionHistory || []
    });

  } catch (error) {
    console.error('Error getting AI monitoring status:', error);
    return NextResponse.json(
      { error: 'Failed to get AI monitoring status' },
      { status: 500 }
    );
  }
}