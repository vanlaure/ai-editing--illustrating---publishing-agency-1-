import React, { useState, useEffect } from 'react';
import { webSocketService } from '../services/webSocketService';

interface MediaItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  filename: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  created_at: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (mediaUrl: string, mediaType: 'image' | 'video') => void;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelectMedia }: MediaLibraryModalProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMediaLibrary();
      
      // Subscribe to video generation events
      const handleVideoGenerated = () => {
        // Whenever a new video arrives, refresh the library list
        fetchMediaLibrary();
      };
      
      webSocketService.on('video_generated', handleVideoGenerated);
      
      return () => {
        webSocketService.off('video_generated', handleVideoGenerated);
      };
    }
  }, [isOpen]);

  const fetchMediaLibrary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/media/library`);
      if (!response.ok) {
        throw new Error('Failed to fetch media library');
      }
      
      const data = await response.json();
      const allMedia = [...data.images, ...data.videos];
      setMediaItems(allMedia);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = mediaItems
    .filter(item => filterType === 'all' || item.type === filterType)
    .filter(item => 
      searchQuery === '' || 
      item.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSelectMedia = (item: MediaItem) => {
    onSelectMedia(item.url, item.type);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'image'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'video'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Videos
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}

          {!loading && !error && filteredMedia.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">No media found</p>
            </div>
          )}

          {!loading && !error && filteredMedia.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="group relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => handleSelectMedia(item)}
                >
                  <div className="aspect-video relative">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <button className="opacity-0 group-hover:opacity-100 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium transition-opacity">
                        Select
                      </button>
                    </div>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-900 truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 uppercase">
                        {item.type}
                      </span>
                      {item.duration && (
                        <span className="text-xs text-gray-500">
                          {item.duration.toFixed(1)}s
                        </span>
                      )}
                      {item.width && item.height && (
                        <span className="text-xs text-gray-500">
                          {item.width}×{item.height}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          Showing {filteredMedia.length} of {mediaItems.length} items
        </div>
      </div>
    </div>
  );
}
import { BACKEND_URL } from '../services/backendService';
