import React, { useState } from 'react';
import {
  MapPin,
  Check,
  RotateCcw,
  X,
  HelpCircle,
  Info,
  Shield,
  Plus,
  Trash2,
} from 'lucide-react';
import { ORAL_REGIONS } from '../data/oralAnatomy';
import { OralRegion, MouthMapLocationItem, ClinicalConcern } from '../types';

export interface InteractiveMouthMapProps {
  confirmedLocation?: string | null;
  confirmedRegionId?: string | null;
  confirmedLocations?: MouthMapLocationItem[];
  concerns?: ClinicalConcern[];
  activeConcernId?: string | null;
  onSelectConcern?: (concernId: string) => void;
  onConfirmLocation?: (region: OralRegion) => void;
  onConfirmMultipleLocations?: (regions: OralRegion[], targetConcernId?: string | null) => void;
  onClearLocation?: () => void;
  onCancel: () => void;
  onClose?: () => void;
  language?: 'en' | 'hi' | 'hinglish';
  isCompact?: boolean;
}

const REGION_ORDER: string[] = [
  'lip_upper',
  'gingiva_upper',
  'hard_palate',
  'soft_palate',
  'hard_soft_palate',
  'tonsil_oropharynx',
  'buccal_mucosa_left',
  'lateral_tongue_left',
  'tongue_dorsum',
  'lateral_tongue_right',
  'buccal_mucosa_right',
  'floor_of_mouth',
  'gingiva_lower',
  'lip_lower',
  'other_unspecified',
];

