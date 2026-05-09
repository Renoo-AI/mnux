'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Loader2, 
  Coffee, 
  Bell, 
  CreditCard, 
  ArrowLeft,
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { restaurantService } from '@/services/restaurantService';
import { tableService } from '@/services/tableService';
import { orderService } from '@/services/orderService';
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline';
import { CallWaiterSheet } from '@/components/order/CallWaiterSheet';
import { RequestBillSheet } from '@/components/order/RequestBillSheet';
import { Watermark, WatermarkSpacer } from '@/components/Watermark';
import type { Restaurant, Table, Order, OrderStatus } from '@/types';

const UI_STRINGS = {
  fr: {
    title: 'Votre commande',
    subtitle: 'Suivez l\'état de votre commande',
    table: 'Table',
    items: 'articles',
    total: 'Total',
    backToMenu: 'Retour au menu',
    callWaiter: 'Appeler le serveur',
    requestBill: 'Demander l\'addition',
    refresh: 'Actualiser',
    estimatedTime: 'Temps estimé',
    mins: 'min',
    orderSummary: 'Récapitulatif',
    thankYou: 'Merci de votre visite!',
    toggleLang: 'عربي',
    orderNotFound: 'Commande non trouvée',
    orderConfirmed: 'Votre commande a été confirmée',
    awaitingPayment: 'En attente de paiement',
  },
  ar: {
    title: 'طلبك',
    subtitle: 'تابع حالة طلبك',
    table: 'طاولة',
    items: 'منتجات',
    total: 'المجموع',
    backToMenu: 'العودة للقائمة',
    callWaiter: 'استدعاء النادل',
    requestBill: 'طلب الفاتورة',
    refresh: 'تحديث',
    estimatedTime: 'الوقت المتوقع',
    mins: 'دقيقة',
    orderSummary: 'ملخص الطلب',
    thankYou: 'شكراً لزيارتكم!',
    toggleLang: 'Français',
    orderNotFound: 'الطلب غير موجود',
    orderConfirmed: 'تم تأكيد طلبك',
    awaitingPayment: 'في انتظار الدفع',
  }
};

export default function OrderSentPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [showCallWaiter, setShowCallWaiter] = useState(false);
  const [showRequestBill, setShowRequestBill] = useState(false);
  const [lastWaiterCall, setLastWaiterCall] = useState<number | null>(null);
  
  const strings = UI_STRINGS[language];
  const isRTL = language === 'ar';

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        const restaurantData = await restaurantService.getBySlug(resolvedParams.slug);
        if (restaurantData) {
          setRestaurant(restaurantData);
          
          const tableData = await tableService.getTableByName(restaurantData.id, resolvedParams.tableId);
          if (tableData) {
            setTable(tableData);
          }
          
          if (orderId) {
            const orderData = await orderService.getOrderById(orderId);
            setOrder(orderData);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [resolvedParams.slug, resolvedParams.tableId, orderId]);

  // Subscribe to order updates
  useEffect(() => {
    if (!orderId) return;
    
    const unsubscribe = orderService.subscribeToOrder(
      orderId,
      (updatedOrder) => {
        setOrder(updatedOrder);
      }
    );
    
    return () => unsubscribe();
  }, [orderId]);

  // Load last waiter call time from localStorage
  useEffect(() => {
    if (table) {
      const storageKey = `waiter_call_${table.id}`;
      const lastCall = localStorage.getItem(storageKey);
      if (lastCall) {
        setLastWaiterCall(parseInt(lastCall, 10));
      }
    }
  }, [table]);

  // Toggle language
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'fr' ? 'ar' : 'fr');
  }, []);

  // Refresh order
  const handleRefresh = useCallback(async () => {
    if (!orderId || refreshing) return;
    
    setRefreshing(true);
    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (err) {
      console.error('Error refreshing order:', err);
    } finally {
      setRefreshing(false);
    }
  }, [orderId, refreshing]);

  // Call waiter handler
  const handleCallWaiter = useCallback(async () => {
    if (!restaurant || !table) throw new Error('Missing context');
    
    // Store call time for anti-spam
    const now = Date.now();
    localStorage.setItem(`waiter_call_${table.id}`, now.toString());
    setLastWaiterCall(now);
    
    // TODO: Implement actual API call to create TableRequest
    console.log('Calling waiter for table:', table.name);
  }, [restaurant, table]);

  // Request bill handler
  const handleRequestBill = useCallback(async () => {
    if (!restaurant || !table || !order) throw new Error('Missing context');
    
    // TODO: Implement actual API call to create TableRequest
    console.log('Requesting bill for table:', table.name, 'order:', order.id);
  }, [restaurant, table, order]);

  // Can request bill only after order is accepted/served
  const canRequestBill = order && ['ACCEPTED', 'PREPARING', 'SERVED'].includes(order.status);

  // Get currency symbol
  const getCurrencySymbol = () => {
    if (restaurant?.currency === 'TND') return language === 'ar' ? 'د.ت' : 'DT';
    if (restaurant?.currency === 'EUR') return '€';
    return '$';
  };

  // Calculate estimated time based on status
  const getEstimatedTime = () => {
    if (!order) return null;
    
    switch (order.status) {
      case 'CREATED':
        return { time: 5, label: language === 'ar' ? 'انتظار التأكيد' : 'En attente de confirmation' };
      case 'ACCEPTED':
      case 'PREPARING':
        return { time: 12, label: language === 'ar' ? 'تحضير' : 'Préparation' };
      case 'SERVED':
        return { time: 0, label: language === 'ar' ? 'تم التقديم!' : 'Prêt!' };
      case 'PAID':
        return { time: 0, label: language === 'ar' ? 'تم الدفع' : 'Payé' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#3A322D] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#C9A07E] animate-spin" />
          </div>
          <p className="text-[#5A4A3D]">{language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  const showWatermark = restaurant?.plan === 'free' || restaurant?.watermarkEnabled === true;
  const estimatedTime = getEstimatedTime();

  return (
    <WatermarkSpacer showWatermark={showWatermark}>
      <div 
        className="min-h-screen bg-[#FCFBF9] pb-32"
        dir={isRTL ? 'rtl' : 'ltr'}
        lang={language}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#FCFBF9]/95 backdrop-blur-lg border-b border-[#EFE4D8]">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3A322D] flex items-center justify-center">
                <Coffee className="w-5 h-5 text-[#C9A07E]" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-[#3A322D]">
                  {strings.title}
                </h1>
                {table && (
                  <p className="text-xs text-[#C9A07E]">
                    {strings.table} {table.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-[#5A4A3D] hover:text-[#3A322D]"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <button
                onClick={toggleLanguage}
                className="px-4 py-1.5 rounded-full bg-white border border-[#EFE4D8] text-[#C9A07E] font-semibold text-sm hover:bg-[#EFE4D8]/50 transition-colors"
              >
                {strings.toggleLang}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          {/* Status Timeline */}
          {order && (
            <div className="mb-6 p-6 rounded-2xl bg-white shadow-sm border border-[#EFE4D8]/50">
              <OrderStatusTimeline 
                status={order.status}
                language={language}
                rejectReason={order.rejectReason}
                cancelReason={order.cancelReason}
              />
            </div>
          )}

          {/* Estimated Time Card */}
          {estimatedTime && order && !['REJECTED', 'CANCELLED'].includes(order.status) && (
            <div className="mb-6 p-4 rounded-2xl bg-[#EFE4D8]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3A322D] flex items-center justify-center">
                  <Loader2 className={`w-5 h-5 text-[#C9A07E] ${order.status === 'SERVED' || order.status === 'PAID' ? '' : 'animate-spin'}`} />
                </div>
                <div>
                  <p className="text-sm text-[#5A4A3D]">{strings.estimatedTime}</p>
                  <p className="font-semibold text-[#3A322D]">{estimatedTime.label}</p>
                </div>
              </div>
              {estimatedTime.time > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#3A322D]">~{estimatedTime.time}</p>
                  <p className="text-xs text-[#C9A07E]">{strings.mins}</p>
                </div>
              )}
            </div>
          )}

          {/* Order Summary Card */}
          {order && (
            <div className="mb-6 rounded-2xl bg-white shadow-sm border border-[#EFE4D8]/50 overflow-hidden">
              <div className="p-4 border-b border-[#EFE4D8]/50">
                <h2 className="font-serif font-bold text-[#3A322D]">
                  {strings.orderSummary}
                </h2>
              </div>
              
              <div className="p-4 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-[#C9A07E] font-semibold">{item.quantity}x</span>
                      <span className="text-[#3A322D]">{item.name}</span>
                    </div>
                    <span className="text-[#5A4A3D]">
                      {(item.price * item.quantity).toFixed(2)} {getCurrencySymbol()}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-[#EFE4D8]/30 flex items-center justify-between">
                <span className="font-semibold text-[#3A322D]">{strings.total}</span>
                <span className="text-xl font-bold text-[#3A322D]">
                  {order.totalAmount.toFixed(2)} {getCurrencySymbol()}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {order && !['REJECTED', 'CANCELLED', 'PAID', 'CLOSED'].includes(order.status) && (
            <div className="space-y-3">
              <Button
                onClick={() => setShowCallWaiter(true)}
                variant="outline"
                className="w-full py-6 rounded-2xl border-[#EFE4D8] text-[#3A322D] hover:bg-[#EFE4D8]/50"
              >
                <Bell className="w-5 h-5 mr-2" />
                {strings.callWaiter}
              </Button>
              
              {canRequestBill && (
                <Button
                  onClick={() => setShowRequestBill(true)}
                  className="w-full py-6 rounded-2xl bg-[#3A322D] hover:bg-[#5A4A3D] text-white"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {strings.requestBill}
                </Button>
              )}
            </div>
          )}

          {/* Back to Menu */}
          <Link
            href={`/r/${restaurant?.slug || ''}/t/${table?.name || ''}`}
            className="flex items-center justify-center gap-2 mt-6 text-[#C9A07E] hover:text-[#3A322D] transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{strings.backToMenu}</span>
          </Link>

          {/* Thank you footer */}
          <div className="mt-8 text-center">
            <p className="font-serif italic text-[#C9A07E]">{strings.thankYou}</p>
          </div>
        </main>

        {/* Fonts */}
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200..800&family=Noto+Sans+Arabic:wght@300..700&display=swap');
          
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            -webkit-tap-highlight-color: transparent;
          }
          
          [lang="ar"] {
            font-family: 'Noto Sans Arabic', sans-serif;
          }
          
          .font-serif {
            font-family: 'Playfair Display', serif;
          }
        `}</style>
      </div>

      {/* Sheets */}
      <CallWaiterSheet
        isOpen={showCallWaiter}
        onClose={() => setShowCallWaiter(false)}
        onCallWaiter={handleCallWaiter}
        tableName={table?.name}
        language={language}
        lastCallTime={lastWaiterCall}
      />
      
      <RequestBillSheet
        isOpen={showRequestBill}
        onClose={() => setShowRequestBill(false)}
        onRequestBill={handleRequestBill}
        order={order}
        tableName={table?.name}
        language={language}
        currency={restaurant?.currency}
      />

      <Watermark show={showWatermark} />
    </WatermarkSpacer>
  );
}
