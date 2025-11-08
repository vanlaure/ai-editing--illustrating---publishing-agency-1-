import React, { useState } from 'react';
import { 
  PlusIcon, 
  Trash2Icon, 
  Loader2Icon, 
  UploadIcon, 
  DownloadIcon,
  ImageIcon,
  LightbulbIcon,
  PaletteIcon,
  FeatherIcon
} from './icons/IconDefs';

interface MoodBoard {
  id: string;
  title: string;
  description: string;
  theme: string;
  references: string[];
  notes: string;
  createdAt: string;
}

interface ReferenceCollection {
  id: string;
  category: string;
  title: string;
  images: string[];
  tags: string[];
  notes: string;
}

interface ArtDirection {
  id: string;
  title: string;
  styleGuide: string;
  technicalSpecs: string;
  colorNotes: string;
  lightingNotes: string;
  referenceImages: string[];
}

interface BrainstormNote {
  id: string;
  title: string;
  content: string;
  category: 'character' | 'environment' | 'plot' | 'style' | 'other';
  sketches: string[];
  createdAt: string;
}

interface ConceptPreProductionViewProps {
  moodBoards?: MoodBoard[];
  referenceCollections?: ReferenceCollection[];
  artDirections?: ArtDirection[];
  brainstormNotes?: BrainstormNote[];
  onCreateMoodBoard?: (board: Partial<MoodBoard>) => Promise<void>;
  onCreateReference?: (ref: Partial<ReferenceCollection>) => Promise<void>;
  onCreateArtDirection?: (direction: Partial<ArtDirection>) => Promise<void>;
  onCreateNote?: (note: Partial<BrainstormNote>) => Promise<void>;
  onDeleteMoodBoard?: (id: string) => Promise<void>;
  onDeleteReference?: (id: string) => Promise<void>;
  onDeleteArtDirection?: (id: string) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
}

