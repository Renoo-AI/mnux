// Menux Type Definitions

// ============ Enums ============

export type TableState = 'AVAILABLE' | 'ACTIVE' | 'OFFLINE';

export type OrderState = 'NEW' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export type UserRole = 'owner' | 'manager' | 'waiter' | 'staff';

// ============ Core Models ============

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  cuisineType?: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  openingHours?: OpeningHours;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpeningHours {
  weekdays?: string;
  weekends?: string;
  holidays?: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  name: string; // e.g., "T-01", "B-01"
  label?: string; // e.g., "Window Side", "Bar Stool"
  seats: number;
  state: TableState;
  qrCodeUrl: string;
  currentOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  tags?: string[]; // e.g., ["VEGAN", "POPULAR", "BESTSELLER"]
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  totalAmount: number;
  state: OrderState;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledReason?: string;
}

export interface ActivityLog {
  id: string;
  restaurantId: string;
  type: 'order_created' | 'order_accepted' | 'order_completed' | 'order_cancelled' | 'table_opened' | 'table_closed' | 'staff_action' | 'system_event';
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  tableId?: string;
  orderId?: string;
  createdAt: Date;
}

export interface Staff {
  id: string;
  restaurantId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Cart Types ============

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  tableId: string;
  restaurantId: string;
}

// ============ API Types ============

export interface CreateOrderRequest {
  restaurantId: string;
  tableId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    notes?: string;
  }>;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

// ============ Firestore Document Types ============

export interface RestaurantDocument extends Omit<Restaurant, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface TableDocument extends Omit<Table, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface MenuItemDocument extends Omit<MenuItem, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface OrderDocument extends Omit<Order, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}
