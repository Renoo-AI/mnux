'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleAr?: string;
  children: React.ReactNode;
  language?: 'fr' | 'ar';
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  titleAr,
  children, 
  language = 'fr' 
}: BottomSheetProps) {
  const isRTL = language === 'ar';
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        className={`
          w-full max-w-lg bg-white rounded-t-3xl shadow-2xl 
          animate-slide-in-up overflow-hidden
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-[#EFE4D8]" />
        </div>
        
        {/* Header */}
        {(title || titleAr) && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-[#EFE4D8]">
            <h2 className="font-serif text-xl font-bold text-[#3A322D]">
              {language === 'ar' ? titleAr : title}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#EFE4D8] flex items-center justify-center hover:bg-[#C9A07E]/20 transition-colors"
            >
              <X className="w-5 h-5 text-[#3A322D]" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default BottomSheet;
