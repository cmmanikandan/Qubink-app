'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import { Shop, OrderStatus } from '@/types';
import {
  LayoutDashboard,
  Store,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sliders,
  Search,
  Check,
  X,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  ShieldCheck,
  Menu,
  ChevronRight,
  LogOut,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertTriangle,
  UserCheck,
  UserX,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    shops,
    orders,
    approveShop,
    rejectShop,
    toggleShopSuspension,
    commissionRate,
    setCommissionRate,
    searchRadius,
    setSearchRadius,
    customersList,
    toggleBlockCustomer,
    currentUser,
    setCurrentUser,
    setRole,
  } = useApp();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
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
    router.push('/admin/login');
  };

  const [activeTab, setActiveTab] = useState<
    'overview' | 'approvals' | 'shops' | 'orders' | 'customers' | 'settings'
  >('overview');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopSearch, setShopSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [tempCommission, setTempCommission] = useState(commissionRate.toString());
  const [tempRadius, setTempRadius] = useState(searchRadius.toString());
  const [settingsNotice, setSettingsNotice] = useState(false);
  const [inspectShop, setInspectShop] = useState<Shop | null>(null);

  // Real Metric Calculations
  const pendingShops = shops.filter((s) => s.status === 'PENDING_APPROVAL');
  const approvedShops = shops.filter((s) => s.status === 'APPROVED');
  const suspendedShops = shops.filter((s) => s.status === 'SUSPENDED');
  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const platformRevenue = (totalGMV * commissionRate) / 100;
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCommissionRate(parseFloat(tempCommission) || 5);
    setSearchRadius(parseInt(tempRadius) || 5);
    setSettingsNotice(true);
    setTimeout(() => setSettingsNotice(false), 3000);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'approvals',
      label: 'Shop Approvals',
      icon: Store,
      badge: pendingShops.length > 0 ? pendingShops.length : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'shops', label: 'Printing Shops', icon: Store },
    { id: 'orders', label: 'Orders Directory', icon: FileText, badge: orders.length },
    { id: 'customers', label: 'Customer Management', icon: Users },
    { id: 'settings', label: 'Platform & Rates', icon: Sliders },
  ];

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
        {/* Brand & Identity */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
            <Link href="/" className="flex items-center gap-2">
              <QubinkLogo size="sm" lightText />
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-qubink-teal/20 text-qubink-mint px-2 py-0.5 rounded-full border border-qubink-teal/30">
              Admin
            </span>
          </div>

          {/* Nav List */}
          <div className="p-3 space-y-1">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Platform Governance
            </p>
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

        {/* User / Bottom Switcher */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-qubink-teal text-white font-bold flex items-center justify-center text-xs">
                AD
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Super Admin</p>
                <p className="text-[10px] text-gray-400 font-mono">role: admin</p>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-qubink-mint flex-shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
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
              <h1 className="text-base sm:text-lg font-black text-qubink-navy font-heading capitalize">
                {activeTab === 'overview'
                  ? 'Platform Overview'
                  : activeTab === 'approvals'
                  ? 'Shop Verification & Approvals'
                  : activeTab === 'shops'
                  ? 'Registered Printing Shops'
                  : activeTab === 'orders'
                  ? 'Order Management'
                  : activeTab === 'customers'
                  ? 'Customer Directory'
                  : 'Platform Settings'}
              </h1>
              <p className="text-[11px] text-qubink-muted hidden sm:block">
                Qubink Marketplace Administration • Supabase PostgreSQL & Firebase Auth Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>

            <Link
              href="/login"
              className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* BODY CONTAINER */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* SaaS Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-qubink-muted font-bold">
                    <span>Total Gross Volume</span>
                    <DollarSign className="w-4 h-4 text-qubink-teal" />
                  </div>
                  <div className="text-2xl font-black text-qubink-navy font-heading">
                    ₹{totalGMV.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real database orders</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-qubink-muted font-bold">
                    <span>Platform Commission ({commissionRate}%)</span>
                    <Sparkles className="w-4 h-4 text-qubink-mint" />
                  </div>
                  <div className="text-2xl font-black text-qubink-teal font-heading">
                    ₹{platformRevenue.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-qubink-muted">Net marketplace earnings</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-qubink-muted font-bold">
                    <span>Pending Approvals</span>
                    <Store className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 font-heading">
                    {pendingShops.length}
                  </div>
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Review pending shops</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-qubink-muted font-bold">
                    <span>Orders Completed</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-qubink-navy font-heading">
                    {completedOrdersCount} / {totalOrdersCount}
                  </div>
                  <div className="text-[11px] text-qubink-muted">
                    {totalOrdersCount > 0
                      ? `${Math.round((completedOrdersCount / totalOrdersCount) * 100)}% fulfillment rate`
                      : 'No orders yet'}
                  </div>
                </div>
              </div>

              {/* Pending Approvals Alert Banner */}
              {pendingShops.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-amber-900">
                        {pendingShops.length} Print Shop Application(s) Awaiting Review
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Shops cannot accept customer orders until an administrator approves their credentials.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs"
                  >
                    Review Queue
                  </button>
                </div>
              )}

              {/* Recent Orders Overview */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-qubink-navy font-heading">
                      Recent Marketplace Orders
                    </h3>
                    <p className="text-xs text-qubink-muted">Real-time customer transactions</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-qubink-teal hover:underline flex items-center gap-1"
                  >
                    <span>View all orders</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="p-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between flex-wrap gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-qubink-navy">
                            {order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-qubink-softmint text-qubink-teal">
                            {order.fulfillmentType === 'PICKUP' ? '🏪 Pickup' : '🚚 Delivery'}
                          </span>
                        </div>
                        <p className="text-qubink-muted">
                          Customer: <strong className="text-qubink-navy">{order.customerName}</strong> •{' '}
                          Shop: <strong>{order.shopName}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-qubink-navy">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'READY'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'PRINTING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. SHOP APPROVALS TAB */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                    Shop Approval Queue
                  </h3>
                  <p className="text-xs text-qubink-muted">
                    Verify shop address, license, and services before granting marketplace visibility
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                  {pendingShops.length} Pending
                </span>
              </div>

              {pendingShops.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-qubink-navy">Approval Queue is Clear!</h4>
                  <p className="text-xs text-qubink-muted max-w-sm mx-auto">
                    All registered Xerox and printing shops are approved and active in customer discovery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-qubink-softmint text-qubink-teal font-extrabold flex items-center justify-center text-lg">
                            {shop.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-qubink-navy">{shop.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Pending Approval
                              </span>
                            </div>
                            <p className="text-xs text-qubink-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {shop.address}, {shop.city} - {shop.pincode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveShop(shop.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Shop</span>
                          </button>
                          <button
                            onClick={() => rejectShop(shop.id)}
                            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-qubink-muted block text-[11px]">Phone</span>
                          <span className="font-semibold text-qubink-navy">{shop.phone}</span>
                        </div>
                        <div>
                          <span className="text-qubink-muted block text-[11px]">Email</span>
                          <span className="font-semibold text-qubink-navy">{shop.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-qubink-muted block text-[11px]">Services</span>
                          <span className="font-semibold text-qubink-navy">
                            {shop.services.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-qubink-muted block text-[11px]">Fulfillment</span>
                          <span className="font-semibold text-qubink-navy">
                            {shop.isPickupAvailable ? 'Pickup' : ''}
                            {shop.isPickupAvailable && shop.isDeliveryAvailable ? ' + ' : ''}
                            {shop.isDeliveryAvailable ? 'Delivery' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. ALL SHOPS DIRECTORY */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by shop name, locality, or city..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-qubink-navy focus:outline-none focus:border-qubink-teal"
                  />
                </div>
                <span className="text-xs text-qubink-muted font-bold">
                  {approvedShops.length} Active / {shops.length} Total
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-qubink-muted font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-4">Shop Name</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shops
                        .filter(
                          (s) =>
                            s.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
                            s.city.toLowerCase().includes(shopSearch.toLowerCase())
                        )
                        .map((shop) => (
                          <tr key={shop.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-qubink-navy">{shop.name}</p>
                              <p className="text-[11px] text-qubink-muted">{shop.phone}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-qubink-navy">{shop.address}</p>
                              <p className="text-[11px] text-qubink-muted">{shop.city} - {shop.pincode}</p>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-qubink-navy">⭐ {shop.rating}</span>
                              <span className="text-qubink-muted text-[11px]"> ({shop.reviewCount})</span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  shop.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : shop.status === 'PENDING_APPROVAL'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {shop.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => toggleShopSuspension(shop.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
                                  shop.status === 'SUSPENDED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                              >
                                {shop.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. ORDERS DIRECTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer Name..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-qubink-navy focus:outline-none focus:border-qubink-teal"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-qubink-navy bg-white focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PLACED">Placed</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PRINTING">Printing</option>
                    <option value="READY">Ready</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-qubink-muted font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-4">Order ID & Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Print Shop</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Pickup Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders
                        .filter((o) => {
                          const matchesSearch =
                            o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                            o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
                          const matchesStatus =
                            orderStatusFilter === 'all' || o.status === orderStatusFilter;
                          return matchesSearch && matchesStatus;
                        })
                        .map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-4">
                              <p className="font-mono font-bold text-qubink-navy">{o.orderNumber}</p>
                              <p className="text-[11px] text-qubink-muted">
                                {new Date(o.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-qubink-navy">{o.customerName}</p>
                              <p className="text-[11px] text-qubink-muted">{o.customerPhone}</p>
                            </td>
                            <td className="p-4 font-medium text-qubink-navy">{o.shopName}</td>
                            <td className="p-4">
                              <span className="font-semibold text-qubink-navy">
                                {o.fulfillmentType === 'PICKUP' ? '🏪 Pickup' : '🚚 Delivery'}
                              </span>
                            </td>
                            <td className="p-4 font-black text-qubink-teal text-sm">
                              ₹{o.totalAmount.toFixed(2)}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  o.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.status === 'READY'
                                    ? 'bg-blue-100 text-blue-800'
                                    : o.status === 'PRINTING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-1 rounded-lg text-qubink-navy">
                                {o.pickupCode}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. CUSTOMER MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                    Customer Moderation
                  </h3>
                  <p className="text-xs text-qubink-muted">
                    Manage active customer accounts, monitor suspicious activity, and enforce trust
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-qubink-softmint text-qubink-teal font-bold text-xs">
                  {customersList.length} Verified Customers
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-qubink-muted font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Registered</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-qubink-navy">{cust.fullName || cust.name}</p>
                          <p className="text-[11px] text-qubink-muted">{cust.email}</p>
                        </td>
                        <td className="p-4 text-qubink-navy">{cust.phone}</td>
                        <td className="p-4 text-qubink-muted">
                          {new Date(cust.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              cust.isBlocked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {cust.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleBlockCustomer(cust.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-1.5 ${
                              cust.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {cust.isBlocked ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Block User</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Platform Parameters & Commission
                </h3>
                <p className="text-xs text-qubink-muted">
                  Configure marketplace revenue share, search radius, and database policies
                </p>
              </div>

              {settingsNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Platform settings successfully saved to Supabase!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Platform Commission Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={tempCommission}
                      onChange={(e) => setTempCommission(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-qubink-muted font-bold">
                      % per order
                    </span>
                  </div>
                  <p className="text-[11px] text-qubink-muted mt-1">
                    Automatically calculated on every customer order processed by shops.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Default Customer Nearby Search Radius (KM)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={tempRadius}
                    onChange={(e) => setTempRadius(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy focus:outline-none focus:border-qubink-teal"
                  />
                  <p className="text-[11px] text-qubink-muted mt-1">
                    Shops within this radius are prioritized in the customer discovery view.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <span className="font-bold text-qubink-navy">Infrastructure Status</span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-qubink-muted">Authentication Engine</span>
                    <span className="font-semibold text-emerald-700">Firebase Auth Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-qubink-muted">PostgreSQL & Storage</span>
                    <span className="font-semibold text-emerald-700">Supabase Connected</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-qubink-muted">Email OTP Service</span>
                    <span className="font-semibold text-emerald-700">EmailJS Service Active</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all shadow-xs"
                >
                  Save Platform Configuration
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-qubink-navy font-heading">
                Sign Out of Admin Portal?
              </h3>
              <p className="text-xs text-qubink-muted">
                Are you sure you want to exit the administrative console? You can sign back in with your administrator account.
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
    </div>
  );
}
