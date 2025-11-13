import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { Volume2Icon } from './icons/IconDefs';

const MicIcon = Volume2Icon;
const MicOffIcon = Volume2Icon;

interface VoiceCommandButtonProps {
  onCommand: (command: string, params?: any) => void;
  isEnabled?: boolean;
  className?: string;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onCommand,
  isEnabled = true,
  className = '',
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const voiceCommands = [
    {
      command: 'show-emotions',
      action: (params: any) => onCommand('show-emotions', params),
      keywords: ['show me emotions', 'emotion wheel', 'character feelings', 'mood chart'],
    },
    {
      command: 'generate-scene',
      action: (params: any) => onCommand('generate-scene', params),
      keywords: ['create scene', 'generate location', 'visualize setting', 'scene idea'],
    },
    {
      command: 'read-aloud',
      action: (params: any) => onCommand('read-aloud', params),
      keywords: ['read this', 'speak text', 'voice over', 'text to speech'],
    },
    {
      command: 'suggest-edits',
      action: (params: any) => onCommand('suggest-edits', params),
      keywords: ['edit suggestions', 'improve writing', 'grammar check', 'style suggestions'],
    },
    {
      command: 'character-analysis',
      action: (params: any) => onCommand('character-analysis', params),
      keywords: ['analyze character', 'character insights', 'character development', 'character arc'],
    },
    {
      command: 'plot-outline',
      action: (params: any) => onCommand('plot-outline', params),
      keywords: ['plot outline', 'story structure', 'narrative arc', 'plot points'],
    },
  ];

  const {
    isListening,
    transcript,
    isEnabled: voiceEnabled,
    toggleListening,
  } = useVoiceCommands({
    commands: voiceCommands,
    isEnabled: isEnabled && isSupported,
    onTranscript: (transcript) => {
      setShowTranscript(true);
      setTimeout(() => setShowTranscript(false), 3000);
    },
    onCommandRecognized: (command, params) => {
      console.log('Voice command recognized:', command, params);
      setShowTranscript(false);
    },
  });

  if (!isSupported) {
    return (
      <div className={`relative ${className}`}>
        <button
          disabled
          className="p-2 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed"
          title="Voice commands not supported in this browser"
        >
          <MicOffIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListening}
        disabled={!voiceEnabled}
        className={`p-2 rounded-lg transition-colors relative ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : voiceEnabled
            ? 'bg-brand-primary text-white hover:bg-brand-primary-hover'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title={
          isListening
            ? 'Listening... Say a command like "show me emotions" or "create scene"'
            : voiceEnabled
            ? 'Click to start voice commands'
            : 'Voice commands disabled'
        }
      >
        {isListening ? (
          <MicIcon className="w-5 h-5 animate-pulse" />
        ) : (
          <MicOffIcon className="w-5 h-5" />
        )}

        {/* Ripple effect when listening */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-red-400"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.button>

      {/* Transcript popup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: showTranscript ? 1 : 0,
          y: showTranscript ? 0 : 10,
        }}
        transition={{ duration: 0.2 }}
        className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 min-w-max max-w-xs p-3 bg-black/90 text-white text-sm rounded-lg shadow-lg pointer-events-none z-50 ${
          showTranscript ? 'block' : 'hidden'
        }`}
      >
        <div className="text-xs text-gray-300 mb-1">Listening...</div>
        <div className="font-medium">
          {transcript || 'Say a command like "show me emotions"'}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
      </motion.div>

      {/* Voice command hints */}
      {!isListening && voiceEnabled && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-black/90 text-white text-xs rounded-lg p-2 shadow-lg min-w-max">
            <div className="font-medium mb-1">Voice Commands:</div>
            <ul className="space-y-0.5 text-gray-300">
              <li>• "Show me emotions"</li>
              <li>• "Create scene"</li>
              <li>• "Read this aloud"</li>
              <li>• "Suggest edits"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};