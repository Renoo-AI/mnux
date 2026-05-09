'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';

interface CallWaiterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCallWaiter: () => Promise<void>;
  tableName?: string;
  language?: 'fr' | 'ar';
  lastCallTime?: number | null;
}

const COOLDOWN_SECONDS = 120; // 2 minutes anti-spam

export function CallWaiterSheet({
  isOpen,
  onClose,
  onCallWaiter,
  tableName,
  language = 'fr',
  lastCallTime,
}: CallWaiterSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Calculate cooldown
  useEffect(() => {
    if (!lastCallTime) {
      setCooldownRemaining(0);
      return;
    }
    
    const updateCooldown = () => {
      const elapsed = Math.floor((Date.now() - lastCallTime) / 1000);
      const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
      setCooldownRemaining(remaining);
    };
    
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [lastCallTime]);
  
  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);
  
  const handleCall = async () => {
    if (cooldownRemaining > 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onCallWaiter();
      setSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        language === 'ar' 
          ? 'حدث خطأ. حاول مرة أخرى.' 
          : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isOnCooldown = cooldownRemaining > 0;
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Appeler le serveur"
      titleAr="استدعاء النادل"
      language={language}
    >
      {success ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#3A322D] mb-2">
            {language === 'ar' ? 'تم الإرسال!' : 'Demande envoyée!'}
          </h3>
          <p className="text-[#5A4A3D]">
            {language === 'ar' 
              ? 'سيأتي النادل قريباً' 
              : 'Un serveur arrivera bientôt à votre table.'}
          </p>
        </div>
      ) : (
        <>
          {/* Info card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#EFE4D8]/50 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#3A322D] flex items-center justify-center">
              <Bell className="w-7 h-7 text-[#C9A07E]" />
            </div>
            <div>
              <p className="font-semibold text-[#3A322D]">
                {language === 'ar' ? 'استدعاء النادل' : 'Appeler un serveur'}
              </p>
              {tableName && (
                <p className="text-sm text-[#5A4A3D]">
                  {language === 'ar' ? `طاولة ${tableName}` : `Table ${tableName}`}
                </p>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[#FEE2E2] mb-4">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              <p className="text-sm text-[#DC2626]">{error}</p>
            </div>
          )}
          
          {/* Cooldown notice */}
          {isOnCooldown && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FEF3C7] mb-6">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
              <p className="text-sm text-[#92400E]">
                {language === 'ar' 
                  ? `يرجى الانتظار ${formatCooldown(cooldownRemaining)} قبل الطلب مرة أخرى`
                  : `Veuillez attendre ${formatCooldown(cooldownRemaining)} avant de faire une nouvelle demande.`
                }
              </p>
            </div>
          )}
          
          {/* Call button */}
          <Button
            onClick={handleCall}
            disabled={isSubmitting || isOnCooldown}
            className={`
              w-full py-6 rounded-2xl font-semibold text-lg transition-all
              ${isOnCooldown 
                ? 'bg-[#EFE4D8] text-[#C9A07E] cursor-not-allowed' 
                : 'bg-[#3A322D] hover:bg-[#5A4A3D] text-white'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {language === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...'}
              </span>
            ) : isOnCooldown ? (
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {formatCooldown(cooldownRemaining)}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {language === 'ar' ? 'استدعاء النادل' : 'Appeler le serveur'}
              </span>
            )}
          </Button>
          
          {/* Hint */}
          <p className="text-center text-xs text-[#C9A07E] mt-4">
            {language === 'ar' 
              ? 'يمكنك استدعاء النادل مرة كل دقيقتين'
              : 'Vous pouvez appeler un serveur toutes les 2 minutes.'
            }
          </p>
        </>
      )}
    </BottomSheet>
  );
}

export default CallWaiterSheet;
