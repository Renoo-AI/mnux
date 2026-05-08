'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, AlertTriangle, Timer, CheckCircle, Flame } from 'lucide-react';

interface OrderTimerProps {
  startTime: Date;
  estimatedMinutes?: number;
  onComplete?: () => void;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OrderTimer({
  startTime,
  estimatedMinutes = 15,
  onComplete,
  showProgress = true,
  size = 'md',
}: OrderTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000);
      setElapsed(diff);

      const minutesElapsed = diff / 60;
      setIsUrgent(minutesElapsed >= estimatedMinutes * 0.7);
      setIsOverdue(minutesElapsed >= estimatedMinutes);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, estimatedMinutes]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = useMemo(() => {
    const totalSeconds = estimatedMinutes * 60;
    return Math.min((elapsed / totalSeconds) * 100, 100);
  }, [elapsed, estimatedMinutes]);

  const remainingSeconds = useMemo(() => {
    return Math.max(estimatedMinutes * 60 - elapsed, 0);
  }, [elapsed, estimatedMinutes]);

  const sizeClasses = {
    sm: { container: 'text-xs', icon: 'w-3 h-3', timer: 'text-sm font-medium' },
    md: { container: 'text-sm', icon: 'w-4 h-4', timer: 'text-lg font-bold' },
    lg: { container: 'text-base', icon: 'w-5 h-5', timer: 'text-2xl font-bold' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`inline-flex items-center gap-2 ${classes.container}`}>
      <div className={`relative ${isOverdue ? 'animate-pulse' : ''}`}>
        {isOverdue ? (
          <Flame className={`${classes.icon} text-error animate-bounce-subtle`} />
        ) : isUrgent ? (
          <AlertTriangle className={`${classes.icon} text-amber-500`} />
        ) : (
          <Clock className={`${classes.icon} text-on-surface-variant`} />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`${classes.timer} ${
          isOverdue ? 'text-error' : isUrgent ? 'text-amber-600' : 'text-primary'
        }`}>
          {formatTime(elapsed)}
        </span>
        {showProgress && size !== 'sm' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-16 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${
                  isOverdue ? 'bg-error' : isUrgent ? 'bg-amber-500' : 'bg-secondary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {remainingSeconds > 0 && (
              <span className="text-xs text-on-surface-variant">
                {formatTime(remainingSeconds)} left
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderTimerCardProps {
  orderId: string;
  tableName: string;
  startTime: Date;
  items: number;
  total: number;
  estimatedMinutes?: number;
  priority?: 'normal' | 'high' | 'urgent';
  onClick?: () => void;
}

export function OrderTimerCard({
  orderId,
  tableName,
  startTime,
  items,
  total,
  estimatedMinutes = 15,
  priority = 'normal',
  onClick,
}: OrderTimerCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutesElapsed = elapsed / 60;
  const isUrgent = minutesElapsed >= estimatedMinutes * 0.7;
  const isOverdue = minutesElapsed >= estimatedMinutes;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityStyles = () => {
    if (priority === 'urgent' || isOverdue) {
      return {
        card: 'border-2 border-error animate-pulse-border',
        badge: 'bg-error text-white',
        timer: 'text-error',
      };
    }
    if (priority === 'high' || isUrgent) {
      return {
        card: 'border-2 border-amber-500',
        badge: 'bg-amber-100 text-amber-700',
        timer: 'text-amber-600',
      };
    }
    return {
      card: 'border border-outline-variant/30',
      badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',
      timer: 'text-primary',
    };
  };

  const styles = getPriorityStyles();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 ${styles.card}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display text-title-sm text-primary">{tableName}</h3>
          <p className="text-on-surface-variant text-xs">{items} items • ${total.toFixed(2)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles.badge}`}>
          {priority === 'urgent' || isOverdue ? 'OVERDUE' : priority === 'high' || isUrgent ? 'URGENT' : 'ACTIVE'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isOverdue ? 'text-error animate-pulse' : 'text-on-surface-variant'}`} />
          <span className={`font-display text-2xl ${styles.timer}`}>
            {formatTime(elapsed)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant">Est. {estimatedMinutes} min</p>
          <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                isOverdue ? 'bg-error' : isUrgent ? 'bg-amber-500' : 'bg-secondary'
              }`}
              style={{ width: `${Math.min((minutesElapsed / estimatedMinutes) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface KitchenTimerDisplayProps {
  orders: Array<{
    id: string;
    tableName: string;
    startTime: Date;
    items: number;
    total: number;
    estimatedMinutes?: number;
    priority?: 'normal' | 'high' | 'urgent';
  }>;
  onOrderClick?: (orderId: string) => void;
}

export function KitchenTimerDisplay({ orders, onOrderClick }: KitchenTimerDisplayProps) {
  const sortedOrders = [...orders].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();
    return aTime - bTime;
  });

  const urgentCount = orders.filter(o => {
    const elapsed = (Date.now() - new Date(o.startTime).getTime()) / 60000;
    return elapsed >= (o.estimatedMinutes || 15) * 0.7;
  }).length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Timer className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="font-semibold text-primary">{orders.length} Active Orders</p>
            <p className="text-xs text-on-surface-variant">Sorted by wait time</p>
          </div>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container rounded-full">
            <AlertTriangle className="w-4 h-4 text-error" />
            <span className="text-sm font-medium text-error">{urgentCount} need attention</span>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedOrders.map((order) => (
          <OrderTimerCard
            key={order.id}
            {...order}
            onClick={() => onOrderClick?.(order.id)}
          />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-secondary" />
          </div>
          <p className="font-display text-title-sm text-primary">All caught up!</p>
          <p className="text-on-surface-variant text-sm mt-1">No active orders in the kitchen</p>
        </div>
      )}
    </div>
  );
}
