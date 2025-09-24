'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, MapPin, Key, Moon, Sun, Shield, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('sk-1234567890abcdef...');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    // Load dark mode setting
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Mock profile update
    console.log('Profile updated');
  };

  const generateNewApiKey = () => {
    const newKey = 'sk-' + Math.random().toString(36).substr(2, 32);
    setApiKey(newKey);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      defaultValue={user.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    defaultValue={user.address}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Account Role
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <span className="capitalize font-medium">{user.role}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact your administrator to change your role
                    </p>
                  </div>
                </div>

                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {darkMode ? <Moon className="h-5 w-5 mr-2" /> : <Sun className="h-5 w-5 mr-2" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Dark Mode</label>
                    <p className="text-xs text-gray-500">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleDarkMode}
                    className="flex items-center space-x-2"
                  >
                    {darkMode ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Push Notifications</label>
                    <p className="text-xs text-gray-500">
                      Receive real-time alerts for fire and smoke detection
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotifications(!notifications)}
                    className={notifications ? 'bg-green-50 border-green-200 text-green-700' : ''}
                  >
                    {notifications ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Email Alerts</label>
                    <p className="text-xs text-gray-500">
                      Get incident reports sent to your email
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Access
              </CardTitle>
              <CardDescription>
                Manage your API keys for integrations and third-party access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex items-center space-x-3 mt-2">
                    <input
                      type="text"
                      value={apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 rounded-md font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateNewApiKey}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Keep your API key secure and don&apos;t share it publicly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                System Information
              </CardTitle>
              <CardDescription>
                View system details and version information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium">Version</label>
                  <p className="text-gray-600 dark:text-gray-400">1.0.0</p>
                </div>
                <div>
                  <label className="font-medium">Last Updated</label>
                  <p className="text-gray-600 dark:text-gray-400">September 24, 2025</p>
                </div>
                <div>
                  <label className="font-medium">Region</label>
                  <p className="text-gray-600 dark:text-gray-400">India (Mumbai)</p>
                </div>
                <div>
                  <label className="font-medium">Status</label>
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    ● Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}