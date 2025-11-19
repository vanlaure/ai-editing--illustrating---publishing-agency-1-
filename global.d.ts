interface AIStudioWindow {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

interface Window {
  aistudio?: AIStudioWindow;
}

declare module '*?url' {
  const src: string;
  export default src;
}

declare module '@ffmpeg/core?url' {
  const src: string;
  export default src;
}

declare module '@ffmpeg/core/wasm?url' {
  const src: string;
  export default src;
}
