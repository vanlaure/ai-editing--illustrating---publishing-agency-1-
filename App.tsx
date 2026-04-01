
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Step } from './types';
import { useMusicVideoGenerator } from './hooks/useMusicVideoGenerator';
import Stepper from './components/Stepper';
import UploadStep from './components/UploadStep';
import ControlsStep from './components/ControlsStep';
import StoryboardStep from './components/StoryboardStep';
import ReviewStep from './components/ReviewStep';
import AgentSystemStatus from './components/AgentSystemStatus';
import TokenCounter from './components/TokenCounter';
import HeaderActions from './components/HeaderActions';
import AutosaveIndicator from './components/AutosaveIndicator';
import ConfirmationModal from './components/ConfirmationModal';
import ApiErrorModal from './components/ApiErrorModal';
import SettingsPage from './components/SettingsPage';

// FIX: Removed conflicting global declaration. Type definitions for window.aistudio, window.jspdf, and window.JSZip are assumed to be provided elsewhere in the project.

const AUTOSAVE_KEY = 'ai_music_video_autosave';
const AUTOSAVE_DEBOUNCE_MS = 3000;

const App: React.FC = () => {
    const musicVideoGenerator = useMusicVideoGenerator();
    const { currentStep, isProcessing, apiError, clearApiError } = musicVideoGenerator;

    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasRestoredRef = useRef(false);

    // --- Auto-save: persist work-in-progress to localStorage ---
    const getAutosavePayload = useCallback(() => {
        const s = musicVideoGenerator;
        // Only save serializable, meaningful state — skip File objects, blob URLs, and transient flags
        return {
            currentStep: s.currentStep,
            singerGender: s.singerGender,
            songAnalysis: s.songAnalysis,
            audioUrl: s.audioUrl && !s.audioUrl.startsWith('blob:') ? s.audioUrl : null,
            creativeBrief: s.creativeBrief,
            bibles: s.bibles,
            storyboard: s.storyboard,
            tokenUsage: s.tokenUsage,
            executiveProducerFeedback: s.executiveProducerFeedback,
            visualContinuityReport: s.visualContinuityReport,
            _savedAt: Date.now(),
        };
    }, [
        musicVideoGenerator.currentStep,
        musicVideoGenerator.singerGender,
        musicVideoGenerator.songAnalysis,
        musicVideoGenerator.audioUrl,
        musicVideoGenerator.creativeBrief,
        musicVideoGenerator.bibles,
        musicVideoGenerator.storyboard,
        musicVideoGenerator.tokenUsage,
        musicVideoGenerator.executiveProducerFeedback,
        musicVideoGenerator.visualContinuityReport,
    ]);

    // Restore from localStorage on first mount
    useEffect(() => {
        if (hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        try {
            const raw = localStorage.getItem(AUTOSAVE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            // Only restore if there's meaningful progress (past the upload step)
            if (!saved || saved.currentStep === Step.Upload || (!saved.songAnalysis && !saved.bibles)) return;

            console.log('Auto-save: Restoring saved session from', new Date(saved._savedAt).toLocaleString());
            musicVideoGenerator.loadProductionFile(
                new File([JSON.stringify(saved)], 'autosave.json', { type: 'application/json' })
            );
            setSaveStatus('saved');
        } catch (e) {
            console.warn('Auto-save: Failed to restore saved session', e);
        }
    }, []);

    // Debounced auto-save on state changes
    useEffect(() => {
        // Don't save if still on upload step with no analysis
        if (musicVideoGenerator.currentStep === Step.Upload && !musicVideoGenerator.songAnalysis) return;

        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

        autosaveTimerRef.current = setTimeout(() => {
            try {
                setSaveStatus('saving');
                const payload = getAutosavePayload();
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
                setSaveStatus('saved');
                console.log('Auto-save: Session saved');
            } catch (e) {
                console.warn('Auto-save: Failed to save session', e);
                setSaveStatus('idle');
            }
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, [getAutosavePayload]);

    const renderCurrentStep = () => {
        switch (currentStep) {
            case Step.Upload:
                return (
                    <UploadStep
                        onSubmit={musicVideoGenerator.processSongUpload}
                        isProcessing={isProcessing}
                        // FIX: Corrected typo from `musicVideo-generator` to `musicVideoGenerator`.
                        onLoadProductionFile={musicVideoGenerator.loadProductionFile}
                    />
                );
            case Step.Plan:
                 return (
                    <AgentSystemStatus agents={[
                        { name: "Music Analyst", description: "Deconstructing song structure, rhythm, and mood.", status: 'done' },
                        { name: "Creative Director", description: "Synthesizing your brief into a vision.", status: 'working' },
                        { name: "Location Scout", description: "Finding the perfect virtual locations.", status: 'idle' },
                        { name: "Casting Director", description: "Defining character aesthetics.", status: 'idle' },
                    ]}/>
                 );
            case Step.Controls:
                return (
                    <ControlsStep
                        creativeBrief={musicVideoGenerator.creativeBrief}
                        onUpdateBrief={musicVideoGenerator.updateCreativeBrief}
                        onSubmit={musicVideoGenerator.generateCreativeAssets}
                        isProcessing={isProcessing || musicVideoGenerator.isAnalyzingMoodboard}
                        moodboardImages={musicVideoGenerator.moodboardImages}
                        onSetMoodboardImages={musicVideoGenerator.setMoodboardImages}
                        onAnalyzeMoodboard={musicVideoGenerator.analyzeMoodboard}
                        isAnalyzingMoodboard={musicVideoGenerator.isAnalyzingMoodboard}
                        onGetDirectorSuggestions={musicVideoGenerator.getDirectorSuggestions}
                        isSuggestingBrief={musicVideoGenerator.isSuggestingBrief}
                    />
                );
            case Step.Storyboard:
                return (
                    <StoryboardStep
                        songAnalysis={musicVideoGenerator.songAnalysis}
                        bibles={musicVideoGenerator.bibles}
                        creativeBrief={musicVideoGenerator.creativeBrief}
                        storyboard={musicVideoGenerator.storyboard}
                        onRegenerateImage={musicVideoGenerator.regenerateImage}
                        onEditImage={musicVideoGenerator.editImage}
                        onGenerateClip={musicVideoGenerator.generateClip}
                        onGenerateAllClips={musicVideoGenerator.generateStoryboardBatch}
                        onGoToReview={musicVideoGenerator.goToReview}
                        onGenerateAllImages={musicVideoGenerator.generateAllImages}
                        isProcessing={isProcessing}
                        postProductionTasks={musicVideoGenerator.postProductionTasks}
                        onSetVfx={musicVideoGenerator.setVfxForShot}
                        onApplyVfx={() => { /* This is now handled by the suggest function or manually per shot */ }}
                        onApplyColor={() => musicVideoGenerator.applyPostProductionEnhancement('color')}
                        onApplyStabilization={() => musicVideoGenerator.applyPostProductionEnhancement('stabilization')}
                        suggestAndApplyBeatSyncedVfx={musicVideoGenerator.suggestAndApplyBeatSyncedVfx}
                        onRegenerateBibleImage={musicVideoGenerator.regenerateBibleImage}
                        updateShotWithFileUpload={musicVideoGenerator.updateShotWithFileUpload}
                       
                    />
                );
            case Step.Review:
                return (
                    <ReviewStep
                        songFile={musicVideoGenerator.songFile}
                        audioUrl={musicVideoGenerator.audioUrl}
                        storyboard={musicVideoGenerator.storyboard}
                        bibles={musicVideoGenerator.bibles}
                        creativeBrief={musicVideoGenerator.creativeBrief}
                        songAnalysis={musicVideoGenerator.songAnalysis}
                        onRestart={() => setIsRestartModalOpen(true)}
                        isProcessing={isProcessing}
                        isReviewing={musicVideoGenerator.isReviewing}
                        executiveProducerFeedback={musicVideoGenerator.executiveProducerFeedback}
                        visualContinuityReport={musicVideoGenerator.visualContinuityReport}
                        isVisualReviewing={musicVideoGenerator.isVisualReviewing}
                        onRunVisualAudit={musicVideoGenerator.runVisualQaReview}
                    />
                );
            default:
                return <p>Unknown step</p>;
        }
    };
    
    const getFullStateForDownload = async () => {
        const stateToSave = { ...musicVideoGenerator };
        
        let songFileData = null;
        if (stateToSave.songFile) {
            try {
                const reader = new FileReader();
                const base64Data = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(stateToSave.songFile!);
                });
                
                songFileData = {
                    name: stateToSave.songFile.name,
                    type: stateToSave.songFile.type,
                    base64Data
                };
            } catch (e) {
                console.error('Failed to encode audio file:', e);
            }
        }
        
        const blobToBase64 = async (blobUrl: string): Promise<string> => {
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        let serializedStoryboard = {
            ...(stateToSave.storyboard || {}),
            shots: await Promise.all(
                (stateToSave.storyboard?.shots || []).map(async (shot) => {
                    const serializedShot = { ...shot };
                        
                        if (shot.clip_url?.startsWith('blob:')) {
                            try {
                                serializedShot.clip_url = await blobToBase64(shot.clip_url);
                            } catch (e) {
                                console.error('Failed to encode video clip:', e);
                                serializedShot.clip_url = undefined;
                            }
                        }
                        
                        if (shot.preview_image_url?.startsWith('blob:')) {
                            try {
                                serializedShot.preview_image_url = await blobToBase64(shot.preview_image_url);
                            } catch (e) {
                                console.error('Failed to encode preview image:', e);
                            }
                        }
                        
                        return serializedShot;
                    })
                )
            };
        
        const serializableState = {
            currentStep: stateToSave.currentStep,
            singerGender: stateToSave.singerGender,
            songFileData,
            songAnalysis: stateToSave.songAnalysis,
            creativeBrief: stateToSave.creativeBrief,
            bibles: stateToSave.bibles,
            storyboard: serializedStoryboard,
            tokenUsage: stateToSave.tokenUsage,
        };
        return serializableState;
    }

    return (
        <div className="bg-brand-gray text-white min-h-screen">
            <ApiErrorModal
                isOpen={!!apiError}
                error={apiError}
                onClose={clearApiError}
            />
            <ConfirmationModal
                isOpen={isRestartModalOpen}
                onClose={() => setIsRestartModalOpen(false)}
                onConfirm={() => { localStorage.removeItem(AUTOSAVE_KEY); musicVideoGenerator.restart(); }}
                title="Are you sure?"
                message={<p>This will clear all progress and start a new project. This action cannot be undone.</p>}
                confirmText="Clear & Restart"
                variant="danger"
            />
            <header className="p-4 border-b border-brand-light-gray/20 flex justify-between items-center">
                <h1 className="text-xl font-bold">AI Music Video Generator</h1>
                <div className="flex items-center space-x-4">
                    <AutosaveIndicator status={saveStatus} />
                    <TokenCounter tokenUsage={musicVideoGenerator.tokenUsage} />
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full transition-colors ${showSettings ? 'text-brand-cyan bg-brand-cyan/10' : 'text-gray-400 hover:text-white hover:bg-brand-light-gray'}`}
                        title="AI Provider Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <HeaderActions
                        currentStep={currentStep}
                       
                        onLoadProductionFile={musicVideoGenerator.loadProductionFile}
                        getFullState={getFullStateForDownload}
                        onRestart={() => setIsRestartModalOpen(true)}
                    />
                </div>
            </header>
            <main className="p-8">
                {showSettings ? (
                    <SettingsPage onClose={() => setShowSettings(false)} />
                ) : (
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12 flex justify-center">
                            <Stepper currentStep={currentStep} />
                        </div>
                        {renderCurrentStep()}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
