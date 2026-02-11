import React from 'react';
import { VideoClip } from '../types';
import { formatDuration } from '../utils/videoUtils';

interface TimelineProps {
  clips: VideoClip[];
  onRemoveClip: (id: string) => void;
  onReorderClips: (startIndex: number, endIndex: number) => void;
  onPlayClip: (id: string) => void;
  activeClipId?: string;
}

const Timeline: React.FC<TimelineProps> = ({ clips, onRemoveClip, onReorderClips, onPlayClip, activeClipId }) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Simple visual feedback could go here, but for now we just handle drop
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    onReorderClips(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  if (clips.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Timeline</h3>
        <span className="text-xs text-slate-500">{clips.length} Clips | {formatDuration(clips.reduce((acc, c) => acc + c.duration, 0))} Total</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              relative flex-shrink-0 w-40 bg-slate-800 rounded-lg overflow-hidden border-2 cursor-pointer transition-all snap-start group
              ${activeClipId === clip.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-slate-600'}
              ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
            `}
            onClick={() => onPlayClip(clip.id)}
          >
            <div className="aspect-video relative bg-black">
              <img src={clip.thumbnail} alt={clip.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                {formatDuration(clip.duration)}
              </div>
              
              {/* Overlay Play Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                 <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M8 5v14l11-7z" />
                 </svg>
              </div>
            </div>

            <div className="p-2">
              <p className="text-xs text-white truncate font-medium" title={clip.name}>{clip.name}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">#{index + 1}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveClip(clip.id);
                  }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;

