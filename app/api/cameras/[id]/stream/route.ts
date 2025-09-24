import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const cameraId = params.id;
  const camera = await getCamera(cameraId);
  
  if (!camera) {
    return new Response('Camera not found', { status: 404 });
  }
  
  const streamUrl = camera.streamUrl;
  if (!streamUrl) {
    return new Response('No streamUrl set for this camera', { status: 400 });
  }

  try {
    console.log(`[Stream Proxy][${cameraId}] Fetching stream from: ${streamUrl}`);
    
    // Fetch the stream and proxy it
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[Stream Proxy][${cameraId}] Stream error: ${response.status} ${response.statusText}`);
      return new Response(`Stream error: ${response.status}`, { status: 502 });
    }

    // Get content type from the original response
    const contentType = response.headers.get('content-type') || 'video/mp4';
    console.log(`[Stream Proxy][${cameraId}] Content-Type: ${contentType}`);

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error(`[Stream Proxy][${cameraId}] Error:`, error.message);
    return new Response(`Failed to fetch stream: ${error.message}`, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function getCamera(id: string) {
  const client = await clientPromise;
  const db = client.db();
  const camerasCollection = db.collection('cameras');
  return camerasCollection.findOne({ _id: new ObjectId(id) });
}