import { NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const available = searchParams.get('available');
  try {
    const client = await clientPromise;
    const db = client.db();
    let query: any = {};
    if (status) query.status = status;
    if (available !== null) query.available = available === 'true';
    const responders = await db.collection('responders').find(query).toArray();
    return NextResponse.json({
      totalUnits: await db.collection('responders').countDocuments(),
      availableUnits: await db.collection('responders').countDocuments({ available: true }),
      respondingUnits: await db.collection('responders').countDocuments({ status: 'responding' }),
      engagedUnits: await db.collection('responders').countDocuments({ status: 'engaged' }),
      responders
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch responders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, responderId, message } = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const respondersCol = db.collection('responders');
    const responder = await respondersCol.findOne({ id: responderId });
    if (!responder) {
      return NextResponse.json({ error: 'Responder not found' }, { status: 404 });
    }
    switch (action) {
      case 'mark_available':
        await respondersCol.updateOne(
          { id: responderId },
          { $set: { available: true, status: 'idle', currentIncident: undefined, engagedAt: undefined } }
        );
        return NextResponse.json({ success: true, message: `${responder.unit} marked as available` });
      case 'mark_unavailable':
        await respondersCol.updateOne(
          { id: responderId },
          { $set: { available: false, status: 'returning' } }
        );
        return NextResponse.json({ success: true, message: `${responder.unit} marked as unavailable` });
      case 'get_location':
        return NextResponse.json({
          success: true,
          location: responder.location,
          coordinates: {
            lat: 28.6139 + (Math.random() - 0.5) * 0.1,
            lng: 77.2090 + (Math.random() - 0.5) * 0.1
          },
          responder
        });
      case 'send_message':
        return NextResponse.json({
          success: true,
          message: `Message sent to ${responder.unit}`,
          sentMessage: message,
          timestamp: new Date().toISOString()
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update responder' }, { status: 500 });
  }
}