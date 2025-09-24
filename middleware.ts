import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let servicesStarted = false;

export function middleware(request: NextRequest) {
  // Initialize background services on first request
  if (!servicesStarted && request.nextUrl.pathname.startsWith('/api/')) {
    servicesStarted = true;
    
    // Start background services asynchronously
    setTimeout(async () => {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/cameras/background-monitor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });
        console.log('🚀 Background services initialized via middleware');
      } catch (error) {
        console.error('❌ Middleware service initialization error:', error);
      }
    }, 1000);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}