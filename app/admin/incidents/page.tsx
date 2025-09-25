'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Incident } from '@/lib/types';
import { AlertTriangle, MapPin, Clock, Camera as CameraIcon, User, CheckCircle, XCircle, Truck, RefreshCw, Shield } from 'lucide-react';

export default function AdminIncidentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        
        // Ensure we have valid array before processing
        const validIncidents = Array.isArray(data) ? data : [];
        setIncidents(validIncidents);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchIncidents();
    }
  }, [user, isLoading, router]);

  // Auto-refresh effect for real-time updates
  useEffect(() => {
    if (!autoRefresh || !user || user.role !== 'admin') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        
        const validIncidents = Array.isArray(data) ? data : [];
        setIncidents(validIncidents);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, user]);

  const handleDispatchUnit = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: 'dispatching'});
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch', incidentId })
      });

      if (response.ok) {
        // Refresh incidents to show updated status
        const incidentsResponse = await fetch('/api/incidents');
        const data = await incidentsResponse.json();
        const validIncidents = Array.isArray(data) ? data : [];
        setIncidents(validIncidents);
        
        console.log(`✅ Unit dispatched to incident ${incidentId}`);
      }
    } catch (error) {
      console.error('Error dispatching unit:', error);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  const handleMarkFalseAlarm = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: 'marking_false'});
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_status', 
          incidentId, 
          status: 'false_alarm' 
        })
      });

      if (response.ok) {
        // Refresh incidents
        const incidentsResponse = await fetch('/api/incidents');
        const data = await incidentsResponse.json();
        const validIncidents = Array.isArray(data) ? data : [];
        setIncidents(validIncidents);
        
        console.log(`✅ Incident ${incidentId} marked as false alarm`);
      }
    } catch (error) {
      console.error('Error marking false alarm:', error);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  const manualRefresh = async () => {
    try {
      const response = await fetch('/api/incidents');
      const data = await response.json();
      const validIncidents = Array.isArray(data) ? data : [];
      setIncidents(validIncidents);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error during manual refresh:', error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending_admin': return 'smoke';
      case 'dispatched': return 'fire';
      case 'resolved': return 'safe';
      case 'false_alarm': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_admin': return 'Pending Action';
      case 'dispatched': return 'Units Dispatched';
      case 'resolved': return 'Resolved';
      case 'false_alarm': return 'False Alarm';
      default: return status;
    }
  };

  const pendingIncidents = incidents.filter(i => i.status === 'pending_admin');
  const activeIncidents = incidents.filter(i => i.status === 'dispatched');
  const recentIncidents = incidents.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🚨 Emergency Response Control Panel
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Admin dashboard for incident management and emergency response coordination
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
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
                  className="h-6 px-2 text-xs"
                >
                  Refresh Now
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Pending Action</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{pendingIncidents.length}</div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Incidents</CardTitle>
              <Truck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{activeIncidents.length}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Units dispatched
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Today</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{incidents.length}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                All incidents
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Response Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {incidents.length > 0 ? Math.round(((incidents.length - pendingIncidents.length) / incidents.length) * 100) : 0}%
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Incidents addressed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <div className="grid gap-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Incidents ({recentIncidents.length})
          </h2>
          
          {recentIncidents.map((incident) => (
            <Card key={incident.id} className="overflow-hidden">
              <CardHeader className={`${
                incident.status === 'pending_admin' 
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-8 w-8 ${
                      incident.type === 'fire' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <CardTitle className="text-lg">
                        {incident.type === 'fire' ? '🔥 Fire Detected' : '💨 Smoke Detected'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ID: {incident.id} | Confidence: {incident.confidence ? `${Math.round(incident.confidence * 100)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(incident.status)}>
                    {getStatusLabel(incident.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Incident Details */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{incident.address}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{new Date(incident.timestamp).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <CameraIcon className="h-4 w-4 text-gray-500" />
                      <span>Camera {incident.cameraId}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>User {incident.userId}</span>
                    </div>
                  </div>

                  {/* Snapshot Preview */}
                  <div className="flex justify-center">
                    {incident.snapshot ? (
                      <img
                        src={incident.snapshot}
                        alt="Incident snapshot"
                        className="w-48 h-36 object-cover rounded-lg border shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-48 h-36 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <CameraIcon className="h-12 w-12 text-gray-400" />
                        <span className="sr-only">No snapshot available</span>
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-4">
                    {incident.status === 'pending_admin' && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-red-700 dark:text-red-300">🚨 URGENT ACTION REQUIRED</h4>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm"
                            onClick={() => handleDispatchUnit(incident.id)}
                            disabled={actionLoading[incident.id] === 'dispatching'}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            {actionLoading[incident.id] === 'dispatching' ? 'Dispatching...' : 'Dispatch Emergency Unit'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkFalseAlarm(incident.id)}
                            disabled={actionLoading[incident.id] === 'marking_false'}
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {actionLoading[incident.id] === 'marking_false' ? 'Marking...' : 'Mark as False Alarm'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {incident.status === 'dispatched' && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-orange-700 dark:text-orange-300">✅ Unit Dispatched</h4>
                        <p className="text-sm text-gray-600">Emergency response team is en route</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Dispatched:</strong> {incident.dispatchedAt ? new Date(incident.dispatchedAt).toLocaleString() : 'Just now'}</p>
                        </div>
                      </div>
                    )}

                    {incident.status === 'false_alarm' && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-600">❌ False Alarm</h4>
                        <p className="text-sm text-gray-500">Incident has been marked as false alarm</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <p><strong>Nearest Station:</strong> {incident.nearestStation}</p>
                      {incident.priority && (
                        <p><strong>Priority:</strong> <span className={incident.priority === 'high' ? 'text-red-600' : 'text-yellow-600'}>{incident.priority.toUpperCase()}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {recentIncidents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No incidents reported
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  The system is monitoring all cameras for fire and smoke detection.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
