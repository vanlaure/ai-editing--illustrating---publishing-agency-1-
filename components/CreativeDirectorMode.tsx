
import React, { useRef, useEffect } from 'react';
import type { CreativeBrief, TranscriptEntry, VideoType } from '../types';
import Spinner from './Spinner';

interface CreativeDirectorModeProps {
  brief: CreativeBrief;
  transcript: TranscriptEntry[];
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

const Visualizer: React.FC<{ isListening: boolean, isSpeaking: boolean, isActive: boolean }> = ({ isListening, isSpeaking, isActive }) => {
    let text, color, pulse = false;
    
    if (isSpeaking) {
        text = "AI is Speaking...";
        color = 'bg-brand-magenta';
        pulse = true;
    } else if (isListening) {
        text = "Listening...";
        color = 'bg-brand-cyan';
        pulse = true;
    } else if (isActive) {
        text = "Connecting...";
        color = 'bg-yellow-500';
        pulse = true;
    }
    else {
        text = "Click to Start";
        color = 'bg-brand-light-gray';
    }

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            { pulse &&
                ['animate-pulse-fast', 'animate-pulse [animation-delay:0.5s]', 'animate-pulse [animation-delay:1s]'].map((anim, i) => (
                    <div key={i} className={`absolute w-full h-full rounded-full ${color} opacity-30 ${anim}`}></div>
                ))
            }
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center text-center text-white font-semibold transition-colors ${color}`}>
               {text}
            </div>
        </div>
    );
};

const TranscriptDisplay: React.FC<{ transcript: TranscriptEntry[] }> = ({ transcript }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);
    
    return (
        <div className="h-full w-full bg-brand-dark rounded-lg p-4 space-y-4 overflow-y-auto">
            {transcript.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-500">
                    Your conversation will appear here.
                </div>
            )}
            {transcript.map((entry, index) => (
                <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                    {entry.speaker === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-magenta flex-shrink-0 flex items-center justify-center font-bold">AI</div>}
                    <div className={`p-3 rounded-lg max-w-sm ${entry.speaker === 'user' ? 'bg-brand-light-gray text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <p>{entry.text}</p>
                    </div>
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
}

const BriefDisplay: React.FC<{ brief: CreativeBrief }> = ({ brief }) => {
    const Detail: React.FC<{label: string, value?: string | string[]}> = ({ label, value }) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return (
                <div>
                    <p className="text-sm font-semibold text-gray-400">{label}</p>
                    <p className="text-gray-500 italic text-sm">Not set</p>
                </div>
            )
        }
        return (
             <div>
                <p className="text-sm font-semibold text-gray-400">{label}</p>
                <p className="text-brand-cyan font-bold">{Array.isArray(value) ? value.join(', ') : value}</p>
            </div>
        )
    };
    return (
        <div className="h-full w-full bg-brand-dark rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-brand-light-gray pb-2">Live Creative Brief</h3>
            <Detail label="Feel" value={brief.feel} />
            <Detail label="Style" value={brief.style} />
            <Detail label="Mood Keywords" value={brief.mood} />
            <Detail label="Video Type" value={brief.videoType} />
            <Detail label="Lyric Overlays" value={brief.lyricsOverlay ? 'Yes' : 'No'} />
            <Detail label="User Notes" value={brief.user_notes} />
        </div>
    );
}


const CreativeDirectorMode: React.FC<CreativeDirectorModeProps> = ({ brief, transcript, isActive, isListening, isSpeaking, onStart, onStop, onSubmit, isProcessing }) => {
    return (
        <div className="w-full flex flex-col items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-[400px] mb-8">
                <div className="order-2 lg:order-1 h-full">
                   <TranscriptDisplay transcript={transcript} />
                </div>
                <div className="order-1 lg:order-2 flex items-center justify-center">
                    <button onClick={isActive ? onStop : onStart} className="rounded-full">
                       <Visualizer isListening={isListening} isSpeaking={isSpeaking} isActive={isActive} />
                    </button>
                </div>
                <div className="order-3 lg:order-3 h-full">
                    <BriefDisplay brief={brief} />
                </div>
            </div>

            <div className="flex justify-center mt-4">
                <button
                    onClick={onSubmit}
                    disabled={!brief.feel || !brief.style || isProcessing || isActive}
                    className="w-full max-w-xs flex items-center justify-center bg-brand-cyan text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                    {isProcessing ? <><Spinner /> Generating Storyboard...</> : 'Finalize & Generate Storyboard'}
                </button>
            </div>
             {isActive && <p className="text-xs text-gray-500 mt-2">You must stop the session before generating the storyboard.</p>}
        </div>
    );
};

export default CreativeDirectorMode;