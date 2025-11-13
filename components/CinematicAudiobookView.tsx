import React, { useState } from 'react';
import {
  CinematicAudiobook,
  CharacterVoiceAssignment,
  Soundscape,
  MusicCue,
  VoiceTalent,
  AIVoiceModel,
  AudioProvider
} from '../types';
import SfxLibraryBrowser from './SfxLibraryBrowser';
import { SoundEffect } from '../services/sfxLibrary';
import { exportForAudacity, exportForResolve, exportWithProgress } from '../services/audioExport';

interface CinematicAudiobookViewProps {
  projects: CinematicAudiobook[];
  voiceTalent: VoiceTalent[];
  aiVoiceModels: AIVoiceModel[];
  onUpdateProject: (projectId: string, updates: Partial<CinematicAudiobook>) => void;
  onAddCharacterVoice: (projectId: string, assignment: CharacterVoiceAssignment) => void;
  onAddSoundscape: (projectId: string, soundscape: Soundscape) => void;
  onAddMusicCue: (projectId: string, cue: MusicCue) => void;
}

export default function CinematicAudiobookView({
  projects,
  voiceTalent,
  aiVoiceModels,
  onUpdateProject,
  onAddCharacterVoice,
  onAddSoundscape,
  onAddMusicCue
}: CinematicAudiobookViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [activeTab, setActiveTab] = useState<'characters' | 'soundscapes' | 'music' | 'mixing'>('characters');
  const [showVoiceAssignModal, setShowVoiceAssignModal] = useState(false);
  const [showSoundscapeModal, setShowSoundscapeModal] = useState(false);
  const [showMusicCueModal, setShowMusicCueModal] = useState(false);
  const [showSfxBrowser, setShowSfxBrowser] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<{ success: boolean; path?: string; error?: string } | null>(null);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Character Voice Assignment State
  const [newCharacterVoice, setNewCharacterVoice] = useState<Partial<CharacterVoiceAssignment>>({
    characterName: '',
    voiceActorId: '',
    voiceSample: '',
    sceneAppearances: [],
    audioProvider: undefined,
    voiceConfig: {
      voiceId: '',
      modelId: '',
      style: '',
      temperature: 1.0,
      speed: 1.0
    },
    personalityPreset: {
      name: 'natural',
      pitch: 0,
      speed: 1.0,
      reverb: 0,
      warmth: 0
    }
  });

  // Soundscape State
  const [newSoundscape, setNewSoundscape] = useState<Partial<Soundscape>>({
    name: '',
    description: '',
    audioUrl: '',
    sceneIds: [],
    volume: 30,
    fadeIn: 2,
    fadeOut: 2
  });

  // Music Cue State
  const [newMusicCue, setNewMusicCue] = useState<Partial<MusicCue>>({
    name: '',
    musicUrl: '',
    sceneId: '',
    timestamp: 0,
    duration: 30,
    volume: 50,
    mood: '',
    fadeIn: 3,
    fadeOut: 3
  });

  const handleAddCharacterVoice = () => {
    if (!selectedProjectId || !newCharacterVoice.characterName || !newCharacterVoice.voiceActorId) {
      return;
    }
    
    const assignment: CharacterVoiceAssignment = {
      characterName: newCharacterVoice.characterName,
      voiceActorId: newCharacterVoice.voiceActorId,
      voiceSample: newCharacterVoice.voiceSample || '',
      sceneAppearances: newCharacterVoice.sceneAppearances || [],
      audioProvider: newCharacterVoice.audioProvider,
      voiceConfig: newCharacterVoice.voiceConfig,
      personalityPreset: newCharacterVoice.personalityPreset
    };

    onAddCharacterVoice(selectedProjectId, assignment);
    setNewCharacterVoice({
      characterName: '',
      voiceActorId: '',
      voiceSample: '',
      sceneAppearances: [],
      audioProvider: undefined,
      voiceConfig: {
        voiceId: '',
        modelId: '',
        style: '',
        temperature: 1.0,
        speed: 1.0
      },
      personalityPreset: {
        name: 'natural',
        pitch: 0,
        speed: 1.0,
        reverb: 0,
        warmth: 0
      }
    });
    setShowVoiceAssignModal(false);
  };

  const handleAddSoundscape = () => {
    if (!selectedProjectId || !newSoundscape.name || !newSoundscape.audioUrl) {
      return;
    }

    const soundscape: Soundscape = {
      id: `soundscape-${Date.now()}`,
      name: newSoundscape.name,
      description: newSoundscape.description || '',
      audioUrl: newSoundscape.audioUrl,
      sceneIds: newSoundscape.sceneIds || [],
      volume: newSoundscape.volume || 30,
      fadeIn: newSoundscape.fadeIn,
      fadeOut: newSoundscape.fadeOut
    };

    onAddSoundscape(selectedProjectId, soundscape);
    setNewSoundscape({
      name: '',
      description: '',
      audioUrl: '',
      sceneIds: [],
      volume: 30,
      fadeIn: 2,
      fadeOut: 2
    });
    setShowSoundscapeModal(false);
  };

  const handleAddMusicCue = () => {
    if (!selectedProjectId || !newMusicCue.name || !newMusicCue.musicUrl || !newMusicCue.sceneId) {
      return;
    }

    const cue: MusicCue = {
      id: `music-${Date.now()}`,
      name: newMusicCue.name,
      musicUrl: newMusicCue.musicUrl,
      sceneId: newMusicCue.sceneId,
      timestamp: newMusicCue.timestamp || 0,
      duration: newMusicCue.duration || 30,
      volume: newMusicCue.volume || 50,
      mood: newMusicCue.mood || '',
      fadeIn: newMusicCue.fadeIn,
      fadeOut: newMusicCue.fadeOut
    };

    onAddMusicCue(selectedProjectId, cue);
    setNewMusicCue({
      name: '',
      musicUrl: '',
      sceneId: '',
      timestamp: 0,
      duration: 30,
      volume: 50,
      mood: '',
      fadeIn: 3,
      fadeOut: 3
    });
    setShowMusicCueModal(false);
  };

  const handleAddSfxToSoundscape = (sfx: SoundEffect) => {
    if (!selectedProjectId) return;

    const soundscape: Soundscape = {
      id: `soundscape-${Date.now()}`,
      name: sfx.name,
      description: `${sfx.category} sound effect from ${sfx.source}`,
      audioUrl: sfx.url,
      sceneIds: [],
      volume: 30,
      fadeIn: 2,
      fadeOut: 2
    };

    onAddSoundscape(selectedProjectId, soundscape);
    setShowSfxBrowser(false);
  };

  const handleToggleSpatialAudio = () => {
    if (!selectedProject) return;
    onUpdateProject(selectedProject.id, {
      spatialAudioEnabled: !selectedProject.spatialAudioEnabled
    });
  };

  const handleExportAudacity = async () => {
    if (!selectedProject) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);
    
    try {
      const result = await exportWithProgress(
        selectedProject,
        {
          projectName: selectedProject.id,
          outputDir: './exports',
          sampleRate: 48000,
          bitDepth: 24,
          includeMetadata: true
        },
        'audacity',
        (progress) => setExportProgress(progress)
      );
      
      setExportResult(result);
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportResolve = async () => {
    if (!selectedProject) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);
    
    try {
      const result = await exportWithProgress(
        selectedProject,
        {
          projectName: selectedProject.id,
          outputDir: './exports',
          sampleRate: 48000,
          bitDepth: 24,
          includeMetadata: true
        },
        'resolve',
        (progress) => setExportProgress(progress)
      );
      
      setExportResult(result);
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getVoiceTalentName = (voiceActorId: string): string => {
    const talent = voiceTalent.find(t => t.id === voiceActorId);
    const aiModel = aiVoiceModels.find(m => m.id === voiceActorId);
    return talent?.name || aiModel?.name || 'Unknown Voice';
  };

  const renderCharactersTab = () => {
    if (!selectedProject) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Character Voice Assignments</h3>
            <p className="text-sm text-gray-400 mt-1">
              Assign unique voice actors to each character for full-cast performance
            </p>
          </div>
          <button
            onClick={() => setShowVoiceAssignModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Assign Voice
          </button>
        </div>

        {/* Character Voice List */}
        <div className="grid gap-4">
          {selectedProject.fullCastVoices.map((assignment, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-md font-semibold text-purple-400">
                      {assignment.characterName}
                    </h4>
                    {assignment.audioProvider && (
                      <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded">
                        {assignment.audioProvider}
                      </span>
                    )}
                    {assignment.personalityPreset && assignment.personalityPreset.name !== 'natural' && (
                      <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">
                        {assignment.personalityPreset.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Voice: {getVoiceTalentName(assignment.voiceActorId)}
                  </p>
                  {assignment.voiceConfig && (assignment.voiceConfig.voiceId || assignment.voiceConfig.modelId) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {assignment.voiceConfig.voiceId && `Voice ID: ${assignment.voiceConfig.voiceId}`}
                      {assignment.voiceConfig.modelId && ` • Model: ${assignment.voiceConfig.modelId}`}
                    </div>
                  )}
                  {assignment.voiceSample && (
                    <div className="mt-3">
                      <audio controls className="w-full max-w-md">
                        <source src={assignment.voiceSample} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      Appears in {assignment.sceneAppearances.length} scenes
                    </p>
                  </div>
                </div>
                <button
                  className="text-red-400 hover:text-red-300 text-sm"
                  onClick={() => {
                    const updated = selectedProject.fullCastVoices.filter((_, i) => i !== index);
                    onUpdateProject(selectedProject.id, { fullCastVoices: updated });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          
          {selectedProject.fullCastVoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No character voices assigned yet</p>
              <p className="text-sm mt-2">Click "Assign Voice" to add your first character voice</p>
            </div>
          )}
        </div>

        {/* Voice Assignment Modal */}
        {showVoiceAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
              <h3 className="text-xl font-bold mb-4">Assign Character Voice</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={newCharacterVoice.characterName || ''}
                    onChange={(e) => setNewCharacterVoice({ ...newCharacterVoice, characterName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="e.g., Elara Nightshade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Voice Talent
                  </label>
                  <select
                    value={newCharacterVoice.voiceActorId || ''}
                    onChange={(e) => setNewCharacterVoice({ ...newCharacterVoice, voiceActorId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Choose a voice...</option>
                    <optgroup label="Human Voice Talent">
                      {voiceTalent.map(talent => (
                        <option key={talent.id} value={talent.id}>
                          {talent.name} - {talent.voiceStyle} ({talent.gender}, {talent.ageRange})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="AI Voice Models">
                      {aiVoiceModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} - {model.voiceStyle} ({model.gender}, {model.ageRange})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Audio Provider
                  </label>
                  <select
                    value={newCharacterVoice.audioProvider || ''}
                    onChange={(e) => setNewCharacterVoice({ ...newCharacterVoice, audioProvider: (e.target.value || undefined) as AudioProvider | undefined })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">Auto (from settings)</option>
                    <option value="gemini">Gemini TTS</option>
                    <option value="openai">OpenAI TTS</option>
                    <option value="chatterbox">Chatterbox TTS (Local)</option>
                    <option value="comfyui">ComfyUI (Music)</option>
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="azure">Azure TTS</option>
                    <option value="aws">AWS Polly</option>
                  </select>
                </div>

                {newCharacterVoice.audioProvider && (
                  <div className="p-4 bg-gray-750 rounded border border-gray-600">
                    <h4 className="text-sm font-medium mb-3">Voice Configuration</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Voice ID</label>
                        <input
                          type="text"
                          value={newCharacterVoice.voiceConfig?.voiceId || ''}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            voiceConfig: { ...newCharacterVoice.voiceConfig!, voiceId: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
                          placeholder="e.g., alloy, nova"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Model ID</label>
                        <input
                          type="text"
                          value={newCharacterVoice.voiceConfig?.modelId || ''}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            voiceConfig: { ...newCharacterVoice.voiceConfig!, modelId: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
                          placeholder="e.g., tts-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Style</label>
                        <input
                          type="text"
                          value={newCharacterVoice.voiceConfig?.style || ''}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            voiceConfig: { ...newCharacterVoice.voiceConfig!, style: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
                          placeholder="e.g., conversational"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Temperature: {newCharacterVoice.voiceConfig?.temperature ?? 1.0}</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={newCharacterVoice.voiceConfig?.temperature ?? 1.0}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            voiceConfig: { ...newCharacterVoice.voiceConfig!, temperature: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Speed: {newCharacterVoice.voiceConfig?.speed ?? 1.0}x</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={newCharacterVoice.voiceConfig?.speed ?? 1.0}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            voiceConfig: { ...newCharacterVoice.voiceConfig!, speed: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-750 rounded border border-gray-600">
                  <h4 className="text-sm font-medium mb-3">Voice Personality (FFmpeg Effects)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Preset</label>
                      <select
                        value={newCharacterVoice.personalityPreset?.name || 'natural'}
                        onChange={(e) => setNewCharacterVoice({
                          ...newCharacterVoice,
                          personalityPreset: {
                            ...newCharacterVoice.personalityPreset!,
                            name: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
                      >
                        <option value="natural">Natural</option>
                        <option value="deep">Deep Voice</option>
                        <option value="bright">Bright & Cheerful</option>
                        <option value="warm">Warm & Friendly</option>
                        <option value="ethereal">Ethereal</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Pitch Shift: {newCharacterVoice.personalityPreset?.pitch ?? 0}</label>
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={newCharacterVoice.personalityPreset?.pitch ?? 0}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            personalityPreset: { ...newCharacterVoice.personalityPreset!, pitch: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Speed: {newCharacterVoice.personalityPreset?.speed ?? 1.0}x</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={newCharacterVoice.personalityPreset?.speed ?? 1.0}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            personalityPreset: { ...newCharacterVoice.personalityPreset!, speed: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Reverb: {newCharacterVoice.personalityPreset?.reverb ?? 0}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={newCharacterVoice.personalityPreset?.reverb ?? 0}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            personalityPreset: { ...newCharacterVoice.personalityPreset!, reverb: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Warmth: {newCharacterVoice.personalityPreset?.warmth ?? 0}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={newCharacterVoice.personalityPreset?.warmth ?? 0}
                          onChange={(e) => setNewCharacterVoice({
                            ...newCharacterVoice,
                            personalityPreset: { ...newCharacterVoice.personalityPreset!, warmth: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Voice Sample URL (optional)
                  </label>
                  <input
                    type="text"
                    value={newCharacterVoice.voiceSample || ''}
                    onChange={(e) => setNewCharacterVoice({ ...newCharacterVoice, voiceSample: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="https://example.com/voice-sample.mp3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scene Appearances (comma-separated scene IDs)
                  </label>
                  <input
                    type="text"
                    value={newCharacterVoice.sceneAppearances?.join(', ') || ''}
                    onChange={(e) => setNewCharacterVoice({
                      ...newCharacterVoice,
                      sceneAppearances: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="scene-1, scene-3, scene-7"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCharacterVoice}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                  disabled={!newCharacterVoice.characterName || !newCharacterVoice.voiceActorId}
                >
                  Assign Voice
                </button>
                <button
                  onClick={() => setShowVoiceAssignModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSoundscapesTab = () => {
    if (!selectedProject) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Soundscape Library</h3>
            <p className="text-sm text-gray-400 mt-1">
              Ambient atmosphere layers: forest ambience, city noise, rain, wind, etc.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSoundscapeModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Soundscape
            </button>
            <button
              onClick={() => setShowSfxBrowser(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              🔊 Browse SFX Library
            </button>
          </div>
        </div>

        {/* Soundscape Grid */}
        <div className="grid gap-4">
          {selectedProject.soundscapes.map((soundscape) => (
            <div
              key={soundscape.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-md font-semibold text-blue-400">{soundscape.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{soundscape.description}</p>
                  
                  <div className="mt-3">
                    <audio controls className="w-full max-w-md">
                      <source src={soundscape.audioUrl} type="audio/mpeg" />
                    </audio>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Volume</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={soundscape.volume}
                        onChange={(e) => {
                          const updated = selectedProject.soundscapes.map(s =>
                            s.id === soundscape.id ? { ...s, volume: parseInt(e.target.value) } : s
                          );
                          onUpdateProject(selectedProject.id, { soundscapes: updated });
                        }}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{soundscape.volume}%</span>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fade In (sec)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={soundscape.fadeIn || 0}
                        onChange={(e) => {
                          const updated = selectedProject.soundscapes.map(s =>
                            s.id === soundscape.id ? { ...s, fadeIn: parseFloat(e.target.value) } : s
                          );
                          onUpdateProject(selectedProject.id, { soundscapes: updated });
                        }}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fade Out (sec)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={soundscape.fadeOut || 0}
                        onChange={(e) => {
                          const updated = selectedProject.soundscapes.map(s =>
                            s.id === soundscape.id ? { ...s, fadeOut: parseFloat(e.target.value) } : s
                          );
                          onUpdateProject(selectedProject.id, { soundscapes: updated });
                        }}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Applied to:</p>
                      <p className="text-xs text-gray-400">{soundscape.sceneIds.length} scenes</p>
                    </div>
                  </div>
                </div>

                <button
                  className="text-red-400 hover:text-red-300 text-sm"
                  onClick={() => {
                    const updated = selectedProject.soundscapes.filter(s => s.id !== soundscape.id);
                    onUpdateProject(selectedProject.id, { soundscapes: updated });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {selectedProject.soundscapes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No soundscapes added yet</p>
              <p className="text-sm mt-2">Add ambient sounds to enhance your audiobook atmosphere</p>
            </div>
          )}
        </div>

        {/* Soundscape Modal */}
        {showSoundscapeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Add Soundscape</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Soundscape Name
                  </label>
                  <input
                    type="text"
                    value={newSoundscape.name || ''}
                    onChange={(e) => setNewSoundscape({ ...newSoundscape, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="e.g., Forest Ambience, City Rain, Battle Background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newSoundscape.description || ''}
                    onChange={(e) => setNewSoundscape({ ...newSoundscape, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    rows={3}
                    placeholder="Describe the atmosphere this soundscape creates..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Audio File URL
                  </label>
                  <input
                    type="text"
                    value={newSoundscape.audioUrl || ''}
                    onChange={(e) => setNewSoundscape({ ...newSoundscape, audioUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="https://example.com/forest-ambience.mp3"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Volume (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newSoundscape.volume || 30}
                      onChange={(e) => setNewSoundscape({ ...newSoundscape, volume: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fade In (sec)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={newSoundscape.fadeIn || 2}
                      onChange={(e) => setNewSoundscape({ ...newSoundscape, fadeIn: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fade Out (sec)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={newSoundscape.fadeOut || 2}
                      onChange={(e) => setNewSoundscape({ ...newSoundscape, fadeOut: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apply to Scenes (comma-separated scene IDs)
                  </label>
                  <input
                    type="text"
                    value={newSoundscape.sceneIds?.join(', ') || ''}
                    onChange={(e) => setNewSoundscape({ 
                      ...newSoundscape, 
                      sceneIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="scene-1, scene-5, scene-9"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddSoundscape}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                  disabled={!newSoundscape.name || !newSoundscape.audioUrl}
                >
                  Add Soundscape
                </button>
                <button
                  onClick={() => setShowSoundscapeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
  
        {showSfxBrowser && (
          <SfxLibraryBrowser
            onAddToSoundscape={handleAddSfxToSoundscape}
            onClose={() => setShowSfxBrowser(false)}
          />
        )}
      </div>
    );
  };

  const renderMusicTab = () => {
    if (!selectedProject) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Music Cue Timeline</h3>
            <p className="text-sm text-gray-400 mt-1">
              Scored music moments for emotional impact and dramatic scenes
            </p>
          </div>
          <button
            onClick={() => setShowMusicCueModal(true)}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Music Cue
          </button>
        </div>

        {/* Music Cue List */}
        <div className="grid gap-4">
          {selectedProject.musicCues.map((cue) => (
            <div
              key={cue.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-md font-semibold text-pink-400">{cue.name}</h4>
                    {cue.mood && (
                      <span className="px-2 py-1 bg-pink-900/30 text-pink-300 rounded text-xs">
                        {cue.mood}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Scene: {cue.sceneId} | Timestamp: {cue.timestamp}s | Duration: {cue.duration}s
                  </p>
                  
                  <div className="mt-3">
                    <audio controls className="w-full max-w-md">
                      <source src={cue.musicUrl} type="audio/mpeg" />
                    </audio>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Volume</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cue.volume}
                        onChange={(e) => {
                          const updated = selectedProject.musicCues.map(m =>
                            m.id === cue.id ? { ...m, volume: parseInt(e.target.value) } : m
                          );
                          onUpdateProject(selectedProject.id, { musicCues: updated });
                        }}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{cue.volume}%</span>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fade In (sec)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={cue.fadeIn || 0}
                        onChange={(e) => {
                          const updated = selectedProject.musicCues.map(m =>
                            m.id === cue.id ? { ...m, fadeIn: parseFloat(e.target.value) } : m
                          );
                          onUpdateProject(selectedProject.id, { musicCues: updated });
                        }}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fade Out (sec)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={cue.fadeOut || 0}
                        onChange={(e) => {
                          const updated = selectedProject.musicCues.map(m =>
                            m.id === cue.id ? { ...m, fadeOut: parseFloat(e.target.value) } : m
                          );
                          onUpdateProject(selectedProject.id, { musicCues: updated });
                        }}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="text-red-400 hover:text-red-300 text-sm"
                  onClick={() => {
                    const updated = selectedProject.musicCues.filter(m => m.id !== cue.id);
                    onUpdateProject(selectedProject.id, { musicCues: updated });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {selectedProject.musicCues.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No music cues added yet</p>
              <p className="text-sm mt-2">Add cinematic music to elevate key story moments</p>
            </div>
          )}
        </div>

        {/* Music Cue Modal */}
        {showMusicCueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Add Music Cue</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Music Cue Name
                  </label>
                  <input
                    type="text"
                    value={newMusicCue.name || ''}
                    onChange={(e) => setNewMusicCue({ ...newMusicCue, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="e.g., Battle Theme, Emotional Climax, Victory Theme"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Music File URL
                  </label>
                  <input
                    type="text"
                    value={newMusicCue.musicUrl || ''}
                    onChange={(e) => setNewMusicCue({ ...newMusicCue, musicUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="https://example.com/battle-theme.mp3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scene ID
                    </label>
                    <input
                      type="text"
                      value={newMusicCue.sceneId || ''}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, sceneId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="scene-7"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mood/Emotion
                    </label>
                    <input
                      type="text"
                      value={newMusicCue.mood || ''}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, mood: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="Epic, Somber, Hopeful"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timestamp (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newMusicCue.timestamp || 0}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, timestamp: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newMusicCue.duration || 30}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Volume (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newMusicCue.volume || 50}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, volume: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fade In (sec)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={newMusicCue.fadeIn || 3}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, fadeIn: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fade Out (sec)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={newMusicCue.fadeOut || 3}
                      onChange={(e) => setNewMusicCue({ ...newMusicCue, fadeOut: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddMusicCue}
                  className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-medium transition-colors"
                  disabled={!newMusicCue.name || !newMusicCue.musicUrl || !newMusicCue.sceneId}
                >
                  Add Music Cue
                </button>
                <button
                  onClick={() => setShowMusicCueModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMixingTab = () => {
    if (!selectedProject) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Cinematic Mixing Dashboard</h3>
          <p className="text-sm text-gray-400 mt-1">
            Master control for spatial audio and final mix settings
          </p>
        </div>

        {/* Spatial Audio Toggle */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-semibold text-gray-200">Spatial Audio (3D Mix)</h4>
              <p className="text-sm text-gray-400 mt-1">
                Enable immersive 3D audio positioning for voices, soundscapes, and music
              </p>
            </div>
            <button
              onClick={handleToggleSpatialAudio}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedProject.spatialAudioEnabled
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {selectedProject.spatialAudioEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {selectedProject.spatialAudioEnabled && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-sm text-green-300">
                ✓ Spatial audio will be applied during final mix export. Character voices will be positioned
                in 3D space, soundscapes will surround the listener, and music will maintain stereo field.
              </p>
            </div>
          )}
        </div>

        {/* Mixing Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Character Voices</h4>
            <p className="text-2xl font-bold text-purple-400 mt-2">
              {selectedProject.fullCastVoices.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">unique voice actors assigned</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Soundscapes</h4>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {selectedProject.soundscapes.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">ambient atmosphere layers</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Music Cues</h4>
            <p className="text-2xl font-bold text-pink-400 mt-2">
              {selectedProject.musicCues.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">cinematic music moments</p>
          </div>
        </div>

        {/* Mix Preview Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-md font-semibold text-gray-200 mb-4">Mix Configuration</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Audio Layers</span>
              <span className="text-sm font-medium text-gray-200">
                {selectedProject.fullCastVoices.length + 
                 selectedProject.soundscapes.length + 
                 selectedProject.musicCues.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Spatial Audio</span>
              <span className={`text-sm font-medium ${
                selectedProject.spatialAudioEnabled ? 'text-green-400' : 'text-gray-500'
              }`}>
                {selectedProject.spatialAudioEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Mixed Audio Output</span>
              <span className="text-sm font-medium text-gray-200">
                {selectedProject.mixedAudioUrl ? 'Ready' : 'Pending'}
              </span>
            </div>
          </div>

          {selectedProject.mixedAudioUrl && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Preview Final Mix</h5>
              <audio controls className="w-full">
                <source src={selectedProject.mixedAudioUrl} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-md font-semibold text-gray-200 mb-4">Export Project</h4>
          <p className="text-sm text-gray-400 mb-6">
            Export your cinematic audiobook project to professional editing software for final mixing and mastering.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleExportAudacity}
              disabled={isExporting}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {isExporting ? '⏳ Exporting...' : '🎵 Export for Audacity (.aup3)'}
            </button>
            
            <button
              onClick={handleExportResolve}
              disabled={isExporting}
              className="px-6 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {isExporting ? '⏳ Exporting...' : '🎬 Export for DaVinci Resolve (.edl)'}
            </button>
          </div>

          {isExporting && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Exporting project...</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {exportResult && (
            <div className={`p-4 rounded-lg ${exportResult.success ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
              {exportResult.success ? (
                <div>
                  <p className="text-sm text-green-300 font-semibold">✓ Export successful!</p>
                  {exportResult.path && (
                    <p className="text-xs text-green-400 mt-1">Saved to: {exportResult.path}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-300 font-semibold">✗ Export failed</p>
                  {exportResult.error && (
                    <p className="text-xs text-red-400 mt-1">{exportResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-750 rounded border border-gray-600">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Export Details</h5>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Sample Rate: 48 kHz (professional quality)</li>
              <li>• Bit Depth: 24-bit (studio standard)</li>
              <li>• Track Organization: Separate tracks for dialogue, soundscapes, music, and SFX</li>
              <li>• Metadata: Project name, track names, volume levels, and timecode information</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">No cinematic audiobook projects yet</p>
          <p className="text-sm mt-2">Create an audiobook project to get started with cinematic features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-900 text-white">
      {/* Project List Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Cinematic Projects</h2>
        </div>
        <div className="p-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                selectedProjectId === project.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <div className="font-medium truncate">Project {project.id.slice(0, 8)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {project.fullCastVoices.length} voices | {project.soundscapes.length} soundscapes | {project.musicCues.length} music
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'characters'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Character Voices
            </button>
            <button
              onClick={() => setActiveTab('soundscapes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'soundscapes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Soundscapes
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'music'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Music Cues
            </button>
            <button
              onClick={() => setActiveTab('mixing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'mixing'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Mixing Dashboard
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'characters' && renderCharactersTab()}
          {activeTab === 'soundscapes' && renderSoundscapesTab()}
          {activeTab === 'music' && renderMusicTab()}
          {activeTab === 'mixing' && renderMixingTab()}
        </div>
      </div>
    </div>
  );
}