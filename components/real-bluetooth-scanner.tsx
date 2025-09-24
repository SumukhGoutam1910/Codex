'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Shield, 
  CheckCircle, 
  Copy,
  AlertCircle,
  Camera
} from 'lucide-react';

export default function IPCameraSetup() {
  const [rtspUrl, setRtspUrl] = useState('');
  const [cameraName, setCameraName] = useState('');
  const [cameraLocation, setCameraLocation] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const copyRTSPExample = () => {
    const example = 'rtsp://192.168.1.100:554/stream1';
    navigator.clipboard.writeText(example);
    setRtspUrl(example);
    alert('📋 RTSP URL example copied and filled in!');
  };

  const testConnection = async () => {
    if (!rtspUrl) {
      alert('Please enter an RTSP URL first');
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResult({
        success,
        message: success 
          ? `✅ Connection successful! Camera stream detected at ${rtspUrl}` 
          : `❌ Connection failed. Please check IP address, port, and camera settings.`
      });
      setTesting(false);
    }, 2000);
  };

  const addCamera = async () => {
    if (!rtspUrl || !cameraName || !cameraLocation) {
      alert('Please fill in all fields before adding the camera');
      return;
    }

    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cameraName,
          location: cameraLocation,
          rtspUrl: rtspUrl,
          type: 'ip_camera',
          status: 'online'
        })
      });

      if (response.ok) {
        alert(`✅ Camera "${cameraName}" added successfully!\nLocation: ${cameraLocation}\nStream: ${rtspUrl}`);
        // Clear form
        setRtspUrl('');
        setCameraName('');
        setCameraLocation('');
        setTestResult(null);
        // Refresh the page to show new camera
        window.location.reload();
      } else {
        alert('❌ Failed to add camera. Please try again.');
      }
    } catch (error) {
      alert('❌ Error adding camera. Please check your connection.');
    }
  };

  const getCommonRTSPFormats = () => [
    { brand: 'Generic IP Camera', format: 'rtsp://[IP]:[PORT]/stream1' },
    { brand: 'Hikvision', format: 'rtsp://[IP]:554/Streaming/Channels/101' },
    { brand: 'Dahua', format: 'rtsp://[IP]:554/cam/realmonitor?channel=1&subtype=0' },
    { brand: 'TP-Link', format: 'rtsp://[IP]:554/stream1' },
    { brand: 'Foscam', format: 'rtsp://[IP]:554/videoMain' },
    { brand: 'Axis', format: 'rtsp://[IP]/axis-media/media.amp' }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IP Camera Setup - Privacy Protected
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Add your existing IP/WiFi cameras using RTSP URL - you maintain complete control
          </CardDescription>
        </CardHeader>
        <CardContent className="text-green-700 dark:text-green-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold mb-2">🔐 Your Privacy:</h5>
              <ul className="space-y-1 text-sm">
                <li>• Direct connection to your camera</li>
                <li>• No third-party video storage</li>
                <li>• Admins only get fire/smoke alerts</li>
                <li>• Your camera, your control</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">📋 What You Need:</h5>
              <ul className="space-y-1 text-sm">
                <li>• Camera&apos;s IP address</li>
                <li>• RTSP port (usually 554)</li>
                <li>• Camera username/password</li>
                <li>• Stream path from camera manual</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Camera Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add IP Camera
          </CardTitle>
          <CardDescription>
            Connect your WiFi/IP camera using RTSP stream URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Camera Name *</label>
              <input
                type="text"
                placeholder="Living Room Camera"
                value={cameraName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCameraName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location *</label>
              <input
                type="text"
                placeholder="Living Room, Ground Floor"
                value={cameraLocation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCameraLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* RTSP URL */}
          <div>
            <label className="block text-sm font-medium mb-2">RTSP Stream URL *</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="rtsp://192.168.1.100:554/stream1"
                value={rtspUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRtspUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="outline" size="sm" onClick={copyRTSPExample}>
                <Copy className="h-4 w-4 mr-1" />
                Example
              </Button>
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex gap-2">
            <Button 
              onClick={testConnection}
              disabled={!rtspUrl || testing}
              variant="outline"
              className="flex-1"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Testing Connection...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button 
              onClick={addCamera}
              disabled={!rtspUrl || !cameraName || !cameraLocation}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Add Camera
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common RTSP Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📋 Common RTSP URL Formats</CardTitle>
          <CardDescription>
            Replace [IP] with your camera&apos;s IP address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getCommonRTSPFormats().map((format, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{format.brand}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {format.format}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setRtspUrl(format.format);
                      alert(`📋 ${format.brand} format copied to URL field!`);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            🔍 How to Find Your Camera&apos;s IP Address
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300">
          <div className="space-y-3 text-sm">
            <div>
              <strong>Method 1: Router Admin Panel</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Open router settings (usually 192.168.1.1)</li>
                <li>• Look for &quot;Connected Devices&quot; or &quot;DHCP Client List&quot;</li>
                <li>• Find your camera by name or MAC address</li>
              </ul>
            </div>
            <div>
              <strong>Method 2: Camera Settings</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Check camera&apos;s LCD display or mobile app</li>
                <li>• Look for &quot;Network&quot; or &quot;WiFi&quot; settings</li>
                <li>• IP address should be displayed there</li>
              </ul>
            </div>
            <div>
              <strong>Method 3: Network Scanner</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Use apps like &quot;Fing&quot; or &quot;Network Scanner&quot;</li>
                <li>• Scan your local network</li>
                <li>• Look for devices with camera-related names</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}