'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';

interface RequestBillSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestBill: () => Promise<void>;
  order?: Order | null;
  tableName?: string;
  language?: 'fr' | 'ar';
  currency?: string;
}

export function RequestBillSheet({
  isOpen,
  onClose,
  onRequestBill,
  order,
  tableName,
  language = 'fr',
  currency = 'TND',
}: RequestBillSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);
  
  const handleRequestBill = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onRequestBill();
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
  
  const formatPrice = (price: number) => {
    const symbol = currency === 'TND' 
      ? (language === 'ar' ? 'د.ت' : 'DT')
      : currency === 'EUR' ? '€' : '$';
    return `${price.toFixed(2)} ${symbol}`;
  };
  
  const totalAmount = order?.totalAmount || 0;
  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Demander l'addition"
      titleAr="طلب الفاتورة"
      language={language}
    >
      {success ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#3A322D] mb-2">
            {language === 'ar' ? 'تم طلب الفاتورة!' : 'Demande envoyée!'}
          </h3>
          <p className="text-[#5A4A3D]">
            {language === 'ar' 
              ? 'سيأتي النادل بالفاتورة قريباً' 
              : 'Un serveur apportera votre addition.'}
          </p>
        </div>
      ) : (
        <>
          {/* Order summary card */}
          <div className="p-4 rounded-2xl bg-[#EFE4D8]/50 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-[#3A322D] flex items-center justify-center">
                <Receipt className="w-7 h-7 text-[#C9A07E]" />
              </div>
              <div>
                <p className="font-semibold text-[#3A322D]">
                  {language === 'ar' ? 'ملخص الطلب' : 'Récapitulatif'}
                </p>
                {tableName && (
                  <p className="text-sm text-[#5A4A3D]">
                    {language === 'ar' ? `طاولة ${tableName}` : `Table ${tableName}`}
                  </p>
                )}
              </div>
            </div>
            
            {/* Items count */}
            <div className="flex justify-between items-center py-3 border-t border-[#C9A07E]/30">
              <span className="text-[#5A4A3D]">
                {language === 'ar' ? 'عدد المنتجات' : 'Articles'}
              </span>
              <span className="font-semibold text-[#3A322D]">{itemCount}</span>
            </div>
            
            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-[#C9A07E]/30">
              <span className="font-semibold text-[#3A322D]">
                {language === 'ar' ? 'المجموع' : 'Total'}
              </span>
              <span className="font-bold text-xl text-[#3A322D]">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[#FEE2E2] mb-4">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              <p className="text-sm text-[#DC2626]">{error}</p>
            </div>
          )}
          
          {/* Request button */}
          <Button
            onClick={handleRequestBill}
            disabled={isSubmitting}
            className="w-full py-6 rounded-2xl font-semibold text-lg bg-[#3A322D] hover:bg-[#5A4A3D] text-white transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {language === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {language === 'ar' ? 'طلب الفاتورة' : 'Demander l\'addition'}
              </span>
            )}
          </Button>
          
          {/* Payment hint */}
          <p className="text-center text-xs text-[#C9A07E] mt-4">
            {language === 'ar' 
              ? 'سيتم جلب الفاتورة للدفع'
              : 'Le serveur vous apportera l\'addition pour le paiement.'
            }
          </p>
        </>
      )}
    </BottomSheet>
  );
}

export default RequestBillSheet;
