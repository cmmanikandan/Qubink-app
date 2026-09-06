'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import PhoneInput, { extractSubscriberNumber } from '@/components/PhoneInput';
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Globe,
  Clock,
  Printer,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Truck,
  ExternalLink,
  ShieldCheck,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Upload,
  Camera,
  ImageIcon,
} from 'lucide-react';

const INDIAN_STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Delhi (NCR)',
  'Gujarat',
  'West Bengal',
  'Rajasthan',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Bihar',
  'Punjab',
  'Haryana',
  'Odisha',
  'Assam',
  'Goa',
  'Chhattisgarh',
  'Jharkhand',
  'Uttarakhand',
  'Himachal Pradesh',
  'Puducherry',
  'Chandigarh',
  'Jammu and Kashmir',
  'Ladakh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Sikkim',
  'Arunachal Pradesh',
];

export default function ShopRegisterPage() {
  const router = useRouter();
  const { setRole, setCurrentUser, registerShop } = useApp();

  // Next-to-next wizard step: 1 (Account) -> 2 (Location & Map) -> 3 (Services) -> 4 (Success)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Owner & Account Info
  const [ownerName, setOwnerName] = useState('');
  const [ownerNameTouched, setOwnerNameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Helper validation functions
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val: string) => {
    const clean = extractSubscriberNumber(val);
    return clean.length === 10 && /^[6-9]/.test(clean);
  };
  const isPasswordValid = (val: string) => val.length >= 6;
  const isConfirmPasswordValid = (pass: string, conf: string) => conf.length >= 6 && conf === pass;

  // Step 2: Shop & Location (with City, District, State & Map URL)
  const [shopName, setShopName] = useState('');
  const [shopImage, setShopImage] = useState<string>(
    'https://images.unsplash.com/photo-1562774053-701939374585?w=800'
  );
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  const handleShopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Selected image is too large. Please choose a photo under 5MB.');
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

  // Step 3: Services & Operational Setup
  const [services, setServices] = useState<string[]>([
    'B&W Xerox',
    'Color Printing',
    'Spiral Binding',
    'Lamination',
  ]);
  const [openingTime, setOpeningTime] = useState('08:30 AM');
  const [closingTime, setClosingTime] = useState('09:30 PM');
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Banking & UPI (Step 3)
  const [upiIdReg, setUpiIdReg] = useState('');
  const [bankBeneficiaryReg, setBankBeneficiaryReg] = useState('');
  const [bankAccountReg, setBankAccountReg] = useState('');
  const [bankIfscReg, setBankIfscReg] = useState('');

  // Available services list
  const availableServices = [
    { id: 'B&W Xerox', label: 'B&W Xerox & Photocopy', desc: 'Fast single/double-sided document copying' },
    { id: 'Color Printing', label: 'High-Res Color Printing', desc: 'Vibrant laser & inkjet charts, reports' },
    { id: 'Spiral Binding', label: 'Spiral & Comb Binding', desc: 'Book binding with front transparent sheets' },
    { id: 'Lamination', label: 'Document Lamination', desc: 'ID cards, certificates & sheets protection' },
    { id: 'Scanning', label: 'High-Speed Scanning', desc: 'Scan hardcopy to PDF/Email' },
    { id: 'Photo Printing', label: 'Glossy Photo Prints', desc: 'Passport size and project photo printing' },
  ];

  const toggleService = (srv: string) => {
    setServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  // Step 1 validation -> Step 2
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerNameTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!ownerName.trim() || ownerName.trim().length < 2) {
      setErrorMsg('Please enter the owner full name (at least 2 characters).');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address (e.g. owner@yourshop.com).');
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!isPasswordValid(password)) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword !== password) {
      setErrorMsg('Passwords do not match. Please re-enter confirm password.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  // Step 2 validation -> Step 3
  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg('Please enter your shop or business name.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please enter the shop street address & building details.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Please enter the city or town.');
      return;
    }
    if (!district.trim()) {
      setErrorMsg('Please enter the district name.');
      return;
    }
    if (!stateName.trim()) {
      setErrorMsg('Please select or enter the state.');
      return;
    }
    const cleanPincode = pincode.replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return;
    }
    if (!mapUrl.trim()) {
      setErrorMsg('Please provide a Google Maps URL so customers can navigate to your store.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(3);
  };

  // Step 3 validation -> Finalize Shop Creation
  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (services.length === 0) {
      setErrorMsg('Please select at least one service offered by your shop.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const fullAddress = `${address.trim()}, ${landmark.trim() ? landmark.trim() + ', ' : ''}${city.trim()}, ${district.trim()}, ${stateName.trim()} - ${pincode.trim()}`;

      // Register new shop in store
      registerShop(
        {
          name: shopName.trim(),
          address: fullAddress,
          city: city.trim(),
          district: district.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
          phone,
          email,
          mapUrl: mapUrl.trim(),
          imageUrl: shopImage,
          openingTime,
          closingTime,
          isDeliveryAvailable,
          isPickupAvailable: true,
          services,
          description: `Verified print & xerox center. Located at ${fullAddress}.`,
          upiId: upiIdReg.trim() || undefined,
          bankBeneficiary: bankBeneficiaryReg.trim() || undefined,
          bankAccount: bankAccountReg.trim() || undefined,
          bankIfsc: bankIfscReg.trim().toUpperCase() || undefined,
        },
        {
          bwA4: 2.0,
          colorA4: 10.0,
          bwA3: 5.0,
          colorA3: 20.0,
          bindingPrice: 35.0,
          laminationPrice: 25.0,
          deliveryFee: isDeliveryAvailable ? 30.0 : 0.0,
        }
      );

      // Authenticate session as shop owner
      const newOwnerId = `owner-${Date.now()}`;
      setRole('shop');
      setCurrentUser({
        id: newOwnerId,
        fullName: ownerName,
        name: ownerName,
        email,
        phone,
        role: 'shop',
      });

      setCurrentStep(4);
    } catch (err: any) {
      setErrorMsg('Failed to create shop account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAFA] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-qubink-teal selection:text-white">
      {/* Top Navigation */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-qubink-navy hover:border-qubink-teal hover:text-qubink-teal shadow-2xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-qubink-muted">Already registered?</span>
          <Link
            href="/shop/login"
            className="text-xs font-bold text-qubink-teal hover:underline"
          >
            Partner Sign In
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl w-full mx-auto my-auto space-y-6">
        {/* Wizard Progress Stepper */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/80 space-y-6">
          {/* Logo & Intro */}
          <div className="text-center space-y-1.5 pb-2">
            <div className="inline-block transition-transform hover:scale-105">
              <QubinkLogo size="md" />
            </div>
            <h1 className="text-2xl font-black text-qubink-navy font-heading tracking-tight pt-1">
              Create Your Print Shop Account
            </h1>
            <p className="text-xs text-qubink-muted max-w-md mx-auto">
              Join Qubink to receive online print & xerox orders directly to your counter with zero hassle.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="relative max-w-md mx-auto px-6">
            {/* Accurate Progress Connector Line (passing through vertical center of circles) */}
            <div className="absolute left-10 right-10 top-4 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0">
              <div
                className="h-full bg-qubink-teal rounded-full transition-all duration-300"
                style={{
                  width:
                    currentStep === 1
                      ? '0%'
                      : currentStep === 2
                      ? '33.33%'
                      : currentStep === 3
                      ? '66.66%'
                      : '100%',
                }}
              />
            </div>

            <div className="relative z-10 flex items-start justify-between">
              {[
                { stepNum: 1, label: 'Owner Info' },
                { stepNum: 2, label: 'Location & Map' },
                { stepNum: 3, label: 'Services' },
                { stepNum: 4, label: 'Complete' },
              ].map((s) => {
                const isPast = currentStep > s.stepNum;
                const isCurrent = currentStep === s.stepNum;
                const isClickable = s.stepNum < currentStep && currentStep !== 4;

                return (
                  <button
                    key={s.stepNum}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && setCurrentStep(s.stepNum as 1 | 2 | 3)}
                    className={`flex flex-col items-center gap-1.5 focus:outline-none group ${
                      isClickable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    title={isClickable ? `Click to go back to Step ${s.stepNum}: ${s.label}` : undefined}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isCurrent
                          ? 'bg-qubink-teal text-white ring-4 ring-qubink-softmint shadow-sm'
                          : isPast
                          ? 'bg-emerald-500 text-white group-hover:scale-110 shadow-xs'
                          : 'bg-white border-2 border-gray-200 text-gray-400'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : s.stepNum}
                    </div>
                    <span
                      className={`text-[10px] font-bold whitespace-nowrap transition-colors ${
                        isCurrent
                          ? 'text-qubink-navy font-extrabold'
                          : isPast
                          ? 'text-qubink-teal group-hover:underline'
                          : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Account & Owner Info */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4 pt-2">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-sm text-qubink-navy flex items-center gap-2">
                  <User className="w-4 h-4 text-qubink-teal" />
                  <span>Step 1: Partner Account Credentials</span>
                </h3>
                <p className="text-[11px] text-qubink-muted">
                  Provide your primary contact details to manage your store dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner Full Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      onBlur={() => setOwnerNameTouched(true)}
                      placeholder="e.g. Suresh Kumar"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs text-qubink-navy bg-gray-50/50 focus:outline-none transition-colors ${
                        ownerNameTouched
                          ? ownerName.trim().length >= 2
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-red-400 focus:border-red-400 bg-red-50/20'
                          : 'border-gray-200 focus:border-qubink-teal'
                      }`}
                    />
                  </div>
                  {ownerNameTouched && ownerName.trim().length < 2 && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Please enter owner full name (at least 2 characters)</span>
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Email Address (Login ID) *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="owner@yourshop.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs text-qubink-navy bg-gray-50/50 focus:outline-none transition-colors ${
                        emailTouched
                          ? isValidEmail(email)
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-red-400 focus:border-red-400 bg-red-50/20'
                          : 'border-gray-200 focus:border-qubink-teal'
                      }`}
                    />
                  </div>
                  {emailTouched && !isValidEmail(email) ? (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Please enter a valid email address (e.g. owner@yourshop.com)</span>
                    </p>
                  ) : emailTouched && isValidEmail(email) ? (
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 flex-shrink-0" />
                      <span>Valid email address</span>
                    </p>
                  ) : null}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Mobile Number *
                  </label>
                  <PhoneInput
                    required
                    value={phone}
                    onChange={setPhone}
                    onBlur={() => setPhoneTouched(true)}
                    error={phoneTouched && !isValidPhone(phone)}
                    placeholder="98765 43210"
                  />
                  {phoneTouched && !isValidPhone(phone) ? (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Enter valid 10-digit Indian number starting with 6, 7, 8, or 9</span>
                    </p>
                  ) : phoneTouched && isValidPhone(phone) ? (
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 flex-shrink-0" />
                      <span>Valid mobile number</span>
                    </p>
                  ) : null}
                </div>

                {/* Create Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="At least 6 characters"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs text-qubink-navy bg-gray-50/50 focus:outline-none transition-colors ${
                        passwordTouched
                          ? isPasswordValid(password)
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-red-400 focus:border-red-400 bg-red-50/20'
                          : 'border-gray-200 focus:border-qubink-teal'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-qubink-navy p-0.5 rounded cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordTouched && !isPasswordValid(password) && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Password must be at least 6 characters</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs text-qubink-navy bg-gray-50/50 focus:outline-none transition-colors ${
                        confirmPasswordTouched
                          ? isConfirmPasswordValid(password, confirmPassword)
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-red-400 focus:border-red-400 bg-red-50/20'
                          : 'border-gray-200 focus:border-qubink-teal'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-qubink-navy p-0.5 rounded cursor-pointer"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPasswordTouched && !isConfirmPasswordValid(password, confirmPassword) ? (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{confirmPassword.length === 0 ? 'Please confirm your password' : 'Passwords do not match'}</span>
                    </p>
                  ) : confirmPasswordTouched && isConfirmPasswordValid(password, confirmPassword) ? (
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 flex-shrink-0" />
                      <span>Passwords match</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-qubink-teal hover:bg-qubink-teal/90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Shop Location & Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Shop Details & Google Map URL */}
          {currentStep === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4 pt-2">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-sm text-qubink-navy flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-qubink-teal" />
                  <span>Step 2: Shop Details & Location (City, District, State)</span>
                </h3>
                <p className="text-[11px] text-qubink-muted">
                  Add your shop address, city, district, state, and Google Maps URL so students & local customers can walk directly to your counter.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Shop / Xerox Center Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Sri Balaji Xerox & Digital Prints"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Shop Storefront Photo Upload */}
                <div className="space-y-2 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <label className="block text-xs font-bold text-qubink-navy flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-qubink-teal" />
                      <span>Shop Storefront / Banner Photo</span>
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
                        <span>Upload Storefront Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleShopImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-qubink-muted">
                        A real photo of your counter or signboard helps students and customers locate your shop immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-qubink-navy">
                      Street Address & Building No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shop #12, Opp. College Main Gate, M.G. Road"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-qubink-navy">
                      Landmark / Locality (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Metro Station Gate 2 / Bus Stand"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                    />
                  </div>

                  {/* City / Town */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-qubink-teal" />
                      <span>City / Town *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Coimbatore, Bengaluru, Chennai"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                    />
                  </div>

                  {/* District */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-qubink-teal" />
                      <span>District *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Coimbatore, Bengaluru Urban"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-qubink-teal" />
                      <span>State *</span>
                    </label>
                    <div className="relative">
                      <select
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs font-medium text-qubink-navy bg-gray-50/50 appearance-none cursor-pointer pr-8"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-qubink-muted text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Postal Pincode */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-qubink-navy">
                      Postal Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      inputMode="numeric"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="641001"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Google Maps URL Field - High Priority Feature */}
                <div className="p-4 rounded-2xl bg-qubink-softmint/40 border border-qubink-teal/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-qubink-navy flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-qubink-teal" />
                      <span>Google Maps Location URL *</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-qubink-teal text-white">
                      GPS Direct
                    </span>
                  </div>
                  <input
                    type="url"
                    required
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/xyz... or https://goo.gl/maps/..."
                    className="w-full px-4 py-3 rounded-xl border border-qubink-teal/40 bg-white focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy"
                  />
                  <div className="flex items-center justify-between text-[11px] text-qubink-muted pt-1">
                    <span>Open Google Maps app &rarr; Tap 'Share' &rarr; Copy Link</span>
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-qubink-teal font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Test Map Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy hover:bg-gray-100 hover:border-gray-300 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous: Owner Info</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-qubink-teal hover:bg-qubink-teal/90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Services & Hours</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Services & Equipment Setup */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalize} className="space-y-5 pt-2">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-sm text-qubink-navy flex items-center gap-2">
                  <Printer className="w-4 h-4 text-qubink-teal" />
                  <span>Step 3: Services Offered & Operating Hours</span>
                </h3>
                <p className="text-[11px] text-qubink-muted">
                  Select all services provided by your machines. You can update custom prices anytime in your dashboard.
                </p>
              </div>

              {/* Services Checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-qubink-navy">
                  Select Available Services:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableServices.map((srv) => {
                    const isChecked = services.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isChecked
                            ? 'border-qubink-teal bg-qubink-softmint/30 shadow-2xs'
                            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                            isChecked ? 'bg-qubink-teal text-white' : 'border border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-qubink-navy">{srv.label}</p>
                          <p className="text-[10px] text-qubink-muted">{srv.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-qubink-teal" />
                    <span>Opening Time</span>
                  </label>
                  <input
                    type="text"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    placeholder="08:30 AM"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-qubink-teal" />
                    <span>Closing Time</span>
                  </label>
                  <input
                    type="text"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    placeholder="09:30 PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Delivery Toggle */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-qubink-teal" />
                    <span>Offer Campus / Doorstep Delivery?</span>
                  </span>
                  <p className="text-[10px] text-qubink-muted">
                    Can staff deliver printouts to nearby college hostels or offices?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeliveryAvailable(!isDeliveryAvailable)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isDeliveryAvailable ? 'bg-qubink-teal' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      isDeliveryAvailable ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* UPI & Banking Details */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                    <span className="text-base">💳</span> UPI & Banking Details <span className="text-[10px] font-normal text-qubink-muted">(Optional, Required for receiving online payments)</span>
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={upiIdReg}
                    onChange={(e) => setUpiIdReg(e.target.value)}
                    placeholder="yourshop@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-qubink-navy focus:outline-none focus:border-qubink-teal"
                  />
                  <p className="text-[11px] text-qubink-muted mt-0.5">Customers will scan a QR generated from this UPI ID to pay online.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankBeneficiaryReg}
                    onChange={(e) => setBankBeneficiaryReg(e.target.value)}
                    placeholder="Shop Owner / Firm Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-qubink-navy focus:outline-none focus:border-qubink-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccountReg}
                      onChange={(e) => setBankAccountReg(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfscReg}
                      onChange={(e) => setBankIfscReg(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy hover:bg-gray-100 hover:border-gray-300 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous: Shop Location</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-3.5 rounded-2xl bg-qubink-teal hover:bg-qubink-teal/90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete & Create Shop</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success & Go to Dashboard */}
          {currentStep === 4 && (
            <div className="py-6 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Shop Activated
                </span>
                <h2 className="text-2xl font-black text-qubink-navy font-heading">
                  {shopName} is Ready!
                </h2>
                <p className="text-xs text-qubink-muted max-w-sm mx-auto">
                  Your shop is registered in the Qubink network. Customers can now discover your shop and place print orders.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                  <span className="text-qubink-muted">Shop Name:</span>
                  <span className="font-bold text-qubink-navy">{shopName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                  <span className="text-qubink-muted">Owner:</span>
                  <span className="font-bold text-qubink-navy">{ownerName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                  <span className="text-qubink-muted">Location:</span>
                  <span className="font-bold text-qubink-navy">{city}, {district}, {stateName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                  <span className="text-qubink-muted">Map Link:</span>
                  <span className="font-bold text-qubink-teal truncate max-w-[200px]">{mapUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-qubink-muted">Operating Hours:</span>
                  <span className="font-bold text-qubink-navy">{openingTime} - {closingTime}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/shop-portal')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-qubink-teal hover:bg-qubink-teal/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-1px]"
                >
                  <span>Open Shop Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-qubink-navy font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Back to Marketplace
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-qubink-muted pt-6">
        <p>© {new Date().getFullYear()} Qubink Technologies. Print Partner Onboarding Portal.</p>
      </div>
    </div>
  );
}
