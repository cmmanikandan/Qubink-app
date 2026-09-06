'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import PhoneInput from '@/components/PhoneInput';
import {
  User,
  Phone,
  GraduationCap,
  Briefcase,
  Store,
  Truck,
  Printer,
  Sparkles,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smile,
  ShieldCheck,
  BellRing,
} from 'lucide-react';

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, addAddress } = useApp();

  // Step 1: Personal Details, Step 2: Role/Organization, Step 3: Printing Preferences, Step 4: Primary Address, Step 5: Completed
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 Details
  const [fullName, setFullName] = useState(currentUser.fullName || currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [selectedAvatar, setSelectedAvatar] = useState('🎓');

  // Step 2 Persona
  const [persona, setPersona] = useState<'student' | 'professional' | 'individual'>('student');
  const [collegeName, setCollegeName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Step 3 Preferences
  const [preferredFulfillment, setPreferredFulfillment] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [frequentPrintType, setFrequentPrintType] = useState<'BW' | 'COLOR'>('BW');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  // Step 4 Primary Address
  const [addressLabel, setAddressLabel] = useState<'College' | 'Home' | 'Office'>('College');
  const [addressLine, setAddressLine] = useState('Room 204, Kaveri Boys Hostel, Campus Road');
  const [landmark, setLandmark] = useState('Near North Gate');
  const [pincode, setPincode] = useState('560085');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatarOptions = ['🎓', '🚀', '💻', '📚', '⚡', '🌟', '🎨'];

  // Step 1 Submit
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your mobile phone number for pickup alerts.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  // Step 2 Submit
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (persona === 'student' && !collegeName.trim()) {
      setErrorMsg('Please enter your college or institute name.');
      return;
    }
    if (persona === 'professional' && !companyName.trim()) {
      setErrorMsg('Please enter your company or workspace name.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  // Step 3 Submit
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStep(4);
  };

  // Step 4 Submit (Finalize)
  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) {
      setErrorMsg('Please provide your primary location or address.');
      return;
    }
    if (!pincode.trim() || pincode.length < 6) {
      setErrorMsg('Please enter a valid 6-digit pincode.');
      return;
    }

    // Save user profile details in store
    setCurrentUser({
      fullName,
      name: fullName,
      phone,
    });

    // Save primary address
    addAddress({
      label: addressLabel,
      addressLine,
      landmark,
      city: 'Bengaluru',
      pincode,
      isDefault: true,
    });

    // Mark onboarding completed in localStorage
    if (typeof window !== 'undefined' && currentUser?.id) {
      localStorage.setItem(`onboarded_${currentUser.id}`, 'true');
    }

    setStep(5);
  };

  const handleFinish = () => {
    router.push('/customer/home');
  };

  return (
    <div className="min-h-screen bg-[#F6FAFA] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-qubink-teal selection:text-white">
      {/* Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <QubinkLogo size="sm" />
          <span className="text-[11px] font-bold text-qubink-muted">
            • Profile Setup Wizard
          </span>
        </div>
        <span className="text-xs font-bold text-qubink-teal bg-qubink-softmint px-3 py-1 rounded-full border border-qubink-teal/20">
          Step {step} of 5
        </span>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-xl w-full mx-auto my-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-gray-200/80 space-y-6">
          {/* Stepper Progress Bar */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-qubink-teal h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-medium animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-qubink-teal">
                  Personal Details
                </span>
                <h2 className="text-2xl font-black text-qubink-navy font-heading">
                  Welcome! What should we call you?
                </h2>
                <p className="text-xs text-qubink-muted">
                  Let's set up your profile for smooth counter pickups and order alerts.
                </p>
              </div>

              {/* Avatar Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-qubink-navy">
                  Pick your profile badge:
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {avatarOptions.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-12 h-12 rounded-2xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                        selectedAvatar === av
                          ? 'bg-qubink-softmint border-2 border-qubink-teal shadow-xs scale-110'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Mobile Number (For 6-Digit Pickup PINs) *
                </label>
                <PhoneInput
                  required
                  value={phone}
                  onChange={setPhone}
                  placeholder="98450 12345"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-qubink-teal text-white text-xs font-bold shadow-md hover:bg-qubink-teal/90 flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Who You Are</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Persona & Role */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-qubink-teal">
                  Campus & Persona
                </span>
                <h2 className="text-2xl font-black text-qubink-navy font-heading">
                  How will you use Qubink?
                </h2>
                <p className="text-xs text-qubink-muted">
                  We'll prioritize Xerox centers closest to your university campus or workspace.
                </p>
              </div>

              {/* Persona Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'student',
                    title: 'Student',
                    desc: 'College & exam prep',
                    icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
                  },
                  {
                    id: 'professional',
                    title: 'Professional',
                    desc: 'Office & corporate',
                    icon: <Briefcase className="w-5 h-5 text-amber-600" />,
                  },
                  {
                    id: 'individual',
                    title: 'Personal',
                    desc: 'General documents',
                    icon: <User className="w-5 h-5 text-emerald-600" />,
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      persona === p.id
                        ? 'border-qubink-teal bg-qubink-softmint/40 shadow-xs ring-2 ring-qubink-teal/30'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white shadow-2xs w-fit">
                      {p.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-qubink-navy">{p.title}</p>
                      <p className="text-[10px] text-qubink-muted">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {persona === 'student' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-bold text-qubink-navy">
                    College / University Campus Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. PES University Ring Road Campus"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
              )}

              {persona === 'professional' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Company / Workplace Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Infosys Electronic City"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy hover:bg-gray-50 cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-qubink-teal text-white text-xs font-bold shadow-md hover:bg-qubink-teal/90 flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Print Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Print Preferences */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-qubink-teal">
                  Order Preferences
                </span>
                <h2 className="text-2xl font-black text-qubink-navy font-heading">
                  How do you prefer getting printouts?
                </h2>
                <p className="text-xs text-qubink-muted">
                  You can change this on every order, but we'll set this as your default.
                </p>
              </div>

              {/* Delivery vs Pickup */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredFulfillment('PICKUP')}
                  className={`p-4 rounded-2xl border text-left space-y-2 cursor-pointer transition-all ${
                    preferredFulfillment === 'PICKUP'
                      ? 'border-qubink-teal bg-qubink-softmint/40 shadow-xs ring-2 ring-qubink-teal/30'
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <Store className="w-5 h-5 text-qubink-teal" />
                  <div>
                    <p className="text-xs font-bold text-qubink-navy">Quick Counter Pickup</p>
                    <p className="text-[10px] text-qubink-muted">Zero queue, collect in 5 mins</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredFulfillment('DELIVERY')}
                  className={`p-4 rounded-2xl border text-left space-y-2 cursor-pointer transition-all ${
                    preferredFulfillment === 'DELIVERY'
                      ? 'border-qubink-teal bg-qubink-softmint/40 shadow-xs ring-2 ring-qubink-teal/30'
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-qubink-navy">Doorstep / Hostel Drop</p>
                    <p className="text-[10px] text-qubink-muted">Delivered to your room or office</p>
                  </div>
                </button>
              </div>

              {/* Default Print Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Default Print Color Mode:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFrequentPrintType('BW')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      frequentPrintType === 'BW'
                        ? 'bg-qubink-navy text-white border-qubink-navy'
                        : 'bg-white text-qubink-navy border-gray-200'
                    }`}
                  >
                    B&W Xerox / Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequentPrintType('COLOR')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      frequentPrintType === 'COLOR'
                        ? 'bg-qubink-teal text-white border-qubink-teal'
                        : 'bg-white text-qubink-navy border-gray-200'
                    }`}
                  >
                    Color Presentations
                  </button>
                </div>
              </div>

              {/* WhatsApp Toggle */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                    <BellRing className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Order & Pickup Code Alerts</span>
                  </span>
                  <p className="text-[10px] text-qubink-muted">
                    Receive your 6-digit pickup PIN directly on WhatsApp.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="w-4 h-4 text-qubink-teal rounded"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy hover:bg-gray-50 cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-qubink-teal text-white text-xs font-bold shadow-md hover:bg-qubink-teal/90 flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Default Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Primary Address */}
          {step === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-qubink-teal">
                  Primary Location
                </span>
                <h2 className="text-2xl font-black text-qubink-navy font-heading">
                  Where should we locate print shops?
                </h2>
                <p className="text-xs text-qubink-muted">
                  Add your primary delivery address or hostel room for fast 1-tap checkout.
                </p>
              </div>

              {/* Label selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Address Type:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['College', 'Home', 'Office'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressLabel(lbl)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addressLabel === lbl
                          ? 'bg-qubink-teal text-white border-qubink-teal'
                          : 'bg-gray-50 text-qubink-navy border-gray-200'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-qubink-navy">
                  Hostel / Room / House No. & Street *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Room 204, Kaveri Hostel, University Campus"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near College Canteen"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-qubink-navy">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560085"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-navy hover:bg-gray-50 cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl bg-qubink-teal text-white text-xs font-bold shadow-md hover:bg-qubink-teal/90 flex items-center gap-2 cursor-pointer"
                >
                  <span>Complete Setup</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Success Confirmation */}
          {step === 5 && (
            <div className="py-6 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm text-3xl">
                {selectedAvatar}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Profile Complete
                </span>
                <h2 className="text-2xl font-black text-qubink-navy font-heading">
                  You're all set, {fullName.split(' ')[0]}!
                </h2>
                <p className="text-xs text-qubink-muted max-w-sm mx-auto">
                  Your profile and preferences are saved. Discover nearby print shops and print documents in minutes.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/70">
                  <span className="text-qubink-muted">Default Mode:</span>
                  <span className="font-bold text-qubink-navy">
                    {preferredFulfillment === 'PICKUP' ? 'Counter Pickup' : 'Doorstep Delivery'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/70">
                  <span className="text-qubink-muted">Default Color:</span>
                  <span className="font-bold text-qubink-navy">
                    {frequentPrintType === 'BW' ? 'Black & White' : 'Color Prints'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-qubink-muted">Saved Address:</span>
                  <span className="font-bold text-qubink-navy truncate max-w-[170px]">{addressLine}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-4 rounded-2xl bg-qubink-teal hover:bg-qubink-teal/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-1px]"
                >
                  <span>Explore Nearby Print Shops</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-qubink-muted pt-6">
        <p>© {new Date().getFullYear()} Qubink Technologies. Next-Gen Student & Campus Printing.</p>
      </div>
    </div>
  );
}
