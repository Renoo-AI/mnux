'use client';

import React from 'react';

interface FloatingShortcutProps {
  onClick?: () => void;
  visible?: boolean;
}

export function FloatingShortcut({ onClick, visible = true }: FloatingShortcutProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-xl right-xl z-50">
      <button
        onClick={onClick}
        className="flex items-center gap-3 bg-primary-container text-on-primary px-lg py-md rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        style={{ boxShadow: '0px 8px 32px rgba(36, 29, 25, 0.15)' }}
      >
        <span 
          className="material-symbols-outlined text-secondary-fixed" 
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          terminal
        </span>
        <span className="font-label-md text-label-md text-primary-fixed">SuperAdmin Shortcut</span>
        <span className="flex items-center justify-center bg-white/10 w-6 h-6 rounded border border-white/20 text-[10px] font-bold">
          ⌘K
        </span>
      </button>
    </div>
  );
}

export function FloatingActionButton({ 
  icon = 'add', 
  onClick,
  className = ''
}: { 
  icon?: string; 
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`fixed right-xl bottom-xl w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 ${className}`}
      style={{ boxShadow: '0px 8px 32px rgba(58, 50, 45, 0.2)' }}
    >
      <span className="material-symbols-outlined text-[32px]">{icon}</span>
    </button>
  );
}
