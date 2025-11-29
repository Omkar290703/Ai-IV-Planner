
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { PhotoItem } from '../types';

interface PhotoAlbumProps {
  photos: PhotoItem[];
  location: string;
  onAddPhoto: (photo: PhotoItem) => void;
  onUpdatePhoto: (photo: PhotoItem) => void;
  onRemovePhoto: (id: string) => void;
}

interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
  loading: boolean;
  error?: boolean;
}

type SortOption = 'date-desc' | 'date-asc' | 'location';

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({ photos, location, onAddPhoto, onUpdatePhoto, onRemovePhoto }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<GeoLocation>({ lat: 0, lng: 0, address: '', loading: true, error: false });
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Organization State
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Lightbox State
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxPhoto(null);
    };
    if (lightboxPhoto) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const newPhoto: PhotoItem = {
              id: `upload-${Date.now()}-${index}`,
              url: reader.result,
              date: new Date().toISOString(),
              location: location, // Default to trip destination for uploads
              tags: ['Upload']
            };
            onAddPhoto(newPhoto);
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleShareAlbum = () => {
    // Simulate link generation
    const uniqueId = Math.random().toString(36).substring(7);
    setShareLink(`https://iv-planner.app/shared-album/${uniqueId}`);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    // Could add visual feedback here
  };

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    photos.forEach(p => locs.add(p.location));
    return Array.from(locs);
  }, [photos]);

  const displayedPhotos = useMemo(() => {
    let result = [...photos];

    // Filter by Location
    if (filterLocation) {
        result = result.filter(p => p.location === filterLocation);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return a.location.localeCompare(b.location);
      }
    });

    return result;
  }, [photos, sortBy, filterLocation]);

  // --- Camera & Geo Logic ---

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    setGeoData(prev => ({ ...prev, loading: true, error: false, address: 'Acquiring Location...' }));
    
    // 1. Get Location & Address
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse Geocoding (OpenStreetMap Nominatim - Free, No Key)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.display_name || "Unknown Location";
          
          setGeoData({
            lat: latitude,
            lng: longitude,
            address: address,
            loading: false,
            error: false
          });
        } catch (error) {
          console.error("Geocoding failed", error);
          setGeoData({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            loading: false,
            error: false
          });
        }
      }, (error) => {
        console.warn("Location access denied:", error.message);
        setGeoData(prev => ({ ...prev, address: "Location Access Denied", loading: false, error: true }));
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
        setGeoData(prev => ({ ...prev, address: "Geolocation not supported", loading: false, error: true }));
    }

    // 2. Start Video Stream
    initVideoStream();
  };

  const initVideoStream = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera failed:", err.message || err);
      let msg = "Could not access camera.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = "Camera permission denied. Please allow access in browser settings.";
      } else if (err.name === 'NotFoundError') {
          msg = "No camera found on this device.";
      }
      setCameraError(msg);
    }
  };

  // Re-init stream when facing mode changes
  useEffect(() => {
    if (isCameraOpen) {
        initVideoStream();
    }
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip horizontally if front camera
    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transform for text overlay
    if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Geo-Tag Overlay Drawing
    const padding = 20;
    const boxWidth = Math.min(400, canvas.width - 40);
    const boxHeight = 160;
    const x = canvas.width - boxWidth - padding;
    const y = canvas.height - boxHeight - padding;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, boxWidth, boxHeight, 12);
    else ctx.rect(x, y, boxWidth, boxHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = '#818cf8';
    ctx.fillText("GPS MAP CAMERA", x + 20, y + 35);

    ctx.beginPath();
    ctx.moveTo(x + 20, y + 45);
    ctx.lineTo(x + boxWidth - 20, y + 45);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    const addressWords = geoData.address.split(' ');
    let line = '';
    let lineY = y + 70;
    
    for(let n = 0; n < addressWords.length; n++) {
      const testLine = line + addressWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > boxWidth - 40 && n > 0) {
        ctx.fillText(line, x + 20, lineY);
        line = addressWords[n] + ' ';
        lineY += 20;
      } else {
        line = testLine;
      }
      if (lineY > y + boxHeight - 60) break; 
    }
    ctx.fillText(line, x + 20, lineY);

    const metaY = y + boxHeight - 20;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#94a3b8';
    
    const dateStr = new Date().toLocaleString();
    const latLongStr = `Lat ${geoData.lat.toFixed(6)}, Long ${geoData.lng.toFixed(6)}`;
    
    ctx.fillText(latLongStr, x + 20, metaY - 15);
    ctx.fillText(dateStr, x + 20, metaY);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText("AI-IV-PLANNER", x + boxWidth - 20, metaY);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Create new PhotoItem
    const newPhoto: PhotoItem = {
      id: `cam-${Date.now()}`,
      url: dataUrl,
      date: new Date().toISOString(),
      location: geoData.address || "Unknown Location",
      tags: ['Geo-Tagged', 'Camera']
    };

    onAddPhoto(newPhoto);
    stopCamera();
  };

  const handleDownloadPhoto = (photo: PhotoItem) => {
      const link = document.createElement('a');
      link.href = photo.url;
      // Generate a friendly filename
      const timestamp = new Date(photo.date).getTime();
      const sanitizedLoc = photo.location.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
      link.download = `iv_photo_${sanitizedLoc}_${timestamp}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const deleteAndCloseLightbox = (id: string) => {
    onRemovePhoto(id);
    if (lightboxPhoto && lightboxPhoto.id === id) {
      setLightboxPhoto(null);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Organization Toolbar */}
            <div className="flex flex-wrap items-center gap-3 w-full justify-between">
              
              <div className="flex gap-3 items-center">
                 {/* Sort Dropdown */}
                <div className="relative">
                    <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-500/50 transition-colors"
                    >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="location">Sort by Location</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {/* Location Filter Dropdown */}
                <div className="relative">
                    <select 
                    value={filterLocation || ''}
                    onChange={(e) => setFilterLocation(e.target.value || null)}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-500/50 transition-colors max-w-[150px]"
                    >
                    <option value="">All Locations</option>
                    {allLocations.map(loc => (
                        <option key={loc} value={loc} className="truncate">{loc.substring(0, 20)}{loc.length > 20 ? '...' : ''}</option>
                    ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShareAlbum}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Share & Contribute
              </button>
            </div>
       </div>

       {/* Camera Full Screen Modal */}
       {isCameraOpen && (
           <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="flex-1 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Top Status Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                    <div className="bg-black/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${geoData.loading ? 'bg-amber-500 animate-pulse' : geoData.error ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                        <span className="text-xs text-white font-mono uppercase tracking-wider">
                            {geoData.loading ? 'Acquiring...' : geoData.error ? 'GPS Error' : 'GPS Locked'}
                        </span>
                    </div>
                    
                    <button onClick={toggleCamera} className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors border border-white/10">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-center">
                    <button 
                        onClick={stopCamera} 
                        className="px-6 py-2 text-white font-bold bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
                    >
                        Cancel
                    </button>
                    
                    <button 
                        onClick={capturePhoto} 
                        className="w-20 h-20 rounded-full border-[6px] border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors group"
                    >
                        <div className="w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                    </button>
                    
                    <div className="w-20 text-center text-xs text-white/50 font-mono">
                        {facingMode === 'environment' ? 'BACK' : 'FRONT'}
                    </div>
                </div>

                {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center z-50">
                        <div className="bg-slate-900 border border-red-500/50 p-6 rounded-xl max-w-sm">
                            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-red-200 mb-6">{cameraError}</p>
                            <button onClick={stopCamera} className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold transition-colors">Close Camera</button>
                        </div>
                    </div>
                )}
           </div>
       )}

       <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayedPhotos.map((photo) => (
                <div 
                    key={photo.id} 
                    className="group relative aspect-square rounded-xl bg-slate-900 overflow-hidden shadow-xl border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 cursor-zoom-in"
                    onClick={() => setLightboxPhoto(photo)}
                >
                    <img 
                        src={photo.url} 
                        alt="Trip memory" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Action Buttons - Quick Access with SCI-FI Styles */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                        {/* Download Button */}
                        <button 
                            onClick={(e) => {
                                handleDownloadPhoto(photo);
                            }}
                            className="flex items-center justify-center w-8 h-8 bg-black/60 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-200 backdrop-blur-md border border-cyan-500/50 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                            title="Download Photo"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4h12" />
                            </svg>
                        </button>

                        {/* Delete Button */}
                        <button 
                            onClick={(e) => {
                                deleteAndCloseLightbox(photo.id);
                            }}
                            className="flex items-center justify-center w-8 h-8 bg-black/60 hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 backdrop-blur-md border border-rose-500/50 rounded-lg transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)] hover:shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                            title="Delete Photo"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Overlay Info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end pointer-events-none">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-xs text-indigo-300 font-mono">
                            {new Date(photo.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center max-w-[60%]">
                             <svg className="w-3 h-3 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <span className="truncate">{photo.location}</span>
                          </div>
                        </div>

                        {/* Tags Display */}
                        <div className="flex flex-wrap gap-1">
                             {photo.tags?.map((tag, i) => (
                                 <span key={i} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-200 text-[10px] rounded border border-indigo-500/30">
                                     #{tag}
                                 </span>
                             ))}
                        </div>
                    </div>
                </div>
            ))}

            {/* Add Memories Card - SPLIT LAYOUT */}
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl group flex flex-col">
                 
                 {/* Upload Section (Top Half) */}
                 <div className="relative flex-1 bg-gradient-to-br from-indigo-900/30 to-slate-900 hover:from-indigo-600/30 transition-all border-b border-slate-700 group/upload cursor-pointer">
                    <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                     />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover/upload:bg-indigo-500 group-hover/upload:text-white transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4h12" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider group-hover/upload:text-white transition-colors">Upload</span>
                    </div>
                 </div>

                 {/* Geo-Camera Section (Bottom Half) */}
                 <button 
                    onClick={startCamera}
                    className="relative flex-1 bg-gradient-to-br from-emerald-900/30 to-slate-900 hover:from-emerald-600/30 transition-all group/camera flex flex-col items-center justify-center gap-2"
                 >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover/camera:bg-emerald-500 group-hover/camera:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider group-hover/camera:text-white transition-colors">Geo-Cam</span>
                 </button>
            </div>
       </div>

       {/* Share Modal */}
       {showShareModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Share Album</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Share this link to let others view and contribute photos to this trip album.
                </p>
                
                <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-lg border border-slate-700 mb-4">
                    <input 
                        type="text" 
                        readOnly 
                        value={shareLink}
                        className="bg-transparent text-indigo-300 text-xs w-full outline-none font-mono"
                    />
                    <button onClick={copyToClipboard} className="text-slate-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
                
                <button 
                    onClick={() => setShowShareModal(false)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors"
                >
                    Done
                </button>
            </div>
         </div>
       )}

       {/* Lightbox Modal */}
       {lightboxPhoto && (
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setLightboxPhoto(null)}>
            
            {/* Close Button */}
            <button 
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors z-10"
            >
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>

            <div className="relative w-full max-w-6xl h-full p-4 flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
               {/* Main Image */}
               <img 
                 src={lightboxPhoto.url} 
                 alt="Full view" 
                 className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-slate-800"
               />

               {/* Bottom Info Bar */}
               <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-auto md:min-w-[400px] bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  
                  <div className="text-left w-full">
                     <div className="text-white font-medium flex items-center gap-2">
                       <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       {lightboxPhoto.location}
                     </div>
                     <div className="text-xs text-slate-400 font-mono mt-1">
                       {new Date(lightboxPhoto.date).toLocaleString()}
                     </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <button 
                         onClick={() => handleDownloadPhoto(lightboxPhoto)}
                         className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4h12" /></svg>
                         Download
                      </button>
                      <button 
                         onClick={() => deleteAndCloseLightbox(lightboxPhoto.id)}
                         className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         Delete
                      </button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
