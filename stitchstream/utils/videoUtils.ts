import { VideoClip } from "../types";

export const generateThumbnailAndDuration = async (file: File): Promise<{ thumbnail: string; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      // Seek to 1 second or 25% to get a representative frame
      video.currentTime = Math.min(1.0, video.duration * 0.25);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      // Scale down for thumbnail to save memory
      const scale = 0.5; 
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ thumbnail, duration: video.duration });
      } else {
        reject(new Error("Canvas context error"));
      }
      
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onerror = () => {
      reject(new Error("Error loading video"));
      URL.revokeObjectURL(url);
    };
  });
};

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
