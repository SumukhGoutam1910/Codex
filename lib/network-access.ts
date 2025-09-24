import { useState, useEffect } from 'react';

// Network detection utilities for camera access
export class NetworkAccessManager {
  
  // Check if user is on local network by trying to reach a local IP
  static async isOnLocalNetwork(camera: any): Promise<boolean> {
    try {
      if (!camera.networkAccess?.localIP) return false;
      
      // Try to reach the camera directly on local network
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`/api/cameras/${camera._id}/test-local`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get the appropriate stream URL based on network location
  static async getBestStreamUrl(camera: any): Promise<string> {
    const isLocal = await this.isOnLocalNetwork(camera);
    
    if (isLocal) {
      console.log(`Using local network access for ${camera.name}`);
      return camera.streamUrl;
    } else {
      console.log(`Using remote network access for ${camera.name}`);
      return camera.remoteStreamUrl || camera.streamUrl;
    }
  }

  // Check if remote access is configured
  static hasRemoteAccess(camera: any): boolean {
    return !!(
      camera.remoteStreamUrl || 
      (camera.networkAccess?.externalURL && camera.networkAccess?.portForwarding)
    );
  }

  // Get network status for display
  static getNetworkStatus(camera: any): {
    localReady: boolean;
    remoteReady: boolean;
    aiReady: boolean;
  } {
    return {
      localReady: !!camera.streamUrl,
      remoteReady: this.hasRemoteAccess(camera),
      aiReady: !!camera.metadata?.aiMonitoring,
    };
  }

  // Generate remote URL from network settings if not explicitly set
  static generateRemoteUrl(camera: any): string | null {
    if (camera.remoteStreamUrl) {
      return camera.remoteStreamUrl;
    }

    if (camera.networkAccess?.externalURL && camera.networkAccess?.portForwarding) {
      try {
        const localUrl = new URL(camera.streamUrl);
        const externalPort = camera.networkAccess.portForwarding.externalPort;
        const protocol = localUrl.protocol;
        
        return `${protocol}//${camera.networkAccess.externalURL}:${externalPort}${localUrl.pathname}`;
      } catch {
        return null;
      }
    }

    return null;
  }
}

// Hook for React components
export function useNetworkAccess(camera: any) {
  const [networkStatus, setNetworkStatus] = useState({
    isLocal: false,
    isChecking: true,
    bestUrl: camera.streamUrl,
  });

  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      if (!camera) return;

      try {
        const isLocal = await NetworkAccessManager.isOnLocalNetwork(camera);
        const bestUrl = await NetworkAccessManager.getBestStreamUrl(camera);

        if (mounted) {
          setNetworkStatus({
            isLocal,
            isChecking: false,
            bestUrl,
          });
        }
      } catch {
        if (mounted) {
          setNetworkStatus({
            isLocal: false,
            isChecking: false,
            bestUrl: camera.streamUrl,
          });
        }
      }
    };

    checkNetwork();

    return () => {
      mounted = false;
    };
  }, [camera]);

  return networkStatus;
}