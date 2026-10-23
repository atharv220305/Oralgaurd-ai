import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Check,
  RotateCcw,
  X,
  HelpCircle,
  Info,
  Plus,
  Eye,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ORAL_REGIONS, BASE_ORAL_REGIONS } from '../data/oralAnatomy';
import {
  UPPER_TEETH,
  LOWER_TEETH,
  ALL_TEETH,
  getToothDefinition,
  toothToOralRegion,
  ToothDefinition,
} from '../data/teethData';
import {
  OralRegion,
  MouthMapLocationItem,
  ClinicalConcern,
  AppLanguage,
  ToothSymptomReport,
} from '../types';
import { ThreeOralCanvas } from './ThreeOralCanvas';
import { MouthMapLegend } from './MouthMapLegend';

export interface InteractiveMouthMapProps {
  confirmedLocation?: string | null;
  confirmedRegionId?: string | null;
  confirmedLocations?: MouthMapLocationItem[];
  concerns?: ClinicalConcern[];
  activeConcernId?: string | null;
  initialToothConcerns?: ToothSymptomReport[];
  initialMissingTeeth?: string[];
  onSelectConcern?: (concernId: string) => void;
  onConfirmLocation?: (region: OralRegion) => void;
  onConfirmMultipleLocations?: (
    regions: OralRegion[],
    targetConcernId?: string | null,
    toothSymptoms?: ToothSymptomReport[],
    missingTeethList?: string[]
  ) => void;
  onClearLocation?: () => void;
  onCancel: () => void;
  onClose?: () => void;
  language?: AppLanguage | 'hinglish';
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

const TEETH_FLAT_ORDER: string[] = ALL_TEETH.map((t) => t.id);

export const InteractiveMouthMap: React.FC<InteractiveMouthMapProps> = ({
  confirmedRegionId,
  confirmedLocations = [],
  concerns = [],
  activeConcernId,
  initialToothConcerns = [],
  initialMissingTeeth = [],
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

  // Initialize draft with previously confirmed locations or tooth concerns if any
  const initialSelectedIds = useMemo(() => {
    const list: string[] = [];
    if (confirmedLocations && confirmedLocations.length > 0) {
      confirmedLocations.forEach((l) => {
        if (ORAL_REGIONS[l.id] || getToothDefinition(l.id)) {
          list.push(l.id);
        }
      });
    }
    if (confirmedRegionId && (ORAL_REGIONS[confirmedRegionId] || getToothDefinition(confirmedRegionId))) {
      if (!list.includes(confirmedRegionId)) list.push(confirmedRegionId);
    }
    if (initialToothConcerns && initialToothConcerns.length > 0) {
      initialToothConcerns.forEach((t) => {
        const tId = `tooth_${t.toothNumber}`;
        if (!list.includes(tId) && !list.includes(t.toothNumber)) {
          list.push(tId);
        }
      });
    }
    return list;
  }, [confirmedLocations, confirmedRegionId, initialToothConcerns]);

  // Model mode: 2D simplified medical illustration vs 3D realistic anatomy
  const [modelMode, setModelMode] = useState<'2d' | '3d'>('2d');

  // Shared Selection State (synchronized between 2D & 3D)
  const [draftRegionIds, setDraftRegionIds] = useState<string[]>(initialSelectedIds);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);

  // Selection Lock control (prevents accidental selection changes during camera orbit)
  const [selectionLocked, setSelectionLocked] = useState<boolean>(false);

  // 2D View Controls: Zoom, Pan, Labels visibility, Detailed mode
  const [zoomLevel2D, setZoomLevel2D] = useState<number>(1);
  const [panOffset2D, setPanOffset2D] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLabels2D, setShowLabels2D] = useState<boolean>(true);
  const [detailedMode2D, setDetailedMode2D] = useState<boolean>(false);

  // Hover & Focus tracking
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [hoveredToothId, setHoveredToothId] = useState<string | null>(null);
  const [focusedToothId, setFocusedToothId] = useState<string | null>(null);

  // Category browsing & Quadrant filters
  const [activeCategory, setActiveCategory] = useState<'all' | 'teeth' | 'tongue' | 'cheek' | 'gums' | 'palate' | 'throat'>('all');
  const [selectedQuadrant, setSelectedQuadrant] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // Pre-submission review modal state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Auto-save notification indicator
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState<boolean>(false);

  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  // Body scroll-locking cleanup
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  // Update selection helper with undo history
  const updateSelectionWithHistory = (newIds: string[]) => {
    setUndoStack((prev) => [...prev, draftRegionIds]);
    setRedoStack([]); // Clear redo stack on new action
    setDraftRegionIds(newIds);

    // Flash subtle Auto-save indicator
    setShowAutoSaveIndicator(true);
    setTimeout(() => setShowAutoSaveIndicator(false), 1600);
  };

