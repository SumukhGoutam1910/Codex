import { NextRequest, NextResponse } from 'next/server';

// Background service initializer
export async function GET(request: NextRequest) {
  try {
    // Initialize background monitoring service
    const monitorResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cameras/background-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });

    let monitorResult = { status: 'unknown' };
    if (monitorResponse.ok) {
      monitorResult = await monitorResponse.json();
    }

    return NextResponse.json({
      success: true,
      services: {
        backgroundMonitor: monitorResult
      },
      message: 'Background services initialized'
    });
  } catch (error) {
    console.error('Error initializing background services:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize background services'
    }, { status: 500 });
  }
}