import React, { useState, useEffect } from 'react';
import { NarrationStyle, NARRATION_STYLE_OPTIONS } from '../types';
import { HeadphonesIcon, SparklesIcon, DownloadIcon } from './icons/IconDefs';

interface AudiobookModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: 'idle' | 'generating' | 'success' | 'error';
    audioUrl: string | null;
    onGenerate: (style: NarrationStyle) => void;
}

const AudiobookLoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 font-semibold text-lg">{message}</p>
        <p className="text-sm text-brand-text-secondary">This can take some time for a full manuscript. Please keep this modal open.</p>
    </div>
);

const GENERATING_MESSAGES = [
    "Preparing the narration script...",
    "Warming up the vocal cords...",
    "Stepping into the recording booth...",
    "Narrating the manuscript...",
    "Applying performance styles...",
    "Mastering audio to studio quality...",
    "Finalizing the chapter markers...",
];

export const AudiobookModal: React.FC<AudiobookModalProps> = ({ isOpen, onClose, status, audioUrl, onGenerate }) => {
    const [selectedStyle, setSelectedStyle] = useState<NarrationStyle>(NARRATION_STYLE_OPTIONS[0]);
    const [loadingMessage, setLoadingMessage] = useState(GENERATING_MESSAGES[0]);

    useEffect(() => {
        let messageChanger: number;
        if (status === 'generating') {
            messageChanger = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = GENERATING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % GENERATING_MESSAGES.length;
                    return GENERATING_MESSAGES[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(messageChanger);
    }, [status]);


    if (!isOpen) return null;

    const renderContent = () => {
        switch (status) {
            case 'generating':
                return <AudiobookLoadingSpinner message={loadingMessage} />;
            case 'success':
                return (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-4">Your Audiobook is Ready!</h3>
                        <audio controls src={audioUrl!} className="w-full rounded-lg bg-black">
                            Your browser does not support the audio element.
                        </audio>
                        <div className="mt-6 flex gap-2 justify-center">
                            <a href={audioUrl!} download="audiobook.wav" className="px-6 py-2 w-48 text-center rounded-md font-semibold bg-green-600 text-white hover:bg-green-500 flex items-center justify-center gap-2">
                                <DownloadIcon className="w-5 h-5" /> Download
                            </a>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">
                        <h3 className="font-bold">Generation Failed</h3>
                        <p className="text-sm">The AI was unable to generate the audiobook. Please try again later.</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover">
                            Close
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Select a Narration Style</h3>
                        <div className="space-y-2">
                            {NARRATION_STYLE_OPTIONS.map(style => (
                                <button
                                    key={style.value}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${selectedStyle.value === style.value ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg hover:border-brand-primary/50'}`}
                                >
                                    <p className="font-semibold">{style.label}</p>
                                    <p className="text-xs text-brand-text-secondary">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <HeadphonesIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">AI Narration Studio</h2>
                            <p className="text-sm text-brand-text-secondary">Convert your manuscript to an audiobook.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-6">
                    {renderContent()}
                </div>

                {status === 'idle' && (
                    <div className="p-4 border-t border-brand-border bg-brand-bg/50 rounded-b-lg flex justify-end">
                        <button onClick={() => onGenerate(selectedStyle)} className="px-6 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover disabled:bg-gray-500 flex items-center gap-2">
                           <SparklesIcon className="w-5 h-5"/> Generate Audiobook
                        </button>
                    </div>
                )}
                 {status === 'success' && (
                    <div className="p-4 border-t border-brand-border bg-brand-bg/50 rounded-b-lg flex justify-end">
                        <button onClick={() => onGenerate(selectedStyle)} className="px-6 py-2 rounded-md font-semibold bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 disabled:bg-gray-500 flex items-center gap-2">
                           Regenerate with same style
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};