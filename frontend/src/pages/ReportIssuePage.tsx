import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MapPin, Camera, AlertTriangle, CheckCircle2, ArrowRight, Shield, ThumbsUp, X } from 'lucide-react';
import { CampusMap } from '../components/CampusMap';
import { CAMPUS_LANDMARKS, findNearestLandmark, CAMPUS_CENTER } from '../utils/campusLocations';
import {
  classifyTextWithAI,
  checkNearbyDuplicates,
  uploadPhotoFile,
  createComplaint,
  upvoteComplaint
} from '../api/client';
import { AIClassificationResult, NearbyDuplicate, ComplaintCategory } from '../types';

interface ReportIssuePageProps {
  onSuccessNavigate: (ticketId: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Streetlights & Electrical',
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Water & Plumbing',
  'Campus Safety & Security',
  'Infrastructure & Facilities',
  'Other'
];

export const ReportIssuePage: React.FC<ReportIssuePageProps> = ({ onSuccessNavigate }) => {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [priority, setPriority] = useState<string>('Medium');
  const [locationName, setLocationName] = useState(CAMPUS_LANDMARKS[0].name);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number }>({
    lat: CAMPUS_LANDMARKS[0].latitude,
    lng: CAMPUS_LANDMARKS[0].longitude,
  });
  const [hasInteractedLocation, setHasInteractedLocation] = useState(false);
  const [isSensitive, setIsSensitive] = useState(false);
  const [reportedBy, setReportedBy] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI & Detection State
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [nearbyDuplicates, setNearbyDuplicates] = useState<NearbyDuplicate[]>([]);
  const [dismissDuplicateAlert, setDismissDuplicateAlert] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounced AI classification as user types description or title
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const combinedText = `${title}. ${description}`.trim();
    if (combinedText.length < 10) {
      setAiResult(null);
      return;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsClassifying(true);
        const res = await classifyTextWithAI(combinedText);
        setAiResult(res);
        // If user hasn't manually picked a category yet, auto-suggest
        if (!category) {
          setCategory(res.category);
          setPriority(res.suggested_priority);
        }
      } catch (err) {
        console.error('AI classification error:', err);
      } finally {
        setIsClassifying(false);
      }
    }, 600);

    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [title, description]);

  // Check for nearby duplicates when student chooses or changes location
  useEffect(() => {
    if (!hasInteractedLocation) return;
    const checkProximity = async () => {
      try {
        const res = await checkNearbyDuplicates(locationCoords.lat, locationCoords.lng, category, 85);
        if (res.has_duplicates) {
          setNearbyDuplicates(res.nearby_issues);
          setDismissDuplicateAlert(false);
        } else {
          setNearbyDuplicates([]);
        }
      } catch (err) {
        console.error('Proximity check failed:', err);
      }
    };
    checkProximity();
  }, [locationCoords, category, hasInteractedLocation]);

  // Handle map click
  const handleMapLocationSelect = (loc: { lat: number; lng: number }) => {
    setHasInteractedLocation(true);
    setLocationCoords(loc);
    const nearest = findNearestLandmark(loc.lat, loc.lng);
    setLocationName(`Near ${nearest.name} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
  };

  // Handle landmark dropdown select
  const handleLandmarkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHasInteractedLocation(true);
    const name = e.target.value;
    const lm = CAMPUS_LANDMARKS.find((l) => l.name === name);
    if (lm) {
      setLocationName(lm.name);
      setLocationCoords({ lat: lm.latitude, lng: lm.longitude });
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upvote duplicate directly
  const handleUpvoteDuplicate = async (dupId: string) => {
    try {
      await upvoteComplaint(dupId);
      onSuccessNavigate(dupId);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide an issue title and description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      let uploadedImageUrl: string | undefined = undefined;
      if (imageFile) {
        try {
          uploadedImageUrl = await uploadPhotoFile(imageFile);
        } catch (uploadErr) {
          console.warn('Image upload failed, proceeding with default:', uploadErr);
        }
      }

      const res = await createComplaint({
        title: title.trim(),
        description: description.trim(),
        category: category || (aiResult ? aiResult.category : 'Other'),
        priority: priority || (aiResult ? aiResult.suggested_priority : 'Medium'),
        latitude: locationCoords.lat,
        longitude: locationCoords.lng,
        location_name: locationName,
        image_url: uploadedImageUrl,
        reported_by: isAnonymous ? 'Anonymous Student' : reportedBy.trim() || 'Anonymous Student',
        is_sensitive: isSensitive
      } as any);

      setCreatedTicket(res.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report. Please verify connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Mody University • AI-Assisted Issue Reporting
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Report a Campus Issue (Laxmangarh)</h1>
        <p className="text-slate-600 text-sm mt-1">
          Spotted a broken streetlight, damaged road paver, water cooler issue, or hostel defect? Report it directly to the Mody University Estate Office.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Proximity Duplicate Warning Alert */}
      {nearbyDuplicates.length > 0 && !dismissDuplicateAlert && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs relative">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-sm">
                Similar Issue Already Reported Nearby!
              </h4>
              <p className="text-amber-700 text-xs mt-0.5">
                Our geo-clustering AI detected an active complaint within {nearbyDuplicates[0].distance_meters} meters.
                Upvoting existing reports escalates their priority faster rather than creating duplicates.
              </p>

              <div className="mt-3 space-y-2">
                {nearbyDuplicates.slice(0, 2).map((dup) => (
                  <div
                    key={dup.id}
                    className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-800">#{dup.id}</span> —{' '}
                      <span className="font-semibold text-slate-800">{dup.title}</span>
                      <span className="text-slate-500 ml-1">({dup.distance_meters}m away)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpvoteDuplicate(dup.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs shadow-xs"
                      >
                        <ThumbsUp className="w-3 h-3" /> Upvote #{dup.id}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSuccessNavigate(dup.id)}
                        className="text-xs text-amber-800 hover:underline"
                      >
                        View &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setDismissDuplicateAlert(true)}
              className="text-amber-500 hover:text-amber-800 p-1"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1.5">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Broken streetlight flickering outside Hostel Block 4"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            required
          />
        </div>

        {/* Description & Live AI Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-900">
              Description <span className="text-rose-500">*</span>
            </label>
            {isClassifying && (
              <span className="text-xs text-purple-600 flex items-center gap-1 font-medium animate-pulse">
                <Sparkles className="w-3 h-3" /> AI Analyzing...
              </span>
            )}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what is broken, hazards, how long it has been there, and exact visual cues..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
            required
          />

          {/* AI Suggestion Pill */}
          {aiResult && (
            <div className="mt-2.5 p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs flex items-start gap-3 animate-fadeIn">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-purple-900">AI Suggested Category:</span>
                  <span className="font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    {aiResult.category}
                  </span>
                  <span className="text-purple-600">({Math.round(aiResult.confidence * 100)}% match)</span>
                  <span className="text-purple-500">•</span>
                  <span className="font-medium text-slate-700">Urgency: <span className="font-semibold text-rose-700">{aiResult.suggested_priority}</span></span>
                </div>
                <p className="text-purple-700 mt-1 text-[11px]">{aiResult.reasoning}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategory(aiResult.category);
                  setPriority(aiResult.suggested_priority);
                }}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-300 shrink-0 shadow-xs"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Category & Priority Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">Select or let AI auto-detect</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Severity / Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="Low">Low — Minor cosmetic or non-blocking</option>
              <option value="Medium">Medium — General inconvenience</option>
              <option value="High">High — Disruption or hazard</option>
              <option value="Critical">Critical — Immediate safety danger / flooding</option>
            </select>
          </div>
        </div>

        {/* Location Section */}
        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-900 mb-1.5">
            Campus Location <span className="text-rose-500">*</span>
          </label>

          <div className="mb-3">
            <select
              value={CAMPUS_LANDMARKS.some((l) => l.name === locationName) ? locationName : ''}
              onChange={handleLandmarkSelect}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">Choose nearest campus landmark or tap on map below</option>
              {CAMPUS_LANDMARKS.map((lm) => (
                <option key={lm.name} value={lm.name}>
                  {lm.name} ({lm.category})
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Leaflet Pin Picker */}
          <CampusMap
            mode="picker"
            selectedLocation={locationCoords}
            onLocationSelect={handleMapLocationSelect}
            height="260px"
          />

          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-medium text-slate-700">Selected:</span>
            <span className="truncate">{locationName}</span>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-900 mb-1.5">
            Attach Photo (Optional)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              <Camera className="w-4 h-4 text-slate-500" />
              <span>Choose Photo or Take Picture</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reporter Info */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-900">Reporter Details</label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Submit Anonymously</span>
            </label>
          </div>

          {!isAnonymous && (
            <input
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Your Name / Student ID / Dept (e.g., Sneha Sharma, Mech '25)"
              className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Registering Ticket...</span>
            ) : (
              <>
                <span>Submit Complaint to Estate Office</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {createdTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">Issue Registered!</h3>
            <p className="text-slate-600 text-xs mt-1">
              Your complaint has been submitted and queued for the campus maintenance crew.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500">Your Tracking Ticket</span>
              <div className="font-mono text-3xl font-extrabold text-brand-600 mt-1">
                #{createdTicket}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => onSuccessNavigate(createdTicket)}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                Track Ticket Status &rarr;
              </button>
              <button
                onClick={() => {
                  setCreatedTicket(null);
                  setTitle('');
                  setDescription('');
                  setImageFile(null);
                  setImagePreview(null);
                  setAiResult(null);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
