export type UserRole = 'customer' | 'shop' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  name?: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  shopId?: string; // ID of owned shop (for shop portal context)
  isBlocked?: boolean;
  createdAt: string;
}

export type ShopStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district?: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  mapUrl?: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  isPickupAvailable: boolean;
  isDeliveryAvailable: boolean;
  estimatedPrepTime: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  status: ShopStatus;
  services: string[]; // e.g. ['Xerox', 'Printing', 'Scanning', 'Binding', 'Lamination']
  distanceKm?: number;
  upiId?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankBeneficiary?: string;
}

export interface ShopPricing {
  shopId: string;
  bwA4: number;
  colorA4: number;
  bwA3: number;
  colorA3: number;
  bindingPrice: number;
  laminationPrice: number;
  deliveryFee: number;
}

export type AddressLabel = 'Home' | 'College' | 'Office' | 'Other';

export interface CustomerAddress {
  id: string;
  userId: string;
  label: AddressLabel;
  addressLine: string;
  landmark?: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  fileName?: string;
  fileSize?: number;
  size?: number;
  fileType?: string;
  pageCount: number;
  mimeType?: string;
  fileUrl?: string;
}

export type PrintType = 'BW' | 'COLOR';
export type PrintSides = 'SINGLE' | 'DOUBLE';
export type PaperSize = 'A4' | 'A3';

export interface PrintSettings {
  printType: PrintType;
  sides: PrintSides;
  paperSize: PaperSize;
  copies: number;
  hasBinding: boolean;
  hasStapling: boolean;
  hasLamination: boolean;
  pageRangeType?: 'ALL' | 'CUSTOM';
  customRange?: string; // e.g. "1-10, 15, 20-25"
}

export interface OrderItem {
  id: string;
  documentName: string;
  documentUrl?: string;
  pageCount: number;
  settings: PrintSettings;
  itemPrice: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PRINTING'
  | 'READY'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  shopId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: CustomerAddress;
  deliveryAddressId?: string;
  deliveryAddressText?: string;
  paymentMethod: 'PAY_AT_SHOP' | 'CASH_ON_DELIVERY' | 'ONLINE' | 'UPI' | 'RAZORPAY' | 'CASH';
  paymentStatus: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'REFUNDED';
  upiRefId?: string;
  subtotal: number;
  bindingTotal: number;
  laminationTotal: number;
  deliveryFee: number;
  couponDiscount?: number;
  couponCode?: string;
  totalAmount: number;
  pickupCode: string;
  items: OrderItem[];
  notes?: string;
  rejectionReason?: string;
  rating?: number;        // Customer rating (1-5) after delivery
  reviewComment?: string; // Customer review text
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  shopId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  type: 'order_update' | 'system' | 'promotion';
  isRead: boolean;
  createdAt: string;
}
