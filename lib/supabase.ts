// ==============================================================================
// SUPABASE CLIENT & REAL DATABASE PERSISTENCE LAYER FOR QUBINK
// Database (PostgreSQL) + Storage (Buckets)
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { CustomerAddress, Shop, ShopPricing, Order, OrderItem, UserProfile, OrderStatus } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epfxgpmpusiywhyryixy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GVl7j5nNatV42dRBj7bikg_9-TT4kfM';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseProfile {
  id: string;
  firebase_uid: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'shop' | 'admin';
  is_blocked?: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------------------
// 1. PROFILES API
// ------------------------------------------------------------------------------
export async function syncFirebaseProfile(
  firebaseUid: string,
  profileData: {
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    role: 'customer' | 'shop' | 'admin';
  }
): Promise<SupabaseProfile | null> {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (existing) {
      if (profileData.avatar_url && existing.avatar_url !== profileData.avatar_url) {
        await supabase
          .from('profiles')
          .update({ avatar_url: profileData.avatar_url, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        existing.avatar_url = profileData.avatar_url;
      }
      return existing as SupabaseProfile;
    }

    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: firebaseUid,
        full_name: profileData.full_name || profileData.email.split('@')[0],
        email: profileData.email,
        phone: profileData.phone || null,
        avatar_url: profileData.avatar_url || null,
        role: profileData.role,
      })
      .select()
      .single();

    if (error) {
      console.warn('Profile sync insert notice:', error.message);
      return null;
    }
    return created as SupabaseProfile;
  } catch (err) {
    console.error('syncFirebaseProfile error:', err);
    return null;
  }
}

export async function fetchUserProfile(userIdOrUid: string): Promise<SupabaseProfile | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrUid);
    const query = supabase.from('profiles').select('*');
    const { data } = isUuid
      ? await query.eq('id', userIdOrUid).maybeSingle()
      : await query.eq('firebase_uid', userIdOrUid).maybeSingle();

    return data as SupabaseProfile | null;
  } catch (err) {
    console.error('fetchUserProfile error:', err);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.fullName || updates.name) payload.full_name = updates.fullName || updates.name;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;

    const query = supabase.from('profiles').update(payload);
    const { error } = isUuid ? await query.eq('id', userId) : await query.eq('firebase_uid', userId);
    return !error;
  } catch (err) {
    console.error('updateUserProfile error:', err);
    return false;
  }
}

// ------------------------------------------------------------------------------
// 2. ADDRESSES API
// ------------------------------------------------------------------------------
export async function fetchUserAddresses(userId: string): Promise<CustomerAddress[]> {
  try {
    let targetProfileId = userId;
    // If passed a firebase uid, resolve to profile uuid first
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const p = await fetchUserProfile(userId);
      if (p) targetProfileId = p.id;
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', targetProfileId)
      .order('is_default', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      label: d.label,
      addressLine: d.address_line,
      landmark: d.landmark || '',
      city: d.city,
      pincode: d.pincode,
      isDefault: !!d.is_default,
    }));
  } catch (err) {
    console.error('fetchUserAddresses error:', err);
    return [];
  }
}

export async function insertAddressToDb(
  userId: string,
  addr: Omit<CustomerAddress, 'id' | 'userId'>
): Promise<CustomerAddress | null> {
  try {
    let targetProfileId = userId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const p = await fetchUserProfile(userId);
      if (p) targetProfileId = p.id;
    }

    if (addr.isDefault) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', targetProfileId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: targetProfileId,
        label: addr.label,
        address_line: addr.addressLine,
        landmark: addr.landmark || null,
        city: addr.city || 'Bengaluru',
        pincode: addr.pincode,
        is_default: !!addr.isDefault,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      label: data.label,
      addressLine: data.address_line,
      landmark: data.landmark || '',
      city: data.city,
      pincode: data.pincode,
      isDefault: !!data.is_default,
    };
  } catch (err) {
    console.error('insertAddressToDb error:', err);
    return null;
  }
}

export async function updateAddressInDb(
  id: string,
  updates: Partial<CustomerAddress>,
  userId?: string
): Promise<boolean> {
  try {
    if (updates.isDefault && userId) {
      let targetProfileId = userId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        const p = await fetchUserProfile(userId);
        if (p) targetProfileId = p.id;
      }
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', targetProfileId);
    }

    const payload: any = {};
    if (updates.label) payload.label = updates.label;
    if (updates.addressLine) payload.address_line = updates.addressLine;
    if (updates.landmark !== undefined) payload.landmark = updates.landmark;
    if (updates.city) payload.city = updates.city;
    if (updates.pincode) payload.pincode = updates.pincode;
    if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

    const { error } = await supabase.from('addresses').update(payload).eq('id', id);
    return !error;
  } catch (err) {
    console.error('updateAddressInDb error:', err);
    return false;
  }
}

