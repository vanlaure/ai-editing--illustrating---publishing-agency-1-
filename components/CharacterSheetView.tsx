import React, { useState } from 'react';
import { CharacterConcept, CharacterExpression, CharacterPose, CharacterVariation, CharacterTurnaround } from '../types';
import { Loader2Icon, PlusIcon, Trash2Icon, DownloadIcon, UploadIcon } from './icons/IconDefs';

interface CharacterSheetViewProps {
  characters: CharacterConcept[];
  onGenerateExpression: (characterId: string, emotion: string) => Promise<void>;
  onGeneratePose: (characterId: string, poseName: string, description: string) => Promise<void>;
  onGenerateVariation: (characterId: string, variationName: string, description: string) => Promise<void>;
  onGenerateTurnaround: (characterId: string) => Promise<void>;
  isGenerating: boolean;
}

export const CharacterSheetView: React.FC<CharacterSheetViewProps> = ({
  characters,
  onGenerateExpression,
  onGeneratePose,
  onGenerateVariation,
  onGenerateTurnaround,
  isGenerating
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'expressions' | 'poses' | 'variations' | 'turnaround'>('expressions');
  const [emotionInput, setEmotionInput] = useState('');
  const [poseNameInput, setPoseNameInput] = useState('');
  const [poseDescInput, setPoseDescInput] = useState('');
  const [varNameInput, setVarNameInput] = useState('');
  const [varDescInput, setVarDescInput] = useState('');

  const selectedChar = characters.find(c => c.id === selectedCharacter);

  const handleGenerateExpression = async () => {
    if (!selectedCharacter || !emotionInput.trim()) return;
    await onGenerateExpression(selectedCharacter, emotionInput.trim());
    setEmotionInput('');
  };

  const handleGeneratePose = async () => {
    if (!selectedCharacter || !poseNameInput.trim()) return;
    await onGeneratePose(selectedCharacter, poseNameInput.trim(), poseDescInput.trim());
    setPoseNameInput('');
    setPoseDescInput('');
  };

  const handleGenerateVariation = async () => {
    if (!selectedCharacter || !varNameInput.trim()) return;
    await onGenerateVariation(selectedCharacter, varNameInput.trim(), varDescInput.trim());
    setVarNameInput('');
    setVarDescInput('');
  };

  const handleGenerateTurnaround = async () => {
    if (!selectedCharacter) return;
    await onGenerateTurnaround(selectedCharacter);
  };

  const commonExpressions = [
    'Joy', 'Anger', 'Sadness', 'Fear', 'Surprise', 'Disgust',
    'Contempt', 'Determination', 'Confusion', 'Sarcasm', 'Love', 'Pain'
  ];

  const commonPoses = [
    { name: 'Standing', desc: 'Neutral standing pose' },
    { name: 'Running', desc: 'Dynamic running pose' },
    { name: 'Fighting Stance', desc: 'Ready for combat' },
    { name: 'Sitting', desc: 'Relaxed sitting pose' },
    { name: 'Reaching', desc: 'Reaching for something' },
    { name: 'Defensive', desc: 'Defensive protective pose' }
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Character Selection */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-brand-text-primary">Select Character:</label>
        <select
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
          className="flex-1 px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary focus:ring-2 focus:ring-brand-primary"
        >
          <option value="">-- Choose a character --</option>
          {characters.map(char => (
            <option key={char.id} value={char.id}>{char.name}</option>
          ))}
        </select>
      </div>

      {!selectedCharacter ? (
        <div className="flex-1 flex items-center justify-center text-brand-text-secondary">
          <p>Select a character to manage their sheet</p>
        </div>
      ) : (
        <>
          {/* Character Info */}
          <div className="p-4 bg-brand-surface border border-brand-border rounded-lg">
            <div className="flex gap-4">
              {selectedChar?.referenceImageUrl && (
                <img 
                  src={selectedChar.referenceImageUrl} 
                  alt={selectedChar.name}
                  className="w-24 h-24 object-cover rounded-lg border border-brand-border"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-brand-text-primary">{selectedChar?.name}</h3>
                <p className="text-sm text-brand-text-secondary mt-1">{selectedChar?.description}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-brand-border">
            {(['expressions', 'poses', 'variations', 'turnaround'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'expressions' && (
              <div className="space-y-4">
                <div className="p-4 bg-brand-surface border border-brand-border rounded-lg">
                  <h4 className="font-medium text-brand-text-primary mb-3">Generate Expression</h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={emotionInput}
                      onChange={(e) => setEmotionInput(e.target.value)}
                      placeholder="Enter emotion (e.g., 'determined')"
                      className="flex-1 px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerateExpression()}
                    />
                    <button
                      onClick={handleGenerateExpression}
                      disabled={isGenerating || !emotionInput.trim()}
                      className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                      Generate
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {commonExpressions.map(expr => (
                      <button
                        key={expr}
                        onClick={() => setEmotionInput(expr)}
                        className="px-3 py-1 text-sm bg-brand-bg border border-brand-border rounded-full hover:bg-brand-surface text-brand-text-primary"
                      >
                        {expr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedChar?.expressionLibrary?.map(expr => (
                    <div key={expr.id} className="border border-brand-border rounded-lg overflow-hidden bg-brand-surface">
                      <img src={expr.imageUrl} alt={expr.emotion} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <p className="font-medium text-brand-text-primary capitalize">{expr.emotion}</p>
                        {expr.notes && <p className="text-xs text-brand-text-secondary mt-1">{expr.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'poses' && (
              <div className="space-y-4">
                <div className="p-4 bg-brand-surface border border-brand-border rounded-lg">
                  <h4 className="font-medium text-brand-text-primary mb-3">Generate Pose</h4>
                  <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      value={poseNameInput}
                      onChange={(e) => setPoseNameInput(e.target.value)}
                      placeholder="Pose name (e.g., 'Running')"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text-primary"
                    />
                    <input
                      type="text"
                      value={poseDescInput}
                      onChange={(e) => setPoseDescInput(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text-primary"
                    />
                    <button
                      onClick={handleGeneratePose}
                      disabled={isGenerating || !poseNameInput.trim()}
                      className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                      Generate Pose
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {commonPoses.map(pose => (
                      <button
                        key={pose.name}
                        onClick={() => {
                          setPoseNameInput(pose.name);
                          setPoseDescInput(pose.desc);
                        }}
                        className="px-3 py-1 text-sm bg-brand-bg border border-brand-border rounded-full hover:bg-brand-surface text-brand-text-primary"
                      >
                        {pose.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedChar?.poseSets?.map(pose => (
                    <div key={pose.id} className="border border-brand-border rounded-lg overflow-hidden bg-brand-surface">
                      <img src={pose.imageUrl} alt={pose.name} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <p className="font-medium text-brand-text-primary">{pose.name}</p>
                        {pose.description && <p className="text-xs text-brand-text-secondary mt-1">{pose.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'variations' && (
              <div className="space-y-4">
                <div className="p-4 bg-brand-surface border border-brand-border rounded-lg">
                  <h4 className="font-medium text-brand-text-primary mb-3">Generate Variation</h4>
                  <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      value={varNameInput}
                      onChange={(e) => setVarNameInput(e.target.value)}
                      placeholder="Variation name (e.g., 'Winter Outfit')"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text-primary"
                    />
                    <textarea
                      value={varDescInput}
                      onChange={(e) => setVarDescInput(e.target.value)}
                      placeholder="Describe the variation..."
                      rows={3}
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text-primary resize-none"
                    />
                    <button
                      onClick={handleGenerateVariation}
                      disabled={isGenerating || !varNameInput.trim()}
                      className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                      Generate Variation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedChar?.variations?.map(variation => (
                    <div key={variation.id} className="border border-brand-border rounded-lg overflow-hidden bg-brand-surface">
                      <img src={variation.imageUrl} alt={variation.name} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <p className="font-medium text-brand-text-primary">{variation.name}</p>
                        {variation.description && <p className="text-xs text-brand-text-secondary mt-1">{variation.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'turnaround' && (
              <div className="space-y-4">
                <div className="p-4 bg-brand-surface border border-brand-border rounded-lg">
                  <h4 className="font-medium text-brand-text-primary mb-3">Character Turnaround (360° Reference)</h4>
                  <p className="text-sm text-brand-text-secondary mb-4">
                    Generate a complete 360° character turnaround for consistent redraws in future art or animation.
                  </p>
                  <button
                    onClick={handleGenerateTurnaround}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                    Generate Turnaround
                  </button>
                </div>

                {selectedChar?.turnaround && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'front', label: 'Front View' },
                      { key: 'side', label: 'Side View' },
                      { key: 'back', label: 'Back View' },
                      { key: 'threeFourth', label: '3/4 View' }
                    ].map(({ key, label }) => (
                      <div key={key} className="border border-brand-border rounded-lg overflow-hidden bg-brand-surface">
                        <img 
                          src={selectedChar.turnaround[key as keyof CharacterTurnaround]} 
                          alt={label} 
                          className="w-full h-64 object-cover" 
                        />
                        <div className="p-3 text-center">
                          <p className="font-medium text-brand-text-primary">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};