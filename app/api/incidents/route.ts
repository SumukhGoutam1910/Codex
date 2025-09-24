import { NextRequest, NextResponse } from 'next/server';
import { mockIncidents, findNearestAvailableResponder, mockResponders } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  
  let incidents = [...mockIncidents];
  
  if (userId) {
    // Filter incidents for specific user
    incidents = incidents.filter(incident => incident.userId === userId);
  }
  
  if (status) {
    incidents = incidents.filter(incident => incident.status === status);
  }
  
  // Sort by timestamp (newest first)
  incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return NextResponse.json(incidents);
}

export async function POST(request: NextRequest) {
  try {
    const { action, incidentId, responderId } = await request.json();
    
    const incident = mockIncidents.find(i => i.id === incidentId);
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'dispatch':
        // Admin dispatches unit to incident
        const responder = responderId 
          ? mockResponders.find(r => r.id === responderId)
          : findNearestAvailableResponder(incident.address);
        
        if (!responder) {
          return NextResponse.json(
            { error: 'No available responders found' },
            { status: 400 }
          );
        }

        if (!responder.available) {
          return NextResponse.json(
            { error: 'Selected responder is not available' },
            { status: 400 }
          );
        }

        // Update incident status
        incident.status = 'dispatched';
        incident.dispatchedTo = responder.id;
        incident.dispatchedAt = new Date().toISOString();

        // Update responder status
        responder.available = false;
        responder.status = 'responding';
        responder.currentIncident = incidentId;

        return NextResponse.json({
          success: true,
          message: `Unit ${responder.unit} dispatched to incident`,
          incident,
          responder
        });

      case 'engage':
        // Responder marks as engaged on scene
        if (incident.status !== 'dispatched') {
          return NextResponse.json(
            { error: 'Incident must be dispatched first' },
            { status: 400 }
          );
        }

        incident.status = 'engaged';
        incident.engagedAt = new Date().toISOString();

        // Update responder status
        const engagedResponder = mockResponders.find(r => r.id === incident.dispatchedTo);
        if (engagedResponder) {
          engagedResponder.status = 'engaged';
          engagedResponder.engagedAt = new Date().toISOString();
        }

        return NextResponse.json({
          success: true,
          message: 'Unit marked as engaged on scene',
          incident
        });

      case 'resolve':
        // Responder marks incident as resolved
        incident.status = 'resolved';
        incident.resolvedAt = new Date().toISOString();

        // Update responder status back to available
        const resolvingResponder = mockResponders.find(r => r.id === incident.dispatchedTo);
        if (resolvingResponder) {
          resolvingResponder.available = true;
          resolvingResponder.status = 'idle';
          resolvingResponder.currentIncident = undefined;
          resolvingResponder.engagedAt = undefined;
        }

        return NextResponse.json({
          success: true,
          message: 'Incident marked as resolved',
          incident
        });

      case 'request_backup':
        // Find another available responder for backup
        const backupResponder = findNearestAvailableResponder(incident.address);
        if (!backupResponder) {
          return NextResponse.json(
            { error: 'No backup units available' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Backup unit ${backupResponder.unit} notified`,
          backupResponder
        });

      case 'false_alarm':
        // Admin marks as false alarm
        incident.status = 'false_alarm';
        
        // If already dispatched, make responder available again
        if (incident.dispatchedTo) {
          const responder = mockResponders.find(r => r.id === incident.dispatchedTo);
          if (responder) {
            responder.available = true;
            responder.status = 'idle';
            responder.currentIncident = undefined;
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Incident marked as false alarm',
          incident
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}