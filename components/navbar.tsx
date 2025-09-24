'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Shield, BarChart3, Camera, AlertTriangle, Settings, LogOut, Moon, Sun, Activity, LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };


  // Guest nav items
  const guestNav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/login', label: 'Login' },
    { href: '/signup', label: 'Sign Up' },
  ];

  const getNavItems = (): Array<{ href: string; label: string; icon: LucideIcon }> => {
    if (!user) return [];
    const baseItems = [
      { href: '/settings', label: 'Settings', icon: Settings }
    ];
    switch (user.role) {
      case 'admin':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { href: '/admin', label: 'Control Panel', icon: Activity },
          { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
          ...baseItems
        ];
      case 'responder':
        return [
          { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
          ...baseItems
        ];
      case 'user':
      default:
        return [
          { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { href: '/cameras', label: 'My Cameras', icon: Camera },
          { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
          ...baseItems
        ];
    }
  };

  const navItems = user ? getNavItems() : guestNav;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Fire Safety
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => {
                // Only logged-in nav items have icon property
                if (user && 'icon' in item && typeof item.icon === 'function') {
                  const Icon = item.icon as LucideIcon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === item.href
                          ? 'text-red-600 border-b-2 border-red-600'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                } else {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === item.href
                          ? 'text-red-600 border-b-2 border-red-600'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user ? (
              <>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{user.name}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded capitalize">
                    {user.role}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}