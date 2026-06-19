'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  triggerOnView?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  triggerOnView = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const animateValue = useCallback(() => {
    const startTime = performance.now();
    const startValue = 0;
    const endValue = value;

    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const updateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, duration]);

  useEffect(() => {
    if (!triggerOnView) {
      animateValue();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          animateValue();
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [triggerOnView, hasAnimated, animateValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'error';
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  icon,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  color = 'primary',
  subtitle,
}: StatCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/5',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: trend?.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    },
    secondary: {
      bg: 'bg-secondary/5',
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
      trend: trend?.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    },
    accent: {
      bg: 'bg-accent/5',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      trend: trend?.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    },
    success: {
      bg: 'bg-green-500/5',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      trend: trend?.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    },
    error: {
      bg: 'bg-error/5',
      iconBg: 'bg-error/10',
      iconColor: 'text-error',
      trend: trend?.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-20 h-20 ${colors.bg} rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
              {icon}
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              {label}
            </span>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.trend}`}>
              <svg
                className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {Math.abs(trend.value).toFixed(0)}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className={`font-display text-4xl text-primary ${colors.iconColor}`}
          />
        </div>
        {subtitle && (
          <p className="text-on-surface-variant text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'var(--color-secondary)',
  bgColor = 'var(--color-surface-container-high)',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
