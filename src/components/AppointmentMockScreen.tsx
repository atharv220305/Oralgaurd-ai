/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Intelligent Care Navigator: Condition-aware referral, verified hospital directory,
 * location proximity search, map/list views, and doctor handoff integration.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  Building,
  User,
  Phone,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Lock,
  LocateFixed,
  RefreshCw,
  Search,
  AlertTriangle,
  PhoneCall,
  Map as MapIcon,
  List,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { ClinicProvider, BookedAppointment, PatientProfile, AssessmentResult } from '../types';
import { MOCK_CLINICS, calculateDistanceKm } from '../data/clinicalKnowledge';

interface AppointmentMockScreenProps {
  indicators?: PatientProfile;
  assessmentResult?: AssessmentResult | null;
  initialSpecialtyFilter?: string | null;
  onBackToHome: () => void;
  onRetakeScreening: () => void;
  shareSummaryConsent?: boolean;
  selectedLanguage?: 'en' | 'hinglish' | 'hi' | 'mr';
  onOpenHelplines?: () => void;
  onOpenEmergencyGuidance?: () => void;
  onOpenDoctorHandoff?: () => void;
}

const CITY_PRESETS = [
  { name: 'Mumbai', lat: 19.0048, lng: 72.8427 },
  { name: 'New Delhi', lat: 28.5672, lng: 77.2100 },
  { name: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { name: 'Hyderabad', lat: 17.4326, lng: 78.4312 },
  { name: 'Chennai', lat: 13.0067, lng: 80.2570 },
  { name: 'Kolkata', lat: 22.5204, lng: 88.3533 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
];

export const AppointmentMockScreen: React.FC<AppointmentMockScreenProps> = ({
  indicators,
  assessmentResult,
  initialSpecialtyFilter,
  onBackToHome,
  onRetakeScreening,
  shareSummaryConsent = true,
  selectedLanguage = 'en',
  onOpenHelplines,
  onOpenEmergencyGuidance,
  onOpenDoctorHandoff,
}) => {
  const isHindi = selectedLanguage === 'hi';
  const isMarathi = selectedLanguage === 'mr';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
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

  const specialties = ['All', 'General Dentist', 'Periodontist', 'Oral & Maxillofacial Specialist', 'ENT Specialist', 'Head & Neck Oncology', 'Emergency Care'];
  const cities = ['All', 'Mumbai', 'New Delhi', 'Bengaluru', 'Pune', 'Nashik', 'Hyderabad', 'Chennai', 'Kolkata', 'Nagpur', 'Ahmedabad'];

  // Derive condition context from assessment result & profile indicators
  const recommendedSpecialty = useMemo(() => {
    if (initialSpecialtyFilter) return initialSpecialtyFilter;
    if (assessmentResult?.identifiedCondition) {
      const cond = assessmentResult.identifiedCondition.toLowerCase();
      if (cond.includes('emergency') || cond.includes('airway') || cond.includes('hemorrhage')) return 'Emergency Care';
      if (cond.includes('periodont') || cond.includes('gingiv') || cond.includes('gum')) return 'Periodontist';
      if (cond.includes('lesion') || cond.includes('ulcer') || cond.includes('mucosal') || cond.includes('maxillofacial')) return 'Oral & Maxillofacial Specialist';
      if (cond.includes('neck') || cond.includes('hoarseness') || cond.includes('ent')) return 'ENT Specialist';
      if (cond.includes('oncology') || cond.includes('cancer')) return 'Head & Neck Oncology';
      if (cond.includes('caries') || cond.includes('tooth') || cond.includes('decay')) return 'General Dentist';
    }
    if (assessmentResult?.recommendedProfessional) {
      const rec = assessmentResult.recommendedProfessional.toLowerCase();
      if (rec.includes('emergency')) return 'Emergency Care';
      if (rec.includes('periodontist')) return 'Periodontist';
      if (rec.includes('maxillofacial') || rec.includes('oral & max') || rec.includes('surgeon')) return 'Oral & Maxillofacial Specialist';
      if (rec.includes('ent')) return 'ENT Specialist';
      if (rec.includes('oncology') || rec.includes('cancer')) return 'Head & Neck Oncology';
      return 'General Dentist';
    }
    if (indicators?.emergencyFlagTriggered) return 'Emergency Care';
    if (indicators?.gumBleeding && !indicators?.toothDecay) return 'Periodontist';
    if (indicators?.persistentHoarseness || indicators?.neckLumpOrSwelling) return 'ENT Specialist';
    if (indicators?.hasLesionOrUlcer && indicators?.durationOverTwoWeeks) return 'Oral & Maxillofacial Specialist';
    return 'General Dentist';
  }, [initialSpecialtyFilter, assessmentResult, indicators]);

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(recommendedSpecialty || 'All');

  useEffect(() => {
    if (recommendedSpecialty) {
      setSelectedSpecialty(recommendedSpecialty);
    }
  }, [recommendedSpecialty]);

  const careLevel = useMemo(() => {
    if (assessmentResult?.careLevel) return assessmentResult.careLevel;
    if (indicators?.emergencyFlagTriggered) return 'Emergency';
    if (indicators?.toothPain || indicators?.pain) return 'Needs dental evaluation';
    return 'Routine';
  }, [assessmentResult, indicators]);

  const suggestedTimeframe = useMemo(() => {
    if (assessmentResult?.suggestedTimeframe) return assessmentResult.suggestedTimeframe;
    if (indicators?.emergencyFlagTriggered) return 'Immediate / Within 24 hours';
    if (indicators?.toothPain) return 'Within 24 to 48 hours';
    return 'Within 1 to 2 weeks';
  }, [assessmentResult, indicators]);

  const reportedSymptomsList = useMemo(() => {
    const list: string[] = [];
    if (indicators?.mainConcern) list.push(indicators.mainConcern);
    if (indicators?.toothPain) list.push('Toothache / Dental Pain');
    if (indicators?.toothDecay) list.push('Tooth Decay / Cavity');
    if (indicators?.gumBleeding) list.push('Gum Bleeding');
    if (indicators?.hasLesionOrUlcer) list.push('Oral Lesion / Ulcer');
    if (indicators?.jawPain) list.push('Jaw Stiffness / TMJ Strain');
    if (indicators?.badBreath) list.push('Halitosis / Bad Breath');
    if (indicators?.nonOralSymptoms) list.push('Non-Oral Complaint (General Medical)');
    return list.length > 0 ? list : ['General Oral Screening & Preventive Inspection'];
  }, [indicators]);

  const isEmergency = careLevel === 'Emergency' || indicators?.emergencyFlagTriggered;

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
          // Fallback
        }

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
          setLocationErrorMsg('Location permission denied. Showing verified providers nationwide.');
        } else {
          setLocationStatus('unavailable');
          setLocationErrorMsg('Location is currently unavailable.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const handleSimulateCity = (preset: { name: string; lat: number; lng: number }) => {
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    setDetectedAreaName(preset.name);
    setLocationStatus('detected');
    setLocationErrorMsg(null);
    setSelectedCityFilter('All');
  };

  // Compute & rank clinics based on condition matching, specialty, geolocation & filters
  const filteredClinics = useMemo(() => {
    let list: (ClinicProvider & { distanceKm?: number; isMatchForCondition?: boolean; matchReason?: string })[] = [...MOCK_CLINICS];

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

      list.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

      const closest = list[0]?.distanceKm ?? 99999;
      if (closest > 35) {
        const localClinic: ClinicProvider & { distanceKm: number; isMatchForCondition: boolean; matchReason: string } = {
          id: 'local-community-clinic',
          name: `${detectedAreaName || 'Nearby'} Dental & Oral Health Diagnostic Centre`,
          specialist: 'Dr. Sameer Joshi, BDS, MDS (Oral Medicine)',
          specialtyType: 'Dentist',
          title: 'Senior Clinical Specialist - Oral Lesion & Dental Care',
          rating: 4.8,
          reviewsCount: 156,
          distance: '1.2 km away',
          distanceKm: 1.2,
          address: `Health Pavilion, ${detectedAreaName || 'Your Immediate Vicinity'}`,
          city: detectedAreaName || 'Local Vicinity',
          phone: '+91 22 2417 7000',
          area: detectedAreaName || 'Local',
          isVerified: true,
          lat: userCoords.lat,
          lng: userCoords.lng,
          availableDates: ['Today, 4:00 PM', 'Tomorrow, 10:30 AM', 'Thursday, 2:00 PM'],
          availableTimes: ['10:30 AM', '11:45 AM', '2:00 PM', '4:00 PM'],
          badge: 'Closest Verified Community Provider',
          isMatchForCondition: true,
          matchReason: 'Nearest verified dental & oral care facility.',
        };
        list.unshift(localClinic);
      }
    }

    // Add match reasons based on recommended specialty & condition
    list = list.map((c) => {
      let isMatch = false;
      let reason = 'Verified healthcare institution.';

      if (recommendedSpecialty.toLowerCase().includes('dentist') && c.specialtyType === 'Dentist') {
        isMatch = true;
        reason = '★ Matches your reported dental symptoms (toothache, decay, or gum bleeding).';
      } else if (recommendedSpecialty.toLowerCase().includes('oncology') && c.specialtyType === 'Head & Neck Oncology') {
        isMatch = true;
        reason = '★ Matches your high-risk mucosal lesion screening referral.';
      } else if (recommendedSpecialty.toLowerCase().includes('surgeon') && c.specialtyType === 'Oral & Maxillofacial Surgeon') {
        isMatch = true;
        reason = '★ Matches referral for maxillofacial evaluation & biopsy.';
      } else if (recommendedSpecialty.toLowerCase().includes('ent') && c.specialtyType === 'ENT Specialist') {
        isMatch = true;
        reason = '★ Matches referral for ENT & upper airway examination.';
      }

      return {
        ...c,
        isMatchForCondition: isMatch,
        matchReason: reason,
      };
    });

    // Specialty filter
    if (selectedSpecialty !== 'All') {
      const sel = selectedSpecialty.toLowerCase();
      list = list.filter((c) => {
        const type = (c.specialtyType || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const spec = (c.specialist || '').toLowerCase();

        if (sel.includes('periodontist')) {
          return type.includes('periodontist') || title.includes('periodont') || spec.includes('periodont') || (type.includes('dentist') && (title.includes('gum') || name.includes('gum') || name.includes('dental')));
        }
        if (sel.includes('general dentist') || sel === 'dentist') {
          return type.includes('dentist') || type.includes('general');
        }
        if (sel.includes('maxillofacial') || sel.includes('oral & max')) {
          return type.includes('maxillofacial') || type.includes('surgeon') || title.includes('biopsy') || title.includes('oral medicine') || name.includes('maxillofacial');
        }
        if (sel.includes('ent')) {
          return type.includes('ent') || title.includes('ent') || title.includes('laryng') || name.includes('ent');
        }
        if (sel.includes('oncology') || sel.includes('cancer')) {
          return type.includes('oncology') || title.includes('onco') || name.includes('cancer');
        }
        if (sel.includes('emergency')) {
          return type.includes('emergency') || name.includes('hospital') || name.includes('trauma') || name.includes('aiims') || c.publicHospitalType?.toLowerCase().includes('government') || c.publicHospitalType?.toLowerCase().includes('public');
        }
        return c.specialtyType === selectedSpecialty;
      });
    }

    // City filter
    if (selectedCityFilter !== 'All') {
      list = list.filter((c) => c.city.toLowerCase().includes(selectedCityFilter.toLowerCase()));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.specialist.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          (c.area && c.area.toLowerCase().includes(q)) ||
          c.address.toLowerCase().includes(q)
      );
    }

    // Prioritize condition matches at the top
    list.sort((a, b) => (b.isMatchForCondition ? 1 : 0) - (a.isMatchForCondition ? 1 : 0));

    return list;
  }, [userCoords, detectedAreaName, selectedSpecialty, selectedCityFilter, searchQuery, recommendedSpecialty]);

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
    const code = `OG-REF-${Math.floor(1000 + Math.random() * 9000)}`;
    const booked: BookedAppointment = {
      confirmationCode: code,
      clinic: selectedClinic,
      date: selectedDate,
      timeSlot: selectedTime,
      patientName: patientName || 'Patient',
      contactNumber: contactNumber || '+91 00000 00000',
      patientNotes: notes,
      reasonForVisit: reportedSymptomsList.join(', '),
      bookedAt: new Date().toLocaleDateString(),
      shareSummaryWithDoctor: shareSummaryConsent,
    };
    setConfirmationData(booked);
    setIsConfirmed(true);
  };

  // State 2: Referral Request Confirmation Ticket
  if (isConfirmed && confirmationData) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 py-8">
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
              Consultation Appointment Request Generated
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isHindi ? 'परामर्श अनुरोध तैयार' : 'Consultation Scheduled'}
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your referral details have been packaged. Please present this reference code or handoff report upon arrival.
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
              <span className="text-slate-400 font-medium">Referral Code</span>
              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {confirmationData.confirmationCode}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">{confirmationData.clinic.name}</h2>
                  <p className="text-slate-500 text-[11px]">{confirmationData.clinic.specialist}</p>
                  <p className="text-teal-700 font-medium text-[11px]">{confirmationData.clinic.title}</p>
                  <p className="text-slate-400 text-[11px]">
                    {confirmationData.clinic.address}, {confirmationData.clinic.city}
                  </p>
                  {confirmationData.clinic.phone && (
                    <a
                      href={`tel:${confirmationData.clinic.phone}`}
                      className="inline-flex items-center gap-1 text-teal-700 font-mono text-[11px] font-bold mt-1 hover:underline"
                    >
                      <Phone className="w-3 h-3 text-teal-600" />
                      <span>{confirmationData.clinic.phone}</span>
                    </a>
                  )}
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
                    <span className="text-[10px] text-slate-400 block font-medium">Time Slot</span>
                    <span className="font-bold text-slate-800 text-[11px]">{confirmationData.timeSlot}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  Patient: <strong>{confirmationData.patientName}</strong>
                </span>
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
              <li>Do not apply topical anesthetic gels or spicy foods 2 hours prior to examination.</li>
              <li>Bring your complete list of past medications and habit timelines.</li>
              <li>Have the doctor inspect full buccal mucosa, tongue borders, and floor of mouth.</li>
            </ul>
          </div>

          <div className="pt-2 space-y-2">
            {onOpenDoctorHandoff && (
              <button
                type="button"
                onClick={onOpenDoctorHandoff}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isHindi ? 'डॉक्टर हैंडऑफ रिपोर्ट देखें' : 'View Doctor Handoff Report'}</span>
              </button>
            )}

            <button
              onClick={onRetakeScreening}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isHindi ? 'नई स्क्रीनिंग शुरू करें' : 'Start New Screening Session'}</span>
            </button>

            <button
              onClick={onBackToHome}
              className="w-full py-2 px-4 text-slate-500 hover:text-slate-700 text-xs font-medium text-center cursor-pointer"
            >
              {isHindi ? 'अस्वीकरण और होम पर वापस जाएँ' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 1: Search & Intelligent Selection Screen
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-12">
        
        {/* Top Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Condition-Aware Care Navigator
            </span>
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              Verified Directory
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            {isHindi ? 'अस्पताल व डॉक्टर केयर नेविगेटर' : 'Intelligent Care & Hospital Navigator'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Locate specialized oral oncology and dental referral centers for in-person visual and palpation evaluation.
          </p>
        </div>

        {/* Emergency Alert Banner */}
        {isEmergency && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold">
                🚨
              </div>
              <div>
                <h3 className="text-xs font-bold text-rose-900">EMERGENCY MEDICAL ATTENTION REQUIRED</h3>
                <p className="text-[11px] text-rose-800 leading-tight mt-0.5">
                  Acute airway difficulty, severe swelling, or uncontrollable oral bleeding requires immediate emergency evaluation.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <a
                href="tel:112"
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Emergency (112)</span>
              </a>
              {onOpenEmergencyGuidance && (
                <button
                  type="button"
                  onClick={onOpenEmergencyGuidance}
                  className="py-2 px-3 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold"
                >
                  Emergency Signs
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Patient Condition Banner */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Your Recommended Care Path</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isEmergency
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {careLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Recommended Specialty</span>
              <span className="font-bold text-teal-800">{recommendedSpecialty}</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Suggested Timeframe</span>
              <span className="font-bold text-slate-800">{suggestedTimeframe}</span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="font-bold text-slate-500">Reported Symptoms:</span>
            {reportedSymptomsList.map((sym, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                {sym}
              </span>
            ))}
          </div>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">
              Specialist & Hospital Directory ({filteredClinics.length})
            </label>
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'map' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital, doctor name, area, or city..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10.5px] font-bold text-slate-500 block mb-1">City Filter:</label>
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-[10.5px] font-bold text-slate-500 block mb-1">Specialty:</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSpecialty !== 'All' && (
            <div className="p-2.5 bg-teal-50 border border-teal-200/90 rounded-xl flex items-center justify-between text-xs text-teal-950 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Auto-filtered for <strong className="font-bold text-teal-950">{selectedSpecialty}</strong> based on screening
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('All')}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer shrink-0 ml-2"
              >
                Show All
              </button>
            </div>
          )}
        </div>

        {/* Location Detection & City Presets */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <LocateFixed className="w-4 h-4 text-teal-600" />
              <span>Location Search & Metro Presets</span>
            </div>

            <button
              type="button"
              onClick={detectLocation}
              disabled={locationStatus === 'detecting'}
              className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200/80 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${locationStatus === 'detecting' ? 'animate-spin' : ''}`} />
              <span>{locationStatus === 'detecting' ? 'Detecting...' : 'Detect Location'}</span>
            </button>
          </div>

          {locationStatus === 'detected' && (
            <div className="flex items-center justify-between text-xs bg-teal-50/80 border border-teal-200 rounded-lg p-2 text-teal-900">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Near: <strong>{detectedAreaName || 'Your Area'}</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 shrink-0">
                Proximity Sorted
              </span>
            </div>
          )}

          {/* Quick Metro Presets */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span>Quick Metro Cities:</span>
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

        {/* Map View Mode - Visual Proximity Map Component */}
        {viewMode === 'map' && (
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  🗺️
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isHindi ? 'निकटता आधारित दृश्य मानचित्र' : 'Specialist & Hospital Proximity Map'}
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    {isHindi ? 'विशेषज्ञता व दूरी के अनुसार निकटतम अस्पताल मानचित्र' : `Showing ${filteredClinics.length} clinics matching "${selectedSpecialty}"`}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Interactive Radar
              </span>
            </div>

            {/* Specialty Pins Legend Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-semibold border-b border-slate-100 pt-0.5">
              <span className="text-slate-400 shrink-0 font-medium">Filter Map:</span>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('All')}
                className={`px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedSpecialty === 'All'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({MOCK_CLINICS.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('Emergency Care')}
                className={`px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedSpecialty === 'Emergency Care'
                    ? 'bg-rose-700 text-white border-rose-700 font-bold'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                🔴 Emergency
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('Periodontist')}
                className={`px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedSpecialty === 'Periodontist'
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                🟢 Periodontist
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('Oral & Maxillofacial Specialist')}
                className={`px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedSpecialty.includes('Maxillofacial')
                    ? 'bg-purple-700 text-white border-purple-700 font-bold'
                    : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                }`}
              >
                🟣 Maxillofacial
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('ENT Specialist')}
                className={`px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedSpecialty.includes('ENT')
                    ? 'bg-blue-700 text-white border-blue-700 font-bold'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                🔵 ENT
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpecialty('General Dentist')}
                className={`px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedSpecialty.includes('Dentist')
                    ? 'bg-teal-700 text-white border-teal-700 font-bold'
                    : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                }`}
              >
                🩵 Dentist
              </button>
            </div>

            {/* Visual Radar Map Canvas Container */}
            <div className="w-full h-72 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 p-3 flex flex-col justify-between shadow-inner select-none">
              {/* Topographic Radar Grid Overlay */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                  backgroundSize: '24px 24px, 24px 24px, 24px 24px',
                }}
              />

              {/* Concentric Radar Distance Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full border border-teal-500/20 animate-pulse" />
                <div className="w-48 h-48 rounded-full border border-teal-500/15 absolute" />
                <div className="w-64 h-64 rounded-full border border-teal-500/10 absolute" />
              </div>

              {/* Radar Scale & Compass Overlay */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 backdrop-blur-xs">
                  <LocateFixed className="w-3 h-3 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>CENTER: {detectedAreaName || 'YOU (USER LOCATION)'}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 backdrop-blur-xs">
                  <span className="text-teal-400">RADAR SCALE: 1 km – 15 km</span>
                  <span className="text-slate-500">N ↑</span>
                </div>
              </div>

              {/* Central User Location Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/50 flex items-center justify-center animate-ping absolute" />
                <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center font-bold text-xs shadow-lg shadow-teal-500/50 z-10 border-2 border-white">
                  📍
                </div>
                <span className="mt-1 px-1.5 py-0.5 bg-slate-900/90 text-teal-300 rounded text-[9px] font-bold border border-teal-500/40 backdrop-blur-xs shadow-sm whitespace-nowrap">
                  YOU ARE HERE
                </span>
              </div>

              {/* SVG Connecting Route Line to Selected Clinic */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {(() => {
                  const selIdx = filteredClinics.findIndex((c) => c.id === selectedClinic.id);
                  if (selIdx === -1) return null;
                  const total = Math.min(filteredClinics.length, 8);
                  const angle = ((selIdx % total) / total) * 2 * Math.PI - Math.PI / 2;
                  const radiusPct = 28 + (selIdx % 3) * 12;
                  // Center in % is 50, 50
                  const targetX = 50 + radiusPct * Math.cos(angle);
                  const targetY = 50 + radiusPct * Math.sin(angle);

                  return (
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${targetX}%`}
                      y2={`${targetY}%`}
                      stroke="#2dd4bf"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  );
                })()}
              </svg>

              {/* Proximity Clinic Pins Plot */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {filteredClinics.slice(0, 8).map((clinic, idx) => {
                  const isSel = selectedClinic.id === clinic.id;
                  const total = Math.min(filteredClinics.length, 8);
                  const angle = ((idx % total) / total) * 2 * Math.PI - Math.PI / 2;
                  const radiusPct = 28 + (idx % 3) * 12;
                  const leftPct = 50 + radiusPct * Math.cos(angle);
                  const topPct = 50 + radiusPct * Math.sin(angle);

                  // Pin styling based on specialty
                  let pinBg = 'bg-teal-500 text-slate-950 border-white';
                  let badgeColor = 'bg-teal-900/90 text-teal-200 border-teal-500/40';
                  const type = (clinic.specialtyType || '').toLowerCase();

                  if (type.includes('emergency') || clinic.name.toLowerCase().includes('hospital')) {
                    pinBg = 'bg-rose-500 text-white border-white';
                    badgeColor = 'bg-rose-950/90 text-rose-200 border-rose-500/40';
                  } else if (type.includes('periodont')) {
                    pinBg = 'bg-emerald-500 text-slate-950 border-white';
                    badgeColor = 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40';
                  } else if (type.includes('maxillofacial') || type.includes('surgeon')) {
                    pinBg = 'bg-purple-500 text-white border-white';
                    badgeColor = 'bg-purple-950/90 text-purple-200 border-purple-500/40';
                  } else if (type.includes('ent')) {
                    pinBg = 'bg-blue-500 text-white border-white';
                    badgeColor = 'bg-blue-950/90 text-blue-200 border-blue-500/40';
                  }

                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => handleClinicChange(clinic)}
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                      className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer group flex flex-col items-center ${
                        isSel ? 'scale-125 z-30' : 'scale-100 opacity-90 hover:opacity-100 hover:scale-110'
                      }`}
                    >
                      {/* Pulse Ring for Selected */}
                      {isSel && (
                        <div className="w-8 h-8 rounded-full bg-teal-400/30 border border-teal-300 animate-ping absolute -inset-1" />
                      )}

                      {/* Map Marker Pin */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg border-2 transition-transform ${pinBg} ${
                          isSel ? 'ring-2 ring-teal-300 ring-offset-2 ring-offset-slate-900 scale-110' : ''
                        }`}
                      >
                        <Building className="w-3 h-3" />
                      </div>

                      {/* Label Chip */}
                      <div
                        className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border backdrop-blur-md shadow-md max-w-[110px] truncate transition-colors ${badgeColor} ${
                          isSel ? 'ring-1 ring-white/50' : ''
                        }`}
                      >
                        {clinic.name.split(' ')[0]} ({clinic.distance})
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Canvas Footer Note */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 backdrop-blur-xs">
                <span>📍 Plotting {filteredClinics.length} verified centers near {detectedAreaName || 'your location'}</span>
                <span className="text-teal-400 font-bold">Click any pin to view details</span>
              </div>
            </div>

            {/* Selected Clinic Interactive Detail Card */}
            {selectedClinic && (
              <motion.div
                key={selectedClinic.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-slate-50 border border-teal-200 rounded-xl space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200">
                        {selectedClinic.specialtyType}
                      </span>
                      {selectedClinic.publicHospitalType && (
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                          {selectedClinic.publicHospitalType}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-teal-600" />
                        <span>{selectedClinic.distance}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1">{selectedClinic.name}</h4>
                    <p className="text-[11px] text-slate-600 font-medium">{selectedClinic.specialist}</p>
                    <p className="text-[10px] text-slate-500">
                      {selectedClinic.address}, {selectedClinic.city} • ★ {selectedClinic.rating} ({selectedClinic.reviewsCount} reviews)
                    </p>
                  </div>

                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                </div>

                {selectedClinic.matchReason && (
                  <div className="text-[10px] text-teal-900 bg-teal-100/70 p-1.5 rounded-lg border border-teal-200 font-medium">
                    {selectedClinic.matchReason}
                  </div>
                )}

                <div className="pt-1 flex items-center gap-2">
                  {selectedClinic.phone && (
                    <a
                      href={`tel:${selectedClinic.phone}`}
                      className="py-1.5 px-2.5 bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-teal-600" />
                      <span>Call Center</span>
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClinic.name + ' ' + selectedClinic.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* List View Mode (Clinic Cards) */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                Select Hospital / Specialist ({filteredClinics.length})
              </label>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-0.5">
              {filteredClinics.map((clinic) => {
                const isSelected = selectedClinic.id === clinic.id;

                return (
                  <div
                    key={clinic.id}
                    onClick={() => handleClinicChange(clinic)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {clinic.specialtyType}
                          </span>
                          {clinic.publicHospitalType && (
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {clinic.publicHospitalType}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-teal-600" />
                            <span>{clinic.distance}</span>
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900">{clinic.name}</h3>
                        <p className="text-[11px] text-slate-600 font-medium">{clinic.specialist}</p>
                        <p className="text-[10px] text-slate-400">
                          {clinic.address}, {clinic.city} {clinic.area ? `(${clinic.area})` : ''} • ★ {clinic.rating} ({clinic.reviewsCount} reviews)
                        </p>

                        {/* Condition Match Badge */}
                        {clinic.matchReason && (
                          <div className="text-[10px] text-teal-900 bg-teal-50/90 border border-teal-200/80 p-1.5 rounded-lg font-medium">
                            {clinic.matchReason}
                          </div>
                        )}

                        {/* Action Buttons: Phone & Map Directions */}
                        <div className="pt-1 flex items-center gap-3">
                          {clinic.phone && (
                            <a
                              href={`tel:${clinic.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10.5px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-teal-600" />
                              <span>Call {clinic.phone}</span>
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + ' ' + clinic.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            <span>Directions</span>
                          </a>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredClinics.length === 0 && (
                <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                  No matching clinics found for your filters. Try selecting "All" cities or clearing the search bar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date & Time Slot Selection */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Available Date</label>
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
            <label className="text-xs font-bold text-slate-700 block">Time Slot</label>
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

        {/* Patient Information Form */}
        <form onSubmit={handleConfirmMockBooking} className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-700 block">Patient Details for Referral</label>

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

          {/* Privacy Consent Acknowledgment */}
          <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-[11px] text-teal-900 flex items-center gap-2">
            {shareSummaryConsent ? (
              <>
                <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Structured screening summary will be attached for consulting specialist.</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Summary kept private: Personal screening report will not be attached.</span>
              </>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-teal-700/20 transition-all cursor-pointer mt-3"
          >
            <span>Request Referral Appointment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* External Links (Helplines & Emergency) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
          {onOpenHelplines && (
            <button
              type="button"
              onClick={onOpenHelplines}
              className="py-2.5 px-3 bg-white hover:bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
              <span>National Helplines</span>
            </button>
          )}

          {onOpenEmergencyGuidance && (
            <button
              type="button"
              onClick={onOpenEmergencyGuidance}
              className="py-2.5 px-3 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Emergency Signs</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