export const InteractiveMouthMap: React.FC<InteractiveMouthMapProps> = ({
  confirmedRegionId,
  confirmedLocations = [],
  concerns = [],
  activeConcernId,
  onSelectConcern,
  onConfirmLocation,
  onConfirmMultipleLocations,
  onClearLocation,
  onCancel,
  onClose,
  language = 'en',
  isCompact = false,
}) => {
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(
    activeConcernId || (concerns.length > 0 ? concerns[0].id : null)
  );

  // Requirement: No random/default selection.
  // Initialize draft with previously confirmed locations if any, otherwise empty array.
  const initialSelectedIds = React.useMemo(() => {
    if (confirmedLocations && confirmedLocations.length > 0) {
      return confirmedLocations.map((l) => l.id).filter((id) => Boolean(ORAL_REGIONS[id]));
    }
    if (confirmedRegionId && ORAL_REGIONS[confirmedRegionId]) {
      return [confirmedRegionId];
    }
    return [];
  }, [confirmedLocations, confirmedRegionId]);

  const [draftRegionIds, setDraftRegionIds] = useState<string[]>(initialSelectedIds);
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'tongue' | 'cheek' | 'gums' | 'palate' | 'throat'>('all');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  const selectedRegions: OralRegion[] = draftRegionIds
    .map((id) => ORAL_REGIONS[id])
    .filter((reg): reg is OralRegion => Boolean(reg));

  const isSelected = (regionId: string) => draftRegionIds.includes(regionId);

  // Switch active clinical concern (for multi-concern screening)
  const handleSwitchConcern = (concernId: string) => {
    setSelectedConcernId(concernId);
    if (onSelectConcern) onSelectConcern(concernId);
    const concern = concerns.find((c) => c.id === concernId);
    if (concern && concern.locations && concern.locations.length > 0) {
      const regionIds = concern.locations
        .map((locName) => {
          const found = Object.values(ORAL_REGIONS).find(
            (r) => r.name.toLowerCase() === locName.toLowerCase() || locName.toLowerCase().includes(r.name.toLowerCase())
          );
          return found ? found.id : null;
        })
        .filter((id): id is string => Boolean(id));
      if (regionIds.length > 0) {
        setDraftRegionIds(regionIds);
        setLiveAnnouncement(`Viewing locations for ${concern.description}`);
        return;
      }
    }
  };

  // Toggle or add region
  const handleToggleRegion = (regionId: string) => {
    if (regionId === 'unknown_location') {
      // If choosing "not sure", it sets solely unknown
      setDraftRegionIds(['unknown_location']);
      setLiveAnnouncement('Selected Not Sure / Unspecified location.');
      return;
    }

    setDraftRegionIds((prev) => {
      // Filter out unknown if selecting a specific location
      const withoutUnknown = prev.filter((id) => id !== 'unknown_location');
      if (withoutUnknown.includes(regionId)) {
        // Remove individual selected location
        const next = withoutUnknown.filter((id) => id !== regionId);
        const reg = ORAL_REGIONS[regionId];
        setLiveAnnouncement(`Removed ${reg?.name || regionId}.`);
        return next;
      } else {
        // Add location
        const next = [...withoutUnknown, regionId];
        const reg = ORAL_REGIONS[regionId];
        setLiveAnnouncement(`Added ${reg?.name || regionId} to selection (${next.length} selected).`);
        return next;
      }
    });
  };

  // Remove single selected location
  const handleRemoveRegion = (regionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDraftRegionIds((prev) => prev.filter((id) => id !== regionId));
    const reg = ORAL_REGIONS[regionId];
    setLiveAnnouncement(`Removed ${reg?.name || regionId}.`);
  };

  // Clear / Reset all selections
  const handleClearSelection = () => {
    setDraftRegionIds([]);
    setLiveAnnouncement('All locations cleared. Select an anatomical area where you noticed the symptom.');
    if (onClearLocation) {
      onClearLocation();
    }
  };

  // Confirm Location(s)
  const handleConfirm = () => {
    if (draftRegionIds.length === 0) return;

    if (onConfirmMultipleLocations) {
      onConfirmMultipleLocations(selectedRegions, selectedConcernId);
    } else if (onConfirmLocation && selectedRegions.length > 0) {
      onConfirmLocation(selectedRegions[0]);
    }
  };

  // Cancel: Discards unconfirmed changes and restores previously confirmed state
  const handleCancel = () => {
    setDraftRegionIds(initialSelectedIds);
    onCancel();
  };

  // Dedicated "Not sure / I can't identify exact area"
  const handleSelectNotSure = () => {
    handleToggleRegion('unknown_location');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<SVGGElement>, regionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleRegion(regionId);
      return;
    }

    const currentIndex = REGION_ORDER.indexOf(regionId);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % REGION_ORDER.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + REGION_ORDER.length) % REGION_ORDER.length;
    }

    if (nextIndex !== -1) {
      const nextId = REGION_ORDER[nextIndex];
      setFocusedRegionId(nextId);
      const nextEl = document.getElementById(`mouth-region-${nextId}`);
      if (nextEl) {
        nextEl.focus();
      }
    }
  };

  // Clean clinical fills
  const getFillColor = (regionId: string) => {
    if (isSelected(regionId)) {
      return '#ccfbf1'; // Crisp medical teal-100
    }
    if (hoveredRegionId === regionId) {
      return '#e0f2fe'; // Sky-100 hover indicator
    }
    if (focusedRegionId === regionId) {
      return '#f0fdf4';
    }

    switch (regionId) {
      case 'lip_upper':
      case 'lip_lower':
        return '#fecdd3';
      case 'gingiva_upper':
      case 'gingiva_lower':
        return '#fce7f3';
      case 'hard_palate':
      case 'hard_soft_palate':
        return '#ffedd5';
      case 'soft_palate':
        return '#fed7aa';
      case 'tonsil_oropharynx':
        return '#ffe4e6';
      case 'buccal_mucosa_left':
      case 'buccal_mucosa_right':
        return '#fff1f2';
      case 'tongue_dorsum':
        return '#fecdd3';
      case 'lateral_tongue_left':
      case 'lateral_tongue_right':
        return '#fda4af';
      case 'floor_of_mouth':
        return '#fee2e2';
      default:
        return '#f8fafc';
    }
  };

  const getStrokeColor = (regionId: string) => {
    if (isSelected(regionId)) {
      return '#0f766e'; // Teal-700 solid clinical border
    }
    if (hoveredRegionId === regionId) {
      return '#0284c7'; // Sky-600
    }
    if (focusedRegionId === regionId) {
      return '#2563eb'; // Blue-600 focus ring
    }
    return '#94a3b8'; // Clinical slate-400 boundary
  };

  const getStrokeWidth = (regionId: string) => {
    if (isSelected(regionId)) return 2.6;
    if (hoveredRegionId === regionId) return 2.0;
    if (focusedRegionId === regionId) return 2.2;
    return 1.2;
  };

  // Filter chips for structured anatomical browsing
  const filteredChips = Object.values(ORAL_REGIONS).filter((reg) => {
    if (reg.id === 'unknown_location') return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'tongue') return reg.id.includes('tongue') || reg.id.includes('floor');
    if (activeCategory === 'cheek') return reg.id.includes('buccal') || reg.id.includes('lip');
    if (activeCategory === 'gums') return reg.id.includes('gingiva');
    if (activeCategory === 'palate') return reg.id.includes('palate');
    if (activeCategory === 'throat') return reg.id.includes('tonsil') || reg.id.includes('other');
    return true;
  });

  return (
    <div
      id="oralguard-interactive-mouth-map"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all"
    >
      {/* Top Clinical Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-white flex items-center gap-2">
              <span>{isHindi ? 'मुँह का शारीरिक नक़्शा (Mouth Map)' : 'Oral Anatomy Location Selector'}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                Multi-Location
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isHindi
                ? 'अपने लक्षण या तकलीफ़ का स्थान बताने के लिए क्षेत्र पर टैप करें (एक या अधिक)'
                : isHinglish
                ? 'Apne symptom ki jagah batane ke liye area tap karein (1 ya multiple)'
                : 'Select one or more anatomical areas where you noticed symptoms'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCancel}
            id="btn-mouth-map-close"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label={isHindi ? 'रद्द करें और बंद करें' : 'Cancel and close'}
            title={isHindi ? 'रद्द करें' : 'Cancel'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multi-Concern Selection Bar */}
      {concerns && concerns.length > 1 && (
        <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-300 font-medium shrink-0">
            {isHindi ? 'स्थान संबद्ध करें:' : 'Associate location with:'}
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {concerns.map((c) => {
              const isSelectedConcern = (selectedConcernId || concerns[0].id) === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSwitchConcern(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelectedConcern
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  {c.description || c.type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen Reader Live Region */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Main Grid: SVG Map + Clinical Controls */}
      <div className={`p-4 grid ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'} gap-4 items-start bg-slate-50/50`}>
        {/* Left/Top: Professional Anatomical Medical SVG */}
        <div className={`${isCompact ? 'w-full' : 'md:col-span-6'} flex flex-col items-center`}>
          {/* Orientation indicators */}
          <div className="w-full max-w-[340px] flex items-center justify-between px-2 pb-1 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            <span>Right (Patient's Right)</span>
            <span className="text-slate-300">Upper / Maxilla</span>
            <span>Left (Patient's Left)</span>
          </div>

          <div className="w-full max-w-[340px] aspect-[4/3.8] relative bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-xs overflow-hidden">
            <svg
              viewBox="0 0 400 380"
              role="group"
              aria-label="Oral Cavity Anatomy Map"
              className="w-full h-full max-h-[310px] select-none focus:outline-none"
              style={{ touchAction: 'manipulation' }}
            >
              <defs>
                <linearGradient id="toothEnamelClean" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="85%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>

              {/* Background Oral Cavity Soft Bed */}
              <ellipse cx="200" cy="188" rx="154" ry="144" fill="#fff5f5" stroke="#fecdd3" strokeWidth="1.5" />

              {/* 1. Tonsils & Posterior Pharyngeal Wall (Oropharynx) */}
              <g
                id="mouth-region-tonsil_oropharynx"
                role="button"
                tabIndex={0}
                aria-label="Tonsillar Region and Back of Throat"
                aria-pressed={isSelected('tonsil_oropharynx')}
                onClick={() => handleToggleRegion('tonsil_oropharynx')}
                onKeyDown={(e) => handleKeyDown(e, 'tonsil_oropharynx')}
                onFocus={() => setFocusedRegionId('tonsil_oropharynx')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('tonsil_oropharynx')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 136 138 C 152 112, 248 112, 264 138 C 272 165, 260 192, 235 186 C 218 182, 212 198, 200 198 C 188 198, 182 182, 165 186 C 140 192, 128 165, 136 138 Z"
                  fill={getFillColor('tonsil_oropharynx')}
                  stroke={getStrokeColor('tonsil_oropharynx')}
                  strokeWidth={getStrokeWidth('tonsil_oropharynx')}
                />
                <circle cx="152" cy="155" r="7" fill={isSelected('tonsil_oropharynx') ? '#0f766e' : '#fda4af'} />
                <circle cx="248" cy="155" r="7" fill={isSelected('tonsil_oropharynx') ? '#0f766e' : '#fda4af'} />
                <path
                  d="M 195 168 C 195 162, 205 162, 205 168 C 205 190, 195 190, 195 168 Z"
                  fill={isSelected('tonsil_oropharynx') ? '#0f766e' : '#fb7185'}
                  stroke={isSelected('tonsil_oropharynx') ? '#0d9488' : '#e11d48'}
                  strokeWidth="0.8"
                />
              </g>

              {/* 2a. Hard Palate */}
              <g
                id="mouth-region-hard_palate"
                role="button"
                tabIndex={0}
                aria-label="Hard Palate (Bony Roof of Mouth)"
                aria-pressed={isSelected('hard_palate') || isSelected('hard_soft_palate')}
                onClick={() => handleToggleRegion('hard_palate')}
                onKeyDown={(e) => handleKeyDown(e, 'hard_palate')}
                onFocus={() => setFocusedRegionId('hard_palate')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('hard_palate')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 118 108 C 142 72, 258 72, 282 108 C 258 124, 230 130, 200 130 C 170 130, 142 124, 118 108 Z"
                  fill={getFillColor('hard_palate')}
                  stroke={getStrokeColor('hard_palate')}
                  strokeWidth={getStrokeWidth('hard_palate')}
                />
                <path d="M 160 98 Q 200 106 240 98" stroke="#d97706" strokeWidth="0.9" fill="none" opacity="0.35" />
                <path d="M 172 110 Q 200 117 228 110" stroke="#d97706" strokeWidth="0.9" fill="none" opacity="0.35" />
              </g>

              {/* 2b. Soft Palate */}
              <g
                id="mouth-region-soft_palate"
                role="button"
                tabIndex={0}
                aria-label="Soft Palate (Back Roof of Mouth)"
                aria-pressed={isSelected('soft_palate')}
                onClick={() => handleToggleRegion('soft_palate')}
                onKeyDown={(e) => handleKeyDown(e, 'soft_palate')}
                onFocus={() => setFocusedRegionId('soft_palate')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('soft_palate')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 124 116 C 146 130, 254 130, 276 116 C 266 138, 234 148, 200 148 C 166 148, 134 138, 124 116 Z"
                  fill={getFillColor('soft_palate')}
                  stroke={getStrokeColor('soft_palate')}
                  strokeWidth={getStrokeWidth('soft_palate')}
                />
              </g>

              {/* 3. Upper Gums (Gingiva Upper) & Maxillary Teeth */}
              <g
                id="mouth-region-gingiva_upper"
                role="button"
                tabIndex={0}
                aria-label="Upper Gums and Teeth"
                aria-pressed={isSelected('gingiva_upper')}
                onClick={() => handleToggleRegion('gingiva_upper')}
                onKeyDown={(e) => handleKeyDown(e, 'gingiva_upper')}
                onFocus={() => setFocusedRegionId('gingiva_upper')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('gingiva_upper')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 92 88 C 130 42, 270 42, 308 88 C 278 108, 238 108, 200 108 C 162 108, 122 108, 92 88 Z"
                  fill={getFillColor('gingiva_upper')}
                  stroke={getStrokeColor('gingiva_upper')}
                  strokeWidth={getStrokeWidth('gingiva_upper')}
                />
                <g opacity={isSelected('gingiva_upper') ? 0.45 : 0.95}>
                  <rect x="104" y="80" width="10" height="9" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="116" y="76" width="10" height="10" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="128" y="72" width="10" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="140" y="68" width="10" height="12" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="152" y="65" width="11" height="13" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="165" y="63" width="11" height="14" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="178" y="62" width="10.5" height="14" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="190" y="61" width="9.5" height="14.5" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="200.5" y="61" width="9.5" height="14.5" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="211" y="62" width="10.5" height="14" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="223" y="63" width="11" height="14" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="236" y="65" width="11" height="13" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="249" y="68" width="10" height="12" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="261" y="72" width="10" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="273" y="76" width="10" height="10" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="285" y="80" width="10" height="9" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                </g>
              </g>

              {/* 4. Left Inner Cheek (Buccal Mucosa Left) */}
              <g
                id="mouth-region-buccal_mucosa_left"
                role="button"
                tabIndex={0}
                aria-label="Left Inner Cheek (Buccal Mucosa)"
                aria-pressed={isSelected('buccal_mucosa_left')}
                onClick={() => handleToggleRegion('buccal_mucosa_left')}
                onKeyDown={(e) => handleKeyDown(e, 'buccal_mucosa_left')}
                onFocus={() => setFocusedRegionId('buccal_mucosa_left')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('buccal_mucosa_left')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 52 112 C 78 106, 102 128, 102 170 C 102 216, 78 248, 52 254 C 36 218, 36 144, 52 112 Z"
                  fill={getFillColor('buccal_mucosa_left')}
                  stroke={getStrokeColor('buccal_mucosa_left')}
                  strokeWidth={getStrokeWidth('buccal_mucosa_left')}
                />
                <circle cx="78" cy="155" r="3" fill={isSelected('buccal_mucosa_left') ? '#0f766e' : '#f43f5e'} opacity="0.65" />
              </g>

              {/* 5. Right Inner Cheek (Buccal Mucosa Right) */}
              <g
                id="mouth-region-buccal_mucosa_right"
                role="button"
                tabIndex={0}
                aria-label="Right Inner Cheek (Buccal Mucosa)"
                aria-pressed={isSelected('buccal_mucosa_right')}
                onClick={() => handleToggleRegion('buccal_mucosa_right')}
                onKeyDown={(e) => handleKeyDown(e, 'buccal_mucosa_right')}
                onFocus={() => setFocusedRegionId('buccal_mucosa_right')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('buccal_mucosa_right')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 348 112 C 322 106, 298 128, 298 170 C 298 216, 322 248, 348 254 C 364 218, 364 144, 348 112 Z"
                  fill={getFillColor('buccal_mucosa_right')}
                  stroke={getStrokeColor('buccal_mucosa_right')}
                  strokeWidth={getStrokeWidth('buccal_mucosa_right')}
                />
                <circle cx="322" cy="155" r="3" fill={isSelected('buccal_mucosa_right') ? '#0f766e' : '#f43f5e'} opacity="0.65" />
              </g>

              {/* 6. Floor of Mouth (Under Tongue) */}
              <g
                id="mouth-region-floor_of_mouth"
                role="button"
                tabIndex={0}
                aria-label="Floor of Mouth"
                aria-pressed={isSelected('floor_of_mouth')}
                onClick={() => handleToggleRegion('floor_of_mouth')}
                onKeyDown={(e) => handleKeyDown(e, 'floor_of_mouth')}
                onFocus={() => setFocusedRegionId('floor_of_mouth')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('floor_of_mouth')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 122 256 C 128 232, 150 216, 200 216 C 250 216, 272 232, 278 256 C 268 296, 238 308, 200 308 C 162 308, 132 296, 122 256 Z"
                  fill={getFillColor('floor_of_mouth')}
                  stroke={getStrokeColor('floor_of_mouth')}
                  strokeWidth={getStrokeWidth('floor_of_mouth')}
                />
                <line x1="200" y1="230" x2="200" y2="285" stroke={isSelected('floor_of_mouth') ? '#0f766e' : '#f43f5e'} strokeWidth="1.2" opacity="0.5" />
              </g>

              {/* 7. Tongue Center & Dorsum */}
              <g
                id="mouth-region-tongue_dorsum"
                role="button"
                tabIndex={0}
                aria-label="Tongue Dorsum (Center and Top of Tongue)"
                aria-pressed={isSelected('tongue_dorsum')}
                onClick={() => handleToggleRegion('tongue_dorsum')}
                onKeyDown={(e) => handleKeyDown(e, 'tongue_dorsum')}
                onFocus={() => setFocusedRegionId('tongue_dorsum')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('tongue_dorsum')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 156 190 C 172 178, 228 178, 244 190 C 252 222, 238 270, 200 270 C 162 270, 148 222, 156 190 Z"
                  fill={getFillColor('tongue_dorsum')}
                  stroke={getStrokeColor('tongue_dorsum')}
                  strokeWidth={getStrokeWidth('tongue_dorsum')}
                />
                <line x1="200" y1="192" x2="200" y2="258" stroke={isSelected('tongue_dorsum') ? '#0f766e' : '#f43f5e'} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.6" />
              </g>

              {/* 8. Left Side of Tongue */}
              <g
                id="mouth-region-lateral_tongue_left"
                role="button"
                tabIndex={0}
                aria-label="Left Side of Tongue"
                aria-pressed={isSelected('lateral_tongue_left')}
                onClick={() => handleToggleRegion('lateral_tongue_left')}
                onKeyDown={(e) => handleKeyDown(e, 'lateral_tongue_left')}
                onFocus={() => setFocusedRegionId('lateral_tongue_left')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('lateral_tongue_left')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 136 186 C 154 186, 156 214, 148 256 C 140 250, 126 234, 126 212 C 126 198, 131 188, 136 186 Z"
                  fill={getFillColor('lateral_tongue_left')}
                  stroke={getStrokeColor('lateral_tongue_left')}
                  strokeWidth={getStrokeWidth('lateral_tongue_left')}
                />
                <line x1="134" y1="208" x2="146" y2="210" stroke={isSelected('lateral_tongue_left') ? '#0f766e' : '#be123c'} strokeWidth="1" opacity="0.5" />
              </g>

              {/* 9. Right Side of Tongue */}
              <g
                id="mouth-region-lateral_tongue_right"
                role="button"
                tabIndex={0}
                aria-label="Right Side of Tongue"
                aria-pressed={isSelected('lateral_tongue_right')}
                onClick={() => handleToggleRegion('lateral_tongue_right')}
                onKeyDown={(e) => handleKeyDown(e, 'lateral_tongue_right')}
                onFocus={() => setFocusedRegionId('lateral_tongue_right')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('lateral_tongue_right')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 264 186 C 246 186, 244 214, 252 256 C 260 250, 274 234, 274 212 C 274 198, 269 188, 264 186 Z"
                  fill={getFillColor('lateral_tongue_right')}
                  stroke={getStrokeColor('lateral_tongue_right')}
                  strokeWidth={getStrokeWidth('lateral_tongue_right')}
                />
                <line x1="266" y1="208" x2="254" y2="210" stroke={isSelected('lateral_tongue_right') ? '#0f766e' : '#be123c'} strokeWidth="1" opacity="0.5" />
              </g>

              {/* 10. Lower Gums (Gingiva Lower) */}
              <g
                id="mouth-region-gingiva_lower"
                role="button"
                tabIndex={0}
                aria-label="Lower Gums and Teeth"
                aria-pressed={isSelected('gingiva_lower')}
                onClick={() => handleToggleRegion('gingiva_lower')}
                onKeyDown={(e) => handleKeyDown(e, 'gingiva_lower')}
                onFocus={() => setFocusedRegionId('gingiva_lower')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('gingiva_lower')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 96 268 C 128 318, 272 318, 304 268 C 276 296, 236 308, 200 308 C 164 308, 124 296, 96 268 Z"
                  fill={getFillColor('gingiva_lower')}
                  stroke={getStrokeColor('gingiva_lower')}
                  strokeWidth={getStrokeWidth('gingiva_lower')}
                />
                <g opacity={isSelected('gingiva_lower') ? 0.45 : 0.95}>
                  <rect x="108" y="268" width="9.5" height="9" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="120" y="272" width="10" height="9.5" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="132" y="276" width="10" height="10" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="144" y="279" width="10" height="10.5" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="156" y="282" width="10" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="168" y="284" width="9.5" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="179" y="285" width="9.5" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="190" y="286" width="9" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="201" y="286" width="9" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="211.5" y="285" width="9.5" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="222.5" y="284" width="9.5" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="234" y="282" width="10" height="11" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="246" y="279" width="10" height="10.5" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="258" y="276" width="10" height="10" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="270" y="272" width="10" height="9.5" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="282.5" y="268" width="9.5" height="9" rx="2" fill="url(#toothEnamelClean)" stroke="#cbd5e1" strokeWidth="0.8" />
                </g>
              </g>

              {/* 11. Upper Lip */}
              <g
                id="mouth-region-lip_upper"
                role="button"
                tabIndex={0}
                aria-label="Upper Lip"
                aria-pressed={isSelected('lip_upper')}
                onClick={() => handleToggleRegion('lip_upper')}
                onKeyDown={(e) => handleKeyDown(e, 'lip_upper')}
                onFocus={() => setFocusedRegionId('lip_upper')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('lip_upper')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 76 78 C 128 26, 178 36, 200 44 C 222 36, 272 26, 324 78 C 278 58, 228 66, 200 68 C 172 66, 122 58, 76 78 Z"
                  fill={getFillColor('lip_upper')}
                  stroke={getStrokeColor('lip_upper')}
                  strokeWidth={getStrokeWidth('lip_upper')}
                />
              </g>

              {/* 12. Lower Lip */}
              <g
                id="mouth-region-lip_lower"
                role="button"
                tabIndex={0}
                aria-label="Lower Lip"
                aria-pressed={isSelected('lip_lower')}
                onClick={() => handleToggleRegion('lip_lower')}
                onKeyDown={(e) => handleKeyDown(e, 'lip_lower')}
                onFocus={() => setFocusedRegionId('lip_lower')}
                onBlur={() => setFocusedRegionId(null)}
                onMouseEnter={() => setHoveredRegionId('lip_lower')}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="cursor-pointer transition-all focus:outline-none"
              >
                <path
                  d="M 82 284 C 118 344, 282 344, 318 284 C 276 322, 226 328, 200 328 C 174 328, 124 322, 82 284 Z"
                  fill={getFillColor('lip_lower')}
                  stroke={getStrokeColor('lip_lower')}
                  strokeWidth={getStrokeWidth('lip_lower')}
                />
              </g>
            </svg>
          </div>

          <div className="w-full max-w-[340px] text-center pt-1 text-[10px] text-slate-400">
            Lower / Mandible
          </div>
        </div>

        {/* Right / Bottom Column: Location Summary Card, Actions, & Structured Region Chips */}
        <div className={`${isCompact ? 'w-full' : 'md:col-span-6'} flex flex-col space-y-3`}>
          {/* Location Summary List or Initial Instruction State */}
          {selectedRegions.length > 0 ? (
            <div
              id="mouth-map-selected-summary-card"
              className="bg-white rounded-xl p-3.5 border-2 border-teal-600/40 shadow-xs space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal-800 flex items-center gap-1">
                  <Check className="w-3 h-3 text-teal-600" />
                  <span>
                    {isHindi ? `चयनित क्षेत्र (${selectedRegions.length})` : `Selected Locations (${selectedRegions.length})`}
                  </span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                  {isHindi ? 'मरीज़ द्वारा चयनित' : 'Patient Selected'}
                </span>
              </div>

              {/* List of selected locations with remove buttons */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedRegions.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-teal-50/60 border border-teal-200 text-xs"
                  >
                    <div className="truncate mr-2">
                      <span className="font-semibold text-slate-900 block truncate">{reg.name}</span>
                      <span className="text-[10.5px] text-teal-700 block truncate">{reg.hindiName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRegion(reg.id, e)}
                      title="Remove this location"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Medical Notice */}
              <div className="flex items-start gap-1.5 p-2 bg-slate-50 rounded-lg text-[10.5px] text-slate-600 border border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {isHindi
                    ? 'मरीज़ द्वारा सूचित चिंता के क्षेत्र। यह केवल स्थान का रिकॉर्ड है, कोई चिकित्सकीय निदान नहीं है।'
                    : isHinglish
                    ? 'Patient-reported areas of concern. Yeh sirf location record hai, koi diagnosis nahi hai.'
                    : 'Patient-reported areas of concern. This records the reported sites for doctor reference, not a confirmed condition or diagnosis.'}
                </span>
              </div>

              {/* Primary Actions: Confirm, Clear, Cancel */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  id="btn-confirm-location"
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isHindi
                      ? `इन स्थानों की पुष्टि करें (${selectedRegions.length})`
                      : isHinglish
                      ? `Locations Confirm Karein (${selectedRegions.length})`
                      : `Confirm ${selectedRegions.length > 1 ? `${selectedRegions.length} Locations` : 'Location'}`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    id="btn-clear-selection"
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isHindi ? 'सभी साफ़ करें' : 'Clear All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    id="btn-cancel-location"
                    className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isHindi ? 'रद्द करें' : 'Cancel'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Initial state - clear instruction, NO default selection */
            <div
              id="mouth-map-instruction-banner"
              className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5 text-center sm:text-left"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isHindi
                    ? 'उस क्षेत्र का चयन करें जहाँ आपने लक्षण देखा है।'
                    : isHinglish
                    ? 'Woh area select karein jahan aapne symptom notice kiya.'
                    : 'Select the area(s) where you noticed symptoms.'}
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isHindi
                  ? 'मुँह के चित्र पर भागों को छुएं, या नीचे दी गई सूची में से चुनें। आप एक से अधिक क्षेत्र भी चुन सकते हैं। यदि आपको सटीक स्थान की पहचान नहीं है, तो "निश्चित नहीं" विकल्प चुनें।'
                  : isHinglish
                  ? 'Diagram par tap karein ya neeche di gayi list se select karein. Ek se zyada areas bhi select kar sakte hain. Exact spot na pata ho toh "Not sure" chunein.'
                  : 'Tap anatomical zones on the diagram or select areas from the list below. You can select multiple areas. If unsure, tap "Not sure".'}
              </p>

              {/* Disabled Confirm button when no location selected + Cancel button */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  disabled
                  id="btn-confirm-location-disabled"
                  className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-300" />
                  <span>
                    {isHindi
                      ? 'पुष्टि करने के लिए पहले क्षेत्र चुनें'
                      : isHinglish
                      ? 'Confirm karne ke liye pehle area chunein'
                      : 'Select an area to confirm'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  id="btn-cancel-location-initial"
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{isHindi ? 'रद्द करें' : 'Cancel'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Dedicated "Not sure / I can't identify exact area" Option */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={handleSelectNotSure}
              id="btn-location-not-sure"
              className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSelected('unknown_location')
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold ring-1 ring-teal-500'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {isHindi
                  ? 'निश्चित नहीं / मुझे सटीक स्थान की पहचान नहीं है'
                  : isHinglish
                  ? 'Not sure / Mujhe exact spot pata nahi'
                  : "Not sure / I can't identify the exact area"}
              </span>
            </button>
          </div>

          {/* Structured Anatomical Categories & Touch-Friendly List */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                {isHindi ? 'सभी मौखिक क्षेत्र' : 'Browse Oral Regions'}
              </span>
              <div className="flex gap-1 text-[10px] overflow-x-auto pb-0.5" role="tablist">
                {(['all', 'tongue', 'cheek', 'gums', 'palate', 'throat'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-1.5 py-0.5 rounded capitalize cursor-pointer shrink-0 ${
                      activeCategory === cat ? 'bg-teal-100 text-teal-800 font-semibold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile-optimized region buttons: min-h-[44px] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredChips.map((reg) => {
                const selected = isSelected(reg.id);
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => handleToggleRegion(reg.id)}
                    id={`btn-chip-${reg.id}`}
                    aria-pressed={selected}
                    className={`min-h-[44px] p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      selected
                        ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold shadow-2xs ring-1 ring-teal-600'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <span className="text-[11.5px] block truncate font-medium">
                        {reg.name.replace(' (Buccal Mucosa)', '').replace(' (Gingiva)', '')}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {reg.hindiName.split('(')[0]}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {selected ? (
                        <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
