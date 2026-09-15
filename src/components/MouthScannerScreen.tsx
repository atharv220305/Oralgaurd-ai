import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  MapPin,
  Sparkles,
  ChevronRight,
  Plus,
  Eye,
  Calendar,
  ShieldCheck,
  Flashlight,
  SwitchCamera,
} from 'lucide-react';
import { PhotoDocumentationItem, OralRegion, MouthMapLocationItem, AppLanguage } from '../types';
import { ORAL_REGIONS } from '../data/oralAnatomy';

interface MouthScannerScreenProps {
  photos: PhotoDocumentationItem[];
  onSavePhoto: (photo: PhotoDocumentationItem) => void;
  onDeletePhoto: (id: string) => void;
  availableMouthLocations?: MouthMapLocationItem[];
  onOpenMouthMap?: () => void;
  onClose?: () => void;
  language?: AppLanguage | 'hinglish';
}

const QUICK_NOTE_SUGGESTIONS = [
  'Small ulcer / sore',
  'White patch',
  'Red patch',
  'Localized swelling',
  'Burning spot',
  'Sharp tooth friction',
  'Bleeding area',
  'Rough texture',
];

export const MouthScannerScreen: React.FC<MouthScannerScreenProps> = ({
  photos = [],
  onSavePhoto,
  onDeletePhoto,
  availableMouthLocations = [],
  onOpenMouthMap,
  onClose,
  language = 'en',
}) => {
  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish';

  const [mode, setMode] = useState<'view_list' | 'capture_active' | 'preview_draft'>(
    photos.length === 0 ? 'capture_active' : 'view_list'
  );

  // Active Draft Capture State
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    availableMouthLocations.length > 0 ? availableMouthLocations[0].id : ''
  );
  const [draftNote, setDraftNote] = useState<string>('');
  const [viewingPhotoDetail, setViewingPhotoDetail] = useState<PhotoDocumentationItem | null>(null);

  // Camera stream management
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Start Camera
  const startCamera = async (facing: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Camera API not accessible in this environment. Please upload an image.');
        setIsCameraActive(false);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera not available or permission denied. You can still select or upload a photo.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (mode === 'capture_active') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, facingMode]);

  // Capture snapshot from video
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setDraftImage(dataUrl);
        stopCamera();
        setMode('preview_draft');
      }
    } catch (e) {
      console.error('Snapshot capture failed:', e);
    }
  };

  // Upload file from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setDraftImage(result);
          stopCamera();
          setMode('preview_draft');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Retake / Replace image
  const handleRetake = () => {
    setDraftImage(null);
    setMode('capture_active');
    startCamera(facingMode);
  };

  // Delete / Clear draft
  const handleClearDraft = () => {
    setDraftImage(null);
    setDraftNote('');
    setSelectedLocationId('');
    if (photos.length > 0) {
      setMode('view_list');
    } else {
      setMode('capture_active');
    }
  };

  // Save documented photo
  const handleSavePhoto = () => {
    if (!draftImage) return;

    const locObject = selectedLocationId ? ORAL_REGIONS[selectedLocationId] : null;
    const locationName = locObject ? locObject.name : (selectedLocationId || undefined);

    const newPhoto: PhotoDocumentationItem = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      imageData: draftImage,
      location: selectedLocationId || null,
      locationName: locationName,
      note: draftNote.trim(),
      capturedAt: new Date().toISOString(),
    };

    onSavePhoto(newPhoto);
    setDraftImage(null);
    setDraftNote('');
    setSelectedLocationId('');
    setMode('view_list');
  };

  return (
    <div
      id="oralguard-mouth-scanner-view"
      className="flex-1 flex flex-col bg-slate-50 overflow-y-auto max-w-2xl mx-auto w-full p-3 sm:p-4 space-y-4"
    >
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {isHindi ? 'मुँह की फोटो दस्तावेज़ीकरण' : 'Mouth Photo Documentation'}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'लक्षणों की निगरानी व डॉक्टर परामर्श हेतु फ़ोटो सुरक्षित रखें'
                : 'Capture and organize oral images for doctor reference and tracking'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            id="btn-close-scanner"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Strict Medical Disclaimer Notice */}
      <div
        id="scanner-medical-disclaimer-banner"
        className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs"
      >
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-[12px] text-amber-900">
            Photo documentation only — this image is not a diagnosis.
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {isHindi
              ? 'यह तस्वीर केवल आपके व्यक्तिगत रिकॉर्ड और डॉक्टर को दिखाने के लिए है। ऐप तस्वीर से कैंसर या किसी बीमारी का स्वचालित निदान नहीं करता है।'
              : 'Oral images are stored for personal progress tracking and clinical handoff with your dentist. This tool does not perform automated clinical diagnosis from images.'}
          </p>
        </div>
      </div>

      {/* Top Tab Switcher: Documented Photos vs Add New */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            if (photos.length > 0) setMode('view_list');
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'view_list'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Saved Photos ({photos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('capture_active');
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'capture_active' || mode === 'preview_draft'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Capture / Upload New</span>
        </button>
      </div>

      {/* MODE 1: ACTIVE CAPTURE / CAMERA VIEWFINDER */}
      {mode === 'capture_active' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Camera Viewfinder</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
                  setFacingMode(nextFacing);
                  startCamera(nextFacing);
                }}
                title="Switch Camera"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs flex items-center gap-1 cursor-pointer"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Flip</span>
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <Camera className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
                <p className="text-xs max-w-xs">{cameraError || 'Opening camera viewfinder...'}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-4 bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-teal-700 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image File</span>
                </button>
              </div>
            )}

            {/* Target reticle / guidelines */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-white/60 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                    Align Oral Area
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lighting & capture tips */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Tip: Use adequate lighting, open mouth wide, and keep phone steady 10-15 cm away.
            </span>
          </div>

          {/* Primary Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            {isCameraActive && (
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                id="btn-capture-shutter"
                className="w-full sm:flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              id="btn-upload-file-scanner"
              className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Choose from Device / Gallery</span>
            </button>

            {/* Hidden file input supporting file selection & native camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* MODE 2: PREVIEW DRAFT & METADATA ATTACHMENT */}
      {mode === 'preview_draft' && draftImage && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-600" />
              <span>Review Photo Documentation</span>
            </span>

            <button
              type="button"
              onClick={handleClearDraft}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          </div>

          {/* Photo Preview Frame */}
          <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
            <img
              src={draftImage}
              alt="Mouth Documentation Preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Replace / Retake options */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRetake}
              id="btn-retake-photo"
              className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Retake / Replace</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Captured: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Associate with Mouth Map Location */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Associate Mouth Location (Optional)</span>
              </label>

              {onOpenMouthMap && (
                <button
                  type="button"
                  onClick={onOpenMouthMap}
                  className="text-[11px] text-teal-700 hover:underline font-medium cursor-pointer"
                >
                  Open Mouth Map
                </button>
              )}
            </div>

            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              id="select-photo-location"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="">-- Select Anatomical Location (Optional) --</option>
              {Object.values(ORAL_REGIONS).map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.hindiName.split('(')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Optional Short Note */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-800 block">
              Optional Note / Patient Observation
            </label>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTE_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setDraftNote((prev) => (prev ? `${prev}, ${sug}` : sug));
                  }}
                  className="text-[10.5px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  + {sug}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="e.g. Small white patch on inner left cheek, painful when drinking tea..."
              id="input-photo-note"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePhoto}
              id="btn-save-photo-documentation"
              className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Photo Documentation</span>
            </button>

            <button
              type="button"
              onClick={handleClearDraft}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: LIST OF SAVED DOCUMENTED PHOTOS */}
      {mode === 'view_list' && (
        <div className="space-y-3">
          {photos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <Camera className="w-10 h-10 mx-auto text-slate-300" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No oral photos documented yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Take a photo of any ulcer, color change, or swelling to keep track of changes for your dental visit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode('capture_active')}
                className="py-2.5 px-4 bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-teal-700 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Capture First Photo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Documented Oral Records ({photos.length})
                </span>
                <button
                  type="button"
                  onClick={() => setMode('capture_active')}
                  className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photos.map((item, idx) => {
                  const regionObj = item.location ? ORAL_REGIONS[item.location] : null;
                  const locLabel = item.locationName || (regionObj ? regionObj.name : 'Oral Area');

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-3 space-y-2">
                        {/* Image Thumbnail */}
                        <div
                          onClick={() => setViewingPhotoDetail(item)}
                          className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden cursor-pointer group"
                        >
                          <img
                            src={item.imageData}
                            alt={`Oral Record ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                            <Eye className="w-4 h-4" />
                            <span>View Full</span>
                          </div>
                        </div>

                        {/* Location Tag */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="truncate">{locLabel}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(item.capturedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Note */}
                        {item.note ? (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            "{item.note}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">No clinical notes attached</p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setViewingPhotoDetail(item)}
                          className="text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeletePhoto(item.id)}
                          title="Delete Photo Record"
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Photo Inspection Modal */}
      {viewingPhotoDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold">Oral Photo Documentation Detail</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={viewingPhotoDetail.imageData}
                  alt="Full Documentation View"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Associated Location:</span>
                  <span className="font-bold text-slate-900">
                    {viewingPhotoDetail.locationName || viewingPhotoDetail.location || 'General Oral Cavity'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Recorded Timestamp:</span>
                  <span>{new Date(viewingPhotoDetail.capturedAt).toLocaleString()}</span>
                </div>

                {viewingPhotoDetail.note && (
                  <div className="pt-1">
                    <span className="font-semibold text-slate-500 block">Observation Note:</span>
                    <p className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs">
                      {viewingPhotoDetail.note}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Photo documentation only. Share this image during your clinical dental examination for lesion evaluation.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPhotoDetail(null)}
                className="py-2 px-4 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
