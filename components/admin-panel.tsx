'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Camera, Users, Activity, RefreshCw, Truck, XCircle, Shield, Plus } from 'lucide-react';

interface Detection {
  cameraId: string;
  location: string;
  status: string;
  lastDetection: any;
  detectionHistory: any[];
}

interface AIStatus {
  totalCameras: number;
  activeCameras: number;
  recentDetections: number;
  cameraStatuses: Detection[];
}

export default function AdminPanel() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh effect for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        const [aiResponse, incidentResponse, responderResponse] = await Promise.all([
          fetch('/api/detection'),
          fetch('/api/incidents'),
          fetch('/api/responders')
        ]);

        const aiData = await aiResponse.json();
        const incidentData = await incidentResponse.json();
        const responderData = await responderResponse.json();

        setAiStatus(aiData);
        setIncidents(Array.isArray(incidentData) ? incidentData : incidentData.incidents || []);
        setResponders(responderData.responders || []);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAllData = async () => {
    try {
      const [aiResponse, incidentResponse, responderResponse] = await Promise.all([
        fetch('/api/detection'),
        fetch('/api/incidents'),
        fetch('/api/responders')
      ]);

      const aiData = await aiResponse.json();
      const incidentData = await incidentResponse.json();
      const responderData = await responderResponse.json();

      setAiStatus(aiData);
      setIncidents(Array.isArray(incidentData) ? incidentData : incidentData.incidents || []);
      setResponders(responderData.responders || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dispatchResponder = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: true});
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch', incidentId })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ ${result.message}`);
        fetchAllData(); // Refresh data
      } else {
        console.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error dispatching responder:', error);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  const markAsFalseAlarm = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: true});
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

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Incident ${incidentId} marked as false alarm`);
        fetchAllData();
      } else {
        console.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking false alarm:', error);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  const markAsEngaged = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: true});
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'engage', incidentId })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`🎯 ${result.message}`);
        fetchAllData();
      } else {
        console.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking as engaged:', error);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  const markAsResolved = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: true});
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', incidentId })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ ${result.message}`);
        fetchAllData();
      } else {
        console.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking as resolved:', error);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  const callExtraUnits = async (incidentId: string) => {
    setActionLoading({...actionLoading, [incidentId]: true});
    try {
      // First, find an available responder
      const responderResponse = await fetch('/api/responders?available=true');
      const responderData = await responderResponse.json();
      
      if (responderData.responders && responderData.responders.length > 0) {
        const availableResponder = responderData.responders[0];
        
        // Dispatch the additional unit
        const response = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'dispatch', 
            incidentId, 
            responderId: availableResponder.id 
          })
        });

        const result = await response.json();
        if (result.success) {
          console.log(`🚒 Additional unit dispatched: ${result.message}`);
          fetchAllData();
        } else {
          console.error(`Error: ${result.error}`);
        }
      } else {
        alert('⚠️ No additional units available for dispatch');
      }
    } catch (error) {
      console.error('Error calling extra units:', error);
      alert('Error calling extra units. Please try again.');
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[incidentId];
      setActionLoading(newActionLoading);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading admin panel...</div>;
  }

  const pendingIncidents = incidents.filter(i => i.status === 'pending_admin');
  const dispatchedIncidents = incidents.filter(i => i.status === 'dispatched');
  const engagedIncidents = incidents.filter(i => i.status === 'engaged');
  const falseAlarmIncidents = incidents.filter(i => i.status === 'false_alarm');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">🚨 Admin Control Panel</h1>
            <p className="text-gray-600">Emergency response command center for fire safety incidents</p>
          </div>
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
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAllData}
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

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
            <Camera className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStatus?.activeCameras || 0}</div>
            <p className="text-xs text-gray-500">of {aiStatus?.totalCameras || 0} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingIncidents.length}</div>
            <p className="text-xs text-gray-500">need admin review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Responders</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responders.filter(r => !r.available).length}</div>
            <p className="text-xs text-gray-500">of {responders.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Detections</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStatus?.recentDetections || 0}</div>
            <p className="text-xs text-gray-500">AI detections</p>
          </CardContent>
        </Card>
      </div>

      {/* Incident Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">⏳ Pending Review</CardTitle>
            <CardDescription>{pendingIncidents.length} incidents awaiting admin decision</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingIncidents.map((incident) => (
              <div key={incident.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge variant={incident.type === 'fire' ? 'destructive' : 'secondary'}>
                      {incident.type}
                    </Badge>
                    {incident.confidence && (
                      <span className="text-xs ml-2">{Math.round(incident.confidence * 100)}%</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(incident.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {incident.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={incident.imageUrl} 
                      alt="Incident snapshot" 
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                )}
                <p className="text-sm mb-2">{incident.address}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => dispatchResponder(incident.id)}
                    className="flex-1"
                    disabled={actionLoading[incident.id]}
                  >
                    {actionLoading[incident.id] ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                        Dispatching...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-1" />
                        Dispatch Unit
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => markAsFalseAlarm(incident.id)}
                    disabled={actionLoading[incident.id]}
                  >
                    {actionLoading[incident.id] ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {pendingIncidents.length === 0 && (
              <p className="text-gray-500 text-center py-4">No pending incidents</p>
            )}
          </CardContent>
        </Card>

        {/* Dispatched Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">🚒 Dispatched</CardTitle>
            <CardDescription>{dispatchedIncidents.length} units en route</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dispatchedIncidents.map((incident) => (
              <div key={incident.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={incident.type === 'fire' ? 'destructive' : 'secondary'}>
                    {incident.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Dispatched {new Date(incident.dispatchedAt || incident.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {incident.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={incident.imageUrl} 
                      alt="Incident snapshot" 
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                )}
                <p className="text-sm mb-2">{incident.address}</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => markAsEngaged(incident.id)}
                  className="w-full"
                  disabled={actionLoading[incident.id]}
                >
                  {actionLoading[incident.id] ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-1" />
                      Mark Engaged
                    </>
                  )}
                </Button>
              </div>
            ))}
            {dispatchedIncidents.length === 0 && (
              <p className="text-gray-500 text-center py-4">No dispatched units</p>
            )}
          </CardContent>
        </Card>

        {/* Engaged Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">🎯 On Scene</CardTitle>
            <CardDescription>{engagedIncidents.length} units actively responding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {engagedIncidents.map((incident) => (
              <div key={incident.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.type === 'fire' ? 'destructive' : 'secondary'}>
                      {incident.type}
                    </Badge>
                    {incident.dispatchedUnits && incident.dispatchedUnits.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {incident.dispatchedUnits.length} units
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    On scene {new Date(incident.engagedAt || incident.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {incident.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={incident.imageUrl} 
                      alt="Incident snapshot" 
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                )}
                <p className="text-sm mb-2">{incident.address}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => markAsResolved(incident.id)}
                    disabled={actionLoading[incident.id]}
                  >
                    {actionLoading[incident.id] ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      'Mark Resolved'
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => callExtraUnits(incident.id)}
                    disabled={actionLoading[incident.id]}
                  >
                    {actionLoading[incident.id] ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {engagedIncidents.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active responses</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Responder Status */}
      <Card>
        <CardHeader>
          <CardTitle>🚒 Responder Units</CardTitle>
          <CardDescription>Current status of all emergency response units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responders.map((responder) => (
              <div key={responder.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{responder.unit}</h4>
                  <Badge variant={responder.available ? 'outline' : 'destructive'}>
                    {responder.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{responder.name}</p>
                <p className="text-xs text-gray-500 mb-2">{responder.location}</p>
                <div className="text-xs">
                  <p>Team: {responder.teamSize} members</p>
                  <p>Response: {responder.responseTime}</p>
                  {responder.currentIncident && (
                    <p className="text-orange-600">Incident: {responder.currentIncident}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}