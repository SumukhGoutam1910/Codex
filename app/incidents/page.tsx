'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Incident } from '@/lib/types';
import { AlertTriangle, MapPin, Clock, Camera as CameraIcon, User, CheckCircle, XCircle, Phone, RefreshCw, Shield, Truck } from 'lucide-react';

export default function IncidentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        
        // Ensure we have valid array before processing
        const validIncidents = Array.isArray(data) ? data : [];
        
        if (user?.role === 'user') {
          setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
        } else {
          setIncidents(validIncidents);
        }
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching incidents:', error);
        // Keep existing incidents if fetch fails
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchIncidents();
    }
  }, [user, isLoading, router]);

  // Auto-refresh effect for real-time updates
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        
        const validIncidents = Array.isArray(data) ? data : [];
        
        if (user?.role === 'user') {
          setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
        } else {
          setIncidents(validIncidents);
        }
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) return null;

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
      case 'pending_admin': return 'Pending Review';
      case 'dispatched': return 'Units Dispatched';
      case 'resolved': return 'Resolved';
      case 'false_alarm': return 'False Alarm';
      default: return status;
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true;
    if (filter === 'fire') return incident.type === 'fire';
    if (filter === 'smoke') return incident.type === 'smoke';
    if (filter === 'active') return ['pending_admin', 'dispatched'].includes(incident.status);
    return true;
  });

  const handleResponderAction = async (incidentId: string, action: string) => {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, incidentId })
      });

      if (response.ok) {
        // Refresh incidents to show updated status
        const incidentsResponse = await fetch('/api/incidents');
        const data = await incidentsResponse.json();
        const validIncidents = Array.isArray(data) ? data : [];
        
        if (user?.role === 'user') {
          setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
        } else {
          setIncidents(validIncidents);
        }
        
        console.log(`✅ ${action} action completed for incident ${incidentId}`);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const handleDispatchUnit = async (incidentId: string) => {
    await handleResponderAction(incidentId, 'dispatch');
  };

  const handleMarkFalseAlarm = async (incidentId: string) => {
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
        
        if (user?.role === 'user') {
          setIncidents(validIncidents.filter((i: Incident) => i.userId === user.id));
        } else {
          setIncidents(validIncidents);
        }
        
        console.log(`✅ Incident ${incidentId} marked as false alarm`);
      }
    } catch (error) {
      console.error('Error marking false alarm:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.role === 'responder' ? 'Active Incidents' : 'Incident Management'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {user.role === 'responder' 
                  ? 'Emergency response dashboard for active incidents'
                  : 'Monitor and manage fire safety incidents'
                }
              </p>
            </div>
            
            {/* Auto-refresh Controls */}
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
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'fire', 'smoke'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="capitalize"
              >
                {filterOption === 'all' ? 'All Incidents' : filterOption}
              </Button>
            ))}
          </div>
        </div>

        {/* Incidents Grid */}
        <div className="grid gap-6">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-8 w-8 ${
                      incident.type === 'fire' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <CardTitle className="text-lg">
                        {incident.type === 'fire' ? 'Fire Detected' : 'Smoke Detected'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {incident.confidence ? `Confidence: ${Math.round(incident.confidence * 100)}%` : 'Manual Report'}
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
                      <span>{incident.address}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{new Date(incident.timestamp).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <CameraIcon className="h-4 w-4 text-gray-500" />
                      <span>Camera {incident.cameraId}</span>
                    </div>

                    {user.role !== 'responder' && (
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>User {incident.userId}</span>
                      </div>
                    )}
                  </div>

                  {/* Snapshot Preview */}
                  <div className="flex justify-center">
                    {incident.snapshot ? (
                      <img
                        src={incident.snapshot}
                        alt="Incident snapshot"
                        className="w-32 h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <CameraIcon className="h-8 w-8 text-gray-400" />
                        <span className="sr-only">No snapshot available</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {user.role === 'responder' && incident.status === 'dispatched' && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Responder Actions</h4>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResponderAction(incident.id, 'dispersed')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Dispersed
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResponderAction(incident.id, 'disengaged')}
                            className="text-gray-600 border-gray-600 hover:bg-gray-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Disengage
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResponderAction(incident.id, 'backup')}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Request Backup
                          </Button>
                        </div>
                      </div>
                    )}

                    {user.role === 'admin' && incident.status === 'pending_admin' && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Admin Actions</h4>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm"
                            onClick={() => handleDispatchUnit(incident.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Dispatch Unit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkFalseAlarm(incident.id)}
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark False Alarm
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      <p><strong>Nearest Station:</strong></p>
                      <p>{incident.nearestStation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredIncidents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No incidents found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'all' 
                    ? "There are no incidents to display."
                    : `No incidents match the selected filter: ${filter}`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}