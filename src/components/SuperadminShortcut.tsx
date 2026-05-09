'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Design colors
const DARK_ESPRESSO = '#3A322D';
const ACCENT_GOLD = '#C9A07E';

// LocalStorage keys
const STORAGE_KEY_POSITION = 'menux_superadmin_position';
const STORAGE_KEY_VISIBILITY = 'menux_superadmin_visible';

interface Position {
  x: number;
  y: number;
}

interface Visibility {
  visible: boolean;
  collapsed: boolean;
}

// Helper to get default position
function getDefaultPosition(): Position {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: window.innerWidth - 72,
    y: window.innerHeight - 72,
  };
}

// Helper to load from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return defaultValue;
}

// Helper to save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore errors
  }
}

export default function SuperadminShortcut() {
  const { isSuperadmin } = useStaffSession();
  const router = useRouter();
  
  // Use refs to store state that doesn't need to trigger re-renders
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const isCollapsedRef = useRef(false);
  const hydratedRef = useRef(false);
  
  // Track if we've initialized state from localStorage
  const initializedRef = useRef(false);
  
  // Force re-render after hydration
  const [, forceUpdate] = useState({});
  
  // Position for rendering (derived from ref)
  const [renderPosition, setRenderPosition] = useState<Position>({ x: 0, y: 0 });
  const [renderCollapsed, setRenderCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const elementStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize on mount - use queueMicrotask to defer setState outside effect
  useEffect(() => {
    const initialize = () => {
      // Load initial values from localStorage
      const savedVisibility = loadFromStorage<Visibility>(STORAGE_KEY_VISIBILITY, { visible: true, collapsed: false });
      const savedPosition = loadFromStorage<Position | null>(STORAGE_KEY_POSITION, null);
      
      // Update refs
      isCollapsedRef.current = savedVisibility.collapsed;
      hydratedRef.current = true;
      
      if (savedPosition) {
        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        positionRef.current = {
          x: Math.min(Math.max(0, savedPosition.x), maxX),
          y: Math.min(Math.max(0, savedPosition.y), maxY),
        };
      } else {
        positionRef.current = getDefaultPosition();
      }
      
      initializedRef.current = true;
      
      // Update render state
      setRenderPosition({ ...positionRef.current });
      setRenderCollapsed(isCollapsedRef.current);
      setIsHydrated(true);
    };
    
    // Use queueMicrotask to defer setState outside of the effect
    queueMicrotask(initialize);
  }, []);
  
  // Save position when it changes
  const updatePosition = useCallback((newPos: Position) => {
    positionRef.current = newPos;
    saveToStorage(STORAGE_KEY_POSITION, newPos);
    setRenderPosition({ ...newPos });
  }, []);
  
  // Toggle collapsed state
  const toggleCollapsed = useCallback((collapsed: boolean) => {
    isCollapsedRef.current = collapsed;
    saveToStorage(STORAGE_KEY_VISIBILITY, { visible: true, collapsed });
    setRenderCollapsed(collapsed);
  }, []);
  
  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...positionRef.current };
  }, []);
  
  // Handle touch start for dragging (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    elementStartPos.current = { ...positionRef.current };
  }, []);
  
  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      const newX = elementStartPos.current.x + deltaX;
      const newY = elementStartPos.current.y + deltaY;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 56;
      const maxY = window.innerHeight - 56;
      
      updatePosition({
        x: Math.min(Math.max(0, newX), maxX),
        y: Math.min(Math.max(0, newY), maxY),
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updatePosition]);
  
  // Handle touch move during drag (mobile)
  useEffect(() => {
    if (!isDragging) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartPos.current.x;
      const deltaY = touch.clientY - dragStartPos.current.y;
      
      const newX = elementStartPos.current.x + deltaX;
      const newY = elementStartPos.current.y + deltaY;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 56;
      const maxY = window.innerHeight - 56;
      
      updatePosition({
        x: Math.min(Math.max(0, newX), maxX),
        y: Math.min(Math.max(0, newY), maxY),
      });
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, updatePosition]);
  
  // Handle click to navigate
  const handleClick = useCallback(() => {
    // Only navigate if not dragging (to prevent accidental navigation)
    if (isDragging) return;
    router.push('/admin');
  }, [isDragging, router]);
  
  // Handle close
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCollapsed(true);
  }, [toggleCollapsed]);
  
  // Handle reopen
  const handleReopen = useCallback(() => {
    toggleCollapsed(false);
  }, [toggleCollapsed]);
  
  // Don't render if not superadmin
  if (!isSuperadmin) {
    return null;
  }
  
  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }
  
  // Collapsed state - small corner button
  if (renderCollapsed) {
    return (
      <button
        onClick={handleReopen}
        className="fixed z-[9998] w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: DARK_ESPRESSO,
          right: '12px',
          bottom: '12px',
        }}
        aria-label="Open superadmin shortcut"
      >
        <Shield className="w-5 h-5" style={{ color: ACCENT_GOLD }} />
      </button>
    );
  }
  
  // Expanded floating button
  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-[9998] select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        left: `${renderPosition.x}px`,
        top: `${renderPosition.y}px`,
        transform: 'translate(-100%, -100%)',
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={handleClick}
            className={cn(
              "relative group flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all duration-200",
              isDragging ? "scale-105 shadow-xl" : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            )}
            style={{
              backgroundColor: DARK_ESPRESSO,
            }}
          >
            {/* Shield icon */}
            <Shield 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: ACCENT_GOLD }} 
            />
            
            {/* Text label */}
            <span 
              className="text-sm font-medium whitespace-nowrap"
              style={{ color: ACCENT_GOLD }}
            >
              Superadmin
            </span>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
              style={{ 
                backgroundColor: DARK_ESPRESSO,
                border: `1px solid ${ACCENT_GOLD}`,
              }}
              aria-label="Hide shortcut"
            >
              <X className="w-3 h-3" style={{ color: ACCENT_GOLD }} />
            </button>
            
            {/* Drag indicator dots */}
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-40">
              <div className="w-1 h-0.5 rounded-full" style={{ backgroundColor: ACCENT_GOLD }} />
              <div className="w-1 h-0.5 rounded-full" style={{ backgroundColor: ACCENT_GOLD }} />
              <div className="w-1 h-0.5 rounded-full" style={{ backgroundColor: ACCENT_GOLD }} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="text-xs"
          style={{ backgroundColor: DARK_ESPRESSO }}
        >
          Superadmin Dashboard
          <span className="block text-[10px] opacity-70">Drag to reposition</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
