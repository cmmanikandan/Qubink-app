'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { CustomerAddress, AddressLabel } from '@/types';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ArrowLeft,
  Home,
  GraduationCap,
  Briefcase,
  Navigation,
  Star,
} from 'lucide-react';

export default function CustomerAddressesPage() {
  const router = useRouter();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useApp();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState<AddressLabel>('Home');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingId(null);
    setLabel('Home');
    setAddressLine('');
    setLandmark('');
    setCity('');
    setPincode('');
    setIsDefault(addresses.length === 0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (addr: CustomerAddress) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setAddressLine(addr.addressLine);
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setPincode(addr.pincode);
    setIsDefault(!!addr.isDefault);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Form Submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) {
      setErrorMsg('Please enter house/flat/street address.');
      return;
    }
    if (!pincode.trim() || pincode.length < 6) {
      setErrorMsg('Please enter a valid 6-digit pincode.');
      return;
    }

    if (editingId) {
      // Edit existing
      updateAddress(editingId, {
        label,
        addressLine: addressLine.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        isDefault,
      });
      if (isDefault) {
        setDefaultAddress(editingId);
      }
    } else {
      // Add new
      addAddress({
        label,
        addressLine: addressLine.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        isDefault,
      });
    }

    setIsModalOpen(false);
  };

  const getLabelIcon = (lbl: AddressLabel) => {
    switch (lbl) {
      case 'Home':
        return <Home className="w-4 h-4 text-emerald-600" />;
      case 'College':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'Office':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      default:
        return <Navigation className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 selection:bg-qubink-teal selection:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-qubink-navy transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-qubink-navy font-heading">
              My Saved Addresses
            </h1>
            <p className="text-xs text-qubink-muted">
              Manage your delivery locations & default drop points
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-qubink-teal text-white font-bold text-xs shadow-md hover:bg-qubink-teal/90 flex items-center gap-1.5 cursor-pointer hover:translate-y-[-1px] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Address List */}
      <div className="space-y-3.5">
        {addresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-200/80 shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center mx-auto">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-qubink-navy font-heading">
              No saved addresses yet
            </h3>
            <p className="text-xs text-qubink-muted max-w-sm mx-auto leading-relaxed">
              Add your college hostel, home, or office address to enable 1-tap print order delivery.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-5 py-2.5 rounded-xl bg-qubink-teal text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Add First Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs space-y-3 ${
                addr.isDefault
                  ? 'border-qubink-teal ring-2 ring-qubink-softmint'
                  : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getLabelIcon(addr.label)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-qubink-navy">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>Default Delivery Address</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-qubink-navy font-medium leading-snug">
                      {addr.addressLine}
                    </p>
                    {addr.landmark && (
                      <p className="text-xs text-qubink-muted">
                        Landmark: <span className="text-qubink-navy font-medium">{addr.landmark}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium">
                      {addr.city}, Karnataka - {addr.pincode}
                    </p>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-qubink-teal transition-colors cursor-pointer"
                    title="Edit Address"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this address?')) {
                        deleteAddress(addr.id);
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Set as Default quick action if not default */}
              {!addr.isDefault && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(addr.id)}
                    className="text-xs font-bold text-qubink-teal hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Set as Default Address</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Address Label Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Address Type / Label
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Home', 'College', 'Office', 'Other'] as AddressLabel[]).map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setLabel(l)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        label === l
                          ? 'bg-qubink-teal text-white border-qubink-teal shadow-xs'
                          : 'bg-gray-50 text-qubink-navy border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>{l}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Line */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Flat / Room / House No. & Street *
                </label>
                <textarea
                  required
                  rows={2}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Room 304, Kaveri Hostel, University Campus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                />
              </div>

              {/* Landmark & Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near Back Gate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Postal Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city (e.g. Coimbatore, Bengaluru)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                />
              </div>

              {/* Set as Default Checkbox */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-qubink-teal rounded border-gray-300 focus:ring-qubink-teal"
                />
                <span className="text-xs font-semibold text-qubink-navy">
                  Set as default delivery address
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-qubink-muted hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-qubink-teal text-white text-xs font-bold shadow-md hover:bg-qubink-teal/90 cursor-pointer transition-all"
                >
                  {editingId ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
