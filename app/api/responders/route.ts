import { NextRequest, NextResponse } from 'next/server';
import { mockResponders } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const available = searchParams.get('available');
  
  let responders = [...mockResponders];
  
  if (status) {
    responders = responders.filter(responder => responder.status === status);
  }
  
  if (available !== null) {
    const isAvailable = available === 'true';
    responders = responders.filter(responder => responder.available === isAvailable);
  }
  
  return NextResponse.json({
    totalUnits: mockResponders.length,
    availableUnits: mockResponders.filter(r => r.available).length,
    respondingUnits: mockResponders.filter(r => r.status === 'responding').length,
    engagedUnits: mockResponders.filter(r => r.status === 'engaged').length,
    responders: responders
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, responderId } = await request.json();

    const responder = mockResponders.find(r => r.id === responderId);
    if (!responder) {
      return NextResponse.json(
        { error: 'Responder not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'mark_available':
        responder.available = true;
        responder.status = 'idle';
        responder.currentIncident = undefined;
        responder.engagedAt = undefined;
        
        return NextResponse.json({
          success: true,
          message: `${responder.unit} marked as available`,
          responder
        });

      case 'mark_unavailable':
        responder.available = false;
        responder.status = 'returning';
        
        return NextResponse.json({
          success: true,
          message: `${responder.unit} marked as unavailable`,
          responder
        });

      case 'get_location':
        // In a real system, this would get GPS location
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
        const { message } = await request.json();
        
        return NextResponse.json({
          success: true,
          message: `Message sent to ${responder.unit}`,
          sentMessage: message,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating responder:', error);
    return NextResponse.json(
      { error: 'Failed to update responder' },
      { status: 500 }
    );
  }
}