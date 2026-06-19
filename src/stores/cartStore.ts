import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  tableId: string | null;
  restaurantId: string | null;
  restaurantSlug: string | null;
  
  // Actions
  setContext: (restaurantId: string, restaurantSlug: string, tableId: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemByItemId: (itemId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      restaurantId: null,
      restaurantSlug: null,
      
      setContext: (restaurantId, restaurantSlug, tableId) => {
        // Clear cart if context changed
        const current = get();
        if (current.restaurantId !== restaurantId || current.tableId !== tableId) {
          set({ 
            items: [], 
            restaurantId, 
            restaurantSlug, 
            tableId 
          });
        }
      },
      
      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(i => i.itemId === item.itemId);
          
          if (existingIndex >= 0) {
            // Update quantity if item exists
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
            };
            return { items: newItems };
          }
          
          // Add new item
          return { items: [...state.items, item] };
        });
      },
      
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter(i => i.itemId !== itemId),
        }));
      },
      
      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter(i => i.itemId !== itemId) };
          }
          
          return {
            items: state.items.map(i => 
              i.itemId === itemId ? { ...i, quantity } : i
            ),
          };
        });
      },
      
      updateNotes: (itemId, notes) => {
        set((state) => ({
          items: state.items.map(i => 
            i.itemId === itemId ? { ...i, notes } : i
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      
      getItemByItemId: (itemId) => {
        return get().items.find(i => i.itemId === itemId);
      },
    }),
    {
      name: 'menux-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
        restaurantId: state.restaurantId,
        restaurantSlug: state.restaurantSlug,
      }),
    }
  )
);
