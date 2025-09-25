'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Incident } from '@/lib/types';
import { AlertTriangle, Camera as CameraIcon, Shield, Users, Eye, Plus, Settings, Zap, RefreshCw, Bot } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [backgroundMonitorStatus, setBackgroundMonitorStatus] = useState<{
    isActive: boolean;
    lastCheck: Date | null;
    camerasMonitored: number;
  }>({
    isActive: false,
    lastCheck: null,
    camerasMonitored: 0
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.role === 'responder') {
      router.push('/incidents');
      return;
    }

    // Fetch data
    const fetchData = async () => {
      try {
        const [camerasRes, incidentsRes] = await Promise.all([
          fetch('/api/cameras'),
          fetch('/api/incidents')
        ]);

        const camerasData = await camerasRes.json();
        const incidentsData = await incidentsRes.json();

        // Ensure we have valid arrays before processing
        const validCameras = Array.isArray(camerasData) ? camerasData : [];
        const validIncidents = Array.isArray(incidentsData) ? incidentsData : [];

        if (user?.role === 'user') {
          // Filter data for user
          setCameras(validCameras.filter((c: Camera) => c.userId === user.id));
          setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
        } else {
          // Admin sees all
          setCameras(validCameras);
          setIncidents(validIncidents);
        }
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Fetch background monitor status
    const fetchBackgroundStatus = async () => {
      try {
        const response = await fetch('/api/cameras/background-monitor');
        if (response.ok) {
          const data = await response.json();
          setBackgroundMonitorStatus({
            isActive: data.isActive || false,
            lastCheck: data.lastCheck ? new Date(data.lastCheck) : null,
            camerasMonitored: data.camerasMonitored || 0
          });
        }
      } catch (error) {
        console.error('Error fetching background monitor status:', error);
      }
    };

    if (user && user.role !== 'responder' as any) {
      fetchData();
      fetchBackgroundStatus();
    }
  }, [user, isLoading, router]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !user || user.role === 'responder' as any) return;

    const interval = setInterval(async () => {
      try {
        const [camerasRes, incidentsRes] = await Promise.all([
          fetch('/api/cameras'),
          fetch('/api/incidents')
        ]);

        const camerasData = await camerasRes.json();
        const incidentsData = await incidentsRes.json();

        // Ensure we have valid arrays before processing
        const validCameras = Array.isArray(camerasData) ? camerasData : [];
        const validIncidents = Array.isArray(incidentsData) ? incidentsData : [];

        if (user?.role === 'user') {
          setCameras(validCameras.filter((c: Camera) => c.userId === user.id));
          setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
        } else {
          setCameras(validCameras);
          setIncidents(validIncidents);
        }
        setLastUpdate(new Date());

        // Also refresh background monitor status
        const statusRes = await fetch('/api/cameras/background-monitor');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setBackgroundMonitorStatus({
            isActive: statusData.isActive || false,
            lastCheck: statusData.lastCheck ? new Date(statusData.lastCheck) : null,
            camerasMonitored: statusData.camerasMonitored || 0
          });
        }
      } catch (error) {
        console.error('Error during auto-refresh:', error);
        // Try to maintain existing data if fetch fails
      }
    }, 2000); // Refresh every 2 seconds for faster incident detection

    return () => clearInterval(interval);
  }, [autoRefresh, user]);

  const manualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const [camerasRes, incidentsRes] = await Promise.all([
        fetch('/api/cameras'),
        fetch('/api/incidents')
      ]);

      const camerasData = await camerasRes.json();
      const incidentsData = await incidentsRes.json();

      // Ensure we have valid arrays before processing
      const validCameras = Array.isArray(camerasData) ? camerasData : [];
      const validIncidents = Array.isArray(incidentsData) ? incidentsData : [];

      if (user?.role === 'user') {
        setCameras(validCameras.filter((c: Camera) => c.userId === user.id));
        setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
      } else {
        setCameras(validCameras);
        setIncidents(validIncidents);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const simulateDetection = async (cameraId: string) => {
    try {
      const response = await fetch('/api/detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_detection', cameraId })
      });

      const result = await response.json();
      if (result.success && result.detected) {
        alert(`🔥 ${result.message}\nNew incident created and sent to admin: ${result.incident.id}`);
        // Refresh data to show new incident
        window.location.reload();
      } else {
        alert('✅ No fire or smoke detected');
      }
    } catch (error) {
      console.error('Error simulating detection:', error);
      alert('Error simulating detection');
    }
  };

  const simulateIncident = async () => {
    if (cameras.length === 0) {
      alert('❌ Please add at least one camera first to simulate an incident');
      return;
    }

    const onlineCameras = cameras.filter(c => c.status === 'online');
    if (onlineCameras.length === 0) {
      alert('❌ No cameras are online. Please check your camera connections.');
      return;
    }

    // Use a random online camera
    const randomCamera = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];
    
    try {
      const response = await fetch('/api/detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_detection', cameraId: randomCamera.id })
      });

      const result = await response.json();
      if (result.success && result.detected) {
        alert(`🔥 INCIDENT SIMULATED!\n\nCamera: ${randomCamera.name}\nLocation: ${randomCamera.location}\nDetection: ${result.message}\n\n✅ Alert sent to admin panel for emergency response!`);
        // Refresh page to show new incident
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('✅ Simulation complete - No fire or smoke detected this time');
      }
    } catch (error) {
      console.error('Error simulating incident:', error);
      alert('Error simulating incident');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'fire': return 'fire';
      case 'smoke': return 'smoke';
      case 'resolved': return 'safe';
      default: return 'default';
    }
  };

  const stats = {
    totalCameras: cameras.length,
    onlineCameras: cameras.filter(c => c.status === 'online').length,
    totalIncidents: incidents.length,
    activeIncidents: incidents.filter(i => i.status !== 'resolved').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.role === 'admin' ? 'System Dashboard' : 'My Dashboard'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back, {user.name}. Here&apos;s your fire safety overview.
              </p>
            </div>
            
            {/* Status and Controls */}
            <div className="flex flex-col items-end space-y-2">
              {/* Background Monitor Status */}
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border">
                <Bot className="h-4 w-4" />
                <span className="text-sm font-medium">AI Monitor:</span>
                <Badge variant={backgroundMonitorStatus.isActive ? 'safe' : 'destructive'}>
                  {backgroundMonitorStatus.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {backgroundMonitorStatus.camerasMonitored > 0 && (
                  <span className="text-sm text-gray-500">
                    {backgroundMonitorStatus.camerasMonitored} cameras
                  </span>
                )}
              </div>

              {/* Auto-refresh Status */}
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border">
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Auto-refresh:</span>
                <Button
                  size="sm"
                  variant={autoRefresh ? 'default' : 'outline'}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="h-6 px-2 text-xs"
                >
                  {autoRefresh ? 'ON' : 'OFF'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={manualRefresh}
                  disabled={isManualRefreshing}
                  className="h-6 px-2 text-xs"
                >
                  {isManualRefreshing ? 'Refreshing...' : 'Refresh Now'}
                </Button>
                {lastUpdate && (
                  <span className="text-xs text-gray-500">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCameras}</div>
              <p className="text-xs text-muted-foreground">
                {stats.onlineCameras} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeIncidents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalIncidents} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeIncidents === 0 ? 'Safe' : 'Alert'}
              </div>
              <p className="text-xs text-muted-foreground">
                System status
              </p>
            </CardContent>
          </Card>

          {user.role === 'admin' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Active users
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>
                Latest fire and smoke detection events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{incident.address}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(incident.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(incident.type)}>
                        {incident.type}
                      </Badge>
                      {incident.confidence && (
                        <span className="text-sm font-medium">
                          {Math.round(incident.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No incidents detected</p>
                    <p className="text-sm">Your system is secure</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Camera Management - Only for Users */}
          {user?.role === 'user' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Cameras</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => window.location.href = '/cameras'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Camera
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = '/cameras'}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={simulateIncident}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Simulate Incident
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Monitor and control your connected cameras • Background AI monitoring active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cameras.map((camera) => (
                  <div key={camera.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{camera.name}</p>
                          {camera.metadata?.aiMonitoring && (
                            <Badge variant="default" className="text-xs">
                              AI: ON
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{camera.location}</span>
                          {camera.metadata?.lastDetection?.timestamp && (
                            <span>• AI: {new Date(camera.metadata.lastDetection.timestamp).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={camera.status === 'online' ? 'safe' : 'destructive'}>
                        {camera.status}
                      </Badge>
                      {camera.status === 'online' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push('/cameras')}
                          className="ml-2"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Test Detection
                        </Button>
                      )}
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                {cameras.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CameraIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No cameras connected</p>
                    <p className="text-sm mb-4">Add cameras to start monitoring your space</p>
                    <Button 
                      onClick={() => window.location.href = '/cameras'}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Camera
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </main>
    </div>
  );
}