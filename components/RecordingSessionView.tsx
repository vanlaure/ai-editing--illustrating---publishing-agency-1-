import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  RecordingSession, 
  StudioCalibration,
  RecordingTake,
  PunchAndRollMarker
} from '../types';

interface RecordingSessionViewProps {
  sessions: RecordingSession[];
  onUpdateSession: (id: string, updates: Partial<RecordingSession>) => void;
  onAddSession: (session: RecordingSession) => void;
  onDeleteSession: (id: string) => void;
}

export const RecordingSessionView: React.FC<RecordingSessionViewProps> = ({
  sessions,
  onUpdateSession,
  onAddSession,
  onDeleteSession
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calibration' | 'recording' | 'takes' | 'quality'>('calibration');
  const [isRecording, setIsRecording] = useState(false);
  const [currentTakeNumber, setCurrentTakeNumber] = useState(1);
  const [punchAndRollMarkers, setPunchAndRollMarkers] = useState<PunchAndRollMarker[]>([]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Add new recording session
  const addRecordingSession = () => {
    const newSession: RecordingSession = {
      id: uuidv4(),
      scriptId: '',
      talentId: '',
      sessionDate: new Date(),
      sessionType: 'human',
      calibration: {
        roomEQ: '',
        noiseFloor: -60,
        micType: '',
        preampSettings: '',
        calibrationDate: new Date()
      },
      recordings: [],
      status: 'scheduled',
      totalDuration: 0,
      completionPercentage: 0
    };
    onAddSession(newSession);
    setSelectedSessionId(newSession.id);
  };

  // Update calibration settings
  const updateCalibration = (updates: Partial<StudioCalibration>) => {
    if (!selectedSession || !selectedSession.calibration) return;
    onUpdateSession(selectedSession.id, {
      calibration: { ...selectedSession.calibration, ...updates }
    });
  };

  // Add recording take
  const addRecordingTake = () => {
    if (!selectedSession) return;
    
    const newTake: RecordingTake = {
      id: uuidv4(),
      sceneId: '',
      takeNumber: currentTakeNumber,
      audioUrl: '',
      duration: 0,
      quality: 'draft',
      timestamp: new Date(),
      notes: ''
    };

    onUpdateSession(selectedSession.id, {
      recordings: [...selectedSession.recordings, newTake]
    });
    setCurrentTakeNumber(prev => prev + 1);
  };

  // Add punch & roll marker
  const addPunchAndRollMarker = (timestamp: number, reason: string) => {
    const newMarker: PunchAndRollMarker = {
      timestamp,
      reason,
      resolved: false
    };
    setPunchAndRollMarkers(prev => [...prev, newMarker]);
  };

  // Toggle recording state
  const toggleRecording = () => {
    setIsRecording(prev => !prev);
    if (!isRecording) {
      addRecordingTake();
    }
  };

  // Render calibration settings
  const renderCalibration = () => (
    <div className="space-y-6">
      <div className="bg-brand-surface/95 rounded-xl p-6 border border-brand-border shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Studio Calibration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-2 uppercase tracking-wide">
              Microphone Type
            </label>
            <input
              type="text"
              value={selectedSession?.calibration?.micType || ''}
              onChange={(e) => updateCalibration({ micType: e.target.value })}
              placeholder="e.g., Neumann U87"
              className="w-full px-3 py-2 bg-brand-elevated border border-brand-border/70 rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-2 uppercase tracking-wide">
              Room EQ Settings
            </label>
            <input
              type="text"
              value={selectedSession?.calibration?.roomEQ || ''}
              onChange={(e) => updateCalibration({ roomEQ: e.target.value })}
              placeholder="EQ curve settings"
              className="w-full px-3 py-2 bg-brand-elevated border border-brand-border/70 rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-2 uppercase tracking-wide">
              Preamp Settings
            </label>
            <input
              type="text"
              value={selectedSession?.calibration?.preampSettings || ''}
              onChange={(e) => updateCalibration({ preampSettings: e.target.value })}
              placeholder="Gain, filter, pad settings"
              className="w-full px-3 py-2 bg-brand-elevated border border-brand-border/70 rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-2 uppercase tracking-wide">
              Noise Floor
              <span className="ml-2 text-brand-primary">
                {selectedSession?.calibration?.noiseFloor || -60} dB
              </span>
            </label>
            <input
              type="range"
              min="-80"
              max="-40"
              step="1"
              value={selectedSession?.calibration?.noiseFloor || -60}
              onChange={(e) => updateCalibration({ noiseFloor: parseInt(e.target.value) })}
              className="w-full accent-brand-primary"
            />
          </div>

          <button
            onClick={() => updateCalibration({ calibrationDate: new Date() })}
            className="inline-flex items-center px-4 py-2 bg-brand-primary/90 hover:bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <span className="mr-2">⟳</span>
            <span>Update Calibration Timestamp</span>
          </button>

          {selectedSession?.calibration?.calibrationDate && (
            <div className="text-xs text-brand-text-muted">
              Last calibrated:{' '}
              {new Date(selectedSession.calibration.calibrationDate).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render recording interface
  const renderRecording = () => (
    <div className="space-y-6">
      <div className="bg-brand-surface/95 rounded-xl p-6 border border-brand-border shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Recording Controls</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-brand-text">
                {isRecording ? '🔴 Recording' : '⏸️ Standby'}
              </div>
              <div className="text-xs text-brand-text-muted mt-1">
                Take #{currentTakeNumber}
              </div>
            </div>
            
            <button
              onClick={toggleRecording}
              className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-brand-primary/90 hover:bg-brand-primary'
              } text-white`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
              <div className="text-xs text-brand-text-muted uppercase">Total Duration</div>
              <div className="text-xl font-semibold text-brand-text mt-1">
                {Math.floor((selectedSession?.totalDuration || 0) / 60)}:{((selectedSession?.totalDuration || 0) % 60).toString().padStart(2, '0')}
              </div>
            </div>
            
            <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
              <div className="text-xs text-brand-text-muted uppercase">Completion</div>
              <div className="text-xl font-semibold text-brand-primary mt-1">
                {selectedSession?.completionPercentage || 0}%
              </div>
            </div>
            
            <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
              <div className="text-xs text-brand-text-muted uppercase">Total Takes</div>
              <div className="text-xl font-semibold text-brand-text mt-1">
                {selectedSession?.recordings.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-surface/95 rounded-xl p-6 border border-brand-border shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Punch & Roll Markers</h3>
        
        <button
          onClick={() => addPunchAndRollMarker(Date.now(), 'Pronunciation correction needed')}
          className="mb-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-brand-bg rounded-lg text-sm font-medium shadow-sm"
        >
          Add Punch & Roll Marker
        </button>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {punchAndRollMarkers.map((marker, idx) => (
            <div key={idx} className="bg-brand-elevated rounded-lg p-3 flex justify-between items-center border border-brand-border/40">
              <div>
                <div className="text-xs text-brand-text">
                  Timestamp: {new Date(marker.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-[10px] text-brand-text-muted">{marker.reason}</div>
              </div>
              <button
                onClick={() => {
                  setPunchAndRollMarkers(prev => 
                    prev.map((m, i) => i === idx ? { ...m, resolved: !m.resolved } : m)
                  );
                }}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  marker.resolved
                    ? 'bg-emerald-500 text-brand-bg'
                    : 'bg-brand-surface text-brand-text-muted hover:bg-brand-elevated'
                }`}
              >
                {marker.resolved ? '✓ Resolved' : 'Resolve'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render takes management
  const renderTakes = () => (
    <div className="space-y-6">
      <div className="bg-brand-surface/95 rounded-xl p-6 border border-brand-border shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Recording Takes</h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {selectedSession?.recordings.map((take) => (
            <div key={take.id} className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-brand-text">
                      Take #{take.takeNumber}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                      take.quality === 'final' ? 'bg-emerald-500/90 text-brand-bg' :
                      take.quality === 'good' ? 'bg-brand-primary/85 text-brand-bg' :
                      'bg-brand-surface text-brand-text-muted border border-brand-border/40'
                    }`}>
                      {take.quality}
                    </div>
                  </div>
                  <div className="text-[10px] text-brand-text-muted mt-1">
                    Duration: {take.duration}s | {new Date(take.timestamp).toLocaleString()}
                  </div>
                  {take.notes && (
                    <div className="text-xs text-brand-text mt-2 italic">
                      {take.notes}
                    </div>
                  )}
                  {take.retakesNeeded && take.retakesNeeded.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] text-amber-400 font-semibold uppercase">
                        Retakes needed
                      </div>
                      <ul className="text-[10px] text-brand-text-muted mt-1 list-disc list-inside">
                        {take.retakesNeeded.map((retake, idx) => (
                          <li key={idx}>{retake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    value={take.quality}
                    onChange={(e) => {
                      const updated = selectedSession.recordings.map(t =>
                        t.id === take.id ? { ...t, quality: e.target.value as 'draft' | 'good' | 'final' } : t
                      );
                      onUpdateSession(selectedSession.id, { recordings: updated });
                    }}
                    className="px-2 py-1 bg-brand-surface border border-brand-border/60 rounded text-brand-text text-[10px] focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  >
                    <option value="draft">Draft</option>
                    <option value="good">Good</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {(!selectedSession?.recordings || selectedSession.recordings.length === 0) && (
            <div className="text-center text-brand-text-muted py-8 text-sm">
              No takes recorded yet. Start recording to create takes.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render quality monitoring
  const renderQuality = () => (
    <div className="space-y-6">
      <div className="bg-brand-surface/95 rounded-xl p-6 border border-brand-border shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Session Quality Metrics</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
            <div className="text-xs text-brand-text-muted uppercase">Session Type</div>
            <div className="text-xl font-semibold text-brand-text capitalize mt-1">
              {selectedSession?.sessionType || 'N/A'}
            </div>
          </div>

          <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
            <div className="text-xs text-brand-text-muted uppercase">Status</div>
            <div className={`text-xl font-semibold mt-1 ${
              selectedSession?.status === 'completed' ? 'text-emerald-400' :
              selectedSession?.status === 'in-progress' ? 'text-brand-primary' :
              selectedSession?.status === 'review-needed' ? 'text-amber-400' :
              'text-brand-text-muted'
            }`}>
              {selectedSession?.status || 'N/A'}
            </div>
          </div>

          {selectedSession?.calibration && (
            <>
              <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
                <div className="text-xs text-brand-text-muted uppercase">Noise Floor</div>
                <div className="text-xl font-semibold text-brand-text mt-1">
                  {selectedSession.calibration.noiseFloor} dB
                </div>
              </div>

              <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
                <div className="text-xs text-brand-text-muted uppercase">Microphone</div>
                <div className="text-sm font-medium text-brand-text mt-1">
                  {selectedSession.calibration.micType || 'Not set'}
                </div>
              </div>
            </>
          )}

          <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
            <div className="text-xs text-brand-text-muted uppercase">Total Takes</div>
            <div className="text-xl font-semibold text-brand-text mt-1">
              {selectedSession?.recordings.length || 0}
            </div>
          </div>

          <div className="bg-brand-elevated rounded-lg p-4 border border-brand-border/40">
            <div className="text-xs text-brand-text-muted uppercase">Final Quality Takes</div>
            <div className="text-xl font-semibold text-emerald-400 mt-1">
              {selectedSession?.recordings.filter(r => r.quality === 'final').length || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-surface/95 rounded-xl p-6 border border-brand-border shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Recording Statistics</h3>
        
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-brand-text-muted">Average Take Duration</span>
            <span className="text-brand-text font-medium">
              {selectedSession?.recordings.length 
                ? (selectedSession.recordings.reduce((sum, r) => sum + r.duration, 0) / selectedSession.recordings.length).toFixed(1)
                : 0}s
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-text-muted">Draft Takes</span>
            <span className="text-brand-text-muted font-medium">
              {selectedSession?.recordings.filter(r => r.quality === 'draft').length || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-text-muted">Good Takes</span>
            <span className="text-brand-primary font-medium">
              {selectedSession?.recordings.filter(r => r.quality === 'good').length || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-brand-text-muted">Final Takes</span>
            <span className="text-emerald-400 font-medium">
              {selectedSession?.recordings.filter(r => r.quality === 'final').length || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex bg-brand-bg text-brand-text">
      {/* Sessions List */}
      <div className="w-80 border-r border-brand-border/80 bg-brand-surface/98 backdrop-blur-sm overflow-y-auto">
        <div className="p-4 border-b border-brand-border/80">
          <button
            onClick={addRecordingSession}
            className="w-full px-4 py-2 bg-brand-primary/95 hover:bg-brand-primary text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
          >
            <span className="text-lg leading-none">＋</span>
            <span>New Session</span>
          </button>
        </div>

        <div className="p-2 space-y-2">
          {sessions.map((session) => {
            const isActive = selectedSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-brand-primary/12 border-brand-primary/60 text-brand-primary shadow-sm'
                    : 'bg-brand-surface border-brand-border/40 text-brand-text-secondary hover:bg-brand-elevated hover:text-brand-primary'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="text-xs font-semibold">
                    Session {session.id.substring(0, 8)}
                  </div>
                  <div className="text-[9px] text-brand-text-muted">
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-1 text-[10px]">
                  {session.status === 'scheduled' && '📅 Scheduled'}
                  {session.status === 'in-progress' && '🎙️ In Progress'}
                  {session.status === 'completed' && '✓ Completed'}
                  {session.status === 'review-needed' && '⚠️ Needs Review'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedSession ? (
          <div className="p-6 space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-brand-text">
                  Recording Session
                </div>
                <div className="text-[10px] text-brand-text-muted mt-1">
                  {new Date(selectedSession.sessionDate).toLocaleString()} •{' '}
                  <span className="uppercase tracking-wide">
                    {selectedSession.sessionType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-brand-text-muted">
                <div className="px-2 py-1 rounded-full bg-brand-surface/80 border border-brand-border/60">
                  Takes: {selectedSession.recordings.length || 0}
                </div>
                <div className="px-2 py-1 rounded-full bg-brand-surface/80 border border-brand-border/60">
                  Completion: {selectedSession.completionPercentage || 0}%
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { key: 'calibration', label: '🎚️ Calibration' },
                { key: 'recording', label: '🎙️ Recording' },
                { key: 'takes', label: '📝 Takes' },
                { key: 'quality', label: '📊 Quality' }
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-colors ${
                      isActive
                        ? 'bg-brand-primary/12 text-brand-primary border-brand-primary/60 shadow-sm'
                        : 'bg-transparent text-brand-text-muted border-brand-border/40 hover:bg-brand-surface hover:text-brand-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="pt-2">
              {activeTab === 'calibration' && renderCalibration()}
              {activeTab === 'recording' && renderRecording()}
              {activeTab === 'takes' && renderTakes()}
              {activeTab === 'quality' && renderQuality()}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-brand-text-muted text-sm">
            Select or create a recording session
          </div>
        )}
      </div>
    </div>
  );
};