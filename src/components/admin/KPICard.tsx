'use client';

import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: string;
  variant?: 'default' | 'warning';
}

export function KPICard({ label, value, trend, icon, variant = 'default' }: KPICardProps) {
  return (
    <div className={`p-lg rounded-lg transition-transform hover:-translate-y-1 ${
      variant === 'warning' 
        ? 'bg-surface-container-lowest border border-error/20' 
        : 'bg-surface-container-lowest border border-outline-variant/10'
    }`} style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
      <div className="flex justify-between items-start mb-sm">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{label}</p>
        {icon && (
          <span className="material-symbols-outlined text-primary bg-primary-fixed p-sm rounded-full text-lg">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-display-md text-primary">{value}</h3>
        {trend && (
          <span className={`text-[10px] font-bold flex items-center gap-1 ${
            trend.direction === 'up' 
              ? 'text-secondary' 
              : trend.direction === 'down' 
                ? 'text-error' 
                : 'text-on-surface-variant'
          }`}>
            {trend.direction === 'up' && (
              <span className="material-symbols-outlined text-sm">trending_up</span>
            )}
            {trend.direction === 'down' && (
              <span className="material-symbols-outlined text-sm">trending_down</span>
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'gold';
}

export function QuickAction({ icon, label, onClick, variant = 'default' }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-lg rounded-lg border transition-colors group ${
        variant === 'gold'
          ? 'bg-white border-outline-variant hover:border-secondary'
          : 'bg-white border-outline-variant hover:border-primary'
      }`}
    >
      <div className="flex items-center gap-md">
        <span className={`material-symbols-outlined ${variant === 'gold' ? 'text-secondary' : 'text-primary'}`}>
          {icon}
        </span>
        <span className="font-body-md font-semibold text-on-surface">{label}</span>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
        chevron_right
      </span>
    </button>
  );
}

interface StatusBadgeProps {
  status: 'pass' | 'verified' | 'active' | 'warning' | 'critical';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusStyles = {
    pass: 'bg-[#e8f5e9] text-[#2e7d32]',
    verified: 'bg-[#e8f5e9] text-[#2e7d32]',
    active: 'bg-[#e3f2fd] text-[#1565c0]',
    warning: 'bg-[#fff3e0] text-[#e65100]',
    critical: 'bg-error-container text-on-error-container',
  };

  return (
    <span className={`font-label-sm px-md py-1 rounded-full uppercase ${statusStyles[status]}`}>
      {label}
    </span>
  );
}
