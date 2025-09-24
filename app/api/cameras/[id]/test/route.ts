
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import https from 'https';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const camerasCollection = db.collection('cameras');
    const camera = await camerasCollection.findOne({ _id: new ObjectId(params.id) });
    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    const url = camera.streamUrl;
    if (!url) {
      return NextResponse.json({ error: 'No streamUrl set for this camera' }, { status: 400 });
    }
    // Check for insecure param
    const insecure = request.nextUrl.searchParams.get('insecure') === '1';
    try {
      const axiosOptions: any = {
        method: 'GET',
        url,
        timeout: 5000,
      };
      if (insecure && url.startsWith('https://')) {
        axiosOptions.httpsAgent = new https.Agent({ rejectUnauthorized: false });
      }
      const res = await axios(axiosOptions);
      if (res.status >= 200 && res.status < 300) {
        return NextResponse.json({ success: true, status: res.status, message: 'Camera feed reachable' });
      } else {
        return NextResponse.json({ success: false, status: res.status, message: 'Camera feed returned error' });
      }
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message || 'Failed to connect to camera feed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to test camera connection' }, { status: 500 });
  }
}
