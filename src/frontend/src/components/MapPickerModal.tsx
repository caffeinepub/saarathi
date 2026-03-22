import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const iconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

interface LocationResult {
  lat: number;
  lng: number;
  address: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface MapPickerModalProps {
  open: boolean;
  initialAddress?: string;
  onClose: () => void;
  onConfirm: (loc: LocationResult) => void;
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    // Already loaded
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    // Inject CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // Inject JS
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve((window as any).L);
    document.head.appendChild(script);
  });
}

export default function MapPickerModal({
  open,
  initialAddress,
  onClose,
  onConfirm,
}: MapPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress || "");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [address, setAddress] = useState(initialAddress || "");
  const [pin, setPin] = useState<LocationResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function initMap() {
      const L = await loadLeaflet();

      // Fix default icon issue
      (L.Icon.Default.prototype as any)._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

      if (!mapRef.current || !mounted) return;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;

      map.on("click", async (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        placeMarker(L, lat, lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr =
            data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(addr);
          setPin({ lat, lng, address: addr });
        } catch {
          const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(addr);
          setPin({ lat, lng, address: addr });
        }
      });
    }

    const timer = setTimeout(initMap, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [open]);

  function placeMarker(L: any, lat: number, lng: number) {
    if (!mapInstance.current) return;
    if (markerInstance.current) {
      markerInstance.current.remove();
    }
    const marker = L.marker([lat, lng], { draggable: true }).addTo(
      mapInstance.current,
    );
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        const addr =
          data.display_name || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        setAddress(addr);
        setPin({ lat: pos.lat, lng: pos.lng, address: addr });
      } catch {
        const addr = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        setAddress(addr);
        setPin({ lat: pos.lat, lng: pos.lng, address: addr });
      }
    });
    markerInstance.current = marker;
    mapInstance.current.setView([lat, lng], 15);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSuggestions([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { "Accept-Language": "en" } },
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectSuggestion(result: NominatimResult) {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    const addr = result.display_name;
    setSuggestions([]);
    setAddress(addr);
    setPin({ lat, lng, address: addr });
    const L = await loadLeaflet();
    placeMarker(L, lat, lng);
  }

  function handleConfirm() {
    if (pin) {
      onConfirm({ ...pin, address });
    } else if (address.trim()) {
      onConfirm({ lat: 0, lng: 0, address: address.trim() });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl bg-white border border-orange-200"
        data-ocid="activity.map_picker.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Pick Location on Map
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Search for a place in India..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-white flex-1"
            data-ocid="activity.map_picker.search_input"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            data-ocid="activity.map_picker.button"
          >
            <Search className="w-4 h-4 mr-1" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border border-orange-200 rounded-lg bg-white mb-2 max-h-36 overflow-y-auto shadow-sm">
            {suggestions.map((s, i) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: nominatim results
                key={i}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b border-orange-100 last:border-0 truncate text-stone-700"
                onClick={() => handleSelectSuggestion(s)}
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Map */}
        <div
          ref={mapRef}
          style={{ height: "300px" }}
          className="rounded-xl border border-orange-200 overflow-hidden w-full"
        />

        {/* Address field */}
        <div className="mt-3">
          <label
            htmlFor="map-address-input"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Selected Address (editable)
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address will appear here..."
            id="map-address-input"
            className="bg-white"
            data-ocid="activity.map_picker.input"
          />
        </div>

        <div className="flex gap-3 mt-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="activity.map_picker.cancel_button"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleConfirm}
            disabled={!address.trim()}
            data-ocid="activity.map_picker.confirm_button"
          >
            <MapPin className="w-4 h-4 mr-1" /> Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
