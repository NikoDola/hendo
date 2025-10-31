'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface HashtagInputProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
}

export default function HashtagInput({ hashtags, onChange, placeholder = "Type hashtags and press comma..." }: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  const addHashtag = () => {
    const newTag = inputValue.trim();
    if (newTag && !hashtags.includes(newTag)) {
      onChange([...hashtags, newTag]);
      setInputValue('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    onChange(hashtags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeHashtag(tag)}
              className="ml-1 hover:text-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addHashtag}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
