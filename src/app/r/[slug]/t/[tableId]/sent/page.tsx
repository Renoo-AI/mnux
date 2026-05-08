'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ConciergeBell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { restaurantService } from '@/services/restaurantService';
import { tableService } from '@/services/tableService';
import { orderService } from '@/services/orderService';
import type { Restaurant, Table, Order } from '@/types';

export default function OrderSentPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      {/* Success Indicator */}
      <div className="mb-10 flex flex-col items-center w-full">
        <div className="w-24 h-24 rounded-full bg-surface-container-lowest flex items-center justify-center mb-6 shadow-card border border-surface-variant">
          <CheckCircle className="w-12 h-12 text-secondary" />
        </div>
        <h1 className="font-display text-headline-md text-primary text-center mb-2">Order Received</h1>
        <p className="font-body text-on-surface-variant text-center max-w-xs">
          Your order is confirmed and is being prepared with care.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-card p-6 mb-8">
        {/* Table Header */}
        <div className="flex justify-between items-center border-b border-surface-container pb-4 mb-4">
          <span className="font-label-caps text-label-caps text-outline tracking-widest">TABLE</span>
          <span className="font-display text-title-sm text-primary">{table?.name || 'N/A'}</span>
        </div>
        
        {/* Items List */}
        {order?.items ? (
          <div className="flex flex-col gap-2 py-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start">
                <span className="text-outline mr-4 font-display text-title-sm">{item.quantity}x</span>
                <span className="font-body text-on-surface">{item.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            <div className="flex items-start">
              <span className="text-outline mr-4 font-display text-title-sm">2x</span>
              <span className="font-body text-on-surface">Signature Cappuccino</span>
            </div>
            <div className="flex items-start">
              <span className="text-outline mr-4 font-display text-title-sm">1x</span>
              <span className="font-body text-on-surface">Artisanal Sourdough Toast</span>
            </div>
          </div>
        )}
        
        {/* Operational Indicator */}
        <div className="bg-surface-container-low rounded-lg p-4 flex items-center gap-4 mt-4 border border-surface-container">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="font-body text-on-surface-variant flex-grow">Estimated wait time</span>
          <span className="font-display text-title-sm text-primary">12 mins</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-4">
        <Button
          asChild
          variant="outline"
          className="w-full bg-surface-container rounded-full py-4 flex items-center justify-center gap-2 text-primary"
        >
          <Link href="#">
            <ConciergeBell className="w-5 h-5 text-secondary" />
            Need something else? Call staff
          </Link>
        </Button>
        <Button
          asChild
          className="w-full bg-primary rounded-full py-4 text-on-primary"
        >
          <Link href={`/r/${restaurant?.slug || ''}`}>
            Back to Menu
          </Link>
        </Button>
      </div>
    </main>
  );
}
