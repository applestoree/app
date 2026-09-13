import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

interface PickupStoreMapProps {
  lat?: number;
  lng?: number;
  storeName?: string;
  addressLine?: string;
  cityState?: string;
  hours?: string;
}

export const PickupStoreMap: React.FC<PickupStoreMapProps> = ({
  lat = 3.14225,
  lng = 101.71766,
  storeName = 'Apple The Exchange TRX',
  addressLine = 'Persiaran TRX, Tun Razak Exchange',
  cityState = '55188 Kuala Lumpur, Wilayah Persekutuan',
  hours = '10:00 AM – 10:00 PM daily',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization if already mounted
    if (mapInstanceRef.current) return;

    // Initialize Leaflet Map centered at TRX coordinates
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap Carto-style or standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Custom Apple Store Pin Icon
    const storeIcon = L.divIcon({
      className: 'custom-store-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <!-- Pulsing ambient ring -->
          <div style="position: absolute; top: -6px; left: -6px; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(0, 113, 227, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          
          <!-- Pin Badge -->
          <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #0071e3; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>

          <!-- Pointer Triangle -->
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #0071e3; margin-top: -1px; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.15));"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 39],
      popupAnchor: [0, -38],
    });

    // Add marker and popup
    const marker = L.marker([lat, lng], { icon: storeIcon }).addTo(map);
    
    marker.bindPopup(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; min-width: 180px;">
        <div style="font-weight: 700; font-size: 13px; color: #1d1d1f; margin-bottom: 3px;">
          ${storeName}
        </div>
        <div style="font-size: 11px; color: #515154; line-height: 1.4; margin-bottom: 6px;">
          ${addressLine}<br/>${cityState}
        </div>
        <div style="font-size: 10px; font-weight: 600; color: #0071e3; display: flex; align-items: center; gap: 4px;">
          <span>📍 Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</span>
        </div>
      </div>
    `);

    // Automatic container resize adaptation
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, storeName, addressLine, cityState]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="w-full space-y-3">
      {/* Store Location Map Frame */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-black/10 shadow-xs bg-gray-100 h-60">
        <div
          ref={mapContainerRef}
          id="pickup-store-leaflet-map"
          className="w-full min-w-full h-full z-10 block"
          style={{ width: '100%', minWidth: '100%', height: '100%' }}
        />

        {/* Top Overlay Badge */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/10 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-[#1d1d1f]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{storeName}</span>
          </div>
        </div>

        {/* Bottom-right Quick Controls: Recenter button */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter to Apple Store TRX"
            className="p-2 bg-white/95 backdrop-blur-md rounded-xl border border-black/10 text-[#1d1d1f] hover:text-[#0071e3] shadow-xs active:scale-95 transition-all text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span className="text-[10px] font-medium hidden sm:inline">Recenter</span>
          </button>
        </div>
      </div>

      {/* Store Details Card & Action Bar */}
      <div className="bg-[#f5f5f7] p-3.5 rounded-xl border border-black/5 space-y-2.5 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="font-semibold text-[#1d1d1f] text-sm flex items-center gap-1.5">
              <MapPin size={15} className="text-[#0071e3] shrink-0" />
              <span>{storeName}</span>
            </div>
            <div className="text-[#515154] text-xs pl-5 leading-relaxed">
              {addressLine}
              <br />
              {cityState}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-full text-[10px] font-semibold shrink-0">
            Open Today
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#6e6e73] pl-5">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span>{hours}</span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-black/[0.06] flex items-center justify-between gap-2">
          {/* Coordinates Chip */}
          <button
            type="button"
            onClick={handleCopyCoords}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#515154] hover:text-[#1d1d1f] bg-white px-2.5 py-1 rounded-lg border border-black/5 transition-colors cursor-pointer"
            title="Click to copy coordinates"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-700 font-sans font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} className="text-gray-400" />
                <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
              </>
            )}
          </button>

          {/* External Navigation Link */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 bg-[#0071e3] text-white rounded-lg text-xs font-semibold hover:bg-[#0077ed] active:scale-95 transition-all shadow-2xs"
          >
            <Navigation size={12} />
            <span>Get Directions</span>
            <ExternalLink size={11} className="opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