export async function deleteAddressFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteAddressFromDb error:', err);
    return false;
  }
}

export async function setDefaultAddressInDb(id: string, userId: string): Promise<boolean> {
  try {
    let targetProfileId = userId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const p = await fetchUserProfile(userId);
      if (p) targetProfileId = p.id;
    }

    await supabase.from('addresses').update({ is_default: false }).eq('user_id', targetProfileId);
    const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    return !error;
  } catch (err) {
    console.error('setDefaultAddressInDb error:', err);
    return false;
  }
}

// ------------------------------------------------------------------------------
// 3. SHOPS & PRICING API
// ------------------------------------------------------------------------------
export async function fetchShopsFromDb(): Promise<{ shops: Shop[]; pricing: Record<string, ShopPricing> }> {
  try {
    const { data: shopsData, error: shopsErr } = await supabase.from('shops').select('*');
    if (shopsErr || !shopsData) return { shops: [], pricing: {} };

    const { data: servicesData } = await supabase.from('shop_services').select('*');
    const { data: pricingData } = await supabase.from('shop_pricing').select('*');

    const pricingMap: Record<string, ShopPricing> = {};
    if (pricingData) {
      pricingData.forEach((p: any) => {
        pricingMap[p.shop_id] = {
          shopId: p.shop_id,
          bwA4: Number(p.bw_a4 || 2),
          colorA4: Number(p.color_a4 || 10),
          bwA3: Number(p.bw_a3 || 5),
          colorA3: Number(p.color_a3 || 20),
          bindingPrice: Number(p.binding_price || 35),
          laminationPrice: Number(p.lamination_price || 25),
          deliveryFee: Number(p.delivery_fee || 30),
        };
      });
    }

    const servicesMap: Record<string, string[]> = {};
    if (servicesData) {
      servicesData.forEach((s: any) => {
        if (!servicesMap[s.shop_id]) servicesMap[s.shop_id] = [];
        servicesMap[s.shop_id].push(s.service_name);
      });
    }

    const shops: Shop[] = shopsData.map((s: any) => ({
      id: s.id,
      ownerId: s.owner_id,
      name: s.shop_name,
      description: s.description || '',
      phone: s.phone,
      email: s.email || '',
      address: s.address,
      city: s.city,
      district: s.district || undefined,
      state: s.state || undefined,
      pincode: s.pincode,
      latitude: Number(s.latitude || 12.935),
      longitude: Number(s.longitude || 77.625),
      mapUrl: s.map_url || '',
      openingTime: s.opening_time || '09:00 AM',
      closingTime: s.closing_time || '09:00 PM',
      isOpen: s.is_open ?? true,
      isPickupAvailable: s.pickup_available ?? true,
      isDeliveryAvailable: s.delivery_available ?? false,
      estimatedPrepTime: s.estimated_prep_time || '15-30 mins',
      imageUrl: s.shop_image || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
      rating: Number(s.rating || 5.0),
      reviewCount: Number(s.review_count || 0),
      upiId: s.upi_id || undefined,
      bankBeneficiary: s.bank_beneficiary || undefined,
      bankAccount: s.bank_account || undefined,
      bankIfsc: s.bank_ifsc || undefined,
      status: (s.status ? s.status.toUpperCase() : 'APPROVED') as any,
      services: servicesMap[s.id] || ['Xerox', 'Printing', 'Binding'],
    }));

    return { shops, pricing: pricingMap };
  } catch (err) {
    console.error('fetchShopsFromDb error:', err);
    return { shops: [], pricing: {} };
  }
}