  // Undo latest selection change
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, draftRegionIds]);
    setDraftRegionIds(previous);
    setLiveAnnouncement('Undid latest selection change.');
  };

  // Redo undone selection change
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, draftRegionIds]);
    setDraftRegionIds(next);
    setLiveAnnouncement('Restored selection change.');
  };

  // Normalize check for region or tooth selection
  const isSelected = (id: string) => {
    if (draftRegionIds.includes(id)) return true;
    if (id.startsWith('tooth_')) {
      const num = id.replace('tooth_', '');
      return draftRegionIds.includes(num);
    }
    const toothId = `tooth_${id}`;
    return draftRegionIds.includes(toothId);
  };

  // Resolve an ID to an OralRegion object (supporting both regions & teeth)
  const resolveToOralRegion = (id: string): OralRegion | null => {
    const toothDef = getToothDefinition(id);
    if (toothDef) {
      return toothToOralRegion(toothDef);
    }
    if (ORAL_REGIONS[id]) {
      return ORAL_REGIONS[id];
    }
    return null;
  };

  const selectedRegions: OralRegion[] = useMemo(() => {
    return draftRegionIds
      .map(resolveToOralRegion)
      .filter((reg): reg is OralRegion => Boolean(reg));
  }, [draftRegionIds]);

  // Track active inspected structure (hovered, focused, or latest selected)
  const activeInspectedTooth: ToothDefinition | null = useMemo(() => {
    const activeId = hoveredToothId || focusedToothId;
    if (activeId) {
      return getToothDefinition(activeId) || null;
    }
    for (let i = draftRegionIds.length - 1; i >= 0; i--) {
      const t = getToothDefinition(draftRegionIds[i]);
      if (t) return t;
    }
    return null;
  }, [hoveredToothId, focusedToothId, draftRegionIds]);

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
        updateSelectionWithHistory(regionIds);
        setLiveAnnouncement(`Viewing locations for ${concern.description}`);
        return;
      }
    }
  };

  // Toggle anatomical mucosal region
  const handleToggleRegion = (regionId: string) => {
    if (selectionLocked) return;

    if (regionId === 'unknown_location') {
      updateSelectionWithHistory(['unknown_location']);
      setLiveAnnouncement('Selected Not Sure / Unspecified location.');
      return;
    }

    const withoutUnknown = draftRegionIds.filter((id) => id !== 'unknown_location');
    if (withoutUnknown.includes(regionId)) {
      const next = withoutUnknown.filter((id) => id !== regionId);
      const reg = resolveToOralRegion(regionId);
      setLiveAnnouncement(`Removed ${reg?.name || regionId}.`);
      updateSelectionWithHistory(next);
    } else {
      const next = [...withoutUnknown, regionId];
      const reg = resolveToOralRegion(regionId);
      setLiveAnnouncement(`Added ${reg?.name || regionId} to selection (${next.length} selected).`);
      updateSelectionWithHistory(next);
    }
  };

  // Toggle individual tooth (FDI system)
  const handleToggleTooth = (toothId: string) => {
    if (selectionLocked) return;

    const toothDef = getToothDefinition(toothId);
    const canonicalId = toothDef ? toothDef.id : toothId;
    const displayName = toothDef ? toothDef.fullName : toothId;

    const withoutUnknown = draftRegionIds.filter((id) => id !== 'unknown_location');
    const alreadySelected = withoutUnknown.some(
      (id) => id === canonicalId || (toothDef && id === toothDef.toothNumber)
    );

    if (alreadySelected) {
      const next = withoutUnknown.filter(
        (id) => id !== canonicalId && (!toothDef || id !== toothDef.toothNumber)
      );
      setLiveAnnouncement(`Deselected ${displayName}.`);
      updateSelectionWithHistory(next);
    } else {
      const next = [...withoutUnknown, canonicalId];
      setLiveAnnouncement(`Selected ${displayName} (${next.length} locations selected).`);
      updateSelectionWithHistory(next);
    }
  };

  // Unified toggle for both 2D and 3D
  const handleUniversalToggle = (id: string) => {
    if (getToothDefinition(id)) {
      handleToggleTooth(id);
    } else {
      handleToggleRegion(id);
    }
  };

  // Remove single selected location (region or tooth)
  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const toothDef = getToothDefinition(id);
    const next = draftRegionIds.filter(
      (item) => item !== id && (!toothDef || (item !== toothDef.toothNumber && item !== toothDef.id))
    );
    updateSelectionWithHistory(next);
    const reg = resolveToOralRegion(id);
    setLiveAnnouncement(`Removed ${reg?.name || id}.`);
  };

  // Clear / Reset all selections without moving camera
  const handleClearSelection = () => {
    updateSelectionWithHistory([]);
    setHoveredToothId(null);
    setFocusedToothId(null);
    setLiveAnnouncement('All locations cleared.');
    if (onClearLocation) {
      onClearLocation();
    }
  };

  // Reset 2D View
  const handleReset2DView = () => {
    setZoomLevel2D(1);
    setPanOffset2D({ x: 0, y: 0 });
  };

  // Confirm Location(s) - Triggers pre-submission review
  const handleProceedToReview = () => {
    if (draftRegionIds.length === 0) return;
    setShowReviewModal(true);
  };

  // Final confirmation and submission
  const handleFinalSubmit = () => {
    document.body.style.overflow = '';
    setShowReviewModal(false);

    // Separate teeth from mucosal regions for comprehensive reporting
    const toothReports: ToothSymptomReport[] = [];
    selectedRegions.forEach((r) => {
      const toothDef = getToothDefinition(r.id);
      if (toothDef) {
        toothReports.push({
          id: toothDef.toothNumber,
          toothNumber: toothDef.toothNumber,
          quadrant:
            toothDef.quadrant === 1
              ? 'upper_right'
              : toothDef.quadrant === 2
              ? 'upper_left'
              : toothDef.quadrant === 3
              ? 'lower_left'
              : 'lower_right',
          toothName: toothDef.name,
          toothNameHi: toothDef.hindiName,
          toothNameMr: toothDef.marathiName,
          painSeverity: 'none',
          reportedAt: new Date().toISOString(),
        });
      }
    });

    if (onConfirmMultipleLocations) {
      onConfirmMultipleLocations(selectedRegions, selectedConcernId, toothReports, initialMissingTeeth);
    } else if (onConfirmLocation && selectedRegions.length > 0) {
      onConfirmLocation(selectedRegions[0]);
    }

    if (onClose) {
      onClose();
    }
  };

  // Cancel: Discards unconfirmed changes and restores previously confirmed state
  const handleCancel = () => {
    document.body.style.overflow = '';
    setDraftRegionIds(initialSelectedIds);
    if (onClose) {
      onClose();
    } else {
      onCancel();
    }
  };

  // Dedicated "Not sure / I can't identify exact area"
  const handleSelectNotSure = () => {
    handleToggleRegion('unknown_location');
  };

  // Keyboard navigation for anatomical regions
  const handleRegionKeyDown = (e: React.KeyboardEvent<SVGGElement>, regionId: string) => {
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

  // Keyboard navigation for teeth
  const handleToothKeyDown = (e: React.KeyboardEvent<SVGGElement>, toothId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleTooth(toothId);
      return;
    }

    const currentIndex = TEETH_FLAT_ORDER.indexOf(toothId);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % TEETH_FLAT_ORDER.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + TEETH_FLAT_ORDER.length) % TEETH_FLAT_ORDER.length;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = currentIndex < 16 ? currentIndex + 16 : currentIndex - 16;
    }

    if (nextIndex !== -1 && nextIndex < TEETH_FLAT_ORDER.length) {
      const nextId = TEETH_FLAT_ORDER[nextIndex];
      setFocusedToothId(nextId);
      const toothDef = getToothDefinition(nextId);
      if (toothDef) {
        const nextEl = document.getElementById(`mouth-tooth-${toothDef.toothNumber}`);
        if (nextEl) {
          nextEl.focus();
        }
      }
    }
  };

  // Clean clinical fills for anatomical mucosal regions (Cyan-blue selection accent)
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
      return '#06b6d4'; // Cyan-500 vibrant selection border
    }
    if (hoveredRegionId === regionId) {
      return '#0284c7'; // Sky-600
    }
    if (focusedRegionId === regionId) {
      return '#2563eb'; // Blue-600
    }
    return '#94a3b8'; // Slate-400 boundary
  };

  const getStrokeWidth = (regionId: string) => {
    if (isSelected(regionId)) return 2.6;
    if (hoveredRegionId === regionId) return 2.0;
    if (focusedRegionId === regionId) return 2.2;
    return 1.2;
  };

  // Filter chips for structured anatomical browsing
  const filteredChips = useMemo(() => {
    return Object.values(BASE_ORAL_REGIONS).filter((reg) => {
      if (reg.id === 'unknown_location') return false;
      if (activeCategory === 'all') return true;
      if (activeCategory === 'tongue') return reg.id.includes('tongue') || reg.id.includes('floor');
      if (activeCategory === 'cheek') return reg.id.includes('buccal') || reg.id.includes('lip');
      if (activeCategory === 'gums') return reg.id.includes('gingiva');
      if (activeCategory === 'palate') return reg.id.includes('palate');
      if (activeCategory === 'throat') return reg.id.includes('tonsil') || reg.id.includes('other');
      return false;
    });
  }, [activeCategory]);

  const filteredTeeth = useMemo(() => {
    if (selectedQuadrant === 'all') return ALL_TEETH;
    return ALL_TEETH.filter((t) => t.quadrant === selectedQuadrant);
  }, [selectedQuadrant]);

  // Render individual SVG tooth element with Cyan-Blue glow and touch target
  const renderSvgTooth = (tooth: ToothDefinition) => {
    const selected = isSelected(tooth.id) || isSelected(tooth.toothNumber);
    const hovered = hoveredToothId === tooth.id;
    const focused = focusedToothId === tooth.id;

    const hitX = tooth.x - 0.75;
    const hitY = tooth.y - 4.5;
    const hitW = tooth.width + 1.5;
    const hitH = tooth.height + 9;

    return (
      <g
        key={tooth.id}
        id={`mouth-tooth-${tooth.toothNumber}`}
        role="button"
        tabIndex={0}
        aria-label={`${tooth.fullName}${selected ? ' (Selected)' : ''}`}
        aria-pressed={selected}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleTooth(tooth.id);
        }}
        onKeyDown={(e) => handleToothKeyDown(e, tooth.id)}
        onMouseEnter={() => setHoveredToothId(tooth.id)}
        onMouseLeave={() => setHoveredToothId(null)}
        onFocus={() => {
          setFocusedToothId(tooth.id);
          setHoveredToothId(tooth.id);
        }}
        onBlur={() => {
          setFocusedToothId(null);
          setHoveredToothId((prev) => (prev === tooth.id ? null : prev));
        }}
        className="cursor-pointer transition-all focus:outline-none"
      >
        {/* Expanded touch target */}
        <rect
          x={hitX}
          y={hitY}
          width={hitW}
          height={hitH}
          fill="transparent"
          pointerEvents="all"
          className="cursor-pointer"
        />

        {/* Selected cyan-blue halo glow */}
        {selected && (
          <rect
            x={tooth.x - 1.2}
            y={tooth.y - 1.2}
            width={tooth.width + 2.4}
            height={tooth.height + 2.4}
            rx={tooth.rx + 1}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.8"
            strokeOpacity="0.95"
            filter="drop-shadow(0 0 3px #06b6d4)"
          />
        )}

        {/* Visible tooth body */}
        <rect
          x={tooth.x}
          y={tooth.y}
          width={tooth.width}
          height={tooth.height}
          rx={tooth.rx}
          fill={
            selected
              ? '#0d9488' // Teal-600 selected fill
              : hovered || focused
              ? '#bae6fd' // Sky-200 hovered fill
              : 'url(#toothEnamelClean)' // Natural pearl enamel gradient
          }
          stroke={
            selected
              ? '#042f2e'
              : hovered || focused
              ? '#0284c7'
              : '#94a3b8'
          }
          strokeWidth={selected ? 1.4 : hovered || focused ? 1.2 : 0.8}
          className="transition-colors duration-150"
        />

        {/* FDI two-digit tooth number */}
        {showLabels2D && (
          <text
            x={tooth.x + tooth.width / 2}
            y={tooth.y + tooth.height / 2 + 1.8}
            textAnchor="middle"
            fontSize="4.8"
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
            fill={selected ? '#ffffff' : hovered ? '#0369a1' : '#64748b'}
            pointerEvents="none"
            className="select-none"
          >
            {tooth.shortLabel}
          </text>
        )}
      </g>
    );
  };

  return (
    <div
      id="oralguard-interactive-mouth-map"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col transition-all max-h-[88vh] overflow-y-auto [touch-action:pan-y] touch-pan-y"
      style={{ touchAction: 'pan-y', maxHeight: '88vh', overflowY: 'auto' }}
    >
      {/* Top Clinical Header & Model Mode Switcher */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-white flex items-center gap-2">
              <span>{isHindi ? 'मुँह का शारीरिक नक़्शा' : 'Oral Anatomy & Location Mapping'}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                2D & 3D Sync
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isHindi
                ? 'अपने लक्षण का स्थान बताने के लिए दाँतों या मौखिक क्षेत्रों पर टैप करें'
                : 'Select individual teeth (FDI 11–48) or oral structures in 2D or 3D'}
            </p>
          </div>
        </div>

        {/* 2D / 3D Mode Toggle & Close Button */}
        <div className="flex items-center gap-2">
          {/* Synchronized 2D / 3D Model Segmented Toggle */}
          <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setModelMode('2d')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                modelMode === '2d'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2D Map
            </button>
            <button
              type="button"
              onClick={() => setModelMode('3d')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                modelMode === '3d'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              3D Model
            </button>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            id="btn-mouth-map-close"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel and close"
            title="Cancel"
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

      {/* Toolbar: Selection Lock, Undo, Redo, Clear All & Auto-Save Indicator */}
      <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {/* Selection Lock Toggle */}
          <button
            type="button"
            onClick={() => {
              setSelectionLocked((prev) => !prev);
              setLiveAnnouncement(selectionLocked ? 'Selection unlocked' : 'Selection locked');
            }}
            title={selectionLocked ? 'Unlock Selection' : 'Lock Selection against accidental taps'}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border ${
              selectionLocked
                ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border-slate-200'
            }`}
          >
            {selectionLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-slate-500" />}
            <span>{selectionLocked ? 'Locked' : 'Lock'}</span>
          </button>

          {/* Undo Button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo latest selection"
            className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo Button */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo selection"
            className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-slate-300 mx-1" />

          {/* 2D Specific Controls */}
          {modelMode === '2d' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowLabels2D((prev) => !prev)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium border cursor-pointer ${
                  showLabels2D ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Labels
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel2D((prev) => Math.min(2.0, prev + 0.2))}
                title="Zoom In 2D Map"
                className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel2D((prev) => Math.max(0.8, prev - 0.2))}
                title="Zoom Out 2D Map"
                className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              {zoomLevel2D !== 1 && (
                <button
                  type="button"
                  onClick={handleReset2DView}
                  className="px-1.5 py-0.5 text-[10px] text-teal-700 hover:underline cursor-pointer"
                >
                  Reset Zoom
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected count & Auto-Save Badge */}
        <div className="flex items-center gap-2">
          {showAutoSaveIndicator && (
            <span className="text-[10.5px] font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Saved ✓</span>
            </span>
          )}

          <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            {selectedRegions.length} {selectedRegions.length === 1 ? 'location' : 'locations'}
          </span>
        </div>
      </div>

      {/* Screen Reader Live Region */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Main Grid: Visual Map Stage (2D or 3D) + Clinical Selection Controls */}
      <div
        className={`p-4 grid ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'} gap-4 items-start bg-slate-50/50 max-h-[85vh] overflow-y-auto [touch-action:pan-y] touch-pan-y`}
        style={{ touchAction: 'pan-y', maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Left/Top: Anatomical Model Stage (2D Medical SVG or Realistic 3D Canvas) */}
        <div className={`${isCompact ? 'w-full' : 'md:col-span-6'} flex flex-col items-center`}>
          {/* Orientation indicators: Patient Perspective */}
          <div className="w-full max-w-[360px] flex items-center justify-between px-2 pb-1 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            <span title="Right side from patient's perspective">Right (Patient's Right)</span>
            <span className="text-slate-500 font-bold">
              {modelMode === '3d' ? '3D Anatomy' : 'Upper / Maxilla'}
            </span>
            <span title="Left side from patient's perspective">Left (Patient's Left)</span>
          </div>

          {/* Model Display: Either 3D ThreeOralCanvas or 2D SVG Illustration */}
          {modelMode === '3d' ? (
            <ThreeOralCanvas
              selectedIds={draftRegionIds}
              hoveredId={hoveredToothId || hoveredRegionId}
              onToggleSelection={handleUniversalToggle}
              onHoverStructure={(id) => {
                if (id && getToothDefinition(id)) {
                  setHoveredToothId(id);
                  setHoveredRegionId(null);
                } else {
                  setHoveredRegionId(id);
                  setHoveredToothId(null);
                }
              }}
              selectionLocked={selectionLocked}
              className="max-w-[360px]"
            />
          ) : (
            <div className="w-full max-w-[360px] aspect-[4/3.8] relative bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-xs overflow-hidden">
              <svg
                viewBox="0 0 400 380"
                role="group"
                aria-label="Oral Cavity Anatomy Map with FDI Tooth Numbering"
                className="w-full h-full max-h-[310px] select-none focus:outline-none transition-transform duration-150"
                style={{
                  touchAction: 'manipulation',
                  transform: `scale(${zoomLevel2D}) translate(${panOffset2D.x}px, ${panOffset2D.y}px)`,
                }}
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
                  onKeyDown={(e) => handleRegionKeyDown(e, 'tonsil_oropharynx')}
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
                  <circle cx="152" cy="155" r="7" fill={isSelected('tonsil_oropharynx') ? '#06b6d4' : '#fda4af'} />
                  <circle cx="248" cy="155" r="7" fill={isSelected('tonsil_oropharynx') ? '#06b6d4' : '#fda4af'} />
                  <path
                    d="M 195 168 C 195 162, 205 162, 205 168 C 205 190, 195 190, 195 168 Z"
                    fill={isSelected('tonsil_oropharynx') ? '#06b6d4' : '#fb7185'}
                    stroke={isSelected('tonsil_oropharynx') ? '#0891b2' : '#e11d48'}
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
                  onKeyDown={(e) => handleRegionKeyDown(e, 'hard_palate')}
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
                  onKeyDown={(e) => handleRegionKeyDown(e, 'soft_palate')}
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

                {/* 3. Upper Gums (Gingiva Upper) */}
                <g
                  id="mouth-region-gingiva_upper"
                  role="button"
                  tabIndex={0}
                  aria-label="Upper Gums (Gingiva)"
                  aria-pressed={isSelected('gingiva_upper')}
                  onClick={() => handleToggleRegion('gingiva_upper')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'gingiva_upper')}
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
                </g>

                {/* 3b. Individually Selectable Upper Teeth (FDI 18–11 & 21–28) */}
                <g id="mouth-teeth-maxillary-arch" role="group" aria-label="Maxillary Teeth (Upper Arch)">
                  {UPPER_TEETH.map(renderSvgTooth)}
                </g>

                {/* 4. Left Inner Cheek (Buccal Mucosa Left) */}
                <g
                  id="mouth-region-buccal_mucosa_left"
                  role="button"
                  tabIndex={0}
                  aria-label="Left Inner Cheek (Buccal Mucosa)"
                  aria-pressed={isSelected('buccal_mucosa_left')}
                  onClick={() => handleToggleRegion('buccal_mucosa_left')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'buccal_mucosa_left')}
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
                  <circle cx="78" cy="155" r="3" fill={isSelected('buccal_mucosa_left') ? '#06b6d4' : '#f43f5e'} opacity="0.65" />
                </g>

                {/* 5. Right Inner Cheek (Buccal Mucosa Right) */}
                <g
                  id="mouth-region-buccal_mucosa_right"
                  role="button"
                  tabIndex={0}
                  aria-label="Right Inner Cheek (Buccal Mucosa)"
                  aria-pressed={isSelected('buccal_mucosa_right')}
                  onClick={() => handleToggleRegion('buccal_mucosa_right')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'buccal_mucosa_right')}
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
                  <circle cx="322" cy="155" r="3" fill={isSelected('buccal_mucosa_right') ? '#06b6d4' : '#f43f5e'} opacity="0.65" />
                </g>

                {/* 6. Floor of Mouth (Under Tongue) */}
                <g
                  id="mouth-region-floor_of_mouth"
                  role="button"
                  tabIndex={0}
                  aria-label="Floor of Mouth"
                  aria-pressed={isSelected('floor_of_mouth')}
                  onClick={() => handleToggleRegion('floor_of_mouth')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'floor_of_mouth')}
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
                  <line x1="200" y1="230" x2="200" y2="285" stroke={isSelected('floor_of_mouth') ? '#06b6d4' : '#f43f5e'} strokeWidth="1.2" opacity="0.5" />
                </g>

                {/* 7. Tongue Center & Dorsum */}
                <g
                  id="mouth-region-tongue_dorsum"
                  role="button"
                  tabIndex={0}
                  aria-label="Tongue Dorsum (Center and Top of Tongue)"
                  aria-pressed={isSelected('tongue_dorsum')}
                  onClick={() => handleToggleRegion('tongue_dorsum')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'tongue_dorsum')}
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
                  <line x1="200" y1="192" x2="200" y2="258" stroke={isSelected('tongue_dorsum') ? '#06b6d4' : '#f43f5e'} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.6" />
                </g>

                {/* 8. Left Side of Tongue */}
                <g
                  id="mouth-region-lateral_tongue_left"
                  role="button"
                  tabIndex={0}
                  aria-label="Left Side of Tongue"
                  aria-pressed={isSelected('lateral_tongue_left')}
                  onClick={() => handleToggleRegion('lateral_tongue_left')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'lateral_tongue_left')}
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
                  <line x1="134" y1="208" x2="146" y2="210" stroke={isSelected('lateral_tongue_left') ? '#06b6d4' : '#be123c'} strokeWidth="1" opacity="0.5" />
                </g>

                {/* 9. Right Side of Tongue */}
                <g
                  id="mouth-region-lateral_tongue_right"
                  role="button"
                  tabIndex={0}
                  aria-label="Right Side of Tongue"
                  aria-pressed={isSelected('lateral_tongue_right')}
                  onClick={() => handleToggleRegion('lateral_tongue_right')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'lateral_tongue_right')}
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
                  <line x1="266" y1="208" x2="254" y2="210" stroke={isSelected('lateral_tongue_right') ? '#06b6d4' : '#be123c'} strokeWidth="1" opacity="0.5" />
                </g>

                {/* 10. Lower Gums (Gingiva Lower) */}
                <g
                  id="mouth-region-gingiva_lower"
                  role="button"
                  tabIndex={0}
                  aria-label="Lower Gums (Gingiva)"
                  aria-pressed={isSelected('gingiva_lower')}
                  onClick={() => handleToggleRegion('gingiva_lower')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'gingiva_lower')}
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
                </g>

                {/* 10b. Individually Selectable Lower Teeth (FDI 48–41 & 31–38) */}
                <g id="mouth-teeth-mandibular-arch" role="group" aria-label="Mandibular Teeth (Lower Arch)">
                  {LOWER_TEETH.map(renderSvgTooth)}
                </g>

                {/* 11. Upper Lip */}
                <g
                  id="mouth-region-lip_upper"
                  role="button"
                  tabIndex={0}
                  aria-label="Upper Lip"
                  aria-pressed={isSelected('lip_upper')}
                  onClick={() => handleToggleRegion('lip_upper')}
                  onKeyDown={(e) => handleRegionKeyDown(e, 'lip_upper')}
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
                  onKeyDown={(e) => handleRegionKeyDown(e, 'lip_lower')}
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
          )}

          {/* Bottom Orientation Label */}
          <div className="w-full max-w-[360px] text-center pt-1 text-[10px] text-slate-400">
            Lower / Mandible
          </div>

          {/* Section 5 Requirement: Selection Details Readout Label */}
          <div className="w-full max-w-[360px] mt-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-center transition-all">
            {activeInspectedTooth ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-800">
                <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 text-[10px] border border-cyan-200">
                  FDI {activeInspectedTooth.toothNumber}
                </span>
                <span className="font-semibold text-slate-900 truncate">
                  {activeInspectedTooth.toothNumber} — {activeInspectedTooth.name}
                </span>
              </div>
            ) : hoveredRegionId ? (
              <div className="text-xs text-slate-700 font-medium truncate">
                {ORAL_REGIONS[hoveredRegionId]?.name || hoveredRegionId}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                {isHindi
                  ? 'दाँत या मौखिक क्षेत्र पर टैप करें (FDI ११–४८)'
                  : 'Tap any tooth (FDI 11–48) or oral structure in 2D or 3D'}
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom Column: Location Summary Card, Actions, & Structured Region Chips */}
        <div className={`${isCompact ? 'w-full' : 'md:col-span-6'} flex flex-col space-y-3`}>
          {/* Location Summary List or Initial Instruction State */}
          {selectedRegions.length > 0 ? (
            <div
              id="mouth-map-selected-summary-card"
              className="bg-white rounded-xl p-3.5 border-2 border-cyan-500/40 shadow-xs space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-900 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  <span>
                    {isHindi ? `चयनित स्थान (${selectedRegions.length})` : `Selected Locations (${selectedRegions.length})`}
                  </span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200">
                  {isHindi ? 'मरीज़ द्वारा चयनित' : 'Patient Selected'}
                </span>
              </div>

              {/* List of selected locations with remove buttons */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedRegions.map((reg) => {
                  const toothDef = getToothDefinition(reg.id);
                  return (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-cyan-50/60 border border-cyan-200 text-xs"
                    >
                      <div className="truncate mr-2 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {toothDef && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-600 text-white font-mono text-[9.5px] font-bold shrink-0 shadow-2xs">
                              {toothDef.toothNumber}
                            </span>
                          )}
                          <span className="font-semibold text-slate-900 truncate">
                            {toothDef ? `${toothDef.toothNumber} — ${toothDef.name}` : reg.name}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-cyan-800 block truncate">
                          {reg.hindiName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveItem(reg.id, e)}
                        title="Remove this location"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Medical Notice */}
              <div className="flex items-start gap-1.5 p-2 bg-slate-50 rounded-lg text-[10.5px] text-slate-600 border border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {isHindi
                    ? 'मरीज़ द्वारा सूचित चिंता के क्षेत्र। यह केवल स्थान का रिकॉर्ड है, कोई चिकित्सकीय निदान नहीं है।'
                    : 'Patient-reported areas of concern. This records the reported sites for dental reference, not a confirmed condition or diagnosis.'}
                </span>
              </div>

              {/* Primary Actions: Review & Confirm, Clear All, Cancel */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  id="btn-confirm-location"
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isHindi
                      ? `समीक्षा व पुष्टि करें (${selectedRegions.length})`
                      : `Review & Confirm (${selectedRegions.length})`}
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
            /* Initial state */
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
                    ? 'उस दाँत या क्षेत्र का चयन करें जहाँ आपने लक्षण देखा है।'
                    : 'Select tooth or oral area(s) of concern.'}
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isHindi
                  ? '२डी नक़्शे या ३डी मॉडल पर दाँतों (FDI ११–४८) अथवा मौखिक भागों को छुएं। एक से अधिक क्षेत्र भी चुन सकते हैं।'
                  : 'Tap teeth (FDI 11–48) or mucosal zones on either the 2D illustration or realistic 3D model. Both models synchronize automatically.'}
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
                    {isHindi ? 'पुष्टि के लिए पहले क्षेत्र चुनें' : 'Select a tooth or area to confirm'}
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
                  : "Not sure / I can't identify the exact area"}
              </span>
            </button>
          </div>

          {/* Structured Anatomical Categories & Touch-Friendly Browser */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                {isHindi ? 'मौखिक क्षेत्र व दाँत' : 'Browse Anatomy'}
              </span>
              <div className="flex gap-1 text-[10px] overflow-x-auto pb-0.5" role="tablist">
                {(['all', 'teeth', 'tongue', 'cheek', 'gums', 'palate', 'throat'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-1.5 py-0.5 rounded capitalize cursor-pointer shrink-0 ${
                      activeCategory === cat ? 'bg-teal-100 text-teal-800 font-semibold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {cat === 'teeth' ? 'Teeth (FDI)' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* When "Teeth" category is active: show Quadrant selector & 44px+ touch-friendly tooth buttons */}
            {activeCategory === 'teeth' ? (
              <div className="space-y-2">
                {/* Quadrant filter tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-slate-400 shrink-0 font-medium mr-1">Quadrant:</span>
                  {[
                    { id: 'all', label: 'All (32)' },
                    { id: 1, label: 'Q1: Upper Right' },
                    { id: 2, label: 'Q2: Upper Left' },
                    { id: 3, label: 'Q3: Lower Left' },
                    { id: 4, label: 'Q4: Lower Right' },
                  ].map((q) => (
                    <button
                      key={String(q.id)}
                      type="button"
                      onClick={() => setSelectedQuadrant(q.id as any)}
                      className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap cursor-pointer transition-colors ${
                        selectedQuadrant === q.id
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Mobile-optimized tooth buttons: min-h-[44px] */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredTeeth.map((tooth) => {
                    const selected = isSelected(tooth.id) || isSelected(tooth.toothNumber);
                    return (
                      <button
                        key={tooth.id}
                        type="button"
                        onClick={() => handleToggleTooth(tooth.id)}
                        id={`btn-chip-tooth-${tooth.toothNumber}`}
                        aria-pressed={selected}
                        className={`min-h-[44px] p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          selected
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-semibold shadow-2xs ring-1 ring-cyan-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold shrink-0">
                              FDI {tooth.toothNumber}
                            </span>
                            <span className="text-[11.5px] truncate font-medium">
                              {tooth.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {tooth.hindiName}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {selected ? (
                            <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center">
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
            ) : (
              /* Mobile-optimized region buttons: min-h-[44px] */
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
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-semibold shadow-2xs ring-1 ring-cyan-500'
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
                          <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center">
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
            )}
          </div>
        </div>
      </div>

      {/* Required Accessible Legend Key Component Below the Map */}
      <div className="px-4 pb-4">
        <MouthMapLegend
          language={language}
          is3DMode={modelMode === '3d'}
          selectionLocked={selectionLocked}
        />
      </div>

      {/* Section 9 Requirement: Pre-Submission Review & Confirmation Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-bold">Review Selected Oral Locations</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <p className="text-slate-600 text-[11.5px]">
                You have selected{' '}
                <span className="font-bold text-slate-900">
                  {selectedRegions.length} {selectedRegions.length === 1 ? 'structure' : 'structures'}
                </span>{' '}
                as areas of symptom or concern. Please review before proceeding.
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedRegions.map((reg) => {
                  const toothDef = getToothDefinition(reg.id);
                  return (
                    <div
                      key={reg.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          {toothDef && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-900 font-mono text-[9px] font-bold">
                              FDI {toothDef.toothNumber}
                            </span>
                          )}
                          <span className="truncate">{reg.name}</span>
                        </div>
                        <span className="text-[10.5px] text-slate-500 block">{reg.hindiName}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveItem(reg.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-[10.5px] text-teal-900 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  OralGuard AI records reported locations for clinical reference. Selecting an anatomical area does not diagnose a medical condition.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                Edit Selection
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                id="btn-final-confirm-submission"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
              >
                Submit Locations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
