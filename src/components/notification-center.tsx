'use client';

import { useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'order' | 'system' | 'info' | 'warning';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

const demoNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Received',
    message: 'Table 03 just placed an order for 3 items totaling $42.50',
    time: new Date(Date.now() - 2 * 60000),
    read: false,
    action: { label: 'View Order', href: '/dashboard' },
  },
  {
    id: '2',
    type: 'system',
    title: 'Table 08 marked as paid',
    message: 'Order #4A2B has been completed successfully',
    time: new Date(Date.now() - 15 * 60000),
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Almond Croissant is running low (3 remaining)',
    time: new Date(Date.now() - 30 * 60000),
    read: true,
    action: { label: 'Update Stock', href: '/dashboard/menu' },
  },
  {
    id: '4',
    type: 'info',
    title: 'New staff member added',
    message: 'Sarah Chen has been added as a Waiter',
    time: new Date(Date.now() - 60 * 60000),
    read: true,
  },
  {
    id: '5',
    type: 'order',
    title: 'Order cancelled',
    message: 'Table 12 cancelled their order due to wait time',
    time: new Date(Date.now() - 90 * 60000),
    read: true,
  },
];

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'system':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="font-display text-title-md text-primary">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-secondary text-on-secondary text-xs font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-sm text-on-surface-variant hover:text-primary"
              >
                Mark all read
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Bell className="w-16 h-16 text-outline mb-4" />
              <h3 className="font-display text-title-sm text-primary mb-2">No notifications</h3>
              <p className="text-on-surface-variant">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-surface-container-low transition-colors cursor-pointer group ${
                    !notification.read ? 'bg-secondary-fixed/10' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-medium ${!notification.read ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.time)}
                        </span>
                        {notification.action && (
                          <button className="text-xs text-secondary font-medium hover:underline flex items-center gap-1">
                            {notification.action.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low">
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell({ 
  onClick, 
  unreadCount 
}: { 
  onClick: () => void;
  unreadCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors group"
    >
      <Bell className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-secondary text-on-secondary text-xs font-bold rounded-full flex items-center justify-center animate-bounce-subtle">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
