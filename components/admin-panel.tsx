'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Camera, Users, Activity } from 'lucide-react';

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

  useEffect(() => {
    fetchAllData();
  }, []);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dispatchResponder = async (incidentId: string) => {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch', incidentId })
      });

      const result = await response.json();
      if (result.success) {
        alert(`🚒 ${result.message}`);
        fetchAllData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error dispatching responder:', error);
    }
  };

  const markAsEngaged = async (incidentId: string) => {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'engage', incidentId })
      });

      const result = await response.json();
      if (result.success) {
        alert(`🎯 ${result.message}`);
        fetchAllData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking as engaged:', error);
    }
  };

  const markAsResolved = async (incidentId: string) => {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', incidentId })
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ ${result.message}`);
        fetchAllData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading admin panel...</div>;
  }

  const pendingIncidents = incidents.filter(i => i.status === 'pending');
  const dispatchedIncidents = incidents.filter(i => i.status === 'dispatched');
  const engagedIncidents = incidents.filter(i => i.status === 'engaged');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Admin Control Panel</h1>
          <p className="text-gray-600">Manage AI detection, incidents, and emergency response</p>
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
                <p className="text-sm mb-2">{incident.address}</p>
                <Button 
                  size="sm" 
                  onClick={() => dispatchResponder(incident.id)}
                  className="w-full"
                >
                  Dispatch Unit
                </Button>
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
                <p className="text-sm mb-2">{incident.address}</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => markAsEngaged(incident.id)}
                  className="w-full"
                >
                  Mark Engaged
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
                  <Badge variant={incident.type === 'fire' ? 'destructive' : 'secondary'}>
                    {incident.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    On scene {new Date(incident.engagedAt || incident.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mb-2">{incident.address}</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => markAsResolved(incident.id)}
                  className="w-full bg-green-50"
                >
                  Mark Resolved
                </Button>
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