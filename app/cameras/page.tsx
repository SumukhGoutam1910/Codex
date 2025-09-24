'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Live Feed Player component for modal
function LiveFeedPlayer({ cameraId }: { cameraId: string }) {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const handleLoad = () => {
    setLoading(false);
    setError('');
  };

  const handleError = () => {
    setError('Unable to load live feed');
    setLoading(false);
  };

  return (
    <div className="relative w-full h-[480px] bg-black rounded border">
      {/* Live indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
        LIVE
      </div>
      
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-lg">🔴 Connecting to Live Feed...</p>
            <p className="text-sm text-gray-400 mt-1">Establishing secure connection</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-red-400 text-center">
            <p>❌ Live Feed Unavailable</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              onClick={() => {
                setError('');
                setLoading(true);
                // Force reload by changing src
                const img = document.querySelector(`img[data-camera-id="${cameraId}"]`) as HTMLImageElement;
                if (img) {
                  img.src = `/api/cameras/${cameraId}/live?t=${Date.now()}`;
                }
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* MJPEG stream using img tag - perfect for live camera feeds */}
          <img
            src={`/api/cameras/${cameraId}/live`}
            alt="Live Camera Feed"
            data-camera-id={cameraId}
            className="w-full h-full object-cover rounded border"
            style={{ background: 'black' }}
            onLoad={handleLoad}
            onError={handleError}
          />
        </>
      )}
      
      {!error && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button 
            onClick={() => {
              const img = document.querySelector(`img[data-camera-id="${cameraId}"]`) as HTMLImageElement;
              if (img && img.requestFullscreen) {
                img.requestFullscreen();
              }
            }}
            className="bg-black/60 text-white p-2 rounded hover:bg-black/80 text-sm"
            title="Fullscreen"
          >
            ⛶
          </button>
          <button 
            onClick={() => {
              window.open(`/api/cameras/${cameraId}/live`, '_blank');
            }}
            className="bg-black/60 text-white p-2 rounded hover:bg-black/80 text-sm"
            title="Open in New Tab"
          >
            ↗
          </button>
        </div>
      )}
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera } from '@/lib/types';
import { Camera as CameraIcon, MapPin, Monitor, Plus, Settings, Eye, EyeOff, Globe, Zap } from 'lucide-react';
import IPCameraSetup from '@/components/real-bluetooth-scanner';

