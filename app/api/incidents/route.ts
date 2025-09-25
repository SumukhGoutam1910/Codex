import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  
  try {
    // Try MongoDB first
    const client = await clientPromise;
    const db = client.db('codex');
    let query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    const incidents = await db.collection('incidents').find(query).sort({ timestamp: -1 }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedIncidents = incidents.map(incident => ({
      ...incident,
      id: incident.id || incident._id?.toString(),
      _id: undefined
    }));
    
    return NextResponse.json(formattedIncidents);
  } catch (error) {
    console.error('MongoDB error, trying file storage:', error);
    
    // Fallback to file storage
    try {
      const incidentsFile = path.join(process.cwd(), 'data', 'incidents.json');
      const data = await fs.readFile(incidentsFile, 'utf-8');
      let incidents = JSON.parse(data);
      
      // Apply filters
      if (userId) incidents = incidents.filter((i: any) => i.userId === userId);
      if (status) incidents = incidents.filter((i: any) => i.status === status);
      
      // Sort by timestamp
      incidents.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return NextResponse.json(incidents);
    } catch (fileError) {
      console.error('File storage also failed:', fileError);
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, incidentId, responderId, status } = await request.json();
    
    try {
      // Try MongoDB first
      const client = await clientPromise;
      const db = client.db('codex');
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
            // Mock responder for file storage fallback
            responder = { id: 'responder_1', unit: 'Fire Unit 1', available: true };
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
          if (respondersCol) {
            await respondersCol.updateOne(
              { id: responder.id },
              { $set: { available: false, status: 'responding', currentIncident: incidentId } }
            );
          }
          return NextResponse.json({ success: true, message: `Unit ${responder.unit || responder.id} dispatched to incident` });
        }
        case 'update_status': {
          await incidentsCol.updateOne(
            { id: incidentId },
            { $set: { status: status, updatedAt: new Date().toISOString() } }
          );
          return NextResponse.json({ success: true, message: `Incident status updated to ${status}` });
        }
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } catch (dbError) {
      console.error('MongoDB error, trying file storage:', dbError);
      
      // Fallback to file storage
      try {
        const incidentsFile = path.join(process.cwd(), 'data', 'incidents.json');
        const data = await fs.readFile(incidentsFile, 'utf-8');
        let incidents = JSON.parse(data);
        
        const incidentIndex = incidents.findIndex((i: any) => i.id === incidentId);
        if (incidentIndex === -1) {
          return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }
        
        switch (action) {
          case 'dispatch': {
            incidents[incidentIndex].status = 'dispatched';
            incidents[incidentIndex].dispatchedTo = 'responder_1';
            incidents[incidentIndex].dispatchedAt = new Date().toISOString();
            await fs.writeFile(incidentsFile, JSON.stringify(incidents, null, 2));
            return NextResponse.json({ success: true, message: 'Unit dispatched to incident' });
          }
          case 'update_status': {
            incidents[incidentIndex].status = status;
            incidents[incidentIndex].updatedAt = new Date().toISOString();
            await fs.writeFile(incidentsFile, JSON.stringify(incidents, null, 2));
            return NextResponse.json({ success: true, message: `Incident status updated to ${status}` });
          }
          default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
      } catch (fileError) {
        console.error('File storage also failed:', fileError);
        return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in incident POST handler:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}