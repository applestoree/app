import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getStates, getCities, getPostcodes, findPostcode } from 'malaysia-postcodes';
import { MapPin, Search, Navigation, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface NominatimAddressResponse {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    street?: string;
    house_number?: string;
    building?: string;
    amenity?: string;
    commercial?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface ResolvedAddressResult {
  street: string;
  city: string;
  state: string;
  postcode: string;
  displayName: string;
  lat: number;
  lon: number;
}

interface DeliveryAddressMapProps {
  onAddressResolved: (resolved: ResolvedAddressResult) => void;
  initialLat?: number;
  initialLon?: number;
}

// Map Nominatim state names to standard malaysia-postcodes names
export const normalizeMalaysianState = (nominatimState: string | undefined): string => {
  if (!nominatimState) return '';
  const clean = nominatimState.toLowerCase().trim();
  const states = getStates();

  if (clean.includes('kuala lumpur')) return 'Wp Kuala Lumpur';
  if (clean.includes('putrajaya')) return 'Wp Putrajaya';
  if (clean.includes('labuan')) return 'Wp Labuan';
  if (clean.includes('penang') || clean.includes('pulau pinang')) return 'Pulau Pinang';
  if (clean.includes('malacca') || clean.includes('melaka')) return 'Melaka';

  const exactMatch = states.find((s) => s.toLowerCase() === clean);
  if (exactMatch) return exactMatch;

  const partialMatch = states.find((s) => clean.includes(s.toLowerCase()) || s.toLowerCase().includes(clean));
  return partialMatch || '';
};

// Format Nominatim JSON response to structured address
export const formatNominatimAddress = (data: NominatimAddressResponse): ResolvedAddressResult => {
  const addr = data.address || {};
  const lat = parseFloat(data.lat);
  const lon = parseFloat(data.lon);

  // 1. Resolve State
  let matchedState = normalizeMalaysianState(addr.state);
  if (!matchedState && addr.city?.toLowerCase().includes('kuala lumpur')) {
    matchedState = 'Wp Kuala Lumpur';
  }

  // If postcode exists, verify with malaysia-postcodes library
  let matchedPostcode = addr.postcode ? addr.postcode.replace(/\D/g, '') : '';
  let matchedCity = '';

  if (matchedPostcode && matchedPostcode.length === 5) {
    const pcData = findPostcode(matchedPostcode);
    if (pcData && pcData.found && pcData.state && pcData.city) {
      if (!matchedState) matchedState = pcData.state;
      matchedCity = pcData.city;
    }
  }

  // 2. Resolve City if not found by postcode
  if (!matchedCity && matchedState) {
    const validCities = getCities(matchedState) || [];
    const rawCityCandidates = [
      addr.city,
      addr.town,
      addr.municipality,
      addr.city_district,
      addr.suburb,
      addr.neighbourhood,
      addr.county,
    ].filter(Boolean) as string[];

    for (const candidate of rawCityCandidates) {
      const cLow = candidate.toLowerCase();
      const direct = validCities.find((c) => c.toLowerCase() === cLow);
      if (direct) {
        matchedCity = direct;
        break;
      }
      const partial = validCities.find((c) => c.toLowerCase().includes(cLow) || cLow.includes(c.toLowerCase()));
      if (partial) {
        matchedCity = partial;
        break;
      }
    }

    if (!matchedCity && validCities.length > 0) {
      matchedCity = validCities[0];
    }
  }

  // 3. Fallback postcode if city is known
  if (!matchedPostcode && matchedState && matchedCity) {
    const postcodes = getPostcodes(matchedState, matchedCity) || [];
    if (postcodes.length > 0) {
      matchedPostcode = postcodes[0];
    }
  }

  // 4. Construct clean Street Address string from JSON fields
  const buildingName = addr.building || addr.amenity || addr.commercial || '';
  const roadName = addr.road || addr.street || '';
  const houseNum = addr.house_number ? `No. ${addr.house_number}` : '';
  const roadPart = [houseNum, roadName].filter(Boolean).join(' ');
  const areaPart = addr.suburb || addr.neighbourhood || addr.city_district || '';

  const streetParts = [buildingName, roadPart, areaPart].filter(Boolean);
  const formattedStreet = streetParts.length > 0 ? streetParts.join(', ') : data.display_name.split(',').slice(0, 2).join(', ').trim();

  return {
    street: formattedStreet,
    city: matchedCity || addr.city || addr.town || '',
    state: matchedState || addr.state || '',
    postcode: matchedPostcode,
    displayName: data.display_name,
    lat,
    lon,
  };
};

export const DeliveryAddressMap: React.FC<DeliveryAddressMapProps> = ({
  onAddressResolved,
  initialLat = 3.1499, // The Exchange TRX, Kuala Lumpur
  initialLon = 101.7135,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedPreview, setResolvedPreview] = useState<ResolvedAddressResult | null>(null);

  // Search feature with Nominatim OpenStreetMap Search API
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimAddressResponse[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Apple-style marker icon
  const createPinIcon = () =>
    L.divIcon({
      className: 'custom-apple-pin',
      html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; background: rgba(0, 113, 227, 0.2); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; background: #0071e3; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0, 113, 227, 0.45); border: 2.5px solid white;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

  // Reverse geocoding via Nominatim
  const reverseGeocode = async (lat: number, lon: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en-MY, en;q=0.9, ms-MY;q=0.8, ms;q=0.7',
        },
      });

      if (!res.ok) {
        throw new Error('Nominatim geocoding service unavailable');
      }

      const json: NominatimAddressResponse = await res.json();
      const formatted = formatNominatimAddress(json);
      setResolvedPreview(formatted);
      onAddressResolved(formatted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to retrieve address from map';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 15,
      zoomControl: false,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Draggable pinpoint marker
    const marker = L.marker([initialLat, initialLon], {
      icon: createPinIcon(),
      draggable: true,
      autoPan: true,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      reverseGeocode(position.lat, position.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Trigger initial geocode
    reverseGeocode(initialLat, initialLon);

    // Continuous ResizeObserver to guarantee 100% full width on container layout
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Handle container resize when overlay opens
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Handle location search with Nominatim Search API
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        searchQuery + ', Malaysia'
      )}&countrycodes=my&addressdetails=1&limit=5`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en-MY, en;q=0.9, ms-MY;q=0.8, ms;q=0.7',
        },
      });

      if (!res.ok) throw new Error('Search failed');

      const results: NominatimAddressResponse[] = await res.json();
      setSearchResults(results);
      setShowDropdown(true);

      if (results.length === 0) {
        setErrorMessage('No matching places found in Malaysia. Try a different query.');
      }
    } catch {
      setErrorMessage('Search service error. Please try again or tap the map directly.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: NominatimAddressResponse) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 17, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lon]);
    }

    const formatted = formatNominatimAddress(result);
    setResolvedPreview(formatted);
    onAddressResolved(formatted);
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage('Location permission denied. Please search or tap on the map.');
        } else {
          setErrorMessage('Unable to retrieve current location. Please tap on map.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-2.5 w-full min-w-full">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            id="map-location-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search place / road in Malaysia (e.g. TRX, KLCC, Bangsar)..."
            className="w-full pl-9 pr-20 py-2 bg-[#f5f5f7] border border-black/10 focus:border-[#0071e3] focus:bg-white rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all placeholder:text-gray-400"
          />
          <div className="absolute left-3 pointer-events-none text-gray-400">
            <Search size={14} />
          </div>

          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-2.5 py-1 bg-[#0071e3] disabled:bg-gray-300 text-white rounded-lg text-[11px] font-semibold transition-all hover:bg-[#0077ed] cursor-pointer"
            >
              {isSearching ? <Loader2 size={12} className="animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-black/10 rounded-xl shadow-lg z-1000 overflow-hidden divide-y divide-gray-100">
            {searchResults.map((res) => (
              <button
                key={res.place_id}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50/60 transition-colors flex items-start gap-2 cursor-pointer"
              >
                <MapPin size={14} className="text-[#0071e3] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#1d1d1f] truncate">
                    {res.address?.building || res.address?.road || res.display_name.split(',')[0]}
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate">{res.display_name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Canvas Frame */}
      <div className="relative w-full min-w-full rounded-2xl overflow-hidden border border-black/10 shadow-inner bg-gray-100 h-64">
        <div
          ref={mapContainerRef}
          className="w-full min-w-full !w-full h-full min-h-full z-10 block"
          style={{ width: '100%', minWidth: '100%', height: '100%' }}
        />

        {/* Floating Quick Action: GPS My Location */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          title="Use my current GPS location"
          className="absolute top-2.5 right-2.5 z-400 bg-white/95 hover:bg-white text-[#1d1d1f] p-2 rounded-xl shadow-md border border-black/5 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer backdrop-blur-xs"
        >
          <Navigation size={13} className="text-[#0071e3]" />
          <span className="text-[11px] font-semibold text-[#0071e3]">Locate Me</span>
        </button>

        {/* Instructions Overlay Banner */}
        <div className="absolute bottom-2 left-2 right-16 z-400 pointer-events-none">
          <div className="inline-block bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-medium text-[#1d1d1f] shadow-xs border border-black/5">
            📍 Drag marker or tap anywhere to auto-fill address
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-500 flex items-center justify-center gap-2 text-xs font-semibold text-[#0071e3]">
            <Loader2 size={16} className="animate-spin" />
            <span>Fetching address from Nominatim...</span>
          </div>
        )}
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Nominatim Auto-Detection Success Pill */}
      {resolvedPreview && !isLoading && (
        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60 space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Auto-filled via OpenStreetMap Nominatim</span>
            </div>
            <span className="text-[10px] text-emerald-700/80 font-mono">
              {resolvedPreview.lat.toFixed(4)}, {resolvedPreview.lon.toFixed(4)}
            </span>
          </div>

          <div className="text-xs text-emerald-950 font-medium leading-tight">
            {resolvedPreview.street || 'Address resolved'}
          </div>

          <div className="text-[11px] text-emerald-800">
            {[resolvedPreview.city, resolvedPreview.postcode, resolvedPreview.state].filter(Boolean).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};