export async function insertShopToDb(
  ownerId: string,
  shopData: Partial<Shop>,
  initialPricing?: Partial<ShopPricing>
): Promise<Shop | null> {
  try {
    let targetOwnerId = ownerId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) {
      const p = await fetchUserProfile(ownerId);
      if (p) targetOwnerId = p.id;
    }

    const { data: newShop, error } = await supabase
      .from('shops')
      .insert({
        owner_id: targetOwnerId,
        shop_name: shopData.name || 'Print Shop',
        description: shopData.description || '',
        phone: shopData.phone || '',
        email: shopData.email || null,
        address: shopData.address || '',
        city: shopData.city || 'Bengaluru',
        district: shopData.district || null,
        state: shopData.state || null,
        pincode: shopData.pincode || '560001',
        latitude: shopData.latitude || 12.935,
        longitude: shopData.longitude || 77.625,
        map_url: shopData.mapUrl || null,
        opening_time: shopData.openingTime || '09:00 AM',
        closing_time: shopData.closingTime || '09:00 PM',
        is_open: true,
        pickup_available: shopData.isPickupAvailable ?? true,
        delivery_available: shopData.isDeliveryAvailable ?? false,
        delivery_fee: initialPricing?.deliveryFee || 30.0,
        status: 'approved',
        shop_image: shopData.imageUrl || null,
        upi_id: shopData.upiId || null,
        bank_beneficiary: shopData.bankBeneficiary || null,
        bank_account: shopData.bankAccount || null,
        bank_ifsc: shopData.bankIfsc || null,
      })
      .select()
      .single();

    if (error || !newShop) {
      console.warn('insertShop error:', error?.message);
      return null;
    }

    // Insert Pricing
    await supabase.from('shop_pricing').insert({
      shop_id: newShop.id,
      bw_a4: initialPricing?.bwA4 || 2.0,
      color_a4: initialPricing?.colorA4 || 10.0,
      bw_a3: initialPricing?.bwA3 || 5.0,
      color_a3: initialPricing?.colorA3 || 20.0,
      binding_price: initialPricing?.bindingPrice || 35.0,
      lamination_price: initialPricing?.laminationPrice || 25.0,
      delivery_fee: initialPricing?.deliveryFee || 30.0,
    });

    // Insert Services
    if (shopData.services && shopData.services.length > 0) {
      const srvRows = shopData.services.map((s) => ({
        shop_id: newShop.id,
        service_name: s,
        is_available: true,
      }));
      await supabase.from('shop_services').insert(srvRows);
    }

    return {
      id: newShop.id,
      ownerId: newShop.owner_id,
      name: newShop.shop_name,
      description: newShop.description || '',
      phone: newShop.phone,
      email: newShop.email || '',
      address: newShop.address,
      city: newShop.city,
      district: newShop.district || undefined,
      state: newShop.state || undefined,
      pincode: newShop.pincode,
      latitude: Number(newShop.latitude),
      longitude: Number(newShop.longitude),
      mapUrl: newShop.map_url || '',
      openingTime: newShop.opening_time,
      closingTime: newShop.closing_time,
      isOpen: newShop.is_open,
      isPickupAvailable: newShop.pickup_available,
      isDeliveryAvailable: newShop.delivery_available,
      estimatedPrepTime: newShop.estimated_prep_time || '15-30 mins',
      imageUrl: newShop.shop_image || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
      rating: Number(newShop.rating || 5.0),
      reviewCount: 0,
      upiId: newShop.upi_id || undefined,
      bankBeneficiary: newShop.bank_beneficiary || undefined,
      bankAccount: newShop.bank_account || undefined,
      bankIfsc: newShop.bank_ifsc || undefined,
      status: 'APPROVED',
      services: shopData.services || ['Xerox', 'Printing', 'Binding'],
    };
  } catch (err) {
    console.error('insertShopToDb error:', err);
    return null;
  }
}

export async function updateShopInDb(shopId: string, updates: Partial<Shop>): Promise<boolean> {
  try {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.shop_name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.district !== undefined) payload.district = updates.district;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.pincode !== undefined) payload.pincode = updates.pincode;
    if (updates.latitude !== undefined) payload.latitude = updates.latitude;
    if (updates.longitude !== undefined) payload.longitude = updates.longitude;
    if (updates.openingTime !== undefined) payload.opening_time = updates.openingTime;
    if (updates.closingTime !== undefined) payload.closing_time = updates.closingTime;
    if (updates.isOpen !== undefined) payload.is_open = updates.isOpen;
    if (updates.isPickupAvailable !== undefined) payload.pickup_available = updates.isPickupAvailable;
    if (updates.isDeliveryAvailable !== undefined) payload.delivery_available = updates.isDeliveryAvailable;
    if (updates.estimatedPrepTime !== undefined) payload.estimated_prep_time = updates.estimatedPrepTime;
    if (updates.imageUrl !== undefined) payload.shop_image = updates.imageUrl;
    if (updates.upiId !== undefined) payload.upi_id = updates.upiId;
    if (updates.bankBeneficiary !== undefined) payload.bank_beneficiary = updates.bankBeneficiary;
    if (updates.bankAccount !== undefined) payload.bank_account = updates.bankAccount;
    if (updates.bankIfsc !== undefined) payload.bank_ifsc = updates.bankIfsc;

    const { error } = await supabase.from('shops').update(payload).eq('id', shopId);
    if (error) {
      console.warn('updateShopInDb error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('updateShopInDb error:', err);
    return false;
  }
}

