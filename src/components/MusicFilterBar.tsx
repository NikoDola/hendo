'use client';

import { Search } from 'lucide-react';
import './MusicFilterBar.css';

export interface FilterOptions {
  genre: string;
  priceOrder: 'none' | 'low-high' | 'high-low';
  dateOrder: 'newest' | 'oldest';
  searchQuery: string;
}

interface MusicFilterBarProps {
  filters: FilterOptions;
  availableGenres: string[];
  onFilterChange: (filters: FilterOptions) => void;
}

export default function MusicFilterBar({ filters, availableGenres, onFilterChange }: MusicFilterBarProps) {
  const handleGenreChange = (genre: string) => {
    onFilterChange({ ...filters, genre });
  };

  const handlePriceChange = (priceOrder: FilterOptions['priceOrder']) => {
    onFilterChange({ ...filters, priceOrder });
  };

  const handleDateChange = (dateOrder: FilterOptions['dateOrder']) => {
    onFilterChange({ ...filters, dateOrder });
  };

  const handleSearchChange = (searchQuery: string) => {
    onFilterChange({ ...filters, searchQuery });
  };

  return (
    <div className="musicFilterBar">
      <div className="musicFilterBarContent">
        {/* Genre Filter */}
        <div className="musicFilterGroup">
          <label className="musicFilterLabel">
            <span>Genre</span>
          </label>
          <select
            value={filters.genre}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="musicFilterSelect"
          >
            <option value="">All Genres</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Price Filter */}
        <div className="musicFilterGroup">
          <label className="musicFilterLabel">
            <span>Price</span>
          </label>
          <select
            value={filters.priceOrder}
            onChange={(e) => handlePriceChange(e.target.value as FilterOptions['priceOrder'])}
            className="musicFilterSelect"
          >
            <option value="none">Any Price</option>
            <option value="low-high">Low to High</option>
            <option value="high-low">High to Low</option>
          </select>
        </div>

        {/* Date Sort */}
        <div className="musicFilterGroup">
          <label className="musicFilterLabel">
            <span>Sort by Date</span>
          </label>
          <select
            value={filters.dateOrder}
            onChange={(e) => handleDateChange(e.target.value as FilterOptions['dateOrder'])}
            className="musicFilterSelect"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Search Bar - Full Width */}
      <div className="musicFilterSearchContainer">
        <Search size={20} className="musicFilterSearchIcon" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by title, description, or hashtags..."
          className="musicFilterSearchInput"
        />
      </div>
    </div>
  );
}