const ConceptPreProductionView: React.FC<ConceptPreProductionViewProps> = ({
  moodBoards = [],
  referenceCollections = [],
  artDirections = [],
  brainstormNotes = [],
  onCreateMoodBoard,
  onCreateReference,
  onCreateArtDirection,
  onCreateNote,
  onDeleteMoodBoard,
  onDeleteReference,
  onDeleteArtDirection,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'moodboards' | 'references' | 'artdirection' | 'brainstorm'>('moodboards');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mood Board State
  const [newBoard, setNewBoard] = useState({
    title: '',
    description: '',
    theme: 'general',
    notes: ''
  });

  // Reference Collection State
  const [newReference, setNewReference] = useState({
    category: 'character',
    title: '',
    tags: '',
    notes: ''
  });

  // Art Direction State
  const [newDirection, setNewDirection] = useState({
    title: '',
    styleGuide: '',
    technicalSpecs: '',
    colorNotes: '',
    lightingNotes: ''
  });

  // Brainstorm Note State
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'other' as BrainstormNote['category']
  });

  const handleCreateMoodBoard = async () => {
    if (!newBoard.title) return;
    setIsGenerating(true);
    try {
      await onCreateMoodBoard?.({
        ...newBoard,
        references: [],
        createdAt: new Date().toISOString()
      });
      setNewBoard({ title: '', description: '', theme: 'general', notes: '' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateReference = async () => {
    if (!newReference.title) return;
    setIsGenerating(true);
    try {
      await onCreateReference?.({
        ...newReference,
        images: [],
        tags: newReference.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setNewReference({ category: 'character', title: '', tags: '', notes: '' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateArtDirection = async () => {
    if (!newDirection.title) return;
    setIsGenerating(true);
    try {
      await onCreateArtDirection?.({
        ...newDirection,
        referenceImages: []
      });
      setNewDirection({ title: '', styleGuide: '', technicalSpecs: '', colorNotes: '', lightingNotes: '' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title) return;
    setIsGenerating(true);
    try {
      await onCreateNote?.({
        ...newNote,
        sketches: [],
        createdAt: new Date().toISOString()
      });
      setNewNote({ title: '', content: '', category: 'other' });
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: 'moodboards' as const, label: 'Mood Boards', icon: ImageIcon },
    { id: 'references' as const, label: 'Reference Collections', icon: PaletteIcon },
    { id: 'artdirection' as const, label: 'Art Direction', icon: FeatherIcon },
    { id: 'brainstorm' as const, label: 'Brainstorming', icon: LightbulbIcon },
  ];

  return (
    <div className="h-full flex flex-col bg-brand-bg">
      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border bg-brand-surface">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-text-primary bg-brand-bg'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'moodboards' && (
          <div className="grid xl:grid-cols-2 gap-6">
            {/* Creation Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Create Mood Board
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Board Title
                  </label>
                  <input
                    type="text"
                    value={newBoard.title}
                    onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                    placeholder="e.g., Dark Fantasy Atmosphere"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Theme
                  </label>
                  <select
                    value={newBoard.theme}
                    onChange={(e) => setNewBoard({ ...newBoard, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="general">General</option>
                    <option value="character">Character</option>
                    <option value="environment">Environment</option>
                    <option value="color">Color Palette</option>
                    <option value="lighting">Lighting</option>
                    <option value="style">Art Style</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    value={newBoard.description}
                    onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                    placeholder="Describe the mood and vision..."
                    rows={3}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newBoard.notes}
                    onChange={(e) => setNewBoard({ ...newBoard, notes: e.target.value })}
                    placeholder="Additional notes and references..."
                    rows={2}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateMoodBoard}
                  disabled={!newBoard.title || isGenerating}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Mood Board
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Mood Boards ({moodBoards.length})
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {moodBoards.map((board) => (
                  <div
                    key={board.id}
                    className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-brand-text-primary">{board.title}</h4>
                        <p className="text-xs text-brand-text-secondary mt-1">
                          Theme: {board.theme} • {board.references.length} references
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteMoodBoard?.(board.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                    {board.description && (
                      <p className="text-sm text-brand-text-secondary mb-2">{board.description}</p>
                    )}
                    {board.notes && (
                      <p className="text-xs text-brand-text-secondary/70 italic">{board.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="grid xl:grid-cols-2 gap-6">
            {/* Creation Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
                <PaletteIcon className="w-5 h-5" />
                Create Reference Collection
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Category
                  </label>
                  <select
                    value={newReference.category}
                    onChange={(e) => setNewReference({ ...newReference, category: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="character">Character Design</option>
                    <option value="environment">Environment</option>
                    <option value="props">Props & Objects</option>
                    <option value="color">Color Palettes</option>
                    <option value="lighting">Lighting Examples</option>
                    <option value="style">Art Style References</option>
                    <option value="anatomy">Anatomy & Poses</option>
                    <option value="clothing">Clothing & Costumes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Collection Title
                  </label>
                  <input
                    type="text"
                    value={newReference.title}
                    onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                    placeholder="e.g., Medieval Armor References"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newReference.tags}
                    onChange={(e) => setNewReference({ ...newReference, tags: e.target.value })}
                    placeholder="e.g., armor, medieval, steel, warrior"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newReference.notes}
                    onChange={(e) => setNewReference({ ...newReference, notes: e.target.value })}
                    placeholder="Key points, usage notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateReference}
                  disabled={!newReference.title || isGenerating}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Collection
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Reference Collections ({referenceCollections.length})
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {referenceCollections.map((ref) => (
                  <div
                    key={ref.id}
                    className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-brand-text-primary">{ref.title}</h4>
                        <p className="text-xs text-brand-text-secondary mt-1">
                          {ref.category} • {ref.images.length} images
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteReference?.(ref.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                    {ref.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ref.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {ref.notes && (
                      <p className="text-xs text-brand-text-secondary/70 italic">{ref.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'artdirection' && (
          <div className="grid xl:grid-cols-2 gap-6">
            {/* Creation Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
                <FeatherIcon className="w-5 h-5" />
                Create Art Direction Sheet
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Direction Title
                  </label>
                  <input
                    type="text"
                    value={newDirection.title}
                    onChange={(e) => setNewDirection({ ...newDirection, title: e.target.value })}
                    placeholder="e.g., Main Character Style Guide"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Style Guide
                  </label>
                  <textarea
                    value={newDirection.styleGuide}
                    onChange={(e) => setNewDirection({ ...newDirection, styleGuide: e.target.value })}
                    placeholder="Overall visual style, artistic approach..."
                    rows={3}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Technical Specifications
                  </label>
                  <textarea
                    value={newDirection.technicalSpecs}
                    onChange={(e) => setNewDirection({ ...newDirection, technicalSpecs: e.target.value })}
                    placeholder="Resolution, format, tools, techniques..."
                    rows={2}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Color Notes
                  </label>
                  <textarea
                    value={newDirection.colorNotes}
                    onChange={(e) => setNewDirection({ ...newDirection, colorNotes: e.target.value })}
                    placeholder="Color palette, mood, temperature..."
                    rows={2}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Lighting Notes
                  </label>
                  <textarea
                    value={newDirection.lightingNotes}
                    onChange={(e) => setNewDirection({ ...newDirection, lightingNotes: e.target.value })}
                    placeholder="Lighting style, direction, intensity..."
                    rows={2}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateArtDirection}
                  disabled={!newDirection.title || isGenerating}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Art Direction
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Art Direction Sheets ({artDirections.length})
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {artDirections.map((direction) => (
                  <div
                    key={direction.id}
                    className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-brand-text-primary">{direction.title}</h4>
                      <button
                        onClick={() => onDeleteArtDirection?.(direction.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {direction.styleGuide && (
                        <div>
                          <p className="font-medium text-brand-text-primary">Style Guide:</p>
                          <p className="text-brand-text-secondary">{direction.styleGuide}</p>
                        </div>
                      )}
                      {direction.technicalSpecs && (
                        <div>
                          <p className="font-medium text-brand-text-primary">Technical:</p>
                          <p className="text-brand-text-secondary">{direction.technicalSpecs}</p>
                        </div>
                      )}
                      {direction.colorNotes && (
                        <div>
                          <p className="font-medium text-brand-text-primary">Color:</p>
                          <p className="text-brand-text-secondary">{direction.colorNotes}</p>
                        </div>
                      )}
                      {direction.lightingNotes && (
                        <div>
                          <p className="font-medium text-brand-text-primary">Lighting:</p>
                          <p className="text-brand-text-secondary">{direction.lightingNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brainstorm' && (
          <div className="grid xl:grid-cols-2 gap-6">
            {/* Creation Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
                <LightbulbIcon className="w-5 h-5" />
                Create Brainstorm Note
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="e.g., Character Backstory Ideas"
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Category
                  </label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value as BrainstormNote['category'] })}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="character">Character</option>
                    <option value="environment">Environment</option>
                    <option value="plot">Plot/Story</option>
                    <option value="style">Style/Visual</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-primary mb-1">
                    Content
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Your ideas, sketches, notes..."
                    rows={8}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.title || isGenerating}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Create Note
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Brainstorm Notes ({brainstormNotes.length})
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {brainstormNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-brand-text-primary">{note.title}</h4>
                        <p className="text-xs text-brand-text-secondary mt-1">
                          {note.category} • {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteNote?.(note.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-brand-text-secondary whitespace-pre-wrap">{note.content}</p>
                    {note.sketches.length > 0 && (
                      <p className="text-xs text-brand-text-secondary/70 mt-2">
                        {note.sketches.length} sketches attached
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptPreProductionView;