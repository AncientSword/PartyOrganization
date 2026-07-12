import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X } from 'lucide-react';
import { useAmap } from '@/hooks/useAmap';

interface LocationSelectorProps {
  value: { name: string; lng: number; lat: number } | null;
  onChange: (location: { name: string; lng: number; lat: number } | null) => void;
  placeholder?: string;
}

export default function LocationSelector({ value, onChange, placeholder = '搜索地点' }: LocationSelectorProps) {
  const { hasKey, searchPlace } = useAmap();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; address: string; location: { lng: number; lat: number } }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const doSearch = useCallback(
    async (kw: string) => {
      if (!hasKey || !kw.trim()) {
        setSuggestions([]);
        return;
      }
      const results = await searchPlace(kw);
      setSuggestions(results);
      setShowSuggestions(true);
      updateDropdownPosition();
    },
    [hasKey, searchPlace, updateDropdownPosition]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(keyword), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) {
        setShowSuggestions(false);
      }
    };
    const handleScroll = () => {
      if (showSuggestions) updateDropdownPosition();
    };
    const handleResize = () => {
      if (showSuggestions) updateDropdownPosition();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showSuggestions, updateDropdownPosition]);

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
      updateDropdownPosition();
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2">
        <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span className="text-sm text-zinc-200 truncate flex-1">{value.name}</span>
        <button
          onClick={() => onChange(null)}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const dropdown = hasKey && showSuggestions && suggestions.length > 0 && (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: dropdownStyle.top,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        zIndex: 9999,
      }}
      className="bg-zinc-800 border border-zinc-600 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => {
            onChange({ name: s.name, lng: s.location.lng, lat: s.location.lat });
            setKeyword('');
            setSuggestions([]);
            setShowSuggestions(false);
          }}
          className="w-full text-left px-3 py-2.5 hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-0"
        >
          <div className="text-sm text-zinc-200">{s.name}</div>
          <div className="text-xs text-zinc-500 truncate">{s.address}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
