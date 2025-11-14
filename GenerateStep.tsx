import React, { useState, useEffect } from 'react';
import { Storyboard } from './types';
import { webSocketService } from './services/webSocketService';

interface GenerateStepProps {
  storyboard: Storyboard;
  onGenerateClip: (shotId: string, quality: 'draft' | 'high') => void;
  isProcessing: boolean;
}

const GenerateStep: React.FC<GenerateStepProps> = ({ 
  storyboard, 
  onGenerateClip, 
  isProcessing 
}) => {
  const [shotProgress, setShotProgress] = useState<Record<string, number>>({});

  // Listen for WebSocket video generation events
  useEffect(() => {
    const handleVideoGenerated = (data: any) => {
      console.log('🎬 Video generated via WebSocket:', data);
      
      const shotId = data.id || data.shotId;
      if (shotId) {
        // Mark this shot as 100% complete
        setShotProgress(prev => ({
          ...prev,
          [shotId]: 100
        }));
      }
    };

    // Subscribe to all video generation events
    webSocketService.on('video_generated', handleVideoGenerated);

    return () => {
      webSocketService.off('video_generated', handleVideoGenerated);
    };
  }, []);

  const handleGenerateClip = (shotId: string, quality: 'draft' | 'high') => {
    console.log(`Starting clip generation for shot ${shotId} (${quality})`);
    
    // Set initial progress
    setShotProgress(prev => ({
      ...prev,
      [shotId]: 0
    }));
    
    onGenerateClip(shotId, quality);
  };

  const allShots = storyboard.scenes.flatMap(scene => scene.shots);
  const completedShots = allShots.filter(shot => shot.clip_url).length;
  const overallProgress = allShots.length > 0 ? (completedShots / allShots.length) * 100 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Video Generation Progress</h2>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400">
            Generated {completedShots} of {allShots.length} clips
          </p>
          <p className="text-brand-cyan font-bold">
            {Math.round(overallProgress)}% Complete
          </p>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-brand-cyan h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allShots.map(shot => {
          const progress = shotProgress[shot.id] || shot.generation_progress || (shot.clip_url ? 100 : 0);
          const isGenerating = shot.is_generating_clip || (progress > 0 && progress < 100);

          return (
            <div key={shot.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">
                  Shot {shot.shot_number}
                </h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  isGenerating 
                    ? 'bg-yellow-600 text-yellow-100' 
                    : shot.clip_url 
                      ? 'bg-green-600 text-green-100'
                      : 'bg-gray-600 text-gray-300'
                }`}>
                  {isGenerating ? 'Generating' : shot.clip_url ? 'Complete' : 'Ready'}
                </span>
              </div>

              {shot.image_url && (
                <div className="w-full h-32 bg-gray-700 rounded mb-3 overflow-hidden">
                  <img 
                    src={shot.image_url} 
                    alt={`Shot ${shot.shot_number}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">
                    {isGenerating ? 'Generating clip...' : shot.clip_url ? 'Video ready' : 'Ready to generate'}
                  </span>
                  <span className="text-brand-cyan font-bold">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isGenerating ? 'bg-yellow-500' : shot.clip_url ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {!shot.clip_url && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateClip(shot.id, 'draft')}
                    disabled={isGenerating || isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Generate Draft
                  </button>
                  <button
                    onClick={() => handleGenerateClip(shot.id, 'high')}
                    disabled={isGenerating || isProcessing}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Generate HD
                  </button>
                </div>
              )}

              {shot.clip_url && (
                <div className="mt-3">
                  <video 
                    src={shot.clip_url} 
                    controls 
                    className="w-full rounded"
                    poster={shot.image_url}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerateStep;