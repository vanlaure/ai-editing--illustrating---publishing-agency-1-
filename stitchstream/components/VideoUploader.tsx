import React, { useRef, useState } from 'react';
import { generateThumbnailAndDuration } from '../utils/videoUtils';
import { VideoClip } from '../types';

// Simple UUID generator since we can't install 'uuid'
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface VideoUploaderProps {
  onClipsAdded: (clips: VideoClip[]) => void;
  isProcessing: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onClipsAdded, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | null) => {
    if (!files) return;

    const newClips: VideoClip[] = [];
    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));

    for (const file of videoFiles) {
      try {
        const { thumbnail, duration } = await generateThumbnailAndDuration(file);
        newClips.push({
          id: generateId(),
          file,
          url: URL.createObjectURL(file),
          thumbnail,
          duration,
          name: file.name
        });
      } catch (error) {
        console.error("Failed to process file", file.name, error);
      }
    }

    if (newClips.length > 0) {
      onClipsAdded(newClips);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    await processFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
    // Reset value so same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        multiple
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full bg-slate-800 group-hover:bg-blue-600 transition-colors`}>
          <svg className="w-8 h-8 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Upload Video Clips</h3>
          <p className="text-sm text-slate-400 mt-1">Drag & drop or click to browse</p>
        </div>
        <p className="text-xs text-slate-500">Supports MP4, WebM, MOV</p>
      </div>
    </div>
  );
};

export default VideoUploader;
