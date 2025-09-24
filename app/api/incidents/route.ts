import { NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  try {
    const client = await clientPromise;
    const db = client.db();
    let query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    const incidents = await db.collection('incidents').find(query).sort({ timestamp: -1 }).toArray();
    return NextResponse.json(incidents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, incidentId, responderId } = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const incidentsCol = db.collection('incidents');
    const respondersCol = db.collection('responders');
    const incident = await incidentsCol.findOne({ id: incidentId });
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    switch (action) {
      case 'dispatch': {
        let responder;
        if (responderId) {
          responder = await respondersCol.findOne({ id: responderId });
        } else {
          responder = await respondersCol.findOne({ available: true });
        }
        if (!responder) {
          return NextResponse.json({ error: 'No available responders found' }, { status: 400 });
        }
        if (!responder.available) {
          return NextResponse.json({ error: 'Selected responder is not available' }, { status: 400 });
        }
        await incidentsCol.updateOne(
          { id: incidentId },
          { $set: { status: 'dispatched', dispatchedTo: responder.id, dispatchedAt: new Date().toISOString() } }
        );
        await respondersCol.updateOne(
          { id: responder.id },
          { $set: { available: false, status: 'responding', currentIncident: incidentId } }
        );
        return NextResponse.json({ success: true, message: `Unit ${responder.unit} dispatched to incident` });
      }
      case 'engage': {
        if (incident.status !== 'dispatched') {
          return NextResponse.json({ error: 'Incident must be dispatched first' }, { status: 400 });
        }
        await incidentsCol.updateOne(
          { id: incidentId },
          { $set: { status: 'engaged', engagedAt: new Date().toISOString() } }
        );
        if (incident.dispatchedTo) {
          await respondersCol.updateOne(
            { id: incident.dispatchedTo },
            { $set: { status: 'engaged', engagedAt: new Date().toISOString() } }
          );
        }
        return NextResponse.json({ success: true, message: 'Unit marked as engaged on scene' });
      }
      case 'resolve': {
        await incidentsCol.updateOne(
          { id: incidentId },
          { $set: { status: 'resolved', resolvedAt: new Date().toISOString() } }
        );
        if (incident.dispatchedTo) {
          await respondersCol.updateOne(
            { id: incident.dispatchedTo },
            { $set: { available: true, status: 'idle', currentIncident: undefined, engagedAt: undefined } }
          );
        }
        return NextResponse.json({ success: true, message: 'Incident marked as resolved' });
      }
      case 'request_backup': {
        const backupResponder = await respondersCol.findOne({ available: true });
        if (!backupResponder) {
          return NextResponse.json({ error: 'No backup units available' }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: `Backup unit ${backupResponder.unit} notified`, backupResponder });
      }
      case 'false_alarm': {
        await incidentsCol.updateOne(
          { id: incidentId },
          { $set: { status: 'false_alarm' } }
        );
        if (incident.dispatchedTo) {
          await respondersCol.updateOne(
            { id: incident.dispatchedTo },
            { $set: { available: true, status: 'idle', currentIncident: undefined } }
          );
        }
        return NextResponse.json({ success: true, message: 'Incident marked as false alarm' });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}