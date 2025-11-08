import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  AudioEditingProject,
  AudioEdit,
  MasteringSettings,
  QualityCheck
} from '../types';

interface AudioEditingViewProps {
  projects: AudioEditingProject[];
  onUpdateProject: (id: string, updates: Partial<AudioEditingProject>) => void;
  onAddProject: (project: AudioEditingProject) => void;
  onDeleteProject: (id: string) => void;
}

export const AudioEditingView: React.FC<AudioEditingViewProps> = ({
  projects,
  onUpdateProject,
  onAddProject,
  onDeleteProject
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editing' | 'mastering' | 'qc'>('editing');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Add new audio editing project
  const addAudioProject = () => {
    const newProject: AudioEditingProject = {
      id: uuidv4(),
      sessionId: '',
      rawAudioUrl: '',
      edits: [],
      masteringSettings: {
        targetLoudness: -23, // LUFS standard for audiobooks
        peakLimit: -3,
        eqPreset: 'neutral-academic',
        compressionRatio: 3
      },
      qcChecks: [],
      status: 'raw'
    };
    onAddProject(newProject);
    setSelectedProjectId(newProject.id);
  };

  // Add audio edit
  const addAudioEdit = (editType: AudioEdit['editType']) => {
    if (!selectedProject) return;

    const defaultSettings: Record<AudioEdit['editType'], any> = {
      'de-click': { threshold: 50, strength: 75 },
      'de-sibilance': { frequency: 8000, reduction: 6 },
      'noise-reduction': { threshold: -60, reduction: 12 },
      'breath-removal': { threshold: -40, reduction: 80 },
      'silence-adjustment': { threshold: -50, minDuration: 0.5, maxDuration: 2 },
      'eq': { low: 0, mid: 0, high: 2 },
      'compression': { threshold: -20, ratio: 3, attack: 5, release: 50 }
    };

    const newEdit: AudioEdit = {
      id: uuidv4(),
      timestamp: Date.now() / 1000,
      editType,
      settings: defaultSettings[editType],
      applied: false
    };

    onUpdateProject(selectedProject.id, {
      edits: [...selectedProject.edits, newEdit]
    });
  };

  // Toggle edit applied state
  const toggleEditApplied = (editId: string) => {
    if (!selectedProject) return;
    
    const updatedEdits = selectedProject.edits.map(edit =>
      edit.id === editId ? { ...edit, applied: !edit.applied } : edit
    );
    
    onUpdateProject(selectedProject.id, { edits: updatedEdits });
  };

  // Update edit settings
  const updateEditSettings = (editId: string, settings: Record<string, any>) => {
    if (!selectedProject) return;
    
    const updatedEdits = selectedProject.edits.map(edit =>
      edit.id === editId ? { ...edit, settings: { ...edit.settings, ...settings } } : edit
    );
    
    onUpdateProject(selectedProject.id, { edits: updatedEdits });
  };

  // Update mastering settings
  const updateMasteringSettings = (updates: Partial<MasteringSettings>) => {
    if (!selectedProject) return;
    
    onUpdateProject(selectedProject.id, {
      masteringSettings: { ...selectedProject.masteringSettings, ...updates }
    });
  };

  // Add quality check
  const addQualityCheck = (checkType: QualityCheck['checkType']) => {
    if (!selectedProject) return;

    const newCheck: QualityCheck = {
      id: uuidv4(),
      checkType,
      status: 'pass',
      issues: [],
      timestamp: new Date(),
      autoDetected: false
    };

    onUpdateProject(selectedProject.id, {
      qcChecks: [...selectedProject.qcChecks, newCheck]
    });
  };

  // Render editing controls
  const renderEditing = () => (
    <div className="space-y-6">
      {/* Add Edit Buttons */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Audio Editing Tools</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addAudioEdit('de-click')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>🎯</span>
            <span>De-Click</span>
          </button>
          
          <button
            onClick={() => addAudioEdit('de-sibilance')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>🎵</span>
            <span>De-Sibilance</span>
          </button>
          
          <button
            onClick={() => addAudioEdit('noise-reduction')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>🔇</span>
            <span>Noise Reduction</span>
          </button>
          
          <button
            onClick={() => addAudioEdit('breath-removal')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>💨</span>
            <span>Breath Removal</span>
          </button>
          
          <button
            onClick={() => addAudioEdit('silence-adjustment')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>⏸️</span>
            <span>Silence Adjust</span>
          </button>
          
          <button
            onClick={() => addAudioEdit('eq')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>🎚️</span>
            <span>EQ</span>
          </button>
          
          <button
            onClick={() => addAudioEdit('compression')}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>📊</span>
            <span>Compression</span>
          </button>
        </div>
      </div>

      {/* Active Edits List */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Applied Edits</h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {selectedProject?.edits.map((edit) => (
            <div key={edit.id} className="bg-gray-700 rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={edit.applied}
                    onChange={() => toggleEditApplied(edit.id)}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="text-white font-medium capitalize">
                      {edit.editType.replace('-', ' ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(edit.timestamp * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  edit.applied ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {edit.applied ? 'Applied' : 'Pending'}
                </div>
              </div>

              {/* Edit-specific settings */}
              <div className="space-y-2 ml-8">
                {edit.editType === 'de-click' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Threshold: {edit.settings.threshold}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={edit.settings.threshold}
                        onChange={(e) => updateEditSettings(edit.id, { threshold: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Strength: {edit.settings.strength}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={edit.settings.strength}
                        onChange={(e) => updateEditSettings(edit.id, { strength: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {edit.editType === 'de-sibilance' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Frequency: {edit.settings.frequency} Hz</label>
                      <input
                        type="range"
                        min="5000"
                        max="12000"
                        step="500"
                        value={edit.settings.frequency}
                        onChange={(e) => updateEditSettings(edit.id, { frequency: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Reduction: {edit.settings.reduction} dB</label>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="1"
                        value={edit.settings.reduction}
                        onChange={(e) => updateEditSettings(edit.id, { reduction: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {edit.editType === 'noise-reduction' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Threshold: {edit.settings.threshold} dB</label>
                      <input
                        type="range"
                        min="-80"
                        max="-20"
                        value={edit.settings.threshold}
                        onChange={(e) => updateEditSettings(edit.id, { threshold: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Reduction: {edit.settings.reduction} dB</label>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={edit.settings.reduction}
                        onChange={(e) => updateEditSettings(edit.id, { reduction: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {edit.editType === 'breath-removal' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Threshold: {edit.settings.threshold} dB</label>
                      <input
                        type="range"
                        min="-60"
                        max="-20"
                        value={edit.settings.threshold}
                        onChange={(e) => updateEditSettings(edit.id, { threshold: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Reduction: {edit.settings.reduction}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={edit.settings.reduction}
                        onChange={(e) => updateEditSettings(edit.id, { reduction: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {edit.editType === 'eq' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Low: {edit.settings.low > 0 ? '+' : ''}{edit.settings.low} dB</label>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={edit.settings.low}
                        onChange={(e) => updateEditSettings(edit.id, { low: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Mid: {edit.settings.mid > 0 ? '+' : ''}{edit.settings.mid} dB</label>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={edit.settings.mid}
                        onChange={(e) => updateEditSettings(edit.id, { mid: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">High: {edit.settings.high > 0 ? '+' : ''}{edit.settings.high} dB</label>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={edit.settings.high}
                        onChange={(e) => updateEditSettings(edit.id, { high: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {edit.editType === 'compression' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400">Threshold: {edit.settings.threshold} dB</label>
                      <input
                        type="range"
                        min="-40"
                        max="-10"
                        value={edit.settings.threshold}
                        onChange={(e) => updateEditSettings(edit.id, { threshold: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Ratio: {edit.settings.ratio}:1</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={edit.settings.ratio}
                        onChange={(e) => updateEditSettings(edit.id, { ratio: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Attack: {edit.settings.attack} ms</label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={edit.settings.attack}
                        onChange={(e) => updateEditSettings(edit.id, { attack: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Release: {edit.settings.release} ms</label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={edit.settings.release}
                        onChange={(e) => updateEditSettings(edit.id, { release: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {(!selectedProject?.edits || selectedProject.edits.length === 0) && (
            <div className="text-center text-gray-500 py-8">
              No edits added yet. Select editing tools above to add processing.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render mastering controls
  const renderMastering = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Mastering Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Loudness: {selectedProject?.masteringSettings.targetLoudness} LUFS
            </label>
            <input
              type="range"
              min="-30"
              max="-16"
              step="0.5"
              value={selectedProject?.masteringSettings.targetLoudness || -23}
              onChange={(e) => updateMasteringSettings({ targetLoudness: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Standard audiobook: -23 LUFS | Podcast: -19 LUFS | Audible: -23 to -18 LUFS
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peak Limit: {selectedProject?.masteringSettings.peakLimit} dBFS
            </label>
            <input
              type="range"
              min="-6"
              max="-1"
              step="0.5"
              value={selectedProject?.masteringSettings.peakLimit || -3}
              onChange={(e) => updateMasteringSettings({ peakLimit: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Prevents clipping. Standard: -3 dBFS
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">EQ Preset</label>
            <select
              value={selectedProject?.masteringSettings.eqPreset || 'neutral-academic'}
              onChange={(e) => updateMasteringSettings({ eqPreset: e.target.value as MasteringSettings['eqPreset'] })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="cinematic-warm">Cinematic Warm</option>
              <option value="neutral-academic">Neutral Academic</option>
              <option value="dark-intimate">Dark Intimate</option>
              <option value="bright-youthful">Bright Youthful</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {selectedProject?.masteringSettings.eqPreset === 'custom' && (
            <div className="bg-gray-700 rounded p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400">
                  Low: {selectedProject?.masteringSettings.customEQ?.low || 0 > 0 ? '+' : ''}{selectedProject?.masteringSettings.customEQ?.low || 0} dB
                </label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={selectedProject?.masteringSettings.customEQ?.low || 0}
                  onChange={(e) => updateMasteringSettings({ 
                    customEQ: { 
                      ...selectedProject?.masteringSettings.customEQ,
                      low: parseFloat(e.target.value),
                      mid: selectedProject?.masteringSettings.customEQ?.mid || 0,
                      high: selectedProject?.masteringSettings.customEQ?.high || 0
                    } 
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">
                  Mid: {selectedProject?.masteringSettings.customEQ?.mid || 0 > 0 ? '+' : ''}{selectedProject?.masteringSettings.customEQ?.mid || 0} dB
                </label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={selectedProject?.masteringSettings.customEQ?.mid || 0}
                  onChange={(e) => updateMasteringSettings({ 
                    customEQ: { 
                      low: selectedProject?.masteringSettings.customEQ?.low || 0,
                      mid: parseFloat(e.target.value),
                      high: selectedProject?.masteringSettings.customEQ?.high || 0
                    } 
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">
                  High: {selectedProject?.masteringSettings.customEQ?.high || 0 > 0 ? '+' : ''}{selectedProject?.masteringSettings.customEQ?.high || 0} dB
                </label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={selectedProject?.masteringSettings.customEQ?.high || 0}
                  onChange={(e) => updateMasteringSettings({ 
                    customEQ: { 
                      low: selectedProject?.masteringSettings.customEQ?.low || 0,
                      mid: selectedProject?.masteringSettings.customEQ?.mid || 0,
                      high: parseFloat(e.target.value)
                    } 
                  })}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compression Ratio: {selectedProject?.masteringSettings.compressionRatio}:1
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={selectedProject?.masteringSettings.compressionRatio || 3}
              onChange={(e) => updateMasteringSettings({ compressionRatio: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Light: 2:1 | Medium: 3:1-4:1 | Heavy: 6:1+
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Master Output</h3>
        
        <div className="space-y-3">
          <button
            onClick={() => onUpdateProject(selectedProject!.id, { status: 'mastering' })}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Apply Mastering
          </button>
          
          {selectedProject?.masteredAudioUrl && (
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded p-4">
              <div className="text-sm text-green-400 font-medium mb-2">✓ Mastered audio ready</div>
              <div className="text-xs text-gray-400">{selectedProject.masteredAudioUrl}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render quality control
  const renderQC = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quality Check Types</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {(['timing', 'pronunciation', 'tone-drift', 'noise', 'pacing', 'emotional-consistency'] as const).map(checkType => (
            <button
              key={checkType}
              onClick={() => addQualityCheck(checkType)}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded capitalize"
            >
              {checkType.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">QC Results</h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {selectedProject?.qcChecks.map((check) => (
            <div key={check.id} className={`rounded p-4 border-2 ${
              check.status === 'pass' ? 'bg-green-900 bg-opacity-20 border-green-700' :
              check.status === 'warning' ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' :
              'bg-red-900 bg-opacity-20 border-red-700'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`text-lg ${
                    check.status === 'pass' ? 'text-green-400' :
                    check.status === 'warning' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗'}
                  </div>
                  <div className="text-white font-medium capitalize">
                    {check.checkType.replace('-', ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {check.autoDetected && (
                    <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Auto</div>
                  )}
                  <select
                    value={check.status}
                    onChange={(e) => {
                      const updated = selectedProject.qcChecks.map(c =>
                        c.id === check.id ? { ...c, status: e.target.value as QualityCheck['status'] } : c
                      );
                      onUpdateProject(selectedProject.id, { qcChecks: updated });
                    }}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="pass">Pass</option>
                    <option value="warning">Warning</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
              </div>
              
              {check.issues.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Issues:</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {check.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-500">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                {new Date(check.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
          
          {(!selectedProject?.qcChecks || selectedProject.qcChecks.length === 0) && (
            <div className="text-center text-gray-500 py-8">
              No quality checks performed yet. Add checks above.
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Overall Status</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-900 bg-opacity-30 rounded p-4">
            <div className="text-sm text-green-400">Passed</div>
            <div className="text-2xl font-bold text-white">
              {selectedProject?.qcChecks.filter(c => c.status === 'pass').length || 0}
            </div>
          </div>
          <div className="bg-yellow-900 bg-opacity-30 rounded p-4">
            <div className="text-sm text-yellow-400">Warnings</div>
            <div className="text-2xl font-bold text-white">
              {selectedProject?.qcChecks.filter(c => c.status === 'warning').length || 0}
            </div>
          </div>
          <div className="bg-red-900 bg-opacity-30 rounded p-4">
            <div className="text-sm text-red-400">Failed</div>
            <div className="text-2xl font-bold text-white">
              {selectedProject?.qcChecks.filter(c => c.status === 'fail').length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex">
      {/* Projects List */}
      <div className="w-80 border-r border-gray-700 bg-gray-900 overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={addAudioProject}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>New Project</span>
          </button>
        </div>

        <div className="p-2">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`p-3 rounded mb-2 cursor-pointer transition-colors ${
                selectedProjectId === project.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}>
              <div className="font-medium">Project {project.id.substring(0, 8)}</div>
              <div className="text-sm opacity-75 capitalize">{project.status}</div>
              <div className="text-xs opacity-60 mt-1">
                {project.edits.length} edits | {project.qcChecks.length} QC checks
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedProject ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="text-2xl font-bold text-white">Audio Editing & Mastering</div>
              <div className="text-sm text-gray-400 mt-2 capitalize">
                Status: {selectedProject.status}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
              {[
                { key: 'editing', label: '✂️ Editing' },
                { key: 'mastering', label: '🎚️ Mastering' },
                { key: 'qc', label: '✓ Quality Control' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'editing' && renderEditing()}
            {activeTab === 'mastering' && renderMastering()}
            {activeTab === 'qc' && renderQC()}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select or create an audio editing project
          </div>
        )}
      </div>
    </div>
  );
};