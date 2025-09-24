import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';


const TMP_DIR = path.join(process.cwd(), '.tmp_hls');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Handle CORS preflight
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // URL: /api/cameras/[id]/hls?file=...
  const file = request.nextUrl.searchParams.get('file');
  const cameraId = params.id;
  const camera = await getCamera(cameraId);
  if (!camera) {
    return new Response('Camera not found', { status: 404 });
  }
  const streamUrl = camera.streamUrl;
  if (!streamUrl) {
    return new Response('No streamUrl set for this camera', { status: 400 });
  }
  const cameraDir = path.join(TMP_DIR, cameraId);
  if (!fs.existsSync(cameraDir)) fs.mkdirSync(cameraDir);
  const playlistPath = path.join(cameraDir, 'index.m3u8');

  // If requesting a segment or playlist, serve it
  if (file) {
    const filePath = path.join(cameraDir, file);
    if (!fs.existsSync(filePath)) return new Response('Not found', { status: 404 });
    const stat = fs.statSync(filePath);
    const data = fs.readFileSync(filePath);
    return new Response(data, {
      headers: {
        'Content-Type': file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
        'Content-Length': stat.size + '',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache'
      }
    });
  }

  // If playlist doesn't exist or is old, (re)start ffmpeg using fluent-ffmpeg
  if (!fs.existsSync(playlistPath) || Date.now() - fs.statSync(playlistPath).mtimeMs > 30000) {
    // Clean up old files
    if (fs.existsSync(cameraDir)) {
      fs.readdirSync(cameraDir).forEach(f => {
        try {
          fs.unlinkSync(path.join(cameraDir, f));
        } catch (err) {
          console.log(`[HLS] Could not delete ${f}:`, err);
        }
      });
    }
    
    console.log(`[HLS] Starting FFmpeg for camera ${cameraId} with stream: ${streamUrl}`);
    
    try {
      // Start FFmpeg process for HLS conversion
      const ffmpegProcess = ffmpeg(streamUrl)
        .inputOptions([
          '-fflags', '+genpts',
          '-avoid_negative_ts', 'make_zero',
          '-rtsp_transport', 'tcp'
        ])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-tune', 'zerolatency', 
          '-crf', '28',
          '-maxrate', '1000k',
          '-bufsize', '2000k',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-f', 'hls',
          '-hls_time', '2',
          '-hls_list_size', '6',
          '-hls_wrap', '10',
          '-hls_delete_threshold', '1',
          '-hls_flags', 'delete_segments+round_durations+independent_segments',
          '-hls_segment_filename', path.join(cameraDir, 'segment_%03d.ts')
        ])
        .output(playlistPath)
        .on('start', (commandLine) => {
          console.log(`[FFmpeg][${cameraId}] Started: ${commandLine}`);
        })
        .on('stderr', (stderrLine) => {
          if (stderrLine.includes('frame=') || stderrLine.includes('time=')) {
            // Only log progress every few lines to avoid spam
            if (Math.random() < 0.1) console.log(`[FFmpeg][${cameraId}] ${stderrLine}`);
          } else {
            console.log(`[FFmpeg][${cameraId}] ${stderrLine}`);
          }
        })
        .on('error', (err) => {
          console.error(`[FFmpeg][${cameraId}] Error:`, err.message);
        })
        .on('end', () => {
          console.log(`[FFmpeg][${cameraId}] Stream processing ended`);
        });
      
      // Start the process
      ffmpegProcess.run();
      
      // Wait for the playlist to be created (up to 15 seconds)
      let attempts = 0;
      while (!fs.existsSync(playlistPath) && attempts < 75) {
        await new Promise(res => setTimeout(res, 200)); // Wait 200ms
        attempts++;
      }
      
      if (!fs.existsSync(playlistPath)) {
        console.error(`[HLS] Failed to create playlist for camera ${cameraId} after ${attempts * 200}ms`);
        return new Response('Failed to create HLS stream', { status: 503 });
      } else {
        console.log(`[HLS] Playlist created successfully for camera ${cameraId} after ${attempts * 200}ms`);
      }
      
    } catch (error: any) {
      console.error(`[HLS] FFmpeg setup error for camera ${cameraId}:`, error.message);
      return new Response(`FFmpeg error: ${error.message}`, { status: 503 });
    }
  }

  // Serve the playlist
  if (!fs.existsSync(playlistPath)) {
    // Wait a bit for ffmpeg to start
    await new Promise(res => setTimeout(res, 2000));
    if (!fs.existsSync(playlistPath)) {
      return new Response('Stream not ready', { status: 503 });
    }
  }
  const stat = fs.statSync(playlistPath);
  const data = fs.readFileSync(playlistPath);
  return new Response(data, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Content-Length': stat.size + '',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache'
    }
  });
}

async function getCamera(id: string) {
  const client = await clientPromise;
  const db = client.db();
  const camerasCollection = db.collection('cameras');
  return camerasCollection.findOne({ _id: new ObjectId(id) });
}
