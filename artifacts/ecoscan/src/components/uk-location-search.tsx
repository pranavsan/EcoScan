import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

export interface UKPlace {
  displayName: string;
  shortName: string;
  area: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    county?: string;
    state_district?: string;
    state?: string;
    suburb?: string;
    borough?: string;
  };
}

function extractArea(result: NominatimResult): string {
  const a = result.address;
  if (!a) return "United Kingdom";
  return (
    a.borough ||
    a.city ||
    a.town ||
    a.county ||
    a.state_district ||
    a.state ||
    "United Kingdom"
  );
}

function extractShortName(result: NominatimResult): string {
  const parts = result.display_name.split(",");
  return parts.slice(0, 2).join(",").trim();
}

interface UKLocationSearchProps {
  value: string;
  onChange: (place: UKPlace) => void;
  placeholder?: string;
}

export function UKLocationSearch({ value, onChange, placeholder = "Search for a UK location..." }: UKLocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=gb&format=json&limit=8&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en-GB" },
        });
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: NominatimResult) {
    const place: UKPlace = {
      displayName: result.display_name,
      shortName: extractShortName(result),
      area: extractArea(result),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    setQuery(place.shortName);
    setIsOpen(false);
    onChange(place);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
          data-testid="input-location-search"
        />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          {results.map((result) => (
            <button
              key={result.place_id}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent/60 transition-colors flex items-start gap-2 border-b border-border/40 last:border-0"
              onClick={() => handleSelect(result)}
              data-testid={`location-result-${result.place_id}`}
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">{extractShortName(result)}</p>
                <p className="text-xs text-muted-foreground truncate">{result.display_name.split(",").slice(2, 5).join(",").trim()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
