import React, { useState, useEffect, useRef } from 'react';
import {
  MicIcon,
  MicOffIcon,
  SettingsIcon,
  Volume2Icon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  HelpCircleIcon,
  XIcon
} from '../icons/IconDefs';

interface VoiceCommand {
  id: string;
  timestamp: string;
  command: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  response?: string;
}

interface VoiceSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  voiceFeedback: boolean;
  wakeWord: string;
}

const VoiceCommandDashboard: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    language: 'en-US',
    continuous: false,
    interimResults: true,
    voiceFeedback: true,
    wakeWord: 'hey dashboard'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = settings.continuous;
      recognitionRef.current.interimResults = settings.interimResults;
      recognitionRef.current.lang = settings.language;

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        setTranscript(text);
        
        if (event.results[last].isFinal) {
          processVoiceCommand(text);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (settings.continuous && isListening) {
          recognitionRef.current.start();
        } else {
          setIsListening(false);
        }
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [settings.continuous, settings.interimResults, settings.language]);

  const toggleListening = () => {
    if (!settings.enabled) {
      setError('Voice commands are disabled. Enable them in settings.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setError('Failed to start voice recognition');
      }
    }
  };

  const speak = (text: string) => {
    if (settings.voiceFeedback && synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.language;
      synthRef.current.speak(utterance);
    }
  };

  const processVoiceCommand = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    
    // Check for wake word if continuous mode is enabled
    if (settings.continuous && !lowerText.includes(settings.wakeWord.toLowerCase())) {
      return;
    }

    const commandId = `cmd-${Date.now()}`;
    const newCommand: VoiceCommand = {
      id: commandId,
      timestamp: new Date().toLocaleTimeString(),
      command: text,
      action: '',
      status: 'pending'
    };

    // Parse and execute command
    let action = '';
    let response = '';
    let status: 'success' | 'error' = 'success';

    try {
      // Dashboard navigation commands
      if (lowerText.includes('show') || lowerText.includes('open') || lowerText.includes('display')) {
        if (lowerText.includes('dashboard') || lowerText.includes('overview')) {
          action = 'Navigate to dashboard';
          response = 'Opening main dashboard';
        } else if (lowerText.includes('analytics')) {
          action = 'Navigate to analytics';
          response = 'Opening analytics view';
        } else if (lowerText.includes('report')) {
          action = 'Open reports';
          response = 'Opening reports section';
        }
      }
      
      // Time range commands
      else if (lowerText.includes('last') || lowerText.includes('past') || lowerText.includes('previous')) {
        if (lowerText.includes('week')) {
          action = 'Set time range: Last 7 days';
          response = 'Showing data for the last week';
        } else if (lowerText.includes('month')) {
          action = 'Set time range: Last 30 days';
          response = 'Showing data for the last month';
        } else if (lowerText.includes('year')) {
          action = 'Set time range: Last 12 months';
          response = 'Showing data for the last year';
        }
      }
      
      // Filter commands
      else if (lowerText.includes('filter')) {
        if (lowerText.includes('by project') || lowerText.includes('project')) {
          action = 'Apply project filter';
          response = 'Filtering by project';
        } else if (lowerText.includes('by user') || lowerText.includes('user')) {
          action = 'Apply user filter';
          response = 'Filtering by user';
        } else if (lowerText.includes('clear') || lowerText.includes('remove')) {
          action = 'Clear all filters';
          response = 'Filters cleared';
        }
      }
      
      // Export commands
      else if (lowerText.includes('export') || lowerText.includes('download')) {
        if (lowerText.includes('pdf')) {
          action = 'Export as PDF';
          response = 'Exporting dashboard as PDF';
        } else if (lowerText.includes('excel') || lowerText.includes('csv')) {
          action = 'Export as Excel';
          response = 'Exporting data to Excel';
        } else {
          action = 'Export data';
          response = 'Preparing data export';
        }
      }
      
      // Refresh commands
      else if (lowerText.includes('refresh') || lowerText.includes('reload') || lowerText.includes('update')) {
        action = 'Refresh dashboard';
        response = 'Refreshing dashboard data';
      }
      
      // Help commands
      else if (lowerText.includes('help') || lowerText.includes('what can')) {
        action = 'Show help';
        response = 'Opening voice commands help';
        setShowHelp(true);
      }
      
      // Settings commands
      else if (lowerText.includes('settings') || lowerText.includes('preferences')) {
        action = 'Open settings';
        response = 'Opening voice settings';
        setShowSettings(true);
      }
      
      // Unknown command
      else {
        action = 'Unknown command';
        response = 'Sorry, I didn\'t understand that command. Say "help" for available commands.';
        status = 'error';
      }
    } catch (err) {
      action = 'Error processing command';
      response = 'An error occurred while processing your command';
      status = 'error';
    }

    newCommand.action = action;
    newCommand.response = response;
    newCommand.status = status;

    setCommands(prev => [newCommand, ...prev].slice(0, 10));
    speak(response);
  };

  const availableCommands = [
    { category: 'Navigation', commands: [
      'Show dashboard / overview',
      'Open analytics',
      'Show reports'
    ]},
    { category: 'Time Ranges', commands: [
      'Show last week / month / year',
      'Display previous 7 days',
      'Past 30 days'
    ]},
    { category: 'Filters', commands: [
      'Filter by project',
      'Filter by user',
      'Clear filters'
    ]},
    { category: 'Actions', commands: [
      'Export as PDF / Excel',
      'Refresh dashboard',
      'Update data'
    ]},
    { category: 'System', commands: [
      'Show help',
      'Open settings',
      'What can you do?'
    ]}
  ];

  return (
    <div className="h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isListening ? (
              <Volume2Icon className="w-6 h-6 text-green-400 animate-pulse" />
            ) : (
              <Volume2Icon className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <h2 className="text-xl font-bold">Voice Commands</h2>
              <p className="text-sm text-gray-400">
                {isListening ? 'Listening...' : 'Click microphone to start'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Help"
            >
              <HelpCircleIcon className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main microphone button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleListening}
            disabled={!settings.enabled}
            className={`
              relative w-24 h-24 rounded-full flex items-center justify-center
              transition-all duration-300 transform
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
              }
              ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isListening ? (
              <MicOffIcon className="w-12 h-12 text-white" />
            ) : (
              <MicIcon className="w-12 h-12 text-white" />
            )}
            {isListening && (
              <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
            )}
          </button>

          {/* Current transcript */}
          {transcript && (
            <div className="w-full max-w-2xl p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Current input:</p>
              <p className="text-white">{transcript}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="w-full max-w-2xl p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command history */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Commands</h3>
          {commands.length > 0 && (
            <button
              onClick={() => setCommands([])}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear history
            </button>
          )}
        </div>

        <div className="space-y-2">
          {commands.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No commands yet. Try saying something!</p>
              <p className="text-sm mt-2">Say "help" to see available commands</p>
            </div>
          ) : (
            commands.map(cmd => (
              <div
                key={cmd.id}
                className={`
                  p-4 rounded-lg border
                  ${cmd.status === 'success' 
                    ? 'bg-green-900/10 border-green-500/30' 
                    : cmd.status === 'error'
                    ? 'bg-red-900/10 border-red-500/30'
                    : 'bg-gray-800 border-gray-700'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {cmd.status === 'success' ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-400" />
                      ) : cmd.status === 'error' ? (
                        <AlertCircleIcon className="w-4 h-4 text-red-400" />
                      ) : (
                        <RefreshCwIcon className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                      <span className="text-sm text-gray-400 flex items-center gap-2">
                        <ClockIcon className="w-3 h-3" />
                        {cmd.timestamp}
                      </span>
                    </div>
                    <p className="text-white mb-1 font-medium">{cmd.command}</p>
                    <p className="text-sm text-gray-400">{cmd.action}</p>
                    {cmd.response && (
                      <p className="text-sm text-gray-300 mt-2 italic">"{cmd.response}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Available Voice Commands</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {availableCommands.map((section, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">{section.category}</h4>
                  <ul className="space-y-1">
                    {section.commands.map((cmd, cmdIdx) => (
                      <li key={cmdIdx} className="text-sm text-gray-300 pl-4">
                        • {cmd}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">Tips</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• Commands are not case-sensitive</li>
                  <li>• You can use natural variations of these commands</li>
                  <li>• Enable continuous mode in settings for hands-free operation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full">
            <div className="border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Voice Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Voice Commands</label>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Voice Feedback</label>
                <input
                  type="checkbox"
                  checked={settings.voiceFeedback}
                  onChange={(e) => setSettings({...settings, voiceFeedback: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Continuous Listening</label>
                <input
                  type="checkbox"
                  checked={settings.continuous}
                  onChange={(e) => setSettings({...settings, continuous: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Wake Word (for continuous mode)</label>
                <input
                  type="text"
                  value={settings.wakeWord}
                  onChange={(e) => setSettings({...settings, wakeWord: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  placeholder="e.g., hey dashboard"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Say this word before each command in continuous mode
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandDashboard;