
import React, { useState, useMemo, useEffect } from 'react';
import { ItineraryResult, CompanyInfo, BudgetBreakdown, PhotoItem } from '../types';
import { SmartBudget } from './SmartBudget';
import { PhotoAlbum } from './PhotoAlbum';
import { TripMap, MapLocation } from './TripMap';

interface ItineraryDisplayProps {
  result: ItineraryResult;
  companies: CompanyInfo[];
  budget: BudgetBreakdown | null;
  photos: PhotoItem[];
  travelerCount: number;
  tripId: string | null;
  onReset: () => void;
  onBack: () => void;
  onAddPhoto: (photo: PhotoItem) => void;
  onUpdatePhoto: (photo: PhotoItem) => void;
  onRemovePhoto: (id: string) => void;
}

interface AccordionSectionProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className="border border-slate-700 rounded-xl bg-slate-800/40 backdrop-blur-sm overflow-hidden transition-all duration-300 mb-4">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-lg font-bold text-white tracking-wide">{title}</span>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 border-t border-slate-700/50">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ 
    result, 
    companies, 
    budget,
    photos,
    travelerCount,
    tripId,
    onReset,
    onBack,
    onAddPhoto,
    onUpdatePhoto,
    onRemovePhoto
}) => {
  // Accordion States
  const [openSections, setOpenSections] = useState({
    map: true,
    itinerary: true,
    industry: false,
    budget: false,
    photos: true
  });

  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if navigator.share is supported
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Prepare Map Locations
  const mapLocations = useMemo(() => {
    const locs: MapLocation[] = [];

    // Add Industry Companies
    companies.forEach(comp => {
      if (comp.coordinates) {
        locs.push({
          lat: comp.coordinates.lat,
          lng: comp.coordinates.lng,
          title: comp.name,
          description: 'Industrial Target',
          type: 'company'
        });
      }
    });

    // Add Itinerary Activities
    if (result.days) {
      result.days.forEach(day => {
        day.activities.forEach(act => {
          if (act.coordinates) {
            locs.push({
              lat: act.coordinates.lat,
              lng: act.coordinates.lng,
              title: act.location,
              description: `${act.description} (${day.title})`,
              type: act.type
            });
          }
        });
      });
    }
    return locs;
  }, [companies, result]);

  // Helper to generate text content
  const generateTripContent = () => {
    let content = `AI-IV-PLANNER TRIP: ${result.destination}\n`;
    
    // If we have a link, prioritize that
    if (tripId) {
      const shareLink = `${window.location.origin}?tripId=${tripId}`;
      content += `View detailed plan here: ${shareLink}\n\n`;
    }

    content += `Overview: ${result.overview}\n\n`;
    
    if (result.days && result.days.length > 0) {
        content += `--- ITINERARY ---\n`;
        result.days.forEach(day => {
            content += `Day ${day.day}: ${day.title}\n`;
            day.activities.forEach(act => {
                content += `- [${act.time}] ${act.location}: ${act.description} (${act.type})\n`;
                if (act.mapsUrl) content += `  Map: ${act.mapsUrl}\n`;
            });
            content += `\n`;
        });
    }

    if (companies && companies.length > 0) {
        content += `--- INDUSTRY VISITS ---\n`;
        companies.forEach(comp => {
            content += `- ${comp.name}: ${comp.description}\n`;
            if (comp.mapsUrl) content += `  Map: ${comp.mapsUrl}\n`;
        });
        content += `\n`;
    }

    if (budget) {
        content += `--- ESTIMATED BUDGET ---\n`;
        content += `Total per person: ${budget.currency} ${budget.total}\n`;
        content += `Travelers: ${travelerCount}\n`;
        content += `Grand Total: ${budget.currency} ${budget.total * travelerCount}\n`;
    }

    content += `\nGenerated by AI-IV-Planner`;
    return content;
  };

  // Handle Copy to Clipboard (Link or Text)
  const handleCopy = async () => {
    let textToCopy = '';
    
    if (tripId) {
        textToCopy = `${window.location.origin}?tripId=${tripId}`;
    } else {
        textToCopy = generateTripContent();
    }

    try {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
  };

  // Handle Download Text File
  const handleDownload = () => {
      const content = generateTripContent();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.destination.replace(/\s+/g, '_')}_Itinerary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  };

  // Handle Share (Native)
  const handleShare = async () => {
    if (navigator.share) {
        try {
            const shareData: any = {
                title: `Industrial Trip to ${result.destination}`,
            };

            if (tripId) {
                // Share as a URL if possible
                shareData.url = `${window.location.origin}?tripId=${tripId}`;
                shareData.text = `Check out this industrial visit plan to ${result.destination}!`;
            } else {
                // Fallback to text dump
                shareData.text = generateTripContent();
            }

            await navigator.share(shareData);
        } catch (err) {
            console.warn('Share cancelled or failed', err);
        }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pb-32 max-w-4xl">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
             {/* Back Button */}
            <button 
                onClick={onBack}
                className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
                title="Edit Search"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                {result.destination}
                </h2>
                <div className="flex items-center space-x-2 mt-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2 py-1 rounded border border-indigo-500/30 uppercase tracking-wider">
                    Industrial Expedition
                </span>
                <span className="text-slate-500 text-xs">•</span>
                {/* Safety check: Use optional chaining and default to 0 */}
                <span className="text-slate-400 text-xs">{result.days?.length || 0} Days</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
             {/* Download Button */}
             <button
                onClick={handleDownload}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-all"
                title="Download Itinerary as Text"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4h12" transform="rotate(180 12 12)" />
                </svg>
             </button>

             {/* Share/Copy Button (Adaptive) */}
             <button
                onClick={canShare ? handleShare : handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    isCopied 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700 hover:border-indigo-500/50'
                }`}
            >
                {isCopied ? (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Copied!</span>
                    </>
                ) : (
                    <>
                        {canShare ? (
                           <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span className="hidden sm:inline">Share Link</span>
                           </>
                        ) : (
                           <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="hidden sm:inline">{tripId ? 'Copy Link' : 'Copy Plan'}</span>
                           </>
                        )}
                    </>
                )}
            </button>

            <button 
                onClick={onReset}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-indigo-500/20"
            >
                New Trip
            </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* 0. Map Section */}
        <AccordionSection
            title="Mission Navigation"
            icon="🛰️"
            isOpen={openSections.map}
            onToggle={() => toggleSection('map')}
        >
             {mapLocations.length > 0 ? (
                <TripMap locations={mapLocations} />
             ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-900/50 rounded-lg">
                    <p>No coordinates available for map visualization.</p>
                </div>
             )}
        </AccordionSection>
        
        {/* 1. Daily Itinerary Section */}
        <AccordionSection 
            title="Mission Timeline" 
            icon="🗺️" 
            isOpen={openSections.itinerary} 
            onToggle={() => toggleSection('itinerary')}
        >
             <p className="text-slate-300 leading-relaxed mb-6 italic border-l-4 border-indigo-500 pl-4 bg-slate-800/30 py-2 rounded-r-lg">
                "{result.overview}"
             </p>
             <div className="space-y-8 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-700"></div>
                {/* Safety Check: verify result.days exists */}
                {result.days && result.days.length > 0 ? (
                    result.days.map((day) => (
                    <div key={day.day} className="relative pl-12">
                        <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center z-10 font-bold text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            {day.day}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 pt-2">{day.title}</h3>
                        <div className="space-y-3">
                            {day.activities && day.activities.map((act, idx) => (
                                <div key={idx} className="group relative bg-slate-900/50 hover:bg-slate-800/80 rounded-lg p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                {act.time}
                                            </span>
                                            {act.mapsUrl ? (
                                              <a href={act.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center text-white font-semibold hover:text-indigo-400 transition-colors">
                                                {act.location}
                                                <svg className="w-3 h-3 ml-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                              </a>
                                            ) : (
                                              <h4 className="text-white font-semibold">{act.location}</h4>
                                            )}
                                        </div>
                                        <span className={`self-start sm:self-auto text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold border ${
                                            act.type === 'visit' ? 'bg-amber-900/20 text-amber-400 border-amber-500/20' : 
                                            act.type === 'food' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' :
                                            act.type === 'travel' ? 'bg-blue-900/20 text-blue-400 border-blue-500/20' : 
                                            'bg-purple-900/20 text-purple-400 border-purple-500/20'
                                        }`}>
                                            {act.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 pl-1">{act.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        No detailed itinerary could be generated for these parameters.
                    </div>
                )}
            </div>
        </AccordionSection>

        {/* 2. Top Industry Visits Section */}
        <AccordionSection 
            title="Industrial Targets" 
            icon="🏭" 
            isOpen={openSections.industry} 
            onToggle={() => toggleSection('industry')}
        >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Safety check: ensure companies is defined */}
                {companies && companies.length > 0 ? companies.map((comp, idx) => (
                    <div key={idx} className="bg-slate-900/80 p-5 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{comp.name}</h4>
                            <div className="flex gap-2">
                              {comp.mapsUrl && (
                                <a href={comp.mapsUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors" title="View on Maps">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </a>
                              )}
                              {comp.website && (
                                  <a href={comp.website} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors" title="Visit Website">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                  </a>
                              )}
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-3">{comp.description}</p>
                        {comp.distance && (
                            <div className="flex items-center text-xs text-emerald-400 bg-emerald-900/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                {comp.distance}
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="col-span-full py-8 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                        <p className="animate-pulse">Scanning sector for viable targets...</p>
                    </div>
                )}
            </div>
        </AccordionSection>

        {/* 3. Smart Budget Section */}
        <AccordionSection 
            title="Budget Estimator" 
            icon="💰" 
            isOpen={openSections.budget} 
            onToggle={() => toggleSection('budget')}
        >
             {budget ? (
                 <SmartBudget budget={budget} travelerCount={travelerCount} />
             ) : (
                 <div className="py-8 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-slate-800 rounded"></div>
                    </div>
                 </div>
             )}
        </AccordionSection>

        {/* 4. Photo Album Section (Now in Accordion) */}
        <AccordionSection
            title="Photo Album"
            icon="📸"
            isOpen={openSections.photos}
            onToggle={() => toggleSection('photos')}
        >
             <PhotoAlbum 
                photos={photos} 
                location={result.destination} 
                onAddPhoto={onAddPhoto}
                onUpdatePhoto={onUpdatePhoto}
                onRemovePhoto={onRemovePhoto}
             />
        </AccordionSection>

      </div>
    </div>
  );
};
