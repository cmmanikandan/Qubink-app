import { Shop, ShopPricing, CustomerAddress, Order, Review, UserProfile, NotificationItem } from '@/types';

// Clean initial states: all data is loaded from and stored directly in the database
export const INITIAL_SHOPS: Shop[] = [];

export const INITIAL_PRICING: Record<string, ShopPricing> = {};

export const INITIAL_ADDRESSES: CustomerAddress[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_CUSTOMERS: UserProfile[] = [];
