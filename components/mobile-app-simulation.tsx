'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Camera, 
  Wifi, 
  Bluetooth, 
  CheckCircle,
  AlertTriangle,
  QrCode,
  Download,
  Share,
  Settings,
  Play,
  Square
} from 'lucide-react';

export default function MobileAppSimulation() {
  const [appInstalled, setAppInstalled] = useState(false);
  const [cameraSharing, setCameraSharing] = useState(false);
  const [networkConnected, setNetworkConnected] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Install CamDroid App",
      description: "Download the free CamDroid app from App Store or Play Store",
      completed: appInstalled,
      action: () => setAppInstalled(true),
      icon: <Download className="h-5 w-5" />
    },
    {
      id: 2,
      title: "Enable Camera Sharing",
      description: "Allow the app to access your camera and microphone",
      completed: cameraSharing,
      action: () => setCameraSharing(true),
      icon: <Camera className="h-5 w-5" />
    },
    {
      id: 3,
      title: "Connect to Network",
      description: "Join the same WiFi network as your fire safety system",
      completed: networkConnected,
      action: () => setNetworkConnected(true),
      icon: <Wifi className="h-5 w-5" />
    },
    {
      id: 4,
      title: "Start Streaming",
      description: "Your phone camera is now monitoring for fire and smoke",
      completed: streamActive,
      action: () => setStreamActive(true),
      icon: <Play className="h-5 w-5" />
    }
  ];

  const resetDemo = () => {
    setAppInstalled(false);
    setCameraSharing(false);
    setNetworkConnected(false);
    setStreamActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Phone Header */}
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">CamDroid - Fire Safety</span>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              {streamActive ? 'LIVE' : 'SETUP'}
            </Badge>
          </div>
        </div>

        {/* Phone Content */}
        <div className="bg-white dark:bg-gray-800 shadow-lg">
          {/* Camera View */}
          <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
            {streamActive ? (
              <div className="text-white text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="text-sm">🔥 AI Fire Detection Active</p>
                <p className="text-xs opacity-75">Monitoring: Living Room</p>
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <Camera className="h-16 w-16 mx-auto mb-4" />
                <p className="text-sm">Camera Preview</p>
                <p className="text-xs">Complete setup to start monitoring</p>
              </div>
            )}
            
            {streamActive && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  REC
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            {streamActive ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fire Detection</span>
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Connected to Fire Safety Network</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Your camera is now protecting your home with AI-powered fire and smoke detection
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setStreamActive(false)}
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Stream
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Setup Your Phone Camera</h3>
                
                {steps.map((step) => (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step.completed 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200' 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.completed ? <CheckCircle className="h-4 w-4" /> : step.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{step.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{step.description}</p>
                    </div>
                    
                    {!step.completed && (
                      <Button 
                        size="sm" 
                        onClick={step.action}
                        disabled={step.id > 1 && !steps[step.id - 2].completed}
                      >
                        {step.id === 1 ? 'Install' : 'Enable'}
                      </Button>
                    )}
                  </div>
                ))}

                {steps.every(step => step.completed) && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setStreamActive(true)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Fire Safety Monitoring
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Phone Bottom */}
        <div className="bg-white dark:bg-gray-800 rounded-b-3xl p-4 shadow-lg">
          <div className="flex justify-center gap-4">
            <Button variant="ghost" size="sm" onClick={resetDemo}>
              Reset Demo
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share App
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300 text-sm">
            <div className="space-y-2">
              <p><strong>1. No Technical Setup:</strong> Just install the app and follow the simple steps</p>
              <p><strong>2. Automatic Discovery:</strong> Your phone will be detected by the fire safety system</p>
              <p><strong>3. One-Click Connection:</strong> Connect with a single tap, no API keys needed</p>
              <p><strong>4. AI Protection:</strong> Your camera instantly becomes a fire detection sensor</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}