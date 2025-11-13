import React, { useState, useEffect } from 'react';
import { sfxLibraryService, SoundEffect, SFXCategory } from '../services/sfxLibrary';

interface SfxLibraryBrowserProps {
  onAddToSoundscape?: (sfx: SoundEffect) => void;
  onClose?: () => void;
}

export default function SfxLibraryBrowser({ onAddToSoundscape, onClose }: SfxLibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SoundEffect[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSfx, setSelectedSfx] = useState<SoundEffect | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>(['local', 'freesound', 'zapsplat', 'soundbible']);
  const [durationFilter, setDurationFilter] = useState<{ min: number; max: number }>({ min: 0, max: 60 });
  const [formatFilter, setFormatFilter] = useState<string[]>(['mp3', 'wav', 'ogg']);

  const categories = sfxLibraryService.getCategories();

  const categoryIcons: Record<string, string> = {
    'Ambience': '🌲',
    'Foley': '👣',
    'UI Sounds': '🔔',
    'Creatures': '🦁',
    'Vehicles': '🚗',
    'Weapons': '⚔️',
    'Magic & Sci-Fi': '✨',
    'Household': '🏠',
    'Nature': '🌊',
    'Human': '🗣️'
  };

  useEffect(() => {
    handleSearch();
  }, [selectedCategory, selectedSources, durationFilter, formatFilter]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await sfxLibraryService.search({
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        source: selectedSources,
        minDuration: durationFilter.min,
        maxDuration: durationFilter.max,
        format: formatFilter,
        limit: 50
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayPreview = async (sfx: SoundEffect) => {
    if (isPlaying === sfx.id) {
      audioPreview?.pause();
      setIsPlaying(null);
      return;
    }

    if (audioPreview) {
      audioPreview.pause();
    }

    try {
      const result = await sfxLibraryService.previewSfx(sfx);
      if (result.success && result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.addEventListener('ended', () => setIsPlaying(null));
        audio.play();
        setAudioPreview(audio);
        setIsPlaying(sfx.id);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleAddSfx = async (sfx: SoundEffect) => {
    if (onAddToSoundscape) {
      onAddToSoundscape(sfx);
    }
  };

  const handleDownload = async (sfx: SoundEffect) => {
    try {
      await sfxLibraryService.downloadSfx(sfx, './sfx/' + sfx.name);
      await handleSearch();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-gray-900 rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col m-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Sound Effects Library</h2>
            <p className="text-sm text-gray-400 mt-1">Browse and add professional sound effects to your audiobook</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Categories & Filters */}
          <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4 space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="footsteps, door, explosion..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  📂 All Categories
                </button>
                {categories.map((category: SFXCategory) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === category.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <span>{categoryIcons[category.name]}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Sources</h3>
              <div className="space-y-2">
                {['local', 'freesound', 'zapsplat', 'soundbible'].map((source) => (
                  <label key={source} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source)}
                      onChange={() => toggleSource(source)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-300 capitalize">{source}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Duration</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={durationFilter.min}
                    onChange={(e) => setDurationFilter({ ...durationFilter, min: parseInt(e.target.value) })}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={durationFilter.max}
                    onChange={(e) => setDurationFilter({ ...durationFilter, max: parseInt(e.target.value) })}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400 text-sm">sec</span>
                </div>
              </div>
            </div>

            {/* Format Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Format</h3>
              <div className="space-y-2">
                {['mp3', 'wav', 'ogg'].map((format) => (
                  <label key={format} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formatFilter.includes(format)}
                      onChange={() => {
                        setFormatFilter(prev =>
                          prev.includes(format)
                            ? prev.filter(f => f !== format)
                            : [...prev, format]
                        );
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-300 uppercase">{format}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Results Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Searching...</div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">No sound effects found</p>
                  <p className="text-sm mt-2">Try adjusting your filters or search query</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-400">
                  Found {searchResults.length} sound effects
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((sfx) => (
                    <div
                      key={sfx.id}
                      className={`bg-gray-800 rounded-lg p-4 border transition-all ${
                        selectedSfx?.id === sfx.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedSfx(sfx)}
                    >
                      {/* SFX Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{sfx.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              {sfx.category}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs uppercase">
                              {sfx.format}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPreview(sfx);
                          }}
                          className={`ml-2 p-2 rounded-lg transition-colors ${
                            isPlaying === sfx.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {isPlaying === sfx.id ? '⏸' : '▶'}
                        </button>
                      </div>

                      {/* Tags */}
                      {sfx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {sfx.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {sfx.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                              +{sfx.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400">
                        <div>Duration: {formatDuration(sfx.duration)}</div>
                        <div>Size: {(sfx.fileSize / 1024 / 1024).toFixed(1)} MB</div>
                        <div className="col-span-2">
                          Source: <span className="text-gray-300 capitalize">{sfx.source}</span>
                        </div>
                      </div>

                      {/* Waveform Placeholder */}
                      {sfx.waveformUrl && (
                        <div className="mb-3 h-12 bg-gray-700 rounded overflow-hidden">
                          <img src={sfx.waveformUrl} alt="Waveform" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {sfx.source !== 'local' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(sfx);
                            }}
                            className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                          >
                            📥 Download
                          </button>
                        )}
                        {onAddToSoundscape && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSfx(sfx);
                            }}
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                          >
                            ➕ Add to Project
                          </button>
                        )}
                      </div>

                      {/* License Info */}
                      {sfx.license && (
                        <div className="mt-2 text-xs text-gray-500">
                          License: {sfx.license}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}