export default function CamerasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRealScanner, setShowRealScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [viewFeedCamera, setViewFeedCamera] = useState<Camera | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testStatus, setTestStatus] = useState<{ [id: string]: string }>({});
  const [testLoading, setTestLoading] = useState<{ [id: string]: boolean }>({});
  const [pendingBypass, setPendingBypass] = useState<{ [id: string]: boolean }>({});
  // Test Detection handler
  const handleTestDetection = async (cameraIdRaw: string | undefined, insecure?: boolean) => {
    const cameraId = cameraIdRaw || '';
    if (!cameraId) return;
    setTestLoading((prev) => ({ ...prev, [cameraId]: true }));
    setTestStatus((prev) => ({ ...prev, [cameraId]: '' }));
    setPendingBypass((prev) => ({ ...prev, [cameraId]: false }));
    try {
      const url = `/api/cameras/${cameraId}/test${insecure ? '?insecure=1' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTestStatus((prev) => ({ ...prev, [cameraId]: '✅ Feed reachable!' }));
      } else {
        const sslError =
          (data.error &&
            (data.error.includes('self-signed certificate') ||
             data.error.includes('unable to verify the first certificate')));
        if (sslError && !insecure) {
          setPendingBypass((prev) => ({ ...prev, [cameraId]: true }));
          setTestStatus((prev) => ({ ...prev, [cameraId]: `❌ SSL certificate error. Click BYPASS to ignore.` }));
        } else {
          setTestStatus((prev) => ({ ...prev, [cameraId]: `❌ ${data.message || data.error || 'Feed not reachable'}` }));
        }
      }
    } catch (err: any) {
      setTestStatus((prev) => ({ ...prev, [cameraId]: '❌ Error testing feed' }));
    } finally {
      setTestLoading((prev) => ({ ...prev, [cameraId]: false }));
    }
  };

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

  const openEditModal = (camera: Camera) => {
  setEditingCamera(camera);
  setEditName(camera.name);
  setEditUrl(camera.streamUrl);
  setErrorMsg('');
  };

  const closeEditModal = () => {
    setEditingCamera(null);
    setEditName('');
    setEditUrl('');
    setEditLoading(false);
    setDeleteLoading(false);
    setErrorMsg('');
  };

  const handleEditSave = async () => {
    if (!editingCamera) return;
    setEditLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/cameras/${editingCamera._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, streamUrl: editUrl }),
      });
      if (!response.ok) throw new Error('Failed to update camera');
      // Refresh camera list
      const url = user?.role === 'user' ? `/api/cameras?userId=${user.id}` : '/api/cameras';
      const data = await (await fetch(url)).json();
      setCameras(data);
      closeEditModal();
    } catch (err) {
      setErrorMsg('Failed to update camera.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCamera) return;
    setDeleteLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/cameras/${editingCamera._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete camera');
      // Refresh camera list
      const url = user?.role === 'user' ? `/api/cameras?userId=${user.id}` : '/api/cameras';
      const data = await (await fetch(url)).json();
      setCameras(data);
      closeEditModal();
    } catch (err) {
      setErrorMsg('Failed to delete camera.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddCamera = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCamera = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      streamUrl: formData.get('streamUrl') as string,
      fullAddress: formData.get('location') as string, // Use location as address
      userId: user?.id, // Add current user's ID
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
        setShowAddForm(false);
        (e.target as HTMLFormElement).reset();
        // Refresh camera list
        const url = user?.role === 'user' ? `/api/cameras?userId=${user.id}` : '/api/cameras';
        const data = await (await fetch(url)).json();
        setCameras(data);
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
              {user?.role === 'user' ? 'My Cameras' : 'Camera Management'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {user?.role === 'user' 
                ? 'Add and manage your personal cameras for fire detection'
                : 'System overview of all registered cameras'
              }
            </p>
          </div>
          {user?.role === 'user' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Camera Manually
              </Button>
              <Button 
                onClick={() => setShowAddForm(true)}
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
                  <label htmlFor="streamUrl" className="text-sm font-medium">
                    Camera Stream URL *
                  </label>
                  <input
                    id="streamUrl"
                    name="streamUrl"
                    type="text"
                    placeholder="e.g. http://192.168.1.100:8080/stream or rtsp://..."
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
                <div key={camera._id} className="flex items-center justify-between p-4 border rounded-lg">
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
                          {camera.streamUrl}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={camera.status === 'online' ? 'safe' : 'destructive'}
                      >
                        {camera.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestDetection(camera._id || camera.id)}
                        disabled={testLoading[(camera._id || camera.id) ?? '']}
                        className="flex items-center gap-1"
                      >
                        <Zap className="h-4 w-4" />
                        {testLoading[(camera._id || camera.id) ?? ''] ? 'Testing...' : 'Test Detection'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => setViewFeedCamera(camera)}
                      >
                        <Eye className="h-4 w-4" />
                        View Feed
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(camera)}>
                        <Settings className="h-4 w-4" />
                      </Button>
        {/* Live Feed Modal (HLS) */}
        {viewFeedCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-full max-w-2xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl"
                onClick={() => setViewFeedCamera(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-2">Live Feed: {viewFeedCamera.name}</h2>
              {viewFeedCamera._id || viewFeedCamera.id ? (
                <LiveFeedPlayer cameraId={String(viewFeedCamera._id || viewFeedCamera.id)} />
              ) : (
                <div className="text-red-600">Camera ID missing</div>
              )}
            </div>
          </div>
        )}
                    </div>
                    {((camera._id || camera.id) && testStatus[(camera._id || camera.id) ?? '']) && (
                      <>
                        {pendingBypass[(camera._id || camera.id) ?? ''] ? (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mt-2 flex items-center gap-2">
                            <span>SSL certificate error. This feed uses a self-signed or invalid certificate.</span>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                              onClick={() => handleTestDetection(camera._id || camera.id, true)}
                            >
                              BYPASS
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs mt-1 ml-2" style={{ color: testStatus[(camera._id || camera.id) ?? ''].startsWith('✅') ? 'green' : 'red' }}>
                            {testStatus[(camera._id || camera.id) ?? '']}
                          </div>
                        )}
                      </>
                    )}
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

        {/* Camera Edit/Delete Modal */}
        {editingCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Camera</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={editLoading || deleteLoading}
                />
                <label className="block text-sm font-medium">RTSP URL</label>
                <input
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  disabled={editLoading || deleteLoading}
                  placeholder="e.g. http://192.168.1.100:8080/stream or rtsp://..."
                />
                {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleEditSave} disabled={editLoading || deleteLoading} className="bg-red-600 hover:bg-red-700">
                    {editLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={closeEditModal} variant="outline" disabled={editLoading || deleteLoading}>Cancel</Button>
                  <Button onClick={handleDelete} variant="destructive" disabled={editLoading || deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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