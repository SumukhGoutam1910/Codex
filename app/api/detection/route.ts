import { NextRequest, NextResponse } from 'next/server';


export async function GET() {
  // TODO: Implement detection status using MongoDB data
  return NextResponse.json({ error: 'Detection API not yet implemented with MongoDB' }, { status: 501 });
}


export async function POST(request: NextRequest) {
  // TODO: Implement detection POST actions using MongoDB data
  return NextResponse.json({ error: 'Detection API not yet implemented with MongoDB' }, { status: 501 });
}
