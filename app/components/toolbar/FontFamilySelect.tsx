// app/components/toolbar/FontFamilySelect.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import Popover from "./Popover";

interface Font {
  name: string;
  family: string;
  url?: string; // Google Fonts stylesheet URL
}

const POPULAR_FONTS: Font[] = [
  { name: "Arial", family: "Arial, Helvetica, sans-serif" },
  { name: "Georgia", family: "Georgia, serif" },
  { name: "Domine", family: "Domine, serif", url: "https://fonts.googleapis.com/css2?family=Domine:wght@400;700&display=swap" },
  { name: "Recoleta", family: "var(--font-recoleta), serif" },
  { name: "Roboto", family: "'Roboto', sans-serif" },
  { name: "Open Sans", family: "'Open Sans', sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
  { name: "Lato", family: "'Lato', sans-serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif" },
  { name: "Poppins", family: "'Poppins', sans-serif" },
  { name: "Oswald", family: "'Oswald', sans-serif" },
  { name: "Raleway", family: "'Raleway', sans-serif" },
  { name: "Merriweather", family: "'Merriweather', serif" },
  { name: "Nunito", family: "'Nunito', sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Noto Sans", family: "'Noto Sans', sans-serif" },
  { name: "Source Sans Pro", family: "'Source Sans Pro', sans-serif" },
  { name: "Ubuntu", family: "'Ubuntu', sans-serif" },
  { name: "Fira Sans", family: "'Fira Sans', sans-serif" },
  { name: "Inconsolata", family: "'Inconsolata', monospace" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

export function FontFamilySelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fonts, setFonts] = useState<Font[]>(POPULAR_FONTS);
  const [recent, setRecent] = useState<string[]>([]);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // load recent fonts
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("recent_fonts");
    if (stored) {
      try {
        setRecent(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // fetch full font list once
  useEffect(() => {
    fetch("/api/fonts")
      .then((res) => res.json())
      .then((list: { name: string; category: string }[]) => {
        const extras = list.map((f) => ({
          name: f.name,
          family: `'${f.name}', ${f.category === "serif" ? "serif" : "sans-serif"}`,
        }));
        setFonts((prev) => {
          const seen = new Set(prev.map((p) => p.name));
          const merged = [...prev];
          extras.forEach((f) => {
            if (!seen.has(f.name)) merged.push(f);
          });
          return merged;
        });
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  // computed list with recents on top
  const allFonts = useMemo(() => {
    const recents = recent
      .map((n) => fonts.find((f) => f.name === n))
      .filter((f): f is Font => !!f);
    const others = fonts.filter((f) => !recent.includes(f.name));
    return [...recents, ...others];
  }, [fonts, recent]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allFonts.filter((f) => f.name.toLowerCase().includes(q));
  }, [query, allFonts]);

  const loadFont = (f: Font) => {
    const url = f.url || `https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, "+")}&display=swap`;
    if (!document.querySelector(`link[data-font="${f.name}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.setAttribute("data-font", f.name);
      document.head.appendChild(link);
    }
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    btnRef.current?.focus();
    setRecent((prev) => {
      const next = [name, ...prev.filter((n) => n !== name)].slice(0, 5);
      localStorage.setItem("recent_fonts", JSON.stringify(next));
      return next;
    });
  };

  const current = fonts.find((f) => f.name === value) || fonts[0];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="h-12 min-w-[9rem] px-3 flex items-center justify-between rounded-lg bg-white/80 border border-teal-800/10 text-sm disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
        style={{ fontFamily: current.family }}
      >
        {current.name}
        <ChevronDown className="ml-1 h-4 w-4" />
      </button>

      <Popover anchor={btnRef.current} open={open} onClose={() => setOpen(false)}>
        <div className="max-h-60 w-48 p-1">
          <input
            ref={searchRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace") e.stopPropagation();
            }}
            placeholder="Search fonts"
            className="mb-1 w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          />
          <Virtuoso
            style={{ height: "10rem" }}
            totalCount={filtered.length}
            itemContent={(i) => {
              const f = filtered[i];
              return (
                <FontRow
                  key={f.name}
                  font={f}
                  selected={value === f.name}
                  onSelect={() => handleSelect(f.name)}
                  loadFont={loadFont}
                />
              );
            }}
          />
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No fonts found</div>
          )}
        </div>
      </Popover>
    </>
  );
}

interface RowProps {
  font: Font;
  selected: boolean;
  onSelect: () => void;
  loadFont: (f: Font) => void;
}

function FontRow({ font, selected, onSelect, loadFont }: RowProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadFont(font);
        obs.disconnect();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [font, loadFont]);

  return (
    <div className="my-0.5">
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        className={`w-full text-left px-3 py-1.5 rounded-md focus:outline-none hover:bg-[--walty-cream] focus:bg-[--walty-cream] ${
          selected ? "bg-[--walty-cream]" : ""
        }`}
        style={{ fontFamily: font.family }}
      >
        {font.name}
      </button>
    </div>
  );
}
