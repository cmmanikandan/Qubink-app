'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
  Shop,
  ShopPricing,
  CustomerAddress,
  DocumentItem,
  PrintSettings,
  Order,
  OrderStatus,
  FulfillmentType,
  Review,
  NotificationItem,
} from '@/types';
import { calculateDistanceKm, DEFAULT_CUSTOMER_LOCATION, reverseGeocodeWithGeoapify, GEOAPIFY_API_KEY } from '@/lib/geo';
import { parsePageRangeCount } from '@/lib/pdfHelper';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserProfile,
  updateUserProfile,
  fetchUserAddresses,
  insertAddressToDb,
  updateAddressInDb,
  deleteAddressFromDb,
  setDefaultAddressInDb,
  fetchShopsFromDb,
  insertShopToDb,
  updateShopInDb,
  fetchOrdersFromDb,
  insertOrderToDb,
  updateOrderStatusInDb,
} from '@/lib/supabase';

interface CartState {
  shopId: string | null;
  selectedShopId?: string | null;
  documents: DocumentItem[];
  settingsMap: Record<string, PrintSettings>;
  fulfillmentType: FulfillmentType;
  addressId: string | null;
  notes: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: Partial<UserProfile>) => void;
  shops: Shop[];
  pricing: Record<string, ShopPricing>;
  orders: Order[];
  addresses: CustomerAddress[];
  notifications: NotificationItem[];
  cart: CartState;
  userLocation: typeof DEFAULT_CUSTOMER_LOCATION;
  searchRadius: number;
  locationStatus: 'prompt' | 'granted' | 'denied';
  requestLocation: () => Promise<boolean>;
  setManualLocation: (area: string, pincode: string, coords?: { lat: number; lng: number }, city?: string) => void;
  setSearchRadius: (km: number) => void;
  // Cart & Order
  setSelectedShop: (shopId: string) => void;
  addDocumentToCart: (doc: DocumentItem) => void;
  updateDocumentInCart: (docId: string, updates: Partial<DocumentItem>) => void;
  removeDocumentFromCart: (docId: string) => void;
  updateDocumentSettings: (docId: string, settings: Partial<PrintSettings>) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setAddressId: (addrId: string) => void;
  setCartNotes: (notes: string) => void;
  clearCart: () => void;
  calculatePricing: (
    shopId: string,
    docs: DocumentItem[],
    settings: Record<string, PrintSettings>,
    fulfillment: FulfillmentType
  ) => {
    subtotal: number;
    bindingTotal: number;
    laminationTotal: number;
    deliveryFee: number;
    total: number;
  };
  placeOrder: (paymentInfo?: {
    paymentMethod?: 'PAY_AT_SHOP' | 'CASH_ON_DELIVERY' | 'ONLINE' | 'UPI' | 'RAZORPAY' | 'CASH';
    upiRefId?: string;
    couponDiscount?: number;
    couponCode?: string;
  }) => Promise<Order>;
  updateOrderPayment: (
    orderId: string,
    paymentMethod: 'CASH' | 'CASH_ON_DELIVERY' | 'PAY_AT_SHOP' | 'UPI' | 'RAZORPAY',
    paymentStatus: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID',
    upiRefId?: string
  ) => Promise<void>;
  // Shop operations
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string, paymentStatus?: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'REFUNDED') => void;
  updateShopPricing: (shopId: string, newPricing: Partial<ShopPricing>) => void;
  updateShopProfile: (shopId: string, updates: Partial<Shop>) => void;
  registerShop: (shopData: Partial<Shop>, initialPricing: Partial<ShopPricing>) => void;
  // Admin operations
  approveShop: (shopId: string) => void;
  rejectShop: (shopId: string) => void;
  suspendShop: (shopId: string) => void;
  reactivateShop: (shopId: string) => void;
  toggleShopSuspension: (shopId: string) => void;
  updateShopStatus: (shopId: string, updates: Partial<Shop>) => void;
  verifyPickupCode: (orderId: string, code: string) => boolean;
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
  customersList: UserProfile[];
  toggleBlockCustomer: (customerId: string) => void;
  // Addresses & Reviews
  addAddress: (addr: Omit<CustomerAddress, 'id' | 'userId'>) => Promise<void>;
  updateAddress: (id: string, updates: Partial<CustomerAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addReview: (orderId: string, shopId: string, rating: number, comment: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  logout: () => void;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  printType: 'BW',
  sides: 'SINGLE',
  paperSize: 'A4',
  copies: 1,
  hasBinding: false,
  hasStapling: false,
  hasLamination: false,
  pageRangeType: 'ALL',
  customRange: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('customer');
  const [userLocation, setUserLocation] = useState(DEFAULT_CUSTOMER_LOCATION);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [commissionRate, setCommissionRate] = useState<number>(5);

  // Clean initial states: zero hardcoded demo records
  const [shops, setShops] = useState<Shop[]>([]);
  const [pricing, setPricing] = useState<Record<string, ShopPricing>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [customersList, setCustomersList] = useState<UserProfile[]>([]);

  const [cart, setCart] = useState<CartState>({
    shopId: null,
    selectedShopId: null,
    documents: [],
    settingsMap: {},
    fulfillmentType: 'PICKUP',
    addressId: null,
    notes: '',
  });

  const [customUser, setCustomUser] = useState<Partial<UserProfile> | null>(null);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qubink_active_role', newRole);
    }
  };

  // Restore authenticated session and orders cache from localStorage on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('qubink_active_role') as UserRole;
      if (storedRole) setRoleState(storedRole);

      const storedUser = localStorage.getItem('qubink_active_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCustomUser(parsed);
          if (parsed.role) setRoleState(parsed.role);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      const storedOrders = localStorage.getItem('qubink_orders_cache');
      if (storedOrders) {
        try {
          const parsedOrders = JSON.parse(storedOrders);
          if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
            setOrders(parsedOrders);
          }
        } catch (e) {
          console.error('Error parsing stored orders:', e);
        }
      }

      const storedLoc = localStorage.getItem('qubink_user_location');
      if (storedLoc) {
        try {
          const parsedLoc = JSON.parse(storedLoc);
          if (
            parsedLoc?.areaName &&
            parsedLoc?.lat >= 9.5 &&
            !parsedLoc.areaName.toLowerCase().includes('thiruvananthapuram') &&
            !parsedLoc.areaName.toLowerCase().includes('vanchiyoor')
          ) {
            setUserLocation(parsedLoc);
          } else {
            // Reset to user's home in Kallimandhayam
            setUserLocation(DEFAULT_CUSTOMER_LOCATION);
            localStorage.setItem('qubink_user_location', JSON.stringify(DEFAULT_CUSTOMER_LOCATION));
          }
        } catch (e) {
          console.error('Error parsing stored user location:', e);
        }
      }
    }
  }, []);

  // Sync profile changes to localStorage and database
  const setCurrentUser = (user: Partial<UserProfile>) => {
    setCustomUser((prev) => {
      const updated = { ...(prev || {}), ...user } as UserProfile;
      if (typeof window !== 'undefined') {
        localStorage.setItem('qubink_active_user', JSON.stringify(updated));
      }
      if (updated.id) {
        updateUserProfile(updated.id, updated);
      }
      return updated;
    });
  };

  const currentUser: UserProfile = {
    id: customUser?.id || '',
    role: (customUser?.role as UserRole) || role,
    fullName: customUser?.fullName || customUser?.name || (role === 'shop' ? 'Shop Partner' : role === 'admin' ? 'Marketplace Admin' : 'User'),
    name: customUser?.name || customUser?.fullName || (role === 'shop' ? 'Shop Partner' : role === 'admin' ? 'Marketplace Admin' : 'User'),
    email: customUser?.email || '',
    phone: customUser?.phone || '',
    avatarUrl: customUser?.avatarUrl || '',
    createdAt: customUser?.createdAt || new Date().toISOString(),
  };

  // 1. Fetch Real Shops from Database
  useEffect(() => {
    fetchShopsFromDb().then(({ shops: dbShops, pricing: dbPricing }) => {
      if (dbShops && dbShops.length > 0) {
        setShops(dbShops);
        setPricing(dbPricing);
      }
    });
  }, []);

  // 2. Fetch User-Specific Real Data from Database whenever user logs in
  useEffect(() => {
    if (!currentUser.id) return;

    // Fetch user profile (to load avatar_url, phone, and name from Supabase)
    fetchUserProfile(currentUser.id).then((p) => {
      if (p) {
        setCustomUser((prev) => ({
          ...prev,
          fullName: p.full_name || prev?.fullName,
          name: p.full_name || prev?.name,
          email: p.email || prev?.email,
          phone: p.phone || prev?.phone || '',
          avatarUrl: p.avatar_url || prev?.avatarUrl || '',
        }));
      }
    });

    // Fetch saved delivery addresses for this user
    fetchUserAddresses(currentUser.id).then((dbAddresses) => {
      setAddresses(dbAddresses);
      if (dbAddresses.length > 0) {
        const defaultAddr = dbAddresses.find((a) => a.isDefault) || dbAddresses[0];
        setCart((prev) => ({ ...prev, addressId: defaultAddr?.id || null }));
        if (defaultAddr && defaultAddr.city) {
          setUserLocation((prev) => ({
            ...prev,
            areaName: defaultAddr.landmark ? `${defaultAddr.landmark}, ${defaultAddr.city}` : defaultAddr.city,
            pincode: defaultAddr.pincode || prev.pincode,
          }));
        }
      }
    });

    // Fetch orders for this user / shop
    fetchOrdersFromDb(currentUser.id, role, currentUser.shopId).then((dbOrders) => {
      if (dbOrders && dbOrders.length > 0) {
        setOrders((prev) => {
          const dbMap = new Map(dbOrders.map((o) => [o.id, o]));
          // Keep local orders that might not yet be in dbOrders
          const merged = [...dbOrders];
          prev.forEach((localOrder) => {
            if (!dbMap.has(localOrder.id)) {
              merged.push(localOrder);
            }
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('qubink_orders_cache', JSON.stringify(merged.slice(0, 50)));
          }
          return merged;
        });
      }
    });

    // If admin, load real registered customers list from Supabase
    if (role === 'admin') {
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .then(({ data }) => {
          if (data) {
            setCustomersList(
              data.map((p: any) => ({
                id: p.id,
                role: 'customer',
                fullName: p.full_name,
                name: p.full_name,
                email: p.email,
                phone: p.phone || '',
                isBlocked: !!p.is_blocked,
                createdAt: p.created_at,
              }))
            );
          }
        });
    }
  }, [currentUser.id, role]);

  // Calculate distance whenever userLocation or shops change
  const computedShops = shops.map((s) => ({
    ...s,
    distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, s.latitude, s.longitude),
  }));

  // Browser geolocation with Real Live Reverse Geocoding via Geoapify
  const requestLocation = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    setLocationStatus('prompt');

    // 1. Try Browser Geolocation API first
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        let lat = pos.coords.latitude;
        let lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // If browser returns an ISP server in Kerala (lat < 9.5) or accuracy > 4000m on desktop:
        // Automatically default to Tamil Nadu / Kallimandhayam (lat 10.5838, lng 77.6908)
        if (lat < 9.5 || accuracy > 4000) {
          try {
            const ipRes = await fetch(`https://api.geoapify.com/v1/ipinfo?apiKey=${GEOAPIFY_API_KEY}`);
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.state?.name?.toLowerCase().includes('tamil') || ipData.country?.iso_code === 'IN') {
                lat = 10.5838;
                lng = 77.6908;
              }
            }
          } catch {
            lat = 10.5838;
            lng = 77.6908;
          }
        }

        // Accurate Reverse Geocoding via Geoapify API
        const geoResult = await reverseGeocodeWithGeoapify(lat, lng);
        const detectedArea = geoResult?.areaName || 'Kallimandhayam, Dindigul';
        const detectedCity = geoResult?.city || 'Dindigul';
        const detectedPincode = geoResult?.pincode || '624616';

        const detectedLoc = {
          lat,
          lng,
          areaName: detectedArea,
          city: detectedCity,
          pincode: detectedPincode,
          isSet: true,
        };
        setUserLocation(detectedLoc);
        if (typeof window !== 'undefined') {
          localStorage.setItem('qubink_user_location', JSON.stringify(detectedLoc));
        }
        setLocationStatus('granted');
        return true;
      } catch (geoErr) {
        console.warn('Browser GPS unavailable or timed out:', geoErr);
      }
    }

    // Do NOT override with ISP telecom hub (which falsely reports Namakkal).
    // If user has a previously confirmed location in localStorage, keep it.
    try {
      const saved = localStorage.getItem('qubink_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isSet && parsed?.areaName) {
          setUserLocation(parsed);
          setLocationStatus('granted');
          return true;
        }
      }
    } catch {
      // ignore
    }

    setLocationStatus('denied');
    return false;
  };

  const setManualLocation = (
    area: string,
    pincode: string,
    coords?: { lat: number; lng: number },
    city?: string
  ) => {
    setUserLocation((prev) => {
      const next = {
        ...prev,
        lat: coords?.lat ?? prev.lat,
        lng: coords?.lng ?? prev.lng,
        areaName: area,
        city: city || area,
        pincode,
        isSet: true,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('qubink_user_location', JSON.stringify(next));
      }
      return next;
    });
    setLocationStatus('granted');
  };

  // Cart & Order Operations
  const setSelectedShop = (shopId: string) => {
    setCart((prev) => ({ ...prev, shopId, selectedShopId: shopId }));
  };

  const addDocumentToCart = (doc: DocumentItem) => {
    setCart((prev) => {
      const exists = prev.documents.some((d) => d.id === doc.id);
      if (exists) return prev;
      return {
        ...prev,
        documents: [...prev.documents, doc],
        settingsMap: {
          ...prev.settingsMap,
          [doc.id]: DEFAULT_PRINT_SETTINGS,
        },
      };
    });
  };

  const updateDocumentInCart = (docId: string, updates: Partial<DocumentItem>) => {
    setCart((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === docId ? { ...d, ...updates } : d)),
    }));
  };

  const removeDocumentFromCart = (docId: string) => {
    setCart((prev) => {
      const newSettings = { ...prev.settingsMap };
      delete newSettings[docId];
      return {
        ...prev,
        documents: prev.documents.filter((d) => d.id !== docId),
        settingsMap: newSettings,
      };
    });
  };

  const updateDocumentSettings = (docId: string, settings: Partial<PrintSettings>) => {
    setCart((prev) => ({
      ...prev,
      settingsMap: {
        ...prev.settingsMap,
        [docId]: {
          ...(prev.settingsMap[docId] || DEFAULT_PRINT_SETTINGS),
          ...settings,
        },
      },
    }));
  };

  const setFulfillmentType = (fulfillmentType: FulfillmentType) => {
    setCart((prev) => ({ ...prev, fulfillmentType }));
  };

  const setAddressId = (addressId: string) => {
    setCart((prev) => ({ ...prev, addressId }));
  };

  const setCartNotes = (notes: string) => {
    setCart((prev) => ({ ...prev, notes }));
  };

  const clearCart = () => {
    setCart({
      shopId: null,
      selectedShopId: null,
      documents: [],
      settingsMap: {},
      fulfillmentType: 'PICKUP',
      addressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null,
      notes: '',
    });
  };

  const calculatePricing = (
    shopId: string,
    docs: DocumentItem[],
    settings: Record<string, PrintSettings>,
    fulfillment: FulfillmentType
  ) => {
    const shopRates = pricing[shopId] || {
      shopId,
      bwA4: 2.0,
      colorA4: 10.0,
      bwA3: 5.0,
      colorA3: 20.0,
      bindingPrice: 35.0,
      laminationPrice: 25.0,
      deliveryFee: 30.0,
    };

    let subtotal = 0;
    let bindingTotal = 0;
    let laminationTotal = 0;

    docs.forEach((doc) => {
      const s = settings[doc.id] || DEFAULT_PRINT_SETTINGS;
      const totalPages = doc.pageCount || 1;
      const rangeResult = parsePageRangeCount(s.pageRangeType, s.customRange, totalPages);
      const pCount = rangeResult.count;
      const copies = s.copies || 1;

      let perPage = shopRates.bwA4;
      if (s.paperSize === 'A3') {
        perPage = s.printType === 'COLOR' ? shopRates.colorA3 : shopRates.bwA3;
      } else {
        perPage = s.printType === 'COLOR' ? shopRates.colorA4 : shopRates.bwA4;
      }

      subtotal += perPage * pCount * copies;
      if (s.hasBinding) bindingTotal += shopRates.bindingPrice * copies;
      if (s.hasLamination) laminationTotal += shopRates.laminationPrice * pCount * copies;
    });

    const deliveryFee = fulfillment === 'DELIVERY' ? shopRates.deliveryFee : 0;
    const total = subtotal + bindingTotal + laminationTotal + deliveryFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      bindingTotal: Math.round(bindingTotal * 100) / 100,
      laminationTotal: Math.round(laminationTotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };

  const placeOrder = async (paymentInfo?: {
    paymentMethod?: 'PAY_AT_SHOP' | 'CASH_ON_DELIVERY' | 'ONLINE' | 'UPI' | 'RAZORPAY' | 'CASH';
    upiRefId?: string;
    couponDiscount?: number;
    couponCode?: string;
  }): Promise<Order> => {
    const selectedShop = shops.find((s) => s.id === cart.shopId) || shops[0];
    if (!selectedShop) {
      throw new Error('Please select a print shop first.');
    }

    const { subtotal, bindingTotal, laminationTotal, deliveryFee, total } = calculatePricing(
      selectedShop.id,
      cart.documents,
      cart.settingsMap,
      cart.fulfillmentType
    );

    // Derive clean shop code prefix from shop name (e.g. "MKCE" -> "MKCE", "Speed Xerox" -> "SPEED")
    const rawShopName = (selectedShop.name || 'QB').trim();
    const shopPrefix = rawShopName.split(/[\s-]+/)[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'QB';

    // Calculate sequential order number starting from 1 for this shop (e.g. MKCE-001, MKCE-002, etc.)
    let highestShopSeq = 0;
    orders.forEach((o) => {
      if (o.orderNumber) {
        const regex = new RegExp(`^${shopPrefix}-(\\d+)`, 'i');
        const match = o.orderNumber.match(regex);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > highestShopSeq) highestShopSeq = n;
        }
      }
    });

    let storedShopSeq = 0;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`qubink_order_seq_${selectedShop.id}`);
        if (saved) {
          const val = parseInt(saved, 10);
          if (!isNaN(val)) storedShopSeq = val;
        }
      }
    } catch {}

    const nextSeq = Math.max(highestShopSeq, storedShopSeq) + 1;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`qubink_order_seq_${selectedShop.id}`, String(nextSeq));
      }
    } catch {}

    const orderNum = `${shopPrefix}-${String(nextSeq).padStart(3, '0')}`;
    const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
    const chosenAddress = addresses.find((a) => a.id === cart.addressId);

    const couponDiscount = paymentInfo?.couponDiscount || 0;
    const finalTotal = Math.max(0, Math.round((total - couponDiscount) * 100) / 100);

    const resolvedPaymentMethod =
      paymentInfo?.paymentMethod ||
      (cart.fulfillmentType === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'CASH');

    const resolvedPaymentStatus =
      resolvedPaymentMethod === 'UPI' && paymentInfo?.upiRefId
        ? 'PENDING_VERIFICATION'
        : resolvedPaymentMethod === 'RAZORPAY'
        ? 'PAID'
        : 'PENDING';

    const newOrder: Order = {
      id: `ord-${Date.now()}-${nextSeq}`,
      orderNumber: orderNum,
      customerId: currentUser.id || 'guest',
      customerName: currentUser.fullName || currentUser.name || 'Customer',
      customerPhone: currentUser.phone || '',
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      shopPhone: selectedShop.phone,
      shopAddress: selectedShop.address,
      status: 'PLACED',
      fulfillmentType: cart.fulfillmentType,
      deliveryAddress: chosenAddress,
      deliveryAddressText: chosenAddress
        ? `${chosenAddress.addressLine}, ${chosenAddress.city} - ${chosenAddress.pincode}`
        : undefined,
      paymentMethod: resolvedPaymentMethod,
      paymentStatus: resolvedPaymentStatus,
      upiRefId: paymentInfo?.upiRefId,
      subtotal,
      bindingTotal,
      laminationTotal,
      deliveryFee,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      couponCode: paymentInfo?.couponCode || (couponDiscount > 0 ? 'SAVE50' : undefined),
      totalAmount: finalTotal,
      pickupCode,
      notes: cart.notes,
      items: cart.documents.map((d) => {
        const s = cart.settingsMap[d.id] || DEFAULT_PRINT_SETTINGS;
        const totalPages = d.pageCount || 1;
        const rangeResult = parsePageRangeCount(s.pageRangeType, s.customRange, totalPages);
        const pCount = rangeResult.count;
        const shopRates = pricing[selectedShop.id] || { bwA4: 2.0, colorA4: 10.0, bwA3: 5.0, colorA3: 20.0 };
        const rate =
          s.paperSize === 'A3'
            ? s.printType === 'COLOR'
              ? shopRates.colorA3
              : shopRates.bwA3
            : s.printType === 'COLOR'
            ? shopRates.colorA4
            : shopRates.bwA4;
        const itemPrice = pCount * rate * s.copies;
        return {
          id: `item-${Date.now()}-${d.id}`,
          documentName: d.fileName || d.name || 'Document.pdf',
          documentUrl: d.fileUrl, // Persists data URL for preview/download in order tracking
          pageCount: pCount,
          settings: s,
          itemPrice,
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in Supabase database
    await insertOrderToDb(newOrder);

    // Update local state and persist to cache
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('qubink_orders_cache', JSON.stringify(updated.slice(0, 50)));
      }
      return updated;
    });

    // Send notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      orderId: newOrder.id,
      title: 'Order Placed Successfully! 📄',
      message: `Your print order ${newOrder.orderNumber} has been sent to ${selectedShop.name}.`,
      type: 'order_update',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    clearCart();
    return newOrder;
  };

  // Order status progression
  const updateOrderStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string,
    paymentStatus?: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'REFUNDED'
  ) => {
    // Persist to Supabase database
    await updateOrderStatusInDb(orderId, nextStatus, reason, paymentStatus);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          return {
            ...o,
            status: nextStatus,
            rejectionReason: reason || o.rejectionReason,
            paymentStatus: paymentStatus ?? o.paymentStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
  };

  // Update order payment method and mark paid or pending
  const updateOrderPayment = async (
    orderId: string,
    paymentMethod: 'CASH' | 'CASH_ON_DELIVERY' | 'PAY_AT_SHOP' | 'UPI' | 'RAZORPAY',
    paymentStatus: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID',
    upiRefId?: string
  ) => {
    // 1. Update in Supabase
    await updateOrderStatusInDb(orderId, undefined, undefined, paymentStatus, paymentMethod, upiRefId);

    // 2. Update local state & cache
    let foundOrderNumber = orderId;
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          foundOrderNumber = o.orderNumber;
          return {
            ...o,
            paymentMethod,
            paymentStatus,
            upiRefId: upiRefId !== undefined ? upiRefId : o.upiRefId,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('qubink_orders_cache', JSON.stringify(updated.slice(0, 50)));
      }
      return updated;
    });

    // 3. Send notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      orderId: orderId,
      title: paymentStatus === 'PAID' ? 'Payment Received! 💳' : 'Payment Method Updated',
      message:
        paymentStatus === 'PAID'
          ? `Your payment for Order #${foundOrderNumber} has been verified as PAID.`
          : `Payment method for Order #${foundOrderNumber} has been updated to ${paymentMethod}.`,
      type: 'order_update',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Shop Profile Updates
  const updateShopPricing = (shopId: string, newPricing: Partial<ShopPricing>) => {
    setPricing((prev) => ({
      ...prev,
      [shopId]: {
        ...(prev[shopId] || {
          shopId,
          bwA4: 2.0,
          colorA4: 10.0,
          bwA3: 5.0,
          colorA3: 20.0,
          bindingPrice: 35.0,
          laminationPrice: 25.0,
          deliveryFee: 30.0,
        }),
        ...newPricing,
      },
    }));
  };

  const updateShopProfile = async (shopId: string, updates: Partial<Shop>) => {
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, ...updates } : s))
    );
    await updateShopInDb(shopId, updates);
  };

  const registerShop = async (shopData: Partial<Shop>, initialPricing: Partial<ShopPricing>) => {
    // Persist into Supabase database
    const newShop = await insertShopToDb(currentUser.id, shopData, initialPricing);

    if (newShop) {
      setShops((prev) => [newShop, ...prev]);
      setPricing((prev) => ({
        ...prev,
        [newShop.id]: {
          shopId: newShop.id,
          bwA4: initialPricing.bwA4 || 2.0,
          colorA4: initialPricing.colorA4 || 10.0,
          bwA3: initialPricing.bwA3 || 5.0,
          colorA3: initialPricing.colorA3 || 20.0,
          bindingPrice: initialPricing.bindingPrice || 35.0,
          laminationPrice: initialPricing.laminationPrice || 25.0,
          deliveryFee: initialPricing.deliveryFee || 30.0,
        },
      }));
    }
  };

  // Admin Shop Actions
  const approveShop = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, status: 'APPROVED' } : s))
    );
    supabase.from('shops').update({ status: 'approved' }).eq('id', shopId);
  };

  const rejectShop = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, status: 'REJECTED' } : s))
    );
    supabase.from('shops').update({ status: 'rejected' }).eq('id', shopId);
  };

  const suspendShop = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, status: 'SUSPENDED' } : s))
    );
    supabase.from('shops').update({ status: 'suspended' }).eq('id', shopId);
  };

  const reactivateShop = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, status: 'APPROVED' } : s))
    );
    supabase.from('shops').update({ status: 'approved' }).eq('id', shopId);
  };

  const toggleShopSuspension = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => {
        if (s.id === shopId) {
          const nextStatus = s.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
          supabase.from('shops').update({ status: nextStatus.toLowerCase() }).eq('id', shopId);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const updateShopStatus = async (shopId: string, updates: Partial<Shop>) => {
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, ...updates } : s))
    );
    await updateShopInDb(shopId, updates);
  };

  const verifyPickupCode = (orderId: string, code: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (order && order.pickupCode.toUpperCase() === code.trim().toUpperCase()) {
      updateOrderStatus(orderId, 'COMPLETED');
      return true;
    }
    return false;
  };

  const toggleBlockCustomer = (customerId: string) => {
    setCustomersList((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const nextBlocked = !c.isBlocked;
          supabase.from('profiles').update({ is_blocked: nextBlocked }).eq('id', customerId);
          return { ...c, isBlocked: nextBlocked };
        }
        return c;
      })
    );
  };

  // Addresses API (Real Supabase persistence)
  const addAddress = async (addr: Omit<CustomerAddress, 'id' | 'userId'>) => {
    const saved = await insertAddressToDb(currentUser.id, addr);
    if (saved) {
      setAddresses((prev) => [
        saved,
        ...prev.map((a) => (addr.isDefault ? { ...a, isDefault: false } : a)),
      ]);
    }
  };

  const updateAddress = async (id: string, updates: Partial<CustomerAddress>) => {
    await updateAddressInDb(id, updates, currentUser.id);
    setAddresses((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return { ...a, ...updates };
        }
        if (updates.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      })
    );
  };

  const setDefaultAddress = async (id: string) => {
    await setDefaultAddressInDb(id, currentUser.id);
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const deleteAddress = async (id: string) => {
    await deleteAddressFromDb(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const addReview = async (orderId: string, shopId: string, rating: number, comment: string) => {
    // 1. Update order locally with customer rating and comment
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId ? { ...o, rating, reviewComment: comment } : o
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('qubink_orders_cache', JSON.stringify(updated.slice(0, 50)));
      }
      return updated;
    });

    // 2. Dynamically compute the real shop average rating and review count
    setShops((prev) =>
      prev.map((s) => {
        if (s.id === shopId) {
          const matchingOrders = orders.filter((o) => o.shopId === shopId && o.rating !== undefined && o.id !== orderId);
          const allRatings = [...matchingOrders.map((o) => o.rating!), rating];
          const newAvg = Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10;
          const newCount = (s.reviewCount || 0) + 1;
          // Persist shop rating to database
          supabase.from('shops').update({ rating: newAvg, review_count: newCount }).eq('id', shopId);
          return { ...s, rating: newAvg, reviewCount: newCount };
        }
        return s;
      })
    );

    // 3. Save review record in Supabase
    await supabase.from('reviews').insert({
      order_id: orderId,
      customer_id: currentUser.id,
      shop_id: shopId,
      rating,
      comment,
    });

    // 4. Update order row in Supabase
    await supabase.from('orders').update({
      rating,
      review_comment: comment,
    }).eq('id', orderId);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qubink_active_user');
      localStorage.removeItem('qubink_active_role');
      // If customer has an onboarding flag, clean it up or leave it
    }
    setCustomUser(null);
    setRoleState('customer');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        shops: computedShops,
        pricing,
        orders,
        addresses,
        notifications,
        cart,
        userLocation,
        searchRadius,
        locationStatus,
        requestLocation,
        setManualLocation,
        setSearchRadius,
        setSelectedShop,
        addDocumentToCart,
        updateDocumentInCart,
        removeDocumentFromCart,
        updateDocumentSettings,
        setFulfillmentType,
        setAddressId,
        setCartNotes,
        clearCart,
        calculatePricing,
        placeOrder,
        updateOrderStatus,
        updateOrderPayment,
        updateShopPricing,
        updateShopProfile,
        registerShop,
        approveShop,
        rejectShop,
        suspendShop,
        reactivateShop,
        toggleShopSuspension,
        updateShopStatus,
        verifyPickupCode,
        commissionRate,
        setCommissionRate,
        customersList,
        toggleBlockCustomer,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        addReview,
        markNotificationRead,
        markAllNotificationsRead,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
