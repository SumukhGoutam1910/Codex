'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera } from '@/lib/types';
import { Camera as CameraIcon, MapPin, Monitor, Plus, Settings, Eye, EyeOff, Globe } from 'lucide-react';
import IPCameraSetup from '@/components/real-bluetooth-scanner';

export default function CamerasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRealScanner, setShowRealScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    // Allow both users and admins, but with different access levels
    if (user && user.role === 'responder') {
      router.push('/dashboard');
      return;
    }

    const fetchCameras = async () => {
      try {
        // For users, fetch only their cameras. For admins, fetch all cameras for system overview
        const url = user?.role === 'user' ? `/api/cameras?userId=${user.id}` : '/api/cameras';
        const response = await fetch(url);
        const data = await response.json();
        setCameras(data);
      } catch (error) {
        console.error('Error fetching cameras:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === 'admin' || user.role === 'user')) {
      fetchCameras();
    }
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'user')) return null;

  const handleAddCamera = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCamera = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      rtspUrl: formData.get('rtspUrl') as string,
      fullAddress: formData.get('location') as string, // Use location as address
      userId: user.id, // Add current user's ID
    };

    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCamera),
      });

      if (response.ok) {
        // In a real app, you'd fetch the updated list or add the new camera to state
        setShowAddForm(false);
        // Reset form
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error adding camera:', error);
    }
  };

  const onlineCameras = cameras.filter(c => c.status === 'online').length;
  const offlineCameras = cameras.filter(c => c.status === 'offline').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {user.role === 'user' ? 'My Cameras' : 'Camera Management'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {user.role === 'user' 
                ? 'Add and manage your personal cameras for fire detection'
                : 'System overview of all registered cameras'
              }
            </p>
          </div>
          {user.role === 'user' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Camera Manually
              </Button>
              <Button 
                onClick={() => setShowRealScanner(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add IP Camera
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cameras.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineCameras}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <EyeOff className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{offlineCameras}</div>
            </CardContent>
          </Card>
        </div>

        {/* IP Camera Setup Only */}
        {showRealScanner && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add IP Camera</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowRealScanner(false)}
              >
                Close
              </Button>
            </div>
            <IPCameraSetup />
          </div>
        )}

        {/* Add Camera Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Camera</CardTitle>
              <CardDescription>
                Register a new camera to the monitoring system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCamera} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Camera Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Office Camera 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location *
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Office Building, Floor 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="rtspUrl" className="text-sm font-medium">
                    RTSP URL *
                  </label>
                  <input
                    id="rtspUrl"
                    name="rtspUrl"
                    type="text"
                    placeholder="rtsp://192.168.1.100:554/stream"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex space-x-4">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    Add Camera
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Cameras Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Cameras</CardTitle>
            <CardDescription>
              All cameras currently registered in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cameras.map((camera) => (
                <div key={camera.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{camera.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {camera.location}
                        </span>
                        <span className="flex items-center">
                          <Monitor className="h-3 w-3 mr-1" />
                          {camera.rtspUrl}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={camera.status === 'online' ? 'safe' : 'destructive'}
                    >
                      {camera.status}
                    </Badge>
                    
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {cameras.length === 0 && (
                <div className="text-center py-12">
                  <CameraIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No cameras registered
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Get started by adding your first camera to the system.
                  </p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Camera
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Section - Only for Users (IP Cameras Only) */}
        {user?.role === 'user' && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IP Camera Setup - Privacy Protected
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 dark:text-blue-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-semibold mb-2">🌐 Getting Started</h5>
                  <ul className="space-y-1">
                    <li>• Locate camera IP in your router devices list</li>
                    <li>• Confirm RTSP stream capability (most support)</li>
                    <li>• Copy the correct RTSP URL pattern</li>
                    <li>• Use Test Connection before saving</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">🔐 Privacy & Control</h5>
                  <ul className="space-y-1">
                    <li>• Direct local/network connection only</li>
                    <li>• No cloud video storage performed</li>
                    <li>• Admins only receive incident alerts</li>
                    <li>• You can remove cameras anytime</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                <p className="text-sm"><strong>Tip:</strong> Typical RTSP formats:
                  <br />• Hikvision: rtsp://user:pass@IP:554/Streaming/Channels/101
                  <br />• Dahua: rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=0
                  <br />• Generic: rtsp://user:pass@IP:554/stream
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRealScanner(true)}
                >
                  Add Another IP Camera
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}