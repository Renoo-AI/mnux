// MenuxPro Type Definitions
// Complete type system for MVP

// ============ Enums ============

export type TableStatus = 'EMPTY' | 'NEW_ORDER' | 'ACTIVE' | 'AWAITING_PAYMENT' | 'OFFLINE';

export type OrderStatus = 'CREATED' | 'ACCEPTED' | 'PREPARING' | 'SERVED' | 'BILL_REQUESTED' | 'PAID' | 'CLOSED' | 'CANCELLED' | 'REJECTED';

export type TableRequestType = 'CALL_WAITER' | 'REQUEST_BILL';

export type TableRequestStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';

export type StaffRole = 'cashier' | 'owner' | 'admin' | 'waiter';

export type RestaurantStatus = 'ACTIVE' | 'OFFLINE';

export type Currency = 'TND' | 'QAR' | 'EUR' | 'USD';

// Updated plan types - uppercase for consistency
export type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'MAX';

// Legacy plan type alias for backwards compatibility
export type LegacyPlanType = 'free' | 'pro';

export type SlugType = 'FREE_RANDOM' | 'CUSTOM';

// Legacy slug type alias for backwards compatibility
export type LegacySlugType = 'free-random' | 'custom';

// ============ Plan Feature Keys ============

export type PlanFeatureKey = 
  | 'CUSTOM_LOGO'
  | 'CUSTOM_COLORS'
  | 'CUSTOM_BACKGROUND'
  | 'CUSTOM_FAVICON'
  | 'CUSTOM_OPEN_GRAPH'
  | 'CUSTOM_MENU_COVER'
  | 'CUSTOM_TYPOGRAPHY'
  | 'CUSTOM_CSS'
  | 'WHITE_LABEL'
  | 'ADVANCED_BRANDING'
  | 'REMOVE_WATERMARK'
  | 'UNLIMITED_MENU_ITEMS';

// ============ Branding Types ============

export interface BrandingTheme {
  background: string | null;   // Hex color #RRGGBB
  foreground: string | null;   // Hex color #RRGGBB
  primary: string | null;      // Hex color #RRGGBB
  accent: string | null;       // Hex color #RRGGBB
  card: string | null;         // Hex color #RRGGBB
  border: string | null;       // Hex color #RRGGBB
}

export interface BrandingTypography {
  headingFont: string | null;  // Google Font name
  bodyFont: string | null;     // Google Font name
}

export interface BrandingOpenGraph {
  title: string | null;        // Max 80 chars
  description: string | null;  // Max 180 chars
  imageUrl: string | null;     // URL to OG image
}

export interface BrandingCustomCss {
  enabled: boolean;
  css: string | null;          // Max 10,000 chars
  updatedAt: Date | null;
}

export interface BrandingWhiteLabel {
  enabled: boolean;
  hideMenuxBranding: boolean;
}

export interface Branding {
  logoUrl: string | null;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
  faviconUrl: string | null;
  theme: BrandingTheme;
  typography: BrandingTypography;
  openGraph: BrandingOpenGraph;
  customCss: BrandingCustomCss;
  whiteLabel: BrandingWhiteLabel;
}

// Default branding (MenuxPRO defaults)
export const DEFAULT_BRANDING: Branding = {
  logoUrl: null,
  coverImageUrl: null,
  backgroundImageUrl: null,
  faviconUrl: null,
  theme: {
    background: null,
    foreground: null,
    primary: null,
    accent: null,
    card: null,
    border: null,
  },
  typography: {
    headingFont: null,
    bodyFont: null,
  },
  openGraph: {
    title: null,
    description: null,
    imageUrl: null,
  },
  customCss: {
    enabled: false,
    css: null,
    updatedAt: null,
  },
  whiteLabel: {
    enabled: false,
    hideMenuxBranding: false,
  },
};

// MenuxPRO default colors (for fallback)
export const MENUXPRO_DEFAULTS = {
  background: '#FCFBF9',
  foreground: '#3A322D',
  primary: '#3A322D',
  accent: '#C9A07E',
  card: '#FFFFFF',
  border: '#EFE4D8',
} as const;

// ============ Core Models ============

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  status: RestaurantStatus;
  currency: Currency;
  cuisineType?: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  ownerUid?: string;
  // Plan fields
  plan: PlanType;
  slugType: SlugType;
  watermarkEnabled: boolean;
  maxMenuItems: number;
  // Enhanced branding (plan-based)
  branding?: Branding;
  // Legacy branding fields (for backwards compatibility)
  primaryColor?: string;
  accentColor?: string;
  openingHours?: OpeningHours;
  // Staff management
  staffUids?: Record<string, string>; // uid -> role mapping
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
  status: TableStatus;
  qrCodeUrl: string;
  activeOrderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy type alias for backwards compatibility
export type TableState = TableStatus;

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
  available: boolean;
  isFeatured?: boolean;
  tags?: string[]; // e.g., ["VEGAN", "POPULAR", "BESTSELLER"]
  allergens?: string[]; // e.g., ["GLUTEN", "DAIRY", "NUTS"]
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  customerNote?: string;
  rejectReason?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  paidAt?: Date;
  closedAt?: Date;
  cancelledAt?: Date;
}

// Legacy type alias for backwards compatibility
export type OrderState = OrderStatus;

export interface StaffMember {
  id: string;
  restaurantId: string;
  name: string;
  role: StaffRole;
  pinHash?: string;
  pin?: string; // Only for demo/seed purposes
  active: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy type alias for backwards compatibility
export type Staff = StaffMember;
export type UserRole = StaffRole;

export type LogAction =
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_CANCELLED'
  | 'ORDER_PAID'
  | 'ORDER_CLOSED'
  | 'TABLE_DISABLED'
  | 'TABLE_ENABLED'
  | 'MENU_ITEM_UPDATED'
  | 'STAFF_LOGIN';

export interface ActivityLog {
  id: string;
  restaurantId: string;
  actorId?: string;
  actorName?: string;
  actorRole?: StaffRole | 'customer' | 'system';
  action: LogAction;
  targetType: 'order' | 'table' | 'menuItem' | 'staff' | 'restaurant';
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  message?: string; // Legacy field
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  tableId?: string;
  orderId?: string;
  createdAt: Date;
}

// ============ Staff Session Types ============

export interface StaffSession {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
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

// ============ Cashier Action Types ============

export interface AcceptOrderParams {
  restaurantId: string;
  orderId: string;
  tableId: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
}

export interface RejectOrderParams {
  restaurantId: string;
  orderId: string;
  tableId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
}

export interface MarkPaidParams {
  restaurantId: string;
  orderId: string;
  tableId: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
}

export interface CloseOrderParams {
  restaurantId: string;
  orderId: string;
  tableId: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
}

export interface CancelOrderParams {
  restaurantId: string;
  orderId: string;
  tableId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
}

// ============ Firestore Document Types ============

export interface RestaurantDocument extends Omit<Restaurant, 'createdAt' | 'updatedAt' | 'branding'> {
  branding?: BrandingDocument;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface BrandingDocument extends Omit<Branding, 'customCss'> {
  customCss?: {
    enabled: boolean;
    css: string | null;
    updatedAt: { seconds: number; nanoseconds: number } | null;
  };
}

export interface TableDocument extends Omit<Table, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface MenuItemDocument extends Omit<MenuItem, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface MenuCategoryDocument extends Omit<MenuCategory, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface OrderDocument extends Omit<Order, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface StaffDocument extends Omit<StaffMember, 'createdAt' | 'updatedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export interface ActivityLogDocument extends Omit<ActivityLog, 'createdAt'> {
  createdAt: { seconds: number; nanoseconds: number };
}

// ============ Table Request Types ============

export interface TableRequest {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  type: TableRequestType;
  status: TableRequestStatus;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface TableRequestDocument extends Omit<TableRequest, 'createdAt' | 'acknowledgedAt' | 'resolvedAt'> {
  createdAt: { seconds: number; nanoseconds: number };
  acknowledgedAt?: { seconds: number; nanoseconds: number };
  resolvedAt?: { seconds: number; nanoseconds: number };
}

// ============ Branding API Types ============

export interface UpdateBrandingRequest {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  faviconUrl?: string | null;
  theme?: Partial<BrandingTheme>;
  typography?: Partial<BrandingTypography>;
  openGraph?: Partial<BrandingOpenGraph>;
  customCss?: Partial<BrandingCustomCss>;
  whiteLabel?: Partial<BrandingWhiteLabel>;
}

export interface BrandingSettings {
  plan: PlanType;
  features: Record<PlanFeatureKey, boolean>;
  branding: Branding;
  limits: {
    maxLogoSize: number;       // in bytes
    maxCoverSize: number;
    maxBackgroundSize: number;
    maxOgSize: number;
    maxFaviconSize: number;
    maxCustomCssLength: number;
    maxOgTitleLength: number;
    maxOgDescriptionLength: number;
  };
}