// ------------------------------------------------------------------------------
// 4. ORDERS API
// ------------------------------------------------------------------------------
export async function fetchOrdersFromDb(userId: string, role: string, shopId?: string): Promise<Order[]> {
  try {
    let targetProfileId = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const p = await fetchUserProfile(userId);
      if (p) targetProfileId = p.id;
    }

    let query = supabase.from('orders').select('*, order_items(*)');
    if (role === 'customer' && targetProfileId) {
      query = query.eq('customer_id', targetProfileId);
    } else if (role === 'shop') {
      if (targetProfileId) {
        const { data: userShops } = await supabase.from('shops').select('id').eq('owner_id', targetProfileId);
        if (userShops && userShops.length > 0) {
          query = query.in('shop_id', userShops.map((s) => s.id));
        } else if (shopId) {
          query = query.eq('shop_id', shopId);
        }
      } else if (shopId) {
        query = query.eq('shop_id', shopId);
      }
    }
    // For admin, query selects all

    const { data: ordersData, error } = await query.order('created_at', { ascending: false });
    if (error || !ordersData) return [];

    return ordersData.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerId: o.customer_id,
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || '',
      shopId: o.shop_id,
      shopName: o.shop_name || 'Print Shop',
      shopAddress: o.shop_address || '',
      shopPhone: o.shop_phone || '',
      paymentMethod: (o.payment_method || (o.fulfillment_type === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'PAY_AT_SHOP')) as any,
      paymentStatus: (o.payment_status || 'PENDING') as any,
      upiRefId: o.upi_ref_id,
      couponDiscount: Number(o.coupon_discount || 0),
      rating: o.rating ? Number(o.rating) : undefined,
      reviewComment: o.review_comment,
      fulfillmentType: o.fulfillment_type,
      deliveryAddressId: o.delivery_address_id,
      deliveryAddressText: o.delivery_address_text,
      status: o.status as OrderStatus,
      rejectionReason: o.rejection_reason,
      pickupCode: o.pickup_code,
      subtotal: Number(o.subtotal || 0),
      bindingTotal: Number(o.binding_total || 0),
      laminationTotal: Number(o.lamination_total || 0),
      deliveryFee: Number(o.delivery_fee || 0),
      totalAmount: Number(o.total_amount || 0),
      notes: o.notes || '',
      items: (o.order_items || []).map((item: any) => ({
        id: item.id,
        documentName: item.document_name,
        documentUrl: item.document_url || undefined,
        pageCount: item.page_count,
        settings: {
          printType: item.print_type || 'BW',
          sides: item.sides || 'SINGLE',
          paperSize: item.paper_size || 'A4',
          copies: item.copies || 1,
          hasBinding: !!item.has_binding,
          hasStapling: !!item.has_stapling,
          hasLamination: !!item.has_lamination,
        },
        itemPrice: Number(item.item_total || 0),
      })),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));
  } catch (err) {
    console.error('fetchOrdersFromDb error:', err);
    return [];
  }
}

export async function insertOrderToDb(order: Order): Promise<boolean> {
  try {
    let targetCustomerId = order.customerId;
    if (order.customerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.customerId)) {
      const p = await fetchUserProfile(order.customerId);
      if (p) targetCustomerId = p.id;
    }

    // Ensure targetCustomerId is a valid UUID in public.profiles
    const isCustomerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCustomerId);
    if (!isCustomerUuid) {
      const { data: anyCust } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'customer')
        .limit(1)
        .maybeSingle();

      if (anyCust?.id) {
        targetCustomerId = anyCust.id;
      } else {
        const { data: newCust } = await supabase
          .from('profiles')
          .insert({
            firebase_uid: `cust-${Date.now()}`,
            full_name: order.customerName || 'Customer',
            email: 'customer@qubink.app',
            role: 'customer',
          })
          .select('id')
          .single();
        if (newCust?.id) targetCustomerId = newCust.id;
      }
    }

    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        order_number: order.orderNumber,
        customer_id: targetCustomerId,
        shop_id: order.shopId,
        fulfillment_type: order.fulfillmentType,
        delivery_address_id: order.deliveryAddressId || null,
        delivery_address_text: order.deliveryAddressText || null,
        payment_method: order.paymentMethod || 'CASH',
        payment_status: order.paymentStatus || 'PENDING',
        upi_ref_id: order.upiRefId || null,
        coupon_discount: order.couponDiscount || 0,
        status: order.status || 'PLACED',
        pickup_code: order.pickupCode,
        subtotal: order.subtotal,
        binding_total: order.bindingTotal,
        lamination_total: order.laminationTotal,
        delivery_fee: order.deliveryFee,
        total_amount: order.totalAmount,
        notes: order.notes || null,
      })
      .select()
      .single();

    if (error || !newOrder) {
      console.warn('insertOrder error:', error?.message);
      return false;
    }

    // Insert order items with document_url for document preview and record in public.documents table
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        let docDbId: string | null = null;
        if (targetCustomerId && /^[0-9a-f-]{36}$/i.test(targetCustomerId)) {
          try {
            const { data: docData } = await supabase
              .from('documents')
              .insert({
                customer_id: targetCustomerId,
                file_name: item.documentName,
                storage_path: item.documentUrl || 'local_storage',
                file_type: item.documentName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                file_size: 1024,
                page_count: item.pageCount || 1,
              })
              .select('id')
              .single();
            if (docData) docDbId = docData.id;
          } catch (docErr) {
            console.warn('documents table insert notice:', docErr);
          }
        }

        await supabase.from('order_items').insert({
          order_id: newOrder.id,
          document_id: docDbId,
          document_name: item.documentName,
          document_url: item.documentUrl || null,
          page_count: item.pageCount,
          print_type: item.settings.printType,
          sides: item.settings.sides,
          paper_size: item.settings.paperSize,
          copies: item.settings.copies,
          has_binding: item.settings.hasBinding,
          has_stapling: item.settings.hasStapling,
          has_lamination: item.settings.hasLamination,
          item_total: item.itemPrice,
        });
      }
    }

    return true;
  } catch (err) {
    console.error('insertOrderToDb error:', err);
    return false;
  }
}

