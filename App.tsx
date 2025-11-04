
import React, { useState } from 'react';
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

// FIX: Removed conflicting global declaration. Type definitions for window.aistudio, window.jspdf, and window.JSZip are assumed to be provided elsewhere in the project.


const App: React.FC = () => {
    const musicVideoGenerator = useMusicVideoGenerator();
    const { currentStep, isProcessing, apiError, clearApiError } = musicVideoGenerator;

    const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
    
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const renderCurrentStep = () => {
        switch (currentStep) {
            case Step.Upload:
                return (
                    <UploadStep
                        onSubmit={musicVideoGenerator.processSongUpload}
                        isProcessing={isProcessing}
                        // FIX: Corrected typo from `musicVideo-generator` to `musicVideoGenerator`.
                        onLoadProductionFile={musicVideoGenerator.loadProductionFile}
                        onModelTierChange={musicVideoGenerator.setModelTier}
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
                        storyboard={musicVideoGenerator.storyboard}
                        bibles={musicVideoGenerator.bibles}
                        onRestart={() => setIsRestartModalOpen(true)}
                        isProcessing={isProcessing}
                        isReviewing={musicVideoGenerator.isReviewing}
                        executiveProducerFeedback={musicVideoGenerator.executiveProducerFeedback}
                    />
                );
            default:
                return <p>Unknown step</p>;
        }
    };
    
    const getFullStateForDownload = async () => {
        const { ...stateToSave } = musicVideoGenerator;
        
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
        
        const serializableState = {
            currentStep: stateToSave.currentStep,
            singerGender: stateToSave.singerGender,
            songFileData,
            songAnalysis: stateToSave.songAnalysis,
            creativeBrief: stateToSave.creativeBrief,
            bibles: stateToSave.bibles,
            storyboard: stateToSave.storyboard,
            tokenUsage: stateToSave.tokenUsage,
            modelTier: stateToSave.modelTier,
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
                onConfirm={musicVideoGenerator.restart}
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
                    <HeaderActions
                        currentStep={currentStep}
                        modelTier={musicVideoGenerator.modelTier}
                        onLoadProductionFile={musicVideoGenerator.loadProductionFile}
                        getFullState={getFullStateForDownload}
                        onRestart={() => setIsRestartModalOpen(true)}
                    />
                </div>
            </header>
            <main className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 flex justify-center">
                        <Stepper currentStep={currentStep} />
                    </div>
                    {renderCurrentStep()}
                </div>
            </main>
        </div>
    );
};

export default App;