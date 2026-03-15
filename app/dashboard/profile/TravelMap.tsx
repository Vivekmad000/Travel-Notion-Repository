"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Map as LeafletMap } from "leaflet";
import type { VisitedCityData } from "./ProfileClient";
import { normalizeCountry, getFlagColor, COUNTRY_ISO2 } from "@/lib/countryData";

type Suggestion = {
  cityName: string;
  country: string;
  lat: number;
  lng: number;
  displayName: string;
};

async function searchCities(query: string): Promise<Suggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&accept-language=en`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "TravelNotion/1.0" } });
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .map((item: any) => {
        const { lat, lon, address, display_name } = item;
        const country = address?.country || display_name?.split(",").pop()?.trim() || "";
        const cityName =
          address?.city ||
          address?.town ||
          address?.village ||
          address?.county ||
          display_name?.split(",")[0]?.trim() ||
          query;
        const displayName = country ? `${cityName}, ${country}` : cityName;
        return { cityName, country, lat: parseFloat(lat), lng: parseFloat(lon), displayName };
      })
      .filter(
        (item: Suggestion, index: number, arr: Suggestion[]) =>
          arr.findIndex(
            (s) =>
              s.cityName.toLowerCase() === item.cityName.toLowerCase() &&
              s.country.toLowerCase() === item.country.toLowerCase()
          ) === index
      );
  } catch {
    return [];
  }
}

type Props = {
  visitedCities: VisitedCityData[];
  onCityAdded: (city: VisitedCityData) => void;
  onCityRemoved: (id: string) => void;
};

export default function TravelMap({ visitedCities, onCityAdded, onCityRemoved }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clusterGroupRef = useRef<any | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  // Always-current ref so async map init reads the latest visitedCities
  const visitedCitiesRef = useRef<VisitedCityData[]>(visitedCities);
  useEffect(() => { visitedCitiesRef.current = visitedCities; }, [visitedCities]);
  // Tracks whether the full map (GeoJSON + SVG) is ready for pattern injection
  const mapReadyRef = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search as user types
  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    setShowDropdown(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSuggestions([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchCities(val.trim());
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setSearching(false);
    }, 400);
  };

  // Check if a suggestion is already in visited list
  const findVisited = (s: Suggestion) =>
    visitedCities.find(
      (c) => c.cityName.toLowerCase() === s.cityName.toLowerCase() &&
             c.country.toLowerCase() === s.country.toLowerCase()
    );

  const handleAdd = async (s: Suggestion) => {
    const key = `${s.cityName}-${s.country}`;
    setActionLoadingKey(key);
    try {
      const res = await fetch("/api/profile/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: s.cityName, country: s.country, lat: s.lat, lng: s.lng }),
      });
      if (!res.ok) return;
      const saved: VisitedCityData = await res.json();
      onCityAdded(saved);
      mapRef.current?.flyTo([saved.lat, saved.lng], 6, { duration: 1.2 });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionLoadingKey(id);
    try {
      const res = await fetch(`/api/profile/cities/${id}`, { method: "DELETE" });
      if (res.ok) onCityRemoved(id);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ── Map initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    let L: typeof import("leaflet");

    async function initMap() {
      const leaflet = await import("leaflet");
      L = leaflet.default ?? leaflet;
      await import("leaflet.markercluster");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [20, 0], zoom: 2, minZoom: 2, maxZoom: 12, worldCopyJump: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const geoRes = await fetch("/world-countries.geojson");
      const geoData = await geoRes.json();

      // Use ref so we always have the latest visitedCities (fixes timing issue)
      geoLayerRef.current = L.geoJSON(geoData, {
        style: (f) => countryStyle(f, visitedCitiesRef.current),
        onEachFeature: (f, layer) =>
          layer.bindTooltip(f.properties?.name ?? "", { sticky: true }),
      }).addTo(map);

      const mcg = (L as any).markerClusterGroup({ maxClusterRadius: 50 });
      clusterGroupRef.current = mcg;
      map.addLayer(mcg);

      visitedCitiesRef.current.forEach((city) => addMarker(L, mcg, city));

      // Mark map as ready, then apply flag patterns once the browser has
      // finished painting the SVG paths (requestAnimationFrame guarantees this)
      mapReadyRef.current = true;
      requestAnimationFrame(() => {
        applyCountryColors(visitedCitiesRef.current);
      });
    }

    initMap();
    return () => {
      mapReadyRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function countryStyle(feature: any, cities: VisitedCityData[]) {
    const geoName: string = feature?.properties?.name ?? "";
    const visited = new Set(cities.map((c) => normalizeCountry(c.country))).has(geoName);
    return {
      // For visited countries we'll override fill via SVG pattern after creation
      fillColor: visited ? "#aaaaaa" : "#d1d5db",
      fillOpacity: visited ? 0.6 : 0.25,
      color: "#9ca3af",
      weight: 0.8,
    };
  }

  function getOrCreateDefs(): SVGDefsElement | null {
    // Target the overlay pane SVG specifically — that's where GeoJSON paths live
    const svg = mapRef.current
      ?.getContainer()
      .querySelector(".leaflet-overlay-pane svg");
    if (!svg) return null;
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    return defs as SVGDefsElement;
  }

  /** Add a flag <pattern> to <defs> if not already present */
  function ensureFlagPattern(defs: SVGDefsElement, iso2: string) {
    const id = `flag-${iso2}`;
    if (defs.querySelector(`#${id}`)) return;
    const ns = "http://www.w3.org/2000/svg";
    const pattern = document.createElementNS(ns, "pattern");
    pattern.setAttribute("id", id);
    pattern.setAttribute("patternUnits", "objectBoundingBox");
    pattern.setAttribute("patternContentUnits", "objectBoundingBox");
    pattern.setAttribute("width", "1");
    pattern.setAttribute("height", "1");
    const img = document.createElementNS(ns, "image");
    img.setAttribute("href", `https://flagcdn.com/w320/${iso2}.png`);
    img.setAttribute("x", "0");
    img.setAttribute("y", "0");
    img.setAttribute("width", "1");
    img.setAttribute("height", "1");
    img.setAttribute("preserveAspectRatio", "xMidYMid slice");
    pattern.appendChild(img);
    defs.appendChild(pattern);
  }

  function applyCountryColors(cities: VisitedCityData[]) {
    if (!geoLayerRef.current) return;
    const visitedNormalized = new Set(cities.map((c) => normalizeCountry(c.country)));

    // First pass: set base styles (handles unvisited grey + border)
    geoLayerRef.current.setStyle((f) => countryStyle(f, cities));

    // Second pass: override fill for visited countries with flag pattern
    const defs = getOrCreateDefs();
    if (!defs) return;

    geoLayerRef.current.eachLayer((layer: any) => {
      const geoName: string = layer.feature?.properties?.name ?? "";
      if (!visitedNormalized.has(geoName)) return;
      const iso2 = COUNTRY_ISO2[geoName];
      if (!iso2) {
        // No flag image available — use flag color as fallback
        if (layer._path) layer._path.style.fill = getFlagColor(geoName);
        return;
      }
      ensureFlagPattern(defs, iso2);
      if (layer._path) layer._path.style.fill = `url(#flag-${iso2})`;
    });
  }

  function addMarker(L: any, mcg: any, city: VisitedCityData) {
    const pinIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:12px;height:12px;
        background:radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b);
        border-radius:50%;
        box-shadow:0 1px 3px rgba(0,0,0,0.5),inset 0 1px 2px rgba(240,236,224,0.3);
        border:1px solid #a93226;
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    const marker = L.marker([city.lat, city.lng], { icon: pinIcon });
    const el = document.createElement("div");
    el.className = "min-w-[130px]";
    el.innerHTML = `
      <p class="font-semibold text-gray-800 text-sm">${city.cityName}</p>
      <p class="text-xs text-gray-500 mb-2">${city.country}</p>
      <button id="rm-${city.id}" class="text-xs font-medium text-red-500 hover:text-red-700">
        − Remove
      </button>`;
    marker.bindPopup(el);
    marker.on("popupopen", () => {
      document.getElementById(`rm-${city.id}`)?.addEventListener("click", () => {
        handleRemove(city.id);
        marker.closePopup();
      });
    });
    mcg.addLayer(marker);
    markersRef.current.set(city.id, marker);
  }

  // Recolor countries when visited list changes — only after map is ready
  useEffect(() => {
    if (mapReadyRef.current) {
      applyCountryColors(visitedCities);
    }
  }, [visitedCities]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers when visited list changes
  useEffect(() => {
    const mcg = clusterGroupRef.current;
    if (!mcg || !mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default ?? mod;
      const currentIds = new Set(visitedCities.map((c) => c.id));
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) { mcg.removeLayer(marker); markersRef.current.delete(id); }
      });
      visitedCities.forEach((city) => {
        if (!markersRef.current.has(city.id)) addMarker(L, mcg, city);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedCities]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--tv-navy)", boxShadow: "0 1px 6px rgba(53,82,172,0.2)" }}>
      <div className="px-6 pt-6 pb-3">
        <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>
          My World Map
        </h2>

        {/* Search with dropdown */}
        <div ref={searchContainerRef} className="relative">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: "1px solid rgba(240,236,224,0.2)", backgroundColor: "rgba(240,236,224,0.1)" }}>
            <span className="text-sm shrink-0" style={{ color: "rgba(240,236,224,0.7)" }}>
              {searching ? "⏳" : <img src="/assets/eyeglass.png" alt="Search" width={18} height={18} style={{ display: "inline", filter: "brightness(0) invert(1)" }} />}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Search a city… (e.g. Tokyo, Paris, NYC)"
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-white/40"
              style={{ color: "var(--tv-cream)", fontFamily: "var(--font-nunito)" }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSuggestions([]); setShowDropdown(false); }}
                className="text-lg leading-none"
                style={{ color: "rgba(240,236,224,0.6)" }}
              >
                ×
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-[9999] overflow-hidden" style={{ backgroundColor: "var(--tv-blue)", border: "1px solid rgba(240,236,224,0.15)" }}>
              {suggestions.map((s) => {
                const visited = findVisited(s);
                const key = `${s.cityName}-${s.country}`;
                const loading = actionLoadingKey === key || actionLoadingKey === visited?.id;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-2.5 last:border-0"
                    style={{ borderBottom: "1px solid rgba(240,236,224,0.1)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--tv-cream)", fontFamily: "var(--font-fredoka)" }}>{s.cityName}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(240,236,224,0.65)" }}>{s.country}</p>
                    </div>
                    {visited ? (
                      <button
                        onClick={() => handleRemove(visited.id)}
                        disabled={!!loading}
                        className="ml-3 shrink-0 px-3 py-1 text-xs font-semibold rounded-lg disabled:opacity-50"
                        style={{ color: "#fca5a5", border: "1px solid #fca5a5", fontFamily: "var(--font-fredoka)" }}
                      >
                        {loading ? "…" : "Remove"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAdd(s)}
                        disabled={!!loading}
                        className="ml-3 shrink-0 px-3 py-1 text-xs font-semibold rounded-lg disabled:opacity-50"
                        style={{ color: "var(--tv-cream)", border: "1px solid rgba(240,236,224,0.3)", fontFamily: "var(--font-fredoka)" }}
                      >
                        {loading ? "…" : "+ Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="h-[480px] w-full z-0" />
    </div>
  );
}


// Nominatim geocode
async function geocodeCity(query: string): Promise<{
  cityName: string;
  country: string;
  lat: number;
  lng: number;
} | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=en`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "TravelNotion/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const { lat, lon, address, display_name } = data[0];
    const country = address?.country || display_name?.split(",").pop()?.trim() || query;
    const cityName =
      address?.city ||
      address?.town ||
      address?.village ||
      address?.county ||
      query;
    return { cityName, country, lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch {
    return null;
  }
}
