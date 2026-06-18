'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Plus, Search } from 'lucide-react';
import './GenreSelect.css';

interface GenreSelectProps {
  value: string;
  onChange: (genre: string) => void;
  /** Existing genres to choose from (e.g. derived from current tracks). */
  genres: string[];
  placeholder?: string;
}

/**
 * Custom dark-themed genre picker that replaces the native <select>.
 * - Searchable: type to filter the existing genres.
 * - Creatable: if the typed text matches nothing, offer to create it as a new genre.
 * Styled to match the rest of our interface (not the white OS dropdown).
 */
export default function GenreSelect({ value, onChange, genres, placeholder = 'Select a genre...' }: GenreSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset the query and focus the search field whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();
  const filtered = genres.filter((g) => g.toLowerCase().includes(lowerQuery));
  const exactMatch = genres.some((g) => g.toLowerCase() === lowerQuery);
  const canCreate = trimmedQuery.length > 0 && !exactMatch;

  const select = (genre: string) => {
    onChange(genre);
    setOpen(false);
  };

  return (
    <div className="genreSelect" ref={containerRef}>
      <button
        type="button"
        className="genreSelectTrigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? 'genreSelectValue' : 'genreSelectPlaceholder'}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`genreSelectChevron ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="genreSelectPanel" role="listbox">
          <div className="genreSelectSearch">
            <Search size={16} className="genreSelectSearchIcon" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filtered.length > 0) select(filtered[0]);
                  else if (canCreate) select(trimmedQuery);
                }
              }}
              placeholder="Search or create a genre..."
              className="genreSelectSearchInput"
            />
          </div>

          <div className="genreSelectOptions">
            {filtered.map((genre) => (
              <button
                type="button"
                key={genre}
                className={`genreSelectOption ${genre === value ? 'selected' : ''}`}
                onClick={() => select(genre)}
                role="option"
                aria-selected={genre === value}
              >
                <span>{genre}</span>
                {genre === value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}

            {filtered.length === 0 && !canCreate && (
              <div className="genreSelectEmpty">No genres yet — type to create one.</div>
            )}

            {canCreate && (
              <button type="button" className="genreSelectCreate" onClick={() => select(trimmedQuery)}>
                <Plus size={16} aria-hidden="true" />
                <span>Create &ldquo;{trimmedQuery}&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