export async function updateOrderStatusInDb(
  orderId: string,
  status?: OrderStatus,
  reason?: string,
  paymentStatus?: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'REFUNDED',
  paymentMethod?: string,
  upiRefId?: string
): Promise<boolean> {
  try {
    const payload: any = { updated_at: new Date().toISOString() };
    if (status) payload.status = status;
    if (reason) payload.rejection_reason = reason;
    if (paymentStatus) payload.payment_status = paymentStatus;
    if (paymentMethod) payload.payment_method = paymentMethod;
    if (upiRefId) payload.upi_ref_id = upiRefId;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabase.from('orders').update(payload);
    if (isUuid) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }
    const { error } = await query;
    return !error;
  } catch (err) {
    console.error('updateOrderStatusInDb error:', err);
    return false;
  }
}

// ------------------------------------------------------------------------------
// Document Storage & Metadata Upload (Supabase Storage + public.documents table)
// ------------------------------------------------------------------------------
export async function uploadCustomerDocumentToStorageAndDb(
  fileOrBlob: File | Blob,
  fileName: string,
  userId: string,
  pageCount: number = 1
): Promise<{ documentId: string; storageUrl: string } | null> {
  try {
    let targetCustomerId = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const p = await fetchUserProfile(userId);
      if (p) targetCustomerId = p.id;
    }

    // Ensure targetCustomerId is a valid UUID in public.profiles
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCustomerId)) {
      const { data: anyCust } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'customer')
        .limit(1)
        .maybeSingle();
      if (anyCust?.id) {
        targetCustomerId = anyCust.id;
      }
    }

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = targetCustomerId && /^[0-9a-f-]{36}$/i.test(targetCustomerId) ? targetCustomerId : 'customer';
    const storagePath = `${folder}/${Date.now()}-${cleanFileName}`;

    // 1. Upload file binary directly to Supabase Storage bucket 'customer-documents'
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('customer-documents')
      .upload(storagePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: true,
      });

    let storageUrl = '';
    if (!uploadErr && uploadData) {
      const { data: urlData } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(uploadData.path);
      storageUrl = urlData?.publicUrl || uploadData.path;
    }

    // 2. Insert metadata record in public.documents table
    if (targetCustomerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCustomerId)) {
      const { data: docRecord, error: docErr } = await supabase
        .from('documents')
        .insert({
          customer_id: targetCustomerId,
          file_name: fileName,
          storage_path: storageUrl || storagePath,
          file_type: (fileOrBlob as File).type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          file_size: fileOrBlob.size || 1024,
          page_count: pageCount,
        })
        .select()
        .single();

      if (!docErr && docRecord) {
        return { documentId: docRecord.id, storageUrl: storageUrl || storagePath };
      }
    }

    return storageUrl ? { documentId: `doc-${Date.now()}`, storageUrl } : null;
  } catch (err) {
    console.error('uploadCustomerDocumentToStorageAndDb error:', err);
    return null;
  }
}

// Backward-compatible alias
export const uploadCustomerDocument = uploadCustomerDocumentToStorageAndDb;
