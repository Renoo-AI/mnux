'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { restaurantService } from '@/services/restaurantService';
import { tableService } from '@/services/tableService';
import { orderService } from '@/services/orderService';
import { useCartStore } from '@/stores/cartStore';
import { Watermark, WatermarkSpacer } from '@/components/Watermark';
import type { Restaurant, Table } from '@/types';

export default function OrderReviewPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
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
        
        const restaurantData = await restaurantService.getBySlug(resolvedParams.slug);
        if (!restaurantData) {
          setError('Restaurant not found');
          return;
        }
        setRestaurant(restaurantData);
        
        const tableData = await tableService.getTableByName(restaurantData.id, resolvedParams.tableId);
        if (!tableData) {
          setError('Table not found');
          return;
        }
        setTable(tableData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
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
      const result = await orderService.createOrder(
        restaurant.id, 
        table.id, 
        table.name, // Pass table name
        items
      );
      
      if (result.success) {
        clearCart();
        router.push(`/r/${restaurant.slug}/t/${table.name}/sent?orderId=${result.orderId}`);
      } else {
        setError(result.error || 'Failed to submit order');
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="w-16 h-16 text-error" />
        <h1 className="font-display text-headline-md text-primary">Error</h1>
        <p className="text-on-surface-variant">{error || 'Unable to load page'}</p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  // Check if watermark should be shown
  const showWatermark = restaurant?.plan === 'free' || restaurant?.watermarkEnabled === true;

  return (
    <WatermarkSpacer showWatermark={showWatermark}>
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 sticky top-0 bg-surface shadow-card z-40">
        <div className="flex items-center gap-4">
          <Link 
            href={`/r/${restaurant?.slug}/t/${table?.name}`}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </Link>
          <div>
            <h1 className="font-display text-title-sm text-primary">Review Order</h1>
            <p className="text-on-surface-variant font-label-caps text-label-caps">{table?.name}</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 pb-32">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">shopping_cart</span>
            <p className="font-display text-title-sm mb-2">Your cart is empty</p>
            <p className="text-sm mb-6">Add items from the menu to get started</p>
            <Button asChild>
              <Link href={`/r/${restaurant?.slug}/t/${table?.name}`}>Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Items List */}
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div 
                  key={item.itemId} 
                  className="bg-white rounded-xl p-4 shadow-card flex gap-4"
                >
                  <div className="w-20 h-20 rounded-lg bg-surface-variant shrink-0 overflow-hidden relative">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                        <span className="material-symbols-outlined text-outline">restaurant</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-display text-title-sm text-primary">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="text-error text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <p className="text-on-surface-variant text-sm mt-1">${item.price.toFixed(2)} each</p>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-1 py-1">
                        <button
                          onClick={() => handleQuantityChange(item.itemId, -1)}
                          className="w-7 h-7 rounded-full bg-surface text-primary flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-label-caps text-label-caps text-primary w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.itemId, 1)}
                          className="w-7 h-7 rounded-full bg-surface text-primary flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-display text-title-sm text-primary">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-surface-container-low rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-on-surface-variant">Subtotal ({cartItemCount} items)</span>
                <span className="font-display text-title-sm text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-on-surface-variant text-sm">
                Final total will be calculated when the order is accepted.
              </p>
            </div>
          </>
        )}
      </main>

      {/* Bottom Action */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest shadow-[0px_-10px_30px_rgba(58,50,45,0.05)] p-6">
          <Button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Order...
              </>
            ) : (
              `Send Order • $${cartTotal.toFixed(2)}`
            )}
          </Button>
        </div>
      )}
    </div>
    <Watermark show={showWatermark} />
    </WatermarkSpacer>
  );
}
