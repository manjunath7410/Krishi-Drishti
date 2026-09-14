import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { plotService } from '../src/services/api';
import useGeolocation from '../src/hooks/useGeolocation';
import {
    formatCoordinatePair,
    calculatePolygonAreaSqM,
    calculatePerimeterMeters,
    calculateDistanceMeters,
    calculateEdges,
    convertArea,
    simplifyDouglasPeucker,
    computeGpsAverage,
    exportToGeoJSON,
    exportToKML,
    EdgeDetail
} from '../src/utils/geoFormatters';
import {
    ArrowLeft,
    MapPin,
    Play,
    Square,
    Search,
    Loader2,
    Hand,
    Footprints,
    FileSearch,
    Upload,
    CheckCircle2,
    Sparkles,
    Ruler,
    Trash2,
    Undo2,
    Navigation,
    Layers,
    Shield,
    FileText,
    User,
    Hash,
    X,
    Trees,
    Compass,
    HelpCircle,
    Download,
    Eye,
    Plus,
    RotateCw,
    Maximize2,
    Check,
    ChevronRight,
    Award,
    Activity,
    Info
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon Issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Corner Pin Icon with Numbering
const createCornerIcon = (number: number, isSelected = false) => {
    return L.divIcon({
        className: 'custom-corner-marker',
        html: `
            <div style="
                background: ${isSelected ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #047857)'};
                width: 34px;
                height: 34px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 14px rgba(0,0,0,0.45);
                border: 3px solid white;
                cursor: grab;
            ">
                <div style="
                    transform: rotate(45deg);
                    color: white;
                    font-weight: 900;
                    font-size: 12px;
                    font-family: system-ui, sans-serif;
                ">${number}</div>
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
    });
};

// Custom Midpoint '+' Icon to add vertices
const createMidpointIcon = () => {
    return L.divIcon({
        className: 'midpoint-marker',
        html: `
            <div style="
                background: white;
                color: #059669;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                border: 2px solid #10b981;
                font-weight: 900;
                font-size: 14px;
                line-height: 1;
                cursor: pointer;
            ">+</div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
    });
};

const pulsingUserIcon = L.divIcon({
    className: 'pulsing-user-marker',
    html: `
        <div style="position: relative; width: 26px; height: 26px;">
            <div style="
                position: absolute;
                inset: 0;
                background: rgba(59, 130, 246, 0.4);
                border-radius: 50%;
                animation: pulse-ring 2s ease-out infinite;
            "></div>
            <div style="
                position: absolute;
                inset: 4px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6);
            "></div>
        </div>
        <style>
            @keyframes pulse-ring {
                0% { transform: scale(0.8); opacity: 1; }
                100% { transform: scale(2.6); opacity: 0; }
            }
        </style>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

interface LandMarkingScreenProps {
    navigation: { goBack: () => void; goToAuth: () => void };
}

type Mode = 'peg' | 'walk' | 'tap' | 'survey';
type UnitType = 'acres' | 'hectares' | 'guntha' | 'bigha' | 'sqMeters';

// Sound effect synthesizer for corner lock confirmation
const playPinDropChime = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch {
        // AudioContext not allowed or unsupported
    }
};

const MapEvents = ({ onMapClick }: { onMapClick: (e: any) => void }) => {
    useMapEvents({ click: onMapClick });
    return null;
};

const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 18, { duration: 1.2 });
    }, [lat, lng]);
    return null;
};

const LandMarkingScreen: React.FC<LandMarkingScreenProps> = ({ navigation }) => {
    const [mode, setMode] = useState<Mode>('peg');
    const [markers, setMarkers] = useState<[number, number][]>([]);
    const [pathCoordinates, setPathCoordinates] = useState<[number, number][]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [selectedMarkerIdx, setSelectedMarkerIdx] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<UnitType>('acres');
    const [surveyNumber, setSurveyNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [mapType, setMapType] = useState<'satellite' | 'street' | 'terrain'>('satellite');
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'good' | 'poor' | 'denied'>('acquiring');
    const [initialLocationSet, setInitialLocationSet] = useState(false);
    const [walkDistance, setWalkDistance] = useState(0);
    const [walkSpeed, setWalkSpeed] = useState<number | null>(null);

    // Multi-sample GPS averaging state for Corner Peg mode
    const [isAveraging, setIsAveraging] = useState(false);
    const [averageProgress, setAverageProgress] = useState(0);
    const [gpsSamples, setGpsSamples] = useState<{ lat: number; lng: number; accuracy: number }[]>([]);

    // Modals
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showEdgeDetails, setShowEdgeDetails] = useState(false);

    // Save Form Details
    const [ownerName, setOwnerName] = useState('');
    const [gutNumber, setGutNumber] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [manualArea, setManualArea] = useState('');
    const [cropType, setCropType] = useState('Sugarcane');

    const { startTracking, stopTracking, getCurrentLocation } = useGeolocation();

    // Initial GPS lock
    useEffect(() => {
        setGpsStatus('acquiring');
        getCurrentLocation().then((pos) => {
            if (pos) {
                const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setCurrentLocation(loc);
                setInitialLocationSet(true);
                setGpsAccuracy(Math.round(pos.coords.accuracy));
                setGpsStatus(pos.coords.accuracy <= 15 ? 'good' : 'poor');
            } else {
                setGpsStatus('denied');
            }
        }).catch(() => {
            setGpsStatus('denied');
        });

        return () => {
            stopTracking();
        };
    }, []);

    // Calculate Geodesic Area & Multi-Unit metrics
    const activePoints = mode === 'walk' && isTracking ? pathCoordinates : markers;
    const currentAreaSqM = useMemo(() => calculatePolygonAreaSqM(activePoints), [activePoints]);
    const areaMetrics = useMemo(() => convertArea(currentAreaSqM), [currentAreaSqM]);
    const perimeterM = useMemo(() => calculatePerimeterMeters(activePoints), [activePoints]);
    const perimeterFt = perimeterM * 3.28084;
    const edgeDetails: EdgeDetail[] = useMemo(() => calculateEdges(markers), [markers]);

    // Check if live walking trail is close to closing the loop (within 6 meters of Point #1)
    const isCloseToLoopStart = useMemo(() => {
        if (mode !== 'walk' || !isTracking || pathCoordinates.length < 8) return false;
        const startPt = pathCoordinates[0];
        const lastPt = pathCoordinates[pathCoordinates.length - 1];
        const dist = calculateDistanceMeters(startPt, lastPt);
        return dist <= 7.0;
    }, [mode, isTracking, pathCoordinates]);

    // MAP CLICK HANDLER (for Tap mode)
    const handleMapClick = (e: any) => {
        if (mode === 'tap') {
            const { lat, lng } = e.latlng;
            setMarkers(current => [...current, [lat, lng]]);
            playPinDropChime();
        }
    };

    // CORNER PEG MODE: High-accuracy multi-sample GPS lock
    const handleLockCornerPeg = async () => {
        if (!currentLocation) {
            alert("Waiting for GPS lock. Please ensure location permissions are enabled.");
            return;
        }

        setIsAveraging(true);
        setAverageProgress(10);
        const collected: { lat: number; lng: number; accuracy: number }[] = [];

        // Sample GPS rapidly 8 times over 2.5 seconds to filter out jitter
        const interval = setInterval(async () => {
            try {
                const pos = await getCurrentLocation();
                if (pos) {
                    collected.push({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    });
                    setAverageProgress(prev => Math.min(prev + 18, 95));
                }
            } catch {
                // Ignore transient sample error
            }
        }, 300);

        setTimeout(() => {
            clearInterval(interval);
            setAverageProgress(100);

            // If we got samples, calculate statistical weighted average; otherwise use current location
            if (collected.length > 0) {
                const avg = computeGpsAverage(collected);
                setMarkers(prev => [...prev, [avg.lat, avg.lng]]);
                setGpsAccuracy(Math.round(avg.avgAccuracy));
            } else if (currentLocation) {
                setMarkers(prev => [...prev, currentLocation]);
            }

            playPinDropChime();
            setTimeout(() => {
                setIsAveraging(false);
                setAverageProgress(0);
            }, 300);
        }, 2200);
    };

    // LIVE PERIMETER WALK MODE TRACKER
    const toggleTracking = () => {
        if (isTracking) {
            stopTracking();
            setIsTracking(false);

            if (pathCoordinates.length >= 3) {
                // Auto-simplify walked path to remove GPS jitter
                const simplified = simplifyDouglasPeucker(pathCoordinates, 2.5);
                setMarkers(simplified);
            }
        } else {
            setPathCoordinates([]);
            setWalkDistance(0);
            setIsTracking(true);

            startTracking((position) => {
                const newCoord: [number, number] = [position.coords.latitude, position.coords.longitude];
                setGpsAccuracy(Math.round(position.coords.accuracy));
                setGpsStatus(position.coords.accuracy <= 15 ? 'good' : 'poor');
                if (position.coords.speed !== null && position.coords.speed !== undefined) {
                    setWalkSpeed(Number((position.coords.speed * 3.6).toFixed(1))); // convert m/s to km/h
                }
                setCurrentLocation(newCoord);

                setPathCoordinates(prev => {
                    if (prev.length === 0) return [newCoord];
                    const last = prev[prev.length - 1];
                    const stepDist = calculateDistanceMeters(last, newCoord);
                    // Filter out micro-jitter (< 1.8 meters) to keep trail clean
                    if (stepDist >= 1.8 && stepDist < 40) {
                        setWalkDistance(d => d + stepDist);
                        return [...prev, newCoord];
                    }
                    return prev;
                });
            });
        }
    };

    // Simplify trail on demand
    const handleSimplifyTrail = () => {
        if (markers.length < 4) return;
        const simplified = simplifyDouglasPeucker(markers, 3.5);
        setMarkers(simplified);
        alert(`✨ Boundary cleaned! Simplified from ${markers.length} points down to ${simplified.length} crisp corner pegs.`);
    };

    // Draggable vertex updates
    const handleMarkerDrag = (idx: number, e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setMarkers(prev => {
            const next = [...prev];
            next[idx] = [lat, lng];
            return next;
        });
    };

    // Add midpoint vertex
    const handleAddMidpoint = (idx: number, midpoint: [number, number]) => {
        setMarkers(prev => {
            const next = [...prev];
            next.splice(idx + 1, 0, midpoint);
            return next;
        });
        playPinDropChime();
    };

    // Delete single vertex
    const handleDeleteVertex = (idx: number) => {
        setMarkers(prev => prev.filter((_, i) => i !== idx));
        setSelectedMarkerIdx(null);
    };

    const handleUndo = () => {
        setMarkers(current => current.slice(0, -1));
        setSelectedMarkerIdx(null);
    };

    const handleClear = () => {
        if (confirm("Clear all marked boundary pins?")) {
            setMarkers([]);
            setPathCoordinates([]);
            setSelectedMarkerIdx(null);
        }
    };

    // Survey / Location Search
    const fetchBySurveyNumber = async () => {
        if (!surveyNumber.trim()) return;
        setLoading(true);
        try {
            const query = encodeURIComponent(surveyNumber);
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);

            if (res.data && res.data.length > 0) {
                const lat = parseFloat(res.data[0].lat);
                const lon = parseFloat(res.data[0].lon);
                setCurrentLocation([lat, lon]);
                setMarkers([]);
                alert(`📍 Centered on: ${res.data[0].display_name.split(',').slice(0, 3).join(',')}`);
            } else {
                alert("Location not found. Try entering Village, Taluka or District name.");
            }
        } catch {
            alert("Could not fetch location details.");
        } finally {
            setLoading(false);
        }
    };

    // Drop instant standard farm geometry template at current center
    const handleDropPresetGeometry = (acres: number, shape: 'square' | 'rectangle') => {
        if (!currentLocation) {
            alert("Please acquire GPS location first.");
            return;
        }
        const [centerLat, centerLng] = currentLocation;
        const totalSqM = acres * 4046.86;
        let widthM = Math.sqrt(totalSqM);
        let heightM = Math.sqrt(totalSqM);

        if (shape === 'rectangle') {
            widthM = Math.sqrt(totalSqM * 1.6);
            heightM = totalSqM / widthM;
        }

        const latDelta = (heightM / 2) / 111320;
        const lngDelta = (widthM / 2) / (111320 * Math.cos(centerLat * Math.PI / 180));

        const presetCorners: [number, number][] = [
            [centerLat + latDelta, centerLng - lngDelta],
            [centerLat + latDelta, centerLng + lngDelta],
            [centerLat - latDelta, centerLng + lngDelta],
            [centerLat - latDelta, centerLng - lngDelta],
        ];

        setMarkers(presetCorners);
        playPinDropChime();
    };

    // Open Save / Verification Modal
    const handleSaveClick = () => {
        let finalPoints = markers;
        if (mode === 'walk' && isTracking) {
            stopTracking();
            setIsTracking(false);
            finalPoints = simplifyDouglasPeucker(pathCoordinates, 2.5);
            setMarkers(finalPoints);
        }

        if (finalPoints.length < 3) {
            alert("Please mark at least 3 corner points to define a closed field boundary.");
            return;
        }

        const sqM = calculatePolygonAreaSqM(finalPoints);
        const acres = sqM * 0.000247105;
        setManualArea(acres.toFixed(2));
        setShowSaveModal(true);
    };

    // Save Farm Boundary to Backend
    const handleConfirmSave = async () => {
        if (!ownerName || !gutNumber) {
            alert("Please provide Owner Name and Gut / Survey Number to verify ownership.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('ks_token');
            if (!token) {
                alert("Please log in first to save your farm boundary.");
                setShowSaveModal(false);
                navigation.goToAuth();
                return;
            }

            let finalAreaHa = 0;
            const calculatedSqM = calculatePolygonAreaSqM(markers);

            if (manualArea && !isNaN(parseFloat(manualArea))) {
                finalAreaHa = parseFloat(manualArea) * 0.404686;
            } else {
                finalAreaHa = calculatedSqM / 10000;
            }

            const payload = {
                name: `${ownerName}'s Farm (Gut ${gutNumber})`,
                coordinates: markers.map(m => ({ lat: m[0], lng: m[1] })),
                area: parseFloat(finalAreaHa.toFixed(2)),
                crop_type: cropType
            };

            await plotService.createPlot(payload);

            alert(`✅ Farm Boundary Saved Successfully!\n\n🌾 Land Size: ${areaMetrics.acres.toFixed(2)} Acres (${areaMetrics.guntha.toFixed(1)} Guntha / ${finalAreaHa.toFixed(2)} Ha)\n📋 Verification Request Created for Gut No. ${gutNumber}.`);
            setShowSaveModal(false);
            navigation.goBack();
        } catch (error) {
            console.error(error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    localStorage.removeItem('ks_token');
                    alert("Please log in again to save your farm boundary.");
                    setShowSaveModal(false);
                    navigation.goToAuth();
                    return;
                }
            }
            alert("Boundary saved to local cache successfully!");
            setShowSaveModal(false);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    // Download GeoJSON / KML
    const handleDownloadFile = (type: 'geojson' | 'kml') => {
        const farmName = ownerName ? `${ownerName}_Farm_Boundary` : 'Krishi_Drishti_Farm_Boundary';
        let content = '';
        let filename = '';
        let mimeType = '';

        if (type === 'geojson') {
            content = exportToGeoJSON(farmName, markers, areaMetrics.acres);
            filename = `${farmName}.geojson`;
            mimeType = 'application/geo+json';
        } else {
            content = exportToKML(farmName, markers, areaMetrics.acres);
            filename = `${farmName}.kml`;
            mimeType = 'application/vnd.google-earth.kml+xml';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Format display string for active unit
    const formattedAreaDisplay = useMemo(() => {
        switch (selectedUnit) {
            case 'acres':
                return { val: areaMetrics.acres.toFixed(2), unit: 'Acres', sub: `${areaMetrics.guntha.toFixed(1)} Guntha • ${areaMetrics.hectares.toFixed(2)} Ha` };
            case 'hectares':
                return { val: areaMetrics.hectares.toFixed(2), unit: 'Hectares', sub: `${areaMetrics.acres.toFixed(2)} Acres • ${areaMetrics.guntha.toFixed(1)} Guntha` };
            case 'guntha':
                return { val: areaMetrics.guntha.toFixed(1), unit: 'Guntha', sub: `${areaMetrics.acres.toFixed(2)} Acres • 1 ac = 40 gn` };
            case 'bigha':
                return { val: areaMetrics.bigha.toFixed(2), unit: 'Bigha', sub: `${areaMetrics.acres.toFixed(2)} Acres • Standard MP/UP/RJ` };
            case 'sqMeters':
                return { val: Math.round(areaMetrics.sqMeters).toLocaleString(), unit: 'm²', sub: `${(areaMetrics.sqFeet).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` };
        }
    }, [selectedUnit, areaMetrics]);

    return (
        <div className="h-full bg-gray-950 flex flex-col relative z-50 overflow-hidden font-sans select-none">
            {/* ========== TOP CONTROL BAR ========== */}
            <motion.div
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                className="absolute top-0 left-0 right-0 z-[500] p-3 sm:p-4"
            >
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={navigation.goBack}
                            className="p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl text-gray-700 transition-all shadow-sm"
                            title="Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm sm:text-base font-black bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                                    Land Boundary Locator
                                </h2>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block">
                                    RTK-Averaged GPS
                                </span>
                            </div>

                            {/* Live Accuracy Meter Bar */}
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                    {gpsStatus === 'acquiring' && (
                                        <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-700">Acquiring GPS Signal…</span></>
                                    )}
                                    {gpsStatus === 'good' && (
                                        <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" /><span className="text-emerald-700 font-black">GPS Accuracy: ±{gpsAccuracy}m (Precision Ready)</span></>
                                    )}
                                    {gpsStatus === 'poor' && (
                                        <><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-amber-700">Fair GPS (±{gpsAccuracy}m) — Stand under open sky</span></>
                                    )}
                                    {gpsStatus === 'denied' && (
                                        <><span className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-rose-700">GPS Access Blocked</span></>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setShowGuideModal(true)}
                            className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-emerald-200 shadow-sm"
                            title="Which boundary method is best?"
                        >
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Best Method Guide</span>
                            <span className="sm:hidden">Guide</span>
                        </button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSaveClick}
                            disabled={(mode === 'walk' && isTracking) ? pathCoordinates.length < 3 : markers.length < 3}
                            className="relative bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3.5 py-2 rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 overflow-hidden"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>SAVE BOUNDARY</span>
                            {markers.length >= 3 && (
                                <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                />
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* ========== MAP CONTAINER ========== */}
            <div className="flex-1 relative">
                <MapContainer
                    center={currentLocation || [21.1458, 79.0882]}
                    zoom={18}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url={mapType === 'satellite'
                            ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            : mapType === 'terrain'
                                ? "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        }
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />

                    <MapEvents onMapClick={handleMapClick} />

                    {currentLocation && !isTracking && initialLocationSet && (
                        <RecenterMap lat={currentLocation[0]} lng={currentLocation[1]} />
                    )}

                    {/* Draggable Corner Markers */}
                    {markers.map((pos, idx) => (
                        <Marker
                            key={`corner-${idx}`}
                            position={pos}
                            draggable={true}
                            icon={createCornerIcon(idx + 1, selectedMarkerIdx === idx)}
                            eventHandlers={{
                                click: () => setSelectedMarkerIdx(idx),
                                dragend: (e) => handleMarkerDrag(idx, e),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -28]} opacity={0.9}>
                                <div className="font-sans text-[11px] font-bold text-gray-800">
                                    Corner #{idx + 1}
                                    <div className="text-[9px] text-gray-500 font-normal">
                                        {formatCoordinatePair(pos[0], pos[1], 5)}
                                    </div>
                                    <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                                        💡 Hold & drag to fine-tune
                                    </div>
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}

                    {/* Midpoint '+' markers to insert corner points on edges */}
                    {markers.length >= 2 && edgeDetails.map((edge, idx) => (
                        <Marker
                            key={`mid-${idx}`}
                            position={edge.midpoint}
                            icon={createMidpointIcon()}
                            eventHandlers={{
                                click: () => handleAddMidpoint(edge.fromIdx, edge.midpoint)
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -10]}>
                                <div className="text-[10px] font-bold text-emerald-700">
                                    + Add Corner Here ({edge.distanceMeters.toFixed(1)}m edge)
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}

                    {/* Enclosed Farm Boundary Polygon */}
                    {markers.length > 2 && (
                        <Polygon
                            positions={markers}
                            pathOptions={{
                                color: '#10b981',
                                fillColor: '#34d399',
                                fillOpacity: 0.38,
                                weight: 3.5,
                                dashArray: '6, 4'
                            }}
                        />
                    )}

                    {/* Walked breadcrumb trail in Walk Mode */}
                    {pathCoordinates.length > 1 && (
                        <Polyline
                            positions={pathCoordinates}
                            pathOptions={{
                                color: isCloseToLoopStart ? '#10b981' : '#f59e0b',
                                weight: 5,
                                opacity: 0.95,
                                dashArray: isCloseToLoopStart ? undefined : '8, 6'
                            }}
                        />
                    )}

                    {/* Live user GPS blue dot */}
                    {currentLocation && (
                        <Marker position={currentLocation} icon={pulsingUserIcon} />
                    )}
                </MapContainer>

                {/* ========== LIVE AREA BADGE & UNIT SELECTOR (TOP RIGHT) ========== */}
                <AnimatePresence>
                    {(markers.length >= 3 || (mode === 'walk' && pathCoordinates.length >= 3)) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                            className="absolute top-20 right-3 sm:right-4 z-[400]"
                        >
                            <div className="bg-gradient-to-br from-emerald-800 to-green-900 text-white rounded-2xl shadow-2xl p-3 border border-emerald-400/40 min-w-[160px] sm:min-w-[190px]">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Ruler className="w-3.5 h-3.5 text-emerald-300" />
                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200">
                                            Field Area
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowEdgeDetails(!showEdgeDetails)}
                                        className="text-[9px] font-bold bg-emerald-700/60 hover:bg-emerald-700 px-1.5 py-0.5 rounded text-emerald-100 transition-colors flex items-center gap-0.5"
                                    >
                                        <Activity size={10} />
                                        <span>Edges</span>
                                    </button>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                        {formattedAreaDisplay.val}
                                    </span>
                                    <span className="text-xs font-black text-emerald-300">
                                        {formattedAreaDisplay.unit}
                                    </span>
                                </div>

                                <div className="text-[10px] text-emerald-200/90 font-semibold mt-0.5 truncate">
                                    {formattedAreaDisplay.sub}
                                </div>

                                {/* Unit Switcher Chips */}
                                <div className="mt-2 pt-2 border-t border-emerald-700/60 grid grid-cols-4 gap-1">
                                    {(['acres', 'guntha', 'hectares', 'bigha'] as const).map((unit) => (
                                        <button
                                            key={unit}
                                            onClick={() => setSelectedUnit(unit)}
                                            className={`text-[9px] font-black py-0.5 rounded uppercase tracking-wider transition-all ${selectedUnit === unit
                                                ? 'bg-amber-400 text-gray-950 shadow-sm'
                                                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-700/50'
                                                }`}
                                        >
                                            {unit === 'acres' ? 'Acre' : unit === 'guntha' ? 'Guntha' : unit === 'hectares' ? 'Ha' : 'Bigha'}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-200 font-bold">
                                    <span>Perimeter:</span>
                                    <span className="text-white font-black">{perimeterM.toFixed(1)} m ({perimeterFt.toFixed(0)} ft)</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== EDGE DETAILS OVERLAY ========== */}
                <AnimatePresence>
                    {showEdgeDetails && markers.length >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="absolute top-64 right-3 sm:right-4 z-[400] max-w-[220px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-3"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                    Boundary Segments
                                </h4>
                                <button
                                    onClick={() => setShowEdgeDetails(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {edgeDetails.map((edge, idx) => (
                                    <div
                                        key={idx}
                                        className="text-[10px] bg-gray-50 border border-gray-100 rounded-lg p-1.5 flex items-center justify-between"
                                    >
                                        <span className="font-black text-emerald-800">
                                            Side {edge.fromIdx + 1} → {edge.toIdx + 1}
                                        </span>
                                        <span className="font-bold text-gray-700">
                                            {edge.distanceMeters.toFixed(1)}m ({edge.cardinal})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== VERTEX INSPECTOR (WHEN A MARKER IS SELECTED) ========== */}
                <AnimatePresence>
                    {selectedMarkerIdx !== null && markers[selectedMarkerIdx] && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-1/2 -translate-x-1/2 z-[450] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-500/30 px-4 py-2.5 flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                                #{selectedMarkerIdx + 1}
                            </div>
                            <div>
                                <div className="text-xs font-black text-gray-900">
                                    Corner #{selectedMarkerIdx + 1} Selected
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold font-mono">
                                    {formatCoordinatePair(markers[selectedMarkerIdx][0], markers[selectedMarkerIdx][1], 5)}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                                <button
                                    onClick={() => handleDeleteVertex(selectedMarkerIdx)}
                                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                                    title="Delete Corner"
                                >
                                    <Trash2 size={15} />
                                </button>
                                <button
                                    onClick={() => setSelectedMarkerIdx(null)}
                                    className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== MAP TYPE & UTILITY CONTROLS (RIGHT SIDE) ========== */}
                <div className="absolute right-3 sm:right-4 bottom-72 z-[400] flex flex-col gap-2">
                    <button
                        onClick={() => setMapType(mapType === 'satellite' ? 'street' : mapType === 'street' ? 'terrain' : 'satellite')}
                        className="w-10 h-10 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-white active:scale-95 transition-all border border-white/60"
                        title="Toggle Map Type (Satellite / Street / Terrain)"
                    >
                        <Layers size={18} />
                    </button>

                    <button
                        onClick={() => {
                            if (currentLocation) {
                                setInitialLocationSet(true);
                            }
                        }}
                        className="w-10 h-10 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center text-blue-600 hover:bg-white active:scale-95 transition-all border border-white/60"
                        title="Center on My GPS"
                    >
                        <Navigation size={18} />
                    </button>

                    {markers.length > 0 && (
                        <>
                            <button
                                onClick={handleUndo}
                                className="w-10 h-10 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 active:scale-95 transition-all border border-white/60"
                                title="Undo Last Point"
                            >
                                <Undo2 size={18} />
                            </button>

                            <button
                                onClick={handleClear}
                                className="w-10 h-10 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 active:scale-95 transition-all border border-white/60"
                                title="Clear All Pins"
                            >
                                <Trash2 size={18} />
                            </button>

                            <button
                                onClick={() => setShowExportModal(true)}
                                className="w-10 h-10 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center text-purple-600 hover:bg-purple-50 active:scale-95 transition-all border border-white/60"
                                title="Export GeoJSON / KML"
                            >
                                <Download size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* ========== FLOATING MODE SWITCHER (LEFT SIDE) ========== */}
                <motion.div
                    initial={{ x: -60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute top-20 left-3 sm:left-4 z-[400]"
                >
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1.5 border border-white/60">
                        {([
                            { id: 'peg', icon: MapPin, label: 'Corner Peg', tag: 'BEST', color: 'from-emerald-600 to-green-600' },
                            { id: 'walk', icon: Footprints, label: 'Live Walk', tag: 'AUTO', color: 'from-amber-500 to-orange-600' },
                            { id: 'tap', icon: Hand, label: 'Satellite Tap', tag: 'DRAG', color: 'from-blue-600 to-indigo-600' },
                            { id: 'survey', icon: FileSearch, label: 'Survey Presets', tag: 'GOV', color: 'from-purple-600 to-pink-600' },
                        ] as const).map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    if (mode !== m.id) {
                                        setMode(m.id);
                                        setSelectedMarkerIdx(null);
                                    }
                                }}
                                className={`relative flex flex-col items-center justify-center px-2.5 py-2 rounded-xl transition-all ${mode === m.id
                                    ? `bg-gradient-to-br ${m.color} text-white shadow-md font-black`
                                    : 'text-gray-600 hover:bg-gray-100 font-bold'
                                    }`}
                            >
                                <div className="relative">
                                    <m.icon size={18} />
                                    {m.tag && (
                                        <span className={`absolute -top-1.5 -right-3 text-[7px] font-black px-1 rounded-full ${mode === m.id ? 'bg-amber-300 text-gray-950' : 'bg-emerald-100 text-emerald-800'}`}>
                                            {m.tag}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[8.5px] uppercase tracking-wider mt-1 text-center whitespace-nowrap">
                                    {m.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ========== BOTTOM INTERACTIVE CONTROL DOCK ========== */}
                <motion.div
                    initial={{ y: 150 }}
                    animate={{ y: 0 }}
                    className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-[400]"
                >
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-2xl border border-white/60 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {/* MODE 1: CORNER PEG (HIGH-PRECISION GPS AVERAGING) */}
                            {mode === 'peg' && (
                                <motion.div
                                    key="peg"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                                                    <span>Corner Peg Multi-Sample Mode</span>
                                                    <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                                                        ★ Recommended for Farmers
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-semibold">
                                                    Walk to field corner boundary stone, stand still, and lock corner.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-emerald-700">{markers.length} Pins</span>
                                            <div className="text-[10px] font-bold text-gray-400">
                                                {markers.length >= 3 ? 'Polygon Closed ✓' : `Need ${3 - markers.length} more`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button: Lock Corner Pin with Progress Averaging */}
                                    <button
                                        onClick={handleLockCornerPeg}
                                        disabled={isAveraging}
                                        className={`w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 shadow-xl transition-all relative overflow-hidden ${isAveraging
                                            ? 'bg-amber-500'
                                            : 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-emerald-600/30 active:scale-[0.98]'
                                            }`}
                                    >
                                        {isAveraging ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="animate-spin" size={18} />
                                                <span>Averaging GPS Fixes ({averageProgress}%)…</span>
                                            </div>
                                        ) : (
                                            <>
                                                <MapPin size={18} />
                                                <span>LOCK CORNER PIN #{markers.length + 1} HERE</span>
                                            </>
                                        )}
                                        {isAveraging && (
                                            <div
                                                className="absolute bottom-0 left-0 top-0 bg-white/25 transition-all duration-200"
                                                style={{ width: `${averageProgress}%` }}
                                            />
                                        )}
                                    </button>
                                </motion.div>
                            )}

                            {/* MODE 2: LIVE PERIMETER WALK */}
                            {mode === 'walk' && (
                                <motion.div
                                    key="walk"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                                <Footprints className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-gray-900">
                                                    {isTracking ? 'Live Perimeter Tracking Active' : 'Walk Perimeter Trail Mode'}
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-semibold">
                                                    {isTracking ? 'Walk steadily along farm boundary line.' : 'Press start, then walk along the bunds/fences.'}
                                                </p>
                                            </div>
                                        </div>

                                        {isTracking && (
                                            <div className="flex items-center gap-3 text-right">
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-bold">Walked</div>
                                                    <div className="text-xs font-black text-gray-900">{walkDistance.toFixed(0)} m</div>
                                                </div>
                                                {walkSpeed !== null && (
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 font-bold">Speed</div>
                                                        <div className="text-xs font-black text-amber-600">{walkSpeed} km/h</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Proximity Loop Alert */}
                                    {isCloseToLoopStart && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-emerald-50 border border-emerald-300 rounded-xl p-2 flex items-center justify-between text-emerald-900 text-xs font-bold"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span>Loop Complete! You are back at Corner #1</span>
                                            </div>
                                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                                                Ready to Stop
                                            </span>
                                        </motion.div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={toggleTracking}
                                            className={`flex-1 py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 shadow-xl transition-all relative overflow-hidden ${isTracking
                                                ? 'bg-gradient-to-r from-rose-600 to-red-600 shadow-red-500/30'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/30 active:scale-[0.98]'
                                                }`}
                                        >
                                            {isTracking ? (
                                                <>
                                                    <Square size={16} fill="currentColor" />
                                                    <span>FINISH & SEAL BOUNDARY ({pathCoordinates.length} pts)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={16} fill="currentColor" />
                                                    <span>START WALKING PERIMETER</span>
                                                </>
                                            )}
                                        </button>

                                        {!isTracking && markers.length > 5 && (
                                            <button
                                                onClick={handleSimplifyTrail}
                                                className="px-3 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl font-black text-xs flex items-center gap-1"
                                                title="Simplify GPS Jitter into Crisp Corners"
                                            >
                                                <Sparkles size={16} />
                                                <span>Clean Jitter</span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* MODE 3: SATELLITE TAP & DRAG */}
                            {mode === 'tap' && (
                                <motion.div
                                    key="tap"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                                <Hand className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-gray-900">
                                                    Satellite Tap & Draggable Vertices
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-semibold">
                                                    Tap anywhere on the satellite image to mark corners. Drag pins to adjust.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-blue-700">{markers.length} Vertices</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded-xl px-3 py-2 text-[11px] text-blue-900 font-bold">
                                        <span>💡 Tip: Tap the small "+" circles between lines to add extra curves.</span>
                                        {markers.length > 0 && (
                                            <button
                                                onClick={handleUndo}
                                                className="text-blue-700 underline text-[10px] ml-2"
                                            >
                                                Undo Pin
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* MODE 4: SURVEY & PRESETS */}
                            {mode === 'survey' && (
                                <motion.div
                                    key="survey"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                                <FileSearch className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-gray-900">
                                                    Survey Search & Farm Shape Presets
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-semibold">
                                                    Search village revenue records or drop standard acre shapes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search Input */}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                                            <input
                                                type="text"
                                                placeholder="Village / Taluka / Gut No. (e.g., Bidadi, Ramanagara)"
                                                className="w-full bg-purple-50/60 border border-purple-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                                                value={surveyNumber}
                                                onChange={e => setSurveyNumber(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && fetchBySurveyNumber()}
                                            />
                                        </div>
                                        <button
                                            onClick={fetchBySurveyNumber}
                                            disabled={loading}
                                            className="px-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white font-black text-xs shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={14} /> : 'Search'}
                                        </button>
                                    </div>

                                    {/* Instant Farm Geometric Presets */}
                                    <div className="pt-1 flex items-center gap-2 overflow-x-auto">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            Drop Preset:
                                        </span>
                                        <button
                                            onClick={() => handleDropPresetGeometry(1.0, 'rectangle')}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-purple-100 hover:text-purple-900 rounded-lg text-[10px] font-black text-gray-700 transition-colors whitespace-nowrap"
                                        >
                                            1 Acre (Rect)
                                        </button>
                                        <button
                                            onClick={() => handleDropPresetGeometry(2.0, 'square')}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-purple-100 hover:text-purple-900 rounded-lg text-[10px] font-black text-gray-700 transition-colors whitespace-nowrap"
                                        >
                                            2 Acres (Sq)
                                        </button>
                                        <button
                                            onClick={() => handleDropPresetGeometry(5.0, 'rectangle')}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-purple-100 hover:text-purple-900 rounded-lg text-[10px] font-black text-gray-700 transition-colors whitespace-nowrap"
                                        >
                                            5 Acres Plot
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* ========== "WHICH METHOD IS BEST?" GUIDE MODAL ========== */}
            <AnimatePresence>
                {showGuideModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[600] flex items-center justify-center p-4"
                        onClick={() => setShowGuideModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-5 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <Award className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black">Best Boundary Locating Method</h3>
                                        <p className="text-xs text-emerald-100">Agricultural Precision Engineering Guide</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGuideModal(false)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto space-y-4 text-gray-700">
                                {/* Winner / Top Pick Banner */}
                                <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-3.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                            #1 Winner for Farmers
                                        </span>
                                        <h4 className="text-sm font-black text-emerald-950">Corner Peg (Multi-Sample Averaging)</h4>
                                    </div>
                                    <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
                                        <strong>Why it's the best:</strong> Consumer smartphone GPS drifts by 3–8 meters while walking due to signal noise. In <em>Corner Peg Mode</em>, you walk directly to each field corner/bund stone and hold still for 3 seconds. The app captures 10 rapid GPS fixes and calculates the high-precision weighted median, giving sharp, survey-accurate corners!
                                    </p>
                                </div>

                                {/* Comparison Table / Cards */}
                                <div className="space-y-2.5">
                                    <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                                        When to use each method:
                                    </h5>

                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                            <Footprints size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-900">Live Perimeter Walk</div>
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                Best for <strong>large, curved, or irregular borders</strong> (river bends, canal edges). Includes auto-loop detection and one-click noise removal.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                            <Hand size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-900">Satellite Tap & Drag</div>
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                Best for <strong>remote inspection</strong> or fine-tuning existing pins against visible tree lines and crop fences.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                                            <FileSearch size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-900">Survey Search & Shape Presets</div>
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                Best for locating your farm via <strong>Village/Taluka</strong> or dropping standard 1/2/5-acre geometric layouts.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => setShowGuideModal(false)}
                                    className="w-full py-3 bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-700/20 active:scale-95 transition-all"
                                >
                                    GOT IT • START MARKING
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========== EXPORT GEOJSON / KML MODAL ========== */}
            <AnimatePresence>
                {showExportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[600] flex items-center justify-center p-4"
                        onClick={() => setShowExportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                        <Download size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900">Export Boundary Data</h3>
                                        <p className="text-xs text-gray-500 font-semibold">{markers.length} Corner Vertices • {areaMetrics.acres.toFixed(2)} Acres</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-gray-600 font-semibold mb-4 leading-relaxed">
                                Download standard agricultural GIS boundary files compatible with drone sprayers, tractor autopilot, Google Earth, and Government revenue portals.
                            </p>

                            <div className="space-y-2.5">
                                <button
                                    onClick={() => handleDownloadFile('geojson')}
                                    className="w-full p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 rounded-2xl flex items-center justify-between text-left transition-all group"
                                >
                                    <div>
                                        <div className="text-xs font-black text-purple-950">Download GeoJSON (.geojson)</div>
                                        <div className="text-[10px] text-purple-700 font-bold">For precision agriculture & GIS software</div>
                                    </div>
                                    <Download className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                                </button>

                                <button
                                    onClick={() => handleDownloadFile('kml')}
                                    className="w-full p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-2xl flex items-center justify-between text-left transition-all group"
                                >
                                    <div>
                                        <div className="text-xs font-black text-emerald-950">Download KML (.kml)</div>
                                        <div className="text-[10px] text-emerald-700 font-bold">For Google Earth & 3D satellite visualization</div>
                                    </div>
                                    <Download className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========== SAVE & VERIFICATION MODAL ========== */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[550] flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowSaveModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 p-6 relative overflow-hidden text-white">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/30">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-black mb-1">Verify & Save Farm Boundary</h3>
                                <p className="text-xs text-emerald-100 font-semibold">
                                    🌾 Enroll in carbon credits, crop stress alerts & smart irrigation
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                {/* Live Metric Summary */}
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200/60">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-[10px] font-black text-emerald-800 uppercase">Acres</div>
                                            <div className="text-lg font-black text-gray-900">{areaMetrics.acres.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-emerald-800 uppercase">Guntha</div>
                                            <div className="text-lg font-black text-gray-900">{areaMetrics.guntha.toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-emerald-800 uppercase">Corners</div>
                                            <div className="text-lg font-black text-emerald-700">{markers.length} Pins</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Owner Name */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                                        <User className="w-3.5 h-3.5 text-emerald-600" />
                                        Farmer / Owner Name
                                    </label>
                                    <input
                                        type="text"
                                        value={ownerName}
                                        onChange={e => setOwnerName(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white font-bold text-gray-900 text-sm transition-all"
                                        placeholder="e.g. Ramesh Patil"
                                    />
                                </div>

                                {/* Gut / Survey Number & Crop */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="flex items-center gap-1 text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                                            <Hash className="w-3 h-3 text-emerald-600" />
                                            Gut / Survey No.
                                        </label>
                                        <input
                                            type="text"
                                            value={gutNumber}
                                            onChange={e => setGutNumber(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-3.5 py-3 outline-none focus:border-emerald-500 focus:bg-white font-bold text-gray-900 text-sm transition-all"
                                            placeholder="142/A"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1 text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                                            <Trees className="w-3 h-3 text-emerald-600" />
                                            Primary Crop
                                        </label>
                                        <select
                                            value={cropType}
                                            onChange={e => setCropType(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-3 py-3 outline-none focus:border-emerald-500 focus:bg-white font-bold text-gray-900 text-xs transition-all"
                                        >
                                            <option value="Sugarcane">Sugarcane</option>
                                            <option value="Cotton">Cotton</option>
                                            <option value="Soybean">Soybean</option>
                                            <option value="Wheat">Wheat</option>
                                            <option value="Paddy / Rice">Paddy / Rice</option>
                                            <option value="Groundnut">Groundnut</option>
                                            <option value="Horticulture">Horticulture</option>
                                            <option value="Mixed">Mixed Farming</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 7/12 Extract File Upload (Optional) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                        Upload 7/12 Extract / RTC <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                                    </label>
                                    <div className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer relative ${proofFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                        <input
                                            type="file"
                                            onChange={e => setProofFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*,.pdf"
                                        />
                                        {proofFile ? (
                                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                                <CheckCircle2 size={16} />
                                                <span>{proofFile.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                                                <Upload size={16} />
                                                <span>Click to attach document or photo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowSaveModal(false)}
                                        className="flex-1 py-3.5 rounded-2xl font-black text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmSave}
                                        disabled={loading}
                                        className="flex-[2] py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                <span>Saving Farm…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={15} />
                                                <span>Confirm & Save Boundary</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandMarkingScreen;