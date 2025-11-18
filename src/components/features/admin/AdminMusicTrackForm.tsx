import { useState } from 'react';
import { X, Upload, FileText, Image } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { MusicTrack } from '@/hooks/useMusicTracks';

interface TrackFormData {
  title: string;
  description: string;
  hashtags: string[];
  genre: string;
  price: string;
  audioFile: File | null;
  pdfFile: File | null;
  imageFile: File | null;
  showToHome: boolean;
}

// Predefined genres - can be extended
const DEFAULT_GENRES = [
  'Pop',
  'Rock',
  'Hip Hop',
  'R&B',
  'Jazz',
  'Electronic',
  'Classical',
  'Country',
  'Folk',
  'Blues',
  'Reggae',
  'Metal',
  'Punk',
  'Soul',
  'Funk',
  'House',
  'Techno',
  'Ambient',
  'Lo-Fi',
  'Indie'
];

interface AdminMusicTrackFormProps {
  track?: MusicTrack;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function AdminMusicTrackForm({ track, onSubmit, onCancel }: AdminMusicTrackFormProps) {
  const isEditing = !!track;
  const [formData, setFormData] = useState<TrackFormData>({
    title: track?.title || '',
    description: track?.description || '',
    hashtags: track?.hashtags || [],
    genre: track?.genre || '',
    price: track?.price.toString() || '',
    audioFile: null,
    pdfFile: null,
    imageFile: null,
    showToHome: track?.showToHome || false,
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<string[]>(DEFAULT_GENRES);
  const [isAddingNewGenre, setIsAddingNewGenre] = useState(false);
  const [newGenreInput, setNewGenreInput] = useState('');

  const handleHashtagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHashtagInput(value);

    if (value.includes(',')) {
      const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setFormData(prev => ({ ...prev, hashtags: [...prev.hashtags, ...tags] }));
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__ADD_NEW__') {
      setIsAddingNewGenre(true);
    } else {
      setFormData(prev => ({ ...prev, genre: value }));
    }
  };

  const handleAddNewGenre = () => {
    const trimmedGenre = newGenreInput.trim();
    if (trimmedGenre && !availableGenres.includes(trimmedGenre)) {
      setAvailableGenres(prev => [...prev, trimmedGenre].sort());
      setFormData(prev => ({ ...prev, genre: trimmedGenre }));
      setNewGenreInput('');
      setIsAddingNewGenre(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (!isEditing && !formData.audioFile) {
        throw new Error('Audio file is required');
      }

      // Upload files if provided
      let audioFileUrl: string | undefined;
      let audioFileName: string | undefined;
      let pdfFileUrl: string | undefined;
      let pdfFileName: string | undefined;
      let imageFileUrl: string | undefined;
      let imageFileName: string | undefined;

      if (formData.audioFile) {
        const timestamp = Date.now();
        audioFileName = `music/${timestamp}_${formData.audioFile.name}`;
        const audioStorageRef = ref(storage, audioFileName);
        await uploadBytes(audioStorageRef, formData.audioFile);
        audioFileUrl = await getDownloadURL(audioStorageRef);
      }

      if (formData.pdfFile) {
        const timestamp = Date.now();
        pdfFileName = `music/pdfs/${timestamp}_${formData.pdfFile.name}`;
        const pdfStorageRef = ref(storage, pdfFileName);
        await uploadBytes(pdfStorageRef, formData.pdfFile);
        pdfFileUrl = await getDownloadURL(pdfStorageRef);
      }

      if (formData.imageFile) {
        const timestamp = Date.now();
        imageFileName = `music/images/${timestamp}_${formData.imageFile.name}`;
        const imageStorageRef = ref(storage, imageFileName);
        await uploadBytes(imageStorageRef, formData.imageFile);
        imageFileUrl = await getDownloadURL(imageStorageRef);
      }

      await onSubmit({
        title: formData.title,
        description: formData.description,
        hashtags: formData.hashtags,
        genre: formData.genre,
        price: formData.price,
        audioFileUrl,
        audioFileName,
        pdfFileUrl,
        pdfFileName,
        imageFileUrl,
        imageFileName,
        showToHome: formData.showToHome
      });

      setSuccess(isEditing ? 'Track updated successfully!' : 'Track created successfully!');
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="adminProductForm">
      <h3 className="adminProductFormTitle">{isEditing ? 'Edit Track' : 'Add New Track'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="adminFormGroup">
          <label className="adminFormLabel">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="adminFormInput"
            required
          />
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="adminFormTextarea"
            rows={4}
            required
          />
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">Hashtags</label>
          <input
            type="text"
            value={hashtagInput}
            onChange={handleHashtagInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (hashtagInput.trim()) {
                  setFormData(prev => ({
                    ...prev,
                    hashtags: [...prev.hashtags, hashtagInput.trim()]
                  }));
                  setHashtagInput('');
                }
              }
            }}
            placeholder="Type hashtags separated by commas"
            className="adminFormInput"
          />
          {formData.hashtags.length > 0 && (
            <div className="adminHashtagsList">
              {formData.hashtags.map((tag, index) => (
                <span key={index} className="adminHashtag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(index)}
                    className="adminHashtagRemove"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">Genre (optional)</label>
          {isAddingNewGenre ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={newGenreInput}
                onChange={(e) => setNewGenreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewGenre();
                  }
                }}
                placeholder="Enter new genre..."
                className="adminFormInput"
                autoFocus
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddNewGenre}
                className="adminFormSubmitButton"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewGenre(false);
                  setNewGenreInput('');
                }}
                className="adminFormCancelButton"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              value={formData.genre}
              onChange={handleGenreChange}
              className="adminFormInput"
              style={{ cursor: 'pointer' }}
            >
              <option value="">Select a genre...</option>
              {availableGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
              <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--theme-color)' }}>
                + Add New Genre
              </option>
            </select>
          )}
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">Price ($) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="adminFormInput"
            required
          />
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">
            Audio File {isEditing ? '(optional, leave empty to keep current)' : '*'}
          </label>
          <label className="adminFileInputLabel">
            <Upload size={16} aria-hidden="true" />
            <span>{formData.audioFile?.name || 'Choose audio file...'}</span>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData(prev => ({ ...prev, audioFile: e.target.files?.[0] || null }))}
              className="adminFileInput"
              aria-label="Upload audio file"
            />
          </label>
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">
            PDF Rights File (optional) {isEditing && '(leave empty to keep current)'}
          </label>
          <label className="adminFileInputLabel">
            <FileText size={16} aria-hidden="true" />
            <span>{formData.pdfFile?.name || 'Choose PDF file...'}</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFormData(prev => ({ ...prev, pdfFile: e.target.files?.[0] || null }))}
              className="adminFileInput"
              aria-label="Upload PDF rights file"
            />
          </label>
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel">
            Cover Image (optional) {isEditing && '(leave empty to keep current)'}
          </label>
          <label className="adminFileInputLabel">
            <Image size={16} aria-hidden="true" />
            <span>{formData.imageFile?.name || 'Choose image file...'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData(prev => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
              className="adminFileInput"
              aria-label="Upload cover image"
            />
          </label>
        </div>

        <div className="adminFormGroup">
          <label className="adminFormLabel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.showToHome}
              onChange={(e) => setFormData(prev => ({ ...prev, showToHome: e.target.checked }))}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Show to Home</span>
          </label>
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            Check this to display this track on the home page
          </p>
        </div>

        {error && (
          <div className="adminFormError" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="adminFormSuccess" role="status">
            {success}
          </div>
        )}

        <div className="adminFormActions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="adminFormSubmitButton"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Track' : 'Create Track'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="adminFormCancelButton"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

