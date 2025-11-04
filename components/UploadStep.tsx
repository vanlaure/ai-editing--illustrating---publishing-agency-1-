

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Spinner from './Spinner';

interface UploadStepProps {
  onSubmit: (file: File, data: { lyrics: string; title?: string; artist?: string; singerGender: 'male' | 'female' | 'unspecified', bpm?: number, modelTier: 'freemium' | 'premium' }) => void;
  isProcessing: boolean;
  onLoadProductionFile: (file: File) => void;
  onModelTierChange?: (tier: 'freemium' | 'premium') => void;
}

const UploadIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const JsonIcon = () => (
    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13l-1 2 1 2m4-4l1 2-1 2" />
    </svg>
);

const UploadStep: React.FC<UploadStepProps> = ({ onSubmit, isProcessing, onLoadProductionFile, onModelTierChange }) => {
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [singerGender, setSingerGender] = useState<'male' | 'female' | 'unspecified'>('unspecified');
  const [bpm, setBpm] = useState<string>('');
  const [modelTier, setModelTier] = useState<'freemium' | 'premium'>('freemium');


  useEffect(() => {
      if (audioFile) {
          const objectUrl = URL.createObjectURL(audioFile);
          setAudioSrc(objectUrl);
          return () => {
              URL.revokeObjectURL(objectUrl);
              setAudioSrc(null);
          };
      } else {
          setAudioSrc(null);
      }
  }, [audioFile]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
        setError('File is not a valid audio file. Supported: MP3, WAV, AAC, FLAC.');
        return;
    }
    if (acceptedFiles && acceptedFiles.length > 0) {
      setAudioFile(acceptedFiles[0]);
    }
  }, []);

    // Cast to `any` to satisfy DropzoneOptions typing differences across versions
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/mpeg': ['.mp3'],
            'audio/wav': ['.wav'],
            'audio/x-wav': ['.wav'],
            'audio/aac': ['.aac'],
            'audio/flac': ['.flac'],
        },
        multiple: false,
    } as any);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
        setError("Please upload an audio file.");
        return;
    }
    if (!lyrics) {
        setError("Please provide lyrics for the song.");
        return;
    }
    if (singerGender === 'unspecified') {
        setError("Please specify the singer's gender.");
        return;
    }
    onSubmit(audioFile, { lyrics, title, artist, singerGender, bpm: bpm ? parseInt(bpm) : undefined, modelTier });
  };
  
  const onJsonDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
        onLoadProductionFile(acceptedFiles[0]);
    }
  }, [onLoadProductionFile]);

    // Cast to `any` to satisfy DropzoneOptions typing differences across versions
    const { getRootProps: getJsonRootProps, getInputProps: getJsonInputProps, isDragActive: isJsonDragActive } = useDropzone({
        onDrop: onJsonDrop,
        accept: {
                'application/json': ['.json'],
        },
        multiple: false,
    } as any);


  if (isProcessing) {
      return (
          <div className="flex flex-col items-center min-h-[400px] justify-center">
            <Spinner />
            <p className="mt-4 text-lg font-semibold">Analyzing your song...</p>
            <p className="text-sm text-gray-400">This may take a moment. The AI is listening to the structure, mood, and lyrics.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-2 text-white">Let's Make a Music Video</h2>
      <p className="text-gray-400 mb-8">Start a new project by uploading your song, or load a previous production file.</p>
      
      <form onSubmit={handleFormSubmit} className="w-full max-w-3xl">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <h3 className="text-lg font-semibold mb-3 text-brand-cyan">1. Upload Audio</h3>
                <div {...getRootProps()} className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-cyan bg-brand-cyan/10' : 'border-brand-light-gray hover:border-brand-cyan'}`}>
                    <input {...getInputProps()} />
                    {audioFile ? (
                        <div>
                            <p className="mt-4 text-lg font-semibold text-white truncate">{audioFile.name}</p>
                            <p className="text-sm text-gray-400">File selected. Click or drag to replace.</p>
                        </div>
                    ) : (
                        <div>
                            <UploadIcon />
                            <p className="mt-4 text-lg font-semibold text-white">Drag & Drop audio</p>
                            <p className="text-sm text-gray-400">or click to select</p>
                        </div>
                    )}
                </div>
                {audioSrc && (
                    <div className="mt-4">
                        <audio src={audioSrc} controls className="w-full rounded-lg"></audio>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">Supported: MP3, WAV, AAC, FLAC</p>
            </div>
            
            <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-3 text-brand-cyan">2. Provide Details</h3>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="lyrics" className="block text-sm font-medium text-gray-300 mb-1">Lyrics <span className="text-brand-magenta">*</span></label>
                        <textarea id="lyrics" value={lyrics} onChange={e => setLyrics(e.target.value)} rows={8} placeholder="Paste your song lyrics here..." className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" required />
                    </div>
                     <div>
                        <label htmlFor="singer-gender" className="block text-sm font-medium text-gray-300 mb-1">Singer's Gender <span className="text-brand-magenta">*</span></label>
                        <select id="singer-gender" value={singerGender} onChange={e => setSingerGender(e.target.value as any)} className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" required>
                            <option value="unspecified" disabled>Select...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>
            </div>
         </div>
         
         <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-brand-cyan">3. Optional Info</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Song Title</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Neon Dreams" className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" />
                 </div>
                 <div>
                    <label htmlFor="artist" className="block text-sm font-medium text-gray-300 mb-1">Artist Name</label>
                    <input id="artist" type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="e.g., The Virtuals" className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" />
                 </div>
                 <div>
                    <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-1">BPM (Tempo)</label>
                    <input id="bpm" type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="e.g., 120" className="w-full bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition" />
                 </div>
            </div>
         </div>

         <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-brand-cyan">4. Select Model Quality</h3>
            <div className="flex bg-brand-dark p-1 rounded-lg border border-gray-600">
                <button
                    type="button"
                    onClick={() => {
                        setModelTier('freemium');
                        onModelTierChange?.('freemium');
                    }}
                    className={`w-1/2 px-4 py-3 rounded-md font-semibold transition-colors text-center ${modelTier === 'freemium' ? 'bg-brand-cyan text-brand-dark' : 'text-gray-300 hover:bg-brand-light-gray'}`}
                >
                    <p className="font-bold">Freemium</p>
                    <p className="text-xs font-normal">Fast & Good Quality</p>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setModelTier('premium');
                        onModelTierChange?.('premium');
                    }}
                    className={`w-1/2 px-4 py-3 rounded-md font-semibold transition-colors text-center ${modelTier === 'premium' ? 'bg-brand-magenta text-white' : 'text-gray-300 hover:bg-brand-light-gray'}`}
                >
                    <p className="font-bold">Premium</p>
                    <p className="text-xs font-normal">Highest Quality & Slower</p>
                </button>
            </div>
        </div>


         {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
         
         <div className="mt-8 text-center">
            <button type="submit" className="bg-brand-cyan text-brand-dark font-bold py-3 px-10 rounded-lg hover:bg-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessing || !audioFile || !lyrics || singerGender === 'unspecified'}>
                {isProcessing ? <Spinner/> : 'Start Analysis &raquo;'}
            </button>
         </div>
      </form>

        <div className="my-8 flex items-center w-full max-w-3xl">
            <div className="flex-grow border-t border-brand-light-gray"></div>
            <span className="flex-shrink mx-4 text-gray-400 font-semibold">OR</span>
            <div className="flex-grow border-t border-brand-light-gray"></div>
        </div>
      
        <div className="w-full max-w-3xl">
            <h3 className="text-lg font-semibold mb-3 text-center text-brand-cyan">Load Existing Project</h3>
            <div {...getJsonRootProps()} className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isJsonDragActive ? 'border-brand-cyan bg-brand-cyan/10' : 'border-brand-light-gray hover:border-brand-cyan'}`}>
                <input {...getJsonInputProps()} />
                <JsonIcon />
                <p className="mt-4 text-lg font-semibold text-white">Drag & Drop Production File</p>
                <p className="text-sm text-gray-400">or click to select a .json file</p>
            </div>
        </div>

    </div>
  );
};

export default UploadStep;