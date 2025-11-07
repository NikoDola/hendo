'use client';

import { useState } from 'react';
import { CreateMusicData } from '@/lib/music';
import HashtagInput from './HashtagInput';
import { FileAudio, FileText, DollarSign } from 'lucide-react';

interface MusicUploadFormProps {
  onSubmit: (data: CreateMusicData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateMusicData>;
  mode?: 'create' | 'edit';
}

export default function MusicUploadForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  mode = 'create'
}: MusicUploadFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    hashtags: initialData?.hashtags || [],
    genre: initialData?.genre || '',
    price: initialData?.price || 0,
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.genre.trim()) newErrors.genre = 'Genre is required';
    if (formData.hashtags.length === 0) newErrors.hashtags = 'At least one hashtag is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!audioFile && mode === 'create') newErrors.audioFile = 'Audio file is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        audioFile: audioFile!,
        pdfFile: pdfFile || undefined
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleHashtagChange = (hashtags: string[]) => {
    setFormData(prev => ({ ...prev, hashtags }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {mode === 'create' ? 'Upload New Music' : 'Edit Music Track'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Enter music title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Enter music description"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre *
          </label>
          <input
            type="text"
            value={formData.genre}
            onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.genre ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Enter music genre (e.g., Pop, Rock, Jazz)"
          />
          {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre}</p>}
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hashtags *
          </label>
          <HashtagInput
            hashtags={formData.hashtags}
            onChange={handleHashtagChange}
            placeholder="Type hashtags and press comma..."
          />
          {errors.hashtags && <p className="text-red-500 text-sm mt-1">{errors.hashtags}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price ($) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="0.00"
            />
          </div>
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        {/* Audio File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File {mode === 'create' && '*'}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FileAudio className="mx-auto text-gray-400 mb-2" size={48} />
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
            >
              {audioFile ? audioFile.name : 'Click to upload audio file'}
            </label>
            {errors.audioFile && <p className="text-red-500 text-sm mt-1">{errors.audioFile}</p>}
          </div>
        </div>

        {/* PDF File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rights PDF (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FileText className="mx-auto text-gray-400 mb-2" size={48} />
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
            >
              {pdfFile ? pdfFile.name : 'Click to upload PDF file'}
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : (mode === 'create' ? 'Upload Music' : 'Update Music')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
