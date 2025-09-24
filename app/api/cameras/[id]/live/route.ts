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

  console.log(`[Live Proxy][${cameraId}] Proxying live stream from: ${streamUrl}`);

  // Try common video stream endpoints for IP cameras
  const streamEndpoints = [
    `${streamUrl}/video`,      // Common endpoint
    `${streamUrl}/stream`,     // Another common endpoint  
    `${streamUrl}/mjpg/video.mjpg`, // MJPEG stream
    `${streamUrl}/videostream.cgi`, // CGI endpoint
    streamUrl                  // Original URL as fallback
  ];

  for (const endpoint of streamEndpoints) {
    try {
      console.log(`[Live Proxy][${cameraId}] Trying endpoint: ${endpoint}`);
      
      // For HTTPS URLs with self-signed certificates, we need to disable SSL verification
      const options: RequestInit = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'video/*, image/*, application/octet-stream, */*',
          'Cache-Control': 'no-cache',
        }
      };

      // Temporarily disable SSL verification for self-signed certificates
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      if (endpoint.startsWith('https:')) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      let response: Response;
      try {
        response = await fetch(endpoint, options);
      } finally {
        // Restore original SSL setting
        if (originalRejectUnauthorized !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }

      if (!response.ok) {
        console.log(`[Live Proxy][${cameraId}] Endpoint ${endpoint} failed: ${response.status}`);
        continue; // Try next endpoint
      }

      const contentType = response.headers.get('content-type') || '';
      console.log(`[Live Proxy][${cameraId}] Content-Type from ${endpoint}: ${contentType}`);

      // Check if this is a video/image stream (not HTML page)
      if (contentType.includes('video/') || 
          contentType.includes('image/') || 
          contentType.includes('application/octet-stream') ||
          contentType.includes('multipart/x-mixed-replace')) {
        
        console.log(`[Live Proxy][${cameraId}] Found video stream at: ${endpoint}`);

        // Build headers object
        const headers: { [key: string]: string } = {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };

        // Add range support headers if present
        const acceptRanges = response.headers.get('accept-ranges');
        const contentRange = response.headers.get('content-range');
        if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;
        if (contentRange) headers['Content-Range'] = contentRange;

        console.log(`[Live Proxy][${cameraId}] Successfully connected to video stream`);

        // Return the video stream
        return new Response(response.body, { headers });
      } else {
        console.log(`[Live Proxy][${cameraId}] ${endpoint} returned HTML/text, trying next endpoint`);
        continue;
      }

    } catch (error: any) {
      console.log(`[Live Proxy][${cameraId}] Error with ${endpoint}:`, error.message);
      continue; // Try next endpoint
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}

async function getCamera(id: string) {
  const client = await clientPromise;
  const db = client.db();
  const camerasCollection = db.collection('cameras');
  return camerasCollection.findOne({ _id: new ObjectId(id) });
}