import React, { useState } from 'react';
import { AudiobookProject, AudioFormat, AudiobookMetadata, CoverArtAsset, ChapterMarker, ExportSettings } from '../types';

interface FormatOutputViewProps {
  projects: AudiobookProject[];
  onUpdateProject: (projectId: string, updates: Partial<AudiobookProject>) => void;
}

const FormatOutputView: React.FC<FormatOutputViewProps> = ({ projects, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [activeTab, setActiveTab] = useState<'formats' | 'metadata' | 'cover' | 'chapters' | 'export'>('formats');
  
  // Format configuration state
  const [selectedFormat, setSelectedFormat] = useState<'M4B' | 'MP3' | 'WAV' | 'FLAC' | 'AAC' | 'DAISY'>('M4B');
  const [bitrate, setBitrate] = useState<number>(128);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [bitDepth, setBitDepth] = useState<number>(16);
  
  // Metadata state
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadataForm, setMetadataForm] = useState<Partial<AudiobookMetadata>>({
    title: '',
    subtitle: '',
    author: '',
    narrator: '',
    publisher: '',
    language: 'en',
    genre: [],
    description: '',
    copyright: ''
  });
  
  // Cover art state
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [coverDimensions, setCoverDimensions] = useState('3000x3000');
  const [coverFormat, setCoverFormat] = useState<'jpg' | 'png'>('jpg');
  
  // Chapter marker state
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    chapterNumber: 1,
    title: '',
    timestamp: 0
  });
  
  // Export settings state
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    targetPlatforms: ['audible'],
    qualityPreset: 'high',
    includeChapterMarkers: true,
    normalizeAudio: true
  });
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleAddFormat = () => {
    if (!selectedProject) return;
    
    const newFormat: AudioFormat = {
      format: selectedFormat,
      bitrate: selectedFormat === 'MP3' || selectedFormat === 'AAC' ? bitrate : undefined,
      sampleRate: sampleRate,
      bitDepth: selectedFormat === 'WAV' ? bitDepth : undefined,
      duration: 0 // Will be set during export
    };
    
    const existingOutput = selectedProject.outputs[0] || {
      id: `output-${Date.now()}`,
      projectId: selectedProject.id,
      formats: [],
      metadata: metadataForm as AudiobookMetadata,
      coverArt: {
        imageUrl: '',
        dimensions: '3000x3000',
        format: 'jpg'
      },
      chapterMarkers: [],
      exportSettings: exportSettings,
      status: 'generating' as const
    };
    
    const updatedOutput = {
      ...existingOutput,
      formats: [...existingOutput.formats, newFormat]
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
  };

  const handleRemoveFormat = (format: AudioFormat) => {
    if (!selectedProject || !selectedProject.outputs[0]) return;
    
    const updatedOutput = {
      ...selectedProject.outputs[0],
      formats: selectedProject.outputs[0].formats.filter(f => f !== format)
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
  };

  const handleSaveMetadata = () => {
    if (!selectedProject) return;
    
    const existingOutput = selectedProject.outputs[0] || {
      id: `output-${Date.now()}`,
      projectId: selectedProject.id,
      formats: [],
      metadata: metadataForm as AudiobookMetadata,
      coverArt: {
        imageUrl: '',
        dimensions: '3000x3000',
        format: 'jpg'
      },
      chapterMarkers: [],
      exportSettings: exportSettings,
      status: 'generating' as const
    };
    
    const updatedOutput = {
      ...existingOutput,
      metadata: {
        ...existingOutput.metadata,
        ...metadataForm,
        publishDate: metadataForm.publishDate || new Date()
      } as AudiobookMetadata
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
    
    setShowMetadataModal(false);
  };

  const handleSaveCoverArt = () => {
    if (!selectedProject) return;
    
    const existingOutput = selectedProject.outputs[0] || {
      id: `output-${Date.now()}`,
      projectId: selectedProject.id,
      formats: [],
      metadata: metadataForm as AudiobookMetadata,
      coverArt: {
        imageUrl: '',
        dimensions: coverDimensions,
        format: coverFormat
      },
      chapterMarkers: [],
      exportSettings: exportSettings,
      status: 'generating' as const
    };
    
    const updatedOutput = {
      ...existingOutput,
      coverArt: {
        ...existingOutput.coverArt,
        dimensions: coverDimensions,
        format: coverFormat
      }
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
    
    setShowCoverModal(false);
  };

  const handleAddChapterMarker = () => {
    if (!selectedProject) return;
    
    const newMarker: ChapterMarker = {
      chapterNumber: chapterForm.chapterNumber,
      title: chapterForm.title,
      timestamp: chapterForm.timestamp
    };
    
    const existingOutput = selectedProject.outputs[0] || {
      id: `output-${Date.now()}`,
      projectId: selectedProject.id,
      formats: [],
      metadata: metadataForm as AudiobookMetadata,
      coverArt: {
        imageUrl: '',
        dimensions: '3000x3000',
        format: 'jpg'
      },
      chapterMarkers: [],
      exportSettings: exportSettings,
      status: 'generating' as const
    };
    
    const updatedOutput = {
      ...existingOutput,
      chapterMarkers: [...existingOutput.chapterMarkers, newMarker]
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
    
    setShowChapterModal(false);
    setChapterForm({ chapterNumber: chapterForm.chapterNumber + 1, title: '', timestamp: 0 });
  };

  const handleRemoveChapterMarker = (marker: ChapterMarker) => {
    if (!selectedProject || !selectedProject.outputs[0]) return;
    
    const updatedOutput = {
      ...selectedProject.outputs[0],
      chapterMarkers: selectedProject.outputs[0].chapterMarkers.filter(m => m !== marker)
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
  };

  const handleUpdateExportSettings = (updates: Partial<ExportSettings>) => {
    if (!selectedProject) return;
    
    const newExportSettings = {
      ...exportSettings,
      ...updates
    };
    
    setExportSettings(newExportSettings);
    
    const existingOutput = selectedProject.outputs[0];
    if (!existingOutput) return;
    
    const updatedOutput = {
      ...existingOutput,
      exportSettings: newExportSettings
    };
    
    onUpdateProject(selectedProject.id, {
      outputs: [updatedOutput]
    });
  };

  const handleExportFormat = (format: AudioFormat) => {
    console.log('Exporting format:', format);
    // Export logic would trigger actual file generation
  };

  const handleBatchExport = () => {
    if (!selectedProject || !selectedProject.outputs[0]) return;
    console.log('Batch exporting all formats for platforms:', exportSettings.targetPlatforms);
    // Batch export logic
  };

  const formatSizeEstimate = (format: AudioFormat, durationMinutes: number = 180): string => {
    // Rough estimates based on format and settings
    const durationSeconds = durationMinutes * 60;
    
    switch (format.format) {
      case 'MP3':
      case 'AAC':
        return `~${Math.round((format.bitrate || 128) * durationSeconds / 8000)} MB`;
      case 'M4B':
        return `~${Math.round((format.bitrate || 64) * durationSeconds / 8000)} MB`;
      case 'WAV':
        return `~${Math.round(format.sampleRate * (format.bitDepth || 16) / 8 * durationSeconds / 1000000)} MB`;
      case 'FLAC':
        return `~${Math.round(format.sampleRate * (format.bitDepth || 16) / 8 * durationSeconds * 0.6 / 1000000)} MB`;
      case 'DAISY':
        return `~${Math.round((64 * durationSeconds) / 8000)} MB`;
      default:
        return 'Unknown';
    }
  };

  // Render format configuration tab
  const renderFormatsTab = () => (
    <div className="space-y-6">
      <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border shadow-sm">
        <h3 className="font-semibold text-brand-text mb-4 text-sm">
          Add Audio Format
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium mb-2 text-brand-text-secondary uppercase tracking-wide">
              Format Type
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-brand-elevated border border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            >
              <option value="M4B">M4B (Audiobook)</option>
              <option value="MP3">MP3</option>
              <option value="WAV">WAV (Uncompressed)</option>
              <option value="FLAC">FLAC (Lossless)</option>
              <option value="AAC">AAC</option>
              <option value="DAISY">DAISY (Accessible)</option>
            </select>
          </div>
          
          {(selectedFormat === 'MP3' || selectedFormat === 'AAC' || selectedFormat === 'M4B') && (
            <div>
              <label className="block font-medium mb-2 text-brand-text-secondary uppercase tracking-wide">
                Bitrate (kbps)
              </label>
              <input
                type="number"
                value={bitrate}
                onChange={(e) => setBitrate(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-brand-elevated border border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                min="64"
                max="320"
                step="16"
              />
            </div>
          )}
          
          <div>
            <label className="block font-medium mb-2 text-brand-text-secondary uppercase tracking-wide">
              Sample Rate (Hz)
            </label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-brand-elevated border border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            >
              <option value="22050">22050 Hz</option>
              <option value="44100">44100 Hz (CD Quality)</option>
              <option value="48000">48000 Hz</option>
              <option value="96000">96000 Hz (High-Res)</option>
            </select>
          </div>
          
          {selectedFormat === 'WAV' && (
            <div>
              <label className="block font-medium mb-2 text-brand-text-secondary uppercase tracking-wide">
                Bit Depth
              </label>
              <select
                value={bitDepth}
                onChange={(e) => setBitDepth(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-brand-elevated border border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              >
                <option value="16">16-bit</option>
                <option value="24">24-bit</option>
                <option value="32">32-bit</option>
              </select>
            </div>
          )}
        </div>
        
        <button
          onClick={handleAddFormat}
          className="mt-4 inline-flex items-center px-4 py-2 bg-brand-primary/95 hover:bg-brand-primary text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          <span className="mr-1">＋</span>
          <span>Add Format</span>
        </button>
      </div>
      
      <div>
        <h3 className="font-semibold text-brand-text mb-3 text-sm">
          Configured Formats
        </h3>
        {selectedProject?.outputs[0]?.formats.length === 0 || !selectedProject?.outputs[0] ? (
          <p className="text-brand-text-muted italic text-xs">
            No formats configured yet. Add your first format above.
          </p>
        ) : (
          <div className="space-y-3">
            {selectedProject.outputs[0].formats.map((format, idx) => (
              <div
                key={idx}
                className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/70 flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-brand-primary">
                      {format.format}
                    </span>
                    <span className="text-[10px] text-brand-text-muted">
                      {format.sampleRate} Hz
                      {format.bitrate && ` • ${format.bitrate} kbps`}
                      {format.bitDepth && ` • ${format.bitDepth}-bit`}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-brand-text-muted">
                    Estimated size: {formatSizeEstimate(format)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportFormat(format)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-[10px] text-brand-bg rounded-lg font-medium shadow-sm"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleRemoveFormat(format)}
                    className="px-3 py-1 bg-brand-surface hover:bg-brand-elevated text-[10px] text-red-400 rounded-lg border border-red-500/40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render metadata editor tab
  const renderMetadataTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-text text-sm">
          Audiobook Metadata
        </h3>
        <button
          onClick={() => setShowMetadataModal(true)}
          className="px-4 py-2 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary text-xs font-semibold shadow-sm"
        >
          Edit Metadata
        </button>
      </div>
      
      {selectedProject?.outputs[0]?.metadata ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Title
            </h4>
            <p className="text-brand-text">
              {selectedProject.outputs[0].metadata.title || 'Not set'}
            </p>
          </div>
          
          {selectedProject.outputs[0].metadata.subtitle && (
            <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
              <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
                Subtitle
              </h4>
              <p className="text-brand-text">
                {selectedProject.outputs[0].metadata.subtitle}
              </p>
            </div>
          )}
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Author
            </h4>
            <p className="text-brand-text">
              {selectedProject.outputs[0].metadata.author || 'Not set'}
            </p>
          </div>
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Narrator
            </h4>
            <p className="text-brand-text">
              {selectedProject.outputs[0].metadata.narrator || 'Not set'}
            </p>
          </div>
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Publisher
            </h4>
            <p className="text-brand-text">
              {selectedProject.outputs[0].metadata.publisher || 'Not set'}
            </p>
          </div>
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Language
            </h4>
            <p className="text-brand-text">
              {selectedProject.outputs[0].metadata.language || 'Not set'}
            </p>
          </div>
          
          {selectedProject.outputs[0].metadata.isbn && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
              <h4 className="font-medium mb-2">ISBN</h4>
              <p>{selectedProject.outputs[0].metadata.isbn}</p>
            </div>
          )}
          
          {selectedProject.outputs[0].metadata.asin && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
              <h4 className="font-medium mb-2">ASIN</h4>
              <p>{selectedProject.outputs[0].metadata.asin}</p>
            </div>
          )}
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60 col-span-2">
            <h4 className="font-semibold mb-2 text-brand-text-secondary uppercase tracking-wide">
              Genres
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedProject.outputs[0].metadata.genre.map((g, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px]"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
          
          {selectedProject.outputs[0].metadata.series && (
            <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60 col-span-2">
              <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
                Series
              </h4>
              <p className="text-brand-text">
                {selectedProject.outputs[0].metadata.series.name} (Book{' '}
                {selectedProject.outputs[0].metadata.series.position})
              </p>
            </div>
          )}
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60 col-span-2">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Description
            </h4>
            <p className="text-[10px] text-brand-text">
              {selectedProject.outputs[0].metadata.description || 'Not set'}
            </p>
          </div>
          
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60 col-span-2">
            <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
              Copyright
            </h4>
            <p className="text-[10px] text-brand-text">
              {selectedProject.outputs[0].metadata.copyright || 'Not set'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-brand-text-muted italic text-xs">
          No metadata configured. Click "Edit Metadata" to add information.
        </p>
      )}
      
      {/* Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-brand-bg p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-brand-border/80 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-brand-text">
              Edit Audiobook Metadata
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Title *
                </label>
                <input
                  type="text"
                  value={metadataForm.title}
                  onChange={(e) => setMetadataForm({ ...metadataForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  placeholder="Audiobook title"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={metadataForm.subtitle}
                  onChange={(e) => setMetadataForm({ ...metadataForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  placeholder="Subtitle (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                    Author *
                  </label>
                  <input
                    type="text"
                    value={metadataForm.author}
                    onChange={(e) => setMetadataForm({ ...metadataForm, author: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    placeholder="Author name"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                    Narrator *
                  </label>
                  <input
                    type="text"
                    value={metadataForm.narrator}
                    onChange={(e) => setMetadataForm({ ...metadataForm, narrator: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    placeholder="Narrator name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={metadataForm.publisher}
                    onChange={(e) => setMetadataForm({ ...metadataForm, publisher: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    placeholder="Publisher name"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                    Language
                  </label>
                  <input
                    type="text"
                    value={metadataForm.language}
                    onChange={(e) => setMetadataForm({ ...metadataForm, language: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    placeholder="en, es, fr, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={metadataForm.isbn}
                    onChange={(e) => setMetadataForm({ ...metadataForm, isbn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    placeholder="ISBN-13"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                    ASIN
                  </label>
                  <input
                    type="text"
                    value={metadataForm.asin}
                    onChange={(e) => setMetadataForm({ ...metadataForm, asin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    placeholder="Amazon ASIN"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Genres (comma-separated)
                </label>
                <input
                  type="text"
                  value={metadataForm.genre?.join(', ')}
                  onChange={(e) => setMetadataForm({ ...metadataForm, genre: e.target.value.split(',').map(g => g.trim()) })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  placeholder="Fantasy, Adventure, Epic"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={metadataForm.description}
                  onChange={(e) => setMetadataForm({ ...metadataForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  rows={4}
                  placeholder="Audiobook description"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Copyright
                </label>
                <input
                  type="text"
                  value={metadataForm.copyright}
                  onChange={(e) => setMetadataForm({ ...metadataForm, copyright: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  placeholder="© 2025 Author Name"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveMetadata}
                className="flex-1 px-4 py-2 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary text-xs font-semibold"
              >
                Save Metadata
              </button>
              <button
                onClick={() => setShowMetadataModal(false)}
                className="px-4 py-2 bg-brand-surface text-brand-text-muted rounded-lg hover:bg-brand-elevated text-xs border border-brand-border/70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render cover art tab
  const renderCoverTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-text text-sm">
          Cover Art Configuration
        </h3>
        <button
          onClick={() => setShowCoverModal(true)}
          className="px-4 py-2 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary text-xs font-semibold shadow-sm"
        >
          Configure Cover
        </button>
      </div>
      
      {selectedProject?.outputs[0]?.coverArt ? (
        <div className="space-y-4 text-xs">
          <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
            <h4 className="font-semibold mb-2 text-brand-text-secondary uppercase tracking-wide">
              Cover Image Preview
            </h4>
            {selectedProject.outputs[0].coverArt.imageUrl ? (
              <img 
                src={selectedProject.outputs[0].coverArt.imageUrl} 
                alt="Cover Art" 
                className="max-w-xs rounded shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-brand-elevated rounded-lg flex items-center justify-center border border-brand-border/60">
                <span className="text-brand-text-muted text-[10px]">
                  No cover image uploaded
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
              <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
                Dimensions
              </h4>
              <p className="text-brand-text">
                {selectedProject.outputs[0].coverArt.dimensions}
              </p>
            </div>
            
            <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
              <h4 className="font-semibold mb-1 text-brand-text-secondary uppercase tracking-wide">
                Format
              </h4>
              <p className="uppercase text-brand-text">
                {selectedProject.outputs[0].coverArt.format}
              </p>
            </div>
          </div>
            
          <div className="bg-brand-primary/5 border border-brand-primary/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 text-brand-primary text-xs">
              Platform Requirements
            </h4>
            <ul className="text-[10px] space-y-1 text-brand-text">
              <li>• Audible: 2400x2400 minimum, square, JPG or PNG</li>
              <li>• Apple Books: 1400x1400 minimum, square, JPG preferred</li>
              <li>• Spotify: 3000x3000 recommended, square, JPG</li>
              <li>• Google Play: 2000x2000 minimum, square, JPG or PNG</li>
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-brand-text-muted italic text-xs">
          No cover art configured. Click "Configure Cover" to set up.
        </p>
      )}
      
      {/* Cover Configuration Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-brand-bg p-6 rounded-2xl max-w-md w-full border border-brand-border/80 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-brand-text">
              Configure Cover Art
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Dimensions
                </label>
                <select
                  value={coverDimensions}
                  onChange={(e) => setCoverDimensions(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                >
                  <option value="2400x2400">2400x2400 (Audible minimum)</option>
                  <option value="3000x3000">3000x3000 (Recommended)</option>
                  <option value="4000x4000">4000x4000 (High quality)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Format
                </label>
                <select
                  value={coverFormat}
                  onChange={(e) => setCoverFormat(e.target.value as 'jpg' | 'png')}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                >
                  <option value="jpg">JPG (Recommended)</option>
                  <option value="png">PNG</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveCoverArt}
                className="flex-1 px-4 py-2 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary text-xs font-semibold"
              >
                Save Cover Settings
              </button>
              <button
                onClick={() => setShowCoverModal(false)}
                className="px-4 py-2 bg-brand-surface text-brand-text-muted rounded-lg hover:bg-brand-elevated text-xs border border-brand-border/70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render chapter markers tab
  const renderChaptersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-text text-sm">
          Chapter Markers
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('Auto-detecting chapters from script');
            }}
            className="px-4 py-2 bg-brand-surface text-brand-primary rounded-lg border border-brand-primary/50 hover:bg-brand-elevated text-xs"
          >
            Auto-Detect
          </button>
          <button
            onClick={() => setShowChapterModal(true)}
            className="px-4 py-2 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary text-xs font-semibold shadow-sm"
          >
            Add Marker
          </button>
        </div>
      </div>
      
      {selectedProject?.outputs[0]?.chapterMarkers.length === 0 || !selectedProject?.outputs[0] ? (
        <p className="text-brand-text-muted italic text-xs">
          No chapter markers added yet. Add markers manually or use auto-detect.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedProject.outputs[0].chapterMarkers
            .sort((a, b) => a.chapterNumber - b.chapterNumber)
            .map((marker, idx) => (
            <div
              key={idx}
              className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60 flex items-center justify-between gap-3"
            >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-brand-primary">
                      Chapter {marker.chapterNumber}
                    </span>
                    <span className="text-[10px] text-brand-text">
                      {marker.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-brand-text-muted">
                      {Math.floor(marker.timestamp / 60)}:{(marker.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => handleRemoveChapterMarker(marker)}
                      className="px-3 py-1 bg-brand-surface text-red-400 rounded-lg hover:bg-brand-elevated text-[10px] border border-red-500/40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* Chapter Marker Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-brand-bg p-6 rounded-2xl max-w-md w-full border border-brand-border/80 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-brand-text">
              Add Chapter Marker
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Chapter Number
                </label>
                <input
                  type="number"
                  value={chapterForm.chapterNumber}
                  onChange={(e) => setChapterForm({ ...chapterForm, chapterNumber: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  placeholder="Chapter title"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium mb-1 text-brand-text-secondary uppercase tracking-wide">
                  Timestamp (seconds)
                </label>
                <input
                  type="number"
                  value={chapterForm.timestamp}
                  onChange={(e) => setChapterForm({ ...chapterForm, timestamp: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg bg-brand-elevated border-brand-border/70 text-brand-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  min="0"
                />
                <p className="text-[10px] text-brand-text-muted mt-1">
                  Time: {Math.floor(chapterForm.timestamp / 60)}:{(chapterForm.timestamp % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddChapterMarker}
                disabled={!chapterForm.title}
                className="flex-1 px-4 py-2 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Marker
              </button>
              <button
                onClick={() => setShowChapterModal(false)}
                className="px-4 py-2 bg-brand-surface text-brand-text-muted rounded-lg hover:bg-brand-elevated text-xs border border-brand-border/70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render export settings tab
  const renderExportTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-brand-text text-sm">
        Export Configuration
      </h3>
      
      <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
        <h4 className="font-semibold mb-3 text-xs text-brand-text-secondary uppercase tracking-wide">
          Target Platforms
        </h4>
        <div className="space-y-2 text-[10px] text-brand-text">
          {(['audible', 'spotify', 'apple', 'google', 'library'] as const).map((platform) => (
            <label key={platform} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportSettings.targetPlatforms.includes(platform)}
                onChange={(e) => {
                  const newPlatforms = e.target.checked
                    ? [...exportSettings.targetPlatforms, platform]
                    : exportSettings.targetPlatforms.filter(p => p !== platform);
                  handleUpdateExportSettings({ targetPlatforms: newPlatforms });
                }}
                className="rounded"
              />
              <span className="capitalize">{platform}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
        <h4 className="font-semibold mb-3 text-xs text-brand-text-secondary uppercase tracking-wide">
          Quality Preset
        </h4>
        <div className="space-y-2 text-[10px] text-brand-text">
          {(['standard', 'high', 'archival'] as const).map((preset) => (
            <label key={preset} className="flex items-center gap-2">
              <input
                type="radio"
                name="quality"
                checked={exportSettings.qualityPreset === preset}
                onChange={() => handleUpdateExportSettings({ qualityPreset: preset })}
                className="rounded"
              />
              <span className="capitalize">{preset}</span>
              <span className="text-sm text-gray-500">
                {preset === 'standard' && '- 128 kbps MP3, 64 kbps M4B'}
                {preset === 'high' && '- 192 kbps MP3, 96 kbps M4B'}
                {preset === 'archival' && '- 320 kbps MP3, FLAC lossless'}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
        <h4 className="font-semibold mb-3 text-xs text-brand-text-secondary uppercase tracking-wide">
          Additional Options
        </h4>
        <div className="space-y-2 text-[10px] text-brand-text">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportSettings.includeChapterMarkers}
              onChange={(e) => handleUpdateExportSettings({ includeChapterMarkers: e.target.checked })}
              className="rounded"
            />
            <span>Include Chapter Markers</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportSettings.normalizeAudio}
              onChange={(e) => handleUpdateExportSettings({ normalizeAudio: e.target.checked })}
              className="rounded"
            />
            <span>Normalize Audio Levels</span>
          </label>
        </div>
      </div>
      
      <div className="bg-brand-primary/5 p-6 rounded-xl border border-brand-primary/20">
        <h4 className="font-semibold mb-3 text-xs text-brand-primary uppercase tracking-wide">
          Ready to Export
        </h4>
        <div className="space-y-1 mb-4 text-[10px] text-brand-text">
          <p>Formats configured: {selectedProject?.outputs[0]?.formats.length || 0}</p>
          <p>Target platforms: {exportSettings.targetPlatforms.length}</p>
          <p>Quality: {exportSettings.qualityPreset}</p>
        </div>
        
        <button
          onClick={handleBatchExport}
          disabled={!selectedProject?.outputs[0]?.formats.length}
          className="w-full px-6 py-2.5 bg-brand-primary/95 text-white rounded-lg hover:bg-brand-primary font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Export All Formats
        </button>
      </div>
      
      {selectedProject?.outputs[0]?.status && (
        <div className="bg-brand-surface/95 p-4 rounded-xl border border-brand-border/60">
          <h4 className="font-semibold mb-2 text-xs text-brand-text-secondary uppercase tracking-wide">
            Export Status
          </h4>
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                selectedProject.outputs[0].status === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                  : selectedProject.outputs[0].status === 'generating'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40'
                  : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/40'
              }`}
            >
              {selectedProject.outputs[0].status}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full bg-brand-bg text-brand-text">
      {/* Project Sidebar */}
      <div className="w-64 border-r border-brand-border/80 p-4 overflow-y-auto bg-brand-surface/98 backdrop-blur-sm">
        <h2 className="text-xs font-semibold mb-3 text-brand-text-secondary uppercase tracking-wide">
          Audiobook Projects
        </h2>
        <div className="space-y-2">
          {projects.map((project) => {
            const isActive = selectedProjectId === project.id;
            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors border text-xs ${
                  isActive
                    ? 'bg-brand-primary/12 border-brand-primary/70 text-brand-primary shadow-sm'
                    : 'bg-brand-surface border-brand-border/40 text-brand-text-secondary hover:bg-brand-elevated hover:text-brand-primary'
                }`}
              >
                <div className="font-semibold truncate">
                  {project.title}
                </div>
                <div className="text-[10px] text-brand-text-muted mt-1">
                  {project.outputs[0]?.formats.length || 0} formats
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-border/80 bg-brand-surface/98 backdrop-blur-sm">
          {[
            { key: 'formats', label: 'Audio Formats' },
            { key: 'metadata', label: 'Metadata' },
            { key: 'cover', label: 'Cover Art' },
            { key: 'chapters', label: 'Chapter Markers' },
            { key: 'export', label: 'Export Settings' }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-colors ${
                  isActive
                    ? 'bg-brand-primary/14 text-brand-primary border-brand-primary/70 shadow-sm'
                    : 'bg-transparent text-brand-text-muted border-brand-border/40 hover:bg-brand-elevated hover:text-brand-primary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-brand-bg">
          {activeTab === 'formats' && renderFormatsTab()}
          {activeTab === 'metadata' && renderMetadataTab()}
          {activeTab === 'cover' && renderCoverTab()}
          {activeTab === 'chapters' && renderChaptersTab()}
          {activeTab === 'export' && renderExportTab()}
        </div>
      </div>
    </div>
  );
};

export default FormatOutputView;