    // Background service initializer
// This ensures camera monitoring starts when the Next.js server starts

let backgroundMonitorInitialized = false;

export async function initializeBackgroundServices() {
  if (backgroundMonitorInitialized) {
    console.log('📊 Background services already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing background camera monitoring service...');
    
    // Start the background monitor
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cameras/background-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });

    if (response.ok) {
      backgroundMonitorInitialized = true;
      console.log('✅ Background camera monitoring service started');
    } else {
      console.error('❌ Failed to start background camera monitoring');
    }
  } catch (error) {
    console.error('❌ Error initializing background services:', error);
  }
}

// Auto-initialize when this module is loaded
if (typeof window === 'undefined') {
  // Only run on server side
  setTimeout(() => {
    initializeBackgroundServices();
  }, 2000); // Wait 2 seconds for server to be ready
}