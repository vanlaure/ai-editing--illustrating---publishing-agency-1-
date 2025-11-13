import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceCommand {
  command: string;
  action: (params?: any) => void;
  keywords: string[];
}

interface UseVoiceCommandsOptions {
  commands: VoiceCommand[];
  isEnabled: boolean;
  onTranscript?: (transcript: string) => void;
  onCommandRecognized?: (command: string, params?: any) => void;
}

export const useVoiceCommands = ({
  commands,
  isEnabled,
  onTranscript,
  onCommandRecognized,
}: UseVoiceCommandsOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        onTranscript?.(currentTranscript);

        // Process final transcript for commands
        if (finalTranscript && finalTranscript.trim()) {
          processCommand(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const processCommand = useCallback((spokenText: string) => {
    const lowerText = spokenText.toLowerCase();

    for (const command of commands) {
      const matchedKeyword = command.keywords.find(keyword =>
        lowerText.includes(keyword.toLowerCase())
      );

      if (matchedKeyword) {
        // Extract parameters from the command
        const params = extractParameters(lowerText, command.command);
        command.action(params);
        onCommandRecognized?.(command.command, params);
        return;
      }
    }
  }, [commands, onCommandRecognized]);

  const extractParameters = (text: string, command: string): any => {
    const params: any = {};

    // Extract common parameters
    if (text.includes('character') || text.includes('show me')) {
      params.type = 'character';
    }

    if (text.includes('emotion') || text.includes('mood')) {
      params.category = 'emotion';
    }

    if (text.includes('scene') || text.includes('location')) {
      params.type = 'scene';
    }

    if (text.includes('dialogue') || text.includes('conversation')) {
      params.type = 'dialogue';
    }

    if (text.includes('paragraph') || text.includes('sentence')) {
      params.type = 'text';
    }

    // Extract numbers for specific commands
    const numberMatch = text.match(/\d+/);
    if (numberMatch) {
      params.count = parseInt(numberMatch[0]);
    }

    return params;
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && isEnabled) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }, [isListening, isEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-stop listening when disabled
  useEffect(() => {
    if (!isEnabled && isListening) {
      stopListening();
    }
  }, [isEnabled, isListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    isEnabled: isEnabled && isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
};