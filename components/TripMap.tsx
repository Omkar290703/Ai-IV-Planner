import React, { useEffect, useRef } from 'react';

// Declare Leaflet global type
declare global {
  interface Window {
    L: any;
  }
}

export interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type: 'visit' | 'food' | 'travel' | 'leisure' | 'company';
}

interface TripMapProps {
  locations: MapLocation[];
  centerLabel?: string;
}

export const TripMap: React.FC<TripMapProps> = ({ locations, centerLabel }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize map if not already done
    if (!mapInstance.current) {
      // Default center
      const startLat = locations.length > 0 ? locations[0].lat : 20.5937;
      const startLng = locations.length > 0 ? locations[0].lng : 78.9629;
      const zoom = locations.length > 0 ? 12 : 5;

      mapInstance.current = window.L.map(mapRef.current).setView([startLat, startLng], zoom);

      // Sci-Fi Dark Mode Tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance.current);

      // Create a layer group to hold markers
      markersLayerRef.current = window.L.layerGroup().addTo(mapInstance.current);
    }

    // Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // Add Markers to Layer Group
    if (locations.length > 0) {
      const bounds = window.L.latLngBounds([]);

      locations.forEach(loc => {
        // Color coding based on type
        let color = '#a855f7'; // purple (default/leisure)
        let fillColor = '#a855f7';
        
        if (loc.type === 'company') { color = '#f43f5e'; fillColor = '#f43f5e'; } // red
        else if (loc.type === 'visit') { color = '#fbbf24'; fillColor = '#fbbf24'; } // amber
        else if (loc.type === 'food') { color = '#10b981'; fillColor = '#10b981'; } // emerald
        else if (loc.type === 'travel') { color = '#3b82f6'; fillColor = '#3b82f6'; } // blue

        // Create Custom Marker Icon (mimicking the sci-fi dot look)
        const customIcon = window.L.divIcon({
          className: 'custom-marker-pin',
          html: `
            <div style="
              width: 14px; 
              height: 14px; 
              background-color: ${fillColor}; 
              border: 2px solid #ffffff; 
              border-radius: 50%; 
              box-shadow: 0 0 10px ${color};
            "></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -10]
        });

        const marker = window.L.marker([loc.lat, loc.lng], {
            icon: customIcon
        });

        const popupContent = `
          <div style="font-family: 'Space Grotesk', sans-serif; min-width: 200px;">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></span>
                <strong style="color: ${color}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">${loc.title}</strong>
            </div>
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
                ${loc.description || ''}
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b; font-family: monospace;">
                LAT: ${loc.lat.toFixed(4)} | LNG: ${loc.lng.toFixed(4)}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
            className: 'custom-popup-dark'
        });
        
        // Open popup on hover
        marker.on('mouseover', function (e: any) {
            this.openPopup();
        });
        marker.on('mouseout', function (e: any) {
            this.closePopup();
        });

        markersLayerRef.current.addLayer(marker);
        bounds.extend([loc.lat, loc.lng]);
      });

      // Fit bounds with padding
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [locations]);

  // Handle Resize for Accordion Toggle
  useEffect(() => {
    if (!mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-700 shadow-2xl z-0 group">
      <div ref={mapRef} className="w-full h-full bg-slate-900 z-0"></div>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-5 right-5 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl z-[400] text-xs shadow-xl transition-opacity opacity-80 group-hover:opacity-100">
         <div className="font-bold text-white mb-3 uppercase tracking-wider border-b border-slate-700 pb-2">Mission Targets</div>
         <div className="space-y-2">
            <div className="flex items-center text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#f43f5e] mr-3 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span> 
                Target Industry
            </div>
            <div className="flex items-center text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24] mr-3 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span> 
                Visit / Sightseeing
            </div>
            <div className="flex items-center text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10b981] mr-3 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> 
                Food & Dining
            </div>
            <div className="flex items-center text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6] mr-3 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> 
                Travel / Transit
            </div>
         </div>
      </div>
    </div>
  );
};