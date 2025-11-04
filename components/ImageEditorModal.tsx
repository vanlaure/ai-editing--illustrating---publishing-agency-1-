import React, { useState, useEffect, useRef } from 'react';
import type { StoryboardShot } from '../types';
import Spinner from './Spinner';

interface ImageEditorModalProps {
  shot: StoryboardShot;
  onClose: () => void;
  onSave: (prompt: string) => Promise<void>;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ shot, onClose, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.crossOrigin = 'anonymous'; // Required for tainted canvases
    image.src = shot.preview_image_url;
    
    image.onload = () => {
        // Set canvas dimensions to match image
        const aspectRatio = image.width / image.height;
        const canvasWidth = Math.min(image.width, 800);
        const canvasHeight = canvasWidth / aspectRatio;
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw the background image
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
    };

    // This second canvas is for the mask overlay
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    maskCanvas.style.position = 'absolute';
    maskCanvas.style.top = '0';
    maskCanvas.style.left = '0';
    maskCanvas.style.pointerEvents = 'auto';
    canvas.parentElement?.appendChild(maskCanvas);

    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
        maskCtx.strokeStyle = 'rgba(255, 0, 122, 0.7)';
        maskCtx.lineWidth = 20;
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';
        contextRef.current = maskCtx;
    }
    
    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    maskCanvas.addEventListener('mousedown', startDrawing as any);
    maskCanvas.addEventListener('mouseup', finishDrawing);
    maskCanvas.addEventListener('mousemove', draw as any);
    maskCanvas.addEventListener('mouseleave', finishDrawing);

    return () => {
        maskCanvas.removeEventListener('mousedown', startDrawing as any);
        maskCanvas.removeEventListener('mouseup', finishDrawing);
        maskCanvas.removeEventListener('mousemove', draw as any);
        maskCanvas.removeEventListener('mouseleave', finishDrawing);
        if(maskCanvas.parentElement) {
            maskCanvas.parentElement.removeChild(maskCanvas);
        }
    }

  }, [shot.preview_image_url]);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || isSaving) return;
    setIsSaving(true);
    await onSave(prompt);
    setIsSaving(false);
  };
  
  const handleClearMask = () => {
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-brand-gray p-8 rounded-xl shadow-2xl shadow-black/30 border border-brand-light-gray/20 w-full max-w-4xl m-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">AI Image Editor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative w-full aspect-video mx-auto mb-4 bg-brand-dark rounded-lg overflow-hidden cursor-crosshair">
            <canvas ref={canvasRef} />
        </div>
        
        <div className="text-center mb-4">
            <button onClick={handleClearMask} className="text-sm text-brand-cyan hover:underline">Clear Mask</button>
            <p className="text-xs text-gray-500 mt-1">Draw a mask over the area you want to change. The AI will use your prompt to edit the image.</p>
        </div>


        <form onSubmit={handleSave}>
            <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., Add a futuristic motorcycle in the masked area"
                rows={2}
                className="w-full bg-brand-light-gray border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition"
                required
            />
            <div className="mt-6 flex justify-end space-x-4">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="bg-brand-dark border border-gray-600 hover:border-brand-light-gray text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    disabled={isSaving || !prompt}
                    className="flex items-center justify-center bg-brand-cyan text-brand-dark font-bold py-2 px-6 rounded-lg hover:bg-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                >
                    {isSaving ? <><Spinner /> Generating...</> : 'Generate & Save'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ImageEditorModal;