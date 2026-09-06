'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import {
  User,
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  KeyRound,
  RefreshCw,
  MapPin,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Printer,
  Clock,
  Building2,
} from 'lucide-react';
import { auth, createUserWithEmailAndPassword } from '@/lib/firebase';
import { syncFirebaseProfile } from '@/lib/supabase';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/emailjs';
import PhoneInput from '@/components/PhoneInput';

export default function RegisterPage() {
  const router = useRouter();
  const { setRole, registerShop } = useApp();

  // Wizard Steps: 1: Email & OTP, 2: Account Profile, 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<'customer' | 'shop'>('customer');

  // Step 1: Email & OTP State
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTouched, setOtpTouched] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Step 2: Customer Details & Touched
  const [custName, setCustName] = useState('');
  const [custNameTouched, setCustNameTouched] = useState(false);
  const [custPhone, setCustPhone] = useState('');
  const [custPhoneTouched, setCustPhoneTouched] = useState(false);
  const [custPass, setCustPass] = useState('');
  const [custPassTouched, setCustPassTouched] = useState(false);
  const [custConfirm, setCustConfirm] = useState('');
  const [custConfirmTouched, setCustConfirmTouched] = useState(false);
  const [showCustPass, setShowCustPass] = useState(false);
  const [showCustConfirm, setShowCustConfirm] = useState(false);

  // Step 2: Shop Details & Touched
  const [ownerName, setOwnerName] = useState('');
  const [ownerNameTouched, setOwnerNameTouched] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopNameTouched, setShopNameTouched] = useState(false);
  const [shopPhone, setShopPhone] = useState('');
  const [shopPhoneTouched, setShopPhoneTouched] = useState(false);
  const [shopAddress, setShopAddress] = useState('');
  const [shopAddressTouched, setShopAddressTouched] = useState(false);
  const [shopCity, setShopCity] = useState('');
  const [shopPincode, setShopPincode] = useState('');
  const [shopPincodeTouched, setShopPincodeTouched] = useState(false);
  const [shopLandmark, setShopLandmark] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopEmailTouched, setShopEmailTouched] = useState(false);
  const [shopPass, setShopPass] = useState('');
  const [shopPassTouched, setShopPassTouched] = useState(false);
  const [shopConfirm, setShopConfirm] = useState('');
  const [shopConfirmTouched, setShopConfirmTouched] = useState(false);
  const [showShopPass, setShowShopPass] = useState(false);
  const [showShopConfirm, setShowShopConfirm] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [bwA4, setBwA4] = useState('2.00');
  const [colorA4, setColorA4] = useState('10.00');
  const [deliveryFee, setDeliveryFee] = useState('30.00');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Xerox',
    'Printing',
    'Scanning',
    'Binding',
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Helper Validation Functions
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val: string) => {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.slice(2);
    }
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };
  const isValidPincode = (val: string) => /^\d{6}$/.test(val.trim());

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: 'bg-red-500' };
    let score = 2;
    if (/\d/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score >= 4 && pass.length >= 8) return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 3, label: 'Good', color: 'bg-amber-500' };
  };

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== svc));
      }
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Request Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!isValidEmail(email)) {
      setErrorNotice('Please provide a valid email address.');
      return;
    }

    setErrorNotice(null);
    setIsSendingOtp(true);
    setOtpNotice(null);

    try {
      const res = await sendEmailOtp(email);
      setOtpSent(true);
      setOtpNotice(res.message);
      if (res.demoOtp) {
        setDemoCodeHint(res.demoOtp);
      }
      setResendTimer(45);
    } catch (err: any) {
      setErrorNotice('Failed to generate verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpTouched(true);

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorNotice('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorNotice(null);
    setIsVerifyingOtp(true);

    const verification = verifyEmailOtp(email, otpCode);
    setIsVerifyingOtp(false);

    if (verification.valid) {
      setStep(2);
      setErrorNotice(null);
    } else {
      setErrorNotice(verification.error || 'Invalid verification code. Please check and try again.');
    }
  };

  // Step 2 Submit: Customer
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustNameTouched(true);
    setCustPhoneTouched(true);
    setCustPassTouched(true);
    setCustConfirmTouched(true);

    if (custName.trim().length < 2) {
      setErrorNotice('Full name must be at least 2 characters.');
      return;
    }
    if (!isValidPhone(custPhone)) {
      setErrorNotice('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (custPass.length < 6) {
      setErrorNotice('Password must be at least 6 characters long.');
      return;
    }
    if (custPass !== custConfirm) {
      setErrorNotice('Passwords do not match. Please verify.');
      return;
    }

    setErrorNotice(null);
    setIsLoading(true);

    try {
      let firebaseUid = `fb-cust-${Date.now()}`;

      // 1. Firebase Authentication
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, custPass);
          firebaseUid = cred.user.uid;
        } catch (fbErr: any) {
          console.warn('Firebase registration notice:', fbErr.message);
          if (fbErr.code === 'auth/email-already-in-use') {
            setErrorNotice('An account with this email already exists. Please sign in instead.');
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Supabase Profile Sync
      await syncFirebaseProfile(firebaseUid, {
        full_name: custName.trim(),
        email: email.trim().toLowerCase(),
        phone: custPhone.trim(),
        role: 'customer',
      });

      setRole('customer');
      setStep(3);
      setTimeout(() => {
        router.push('/customer/home');
      }, 1500);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Submit: Shop
  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerNameTouched(true);
    setShopNameTouched(true);
    setShopPhoneTouched(true);
    setShopAddressTouched(true);
    setShopPincodeTouched(true);
    setShopPassTouched(true);
    setShopConfirmTouched(true);

    if (ownerName.trim().length < 2) {
      setErrorNotice('Owner name must be at least 2 characters.');
      return;
    }
    if (shopName.trim().length < 3) {
      setErrorNotice('Shop name must be at least 3 characters.');
      return;
    }
    if (!isValidPhone(shopPhone)) {
      setErrorNotice('Please enter a valid 10-digit shop phone number.');
      return;
    }
    if (shopAddress.trim().length < 5) {
      setErrorNotice('Please provide a complete shop street address.');
      return;
    }
    if (!isValidPincode(shopPincode)) {
      setErrorNotice('Please enter a valid 6-digit postal pincode.');
      return;
    }
    if (shopPass.length < 6) {
      setErrorNotice('Password must be at least 6 characters.');
      return;
    }
    if (shopPass !== shopConfirm) {
      setErrorNotice('Passwords do not match. Please verify.');
      return;
    }

    setErrorNotice(null);
    setIsLoading(true);

    try {
      let firebaseUid = `fb-shop-${Date.now()}`;

      // 1. Firebase Authentication
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, shopPass);
          firebaseUid = cred.user.uid;
        } catch (fbErr: any) {
          console.warn('Firebase shop registration notice:', fbErr.message);
        }
      }

      // 2. Supabase Profile Sync
      await syncFirebaseProfile(firebaseUid, {
        full_name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: shopPhone.trim(),
        role: 'shop',
      });

      // 3. Register Shop in Supabase / Local Store
      registerShop(
        {
          name: shopName.trim(),
          phone: shopPhone.trim(),
          email: email.trim().toLowerCase(),
          address: shopAddress.trim(),
          city: shopCity.trim(),
          pincode: shopPincode.trim(),
          isPickupAvailable: pickupAvailable,
          isDeliveryAvailable: deliveryAvailable,
          services: selectedServices,
          status: 'PENDING_APPROVAL',
        },
        {
          bwA4: parseFloat(bwA4) || 2.0,
          colorA4: parseFloat(colorA4) || 10.0,
          deliveryFee: parseFloat(deliveryFee) || 30.0,
        }
      );

      setRole('shop');
      setStep(3);
      setTimeout(() => {
        router.push('/shop-portal');
      }, 2000);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Shop registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const custStrength = getPasswordStrength(custPass);
  const shopStrength = getPasswordStrength(shopPass);

  return (
    <div className="min-h-screen bg-[#F6FAFA] grid grid-cols-1 lg:grid-cols-12">
      {/* LEFT PANEL: BRAND IDENTITY & VALUE PROPS (lg:col-span-5) */}
      <aside className="lg:col-span-5 bg-[#082F3F] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-qubink-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-qubink-mint/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              <QubinkLogo size="md" lightText />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-qubink-softmint transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="space-y-3 pt-6">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-qubink-teal/20 text-qubink-mint px-3 py-1 rounded-full border border-qubink-teal/30">
              India's Cloud Xerox Network
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-heading leading-tight">
              Instant Document Printing & Xerox On-Demand.
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md">
              Create your account to connect directly with local copy centers. Skip the queue, get
              live status notifications, and pick up in 5 minutes.
            </p>
          </div>
        </div>

        {/* Center: 3 Feature highlights */}
        <div className="relative z-10 space-y-5 my-8">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-qubink-teal/20 text-qubink-mint flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white">Zero Shop Queues</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Send print jobs from your laptop or phone before arriving. Hot prints are ready at the counter.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-qubink-teal/20 text-qubink-mint flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white">Verified Local Xerox Shops</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Find trusted shops near your campus, office, or neighborhood with verified pricing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-qubink-teal/20 text-qubink-mint flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white">Secure 6-Digit Pickup PIN</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Your documents stay encrypted and are only handed over when you present your unique verification code.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <span>© {new Date().getFullYear()} QUBINK Technologies Pvt. Ltd.</span>
          <span className="text-qubink-mint font-semibold">Secure Registration</span>
        </div>
      </aside>

      {/* RIGHT PANEL: FULL FIT ONBOARDING FORM (lg:col-span-7) */}
      <main className="lg:col-span-7 bg-[#F6FAFA] min-h-screen p-6 sm:p-10 lg:p-14 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Header & Step Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-qubink-navy font-heading">
                  {step === 1
                    ? 'Get Started with Qubink'
                    : step === 2
                    ? accountType === 'customer'
                      ? 'Set Up Your Customer Profile'
                      : 'Register Your Print Shop'
                    : 'All Set!'}
                </h2>
                <p className="text-xs text-qubink-muted pt-1">
                  {step === 1
                    ? 'Verify your email address to initiate secure signup.'
                    : step === 2
                    ? 'Complete your account credentials and contact details.'
                    : 'Your account is ready.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-qubink-teal bg-qubink-softmint px-3 py-1 rounded-full">
                  Step {step} of 3
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= 1 ? 'bg-qubink-teal' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= 2 ? 'bg-qubink-teal' : 'bg-gray-200'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= 3 ? 'bg-qubink-teal' : 'bg-gray-200'
                }`}
              />
            </div>
          </div>

          {/* Role Toggle Selector (Step 1 only) */}
          {step === 1 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-qubink-navy">
                I Want To Register As:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('customer')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                    accountType === 'customer'
                      ? 'border-qubink-teal bg-white shadow-sm ring-2 ring-qubink-teal/20'
                      : 'border-gray-200 bg-white/70 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      accountType === 'customer'
                        ? 'bg-qubink-teal text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-qubink-navy">Customer Account</p>
                    <p className="text-[11px] text-qubink-muted">Print & photocopy orders</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('shop')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                    accountType === 'shop'
                      ? 'border-qubink-teal bg-white shadow-sm ring-2 ring-qubink-teal/20'
                      : 'border-gray-200 bg-white/70 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      accountType === 'shop'
                        ? 'bg-qubink-teal text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-qubink-navy">Print Shop Partner</p>
                    <p className="text-[11px] text-qubink-muted">Register printing business</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Global Alert Notification */}
          {errorNotice && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorNotice}</div>
            </div>
          )}

          {/* STEP 1: EMAIL & 6-DIGIT OTP VERIFICATION */}
          {step === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-qubink-navy">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    {emailTouched && isValidEmail(email) && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Valid Email
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      disabled={otpSent}
                      placeholder="e.g. rahul.sharma@example.com"
                      value={email}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorNotice) setErrorNotice(null);
                      }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs text-qubink-navy transition-colors focus:outline-none ${
                        emailTouched && !isValidEmail(email)
                          ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                          : 'border-gray-300 focus:border-qubink-teal'
                      } disabled:bg-gray-50 disabled:text-gray-500`}
                    />
                  </div>
                  {emailTouched && !isValidEmail(email) && (
                    <p className="text-[11px] text-red-500 pt-1">
                      Please enter a valid email address (e.g. name@domain.com)
                    </p>
                  )}
                </div>

                {!otpSent ? (
                  <button
                    type="submit"
                    disabled={isSendingOtp || !email}
                    className="w-full py-3.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending 6-Digit Code...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send 6-Digit Email OTP</span>
                      </>
                    )}
                  </button>
                ) : null}
              </form>

              {/* OTP Input Section once OTP is sent */}
              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4 border-t border-gray-100">
                  {otpNotice && (
                    <div className="p-3.5 rounded-2xl bg-qubink-softmint/70 border border-qubink-mint/40 text-xs text-qubink-navy space-y-1">
                      <div className="flex items-center gap-2 font-bold text-qubink-teal">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verification code sent to {email}</span>
                      </div>
                      {demoCodeHint && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-qubink-navy">
                            Demo Quick OTP: <strong className="font-mono text-qubink-teal">{demoCodeHint}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtpCode(demoCodeHint)}
                            className="text-[10px] font-bold text-qubink-teal bg-white px-2 py-0.5 rounded border border-qubink-teal/30 hover:bg-qubink-softmint"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1.5">
                      Enter 6-Digit Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="••••••"
                      value={otpCode}
                      onBlur={() => setOtpTouched(true)}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        if (errorNotice) setErrorNotice(null);
                      }}
                      className="w-full text-center tracking-[0.6em] font-mono font-black text-xl py-3 rounded-xl border border-gray-300 text-qubink-navy focus:outline-none focus:border-qubink-teal"
                    />
                    {otpTouched && otpCode.length < 6 && (
                      <p className="text-[11px] text-red-500 pt-1 text-center">
                        Please enter all 6 numeric digits.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length < 6}
                    className="w-full py-3.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Continue</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-qubink-muted pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setErrorNotice(null);
                      }}
                      className="hover:text-qubink-navy underline font-medium"
                    >
                      Change Email Address
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0}
                      onClick={handleSendOtp}
                      className="text-qubink-teal font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: CUSTOMER PROFILE REGISTRATION FORM */}
          {step === 2 && accountType === 'customer' && (
            <form
              onSubmit={handleCustomerSubmit}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4"
            >
              {/* Verified Email Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Verified Email: <strong>{email}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  Verified
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-qubink-navy mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={custName}
                    onBlur={() => setCustNameTouched(true)}
                    onChange={(e) => setCustName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                      custNameTouched && custName.trim().length < 2
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                        : 'border-gray-300 focus:border-qubink-teal'
                    }`}
                  />
                </div>
                {custNameTouched && custName.trim().length < 2 && (
                  <p className="text-[11px] text-red-500 pt-1">Please enter your full name.</p>
                )}
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-bold text-qubink-navy mb-1">
                  Phone Number (For Order Updates) <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  required
                  value={custPhone}
                  onBlur={() => setCustPhoneTouched(true)}
                  onChange={setCustPhone}
                  error={custPhoneTouched && !isValidPhone(custPhone)}
                />
                {custPhoneTouched && !isValidPhone(custPhone) && (
                  <p className="text-[11px] text-red-500 pt-1">
                    Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.
                  </p>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type={showCustPass ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={custPass}
                      onBlur={() => setCustPassTouched(true)}
                      onChange={(e) => setCustPass(e.target.value)}
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                        custPassTouched && custPass.length < 6
                          ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                          : 'border-gray-300 focus:border-qubink-teal'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustPass(!showCustPass)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCustPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {custPass && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className={`h-1 flex-1 rounded-full ${custStrength.color}`} />
                      <span className="text-[10px] font-bold text-qubink-muted">
                        {custStrength.label}
                      </span>
                    </div>
                  )}
                  {custPassTouched && custPass.length < 6 && (
                    <p className="text-[11px] text-red-500 pt-1">Password must be at least 6 characters.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type={showCustConfirm ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={custConfirm}
                      onBlur={() => setCustConfirmTouched(true)}
                      onChange={(e) => setCustConfirm(e.target.value)}
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                        custConfirmTouched && custConfirm !== custPass
                          ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                          : 'border-gray-300 focus:border-qubink-teal'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustConfirm(!showCustConfirm)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCustConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {custConfirmTouched && custConfirm && (
                    <p
                      className={`text-[11px] pt-1 font-semibold ${
                        custConfirm === custPass ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {custConfirm === custPass ? '✓ Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Customer Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Customer Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: SHOP PARTNER REGISTRATION FORM */}
          {step === 2 && accountType === 'shop' && (
            <form
              onSubmit={handleShopSubmit}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4"
            >
              {/* Verified Email Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Verified Email: <strong>{email}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  Verified
                </span>
              </div>

              {/* Owner Name & Shop Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={ownerName}
                    onBlur={() => setOwnerNameTouched(true)}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                      ownerNameTouched && ownerName.trim().length < 2
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                        : 'border-gray-300 focus:border-qubink-teal'
                    }`}
                  />
                  {ownerNameTouched && ownerName.trim().length < 2 && (
                    <p className="text-[11px] text-red-500 pt-1">Enter owner full name.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Shop Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    required
                    value={shopPhone}
                    onBlur={() => setShopPhoneTouched(true)}
                    onChange={setShopPhone}
                    error={shopPhoneTouched && !isValidPhone(shopPhone)}
                  />
                  {shopPhoneTouched && !isValidPhone(shopPhone) && (
                    <p className="text-[11px] text-red-500 pt-1">Enter valid 10-digit mobile number.</p>
                  )}
                </div>
              </div>

              {/* Shop Business Name */}
              <div>
                <label className="block text-xs font-bold text-qubink-navy mb-1">
                  Shop Name (As displayed to customers) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Ganesh Digital Xerox & Prints"
                    value={shopName}
                    onBlur={() => setShopNameTouched(true)}
                    onChange={(e) => setShopName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                      shopNameTouched && shopName.trim().length < 3
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                        : 'border-gray-300 focus:border-qubink-teal'
                    }`}
                  />
                </div>
                {shopNameTouched && shopName.trim().length < 3 && (
                  <p className="text-[11px] text-red-500 pt-1">Enter shop business name (min 3 chars).</p>
                )}
              </div>

              {/* Shop Physical Address */}
              <div>
                <label className="block text-xs font-bold text-qubink-navy mb-1">
                  Physical Shop Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. #14, 5th Cross, 80ft Road, Near Campus Gate"
                    value={shopAddress}
                    onBlur={() => setShopAddressTouched(true)}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                      shopAddressTouched && shopAddress.trim().length < 5
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                        : 'border-gray-300 focus:border-qubink-teal'
                    }`}
                  />
                </div>
                {shopAddressTouched && shopAddress.trim().length < 5 && (
                  <p className="text-[11px] text-red-500 pt-1">Enter complete shop address for GPS pickup.</p>
                )}
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shopCity}
                    onChange={(e) => setShopCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs text-qubink-navy focus:outline-none focus:border-qubink-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Postal Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="560095"
                    value={shopPincode}
                    onBlur={() => setShopPincodeTouched(true)}
                    onChange={(e) => setShopPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                      shopPincodeTouched && !isValidPincode(shopPincode)
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                        : 'border-gray-300 focus:border-qubink-teal'
                    }`}
                  />
                  {shopPincodeTouched && !isValidPincode(shopPincode) && (
                    <p className="text-[11px] text-red-500 pt-1">Enter 6-digit pincode.</p>
                  )}
                </div>
              </div>

              {/* Services Offered */}
              <div>
                <label className="block text-xs font-bold text-qubink-navy mb-1.5">
                  Services Offered
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Xerox', 'Printing', 'Scanning', 'Binding', 'Lamination'].map((svc) => {
                    const isSel = selectedServices.includes(svc);
                    return (
                      <button
                        type="button"
                        key={svc}
                        onClick={() => toggleService(svc)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSel
                            ? 'bg-qubink-teal text-white border-qubink-teal shadow-2xs'
                            : 'bg-white text-qubink-navy border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isSel && '✓ '}
                        {svc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fulfillment Options */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={pickupAvailable}
                    onChange={(e) => setPickupAvailable(e.target.checked)}
                    className="rounded text-qubink-teal focus:ring-qubink-teal"
                  />
                  <span className="text-xs font-bold text-qubink-navy">🏪 Store Pickup</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={deliveryAvailable}
                    onChange={(e) => setDeliveryAvailable(e.target.checked)}
                    className="rounded text-qubink-teal focus:ring-qubink-teal"
                  />
                  <span className="text-xs font-bold text-qubink-navy">🚚 Home Delivery</span>
                </label>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showShopPass ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={shopPass}
                      onBlur={() => setShopPassTouched(true)}
                      onChange={(e) => setShopPass(e.target.value)}
                      className={`w-full px-3.5 pr-9 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                        shopPassTouched && shopPass.length < 6
                          ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                          : 'border-gray-300 focus:border-qubink-teal'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowShopPass(!showShopPass)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showShopPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {shopPass && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className={`h-1 flex-1 rounded-full ${shopStrength.color}`} />
                      <span className="text-[10px] font-bold text-qubink-muted">
                        {shopStrength.label}
                      </span>
                    </div>
                  )}
                  {shopPassTouched && shopPass.length < 6 && (
                    <p className="text-[11px] text-red-500 pt-1">Password must be at least 6 characters.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-qubink-navy mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showShopConfirm ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={shopConfirm}
                      onBlur={() => setShopConfirmTouched(true)}
                      onChange={(e) => setShopConfirm(e.target.value)}
                      className={`w-full px-3.5 pr-9 py-2.5 rounded-xl border text-xs text-qubink-navy focus:outline-none ${
                        shopConfirmTouched && shopConfirm !== shopPass
                          ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                          : 'border-gray-300 focus:border-qubink-teal'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowShopConfirm(!showShopConfirm)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showShopConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {shopConfirmTouched && shopConfirm && (
                    <p
                      className={`text-[11px] pt-1 font-semibold ${
                        shopConfirm === shopPass ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {shopConfirm === shopPass ? '✓ Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                <strong>Platform Notice:</strong> Newly registered print shops require Administrator approval before receiving live customer orders in nearby search.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#082F3F] text-white font-bold text-xs hover:bg-[#082F3F]/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Shop Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Shop Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: SUCCESS CELEBRATION */}
          {step === 3 && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-xs text-center space-y-5">
              <div className="w-16 h-16 bg-qubink-softmint text-qubink-teal rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-qubink-navy font-heading">
                  Account Successfully Created!
                </h3>
                <p className="text-xs text-qubink-muted max-w-sm mx-auto leading-relaxed">
                  {accountType === 'customer'
                    ? 'Redirecting you to your customer printing dashboard...'
                    : 'Shop registered! Your application has been sent for admin review. Opening shop partner portal...'}
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <RefreshCw className="w-5 h-5 text-qubink-teal animate-spin" />
              </div>
            </div>
          )}

          {/* Already have an account */}
          <div className="text-center pt-2">
            <p className="text-xs text-qubink-muted">
              Already registered with Qubink?{' '}
              <Link href="/login" className="font-bold text-qubink-teal hover:underline">
                Sign In to Account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
