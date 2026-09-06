'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import PhoneInput from '@/components/PhoneInput';
import { Order, OrderStatus } from '@/types';
import {
  Store,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Printer,
  Sliders,
  DollarSign,
  FileText,
  Phone,
  Eye,
  Check,
  AlertCircle,
  TrendingUp,
  Power,
  Volume2,
  QrCode,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Download,
  ShieldCheck,
  AlertTriangle,
  Upload,
  ImageIcon,
  Camera,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

const QrCameraScanner = dynamic(() => import('@/components/QrCameraScanner'), {
  ssr: false,
});

const getFileBadgeInfo = (filename: string, mimeType?: string) => {
  const ext = filename?.split('.').pop()?.toUpperCase() || 'FILE';
  if (ext === 'PDF' || mimeType?.includes('pdf')) return { ext: 'PDF', label: 'PDF Document', badgeClass: 'bg-red-50 text-red-700 border border-red-200' };
  if (['DOC', 'DOCX'].includes(ext) || mimeType?.includes('word')) return { ext: 'DOCX', label: 'Word Document', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200' };
  if (['XLS', 'XLSX', 'CSV'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('csv')) return { ext: 'XLSX', label: 'Spreadsheet', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  if (['PPT', 'PPTX'].includes(ext) || mimeType?.includes('presentation')) return { ext: 'PPT', label: 'Presentation', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200' };
  if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext) || mimeType?.includes('image')) return { ext: 'IMAGE', label: 'Image File', badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200' };
  return { ext, label: `${ext} File`, badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200' };
};

export default function ShopPortalPage() {
  const router = useRouter();
  const {
    shops,
    orders,
    pricing,
    currentUser,
    setCurrentUser,
    updateShopStatus,
    updateShopPricing,
    updateOrderStatus,
    verifyPickupCode,
    setRole,
  } = useApp();

  // Current shop context — prefer user's own shop, then first approved shop
  const ownedShop = currentUser?.shopId ? shops.find((s) => s.id === currentUser.shopId) : undefined;
  const shop = ownedShop || shops.find((s) => s.status === 'APPROVED') || shops[0];

  const shopRates = (shop && pricing[shop.id]) || {
    bwA4: 2.0,
    colorA4: 10.0,
    bwA3: 5.0,
    colorA3: 20.0,
    bindingPrice: 35.0,
    laminationPrice: 25.0,
    deliveryFee: 30.0,
  };

  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'pricing' | 'profile' | 'verify' | 'analytics'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('recent');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Shop printer queue is currently full');
  const [pickupCodeInput, setPickupCodeInput] = useState<{ [orderId: string]: string }>({});
  const [codeError, setCodeError] = useState<{ [orderId: string]: string }>({});
  const [standaloneCode, setStandaloneCode] = useState('');
  const [standaloneResult, setStandaloneResult] = useState<{ success: boolean; message: string } | null>(null);
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; mime?: string } | null>(null);

  // Pricing Form State
  const [pricingForm, setPricingForm] = useState({
    bwA4: shopRates.bwA4.toString(),
    colorA4: shopRates.colorA4.toString(),
    bwA3: shopRates.bwA3.toString(),
    colorA3: shopRates.colorA3.toString(),
    bindingPrice: shopRates.bindingPrice.toString(),
    laminationPrice: shopRates.laminationPrice.toString(),
    deliveryFee: shopRates.deliveryFee.toString(),
  });
  const [pricingNotice, setPricingNotice] = useState(false);

  // Shop Profile Form State (safe defaults when shop loads async)
  const [shopName, setShopName] = useState(shop?.name || '');
  const [shopPhone, setShopPhone] = useState(shop?.phone || '');
  const [shopAddress, setShopAddress] = useState(shop?.address || '');
  const [prepTime, setPrepTime] = useState(shop?.estimatedPrepTime || '30 mins');
  const [isPickup, setIsPickup] = useState(shop?.isPickupAvailable ?? true);
  const [isDelivery, setIsDelivery] = useState(shop?.isDeliveryAvailable ?? false);
  const [shopImage, setShopImage] = useState(shop?.imageUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800');
  const [profileNotice, setProfileNotice] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Banking & UPI Settings
  const [upiId, setUpiId] = useState(shop?.upiId || '');
  const [bankBeneficiary, setBankBeneficiary] = useState(shop?.bankBeneficiary || '');
  const [bankAccount, setBankAccount] = useState(shop?.bankAccount || '');
  const [bankIfsc, setBankIfsc] = useState(shop?.bankIfsc || '');

  // Synchronize form fields when shop context loads/updates
  useEffect(() => {
    if (shop) {
      if (shop.name) setShopName(shop.name);
      if (shop.phone) setShopPhone(shop.phone);
      if (shop.address) setShopAddress(shop.address);
      if (shop.estimatedPrepTime) setPrepTime(shop.estimatedPrepTime);
      setIsPickup(shop.isPickupAvailable ?? true);
      setIsDelivery(shop.isDeliveryAvailable ?? false);
      if (shop.imageUrl) setShopImage(shop.imageUrl);
      if (shop.upiId) setUpiId(shop.upiId);
      if (shop.bankBeneficiary) setBankBeneficiary(shop.bankBeneficiary);
      if (shop.bankAccount) setBankAccount(shop.bankAccount);
      if (shop.bankIfsc) setBankIfsc(shop.bankIfsc);
    }
  }, [shop?.id, shop?.name, shop?.phone, shop?.address, shop?.upiId]);

  // Filter orders for this shop (safe even if shop is undefined)
  const shopOrders = orders.filter((o) => shop ? (o.shopId === shop.id || !o.shopId) : false);
  const newOrders = shopOrders.filter((o) => o.status === 'PLACED');
  const inProgressOrders = shopOrders.filter((o) => ['ACCEPTED', 'PRINTING'].includes(o.status));
  const readyOrders = shopOrders.filter((o) => ['READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status));
  const completedOrders = shopOrders.filter((o) => o.status === 'COMPLETED');
  const todayRevenue = shopOrders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleToggleStoreOpen = () => {
    updateShopStatus(shop.id, { isOpen: !shop.isOpen });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setShopImage(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qubink_active_user');
      localStorage.removeItem('qubink_active_role');
      localStorage.removeItem('qubink_user_phone');
    }
    setRole('customer');
    setCurrentUser({
      id: '',
      fullName: '',
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      avatarUrl: '',
    });
    if (typeof window !== 'undefined') {
      window.location.href = '/shop/login';
    } else {
      router.push('/shop/login');
    }
  };

  const handlePricingSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopPricing(shop.id, {
      bwA4: parseFloat(pricingForm.bwA4) || 2.0,
      colorA4: parseFloat(pricingForm.colorA4) || 10.0,
      bwA3: parseFloat(pricingForm.bwA3) || 5.0,
      colorA3: parseFloat(pricingForm.colorA3) || 20.0,
      bindingPrice: parseFloat(pricingForm.bindingPrice) || 35.0,
      laminationPrice: parseFloat(pricingForm.laminationPrice) || 25.0,
      deliveryFee: parseFloat(pricingForm.deliveryFee) || 30.0,
    });
    setPricingNotice(true);
    setTimeout(() => setPricingNotice(false), 3000);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopStatus(shop.id, {
      name: shopName,
      phone: shopPhone,
      address: shopAddress,
      estimatedPrepTime: prepTime,
      isPickupAvailable: isPickup,
      isDeliveryAvailable: isDelivery,
      imageUrl: shopImage,
      upiId: upiId.trim() || undefined,
      bankBeneficiary: bankBeneficiary.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
    });
    setProfileNotice(true);
    setTimeout(() => setProfileNotice(false), 3000);
  };

  const handleVerifyCode = (orderId: string) => {
    const code = pickupCodeInput[orderId] || '';
    if (!code) {
      setCodeError({ ...codeError, [orderId]: 'Please enter the 4-digit pickup code' });
      return;
    }

    const isValid = verifyPickupCode(orderId, code);
    if (isValid) {
      setCodeError({ ...codeError, [orderId]: '' });
      setPickupCodeInput({ ...pickupCodeInput, [orderId]: '' });
    } else {
      setCodeError({ ...codeError, [orderId]: 'Incorrect code. Please check the customer\'s 4-digit pickup code.' });
    }
  };

  const handleStandaloneVerify = (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    const cleanCode = standaloneCode.replace(/\s/g, '').trim();
    if (!cleanCode) return;
    const foundOrder = orders.find(
      (o) => o.pickupCode?.toUpperCase() === cleanCode.toUpperCase()
    );

    if (foundOrder) {
      updateOrderStatus(foundOrder.id, 'COMPLETED');
      setStandaloneResult({
        success: true,
        message: `Order #${foundOrder.orderNumber} for ${foundOrder.customerName} verified and marked Completed!`,
      });
      setStandaloneCode('');
    } else {
      setStandaloneResult({
        success: false,
        message: `No matching order found for 4-digit code "${cleanCode}".`,
      });
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
    },
    {
      id: 'orders',
      label: 'Live Orders Hub',
      icon: Printer,
      badge: newOrders.length > 0 ? newOrders.length : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
    },
    { id: 'pricing', label: 'Pricing & Catalog', icon: DollarSign },
    { id: 'profile', label: 'Shop Profile & Hours', icon: Store },
    { id: 'verify', label: 'Pickup Verifier', icon: QrCode },
    { id: 'analytics', label: 'Sales & Analytics', icon: Sparkles },
  ];

  // Guard: show spinner while shops load from DB (all hooks already called above)
  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6FAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-qubink-teal border-t-transparent animate-spin" />
          <p className="text-sm text-qubink-muted font-medium">Loading shop dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6FAFA] flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-qubink-navy/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SAAS SIDENAV */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#082F3F] text-white flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
            <Link href="/" className="flex items-center gap-2">
              <QubinkLogo size="sm" lightText />
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-qubink-teal/20 text-qubink-mint px-2 py-0.5 rounded-full border border-qubink-teal/30">
              Partner
            </span>
          </div>

          {/* Shop Quick Banner */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Print Shop
              </span>
              <button
                onClick={handleToggleStoreOpen}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all ${
                  shop.isOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{shop.isOpen ? 'Accepting Orders' : 'Store Paused'}</span>
              </button>
            </div>
            <p className="font-bold text-xs text-white truncate">{shop.name}</p>
            <p className="text-[11px] text-gray-300 truncate">{shop.address}</p>
          </div>

          {/* Nav List */}
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-qubink-teal text-white shadow-sm font-bold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User & Sign Out */}
        <div className="p-3 border-t border-white/10 space-y-2.5">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-qubink-teal text-white font-bold flex items-center justify-center text-xs">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'SP'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.fullName || shop.name || 'FastPrint Owner'}</p>
                <p className="text-[10px] text-gray-400 font-mono">role: shop</p>
              </div>
            </div>
            <Store className="w-4 h-4 text-qubink-mint flex-shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Partner</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP SAAS HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-qubink-navy font-heading">
                {activeTab === 'orders'
                  ? 'Orders Fulfillment Center'
                  : activeTab === 'pricing'
                  ? 'Shop Pricing & Catalog'
                  : activeTab === 'profile'
                  ? 'Shop Settings & Timing'
                  : activeTab === 'verify'
                  ? 'Pickup Verification Console'
                  : 'Revenue & Performance Analytics'}
              </h1>
              <p className="text-[11px] text-qubink-muted hidden sm:block">
                {shop.name} • {shop.city} • Fast Printing & Document Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('verify')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-qubink-softmint text-qubink-teal font-bold text-xs hover:bg-qubink-mint/30 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Verify Code</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Sign Out Partner"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* BODY CONTAINER */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* ------------------------------------------- */}
          {/* 0. DASHBOARD TAB                            */}
          {/* ------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Greeting */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-qubink-navy font-heading">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {shop.name.split(' ')[0]}!</h2>
                  <p className="text-xs text-qubink-muted mt-0.5">Here's your shop performance at a glance.</p>
                </div>
                <button
                  onClick={handleToggleStoreOpen}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${shop.isOpen ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {shop.isOpen ? 'Shop Open — Click to Close' : 'Shop Closed — Click to Open'}
                </button>
              </div>

              {/* Stat Cards - 4 columns */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5 hover:shadow-md transition-shadow">
                  <span className="text-xs text-qubink-muted font-bold block">New Orders</span>
                  <p className={`text-3xl font-black font-heading ${newOrders.length > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{newOrders.length}</p>
                  <span className="text-[11px] text-qubink-muted">Requires shop response</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5 hover:shadow-md transition-shadow">
                  <span className="text-xs text-qubink-muted font-bold block">In Printing</span>
                  <p className={`text-3xl font-black font-heading ${inProgressOrders.length > 0 ? 'text-qubink-teal' : 'text-gray-300'}`}>{inProgressOrders.length}</p>
                  <span className="text-[11px] text-qubink-muted">Jobs currently printing</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5 hover:shadow-md transition-shadow">
                  <span className="text-xs text-qubink-muted font-bold block">Today's Revenue</span>
                  <p className={`text-3xl font-black font-heading ${todayRevenue > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>₹{todayRevenue.toFixed(2)}</p>
                  <span className="text-[11px] text-qubink-muted">{completedOrders.length} completed</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5 hover:shadow-md transition-shadow">
                  <span className="text-xs text-qubink-muted font-bold block">Ready for Pickup</span>
                  <p className={`text-3xl font-black font-heading ${readyOrders.length > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{readyOrders.length}</p>
                  <span className="text-[11px] text-qubink-muted">Awaiting customer collection</span>
                </div>
              </div>

              {/* Second row — extra stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5">
                  <span className="text-xs text-qubink-muted font-bold block">★ Shop Rating</span>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black font-heading text-qubink-navy">{shop.rating.toFixed(1)}</p>
                    <span className="text-xs text-qubink-muted mb-1">/ 5.0 • {shop.reviewCount} reviews</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-lg ${s <= Math.round(shop.rating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5">
                  <span className="text-xs text-qubink-muted font-bold block">📊 Avg. Order Value</span>
                  <p className="text-3xl font-black font-heading text-qubink-navy">
                    ₹{completedOrders.length > 0 ? (todayRevenue / completedOrders.length).toFixed(0) : '0'}
                  </p>
                  <span className="text-[11px] text-qubink-muted">Per completed transaction</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1.5">
                  <span className="text-xs text-qubink-muted font-bold block">📦 Total Orders</span>
                  <p className="text-3xl font-black font-heading text-qubink-navy">{shopOrders.length}</p>
                  <div className="flex gap-3 text-[11px] text-qubink-muted">
                    <span>🏬 {shopOrders.filter(o => o.fulfillmentType === 'PICKUP').length} Pickup</span>
                    <span>🚚 {shopOrders.filter(o => o.fulfillmentType === 'DELIVERY').length} Delivery</span>
                  </div>
                </div>
              </div>

              {/* New Orders Quick Actions */}
              {newOrders.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-qubink-navy font-heading">{newOrders.length} New Order{newOrders.length > 1 ? 's' : ''} Awaiting Response</h3>
                  </div>
                  <div className="space-y-2">
                    {newOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100 flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-qubink-navy font-mono">{order.orderNumber}</p>
                          <p className="text-[11px] text-qubink-muted">{order.customerName} • ₹{order.totalAmount.toFixed(0)} • {order.items.length} doc{order.items.length > 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                            className="px-3 py-1.5 rounded-lg bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'REJECTED', 'Queue full')}
                            className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {newOrders.length > 3 && (
                      <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-qubink-teal hover:underline">
                        + {newOrders.length - 3} more — View all in Orders →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recent completed orders feedback summary */}
              {completedOrders.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-qubink-navy font-heading">✅ Recent Completed Orders</h3>
                  <div className="divide-y divide-gray-100">
                    {completedOrders.slice(0, 4).map((order) => (
                      <div key={order.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-bold text-qubink-navy font-mono">{order.orderNumber}</p>
                          <p className="text-[11px] text-qubink-muted">{order.customerName} • ₹{order.totalAmount.toFixed(0)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.rating ? (
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map((s) => (
                                <span key={s} className={`text-sm ${s <= order.rating! ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                              ))}
                              <span className="text-[11px] text-qubink-muted ml-1">{order.rating}/5</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No rating yet</span>
                          )}
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">DONE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shopOrders.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto">
                    <Store className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-qubink-muted">No orders yet</p>
                  <p className="text-xs text-gray-400">Your first customer order will appear here once your shop is live on Qubink.</p>
                </div>
              )}
            </div>
          )}

          {/* 1. ORDERS TAB — 2-COLUMN HUB & MOBILE BOTTOM SHEET */}
          {activeTab === 'orders' && (() => {
            const sortedOrders = [...shopOrders].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const filteredOrders = sortedOrders.filter((o) => {
              const matchesStatus =
                orderFilter === 'all'
                  ? true
                  : orderFilter === 'recent'
                  ? !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(o.status) || sortedOrders.length <= 5
                  : o.status === orderFilter ||
                    (orderFilter === 'READY' && ['READY', 'READY_FOR_PICKUP'].includes(o.status));
              const matchesSearch =
                o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesStatus && matchesSearch;
            });

            const activeOrder =
              filteredOrders.find((o) => o.id === selectedOrderId) ||
              filteredOrders[0] ||
              null;

            const renderWorkbench = (order: Order, isDrawer = false) => (
              <div className="space-y-4">
                {/* Workbench Header */}
                <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-base sm:text-lg text-qubink-navy">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'READY' || order.status === 'READY_FOR_PICKUP'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'PRINTING'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-qubink-softmint text-qubink-teal">
                        {order.fulfillmentType === 'PICKUP' ? '🏬 Shop Pickup' : '🚚 Home Delivery'}
                      </span>
                    </div>
                    <p className="text-[11px] text-qubink-muted mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-qubink-muted block">Order Total</span>
                    <span className="text-xl font-black text-qubink-teal font-heading">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                    {((order.couponDiscount && order.couponDiscount > 0) || order.couponCode) && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        Coupon {order.couponCode || 'SAVE50'} (-₹{(order.couponDiscount || 50).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Contact Card */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-qubink-navy">{order.customerName}</p>
                      <p className="text-[11px] text-qubink-muted font-mono">{order.customerPhone || 'No phone provided'}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.customerPhone && (
                        <>
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="px-3 py-1.5 rounded-xl bg-qubink-softmint text-qubink-teal hover:bg-qubink-teal hover:text-white font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/91${order.customerPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                              `Hi ${order.customerName}! This is ${shop.name} regarding your Qubink print order ${order.orderNumber}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {order.fulfillmentType === 'DELIVERY' && order.deliveryAddressText && (
                    <div className="pt-2 border-t border-gray-200/60 text-[11px] text-qubink-dark flex items-start gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-qubink-teal shrink-0 mt-0.5" />
                      <span><strong>Delivery Address:</strong> {order.deliveryAddressText}</span>
                    </div>
                  )}

                  {order.notes && (
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
                      <strong>Customer Instructions:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Print Job Requirements & Files */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-qubink-navy uppercase tracking-wider">
                      Documents to Print ({order.items.length})
                    </span>
                    <span className="text-[11px] text-qubink-muted">
                      Total {order.items.reduce((sum, it) => sum + (it.pageCount * (it.settings.copies || 1)), 0)} pages
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {order.items.map((item) => {
                      const badge = getFileBadgeInfo(item.documentName);
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${badge.badgeClass}`}>
                                {badge.ext}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-qubink-navy truncate" title={item.documentName}>
                                  {item.documentName}
                                </p>
                                <div className="flex flex-wrap gap-1 text-[11px] text-qubink-muted mt-1">
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold text-qubink-navy">
                                    {item.pageCount} pgs
                                  </span>
                                  {item.settings?.pageRangeType === 'CUSTOM' && item.settings?.customRange && (
                                    <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      Range: {item.settings.customRange}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100">
                                    {item.settings.printType === 'COLOR' ? 'Colour' : 'B&W'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100">
                                    {item.settings.sides === 'DOUBLE' ? 'Back-to-Back' : 'Single Sided'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100">
                                    {item.settings.paperSize}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold">
                                    {item.settings.copies} {item.settings.copies > 1 ? 'copies' : 'copy'}
                                  </span>
                                  {item.settings.hasBinding && (
                                    <span className="px-1.5 py-0.5 rounded bg-teal-50 text-qubink-teal font-semibold">
                                      + Spiral Binding
                                    </span>
                                  )}
                                  {item.settings.hasLamination && (
                                    <span className="px-1.5 py-0.5 rounded bg-teal-50 text-qubink-teal font-semibold">
                                      + Lamination
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="font-bold text-xs text-qubink-navy flex-shrink-0">
                              ₹{item.itemPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Action links: Preview, Open in New Tab, Download */}
                          {item.documentUrl && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const isPdf = item.documentName?.toLowerCase().endsWith('.pdf') || item.documentUrl?.includes('application/pdf');
                                  const isImg = item.documentName?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i) || item.documentUrl?.includes('data:image');
                                  setPreviewItem({
                                    name: item.documentName,
                                    url: item.documentUrl!,
                                    mime: isPdf ? 'application/pdf' : isImg ? 'image/jpeg' : 'other',
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-qubink-softmint text-qubink-teal font-bold text-xs flex items-center gap-1 hover:bg-qubink-teal hover:text-white transition-colors shadow-2xs"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <a
                                href={item.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-qubink-teal text-qubink-teal font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                                title="Open Document in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open in Tab</span>
                              </a>

                              <a
                                href={item.documentUrl}
                                download={item.documentName}
                                className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-qubink-teal text-qubink-navy font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* UPI Payment Status & Verification */}
                {order.paymentMethod === 'UPI' && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2.5 ${order.paymentStatus === 'PENDING_VERIFICATION' ? 'bg-blue-50 border-blue-200' : order.paymentStatus === 'PAID' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <span className={`font-bold block ${order.paymentStatus === 'PENDING_VERIFICATION' ? 'text-blue-800' : order.paymentStatus === 'PAID' ? 'text-emerald-800' : 'text-gray-700'}`}>
                        💸 UPI Payment — {order.paymentStatus === 'PENDING_VERIFICATION' ? 'Pending Verification' : order.paymentStatus === 'PAID' ? 'Verified & Paid' : 'Awaiting'}
                      </span>
                      {order.upiRefId && (
                        <p className="font-mono text-qubink-navy font-bold text-xs mt-0.5">
                          UTR: {order.upiRefId}
                        </p>
                      )}
                    </div>
                    {order.paymentStatus === 'PENDING_VERIFICATION' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, order.status, undefined, 'PAID')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 whitespace-nowrap flex-shrink-0 shadow-2xs"
                      >
                        ✓ Mark Paid
                      </button>
                    )}
                  </div>
                )}

                {/* Order Workflow Action Buttons */}
                <div className="pt-3 border-t border-gray-100">
                  {order.status === 'PLACED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                        className="flex-1 px-5 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Order</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'REJECTED', 'Queue full')}
                        className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold text-xs hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PRINTING')}
                      className="w-full px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Start Printing</span>
                    </button>
                  )}

                  {order.status === 'PRINTING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="w-full px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ready for {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}</span>
                    </button>
                  )}

                  {(order.status === 'READY' || order.status === 'READY_FOR_PICKUP') && (
                    <div className="w-full space-y-3 bg-qubink-softmint/50 p-3.5 rounded-2xl border border-qubink-teal/20">
                      {order.fulfillmentType === 'PICKUP' ? (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-qubink-navy block">
                            Verify Customer 4-Digit Pickup PIN:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Enter pickup PIN"
                              value={pickupCodeInput[order.id] || ''}
                              onChange={(e) =>
                                setPickupCodeInput({
                                  ...pickupCodeInput,
                                  [order.id]: e.target.value.toUpperCase(),
                                })
                              }
                              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold tracking-widest text-qubink-navy bg-white focus:outline-none focus:border-qubink-teal"
                            />
                            <button
                              onClick={() => handleVerifyCode(order.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Verify & Complete
                            </button>
                          </div>
                          {codeError[order.id] && (
                            <span className="text-[11px] text-red-600 font-bold block">
                              {codeError[order.id]}
                            </span>
                          )}
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-qubink-muted">
                            <span>Pickup PIN on Customer App:</span>
                            <div className="flex items-center gap-1">
                              {(order.pickupCode.replace(/\D/g, '') || order.pickupCode).split('').slice(0, 4).map((ch, i) => (
                                <span key={i} className="w-6 h-7 rounded bg-white border border-qubink-teal/30 flex items-center justify-center text-xs font-black text-qubink-navy shadow-2xs">{ch}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                          className="w-full px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Dispatch for Home Delivery</span>
                        </button>
                      )}
                    </div>
                  )}

                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                      className="w-full px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Delivered & Completed</span>
                    </button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Order Completed & Delivered</span>
                      </div>
                      {order.rating && (
                        <span className="font-bold text-amber-700">★ {order.rating}/5</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <div className="space-y-4">
                {/* Order Status Filters */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {[
                      { id: 'recent', label: 'Recent', count: sortedOrders.filter(o => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(o.status)).length || sortedOrders.length },
                      { id: 'all', label: 'All Orders', count: shopOrders.length },
                      { id: 'PLACED', label: 'New', count: newOrders.length },
                      { id: 'ACCEPTED', label: 'Accepted', count: shopOrders.filter((o) => o.status === 'ACCEPTED').length },
                      { id: 'PRINTING', label: 'Printing', count: shopOrders.filter((o) => o.status === 'PRINTING').length },
                      { id: 'READY', label: 'Ready', count: shopOrders.filter((o) => ['READY', 'READY_FOR_PICKUP'].includes(o.status)).length },
                      { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: shopOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length },
                      { id: 'COMPLETED', label: 'Completed', count: completedOrders.length },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setOrderFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          orderFilter === tab.id
                            ? 'bg-qubink-teal text-white shadow-xs'
                            : 'bg-gray-50 text-qubink-navy hover:bg-gray-100'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search order ID or customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-qubink-navy focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2-Column Split Layout */}
                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
                    <Printer className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-bold text-sm text-qubink-navy">No Orders Found</h3>
                    <p className="text-xs text-qubink-muted">
                      No orders match the current filter or search criteria.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Compact Order Cards List */}
                    <div className="lg:col-span-5 space-y-3">
                      {filteredOrders.map((order) => {
                        const isSelected = activeOrder?.id === order.id;
                        const totalPgs = order.items.reduce(
                          (acc, it) => acc + (it.pageCount * (it.settings.copies || 1)),
                          0
                        );
                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setShowMobileSheet(true);
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative ${
                              isSelected
                                ? 'ring-2 ring-qubink-teal border-qubink-teal bg-teal-50/20 shadow-md'
                                : 'border-gray-200 hover:border-qubink-teal/60 hover:shadow-xs shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-qubink-navy">
                                  {order.orderNumber}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                    order.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : order.status === 'READY' || order.status === 'READY_FOR_PICKUP'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'PRINTING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : order.status === 'OUT_FOR_DELIVERY'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <span className="text-sm font-black text-qubink-teal font-heading">
                                ₹{order.totalAmount.toFixed(2)}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs">
                              <p className="font-bold text-qubink-dark truncate">{order.customerName}</p>
                              <span className="text-[10px] text-qubink-muted">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-qubink-muted">
                              <span className="truncate max-w-[190px]">
                                {order.items.length} {order.items.length === 1 ? 'file' : 'files'} • {totalPgs} pgs
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-qubink-navy text-[10px] font-bold">
                                {order.fulfillmentType === 'PICKUP' ? 'Store Pickup' : 'Delivery'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Order Details & Actions Workbench (Sticky on desktop) */}
                    <div className="hidden lg:block lg:col-span-7 sticky top-20 bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                      {activeOrder ? (
                        renderWorkbench(activeOrder)
                      ) : (
                        <div className="p-12 text-center text-xs text-qubink-muted">
                          Select an order from the list to view its print specifications and actions.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Bottom Sheet Drawer */}
                {showMobileSheet && activeOrder && (
                  <div className="lg:hidden fixed inset-0 z-[999999] flex flex-col justify-end">
                    <div
                      onClick={() => setShowMobileSheet(false)}
                      className="fixed inset-0 bg-[#082F3F]/70 backdrop-blur-xs transition-opacity animate-in fade-in"
                    />
                    <div className="relative z-10 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-gray-200 animate-in slide-in-from-bottom duration-200">
                      <div className="pt-3 pb-2 flex flex-col items-center border-b border-gray-100">
                        <div className="w-12 h-1.5 rounded-full bg-gray-300" />
                        <div className="w-full px-5 pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-qubink-navy">
                              {activeOrder.orderNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-qubink-softmint text-qubink-teal">
                              {activeOrder.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowMobileSheet(false)}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 bg-gray-100 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-5 overflow-y-auto">
                        {renderWorkbench(activeOrder, true)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="max-w-2xl bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Manage Printing Rates
                </h3>
                <p className="text-xs text-qubink-muted">
                  These prices are dynamically calculated on customer checkout and stored in Supabase.
                </p>
              </div>

              {pricingNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rates successfully updated in Supabase!</span>
                </div>
              )}

              <form onSubmit={handlePricingSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Black & White A4 (₹ / page)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={pricingForm.bwA4}
                      onChange={(e) => setPricingForm({ ...pricingForm, bwA4: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Colour A4 (₹ / page)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={pricingForm.colorA4}
                      onChange={(e) => setPricingForm({ ...pricingForm, colorA4: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Black & White A3 (₹ / page)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={pricingForm.bwA3}
                      onChange={(e) => setPricingForm({ ...pricingForm, bwA3: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Colour A3 (₹ / page)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={pricingForm.colorA3}
                      onChange={(e) => setPricingForm({ ...pricingForm, colorA3: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Spiral Binding (₹)
                    </label>
                    <input
                      type="number"
                      value={pricingForm.bindingPrice}
                      onChange={(e) => setPricingForm({ ...pricingForm, bindingPrice: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Lamination (₹)
                    </label>
                    <input
                      type="number"
                      value={pricingForm.laminationPrice}
                      onChange={(e) => setPricingForm({ ...pricingForm, laminationPrice: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={pricingForm.deliveryFee}
                      onChange={(e) => setPricingForm({ ...pricingForm, deliveryFee: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all shadow-xs"
                >
                  Save Current Pricing
                </button>
              </form>
            </div>
          )}

          {/* 3. PROFILE & HOURS TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Shop Information & Timing
                </h3>
                <p className="text-xs text-qubink-muted">
                  Keep your shop details updated so nearby customers can contact and find you easily.
                </p>
              </div>

              {profileNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Shop details updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                {/* Shop Storefront Photo Upload */}
                <div className="space-y-2 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-qubink-navy flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-qubink-teal" />
                      <span>Shop Storefront / Banner Image</span>
                    </span>
                    <span className="text-[10px] text-qubink-muted">PNG, JPG up to 5MB</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0 shadow-2xs">
                      <img
                        src={shopImage}
                        alt="Shop preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-qubink-navy hover:border-qubink-teal hover:text-qubink-teal cursor-pointer shadow-2xs transition-all">
                        <Upload className="w-3.5 h-3.5 text-qubink-teal" />
                        <span>Upload New Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-qubink-muted">
                        A real photo of your counter or signboard increases customer trust & walk-in orders.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-qubink-navy font-bold focus:outline-none focus:border-qubink-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Shop Phone Number
                    </label>
                    <PhoneInput
                      value={shopPhone}
                      onChange={setShopPhone}
                      placeholder="98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Estimated Preparation Time
                    </label>
                    <input
                      type="text"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-qubink-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">Shop Address</label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-qubink-navy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isPickup}
                      onChange={(e) => setIsPickup(e.target.checked)}
                      className="rounded text-qubink-teal focus:ring-qubink-teal"
                    />
                    <span className="text-xs font-bold text-qubink-navy">🏬 Shop Pickup Available</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isDelivery}
                      onChange={(e) => setIsDelivery(e.target.checked)}
                      className="rounded text-qubink-teal focus:ring-qubink-teal"
                    />
                    <span className="text-xs font-bold text-qubink-navy">🚚 Home Delivery by Shop</span>
                  </label>
                </div>

                {/* UPI & Banking Section */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                      <span className="text-base">💳</span> UPI & Banking Details
                    </h4>
                    <p className="text-[11px] text-qubink-muted mt-0.5">Required to generate UPI QR for customer payments and for admin settlements.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourshop@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                    <p className="text-[11px] text-qubink-muted mt-0.5">Customers will scan a QR generated from this UPI ID for payments.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankBeneficiary}
                      onChange={(e) => setBankBeneficiary(e.target.value)}
                      placeholder="Shop Owner / Firm Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-qubink-navy mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234567890"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-qubink-navy focus:outline-none focus:border-qubink-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-qubink-navy mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-qubink-navy focus:outline-none focus:border-qubink-teal"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all shadow-xs"
                >
                  Save Shop Profile
                </button>
              </form>
            </div>
          )}

          {/* 4. PICKUP VERIFIER TAB */}
          {activeTab === 'verify' && (
            <div className="max-w-xl bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Pickup Order Verification
                </h3>
                <p className="text-xs text-qubink-muted max-w-sm mx-auto">
                  Ask the customer for their <strong>4-digit pickup code</strong> or scan their QR code to safely release documents.
                </p>
              </div>

              {standaloneResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                    standaloneResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {standaloneResult.success ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  )}
                  <span>{standaloneResult.message}</span>
                </div>
              )}

              {/* 4-Digit Code Input — individual styled boxes */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-qubink-navy text-center">
                  Enter 4-Digit Pickup Code
                </label>
                <div className="flex items-center justify-center gap-3">
                  {[0,1,2,3].map((i) => (
                    <input
                      key={i}
                      id={`verify-digit-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={standaloneCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const arr = standaloneCode.padEnd(4, ' ').split('');
                        arr[i] = val || ' ';
                        const next = arr.join('').trimEnd();
                        setStandaloneCode(next);
                        // Auto-advance to next input
                        if (val && i < 3) {
                          document.getElementById(`verify-digit-${i + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !standaloneCode[i] && i > 0) {
                          document.getElementById(`verify-digit-${i - 1}`)?.focus();
                        }
                      }}
                      className="w-16 h-20 text-center text-3xl font-black text-qubink-navy rounded-2xl border-2 border-gray-200 focus:border-qubink-teal focus:outline-none focus:ring-2 focus:ring-qubink-teal/20 transition-all bg-gray-50 focus:bg-white"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleStandaloneVerify}
                  disabled={standaloneCode.replace(/\s/g, '').length < 4}
                  className="w-full py-3 rounded-xl bg-qubink-teal text-white font-bold text-sm hover:bg-qubink-teal/90 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✓ Verify &amp; Mark Order Collected
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-qubink-muted font-medium">or scan QR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Camera QR Scanner */}
              <QrCameraScanner
                onScan={(code) => {
                  const digits = code.replace(/\D/g, '').slice(0, 4);
                  setStandaloneCode(digits);
                }}
              />

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1 text-qubink-muted">
                <span className="font-bold text-qubink-navy block">Security Rule:</span>
                Never hand over printed documents without verifying the customer's 4-digit pickup code. Each code is unique to one order.
              </div>
            </div>
          )}

          {/* 5. ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Top KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                  <span className="text-xs text-qubink-muted font-bold block">Total Revenue</span>
                  <p className="text-2xl font-black text-emerald-600 font-heading">&#8377;{todayRevenue.toFixed(2)}</p>
                  <span className="text-[11px] text-qubink-muted">{completedOrders.length} orders completed</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                  <span className="text-xs text-qubink-muted font-bold block">Avg. Order Value</span>
                  <p className="text-2xl font-black text-qubink-teal font-heading">
                    &#8377;{completedOrders.length > 0 ? (todayRevenue / completedOrders.length).toFixed(0) : '0'}
                  </p>
                  <span className="text-[11px] text-qubink-muted">Per transaction</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                  <span className="text-xs text-qubink-muted font-bold block">Shop Rating</span>
                  <p className="text-2xl font-black text-amber-500 font-heading">&#11088; {shop.rating.toFixed(1)}</p>
                  <span className="text-[11px] text-qubink-muted">{shop.reviewCount} reviews</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                  <span className="text-xs text-qubink-muted font-bold block">UPI Pending</span>
                  <p className="text-2xl font-black text-blue-500 font-heading">
                    {shopOrders.filter(o => o.paymentStatus === 'PENDING_VERIFICATION').length}
                  </p>
                  <span className="text-[11px] text-qubink-muted">Payments to verify</span>
                </div>
              </div>

              {/* Fulfillment & Payment Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-qubink-navy font-heading">&#128230; Fulfillment Breakdown</h3>
                  {[
                    { label: '&#127978; Shop Pickup', count: shopOrders.filter(o => o.fulfillmentType === 'PICKUP').length, color: 'bg-qubink-teal' },
                    { label: '&#128666; Home Delivery', count: shopOrders.filter(o => o.fulfillmentType === 'DELIVERY').length, color: 'bg-blue-500' },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-qubink-navy" dangerouslySetInnerHTML={{ __html: row.label }} />
                        <span className="font-black text-qubink-navy">{row.count} <span className="font-normal text-qubink-muted">/ {shopOrders.length}</span></span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: shopOrders.length > 0 ? `${(row.count / shopOrders.length) * 100}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-qubink-navy font-heading">&#128179; Payment Methods</h3>
                  {[
                    { label: '&#128241; UPI', count: shopOrders.filter(o => o.paymentMethod === 'UPI').length, color: 'bg-indigo-500' },
                    { label: '&#128274; Razorpay', count: shopOrders.filter(o => o.paymentMethod === 'RAZORPAY').length, color: 'bg-blue-500' },
                    { label: '&#128181; Cash', count: shopOrders.filter(o => ['CASH','PAY_AT_SHOP','CASH_ON_DELIVERY'].includes(o.paymentMethod)).length, color: 'bg-emerald-500' },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-qubink-navy" dangerouslySetInnerHTML={{ __html: row.label }} />
                        <span className="font-black text-qubink-navy">{row.count} orders</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: shopOrders.length > 0 ? `${(row.count / shopOrders.length) * 100}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Star Rating Distribution + Reviews */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-qubink-navy font-heading">&#11088; Customer Ratings &amp; Reviews</h3>
                  <div className="text-right">
                    <p className="text-xl font-black text-amber-500 font-heading">{shop.rating.toFixed(1)}<span className="text-sm text-qubink-muted font-normal"> / 5.0</span></p>
                    <p className="text-[11px] text-qubink-muted">{shop.reviewCount} total</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {[5,4,3,2,1].map((star) => {
                    const ratedOrders = completedOrders.filter(o => o.rating === star);
                    const ratedTotal = completedOrders.filter(o => o.rating).length;
                    const pct = ratedTotal > 0 ? (ratedOrders.length / ratedTotal) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-10 text-right font-bold text-amber-500">{star} &#9733;</span>
                        <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-5 text-qubink-muted font-medium">{ratedOrders.length}</span>
                      </div>
                    );
                  })}
                </div>

                {completedOrders.filter(o => o.rating).length > 0 ? (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-qubink-navy">Recent Reviews</p>
                    {completedOrders.filter(o => o.rating).slice(0, 5).map((order) => (
                      <div key={order.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} className={`text-sm ${s <= order.rating! ? 'text-amber-400' : 'text-gray-200'}`}>&#9733;</span>
                            ))}
                            <span className="text-[11px] font-bold text-qubink-navy ml-1">{order.rating}/5</span>
                          </div>
                          <span className="text-[10px] text-qubink-muted font-mono">{order.orderNumber}</span>
                        </div>
                        <p className="text-xs font-medium text-qubink-navy">{order.customerName}</p>
                        {order.reviewComment && <p className="text-xs text-qubink-muted italic">"{order.reviewComment}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-3 border-t border-gray-100">No customer ratings yet. They'll appear here once orders are completed and reviewed.</p>
                )}
              </div>

              {/* Order Status Summary grid */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-sm text-qubink-navy font-heading">&#128202; Order Status Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'New', count: newOrders.length, cls: 'bg-amber-100 text-amber-800' },
                    { label: 'Printing', count: inProgressOrders.length, cls: 'bg-teal-100 text-teal-800' },
                    { label: 'Ready', count: readyOrders.length, cls: 'bg-blue-100 text-blue-800' },
                    { label: 'Completed', count: completedOrders.length, cls: 'bg-emerald-100 text-emerald-800' },
                    { label: 'Rejected', count: shopOrders.filter(o => o.status === 'REJECTED').length, cls: 'bg-red-100 text-red-800' },
                    { label: 'Cancelled', count: shopOrders.filter(o => o.status === 'CANCELLED').length, cls: 'bg-gray-100 text-gray-600' },
                    { label: 'UPI Pending', count: shopOrders.filter(o => o.paymentStatus === 'PENDING_VERIFICATION').length, cls: 'bg-indigo-100 text-indigo-800' },
                    { label: 'Total', count: shopOrders.length, cls: 'bg-qubink-navy text-white' },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl ${item.cls} space-y-0.5`}>
                      <p className="text-lg font-black">{item.count}</p>
                      <p className="text-[11px] opacity-80">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutModal && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-qubink-navy font-heading">
                Sign Out of Shop Portal?
              </h3>
              <p className="text-xs text-qubink-muted">
                Are you sure you want to exit your shop partner dashboard? You can log back in anytime with your credentials.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewItem && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <FileText className="w-5 h-5 text-qubink-teal" />
              <span className="font-bold text-qubink-navy text-sm flex-1 truncate">{previewItem.name}</span>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-gray-100 hover:bg-qubink-softmint text-gray-600 hover:text-qubink-teal transition-colors"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={previewItem.url}
                download={previewItem.name}
                className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-600 transition-colors"
                title="Download Document"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
              {previewItem.mime?.includes('image') ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-w-full max-h-[70vh] rounded-2xl mx-auto border border-gray-100 shadow-sm object-contain"
                />
              ) : previewItem.mime?.includes('pdf') ? (
                <iframe
                  src={previewItem.url}
                  title={previewItem.name}
                  className="w-full rounded-2xl border border-gray-200 bg-white"
                  style={{ height: '65vh' }}
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FileText className="w-14 h-14 text-qubink-teal/40 mx-auto" />
                  <p className="text-sm font-bold text-qubink-navy">{previewItem.name}</p>
                  <a
                    href={previewItem.url}
                    download={previewItem.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-xs hover:bg-qubink-teal/90 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

