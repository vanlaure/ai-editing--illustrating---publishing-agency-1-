import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  NarrationScript, 
  SceneSegment, 
  PronunciationEntry, 
  CharacterVoiceTag,
  ToneCue,
  BreathMark
} from '../types';

interface ScriptConversionViewProps {
  scripts: NarrationScript[];
  onScriptCreate: (script: NarrationScript) => void;
  onScriptUpdate: (id: string, updates: Partial<NarrationScript>) => void;
  onScriptDelete: (id: string) => void;
}

export const ScriptConversionView: React.FC<ScriptConversionViewProps> = ({
  scripts,
  onScriptCreate,
  onScriptUpdate,
  onScriptDelete,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scenes' | 'pronunciation' | 'voices' | 'export'>('scenes');
  const [manuscriptText, setManuscriptText] = useState('');
  const [scriptTitle, setScriptTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedScript = scripts.find(s => s.id === selectedScriptId);

  const handleCreateScript = async () => {
    if (!scriptTitle.trim() || !manuscriptText.trim()) {
      alert('Please provide both a title and manuscript text');
      return;
    }

    setIsProcessing(true);
    
    try {
      // AI Scene Segmentation (mock implementation - replace with actual AI)
      const scenes = await segmentManuscriptIntoScenes(manuscriptText);
      
      const newScript: NarrationScript = {
        id: uuidv4(),
        manuscriptId: uuidv4(),
        title: scriptTitle,
        scenes,
        pronunciationDictionary: [],
        characterVoiceTags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onScriptCreate(newScript);
      setSelectedScriptId(newScript.id);
      setManuscriptText('');
      setScriptTitle('');
    } catch (error) {
      console.error('Script conversion error:', error);
      alert('Error converting manuscript to script');
    } finally {
      setIsProcessing(false);
    }
  };

  const segmentManuscriptIntoScenes = async (text: string): Promise<SceneSegment[]> => {
    // Mock AI implementation - in production, this would call Gemini API
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((content, index) => ({
      id: uuidv4(),
      sceneNumber: index + 1,
      emotionalBeat: detectEmotionalBeat(content),
      content: content.trim(),
      toneCues: [],
      breathMarks: [],
    }));
  };

  const detectEmotionalBeat = (text: string): string => {
    // Simple keyword-based emotion detection (replace with AI)
    const lowerText = text.toLowerCase();
    if (lowerText.includes('shouted') || lowerText.includes('screamed')) return 'intense';
    if (lowerText.includes('whispered') || lowerText.includes('softly')) return 'quiet';
    if (lowerText.includes('laughed') || lowerText.includes('smiled')) return 'joyful';
    if (lowerText.includes('cried') || lowerText.includes('sobbed')) return 'sorrowful';
    return 'neutral';
  };

  const handleAddToneCue = (sceneId: string, cue: ToneCue) => {
    if (!selectedScript) return;
    
    const updatedScenes = selectedScript.scenes.map(scene => {
      if (scene.id === sceneId) {
        return { ...scene, toneCues: [...scene.toneCues, cue] };
      }
      return scene;
    });

    onScriptUpdate(selectedScript.id, { scenes: updatedScenes, updatedAt: new Date() });
  };

  const handleAddPronunciation = (entry: PronunciationEntry) => {
    if (!selectedScript) return;
    
    onScriptUpdate(selectedScript.id, {
      pronunciationDictionary: [...selectedScript.pronunciationDictionary, entry],
      updatedAt: new Date(),
    });
  };

  const handleAddCharacterVoice = (tag: CharacterVoiceTag) => {
    if (!selectedScript) return;
    
    onScriptUpdate(selectedScript.id, {
      characterVoiceTags: [...selectedScript.characterVoiceTags, tag],
      updatedAt: new Date(),
    });
  };

  const exportScript = (format: 'pdf' | 'ssml' | 'teleprompter') => {
    if (!selectedScript) return;
    
    // Mock export - in production, this would generate actual files
    console.log(`Exporting ${selectedScript.title} as ${format}`);
    alert(`Export to ${format.toUpperCase()} format would be generated here`);
  };

  return (
    <div className="h-full flex flex-col bg-brand-bg text-brand-text">
      {/* Header */}
      <div className="bg-brand-surface/95 border-b border-brand-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text">📝 Manuscript → Script Conversion</h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              AI-powered scene segmentation, dialogue cleanup, tone cues, pronunciation dictionary
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedScriptId(null);
              setActiveTab('scenes');
            }}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors text-sm font-medium"
          >
            + New Script
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Script List */}
        <div className="w-64 bg-brand-surface border-r border-brand-border overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-brand-text-secondary mb-3 uppercase tracking-wide">Your Scripts</h3>
            {scripts.length === 0 ? (
              <p className="text-xs text-brand-text-muted italic">No scripts yet</p>
            ) : (
              <div className="space-y-2">
                {scripts.map(script => (
                  <div
                    key={script.id}
                    onClick={() => setSelectedScriptId(script.id)}
                    className={`p-3 rounded-lg cursor-pointer text-xs transition-colors border ${
                      selectedScriptId === script.id
                        ? 'bg-brand-primary/15 border-brand-primary text-brand-primary'
                        : 'bg-brand-elevated/40 border-transparent text-brand-text-secondary hover:bg-brand-surface/80 hover:border-brand-border'
                    }`}
                  >
                    <div className="font-medium truncate">{script.title}</div>
                    <div className="mt-1 text-[10px] text-brand-text-muted">
                      {script.scenes.length} scenes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedScriptId ? (
            // Create New Script Form
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-brand-surface rounded-xl border border-brand-border p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text mb-4">
                  Create Narration Script from Manuscript
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-text-secondary mb-2">
                      Script Title
                    </label>
                    <input
                      type="text"
                      value={scriptTitle}
                      onChange={(e) => setScriptTitle(e.target.value)}
                      placeholder="e.g., Chapter 1 - The Beginning"
                      className="w-full p-2 border border-brand-border rounded-md bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-text-secondary mb-2">
                      Manuscript Text
                    </label>
                    <textarea
                      value={manuscriptText}
                      onChange={(e) => setManuscriptText(e.target.value)}
                      placeholder="Paste your manuscript text here..."
                      rows={12}
                      className="w-full p-2 border border-brand-border rounded-md bg-brand-bg resize-none text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                    />
                    <p className="text-[10px] text-brand-text-muted mt-2">
                      AI will automatically segment scenes, detect emotional beats, and clean up dialogue.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateScript}
                    disabled={isProcessing || !scriptTitle.trim() || !manuscriptText.trim()}
                    className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:bg-brand-surface disabled:text-brand-text-muted disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isProcessing ? '🤖 AI Processing...' : '✨ Convert to Narration Script'}
                  </button>
                </div>
              </div>

              {/* Feature Overview */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                  <div className="text-2xl mb-2">🎭</div>
                  <h4 className="font-semibold text-brand-text mb-1">Scene Segmentation</h4>
                  <p className="text-xs text-brand-text-secondary">AI detects scene breaks and emotional beats.</p>
                </div>
                <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-semibold text-brand-text mb-1">Dialogue Cleanup</h4>
                  <p className="text-xs text-brand-text-secondary">Removes repetitive tags, keeps narration clean.</p>
                </div>
                <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                  <div className="text-2xl mb-2">🎤</div>
                  <h4 className="font-semibold text-brand-text mb-1">Tone Cues</h4>
                  <p className="text-xs text-brand-text-secondary">Inline emotional acting notes for narrators.</p>
                </div>
                <div className="bg-brand-surface rounded-lg border border-brand-border p-4">
                  <div className="text-2xl mb-2">📖</div>
                  <h4 className="font-semibold text-brand-text mb-1">Pronunciation Guide</h4>
                  <p className="text-xs text-brand-text-secondary">Phonetic dictionary for consistency.</p>
                </div>
              </div>
            </div>
          ) : (
            // Edit Existing Script
            <div className="p-6">
              <div className="max-w-6xl mx-auto">
                {/* Script Header */}
                <div className="bg-brand-surface rounded-lg shadow-sm border border-brand-border p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedScript.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedScript.scenes.length} scenes • 
                        {selectedScript.pronunciationDictionary.length} pronunciation entries • 
                        {selectedScript.characterVoiceTags.length} character voices
                      </p>
                    </div>
                    <button
                      onClick={() => onScriptDelete(selectedScript.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete Script
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-brand-surface rounded-lg shadow-sm border border-brand-border">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      {[
                        { id: 'scenes', label: 'Scene Management', icon: '🎬' },
                        { id: 'pronunciation', label: 'Pronunciation', icon: '📚' },
                        { id: 'voices', label: 'Character Voices', icon: '🎭' },
                        { id: 'export', label: 'Export Scripts', icon: '📥' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="mr-2">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'scenes' && (
                      <SceneManagementTab
                        scenes={selectedScript.scenes}
                        onAddToneCue={handleAddToneCue}
                        onScriptUpdate={(scenes) => onScriptUpdate(selectedScript.id, { scenes, updatedAt: new Date() })}
                      />
                    )}

                    {activeTab === 'pronunciation' && (
                      <PronunciationTab
                        entries={selectedScript.pronunciationDictionary}
                        onAddEntry={handleAddPronunciation}
                        onUpdateEntry={(index, entry) => {
                          const updated = [...selectedScript.pronunciationDictionary];
                          updated[index] = entry;
                          onScriptUpdate(selectedScript.id, { pronunciationDictionary: updated, updatedAt: new Date() });
                        }}
                        onDeleteEntry={(index) => {
                          const updated = selectedScript.pronunciationDictionary.filter((_, i) => i !== index);
                          onScriptUpdate(selectedScript.id, { pronunciationDictionary: updated, updatedAt: new Date() });
                        }}
                      />
                    )}

                    {activeTab === 'voices' && (
                      <CharacterVoicesTab
                        voices={selectedScript.characterVoiceTags}
                        onAddVoice={handleAddCharacterVoice}
                        onUpdateVoice={(index, voice) => {
                          const updated = [...selectedScript.characterVoiceTags];
                          updated[index] = voice;
                          onScriptUpdate(selectedScript.id, { characterVoiceTags: updated, updatedAt: new Date() });
                        }}
                        onDeleteVoice={(index) => {
                          const updated = selectedScript.characterVoiceTags.filter((_, i) => i !== index);
                          onScriptUpdate(selectedScript.id, { characterVoiceTags: updated, updatedAt: new Date() });
                        }}
                      />
                    )}

                    {activeTab === 'export' && (
                      <ExportTab
                        script={selectedScript}
                        onExport={exportScript}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const SceneManagementTab: React.FC<{
  scenes: SceneSegment[];
  onAddToneCue: (sceneId: string, cue: ToneCue) => void;
  onScriptUpdate: (scenes: SceneSegment[]) => void;
}> = ({ scenes, onAddToneCue }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Scene Breakdown</h4>
        <div className="text-sm text-gray-600">
          {scenes.length} scenes total
        </div>
      </div>

      {scenes.map((scene, index) => (
        <div key={scene.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h5 className="font-semibold text-gray-900">
                Scene {scene.sceneNumber}
                {scene.chapterNumber && ` (Chapter ${scene.chapterNumber})`}
              </h5>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {scene.emotionalBeat}
                </span>
                <span className="text-xs text-gray-500">
                  {scene.toneCues.length} tone cues
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
            {scene.content}
          </p>

          {scene.toneCues.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {scene.toneCues.map((cue, i) => (
                <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {cue.emotion} ({cue.intensity || 'moderate'})
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const PronunciationTab: React.FC<{
  entries: PronunciationEntry[];
  onAddEntry: (entry: PronunciationEntry) => void;
  onUpdateEntry: (index: number, entry: PronunciationEntry) => void;
  onDeleteEntry: (index: number) => void;
}> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newIPA, setNewIPA] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleAdd = () => {
    if (!newWord.trim() || !newPhonetic.trim()) {
      alert('Word and phonetic spelling are required');
      return;
    }

    onAddEntry({
      word: newWord,
      phonetic: newPhonetic,
      ipa: newIPA || undefined,
      notes: newNotes || undefined,
    });

    setNewWord('');
    setNewPhonetic('');
    setNewIPA('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Pronunciation Dictionary</h4>
        <p className="text-sm text-gray-600 mb-4">
          Ensure consistent pronunciation of names, places, and unique terms across hours of narration
        </p>

        {/* Add New Entry */}
        <div className="bg-brand-surface rounded-lg p-4 mb-6 border border-brand-border">
          <h5 className="font-medium text-gray-900 mb-3">Add New Entry</h5>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Word (e.g., Aeliana)"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
            <input
              type="text"
              value={newPhonetic}
              onChange={(e) => setNewPhonetic(e.target.value)}
              placeholder="Phonetic (e.g., ay-lee-AH-nah)"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
            <input
              type="text"
              value={newIPA}
              onChange={(e) => setNewIPA(e.target.value)}
              placeholder="IPA (optional)"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Entry
          </button>
        </div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-8">
            No pronunciation entries yet
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between bg-brand-surface rounded-lg p-4 border border-brand-border">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{entry.word}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Phonetic: <span className="font-mono">{entry.phonetic}</span>
                    {entry.ipa && <span className="ml-3">IPA: <span className="font-mono">{entry.ipa}</span></span>}
                  </div>
                  {entry.notes && (
                    <div className="text-xs text-gray-500 mt-1">{entry.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => onDeleteEntry(index)}
                  className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CharacterVoicesTab: React.FC<{
  voices: CharacterVoiceTag[];
  onAddVoice: (voice: CharacterVoiceTag) => void;
  onUpdateVoice: (index: number, voice: CharacterVoiceTag) => void;
  onDeleteVoice: (index: number) => void;
}> = ({ voices, onAddVoice, onDeleteVoice }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CharacterVoiceTag>>({});

  const handleSubmit = () => {
    if (!formData.characterName || !formData.voiceStyle || !formData.age || !formData.tempo || !formData.personality) {
      alert('Please fill in all required fields');
      return;
    }

    onAddVoice(formData as CharacterVoiceTag);
    setFormData({});
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Character Voice Tags</h4>
          <p className="text-sm text-gray-600 mt-1">
            Define voice characteristics for each character to maintain consistency
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Character Voice'}
        </button>
      </div>

      {showForm && (
        <div className="bg-brand-surface rounded-lg p-6 border border-brand-border">
          <h5 className="font-medium text-brand-text mb-4">New Character Voice</h5>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.characterName || ''}
              onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
              placeholder="Character Name"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
            <input
              type="text"
              value={formData.voiceStyle || ''}
              onChange={(e) => setFormData({ ...formData, voiceStyle: e.target.value })}
              placeholder="Voice Style (e.g., deep, raspy)"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
            <select
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: e.target.value as any })}
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            >
              <option value="">Select Age</option>
              <option value="child">Child</option>
              <option value="teen">Teen</option>
              <option value="young-adult">Young Adult</option>
              <option value="adult">Adult</option>
              <option value="elder">Elder</option>
            </select>
            <select
              value={formData.tempo || ''}
              onChange={(e) => setFormData({ ...formData, tempo: e.target.value as any })}
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            >
              <option value="">Select Tempo</option>
              <option value="slow">Slow</option>
              <option value="moderate">Moderate</option>
              <option value="fast">Fast</option>
            </select>
            <input
              type="text"
              value={formData.accent || ''}
              onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
              placeholder="Accent (optional)"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
            <input
              type="text"
              value={formData.personality || ''}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="Personality traits"
              className="px-3 py-2 border border-brand-border rounded-lg bg-brand-bg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Character
          </button>
        </div>
      )}

      {voices.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-8">
          No character voices defined yet
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {voices.map((voice, index) => (
            <div key={index} className="bg-brand-surface rounded-lg p-4 border border-brand-border">
              <div className="flex items-start justify-between mb-3">
                <h5 className="font-semibold text-gray-900">{voice.characterName}</h5>
                <button
                  onClick={() => onDeleteVoice(index)}
                  className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Style:</span>
                  <span className="font-medium">{voice.voiceStyle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Age:</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{voice.age}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tempo:</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{voice.tempo}</span>
                </div>
                {voice.accent && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Accent:</span>
                    <span>{voice.accent}</span>
                  </div>
                )}
                <div className="text-gray-600 mt-2">
                  <span className="italic">{voice.personality}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ExportTab: React.FC<{
  script: NarrationScript;
  onExport: (format: 'pdf' | 'ssml' | 'teleprompter') => void;
}> = ({ script, onExport }) => {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900">Export Narration Scripts</h4>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-brand-surface border-2 border-brand-border rounded-lg p-6 hover:border-brand-primary transition-colors">
          <div className="text-4xl mb-4">📄</div>
          <h5 className="font-semibold text-gray-900 mb-2">Narrator Script PDF</h5>
          <p className="text-sm text-gray-600 mb-4">
            Professional formatted script with tone cues, pronunciation notes, and character tags
          </p>
          <button
            onClick={() => onExport('pdf')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export PDF
          </button>
        </div>

        <div className="bg-brand-surface border-2 border-brand-border rounded-lg p-6 hover:border-brand-primary transition-colors">
          <div className="text-4xl mb-4">🤖</div>
          <h5 className="font-semibold text-gray-900 mb-2">AI Narration SSML</h5>
          <p className="text-sm text-gray-600 mb-4">
            SSML markup for AI voice synthesis with emotional prosody and timing
          </p>
          <button
            onClick={() => onExport('ssml')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export SSML
          </button>
        </div>

        <div className="bg-brand-surface border-2 border-brand-border rounded-lg p-6 hover:border-brand-primary transition-colors">
          <div className="text-4xl mb-4">📺</div>
          <h5 className="font-semibold text-gray-900 mb-2">Studio Teleprompter</h5>
          <p className="text-sm text-gray-600 mb-4">
            Scrolling format optimized for recording booth teleprompter display
          </p>
          <button
            onClick={() => onExport('teleprompter')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Teleprompter
          </button>
        </div>
      </div>

      {/* Script Statistics */}
      <div className="bg-brand-surface rounded-lg p-6 border border-brand-border">
        <h5 className="font-semibold text-gray-900 mb-4">Script Statistics</h5>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">{script.scenes.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Scenes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">{script.pronunciationDictionary.length}</div>
            <div className="text-sm text-gray-600 mt-1">Pronunciations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">{script.characterVoiceTags.length}</div>
            <div className="text-sm text-gray-600 mt-1">Character Voices</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">
              {script.scenes.reduce((sum, scene) => sum + scene.toneCues.length, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Tone Cues</div>
          </div>
        </div>
      </div>
    </div>
  );
};