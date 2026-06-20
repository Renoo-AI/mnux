'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, ArrowLeft, Loader2, AlertTriangle, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';

export default function OrderReviewPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<{ id: string; slug: string; name: string; currency: string } | null>(null);
  const [table, setTable] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    getTotalPrice,
    clearCart 
  } = useCartStore();
  const cartItemCount = getTotalItems();
  const cartTotal = getTotalPrice();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/restaurant/${resolvedParams.slug}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurant({ id: data.restaurant.id, slug: data.restaurant.slug, name: data.restaurant.name, currency: data.restaurant.currency || 'TND' });
        }
        setTable({ id: 'demo-table', name: resolvedParams.tableId });
      } catch { setError('Failed to load'); }
      finally { setLoading(false); }
    }
    loadData();
  }, [resolvedParams.slug, resolvedParams.tableId]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find(i => i.itemId === itemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        removeItem(itemId);
      } else {
        updateQuantity(itemId, newQuantity);
      }
    }
  };

  const handleSubmitOrder = async () => {
    if (!restaurant || !table || items.length === 0) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Use the updated createOrder with table name
      const result = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table.id,
          tableLabel: table.name,
          items: items.map(item => ({
            itemId: item.itemId,
            nameFr: item.name || item.nameFr || '',
            nameAr: item.nameAr || '',
            price: item.price,
            quantity: item.quantity,
            note: item.note || '',
          })),
          customerNote: '',
          language: 'FR',
        }),
      });

      if (result.ok) {
        const data = await result.json();
        clearCart();
        router.push(`/r/${restaurant.slug}/t/${table.name}/sent?orderId=${data.orderId}`);
      } else {
        const err = await result.json();
        setError(err.error || 'Failed to submit order');
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currencySymbol = restaurant?.currency === 'TND' ? 'DT' : restaurant?.currency === 'EUR' ? '\u20AC' : 'DT';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#ba1a1a]" />
        </div>
        <h1 className="text-2xl font-bold text-[#3D2C1E]" style={{ fontFamily: "'Playfair Display', serif" }}>Error</h1>
        <p className="text-[#7f756f]">{error || 'Unable to load page'}</p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 sticky top-0 bg-[#FDF8F3] border-b border-[#E8E2DA] shadow-[0px_10px_30px_rgba(58,50,45,0.05)] z-40">
        <div className="flex items-center gap-4">
          <Link 
            href={`/r/${restaurant?.slug}/t/${table?.name}`}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#3D2C1E]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#3D2C1E]" style={{ fontFamily: "'Playfair Display', serif" }}>Review Order</h1>
            <p className="text-[#7f756f] text-xs font-bold uppercase tracking-wider">{table?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6 pb-32">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#7f756f]">
            <div className="w-16 h-16 rounded-full bg-[#f2edeb] flex items-center justify-center mb-4">
              <Coffee className="w-8 h-8 text-[#d1c4bd]" />
            </div>
            <p className="text-lg font-bold text-[#3D2C1E] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Your cart is empty</p>
            <p className="text-sm mb-6">Add items from the menu to get started</p>
            <Button asChild>
              <Link href={`/r/${restaurant?.slug}/t/${table?.name}`}>Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div 
                  key={item.itemId} 
                  className="bg-white rounded-xl p-4 shadow-[0px_10px_30px_rgba(58,50,45,0.05)] flex gap-4"
                >
                  <div className="w-20 h-20 rounded-lg bg-[#f2edeb] shrink-0 overflow-hidden relative">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d1c4bd]">&#x1F372;</div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-[15px] text-[#3D2C1E]">{item.name}</h3>
                      <button onClick={() => removeItem(item.itemId)} className="text-[#ba1a1a] text-xs hover:underline">
                        Remove
                      </button>
                    </div>
                    
                    <p className="text-[#7f756f] text-sm mt-1">{item.price.toFixed(3)} {currencySymbol} each</p>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-1 bg-[#f2edeb] rounded-full px-1 py-1">
                        <button
                          onClick={() => handleQuantityChange(item.itemId, -1)}
                          className="w-6 h-6 rounded-full bg-white text-[#3D2C1E] flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm w-5 text-center text-[#3D2C1E]">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.itemId, 1)}
                          className="w-6 h-6 rounded-full bg-[#D4A373] text-white flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-bold text-[#3D2C1E]">
                        {(item.price * item.quantity).toFixed(3)} {currencySymbol}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#7f756f]">Subtotal ({cartItemCount} items)</span>
                <span className="font-bold text-lg text-[#3D2C1E]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {cartTotal.toFixed(3)} {currencySymbol}
                </span>
              </div>
              <p className="text-[#7f756f] text-xs">
                Final total confirmed when order is accepted.
              </p>
            </div>
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#FDF8F3] shadow-[0px_-10px_30px_rgba(58,50,45,0.05)] p-6">
          <Button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full bg-[#3D2C1E] text-white py-4 rounded-full font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Order...
              </>
            ) : (
              `Send Order \u2022 ${cartTotal.toFixed(3)} ${currencySymbol}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
