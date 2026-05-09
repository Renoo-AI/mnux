'use client';

import { Check, Clock, ChefHat, Bell, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import type { OrderStatus } from '@/types';

interface StatusStep {
  key: OrderStatus;
  labelFr: string;
  labelAr: string;
  icon: typeof Clock;
}

const STATUS_STEPS: StatusStep[] = [
  { key: 'CREATED', labelFr: 'Commande envoyée', labelAr: 'تم إرسال الطلب', icon: Check },
  { key: 'ACCEPTED', labelFr: 'Acceptée', labelAr: 'تم قبول الطلب', icon: CheckCircle2 },
  { key: 'PREPARING', labelFr: 'En préparation', labelAr: 'قيد التحضير', icon: ChefHat },
  { key: 'SERVED', labelFr: 'Servie', labelAr: 'تم تقديم الطلب', icon: Bell },
  { key: 'PAID', labelFr: 'Payée', labelAr: 'تم الدفع', icon: CreditCard },
];

interface OrderStatusTimelineProps {
  status: OrderStatus;
  language?: 'fr' | 'ar';
  rejectReason?: string;
  cancelReason?: string;
}

export function OrderStatusTimeline({ 
  status, 
  language = 'fr',
  rejectReason,
  cancelReason 
}: OrderStatusTimelineProps) {
  const isRTL = language === 'ar';
  
  // Handle rejected/cancelled orders
  if (status === 'REJECTED') {
    return (
      <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-[#FEE2E2] border border-[#FECACA]">
          <div className="w-12 h-12 rounded-full bg-[#EF4444] flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#DC2626]">
              {language === 'fr' ? 'Commande refusée' : 'تم رفض الطلب'}
            </p>
            {rejectReason && (
              <p className="text-sm text-[#991B1B] mt-1">{rejectReason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  if (status === 'CANCELLED') {
    return (
      <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A]">
          <div className="w-12 h-12 rounded-full bg-[#F59E0B] flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#B45309]">
              {language === 'fr' ? 'Commande annulée' : 'تم إلغاء الطلب'}
            </p>
            {cancelReason && (
              <p className="text-sm text-[#92400E] mt-1">{cancelReason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Get current step index
  const currentStepIndex = STATUS_STEPS.findIndex(step => step.key === status);
  const isActiveStep = (stepIndex: number) => stepIndex <= currentStepIndex;
  const isCurrentStep = (stepIndex: number) => stepIndex === currentStepIndex;
  
  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-[#EFE4D8]" />
        
        {/* Progress line fill */}
        <div 
          className="absolute top-6 h-0.5 bg-[#C9A07E] transition-all duration-500"
          style={{ 
            width: `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 24px)`,
            left: '24px'
          }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const active = isActiveStep(index);
            const current = isCurrentStep(index);
            
            return (
              <div 
                key={step.key}
                className="flex flex-col items-center"
                style={{ width: `${100 / STATUS_STEPS.length}%` }}
              >
                {/* Icon circle */}
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${active 
                      ? 'bg-[#3A322D] shadow-lg' 
                      : 'bg-white border-2 border-[#EFE4D8]'
                    }
                    ${current ? 'ring-4 ring-[#C9A07E]/30' : ''}
                  `}
                >
                  <Icon 
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-[#C9A07E]' : 'text-[#C9A07E]/40'
                    }`} 
                  />
                </div>
                
                {/* Label */}
                <p 
                  className={`
                    text-center text-xs mt-3 font-medium transition-colors max-w-[80px]
                    ${active ? 'text-[#3A322D]' : 'text-[#C9A07E]/60'}
                  `}
                >
                  {language === 'fr' ? step.labelFr : step.labelAr}
                </p>
                
                {/* Current indicator */}
                {current && status !== 'PAID' && (
                  <div className="mt-2 px-2 py-0.5 rounded-full bg-[#C9A07E]/10 border border-[#C9A07E]/30">
                    <span className="text-[10px] font-semibold text-[#C9A07E] uppercase tracking-wider">
                      {language === 'fr' ? 'En cours' : 'حالياً'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderStatusTimeline;
