import React, { useState, useEffect } from 'react';
import { Step } from '../types';
import { backendService } from '../services/backendService';

const LoadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const RestartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 16M20 20l-1.5-1.5A9 9 0 003.5 8" />
    </svg>
);

const ComfyUIIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const StitchStreamIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h11a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
);

type ComfyUIStatus = 'checking' | 'available' | 'unavailable';
type StitchStreamStatus = 'checking' | 'available' | 'unavailable';

interface HeaderActionsProps {
    currentStep: Step;
    modelTier: 'freemium' | 'premium';
    onLoadProductionFile: (file: File) => void;
    getFullState: () => Promise<object>;
    onRestart: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ currentStep, modelTier, onLoadProductionFile, getFullState, onRestart }) => {
    const [comfyUIStatus, setComfyUIStatus] = useState<ComfyUIStatus>('checking');
    const [stitchStatus, setStitchStatus] = useState<StitchStreamStatus>('checking');
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
    const [lastStitchCheckTime, setLastStitchCheckTime] = useState<Date | null>(null);

    const checkComfyUIStatus = async () => {
        try {
            const health = await backendService.checkComfyUIHealth();
            setComfyUIStatus(health.available ? 'available' : 'unavailable');
            setLastCheckTime(new Date());
        } catch (error) {
            setComfyUIStatus('unavailable');
            setLastCheckTime(new Date());
        }
    };

    const checkStitchStatus = async () => {
        try {
            const health = await backendService.checkStitchStreamHealth();
            setStitchStatus(health.available ? 'available' : 'unavailable');
            setLastStitchCheckTime(new Date());
        } catch (error) {
            setStitchStatus('unavailable');
            setLastStitchCheckTime(new Date());
        }
    };

    useEffect(() => {
        checkComfyUIStatus();
        checkStitchStatus();
        const interval = setInterval(checkComfyUIStatus, 30000);
        const stitchInterval = setInterval(checkStitchStatus, 30000);
        return () => {
            clearInterval(interval);
            clearInterval(stitchInterval);
        };
    }, []);

    const handleProductionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onLoadProductionFile(file);
        }
        // Reset file input to allow loading the same file again
        event.target.value = '';
    };

    const handleSave = async () => {
        if (currentStep === Step.Upload) return;

        const fullState = await getFullState();
        const jsonString = JSON.stringify(fullState, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-music-video-production.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getStatusColor = () => {
        switch (comfyUIStatus) {
            case 'available': return 'bg-green-500';
            case 'unavailable': return 'bg-red-500';
            case 'checking': return 'bg-yellow-500';
        }
    };

    const getStatusText = () => {
        switch (comfyUIStatus) {
            case 'available': return 'ComfyUI Ready';
            case 'unavailable': return 'ComfyUI Offline';
            case 'checking': return 'Checking...';
        }
    };

    const getStitchStatusColor = () => {
        switch (stitchStatus) {
            case 'available': return 'bg-emerald-500';
            case 'unavailable': return 'bg-red-500';
            case 'checking': return 'bg-yellow-500';
        }
    };

    const getStitchStatusText = () => {
        switch (stitchStatus) {
            case 'available': return 'StitchStream Ready';
            case 'unavailable': return 'StitchStream Offline';
            case 'checking': return 'Checking...';
        }
    };

    const getStatusTooltip = () => {
        const baseText = comfyUIStatus === 'available'
            ? 'ComfyUI is running and ready for freemium tier image generation'
            : comfyUIStatus === 'unavailable'
                ? 'ComfyUI is not available. Freemium tier will use Pollinations AI fallback'
                : 'Checking ComfyUI status...';

        return lastCheckTime
            ? `${baseText}\nLast checked: ${lastCheckTime.toLocaleTimeString()}`
            : baseText;
    };

    const getStitchTooltip = () => {
        const baseText = stitchStatus === 'available'
            ? 'StitchStream Studio is reachable for final assembly/export'
            : stitchStatus === 'unavailable'
                ? 'StitchStream Studio is not reachable. Make sure the StitchStream service is running.'
                : 'Checking StitchStream status...';

        return lastStitchCheckTime
            ? `${baseText}\nLast checked: ${lastStitchCheckTime.toLocaleTimeString()}`
            : baseText;
    };

    return (
        <div className="flex items-center space-x-2 bg-brand-dark p-1 rounded-full border border-brand-light-gray/20">
            {modelTier === 'freemium' && (
                <>
                    <button
                        onClick={checkComfyUIStatus}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all ${comfyUIStatus === 'available'
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : comfyUIStatus === 'unavailable'
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            }`}
                        aria-label="ComfyUI Status"
                        title={getStatusTooltip()}
                    >
                        <ComfyUIIcon />
                        <span className="text-xs font-medium">
                            {getStatusText()}
                        </span>
                        <div className={`relative w-3 h-3 rounded-full ${getStatusColor()} ${comfyUIStatus === 'checking' ? 'animate-pulse' : ''}`}>
                            {comfyUIStatus === 'available' && (
                                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                            )}
                        </div>
                    </button>
                </>
            )}

            <button
                onClick={checkStitchStatus}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all ${stitchStatus === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : stitchStatus === 'unavailable'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    }`}
                aria-label="StitchStream Status"
                title={getStitchTooltip()}
            >
                <StitchStreamIcon />
                <span className="text-xs font-medium">
                    {getStitchStatusText()}
                </span>
                <div className={`relative w-3 h-3 rounded-full ${getStitchStatusColor()} ${stitchStatus === 'checking' ? 'animate-pulse' : ''}`}>
                    {stitchStatus === 'available' && (
                        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                    )}
                </div>
            </button>

            <div className="w-px h-6 bg-brand-light-gray/20" />

            <label
                htmlFor="load-production-file-header"
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-brand-light-gray cursor-pointer transition-colors"
                aria-label="Load Production File"
                title="Load Production File (.json)"
            >
                <LoadIcon />
            </label>
            <input type="file" id="load-production-file-header" accept=".json" onChange={handleProductionFileChange} className="hidden" />

            <button
                onClick={handleSave}
                disabled={currentStep === Step.Upload}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-brand-light-gray disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                aria-label="Save Production File"
                title="Save Production File (.json)"
            >
                <SaveIcon />
            </button>

            <button
                onClick={onRestart}
                className="p-2 rounded-full text-brand-magenta/70 hover:text-brand-magenta hover:bg-brand-magenta/10 transition-colors"
                aria-label="Restart Project"
                title="Restart Project"
            >
                <RestartIcon />
            </button>
        </div>
    );
};

export default HeaderActions;
