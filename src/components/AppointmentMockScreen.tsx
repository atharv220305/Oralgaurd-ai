import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Share2,
  Lock,
  Navigation,
  Compass,
  LocateFixed,
  RefreshCw,
  SlidersHorizontal,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ClinicProvider, BookedAppointment } from '../types';
import { MOCK_CLINICS, calculateDistanceKm } from '../data/clinicalKnowledge';

interface AppointmentMockScreenProps {
  onBackToHome: () => void;
  onRetakeScreening: () => void;
  shareSummaryConsent?: boolean;
  selectedLanguage?: 'en' | 'hinglish' | 'hi';
}

const CITY_PRESETS = [
  { name: 'Mumbai', lat: 19.0048, lng: 72.8427 },
  { name: 'New Delhi', lat: 28.5672, lng: 77.2100 },
  { name: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', lat: 17.4326, lng: 78.4312 },
  { name: 'Chennai', lat: 13.0067, lng: 80.2570 },
  { name: 'Kolkata', lat: 22.5204, lng: 88.3533 },
];

export const AppointmentMockScreen: React.FC<AppointmentMockScreenProps> = ({
  onBackToHome,
  onRetakeScreening,
  shareSummaryConsent = true,
  selectedLanguage = 'en',
}) => {
  const isHindi = selectedLanguage === 'hi';
  const isHinglish = selectedLanguage === 'hinglish';
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');
  const [selectedClinic, setSelectedClinic] = useState<ClinicProvider>(MOCK_CLINICS[0]);
  const [selectedDate, setSelectedDate] = useState(selectedClinic.availableDates[0]);
  const [selectedTime, setSelectedTime] = useState(selectedClinic.availableTimes[0]);
  const [patientName, setPatientName] = useState('Rahul Verma');
  const [contactNumber, setContactNumber] = useState('+91 98765 43210');
  const [notes, setNotes] = useState('OralGuard AI screening referral for mucosal soft-tissue examination.');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationData, setConfirmationData] = useState<BookedAppointment | null>(null);

  // Geolocation states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedAreaName, setDetectedAreaName] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'denied' | 'unavailable'>('idle');
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  const specialties = ['All', 'Dentist', 'Oral & Maxillofacial Surgeon', 'ENT Specialist', 'Head & Neck Oncology'];

  // Geolocation API detection
  const detectLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      setLocationErrorMsg('Geolocation API is not supported in this browser.');
      return;
    }

    setLocationStatus('detecting');
    setLocationErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });
        setLocationStatus('detected');

        // Reverse-geocode to approximate neighborhood or city name
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const area =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.neighbourhood ||
              data.address?.county ||
              data.address?.state_district ||
              data.address?.state;
            if (area) {
              setDetectedAreaName(area);
              return;
            }
          }
        } catch {
          // Fall through to closest city estimate
        }

        // Proximity estimate to nearest metro landmark
        let closestCity = 'Your Area';
        let minDistance = Infinity;
        for (const preset of CITY_PRESETS) {
          const d = calculateDistanceKm(lat, lng, preset.lat, preset.lng);
          if (d < minDistance) {
            minDistance = d;
            closestCity = d < 60 ? `${preset.name} Vicinity` : `${preset.name} Region`;
          }
        }
        setDetectedAreaName(closestCity);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setLocationErrorMsg('Location permission denied. Showing all providers or select your city.');
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('unavailable');
          setLocationErrorMsg('Location detection timed out.');
        } else {
          setLocationStatus('unavailable');
          setLocationErrorMsg('Location is currently unavailable.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  // Detect location on mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Simulate city for testing or demonstration
  const handleSimulateCity = (preset: { name: string; lat: number; lng: number }) => {
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    setDetectedAreaName(preset.name);
    setLocationStatus('detected');
    setLocationErrorMsg(null);
    setSelectedCityFilter('All');
  };

  // Compute clinics sorted by proximity based on user geolocation
  const filteredClinics = useMemo(() => {
    let list: (ClinicProvider & { distanceKm?: number; isLocalSuggestion?: boolean })[] = [...MOCK_CLINICS];

    if (userCoords) {
      list = list.map((c) => {
        if (c.lat && c.lng) {
          const d = calculateDistanceKm(userCoords.lat, userCoords.lng, c.lat, c.lng);
          return {
            ...c,
            distanceKm: d,
            distance: d < 1 ? `${Math.round(d * 1000)} m away` : `${d.toFixed(1)} km away`,
          };
        }
        return c;
      });

      // Sort by proximity (closest first)
      list.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

      // If the closest clinic is more than 35 km away, inject a tailored immediate local clinic
      const closest = list[0]?.distanceKm ?? 99999;
      if (closest > 35) {
        const localClinic: ClinicProvider & { distanceKm: number; isLocalSuggestion: boolean } = {
          id: 'local-community-clinic',
          name: `${detectedAreaName || 'Nearby'} Dental & Oral Health Diagnostic Centre`,
          specialist: 'Dr. Sameer Joshi, BDS, MDS (Oral Medicine)',
          specialtyType: 'Dentist',
          title: 'Senior Clinical Specialist - Oral Lesion & Mucosa Screening',
          rating: 4.8,
          reviewsCount: 156,
          distance: '1.2 km away',
          distanceKm: 1.2,
          address: `Health Pavilion, ${detectedAreaName || 'Your Immediate Vicinity'}`,
          city: detectedAreaName || 'Local Vicinity',
          lat: userCoords.lat,
          lng: userCoords.lng,
          availableDates: ['Today, 4:00 PM', 'Tomorrow, 10:30 AM', 'Thursday, 2:00 PM'],
          availableTimes: ['10:30 AM', '11:45 AM', '2:00 PM', '4:00 PM'],
          badge: 'Closest Verified Community Provider',
          isLocalSuggestion: true,
        };
        list.unshift(localClinic);
      }
    }

    // Filter by specialty
    if (selectedSpecialty !== 'All') {
      list = list.filter((c) => c.specialtyType === selectedSpecialty);
    }

    // Filter by city if selected
    if (selectedCityFilter !== 'All') {
      list = list.filter((c) => c.city.toLowerCase().includes(selectedCityFilter.toLowerCase()));
    }

    return list;
  }, [userCoords, detectedAreaName, selectedSpecialty, selectedCityFilter]);

  // Keep selected clinic in sync with filtered list
  useEffect(() => {
    if (filteredClinics.length > 0 && !filteredClinics.some((c) => c.id === selectedClinic.id)) {
      handleClinicChange(filteredClinics[0]);
    }
  }, [filteredClinics, selectedClinic.id]);

  const handleClinicChange = (clinic: ClinicProvider) => {
    setSelectedClinic(clinic);
    setSelectedDate(clinic.availableDates[0]);
    setSelectedTime(clinic.availableTimes[0]);
  };

  const handleConfirmMockBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `OG-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    const booked: BookedAppointment = {
      confirmationCode: code,
      clinic: selectedClinic,
      date: selectedDate,
      timeSlot: selectedTime,
      patientName: patientName || 'Patient',
      contactNumber: contactNumber || '+91 00000 00000',
      patientNotes: notes,
      reasonForVisit: 'Oral Mucosal Screening & Lesion Inspection',
      bookedAt: new Date().toLocaleDateString(),
      shareSummaryWithDoctor: shareSummaryConsent,
    };
    setConfirmationData(booked);
    setIsConfirmed(true);
  };

  // State 2: Prototype Confirmation Screen (Requirement 16)
  if (isConfirmed && confirmationData) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        <div className="p-5 max-w-lg mx-auto w-full space-y-4 py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-2"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Demo Appointment Request Created
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Consultation Scheduled (Demo)
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              This is a demonstration workflow for the Aavishkar evaluation. No actual live hospital API request has been dispatched.
            </p>
          </motion.div>

          {/* Appointment Ticket Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="text-slate-400 font-medium">Demo Reference ID</span>
              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                {confirmationData.confirmationCode}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">{confirmationData.clinic.name}</h2>
                  <p className="text-slate-500 text-[11px]">{confirmationData.clinic.specialist}</p>
                  <p className="text-teal-700 font-medium text-[11px]">{confirmationData.clinic.title}</p>
                  <p className="text-slate-400 text-[11px]">{confirmationData.clinic.address}, {confirmationData.clinic.city}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Date</span>
                    <span className="font-bold text-slate-800 text-[11px]">{confirmationData.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Time</span>
                    <span className="font-bold text-slate-800 text-[11px]">{confirmationData.timeSlot}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">Patient: <strong>{confirmationData.patientName}</strong></span>
                <span className="text-slate-500">{confirmationData.contactNumber}</span>
              </div>

              {/* Data Sharing Status */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {confirmationData.shareSummaryWithDoctor ? (
                    <>
                      <FileCheck className="w-4 h-4 text-teal-600" />
                      <span className="text-slate-700 font-medium">Screening Summary Attached</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 font-medium">Summary Kept Private</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {confirmationData.shareSummaryWithDoctor ? 'Shared by user choice' : 'Not attached'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Clinical Visit Preparation Guidelines */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-[11px]">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              Patient Preparation Tips:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[10px]">
              <li>Do not apply topical anesthetic gels or mouthwashes 2 hours prior to clinical mucosal visualization.</li>
              <li>Bring a list of any medications, vitamins, and past dental procedures.</li>
              <li>Be prepared to discuss your timeline (how long the sore/patch has been present).</li>
            </ul>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={onRetakeScreening}
              id="btn-confirm-retake"
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isHindi ? 'नई स्क्रीनिंग शुरू करें' : 'Start New Screening Session'}</span>
            </button>
            <button
              onClick={onBackToHome}
              id="btn-confirm-home"
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              {isHindi ? 'अस्वीकरण और जानकारी पर वापस जाएँ' : 'Back to Disclaimer & Info'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 1: Booking Form Screen with Specialty, Hospital, Date & Time Selection
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-8">
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Demo Referral Workflow
            </span>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Prototype Demonstration
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Book In-Person Consultation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect with an oral specialist for tactile mucosal inspection and physical examination.
          </p>
        </div>

        {/* Step 1: Specialty Selection (Requirement 16) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            1. Select Specialty
          </label>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  selectedSpecialty === spec
                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Geolocation Suggestions & Regional Filter */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <LocateFixed className="w-4 h-4 text-teal-600" />
              <span>Nearby Provider Suggestions (Geolocation)</span>
            </div>

            <button
              type="button"
              onClick={detectLocation}
              disabled={locationStatus === 'detecting'}
              className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200/80 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${locationStatus === 'detecting' ? 'animate-spin' : ''}`} />
              <span>{locationStatus === 'detecting' ? 'Detecting...' : 'Detect My Location'}</span>
            </button>
          </div>

          {/* Status info */}
          {locationStatus === 'detecting' && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin flex-shrink-0" />
              <span>Querying browser Geolocation API for your local area...</span>
            </div>
          )}

          {locationStatus === 'detected' && (
            <div className="flex items-center justify-between text-xs bg-teal-50/80 border border-teal-200 rounded-lg p-2 text-teal-900">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span>
                  Showing dental & clinical providers near: <strong>{detectedAreaName || 'Your Area'}</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 flex-shrink-0">
                Sorted by Proximity
              </span>
            </div>
          )}

          {(locationStatus === 'denied' || locationStatus === 'unavailable') && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <span>{locationErrorMsg || 'Location access unavailable. Showing all regional clinical providers.'}</span>
              </div>
            </div>
          )}

          {/* Quick Metro Presets / Testing buttons */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span>Quick Area Presets:</span>
              <span className="text-[10px] text-slate-400">Tap to test proximity sorting</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {CITY_PRESETS.map((p) => {
                const isActive = detectedAreaName?.toLowerCase().includes(p.name.toLowerCase());
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSimulateCity(p)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white border-teal-700 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Clinic & Specialist Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">
              2. Choose Hospital / Specialized Center
            </label>
            <span className="text-[11px] text-slate-500">
              {filteredClinics.length} provider{filteredClinics.length !== 1 ? 's' : ''} available
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {filteredClinics.map((clinic) => {
              const isSelected = selectedClinic.id === clinic.id;
              const isLocalSuggestion = (clinic as unknown as { isLocalSuggestion?: boolean }).isLocalSuggestion;

              return (
                <div
                  key={clinic.id}
                  onClick={() => handleClinicChange(clinic)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {clinic.specialtyType}
                        </span>
                        {isLocalSuggestion && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Nearest Local Provider
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-teal-600" />
                          <span>{clinic.distance}</span>
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 mt-1">{clinic.name}</h3>
                      <p className="text-[11px] text-slate-600 font-medium">{clinic.specialist}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {clinic.address}, {clinic.city} • ★ {clinic.rating} ({clinic.reviewsCount} reviews)
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Date & Time Slot Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              3. Available Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800 font-medium cursor-pointer"
            >
              {selectedClinic.availableDates.map((date, idx) => (
                <option key={idx} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              4. Time Slot
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800 font-medium cursor-pointer"
            >
              {selectedClinic.availableTimes.map((time, idx) => (
                <option key={idx} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 4: Patient Information Form */}
        <form onSubmit={handleConfirmMockBooking} className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-700 block">
            5. Patient Contact Details
          </label>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full Name"
                required
                className="flex-1 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Contact Number"
                required
                className="flex-1 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Privacy Consent Acknowledgment indicator */}
          <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-[11px] text-teal-900 flex items-center gap-2">
            {shareSummaryConsent ? (
              <>
                <FileCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Your structured screening summary will be shared with the consulting specialist.</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <span>Summary kept private: Personal screening report will not be attached.</span>
              </>
            )}
          </div>

          <button
            type="submit"
            id="btn-submit-appointment"
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-teal-700/20 transition-all cursor-pointer mt-3"
          >
            <span>Confirm Demo Appointment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
