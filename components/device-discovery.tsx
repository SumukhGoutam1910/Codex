'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Wifi, 
  Bluetooth, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Camera,
  QrCode,
  Router,
  Laptop
} from 'lucide-react';

interface DiscoveredDevice {
  id: string;
  name: string;
  type: 'mobile_phone' | 'ip_camera' | 'laptop_webcam' | 'smart_camera';
  connectionMethod: 'bluetooth' | 'wifi' | 'qr_code' | 'network_scan';
  signal: 'excellent' | 'good' | 'fair' | 'poor';
  location?: string;
  ipAddress?: string;
  paired?: boolean;
}

const mockDevices: DiscoveredDevice[] = [
  {
    id: 'phone_001',
    name: "Rohit's iPhone",
    type: 'mobile_phone',
    connectionMethod: 'bluetooth',
    signal: 'excellent',
    location: 'Living Room',
    paired: false
  },
  {
    id: 'phone_002', 
    name: "Priya's Samsung Galaxy",
    type: 'mobile_phone',
    connectionMethod: 'wifi',
    signal: 'good',
    location: 'Kitchen',
    ipAddress: '192.168.1.105',
    paired: false
  },
  {
    id: 'cam_001',
    name: 'TP-Link Security Cam',
    type: 'ip_camera',
    connectionMethod: 'network_scan',
    signal: 'good',
    location: 'Front Door',
    ipAddress: '192.168.1.108',
    paired: false
  },
  {
    id: 'laptop_001',
    name: 'Office Laptop Webcam',
    type: 'laptop_webcam',
    connectionMethod: 'wifi',
    signal: 'excellent',
    location: 'Office Desk',
    ipAddress: '192.168.1.112',
    paired: false
  }
];

export default function DeviceDiscovery() {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState<'auto' | 'bluetooth' | 'wifi' | 'qr'>('auto');
  const [showQrScanner, setShowQrScanner] = useState(false);

  const startDeviceScan = () => {
    setScanning(true);
    setDevices([]);
    
    // Simulate device discovery
    setTimeout(() => {
      setDevices([mockDevices[0]]); // First device appears
    }, 1000);
    
    setTimeout(() => {
      setDevices(prev => [...prev, mockDevices[1]]); // Second device
    }, 2500);
    
    setTimeout(() => {
      setDevices(prev => [...prev, mockDevices[2], mockDevices[3]]); // Rest appear
      setScanning(false);
    }, 4000);
  };

  const connectDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    // Update device as paired
    setDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, paired: true } : d
    ));

    // Simulate adding to camera system
    const cameraData = {
      name: device.name,
      location: device.location || 'Unknown Location',
      deviceType: device.type,
      connectionMethod: device.connectionMethod,
      rtspUrl: generateRtspUrl(device)
    };

    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cameraData)
      });

      if (response.ok) {
        alert(`✅ ${device.name} successfully added to monitoring network!`);
      }
    } catch (error) {
      console.error('Error adding camera:', error);
      alert('Error connecting device. Please try again.');
    }
  };

  const generateRtspUrl = (device: DiscoveredDevice): string => {
    switch (device.type) {
      case 'mobile_phone':
        return `camdroid://${device.ipAddress || 'mobile'}:8080/video`;
      case 'ip_camera':
        return `rtsp://${device.ipAddress}:554/stream1`;
      case 'laptop_webcam':
        return `http://${device.ipAddress}:8081/webcam/stream`;
      default:
        return `rtsp://${device.ipAddress || '192.168.1.100'}:554/stream`;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile_phone': return <Smartphone className="h-5 w-5" />;
      case 'ip_camera': return <Camera className="h-5 w-5" />;
      case 'laptop_webcam': return <Laptop className="h-5 w-5" />;
      default: return <Camera className="h-5 w-5" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionMethodIcon = (method: string) => {
    switch (method) {
      case 'bluetooth': return <Bluetooth className="h-4 w-4" />;
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'qr_code': return <QrCode className="h-4 w-4" />;
      case 'network_scan': return <Router className="h-4 w-4" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scan Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Device Discovery
          </CardTitle>
          <CardDescription>
            Find and connect cameras using simple, tech-free methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button
              variant={scanMethod === 'auto' ? 'default' : 'outline'}
              onClick={() => setScanMethod('auto')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <Search className="h-6 w-6 mb-2" />
              <span className="text-sm">Auto Scan</span>
            </Button>
            
            <Button
              variant={scanMethod === 'bluetooth' ? 'default' : 'outline'}
              onClick={() => setScanMethod('bluetooth')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <Bluetooth className="h-6 w-6 mb-2" />
              <span className="text-sm">Bluetooth</span>
            </Button>
            
            <Button
              variant={scanMethod === 'wifi' ? 'default' : 'outline'}
              onClick={() => setScanMethod('wifi')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <Wifi className="h-6 w-6 mb-2" />
              <span className="text-sm">WiFi Network</span>
            </Button>
            
            <Button
              variant={scanMethod === 'qr' ? 'default' : 'outline'}
              onClick={() => setShowQrScanner(true)}
              className="flex flex-col items-center p-4 h-auto"
            >
              <QrCode className="h-6 w-6 mb-2" />
              <span className="text-sm">QR Code</span>
            </Button>
          </div>

          <div className="text-center">
            <Button 
              onClick={startDeviceScan}
              disabled={scanning}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent mr-2"></div>
                  Scanning for devices...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Start Device Scan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Scanner Modal */}
      {showQrScanner && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-8 mb-4">
                <QrCode className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                <p className="text-lg font-medium mb-2">Scan Camera QR Code</p>
                <p className="text-sm text-gray-600">
                  Point your camera at the QR code on your mobile app or camera device
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowQrScanner(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowQrScanner(false);
                  // Simulate QR code scan success
                  alert('✅ Device connected via QR code!');
                }}>
                  Simulate Scan Success
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discovered Devices */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Discovered Devices</CardTitle>
            <CardDescription>
              {devices.length} device{devices.length !== 1 ? 's' : ''} found nearby
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div 
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      {getDeviceIcon(device.type)}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">{device.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {getConnectionMethodIcon(device.connectionMethod)}
                        <span className="capitalize">{device.connectionMethod.replace('_', ' ')}</span>
                        <span className={`font-medium ${getSignalColor(device.signal)}`}>
                          • {device.signal} signal
                        </span>
                      </div>
                      {device.location && (
                        <p className="text-xs text-gray-500 mt-1">📍 {device.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {device.paired ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Button 
                        onClick={() => connectDevice(device.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertCircle className="h-5 w-5" />
            How it Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700 dark:text-orange-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">📱 Mobile Phones</h5>
              <ul className="space-y-1">
                <li>• Install CamDroid app on your phone</li>
                <li>• Enable camera sharing</li>
                <li>• Connect via Bluetooth or WiFi</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">📹 IP Cameras</h5>
              <ul className="space-y-1">
                <li>• Cameras auto-detected on network</li>
                <li>• No manual setup required</li>
                <li>• Scan QR code for instant pairing</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">💻 Laptops/Webcams</h5>
              <ul className="space-y-1">
                <li>• Browser-based camera sharing</li>
                <li>• One-click connection</li>
                <li>• Works with built-in webcams</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">🔗 Smart Cameras</h5>
              <ul className="space-y-1">
                <li>• WiFi-enabled cameras</li>
                <li>• QR code pairing</li>
                <li>• Automatic configuration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}